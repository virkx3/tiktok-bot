FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

# Set working directory
WORKDIR /app

# Install required system packages
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    unzip \
    wget \
    && apt-get clean

# Copy all project files into the container
COPY . /app

# Install Python dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Ensure Playwright browsers are installed
RUN playwright install --with-deps

# Command to run the app
CMD ["python", "index.py"]