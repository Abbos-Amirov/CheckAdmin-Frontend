# Deploy — 38.247.134.248

Admin panel va backend bir serverda PM2 orqali ishlaydi.

| Servis | Port | URL |
|--------|------|-----|
| Admin frontend | 3007 | http://38.247.134.248:3007 |
| Backend API | 5000 | http://38.247.134.248:5000/api/health |

Frontend `/api` va `/uploads` so'rovlarini `127.0.0.1:5000` ga proxy qiladi.

## Server talablari

- Node.js 18+
- PM2 (`npm install -g pm2`)
- MongoDB (`MONGODB_URI`)
- Firewall: **3007** va **5000** portlari ochiq

## 1. Backend (`check-backend`)

```bash
cd /home/check-project/check-backend   # yoki o'z yo'lingiz
cp .env.example .env
nano .env   # MONGODB_URI, JWT_SECRET, ADMIN_SIGNUP_SECRET, OPENAI_API_KEY
```

`.env` da muhim qatorlar:

```env
PORT=5000
HOST=0.0.0.0
CORS_ORIGINS=http://38.247.134.248:3007,http://localhost:3007
```

```bash
bash scripts/server-setup.sh   # birinchi marta
# yoki yangilash:
bash scripts/deploy.sh
```

## 2. Frontend (`adminCheck-frontend`)

```bash
cd /home/check-project/adminCheck-frontend
cp .env.production.example .env.production
bash scripts/server-setup.sh   # birinchi marta
# yoki yangilash:
bash scripts/deploy.sh
```

## 3. PM2 avtomatik start

```bash
pm2 startup
pm2 save
pm2 status
```

## Tekshirish

```bash
curl http://127.0.0.1:5000/api/health
curl -I http://127.0.0.1:3007
```

Brauzer: http://38.247.134.248:3007

## Loglar

```bash
pm2 logs meal-tracker-api
pm2 logs admin-check-frontend
```
