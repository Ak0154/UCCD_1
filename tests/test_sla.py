from services.sla_service import TIER_HOURS


def test_tier_hours_enum():
    """SLA tiers have correct hour assignments."""
    assert TIER_HOURS["REGULATORY"] == 5
    assert TIER_HOURS["HIGH"] == 24
    assert TIER_HOURS["MEDIUM"] == 48
    assert TIER_HOURS["NORMAL"] == 72


def test_set_sla_timer_rejects_invalid_tier():
    """set_sla_timer raises ValueError for unknown tiers."""
    from services.sla_service import set_sla_timer
    import pytest
    with pytest.raises(ValueError, match="Invalid SLA tier"):
        set_sla_timer("test-complaint-001", "INVALID_TIER")


def test_sla_status_none_for_missing():
    """get_sla_status returns None for unknown complaint."""
    from services.sla_service import get_sla_status
    result = get_sla_status("nonexistent-complaint-id")
    assert result is None


def test_regulatory_deadlines():
    """Regulatory deadlines have expected hour values."""
    from services.regulatory_service import REGULATORY_DEADLINES
    assert REGULATORY_DEADLINES["RBI"] == 30
    assert REGULATORY_DEADLINES["IRDAI"] == 15
    assert REGULATORY_DEADLINES["RBI-BCSBI"] == 45