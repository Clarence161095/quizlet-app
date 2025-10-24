FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

EXPOSE 5173

# Serve built files with a simple HTTP server
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "5173"]
