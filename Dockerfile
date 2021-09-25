from node:16-alpine

workdir /E621-DB-Export-Sqlite/

# g++, python3, and make are needed for the npm packages
run apk add sqlite npm g++ python3 make
copy ./plans/ ./plans/
copy ./utils/ ./utils/
copy main.js package.json ./

run npm install

entrypoint node main.js