from unittest.mock import MagicMock, patch
import threading
import time


class FakeTweet:
    def __init__(self, tid: int, text: str, screen_name: str):
        self.id = tid
        self.text = text
        self.author = FakeAuthor(screen_name)


class FakeAuthor:
    def __init__(self, screen_name: str):
        self.screen_name = screen_name


def make_channel():
    from services.channels.twitter import TwitterChannel

    channel = TwitterChannel()
    channel._client = MagicMock()
    channel._last_seen_tweet_id = None
    return channel


def test_new_mention_creates_complaint():
    channel = make_channel()
    tweet = FakeTweet(100, "Bank fraud reported", "john_doe")
    channel._client.get_mentions.return_value = [tweet]

    with patch("requests.post") as mock_post:
        mock_post.return_value.status_code = 201
        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_mentions, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    mock_post.assert_called_once()
    call_args = mock_post.call_args
    payload = call_args[1]["json"]
    assert payload["channel"] == "twitter"
    assert payload["customer_id"] == "@john_doe"
    assert payload["raw_text"] == "Bank fraud reported"
    assert payload["source_ref"] == "100"
    assert channel._last_seen_tweet_id == 100


def test_duplicate_mention_is_skipped():
    channel = make_channel()
    channel._last_seen_tweet_id = 100

    tweet = FakeTweet(50, "Old complaint", "jane_doe")
    channel._client.get_mentions.return_value = [tweet]

    with patch("requests.post") as mock_post:
        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_mentions, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    mock_post.assert_not_called()
    assert channel._last_seen_tweet_id == 100


def test_mixed_batch_old_and_new():
    channel = make_channel()
    channel._last_seen_tweet_id = 100

    old_tweet = FakeTweet(80, "Old", "user_a")
    same_tweet = FakeTweet(100, "Same", "user_b")
    new_tweet = FakeTweet(150, "New complaint", "user_c")
    channel._client.get_mentions.return_value = [old_tweet, same_tweet, new_tweet]

    with patch("requests.post") as mock_post:
        mock_post.return_value.status_code = 201
        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_mentions, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    assert mock_post.call_count == 1
    payload = mock_post.call_args[1]["json"]
    assert payload["raw_text"] == "New complaint"
    assert payload["customer_id"] == "@user_c"
    assert payload["source_ref"] == "150"
    assert channel._last_seen_tweet_id == 150


def test_first_run_with_none_last_seen():
    channel = make_channel()
    channel._last_seen_tweet_id = None

    tweet = FakeTweet(1, "First tweet", "first_user")
    channel._client.get_mentions.return_value = [tweet]

    with patch("requests.post") as mock_post:
        mock_post.return_value.status_code = 201
        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_mentions, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    mock_post.assert_called_once()
    assert channel._last_seen_tweet_id == 1


def test_no_mentions_skips_polling():
    channel = make_channel()
    channel._client.get_mentions.return_value = []

    with patch("requests.post") as mock_post:
        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_mentions, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    mock_post.assert_not_called()


def test_multiple_new_mentions_all_processed():
    channel = make_channel()
    channel._last_seen_tweet_id = 50

    tweet_a = FakeTweet(101, "Complaint A", "user_a")
    tweet_b = FakeTweet(200, "Complaint B", "user_b")
    channel._client.get_mentions.return_value = [tweet_a, tweet_b]

    with patch("requests.post") as mock_post:
        mock_post.return_value.status_code = 201
        channel._stop_flag.clear()
        t = threading.Thread(target=channel._poll_mentions, daemon=True)
        t.start()
        time.sleep(2)
        channel._stop_flag.set()
        t.join(timeout=5)

    assert mock_post.call_count == 2
    assert channel._last_seen_tweet_id == 200