FROM node:22

WORKDIR /app

COPY package.json ./

RUN corepack enable
RUN pnpm install --prod=false

COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host"]