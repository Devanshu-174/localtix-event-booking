# Project structure

LocalTix keeps the standard Maven backend at the repository root and the Vite frontend in frontend/. Backend packages are grouped by business feature, keeping controllers, services, DTOs and repositories near their entities.

## Backend

- src/main/java/com/localtix/auth/: login, registration, JWT authentication and signed QR support.
- src/main/java/com/localtix/booking/: bookings, tickets, cancellation and capacity coordination.
- src/main/java/com/localtix/event/: event management and inventory.
- src/main/java/com/localtix/checkin/: organizer ticket validation and check-in records.
- src/main/java/com/localtix/user/: user entity, roles and profile endpoint.
- src/main/java/com/localtix/config/: application security, error responses, demo seeding and local database console.
- src/main/resources/: database and application profiles.

Controllers expose HTTP endpoints; services implement business rules; repositories access stored entities; DTOs define request/response shapes. Keep booking and check-in transactions in their services.

## Frontend

- frontend/src/main.jsx: React bootstrap and stylesheet import order.
- frontend/src/App.jsx: application state, navigation and flow coordination.
- frontend/src/components/layout/: shared header and footer.
- frontend/src/features/bookings/: ticket history, cancellation, ticket downloads and booking helpers.
- frontend/src/features/organizer/: organizer statistics and guest management.
- frontend/src/features/profile/: account profile.
- frontend/src/services/api.js: authenticated API transport and authentication requests.
- frontend/src/config/: local fallback event images.
- frontend/src/utils/: shared display formatters.
- frontend/src/styles/: base styles, visual refinements and feature styles, imported in that order.
- frontend/public/events/: event photos and source attribution.

## Supporting files

- scripts/: sample data tools, cover updates and existing verification scripts. Seed/update scripts change local demo data; run intentionally.
- docs/: project documentation.
- pom.xml: Java dependencies and build.
- frontend/package.json and package-lock.json: frontend dependencies and repeatable installation.
- start-backend.ps1: local packaged-backend launcher.
- docker-compose.yml: local MySQL service.
- data/, target/, frontend/dist/, node_modules/ and .m2/: local/generated files excluded from Git.

## Formatting

Run npm run format from frontend/ to format React, CSS and Java sources. Run npm run format:check to check formatting without changing files. Prettier and its Java plugin are development-only tools. The root .editorconfig defines UTF-8, spaces and line endings.

Keep API paths, Java package names and database entity mappings stable when moving presentation code. No database reset or migration is required for this reorganization.
