# Use an official Node.js image as base
FROM node:18-alpine

# Set working directory inside container
WORKDIR /usr/src/app
RUN apk add --no-cache python3 make g++
# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your app’s code
COPY . .

# Expose the port your app runs on (e.g. 3000)
EXPOSE 3000

# Command to start your app
CMD ["node", "index.js"]
