# config.py

# Telegram Bot Credentials
TELEGRAM_BOT_TOKEN = "7596985533:AAHjRG1gvHkm2bM6oSJtgOMffHSM8TcgQkw"
TELEGRAM_USER_ID = "1098100073"

# Proxy list file
PROXY_LIST_PATH = "proxy.txt"

# Time interval to recheck videos (in seconds) – 2 hours
CHECK_INTERVAL = 2 * 60 * 60

# Target TikTok usernames
TARGET_USERNAMES = ["its.sahiba2233", "iamvirk"]

# Share strategy based on like count
def calculate_share_count(likes: int) -> int:
    if likes < 100:
        return 0
    elif 100 <= likes < 1000:
        return 50
    elif 1000 <= likes <= 5000:
        return 100
    else:
        return 150