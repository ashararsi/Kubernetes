FROM node:20-alpine

WORKDIR /app

COPY app/package.json app/package-lock.json ./
RUN npm ci --omit=dev

COPY app/ ./
COPY DEPLOYMENT-GUIDE.md ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER node

CMD ["node", "server.js"]
