#!/bin/bash

# Download browser binaries if missing
playwright install --with-deps

# Start the bot
python3 index.py
