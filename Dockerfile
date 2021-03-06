FROM node:14
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install nan
RUN npm install --only=dev
COPY . .
#RUN npm run doc
#RUN npm run build

FROM node:14
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
RUN npm install --global rollup
WORKDIR /app/node_modules/momi
RUN npm run build
WORKDIR /app
COPY ./src .
#COPY --from=0 /app/doc ./doc
#COPY --from=0 /app/build .
COPY --from=0 /app/keyfile.json .
CMD ["npm", "start"]
