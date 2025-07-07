# utils.py

def get_video_id(video_url):
    try:
        parts = video_url.split("/")
        if "video" in parts:
            index = parts.index("video")
            return parts[index + 1].split("?")[0]
        return None
    except Exception:
        return None

def calculate_share_count(likes: int) -> int:
    if likes < 100:
        return 0
    elif 100 <= likes < 1000:
        return 50
    elif 1000 <= likes <= 5000:
        return 100
    else:
        return 150