# LocalTix

A local events ticket booking project built with Spring Boot, Spring Data JPA, relational storage, JWT authentication, and a React single-page frontend. Customers can discover events and book up to 10 tickets per order. Every admission ticket gets a unique, signed QR code. Organizers can create events, review bookings, and simulate door check-in by scanning each QR payload.

## Code organization

See [Project structure](docs/PROJECT_STRUCTURE.md) for the backend packages, frontend feature folders, and formatting commands.

## Stack

- Java 17, Spring Boot 3, Spring Web, Spring Data JPA, Spring Security, Bean Validation
- Persistent local H2 by default; MySQL and PostgreSQL are also supported
- React 18, Vite, lucide-react, qrcode.react
- JWT bearer tokens and BCrypt password hashing

## Start the API

Install Java 17+ and Maven. For persistent local storage with seeded events and demo accounts, from the project root run:

```powershell
$env:SPRING_PROFILES_ACTIVE="h2"; mvn spring-boot:run
```

Or start the included MySQL service with `docker compose up -d`, then start the API:

```powershell
$env:SPRING_PROFILES_ACTIVE="mysql"
mvn spring-boot:run
```

The local `h2` profile saves accounts, events, bookings and check-ins in `data/localtix.mv.db`. Always start from the project root so the same database is used. Keep the `data` directory; back it up with the backend stopped. An older running in-memory H2 session is not automatically migrated into this file database.

For the packaged persistent backend, run `powershell -ExecutionPolicy Bypass -File .\start-backend.ps1`. This launcher uses the project directory for storage and reports an occupied port instead of starting a duplicate server.

A separate updated build is available as `target/localtix-persistent.jar` so the already running JAR does not need to be overwritten. When ready to replace the existing backend, stop it and run `java -jar target/localtix-persistent.jar --spring.profiles.active=h2`. This starts persistent storage; it does not import records from the old in-memory session. Normal `mvn package` builds still use `target/localtix-1.0.0.jar`.

The API listens on `http://localhost:8080`. Set credentials as needed:

```sh
DB_URL=jdbc:mysql://localhost:3306/localtix
DB_USER=root
DB_PASSWORD=your-password
JWT_SECRET=replace-with-a-long-random-secret-value
QR_SECRET=replace-with-another-long-random-secret-value
```

For PostgreSQL, activate the `postgres` profile and set `DB_URL=jdbc:postgresql://localhost:5432/localtix`, `DB_USER`, and `DB_PASSWORD`. Both JDBC drivers are included. Hibernate uses `ddl-auto=update` for this student project; use migrations and a production schema strategy before deployment.

### Windows quick start when `mvn` is not recognized

If the packaged JAR already exists in `target`, Maven is not needed to start the API:

```powershell
cd "C:\Users\devanshu\Downloads\project ip"
$env:SPRING_PROFILES_ACTIVE = "h2"
java -jar .\target\localtix-1.0.0.jar
```

If the JAR does not exist yet, install Apache Maven and add its `bin` folder to `PATH`, then run the Maven command above from the project root. You can confirm the tools are available with `java -version` and `mvn -version`.

## Start the frontend

### View the local database

With the H2 backend running, open `http://localhost:8080/h2-console/` on the same computer. Use driver `org.h2.Driver`, JDBC URL `jdbc:h2:file:./data/localtix`, username `sa`, and leave the password empty. The console is enabled only for the H2 profile and accepts only loopback requests.

Example read queries: `SELECT * FROM BOOKINGS;`, `SELECT * FROM TICKETS;`, `SELECT * FROM EVENTS;`, and `SELECT ID, NAME, EMAIL, ROLE FROM USERS;`.

### Frontend commands

```sh
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). If 5173 is busy, Vite chooses another port; local localhost ports are allowed by the development CORS configuration. Set `VITE_API_URL` if the API is hosted elsewhere (the default is `http://localhost:8080/api`). Set the API's `FRONTEND_URL` for a non-localhost deployment.

## Roles and flow

The H2 demo profile seeds these accounts on first start:

- Organizer: `organizer@demo.com` / `Organizer@123`
- Customer: `customer@demo.com` / `Customer@123`

Register as **A curious local** to browse and book. Register as **An event organizer** to create events, see bookings for your events, and scan tickets. Passwords are stored as BCrypt hashes. Send `Authorization: Bearer <token>` on authenticated API requests.

1. Register or log in at `/api/auth/register` or `/api/auth/login`.
2. Browse `GET /api/events`; organizers create events with `POST /api/events`.
3. Customers create a booking with `POST /api/bookings` and `{ "eventId": 1, "quantity": 2 }`.
4. A booking creates one admission ticket for each quantity selected. Each ticket gets a unique QR payload signed with `QR_SECRET`.
5. Customers can cancel confirmed bookings before the event starts; the system releases their quantity back to capacity and invalidates those ticket codes.
6. Organizers paste the QR payload into the scan simulation. The API checks its HMAC signature, locks the ticket during validation, checks that the ticket belongs to one of their events, and records one-time entry. A second scan reports that the ticket was already checked in.

## API overview

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | Public | Create account / get JWT |
| GET, PUT | `/api/profile` | Signed in | Read account details or update the display name with `{ "name": "Your name" }` |
| GET | `/api/events`, `/api/events/{id}` | Public | Discover events |
| GET | `/api/events/mine` | Organizer | Organizer's events |
| POST, PUT, DELETE | `/api/events[/{id}]` | Organizer | Manage own events |
| POST | `/api/bookings` | Customer | Book tickets and issue unique QR codes per admission |
| GET | `/api/bookings/mine` | Signed in | Customer booking history |
| DELETE | `/api/bookings/{id}` | Customer | Cancel own upcoming booking and release tickets |
| GET | `/api/bookings/organizer` | Organizer | Guest list for own events |
| POST | `/api/check-ins/scan` | Organizer | Validate signed ticket QR and record one-time entry |

## Domain entities

`User` (customer or organizer), `Event`, `Booking`, `Ticket` (one per admission), and `CheckIn` (one-time entry record). Inventory is locked during booking to prevent concurrent requests from overselling an event. Each ticket has an unguessable code and a signed QR payload; a check-in is tied to a single ticket and its event organizer.

## API verification

The regression script creates temporary accounts, events, bookings and check-ins. Run it against a separate H2 demo instance, not a database containing real bookings:

```powershell
java -jar .\target\localtix-persistent.jar --spring.profiles.active=verification --server.port=8082
```

In another terminal in the project root:

```powershell
node scripts/verify-api.mjs
node scripts/verify-features.mjs
```

The script verifies 56 checks covering authentication, profile updates, organizer ownership, event management, quantities and totals, QR signatures, duplicate entry, cancellation, concurrent booking limits, concurrent cancellation/check-in, and CORS. Stop this H2 server afterward to discard the temporary data.

## Scope

Tickets can be downloaded from their booking as self-contained HTML files with all admission QR codes. Open the file offline and use **Print / Save as PDF** for a PDF copy. Cancelled bookings cannot generate new downloads, and previously downloaded codes are still checked against the live ticket status at entry.

My tickets groups bookings into Upcoming, Past and Cancelled and displays check-in progress. Organizer dashboards include confirmed bookings, tickets sold, upcoming remaining places, check-in totals, booking value, guest search, event/status filters and CSV export of the filtered guest list. Booking value is a reservation total, not payment revenue.

This is an educational project: payment processing, email delivery, production migrations, rate limiting, and physical seat maps are outside its scope. “Seat selection” is implemented as quantity selection from event capacity because no seat map/layout was specified. The entry scanner is a check-in simulation: organizers paste the QR text into the scan field.
