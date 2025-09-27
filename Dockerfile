FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock tsconfig*.json ./

RUN yarn install --frozen-lockfile --production=false

COPY src ./src
COPY .env* ./

RUN yarn build


FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.production ./.env
COPY --from=builder /app/src ./src  
COPY --from=builder /app/tsconfig*.json ./

RUN yarn install --frozen-lockfile --production=true \
    && yarn add typescript ts-node \
    && yarn cache clean    
   
CMD ["node", "dist/main.js"]