FROM mcr.microsoft.com/playwright:v1.53.2-jammy

WORKDIR /app

COPY package*.json ./

# Optional: improve npm reliability
RUN npm config set fetch-retries 5
RUN npm config set fetch-retry-mintimeout 20000
RUN npm config set fetch-retry-maxtimeout 120000

RUN npm install

COPY . .

HEALTHCHECK --interval=1m --timeout=10s \
  CMD node -e "require('fs').statSync('shared.json')" || exit 1

CMD ["npm", "start"]
