import requests

# Replace with your credentials
TELEGRAM_BOT_TOKEN = '7596985533:AAHjRG1gvHkm2bM6oSJtgOMffHSM8TcgQkw'
TELEGRAM_USER_ID = '1098100073'

def send_telegram_message(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = {
        'chat_id': TELEGRAM_USER_ID,
        'text': message,
        'parse_mode': 'HTML'
    }
    try:
        response = requests.post(url, data=data)
        response.raise_for_status()
    except Exception as e:
        print(f"Telegram send error: {e}")

def send_telegram_photo(image_path, caption=""):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
    try:
        with open(image_path, 'rb') as img:
            files = {'photo': img}
            data = {
                'chat_id': TELEGRAM_USER_ID,
                'caption': caption,
                'parse_mode': 'HTML'
            }
            response = requests.post(url, files=files, data=data)
            response.raise_for_status()
    except Exception as e:
        print(f"Telegram photo send error: {e}")
