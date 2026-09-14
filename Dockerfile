FROM node:22-bookworm-slim

WORKDIR /opt/meshcentral
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund \
    && mkdir -p /data \
    && chown -R node:node /opt/meshcentral /data

COPY start.js ./
USER node
EXPOSE 10000
CMD ["node", "start.js"]

