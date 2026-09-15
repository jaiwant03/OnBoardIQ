from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    query: str
    user_name: Optional[str]
    user_role: Optional[str]
    user_department: Optional[str]
    user_experience: Optional[str]
    conversation_history: List[Dict[str, str]]
    intent: Optional[str]
    assigned_agent: Optional[str]
    context: Optional[str]
    sources: List[Dict[str, Any]]
    confidence: Optional[str]
    reasoning: Optional[str]
    response: Optional[str]
    is_verified: bool
