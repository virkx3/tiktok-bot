# config.py

# Telegram Configuration
TELEGRAM_BOT_TOKEN = "7596985533:AAHjRG1gvHkm2bM6oSJtgOMffHSM8TcgQkw"
TELEGRAM_USER_ID = "1098100073"

# TikTok Targets
TIKTOK_USERNAMES = ["its.sahiba2233", "iamvirk"]

# Share Strategy
SHARE_STRATEGY = [
    {"min_likes": 0, "max_likes": 99, "shares": 0},
    {"min_likes": 100, "max_likes": 999, "shares": 50},
    {"min_likes": 1000, "max_likes": 5000, "shares": 100},
    {"min_likes": 5001, "max_likes": float("inf"), "shares": 150},
]

# Time interval for rechecking (in seconds)
RECHECK_INTERVAL = 2 * 60 * 60  # 2 hours

# Proxy file path
PROXY_FILE = "proxy.txt"

# Log file
LOG_FILE = "log.txt"

# Timeouts
PROXY_TEST_TIMEOUT = 10