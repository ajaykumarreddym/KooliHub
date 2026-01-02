# KooliHub Development Rules Index

This directory contains comprehensive development rules and guidelines for the KooliHub project. These rules ensure consistency, scalability, and maintainability across all features.

## 📚 Rule Files Overview

### Core Rules (Start Here)
| File | Description | Priority |
|------|-------------|----------|
| **[design-system-rules.mdc](./design-system-rules.mdc)** | Master design system & architecture guide | ⭐⭐⭐ |
| **[comprehensive-project-rules.mdc](./comprehensive-project-rules.mdc)** | Complete project rules with all categories | ⭐⭐⭐ |
| **[project-structure.mdc](./project-structure.mdc)** | Project organization and folder structure | ⭐⭐⭐ |

### Architecture & Scalability
| File | Description |
|------|-------------|
| [scalability-architecture.mdc](./scalability-architecture.mdc) | Multi-tenant scalability, caching, performance |
| [trip-booking-architecture.mdc](./trip-booking-architecture.mdc) | Clean Architecture example implementation |
| [database-supabase.mdc](./database-supabase.mdc) | Database schema, queries, RLS policies |

### Domain & Business Logic
| File | Description |
|------|-------------|
| [business-domain.mdc](./business-domain.mdc) | Business model, offering types, workflows |
| [admin-system.mdc](./admin-system.mdc) | Admin panel and service management |
| [dynamic-attribute-system.md](./dynamic-attribute-system.md) | Attribute inheritance system |

### Development Guidelines
| File | Description |
|------|-------------|
| [development-guidelines.mdc](./development-guidelines.mdc) | General development practices |
| [api-backend.mdc](./api-backend.mdc) | Server API development guidelines |
| [ui-components.mdc](./ui-components.mdc) | UI component development |
| [routing-pages.mdc](./routing-pages.mdc) | React Router 6 routing |
| [state-management.mdc](./state-management.mdc) | State management patterns |
| [testing-quality.mdc](./testing-quality.mdc) | Testing standards |

### Operations
| File | Description |
|------|-------------|
| [deployment-production.mdc](./deployment-production.mdc) | Production deployment guide |
| [context-sync-enforcement.mdc](./context-sync-enforcement.mdc) | Context synchronization |
| [no-summary-files.mdc](./no-summary-files.mdc) | Avoid summary file generation |

### Tools Integration
| File | Description |
|------|-------------|
| [byterover-rules.mdc](./byterover-rules.mdc) | ByteRover MCP integration |

---

## 🚀 Quick Start Guide

### For New Feature Development
1. Read **[design-system-rules.mdc](./design-system-rules.mdc)** first
2. Follow the Clean Architecture pattern from **[trip-booking-architecture.mdc](./trip-booking-architecture.mdc)**
3. Check **[business-domain.mdc](./business-domain.mdc)** for business rules

### For UI Development
1. Start with **[ui-components.mdc](./ui-components.mdc)**
2. Use tokens from **[design-system-rules.mdc](./design-system-rules.mdc)**
3. Follow atomic design in `client/components/`

### For Database Changes
1. Read **[database-supabase.mdc](./database-supabase.mdc)**
2. Create migrations in `supabase/migrations/`
3. Update types in `shared/api.ts`

### For Admin Features
1. Follow **[admin-system.mdc](./admin-system.mdc)**
2. Use service-oriented organization
3. Place pages in `client/pages/admin/`

---

## 📁 Project Architecture

```
client/
├── components/
│   ├── ui/           # Radix UI primitives (51 components)
│   ├── admin/        # Admin-specific components
│   ├── trip-booking/ # Feature components (atomic design)
│   │   ├── atoms/
│   │   ├── molecules/
│   │   └── organisms/
│   └── layout/       # Layout components
├── contexts/         # React Contexts
├── hooks/            # Custom hooks
├── domain/           # Clean Architecture - Business logic
│   ├── entities/
│   ├── repositories/
│   └── services/
├── infrastructure/   # External implementations
├── lib/              # Utilities
└── pages/            # Route components

server/
├── index.ts          # Express setup
├── routes/           # API handlers
└── lib/              # Server utilities

shared/
└── api.ts            # Shared TypeScript types
```

---

## 🎨 Design System Quick Reference

### Colors (HSL in CSS Variables)
```css
--primary: 48 95% 63%;      /* Brand yellow */
--secondary: 210 40% 96.1%; /* Light gray */
--destructive: 0 84.2% 60.2%; /* Error red */
--muted: 210 40% 96.1%;
--accent: 210 40% 96.1%;
```

### Typography
- Font: Plus Jakarta Sans, Inter, system-ui
- Headings: `text-4xl` → `text-xl`
- Body: `text-base`, `text-sm`, `text-xs`

### Spacing
- Micro: `p-1`, `p-2`
- Small: `p-3`, `p-4`
- Medium: `p-6`, `p-8`
- Large: `p-12`, `p-16`

### Border Radius
- `rounded-sm`: 8px
- `rounded-md`: 10px
- `rounded-lg`: 12px (default)
- `rounded-full`: circle

---

## 🔧 Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm typecheck        # TypeScript check
pnpm test             # Run tests

# Build
pnpm build            # Production build

# Package Management
pnpm add package      # Add dependency
pnpm add -D package   # Add dev dependency
```

---

## 📋 Feature Development Checklist

- [ ] Domain entities in `client/domain/entities/`
- [ ] Repository interfaces in `client/domain/repositories/`
- [ ] Infrastructure in `client/infrastructure/`
- [ ] Custom hooks in `client/hooks/{feature}/`
- [ ] Components (atoms → molecules → organisms)
- [ ] Types in `shared/api.ts`
- [ ] Database migrations if needed
- [ ] Routes in `App.tsx`
- [ ] Tests

---

**Last Updated**: December 2025
