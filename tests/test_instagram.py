from unittest.mock import MagicMock, patch
import threading
import time


class FakeMessage:
    def __init__(self, msg_id: str, user_id: str, text: str):
        self.id = msg_id
        self.item_id = msg_id
        self.user_id = user_id
        self.text = text


class FakeThread:
    def __init__(self, pk: int):
        self.pk = pk


def make_channel():
    from services.channels.instagram import InstagramChannel

    channel = InstagramChannel()
    channel._client = MagicMock()
    channel._own_user_id = "11111"
    channel._last_seen_message_ids.clear()
    return channel


def test_new_message_creates_complaint():
    channel = make_channel()
    fake_thread = FakeThread(999)
    fake_msg = FakeMessage("msg-1", "22222", "My card is blocked")
    channel._client.direct_threads.return_value = [fake_thread]
    channel._client.direct_messages.return_value = [fake_msg]

    with patch("requests.post") as mock_post:
        mock_post.return_value.status_code = 201
        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_dms, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    mock_post.assert_called_once()
    call_args = mock_post.call_args
    payload = call_args[1]["json"]
    assert payload["channel"] == "instagram"
    assert payload["customer_id"] == "IG_22222"
    assert payload["raw_text"] == "My card is blocked"
    assert payload["source_ref"] == "999"


def test_duplicate_message_is_skipped():
    channel = make_channel()
    channel._last_seen_message_ids.add("msg-1")

    fake_thread = FakeThread(999)
    fake_msg = FakeMessage("msg-1", "22222", "My card is blocked")
    channel._client.direct_threads.return_value = [fake_thread]
    channel._client.direct_messages.return_value = [fake_msg]

    with patch("requests.post") as mock_post:
        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_dms, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    mock_post.assert_not_called()


def test_own_message_is_skipped():
    channel = make_channel()
    fake_thread = FakeThread(999)
    fake_msg = FakeMessage("msg-2", "11111", "Hello customer")
    channel._client.direct_threads.return_value = [fake_thread]
    channel._client.direct_messages.return_value = [fake_msg]

    with patch("requests.post") as mock_post:
        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_dms, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    mock_post.assert_not_called()
    assert "msg-2" in channel._last_seen_message_ids


def test_empty_message_is_skipped():
    channel = make_channel()
    fake_thread = FakeThread(999)
    fake_msg = FakeMessage("msg-3", "33333", "")
    channel._client.direct_threads.return_value = [fake_thread]
    channel._client.direct_messages.return_value = [fake_msg]

    with patch("requests.post") as mock_post:
        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_dms, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    mock_post.assert_not_called()
    assert "msg-3" in channel._last_seen_message_ids


def test_new_then_duplicate_cycle():
    channel = make_channel()
    fake_thread = FakeThread(999)
    fake_msg = FakeMessage("msg-4", "44444", "Where is my refund?")

    with patch("requests.post") as mock_post:
        mock_post.return_value.status_code = 201
        channel._client.direct_threads.return_value = [fake_thread]
        channel._client.direct_messages.return_value = [fake_msg]

        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_dms, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

        assert mock_post.call_count == 1
        assert "msg-4" in channel._last_seen_message_ids


def test_multiple_messages_dedup():
    channel = make_channel()
    channel._last_seen_message_ids.add("msg-a")

    fake_thread = FakeThread(999)
    msg_a = FakeMessage("msg-a", "22222", "Already seen")
    msg_b = FakeMessage("msg-b", "33333", "New complaint")
    channel._client.direct_threads.return_value = [fake_thread]
    channel._client.direct_messages.return_value = [msg_a, msg_b]

    with patch("requests.post") as mock_post:
        mock_post.return_value.status_code = 201
        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_dms, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    assert mock_post.call_count == 1
    payload = mock_post.call_args[1]["json"]
    assert payload["raw_text"] == "New complaint"