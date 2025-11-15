# CloudDesk Backend Server

Backend API for CloudDesk authentication system using Firebase Authentication, JWT, and PostgreSQL.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Configure environment variables in `.env`:
   - Set `JWT_SECRET` (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - Set `DATABASE_URL` with your Supabase PostgreSQL connection string
   - Set Firebase Admin SDK credentials

4. Run database migrations:
   ```bash
   npm run migrate
   ```
   This will create the `approved_users` table and necessary indexes.

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

- `POST /api/auth/login` - Login with Firebase ID token
- `POST /api/auth/verify` - Verify JWT token
- `GET /api/health` - Health check

## Database Migrations

The project uses SQL migration files to manage database schema changes.

### Running Migrations

To run all migrations:
```bash
npm run migrate
```

### Migration Files

Migration files are located in `server/migrations/` and are executed in alphabetical order:
- `001_create_approved_users.sql` - Creates the approved_users table with email index

### Creating New Migrations

1. Create a new SQL file in `server/migrations/` with a numbered prefix (e.g., `002_add_new_table.sql`)
2. Write your SQL statements in the file
3. Run `npm run migrate` to apply the migration

## Project Structure

```
server/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── migrations/      # Database migration scripts
├── routes/          # API routes
├── services/        # Business logic services
├── index.js         # Application entry point
└── package.json     # Dependencies
```
