FROM node:18
WORKDIR /backend
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npx", "nodemon", "index.ts"]