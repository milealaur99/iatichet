FROM node:18
WORKDIR /backend
COPY package*.json ./
RUN npm install
# Install ts-node globally
RUN npm install -g ts-node
COPY . .
# Expose the port (if your backend runs on port 5000)
EXPOSE 5000

# Start the application using nodemon and ts-node
CMD ["npx", "nodemon", "--exec", "ts-node", "index.ts"]