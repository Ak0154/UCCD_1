import tweepy

client = tweepy.Client(
    bearer_token="AAAAAAAAAAAAAAAAAAAAANiR9wEAAAAAKMeTTfhypTxwPeQm6CyvNSRInYs%3DFGLjKKgKgxz6B3N4BZL9Qm2QtszXDG3OKgetv6fYkDtofw759P",
    consumer_key="qFQtmbE2iIC4UaO46XlvjLzr5",
    consumer_secret="U9kJ3m15nzwpoQNaUoBCfUKdiRIsNaB70raYsoZxJzjKazMi0J",
    access_token="2060056429206351872-4cYkdMJpnTSffsNhXdnI4wLYXZ9YCn",
    access_token_secret="J9M4HrThO6ogdYwMs6DdiLDU1AlvXjYR8bVgjPZRYS5T9",
)

me = client.get_me()
print("ME:", me)

try:
    mentions = client.get_users_mentions(
        id=me.data.id,
        max_results=5
    )
    print("MENTIONS:", mentions)
except Exception as e:
    print("MENTIONS ERROR:", repr(e))