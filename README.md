# Immune Balance

[![Coverage Status](https://coveralls.io/repos/github/diogoangelim/immune-balance/badge.svg?branch=main&t=now)](https://coveralls.io/github/diogoangelim/immune-balance?branch=main)
[![License: MIT](https://img.shields.io/github/license/diogoangelim/immune-balance?style=flat-square&t=now)](https://github.com/diogoangelim/immune-balance/blob/main/LICENSE)

Immune Balance is a modern Next.js and TypeScript application for managing and analyzing medical reports, signals, and events. It features a robust backend powered by Drizzle ORM and PostgreSQL, and a clean, component-driven frontend.

## Features
- Upload and parse medical reports (PDF, CSV)
- View and filter signals, events, and timelines
- Database management and migrations with Drizzle ORM
- Responsive UI with reusable components
- Unit-tested backend modules for reliability

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- pnpm (or npm/yarn)
- PostgreSQL (v14+)

### Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/immune-balance.git
   cd immune-balance
   ```
2. **Install dependencies:**
   ```sh
   pnpm install
   ```
3. **Configure environment:**
   - Copy `.env.example` to `.env` and set your database connection string and other secrets.

### Database Setup
1. **Start PostgreSQL:**
   ```sh
   brew services start postgresql@14
   ```
2. **Run migrations:**
   ```sh
   pnpm run migrate
   ```

### Running the App
```sh
pnpm run dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

### Running Tests
```sh
pnpm vitest run --coverage
```
All backend modules are covered by unit tests. Coverage is above 90%.

## Project Structure
- `app/` – Next.js pages and API routes
- `backend/` – Database, migrations, and backend logic
- `components/` – Reusable UI components
- `hooks/` – Custom React hooks
- `lib/` – Shared utilities
- `public/` – Static assets
- `styles/` – Global and component styles

## Contributing
Pull requests and issues are welcome! Please follow conventional commit messages and ensure all tests pass before submitting.

## License
MIT

---
For more details, see the code comments and individual module documentation.
