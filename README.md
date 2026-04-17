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

## Coolify sozlamalari

Coolify'da frontendni deploy qilish uchun:

1. Repository ulang.
2. `Build Pack` sifatida `Dockerfile` tanlang.
3. `Base Directory` ni `frontend` qiling.
4. `Port` ni `80` qiling.
5. Quyidagi environment variable'ni kiriting:

```env
VITE_API_BASE_URL=https://api.your-domain.com/api/v1
```

## Runtime env qanday ishlaydi

`VITE_API_BASE_URL` build vaqtida ham, container start vaqtida ham ishlaydi. Coolify'da env o'zgarsa, frontend yangi image build qilinmasdan ham to'g'ri `app-config.js` orqali o'qiydi.

Agar frontend va backend bitta domain ortida reverse proxy bilan ishlasa, `VITE_API_BASE_URL` ni bo'sh qoldirib `/api/v1` proxylash mumkin.
