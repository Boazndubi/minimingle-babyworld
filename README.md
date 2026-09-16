# MiniMingle BabyWorld

A full-stack e-commerce platform for baby products, built as a monorepo with a customer-facing storefront, an admin dashboard, and a shared backend API.

## Overview

MiniMingle BabyWorld lets customers shop for baby products online with M-Pesa and card payments (via Pesapal), track orders, and leave reviews — while admins manage inventory, orders, promotions, and delivery pricing from a dedicated dashboard.

## Project Structure

This repo contains three applications:

```
minimingle-babyworld/
├── store/       # Customer-facing storefront (Next.js)
├── admin/       # Admin dashboard (React + Vite)
└── backend/     # REST API (Node.js + Express + Prisma)
```

## Tech Stack

- **Frontend (store):** Next.js, React, Tailwind CSS, Framer Motion
- **Admin dashboard:** React, Vite, TanStack Query, Tailwind CSS
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL (hosted on Neon)
- **Payments:** M-Pesa (Daraja API), Pesapal (card payments)
- **Deployment:** Vercel (frontend/admin), Render (backend)

## Features

- Product catalog with categories, search, and milestone-based filtering
- Cart, checkout, and order tracking
- M-Pesa STK push and Pesapal card payments
- Coupon codes and promotions
- Admin dashboard: sales analytics, order management, inventory, user roles
- Point-of-sale (POS) mode for in-store transactions
- Admin-managed delivery zone pricing
- SMS and email order notifications

## Getting Started

### Prerequisites

- Node.js (v20+)
- A PostgreSQL database (e.g. a free Neon project)

### 1. Clone the repo

```bash
git clone https://github.com/Boazndubi/minimingle-babyworld.git
cd minimingle-babyworld
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your DATABASE_URL, JWT_SECRET, M-Pesa/Pesapal keys, etc.
npx prisma migrate deploy
npm run dev
```

### 3. Set up the admin dashboard

```bash
cd admin
npm install
cp .env.example .env
npm run dev
```

### 4. Set up the storefront

```bash
cd store
npm install
cp .env.example .env
npm run dev
```

## Screenshots

<!--
Add screenshots here.
-->



## License

This project was built as an e-commerce system for a baby products shop, MiniMingle BabyWorld.

## Author

Built by **Boaz Ndubi** ([@Boazndubi](https://github.com/Boazndubi))
