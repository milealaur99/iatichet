# Use a base image with Node.js
FROM node:18

# Set working directory
WORKDIR /backend

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install ts-node globally, if needed
RUN npm install -g ts-node

# Copy the rest of the code
COPY . .

# Expose the backend port (if required)
EXPOSE 5000

# Start the application with nodemon and ts-node
CMD ["npx", "nodemon", "index.ts"]
