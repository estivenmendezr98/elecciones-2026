FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Exponemos el puerto interno (asumo que tu backend usa el 3000 internamente, si usa otro, cámbialo)
EXPOSE 3000
CMD ["node", "server.js"]