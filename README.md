## Быстрый старт с Docker

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/utojikulov/grammy-toe.git
   cd grammy-toe
   npm install
   ```
   
2. **Настройте переменные окружения**
   ```bash
   cp .env.example .env
   ```

   Заполните файл `.env`:

3. **Запустите сервис**
   ```bash
   docker-compose up -d
   или
   docker-compose up
   ```
