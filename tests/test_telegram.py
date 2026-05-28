import threading
import time
from unittest.mock import MagicMock, patch


def make_channel():
    from services.channels.telegram import TelegramChannel

    channel = TelegramChannel(token="test-bot-token", api_host="http://localhost:8000")
    return channel


def _mock_response(status_code=200, json_data=None):
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data or {}
    resp.text = "mock"
    return resp


def _make_update(update_id, chat_id, text, username="testuser"):
    return {
        "update_id": update_id,
        "message": {
            "message_id": update_id,
            "chat": {"id": chat_id, "type": "private"},
            "from": {"id": chat_id, "username": username, "first_name": "Test"},
            "text": text,
            "date": 1717000000,
        },
    }


def _make_start_update(update_id, chat_id):
    return _make_update(update_id, chat_id, "/start")


def _once_then_empty(data):
    yielded = False

    def side_effect(*args, **kwargs):
        nonlocal yielded
        if not yielded:
            yielded = True
            return _mock_response(200, {"ok": True, "result": data})
        return _mock_response(200, {"ok": True, "result": []})

    return side_effect


def test_new_message_creates_complaint():
    channel = make_channel()
    update = _make_update(100, 55555, "My transfer failed")

    with patch("requests.get") as mock_get, patch("requests.post") as mock_post:
        mock_get.side_effect = _once_then_empty([update])
        mock_post.return_value = _mock_response(201, {"id": "abc-123"})

        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_updates, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    complaint_calls = [
        c for c in mock_post.call_args_list
        if "api/v1/complaints" in str(c)
    ]
    assert len(complaint_calls) == 1
    payload = complaint_calls[0][1]["json"]
    assert payload["channel"] == "telegram"
    assert payload["customer_id"] == "TG_55555"
    assert payload["raw_text"] == "My transfer failed"


def test_offset_advances_after_update():
    channel = make_channel()
    update = _make_update(12345, 111, "Hello")

    with patch("requests.get") as mock_get, patch("requests.post") as mock_post:
        mock_get.side_effect = _once_then_empty([update])
        mock_post.return_value = _mock_response(201, {"id": "xyz"})

        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_updates, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    call_params = mock_get.call_args_list[1][1]["params"]
    assert call_params["offset"] == 12346


def test_start_command_sends_welcome_no_complaint():
    channel = make_channel()
    update = _make_start_update(1, 99999)

    with patch("requests.get") as mock_get, patch("requests.post") as mock_post:
        mock_get.side_effect = _once_then_empty([update])

        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_updates, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    complaint_calls = [
        c for c in mock_post.call_args_list
        if "api/v1/complaints" in str(c)
    ]
    assert len(complaint_calls) == 0

    send_message_calls = [
        c for c in mock_post.call_args_list
        if "sendMessage" in str(c) and "Welcome" in str(c)
    ]
    assert len(send_message_calls) == 1


def test_empty_text_is_skipped():
    channel = make_channel()
    update = {
        "update_id": 5,
        "message": {
            "message_id": 5,
            "chat": {"id": 777, "type": "private"},
            "from": {"id": 777},
            "date": 1717000000,
        },
    }

    with patch("requests.get") as mock_get, patch("requests.post") as mock_post:
        mock_get.side_effect = _once_then_empty([update])

        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_updates, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    complaint_calls = [
        c for c in mock_post.call_args_list
        if "api/v1/complaints" in str(c)
    ]
    assert len(complaint_calls) == 0


def test_http_error_on_get_updates_skips_cycle():
    channel = make_channel()

    call_count = 0

    def side_effect(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count <= 2:
            return _mock_response(500)
        return _mock_response(200, {"ok": True, "result": []})

    with patch("requests.get") as mock_get, patch("requests.post") as mock_post:
        mock_get.side_effect = side_effect

        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_updates, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    complaint_calls = [
        c for c in mock_post.call_args_list
        if "api/v1/complaints" in str(c)
    ]
    assert len(complaint_calls) == 0


def test_multiple_updates_all_processed():
    channel = make_channel()
    updates = [
        _make_update(10, 111, "Issue one", "user_a"),
        _make_update(20, 222, "Issue two", "user_b"),
        _make_update(30, 333, "Issue three", "user_c"),
    ]

    with patch("requests.get") as mock_get, patch("requests.post") as mock_post:
        mock_get.side_effect = _once_then_empty(updates)
        mock_post.return_value = _mock_response(201, {"id": "multi"})

        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_updates, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    complaint_calls = [
        c for c in mock_post.call_args_list
        if "api/v1/complaints" in str(c)
    ]
    assert len(complaint_calls) == 3
    assert mock_get.call_args_list[1][1]["params"]["offset"] == 31


def test_fallback_db_on_api_failure():
    channel = make_channel()
    update = _make_update(42, 88888, "API is down")

    with patch("requests.get") as mock_get, patch("requests.post") as mock_post, \
         patch.object(channel, "_save_fallback_db") as mock_fallback:
        mock_get.side_effect = _once_then_empty([update])
        mock_post.return_value = _mock_response(500)

        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_updates, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    mock_fallback.assert_called_once()
    assert mock_fallback.call_args[0][1] == 88888
    assert mock_fallback.call_args[0][2] == "API is down"