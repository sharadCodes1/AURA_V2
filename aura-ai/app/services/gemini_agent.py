"""
Gemini-backed conversational agent.

Given a transcript, Gemini decides one of three things:
  1. It's an OS command  -> calls the matching function -> we return an ActionPayload.
  2. It needs live data   -> calls `web_search` -> we make a second, Google-Search-grounded
     Gemini call and speak the answer (weather, cricket scores, news, prices, ...).
  3. It's conversation    -> Gemini just replies in text -> we speak it (CONVERSE).

If the Gemini SDK isn't installed or no API key is configured, `available` is False and
the caller falls back to the offline rule-based matcher — so the app still does basic
commands without a key or network.

Function calling and Google Search grounding can't be combined in one request, so we
split them: the first call (with the OS-action tools) routes live-data questions to
`web_search`, and the second call does the grounded lookup with no other tools.
"""
import logging
from typing import Optional

from app.config import settings
from app.schemas.action_payload import ActionPayload, ActionType, converse_action, unknown_action

logger = logging.getLogger("aura.gemini")

PERSONA = (
    "You are AURA, the personal voice assistant for {name}. "
    "Talk like a knowledgeable, level-headed adult man — natural, warm, and concise. "
    "You can both have a conversation and control {name}'s computer.\n\n"
    "Rules:\n"
    "- When {name} asks you to DO something on the computer (open or close an app, type "
    "text, click, scroll, or a system control like volume/mute/lock/sleep/screenshot), "
    "call the matching function. Do not also chat about it.\n"
    "- When he asks about real-world info you can't be sure of (weather, sports scores "
    "like cricket, news, prices, today's date or current events), call web_search with a "
    "concise query.\n"
    "- Otherwise (greetings, small talk, general knowledge you already know, opinions), "
    "just reply directly. Your reply is spoken aloud, so keep it to 1–3 short sentences. "
    "Use his name, {name}, occasionally — not in every sentence."
)

# Confirmation lines spoken back for each OS action.
def _confirm(action: ActionType, target: str) -> str:
    target = target.strip()
    return {
        ActionType.OPEN_APP: f"Opening {target}." if target else "Which app?",
        ActionType.CLOSE_APP: f"Closing {target}." if target else "Which app?",
        ActionType.TYPE_TEXT: "Typing that." if target else "Type what?",
        ActionType.CLICK: ("Clicking " + target).strip() + ".",
        ActionType.SCROLL: f"Scrolling {target or 'down'}.",
        ActionType.SYSTEM_CONTROL: f"{(target or 'done').capitalize()}.",
    }.get(action, "Done.")


class GeminiAgent:
    def __init__(self):
        self._client = None

    @property
    def available(self) -> bool:
        if not settings.gemini_api_key:
            return False
        try:
            import google.genai  # noqa: F401
            return True
        except ImportError:
            return False

    def _client_and_types(self):
        from google import genai
        from google.genai import types

        if self._client is None:
            self._client = genai.Client(api_key=settings.gemini_api_key)
        return self._client, types

    def _tools(self, types):
        """OS-action function declarations + a web_search escape hatch."""
        S = types.Schema
        T = types.Type

        def obj(props, required):
            return S(type=T.OBJECT, properties=props, required=required)

        fns = [
            types.FunctionDeclaration(
                name="open_app",
                description="Open or launch an application.",
                parameters=obj({"target": S(type=T.STRING, description="App name, e.g. chrome, spotify, vscode")}, ["target"]),
            ),
            types.FunctionDeclaration(
                name="close_app",
                description="Quit or close an application.",
                parameters=obj({"target": S(type=T.STRING, description="App name")}, ["target"]),
            ),
            types.FunctionDeclaration(
                name="type_text",
                description="Type the given text on the keyboard.",
                parameters=obj({"text": S(type=T.STRING, description="The text to type")}, ["text"]),
            ),
            types.FunctionDeclaration(
                name="click",
                description="Perform a mouse click, optionally on a named target.",
                parameters=obj({"target": S(type=T.STRING, description="Optional UI target")}, []),
            ),
            types.FunctionDeclaration(
                name="scroll",
                description="Scroll the screen.",
                parameters=obj({"direction": S(type=T.STRING, description="up, down, left, or right")}, ["direction"]),
            ),
            types.FunctionDeclaration(
                name="system_control",
                description="Control the system: volume, mute, brightness, lock, sleep, shutdown, restart, screenshot.",
                parameters=obj(
                    {
                        "control": S(type=T.STRING, description="e.g. volume, mute, lock, sleep, screenshot"),
                        "direction": S(type=T.STRING, description="up or down (for volume/brightness)"),
                    },
                    ["control"],
                ),
            ),
            types.FunctionDeclaration(
                name="web_search",
                description="Look up current real-world information (weather, sports scores, news, prices, today's events).",
                parameters=obj({"query": S(type=T.STRING, description="A concise search query")}, ["query"]),
            ),
        ]
        return [types.Tool(function_declarations=fns)]

    async def resolve(self, transcript: str) -> ActionPayload:
        """Resolve a transcript into an ActionPayload using Gemini."""
        import asyncio

        try:
            return await asyncio.to_thread(self._resolve_sync, transcript)
        except Exception as exc:  # network, quota, SDK issues — degrade gracefully
            logger.warning("Gemini resolve failed (%s); falling back to rules.", exc)
            from app.services.rule_fallback import resolve_with_rules

            return resolve_with_rules(transcript)

    def _resolve_sync(self, transcript: str) -> ActionPayload:
        client, types = self._client_and_types()
        persona = PERSONA.format(name=settings.user_name)

        resp = client.models.generate_content(
            model=settings.gemini_model,
            contents=transcript,
            config=types.GenerateContentConfig(
                system_instruction=persona,
                temperature=0.6,
                tools=self._tools(types),
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            ),
        )

        calls = resp.function_calls or []
        if calls:
            call = calls[0]
            args = dict(call.args or {})
            if call.name == "web_search":
                answer = self._grounded_answer(client, types, args.get("query", transcript))
                return converse_action(answer)
            return self._action_from_call(call.name, args)

        text = (resp.text or "").strip()
        if text:
            return converse_action(text)
        return unknown_action("Sorry, I didn't catch that.")

    def _action_from_call(self, name: str, args: dict) -> ActionPayload:
        try:
            action = ActionType(name)
        except ValueError:
            return unknown_action()
        target = (
            args.get("target")
            or args.get("text")
            or args.get("direction")
            or args.get("control")
            or ""
        )
        return ActionPayload(
            action=action,
            target=str(target),
            params=args,
            confidence=0.95,
            spoken_response=_confirm(action, str(target)),
        )

    def _grounded_answer(self, client, types, query: str) -> str:
        """Second call: Google-Search-grounded answer, no other tools."""
        if not settings.gemini_grounding:
            return "I can't look that up right now."
        try:
            resp = client.models.generate_content(
                model=settings.gemini_model,
                contents=query,
                config=types.GenerateContentConfig(
                    system_instruction=(
                        f"You are AURA, speaking to {settings.user_name}. Answer in 1–2 short "
                        "sentences suitable for reading aloud. Be specific and current."
                    ),
                    temperature=0.3,
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                ),
            )
            return (resp.text or "").strip() or "I couldn't find anything on that."
        except Exception as exc:  # pragma: no cover - network dependent
            logger.warning("Gemini grounded lookup failed: %s", exc)
            return "I couldn't look that up just now."


gemini_agent = GeminiAgent()
