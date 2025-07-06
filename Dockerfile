FROM mcr.microsoft.com/playwright:v1.43.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Add Docker health check
HEALTHCHECK --interval=1m --timeout=10s \
  CMD node -e "require('fs').statSync('shared.json')" || exit 1

CMD ["npm", "start"]
