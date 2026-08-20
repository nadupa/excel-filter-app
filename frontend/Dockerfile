# Use Node.js image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy React application
COPY . .

# Build React application
RUN npm run build

# Install a simple web server
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start React production build
CMD ["serve", "-s", "dist", "-l", "3000"]