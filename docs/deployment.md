# Azure deployment notes

This document describes the separate PropIntel Docker Compose deployment on the Azure Ubuntu VM.

## Target hostname

- Website: https://propintel.iamkeerthivasan.in
- Admin workspace: https://propintel.iamkeerthivasan.in/admin

The DNS A record for `propintel.iamkeerthivasan.in` should point to the Azure VM public IPv4 address. Confirm the DNS record before issuing a certificate.

## Isolation

PropIntel runs as its own Compose project. It must not reuse or modify the SpectraSpatialAI Compose project, containers, MySQL volume, environment files, or Nginx site.

| Component | PropIntel |
|---|---|
| Compose project | `propintel` |
| API | `127.0.0.1:5051` on the host |
| Frontend | `127.0.0.1:5052` on the host |
| MySQL | Private Compose network only |
| Persistent volume | `propintel_mysql_data` |

## Environment files

Create two local files which must never be committed:

- Repository root `.env`: `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD` for the PropIntel MySQL container.
- `server/.env`: production backend settings, including `GEMINI_API_KEY`, the same application `MYSQL_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a random `SESSION_SECRET`.

Recommended backend settings:

```dotenv
NODE_ENV=production
HOST=0.0.0.0
PORT=5051
TRUST_PROXY=true
CLIENT_ORIGINS=https://propintel.iamkeerthivasan.in
MYSQL_HOST=db
MYSQL_PORT=3306
MYSQL_USER=propintel_app
MYSQL_DATABASE=propintel
MYSQL_CONNECTION_LIMIT=5
GEMINI_MODEL=gemini-3.5-flash-lite
ADMIN_USERNAME=admin
```

Add the actual secret values locally. Set the backend `MYSQL_PASSWORD` to the same password as the root `.env` file's `MYSQL_PASSWORD`. Do not place secrets in this document or Git.

## Build and start

From the repository root:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

The Compose file initializes the database schema when the PropIntel MySQL volume is first created. The schema is mounted at `/docker-entrypoint-initdb.d/01-schema.sql`.

Optional: insert fictional demo leads once after MySQL is healthy:

```bash
docker compose exec -T db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < database/seed.sql
```

## Host Nginx reverse proxy

Create a separate file at `/etc/nginx/sites-available/propintel`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name propintel.iamkeerthivasan.in;

    client_max_body_size 2M;

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:5051;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location / {
        proxy_pass http://127.0.0.1:5052;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it and reload Nginx:

```bash
sudo ln -sfn /etc/nginx/sites-available/propintel /etc/nginx/sites-enabled/propintel
sudo nginx -t
sudo systemctl reload nginx
```

After DNS resolves to the Azure VM and HTTP access to the VM is available, request HTTPS:

```bash
sudo certbot --nginx -d propintel.iamkeerthivasan.in --redirect
```

This creates a separate Nginx site and certificate; do not edit the existing SpectraSpatialAI site for PropIntel.

## Smoke tests

Run on the Azure VM:

```bash
curl -fsS http://127.0.0.1:5051/api/health
curl -fsS http://127.0.0.1:5051/api/health/ready
curl -I http://127.0.0.1:5052
docker compose ps
```

After HTTPS is configured:

```bash
curl -I https://propintel.iamkeerthivasan.in
curl -fsS https://propintel.iamkeerthivasan.in/api/health
curl -fsS https://propintel.iamkeerthivasan.in/api/health/ready
```

Expected: website returns HTTP 200/304, API health returns `status: ok`, and readiness returns `status: ready` with database connected.

## Logs and maintenance

```bash
docker compose logs --tail=100 api
docker compose logs --tail=100 web
docker compose logs --tail=100 db
docker compose ps
```

To deploy a later commit:

```bash
git pull --ff-only
docker compose up -d --build
docker compose ps
```

Do not run `docker compose down -v`, `docker volume prune`, or broad Docker cleanup commands as part of a normal application update. They can delete persistent data or affect unrelated Compose projects.

## Demo access

The assignment demo uses username `admin` and password `PropIntel2026`. This is intentionally shared for evaluation of the synthetic demo only. Rotate it after evaluation and never use it for real customer data.
