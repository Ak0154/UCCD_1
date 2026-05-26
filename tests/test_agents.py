from services.agent_service import compute_agent_load, get_best_agent, check_agent_loads


def test_compute_agent_load_empty(monkeypatch):
    """compute_agent_load returns dict with all specialist agents set to 0 when no active assigned complaints."""
    mock_db = type("MockDB", (), {
        "query": lambda *args, **kwargs: type("MockQuery", (), {
            "filter": lambda self, *args, **kwargs: type("MockQ", (), {
                "filter": lambda self, *args, **kwargs: type("MockQ2", (), {
                    "group_by": lambda self, *args, **kwargs: type("MockQ3", (), {
                        "all": lambda self: []
                    })()
                })()
            })()
        })()
    })()
    result = compute_agent_load(mock_db)
    assert isinstance(result, dict)
    assert len(result) == 5
    assert all(val == 0 for val in result.values())


def test_get_best_agent_none_when_empty(monkeypatch):
    """get_best_agent returns None when no agents exist in the system."""
    monkeypatch.setattr("services.agent_service.compute_agent_load", lambda db: {})
    monkeypatch.setattr("services.agent_service.AGENT_DEPARTMENT_MAP", {})
    result = get_best_agent(None)
    assert result is None


def test_check_agent_loads_empty(monkeypatch):
    """check_agent_loads returns empty when no agents are overloaded."""
    monkeypatch.setattr("services.agent_service.compute_agent_load", lambda db: {
        "agent1@example.com": 3,
        "agent2@example.com": 7,
    })
    result = check_agent_loads(None)
    assert result == []


def test_check_agent_loads_overloaded(monkeypatch):
    """check_agent_loads returns agents exceeding capacity."""
    monkeypatch.setattr("services.agent_service.compute_agent_load", lambda db: {
        "agent1@example.com": 16,
        "agent2@example.com": 5,
        "agent3@example.com": 20,
    })
    result = check_agent_loads(None)
    assert len(result) == 2
    overloaded_agents = [r["agent"] for r in result]
    assert "agent1@example.com" in overloaded_agents
    assert "agent3@example.com" in overloaded_agents