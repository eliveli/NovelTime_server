FROM node:16.13.2
WORKDIR /usr/src/server
COPY package*.json .
RUN npm install --silent
RUN npm install -g ts-node typescript --silent
COPY . .
# set env after installing all including devDependencies to avoid type error
ENV NODE_ENV=production 
EXPOSE 8082
CMD ["npm", "run", "prod"]