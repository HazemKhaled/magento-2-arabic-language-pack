FROM node:12-alpine

RUN mkdir /app
WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]
