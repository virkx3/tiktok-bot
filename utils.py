# utils.py

import re
import geoip2.database
import socket

# Share logic based on like count
def calculate_share_count(like_count, previous_share_count=0):
    if like_count < 100:
        return 0
    elif like_count < 1000:
        return max(0, 50 - previous_share_count)
    elif like_count < 5000:
        return max(0, 100 - previous_share_count)
    else:
        return max(0, 150 - previous_share_count)

# Get target usernames (static for now, or from config)
def get_target_usernames():
    return ["its.sahiba2233", "iamvirk"]

# Check if proxy is from India using hostname (fallback-only heuristic)
def is_indian_proxy(proxy):
    try:
        ip = proxy.split(":")[0]
        # Optionally plug in MaxMind DB (if required) for more accurate GeoIP
        if any(keyword in proxy.lower() for keyword in ['.in', 'india']):
            return True
        return False
    except:
        return False

# Extract proxy parts for Playwright
def extract_proxy_parts(proxy):
    """
    Returns dict for playwright like:
    {
        "server": "ip:port",
        "username": "user",
        "password": "pass"
    }
    """
    match = re.match(r"(?:(?P<username>[^:@]+):(?P<password>[^@]+)@)?(?P<ip>[^:]+):(?P<port>\d+)", proxy)
    if not match:
        return {"server": proxy}
    parts = match.groupdict()
    return {
        "server": f"{parts['ip']}:{parts['port']}",
        "username": parts.get("username"),
        "password": parts.get("password")
    }