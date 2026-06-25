#1. Base img Node.js ni
FROM node:20-alpine

#2.container ni andr folder banavo
WORKDIR /app

#3. packagefile copy kari and dependencies install kari
COPY package*.json /app/
RUN npm install

#4. akho frontend no code copy karyo
COPY . /app/

# 5.React(vite) ne chalva mate port expose karyo
EXPOSE 5173

#6.Vite server ko external access na mate --host flag ni sathe chalaya
CMD ["npm","run","dev","--","--host"]