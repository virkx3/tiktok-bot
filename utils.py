import json
import os

def get_target_usernames():
    return ["its.sahiba2233", "iamvirk"]

def get_share_count_based_on_likes(like_count):
    if like_count < 100:
        return 0
    elif like_count < 1000:
        return 50
    elif like_count < 5000:
        return 100
    else:
        return 150

def load_previous_data(file_path="video_data.json"):
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            return json.load(f)
    return {}

def save_video_data(data, file_path="video_data.json"):
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

def update_video_share_count(video_id, share_count, video_data):
    if video_id not in video_data:
        video_data[video_id] = {"shared": 0}
    video_data[video_id]["shared"] += share_count
    return video_data