# Use official Puppeteer image with Chromium
FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the files
COPY . .

# Run the bot
CMD ["npm", "start"]
