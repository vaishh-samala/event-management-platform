# Event Management Platform

A full-stack event discovery and management application built with React, Vite, Express, and PostgreSQL.

## Features
- Browse and search upcoming events by category and date
- Create, edit, and cancel events
- Register for events and manage registrations
- Ticket tiers and capacity checks
- Event agendas/schedules
- In-app notifications for registration and event updates
- Organizer dashboard with registrations and attendance counts
- Responsive interface and demo seed data

## Requirements
Node.js 18+, npm, and PostgreSQL 14+.

## 1. Create the database
```bash
createdb event_management
psql -d event_management -f backend/schema.sql
psql -d event_management -f backend/seed.sql
```

## 2. Configure and start the API
```bash
cd backend
cp .env.example .env
# Edit .env and set your PostgreSQL username/password
npm install
npm run dev
```
API defaults to http://localhost:5003.

## 3. Start the frontend in another terminal
```bash
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite, usually http://localhost:5173.

## Notes
- Registrations are demo registrations; payment processing is not connected.
- Notifications are stored in the database and displayed in the app; email/SMS delivery requires a provider integration.
- This is a portfolio/learning project. Add authentication and role-based access control before production use.
