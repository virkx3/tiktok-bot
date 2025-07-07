import random
import requests
from config import PROXY_LIST_PATH
from utils import is_valid_proxy, get_country_from_proxy


def load_proxies():
    try:
        with open(PROXY_LIST_PATH, "r") as f:
            lines = f.read().splitlines()
            proxies = []
            for line in lines:
                if line.startswith("#") or not line.strip():
                    continue
                parts = line.strip().split(":")
                if len(parts) == 2:
                    ip, port = parts
                    proxies.append({"ip": ip, "port": port})
                elif len(parts) == 4:
                    ip, port, username, password = parts
                    proxies.append({"ip": ip, "port": port, "username": username, "password": password})
            return proxies
    except Exception as e:
        return []


def get_valid_proxy():
    proxies = load_proxies()
    random.shuffle(proxies)
    for proxy in proxies:
        if not is_valid_proxy(proxy["ip"], proxy["port"]):
            continue
        country = get_country_from_proxy(proxy["ip"])
        if country.lower() == "india":
            continue
        return proxy
    return None