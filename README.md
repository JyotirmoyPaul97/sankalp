# KAUSHAL DRISHTI

### Maharashtra Skill Intelligence & Policy Decision Platform

> **From Labour-Market Evidence to Better Skill Decisions.**
>
> [Your Link Here](https://kaushaldrishti.space-z.ai/)

KAUSHAL DRISHTI is a government decision-support platform designed to connect labour-market evidence with Maharashtra's skill-development ecosystem. This repository contains the Phase 1 build, establishing the foundational architecture and UX for future intelligence modules.

> **⚠️ Demo Environment — Synthetic Data.** All data in this build is synthetic demonstration data. It is **not** actual Maharashtra Government data.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5 (Strict)
- **UI & Styling**: Tailwind CSS 4, shadcn/ui (New York), Lucide React
- **Database & ORM**: Prisma ORM with SQLite
- **State Management**: Zustand (Client) + Custom lightweight `useFetch` hook (Server)
- **Validation**: Zod
- **Authentication**: JWT-style foundation (HMAC-SHA256)
- **Runtime**: Bun

---

## 🚀 Quick Start

Ensure you have [Bun](https://bun.sh/) installed, then run the following commands:

```bash
# 1. Install dependencies
bun install

# 2. Configure environment variables
cp .env.example .env

# 3. Apply database schema
bun run db:push

# 4. Seed synthetic demonstration data
bun run db:seed

# 5. Start the development server
bun run dev
```

Visit `http://localhost:3000` to view the application.

---

## 📂 Repository Structure

```text
├── prisma/               # Prisma schema and seed data
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   ├── components/       # UI primitives (shadcn) and Kaushal platform components
│   ├── hooks/            # Custom React hooks (e.g., useFetch)
│   ├── lib/              # API utilities, auth logic, and DB clients
│   ├── store/            # Zustand global state (auth, navigation)
│   └── types/            # Shared domain types and interfaces
├── docs/                 # Extensive project documentation
├── package.json          # Dependencies and scripts
└── next.config.ts        # Next.js configuration
```

---

## 🔐 Demo Accounts

Use these accounts to test out different roles within the platform:

| Role | Email | Password |
|------|-------|----------|
| State Admin | `admin@kaushal-drishti.demo` | `demo-admin` |
| District Planner | `planner@kaushal-drishti.demo` | `demo-planner` |
| Employer | `employer@kaushal-drishti.demo` | `demo-employer` |
| Training Provider| `provider@kaushal-drishti.demo` | `demo-provider` |

---

## 📖 API & Documentation

The Phase 1 API is located under `/api/v1/*` and supports comprehensive CRUD operations for districts, sectors, skills, and more. 

For full documentation, see the `docs/` folder:
- Architecture: `docs/architecture.md`
- Data Model: `docs/data-model.md`
- API Contract: `docs/api-contract.md`
- Development Guide: `docs/development.md`
