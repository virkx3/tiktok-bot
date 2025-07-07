# config.py

# Telegram credentials
TELEGRAM_BOT_TOKEN = "7596985533:AAHjRG1gvHkm2bM6oSJtgOMffHSM8TcgQkw"
TELEGRAM_USER_ID = 1098100073

# TikTok login
TIKTOK_USERNAME = "sociaixzl3s"
TIKTOK_PASSWORD = "Virksaab@12345"

# Target usernames
TARGET_USERNAMES = [
    "its.sahiba2233",
    "iamvirk"
]

# Proxy list path (local file)
PROXY_LIST_PATH = "proxy.txt"

# Recheck interval (in hours)
RECHECK_INTERVAL_HOURS = 2

# Share thresholds
SHARE_RULES = [
    (0, 100, 0),
    (100, 1000, 50),
    (1000, 5000, 100),
    (5000, float("inf"), 150),
]