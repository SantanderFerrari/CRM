# CRM Project — Docker Setup

## Project structure
```
crm/
├── crm-backend/        Express + Node.js API
├── crm-frontend/       React app
├── crm_schema.sql      Base schema (auto-loaded by Postgres on first boot)
├── docker-compose.yml
└── .env                (copy from .env.example)
```

## Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine + Docker Compose plugin (Linux)
- Minimum 2GB RAM available to Docker

---

## Quick start

### 1. Copy and fill in the .env file
```bash
cp .env.example .env
```
Open `.env` and set strong values for `DB_PASSWORD`, `JWT_SECRET` and `JWT_REFRESH_SECRET`.

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Build and start all services
```bash
docker-compose up --build
```

This starts four containers in order:
| Container      | Role                              | Port  |
|----------------|-----------------------------------|-------|
| crm-postgres   | PostgreSQL 16 database            | 5432  |
| crm-migrate    | Runs all migrations then exits    | —     |
| crm-backend    | Express API                       | 5000  |
| crm-frontend   | React app served by Nginx         | 80    |

Open your browser at **http://localhost**

### 3. Run in detached mode (background)
```bash
docker-compose up --build -d
```

---

## Common commands

```bash
# View running containers
docker-compose ps

# View backend logs
docker-compose logs -f crm-backend

# View all logs
docker-compose logs -f

# Stop all containers
docker-compose down

# Stop and remove volumes (wipes the database)
docker-compose down -v

# Rebuild a single service after code changes
docker-compose up --build crm-backend

# Open a shell inside the backend container
docker exec -it crm-backend sh

# Connect to PostgreSQL directly
docker exec -it crm-postgres psql -U postgres -d crm_db
```

---

## Running migrations manually
```bash
docker-compose run --rm crm-migrate
```

---

## Development mode (without Docker)

Backend:
```bash
cd crm-backend
cp .env.example .env   # fill in your local Postgres credentials
npm install
npm run migrate
npm run dev
```

Frontend:
```bash
cd crm-frontend
npm install
npm start
```

---

## Production checklist
- [ ] Set strong `DB_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET` in `.env`
- [ ] Set `REACT_APP_API_URL` to your server's public IP or domain
- [ ] Set `CLIENT_ORIGIN` to your frontend's public URL
- [ ] Set `NODE_ENV=production`
- [ ] Put Nginx or a reverse proxy in front for HTTPS (Let's Encrypt / Certbot)
- [ ] Never commit `.env` to version control