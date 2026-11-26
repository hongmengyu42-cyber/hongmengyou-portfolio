# portfolio-api (Phase 2: backend)

Java 17, Spring Boot 4.1.x, Spring Security 7, PostgreSQL, Flyway.

## First-time setup
```bash
# 1. Generate the Maven Wrapper once (needs any Maven install; afterwards you only use ./mvnw)
mvn -N wrapper:wrapper -Dmaven=3.9.11

# 2. Start PostgreSQL for local development
docker run -d --name portfolio-db -e POSTGRES_DB=portfolio -e POSTGRES_USER=portfolio \
  -e POSTGRES_PASSWORD=portfolio -p 5432:5432 postgres:16-alpine

# 3. Run the unit tests, then everything (integration tests need Docker)
./mvnw test
./mvnw verify

# 4. Run the API with the dev profile (placeholder seed data, Swagger UI for admins)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='use-a-long-passphrase' \
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

## Environment variables
| Variable | Required | Purpose |
|---|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | prod | PostgreSQL connection (password has no default) |
| `IP_HASH_SECRET` | prod | Secret key for hashing visitor IPs; use 32+ random characters |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | first start | Creates the first admin if none exists (min 12 chars). Remove the password afterwards |
| `SITE_BASE_URL` | prod | Public URL, used for canonical links and the sitemap |
| `STORAGE_ROOT` | optional | Upload directory (a Docker volume in production) |
| `CORS_ALLOWED_ORIGINS` | dev only | Comma-separated; leave empty in production (same origin) |
