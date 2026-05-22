import redis
import os
from datetime import datetime, timedelta,timezone
from api.websocket import manager
import asyncio
from api.db.session import get_db
from api.models.complaint import Complaint


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
    # 1. Try configured REDIS_URL
    try:
        client = redis.from_url(url, decode_responses=True)
        client.ping()
        print(f"Connected to Redis at {url}")
        return client
    except Exception as e:
        print(f"Failed to connect to Redis at {url}: {e}")

    # 2. Try localhost fallback if url was a container name
    if "localhost" not in url and "127.0.0.1" not in url:
        local_url = "redis://localhost:6379/0"
        try:
            client = redis.from_url(local_url, decode_responses=True)
            client.ping()
            print(f"Connected to local fallback Redis at {local_url}")
            return client
        except Exception as e:
            print(f"Failed to connect to local fallback Redis at {local_url}: {e}")

    # 3. Fallback to in-memory MockRedis
    print("WARNING: Redis is not running or reachable. Falling back to in-memory MockRedis.")
    return MockRedis()

r = initialize_redis()

IST = timezone(timedelta(hours=5, minutes=30))

TIER_HOURS = {
    "REGULATORY" : 5,
    "HIGH" : 24,
    "MEDIUM" : 48,
    "NORMAL" : 72
}

def set_sla_timer(complaint_id: str, sla_tier: str):

    hour = TIER_HOURS.get(sla_tier, 72)
    deadline = datetime.now(IST) + timedelta(hours=hour)

    r.setex(f"sla:{complaint_id}",hour*3600, sla_tier)

    r.hset(f"sla_meta:{complaint_id}", mapping={
        "deadline": deadline.isoformat(),
        "tier": sla_tier,
        "alert_50": "0",
        "alert_75": "0",
        "alert_90": "0"
    })

def get_sla_status(complaint_id: str):
    sla_tier = r.get(f"sla:{complaint_id}")
    if sla_tier is None:
        return None

    meta = r.hgetall(f"sla_meta:{complaint_id}")
    deadline = datetime.fromisoformat(meta["deadline"])
    now = datetime.now(IST)

    time_remaining = (deadline - now).total_seconds()
    total_time = TIER_HOURS.get(sla_tier, 72) * 3600
    percentage_elapsed = ((total_time - time_remaining) / total_time) * 100

    return {
        "sla_tier": sla_tier,
        "time_remaining": time_remaining,
        "percentage_elapsed": percentage_elapsed,
        "deadline": deadline.isoformat(),
        "alerts": {
            "50%": meta["alert_50"],
            "75%": meta["alert_75"],
            "90%": meta["alert_90"]
        },
    }


def fire_sla_alert(complaint_id: str, alert_type: str):
    payload = {
        "type": "sla_alert",
        "alert_type": alert_type,
        "complaint_id": complaint_id,
        "ts": datetime.now(IST).isoformat(),
    }
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast(payload))
    except RuntimeError:
        asyncio.run(manager.broadcast(payload))


def clear_sla(complaint_id: str):
    r.delete(f"sla:{complaint_id}")
    r.delete(f"sla_meta:{complaint_id}")


def check_all_sla():
    keys = r.keys("sla:*")
    for key in keys:
        complaint_id = key.split(":")[1]
        status = get_sla_status(complaint_id)
        if status is None:
            continue

        percentage = status["percentage_elapsed"]
        if percentage >= 50 and status["alerts"]["50%"] == "0":
            fire_sla_alert(complaint_id, "50_PERCENT")
            r.hset(f"sla_meta:{complaint_id}", "alert_50", "1")

        if percentage >= 75 and status["alerts"]["75%"] == "0":
            fire_sla_alert(complaint_id, "75_PERCENT")
            r.hset(f"sla_meta:{complaint_id}", "alert_75", "1")

        if percentage >= 90 and status["alerts"]["90%"] == "0":
            fire_sla_alert(complaint_id, "90_PERCENT")
            r.hset(f"sla_meta:{complaint_id}", "alert_90", "1")
        
        ttl = r.ttl(f"sla:{complaint_id}")
        if ttl == -2:
            fire_sla_alert(complaint_id, "BREACHED")
            try:
                db = next(get_db())
                try:
                    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
                    if complaint is not None:
                        complaint.sla_breached = True
                        if complaint.status != "resolved":
                            complaint.status = "escalated"
                        db.commit()
                finally:
                    db.close()
            except Exception:
                # If DB is not configured/reachable, still keep redis+ws behavior.
                pass
            clear_sla(complaint_id)