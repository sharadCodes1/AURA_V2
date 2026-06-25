"""
Resolver node: turn an intent (or a matched macro) into a concrete ActionPayload
plus a spoken response. This is the single place that produces the shared contract.
"""
from app.graph.state import VoiceState
from app.schemas.action_payload import ActionPayload, ActionType, unknown_action


def _resolve_macro(macro: dict) -> ActionPayload:
    steps = []
    for raw in macro.get("actions", []):
        try:
            steps.append(ActionPayload(**raw))
        except Exception:
            # Skip malformed steps rather than failing the whole macro.
            continue
    phrase = macro.get("trigger_phrase", "macro")
    return ActionPayload(
        action=ActionType.RUN_MACRO,
        target=phrase,
        confidence=1.0,
        spoken_response=f"Running {phrase}",
        steps=steps,
    )


def _resolve_intent(intent: str, entities: dict) -> ActionPayload:
    if intent == ActionType.OPEN_APP.value:
        app = entities.get("app", "")
        return ActionPayload(action=ActionType.OPEN_APP, target=app, confidence=0.9,
                             spoken_response=f"Opening {app}" if app else "Which app?")

    if intent == ActionType.CLOSE_APP.value:
        app = entities.get("app", "")
        return ActionPayload(action=ActionType.CLOSE_APP, target=app, confidence=0.9,
                             spoken_response=f"Closing {app}" if app else "Which app?")

    if intent == ActionType.TYPE_TEXT.value:
        text = entities.get("text", "")
        return ActionPayload(action=ActionType.TYPE_TEXT, target=text, confidence=0.9,
                             spoken_response="Typing" if text else "Type what?")

    if intent == ActionType.SCROLL.value:
        direction = entities.get("direction", "down")
        return ActionPayload(action=ActionType.SCROLL, target=direction,
                             params={"direction": direction}, confidence=0.85,
                             spoken_response=f"Scrolling {direction}")

    if intent == ActionType.CLICK.value:
        target = entities.get("target", "")
        return ActionPayload(action=ActionType.CLICK, target=target, confidence=0.7,
                             spoken_response="Clicking" + (f" {target}" if target else ""))

    if intent == ActionType.SYSTEM_CONTROL.value:
        control = entities.get("control", "")
        return ActionPayload(action=ActionType.SYSTEM_CONTROL, target=control,
                             params=dict(entities), confidence=0.85,
                             spoken_response=f"{control.capitalize()}")

    return unknown_action()


def resolver_node(state: VoiceState) -> VoiceState:
    if state.get("is_macro") and state.get("matched_macro"):
        payload = _resolve_macro(state["matched_macro"])
    else:
        payload = _resolve_intent(state.get("intent", ""), state.get("entities", {}))

    status = "ambiguous" if payload.action == ActionType.UNKNOWN else "success"
    return {
        "action_payload": payload.model_dump(),
        "response_text": payload.spoken_response,
        "status": status,
    }
