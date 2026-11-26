# portfolio-web (Phase 3: public site)

React 19 + Vite + TypeScript + Tailwind CSS 4 + Framer Motion. Talks to the Spring Boot API in `../backend`.

## Run it
```bash
npm install
npm run dev        # http://localhost:5173, /api is proxied to http://localhost:8080
npm run typecheck
npm test           # 130+ tests (unit, component, accessibility, contrast)
npm run build      # type-checks, then builds to dist/
```
Start the backend first (`SPRING_PROFILES_ACTIVE=dev`) so the page has data. To point at another backend:
`VITE_BACKEND_URL=http://host:port npm run dev`.

## Design system (src/theme/tokens.css is the single source of truth)
| Token | Light | Dark |
|---|---|---|
| Page background `--c-canvas` | `#FAFBFD` | `#0B1B3A` (navy) |
| Card surface `--c-surface` | `#FFFFFF` | `#11264D` |
| Body text `--c-ink` | `#1F2933` | `#E8EDF7` |
| Secondary text `--c-muted` | `#52606D` | `#A9B8D0` |
| Accent fill `--c-accent` | `#2F6FED` | `#2F6FED` |
| Accent text (derived) `--c-accent-text` | `#2457CC` | `#8AB0FF` |
| Primary button | navy `#0B1B3A` | accent `#2F6FED` |

Fonts: IBM Plex Sans (text) + IBM Plex Mono (labels, code), self-hosted via @fontsource (works with a strict CSP).

`src/theme/contrast.test.ts` reads `tokens.css` and fails the build if any text pair drops below WCAG AA
(4.5:1 text, 3:1 UI and focus), in both themes. Change a colour there and the test tells you if it is still accessible.

## Where things live
```
src/api/         typed client + useApi hook (one ApiError shape for HTTP and network failures)
src/content/     ContentProvider: loads profile, skills, experience, education, certifications once
src/components/  ui/ (primitives), layout/, home/ (page sections), projects/ (cards, gallery, links)
src/pages/       HomePage, ProjectPage (lazy), NotFoundPage (lazy)
src/lib/         safeUrl, validation, formatting, SEO hook, reduced-motion hook
```

## TODO_REPLACE markers
Profile photo, CV, social links, About text and projects come from the API, so you set them in the admin dashboard
(Phase 4). Until then, **development builds** show dashed `TODO_REPLACE:` hints where content is missing.
Production builds hide unfinished sections instead of showing placeholders.

## Admin dashboard (Phase 4)
Open `/admin` (lazy-loaded; public visitors never download it). Sign in with the account created from
`ADMIN_EMAIL` / `ADMIN_PASSWORD` on the backend's first start.

| Screen | What you can do |
|---|---|
| Dashboard | Project and link-health summary, unread messages, quick actions |
| Projects | Create, edit, delete, reorder (arrow buttons), publish/feature, check live links, manage screenshots (upload, alt text, thumbnail, order, delete) |
| Skills, Experience, Education (+ certifications) | Config-driven list + editor + delete confirmation (`src/admin/CrudPage.tsx`) |
| Profile | Details, SEO fields, photo (alt text required) and CV (PDF) |
| Messages | Read, mark read/unread, filter unread, delete, paginate |

Security notes: the session is an HttpOnly cookie (nothing secret lives in JavaScript); every write sends the CSRF
header; an expired session (401 on any admin request) returns you to the login page; `/admin` is `noindex`.
Validation in the forms mirrors the backend rules for fast feedback, but the backend remains the authority.
