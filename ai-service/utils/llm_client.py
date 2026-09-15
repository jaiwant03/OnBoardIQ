import requests
import json
from typing import Optional, List, Dict, Any
from config import OLLAMA_BASE_URL, OLLAMA_MODEL

def call_ollama(prompt: str, system_prompt: Optional[str] = None, model: str = OLLAMA_MODEL, temperature: float = 0.2, timeout: int = 35) -> Optional[str]:
    """
    Calls Ollama REST API with prompt and system prompt.
    Returns None if Ollama is unreachable or times out, allowing instant extractive fallback.
    """
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "top_p": 0.9
        }
    }
    if system_prompt:
        payload["system"] = system_prompt

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=timeout
        )
        if response.status_code == 200:
            text = response.json().get("response", "").strip()
            return text if text else None
        return None
    except Exception:
        return None

def check_ollama_status() -> Dict[str, Any]:
    """Checks if Ollama is accessible and lists available models."""
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
        if resp.status_code == 200:
            data = resp.json()
            models = [m.get("name") for m in data.get("models", [])]
            return {
                "online": True,
                "models": models,
                "active_model": OLLAMA_MODEL,
                "status_text": "Online"
            }
        return {"online": False, "models": [], "status_text": f"HTTP {resp.status_code}"}
    except Exception:
        return {"online": False, "models": [], "status_text": "Standby"}
