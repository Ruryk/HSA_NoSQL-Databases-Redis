FROM node:18

# Створення робочої директорії
WORKDIR /usr/src/app

# Копіювання package.json та package-lock.json
COPY package*.json ./

# Встановлення залежностей
RUN npm install

# Копіювання всіх файлів
COPY . .

# Відкриття порту
EXPOSE 3000

# Запуск додатку
CMD ["node", "app.js"]
