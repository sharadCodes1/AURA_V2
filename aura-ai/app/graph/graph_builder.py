"""
Wires the nodes into a LangGraph StateGraph.

Flow:
    START -> stt -> macro_lookup --(is_macro=True)--> resolver -> tts -> END
                                  --(is_macro=False)-> intent -> resolver -> tts -> END
"""
from functools import lru_cache

from langgraph.graph import END, START, StateGraph

from app.graph.nodes.intent_node import intent_node
from app.graph.nodes.macro_lookup_node import macro_lookup_node
from app.graph.nodes.resolver_node import resolver_node
from app.graph.nodes.stt_node import stt_node
from app.graph.nodes.tts_node import tts_node
from app.graph.state import VoiceState


def _route_after_macro_lookup(state: VoiceState) -> str:
    return "resolver" if state.get("is_macro") else "classify_intent"


def build_graph():
    graph = StateGraph(VoiceState)

    graph.add_node("stt", stt_node)
    graph.add_node("macro_lookup", macro_lookup_node)
    graph.add_node("classify_intent", intent_node)
    graph.add_node("resolver", resolver_node)
    graph.add_node("tts", tts_node)

    graph.add_edge(START, "stt")
    graph.add_edge("stt", "macro_lookup")
    graph.add_conditional_edges(
        "macro_lookup",
        _route_after_macro_lookup,
        {"resolver": "resolver", "classify_intent": "classify_intent"},
    )
    graph.add_edge("classify_intent", "resolver")
    graph.add_edge("resolver", "tts")
    graph.add_edge("tts", END)

    return graph.compile()


@lru_cache
def get_compiled_graph():
    """Compiled graph is reusable and thread-safe; build it once."""
    return build_graph()
