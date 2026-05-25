import redis
import os
from datetime import datetime, timedelta, timezone


class MockRedis:
    def __init__(self):
        self.data = {}
        self.ttls = {}
        self.metadata = {}

    def setex(self, key, time_secs, value):
        self.data[key] = value
        self.ttls[key] = datetime.now(timezone.utc) + timedelta(seconds=time_secs)

    def get(self, key):
        if key in self.ttls and datetime.now(timezone.utc) > self.ttls[key]:
            self.delete(key)
            return None
        return self.data.get(key)

    def hset(self, name, key=None, value=None, mapping=None):
        if name not in self.metadata:
            self.metadata[name] = {}
        if mapping:
            self.metadata[name].update(mapping)
        elif key is not None and value is not None:
            self.metadata[name][key] = value

    def hgetall(self, key):
        return self.metadata.get(key, {})

    def delete(self, key):
        self.data.pop(key, None)
        self.ttls.pop(key, None)
        self.metadata.pop(key, None)

    def keys(self, pattern):
        prefix = pattern.replace("*", "")
        return [k for k in self.data.keys() if k.startswith(prefix)]

    def ttl(self, key):
        if key not in self.ttls:
            return -2
        remaining = (self.ttls[key] - datetime.now(timezone.utc)).total_seconds()
        if remaining <= 0:
            self.delete(key)
            return -2
        return int(remaining)

    def ping(self):
        return True


def initialize_redis():
    url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    try:
        client = redis.from_url(url, decode_responses=True)
        client.ping()
        print(f"Connected to Redis at {url}")
        return client
    except Exception as e:
        print(f"Failed to connect to Redis at {url}: {e}")

    if "localhost" not in url and "127.0.0.1" not in url:
        local_url = "redis://localhost:6379/0"
        try:
            client = redis.from_url(local_url, decode_responses=True)
            client.ping()
            print(f"Connected to local fallback Redis at {local_url}")
            return client
        except Exception as e:
            print(f"Failed to connect to local fallback Redis at {local_url}: {e}")

    print("WARNING: Redis is not running or reachable. Falling back to in-memory MockRedis.")
    return MockRedis()


r = initialize_redis()