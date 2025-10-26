FROM nginx AS builder


WORKDIR /app


COPY package.json package-lock.json ./


RUN npm ci


COPY . .

RUN npm run build --if-present


FROM node:20-alpine AS production

WORKDIR /app


COPY package.json package-lock.json ./


RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD [ "npm", "run", "start" ]