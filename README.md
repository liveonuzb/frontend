# LiveOn Frontend

Bu frontend `Vite + React` asosida qurilgan va `Coolify` uchun Docker bilan tayyorlangan.

## Local ishga tushirish

```bash
npm install
npm run dev
```

Default local API manzili:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Build

```bash
npm run build
```

## Docker

```bash
docker build -t liveon-frontend .
docker run --rm -p 5050:80 \
  -e VITE_API_BASE_URL=https://api.example.com/api/v1 \
  liveon-frontend
```

Container `80` portda ishlaydi va healthcheck endpoint:

```text
/health
```

