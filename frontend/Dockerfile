FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_BACKEND_URL=http://15.206.2.160:5000
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN npm run build

EXPOSE 5173

CMD ["npm", "start"]
