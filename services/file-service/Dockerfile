# services/file-service/Dockerfile
FROM node:18-alpine 

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create the directory for temporary uploads
RUN mkdir -p uploads 

EXPOSE 3002 

CMD ["node", "server.js"]
