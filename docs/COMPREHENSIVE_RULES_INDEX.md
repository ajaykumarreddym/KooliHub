# KooliHub Comprehensive Rules & Guidelines Index
**Generated**: October 22, 2025  
**Version**: 1.0.0  
**Status**: ACTIVE

---

## Overview

This document serves as the master index for all project rules, guidelines, standards, and architectural decisions for the KooliHub multi-vendor super app marketplace.

**Purpose**: Ensure every change, update, or new functionality automatically aligns with established rules and maintains consistency across the entire codebase.

---

## Rule Categories

### 1. **Comprehensive Project Rules**
**File**: `.cursor/rules/comprehensive-project-rules.mdc`  
**Status**: ✅ Active  
**Last Updated**: October 22, 2025

**Covers**:
- Project Development Rules (R-DEV-001 to R-DEV-005)
- Code Quality & Standards (R-QUALITY-001 to R-QUALITY-005)
- Testing Rules (R-TEST-001 to R-TEST-004)
- Scalability Rules (R-SCALE-001 to R-SCALE-005)
- Performance Rules (R-PERF-001 to R-PERF-004)
- Security Rules (R-SEC-001 to R-SEC-005)
- Database Rules (R-DB-001 to R-DB-005)
- API Design Rules (R-API-001 to R-API-005)
- Business Logic Rules (R-BIZ-001 to R-BIZ-007)
- Deployment Rules (R-DEPLOY-001 to R-DEPLOY-005)
- Context Management Rules (R-CTX-001 to R-CTX-004)
- Error Handling Rules (R-ERROR-001 to R-ERROR-004)

**Total Rules**: 53+

---

### 2. **Scalability & Architecture Rules**
**File**: `.cursor/rules/scalability-architecture.mdc`  
**Status**: ✅ Active  
**Last Updated**: October 22, 2025

**Covers**:
- Multi-Tenant Scalability (MT-001 to MT-002)
- Database Scalability (DB-SCALE-001 to DB-SCALE-003)
- Caching Strategy (CACHE-001 to CACHE-002)
- Real-Time Scalability (RT-001 to RT-002)
- Service Area Scalability (SA-001 to SA-002)
- Attribute System Scalability (ATTR-001 to ATTR-002)
- File Upload Scalability (UPLOAD-001 to UPLOAD-002)
- API Scalability (API-SCALE-001 to API-SCALE-002)
- Monitoring & Observability (MON-001 to MON-002)
- Horizontal Scaling Preparation (HSCALE-001 to HSCALE-002)
- Archival & Data Lifecycle (ARCH-001 to ARCH-002)

**Total Rules**: 18+

---

### 3. **Context Synchronization & Rule Enforcement**
**File**: `.cursor/rules/context-sync-enforcement.mdc`  
**Status**: ✅ Active  
**Last Updated**: October 22, 2025

**Covers**:
- Rule Enforcement Principles (ENFORCE-001 to ENFORCE-002)
- File Change Triggers (automatic context updates)
- Context Synchronization Rules (SYNC-001 to SYNC-003)
- Automated Checks (CHECK-001 to CHECK-003)
- Context Update Checklists
- Continuous Improvement (IMPROVE-001 to IMPROVE-002)
- Emergency Rule Updates (EMERGENCY-001 to EMERGENCY-002)
- Rule Enforcement Automation (AUTO-001 to AUTO-002)

**Total Rules**: 12+

---

### 4. **Existing Project-Specific Rules**

#### Admin System Rules
**File**: `.cursor/rules/admin-system.mdc`  
**Covers**: Admin panel development and multi-vendor management

#### API Backend Rules
**File**: `.cursor/rules/api-backend.mdc`  
**Covers**: Backend API development and shared type management

#### Business Domain Rules
**File**: `.cursor/rules/business-domain.mdc`  
**Covers**: KooliHub business domain logic and multi-vendor marketplace guidelines

#### Database & Supabase Rules
**File**: `.cursor/rules/database-supabase.mdc`  
**Covers**: Supabase database operations and schema management

#### Deployment & Production Rules
**File**: `.cursor/rules/deployment-production.mdc`  
**Covers**: Production deployment guidelines and environment configuration

#### Routing & Pages Rules
**File**: `.cursor/rules/routing-pages.mdc`  
**Covers**: React Router 6 SPA routing guidelines and page structure

#### State Management Rules
**File**: `.cursor/rules/state-management.mdc`  
**Covers**: React state management patterns and context usage

#### Testing & Quality Rules
**File**: `.cursor/rules/testing-quality.mdc`  
**Covers**: Testing standards and quality assurance guidelines

#### UI Components Rules
**File**: `.cursor/rules/ui-components.mdc`  
**Covers**: UI component development guidelines and Radix UI usage

---

## Project Architecture Summary

### Technology Stack

**Frontend**:
- React 18.3.1 + TypeScript
- Vite build tool
- React Router 6 (SPA mode)
- TailwindCSS 3
- Radix UI (50 pre-built components)
- React Query (@tanstack/react-query)

**Backend**:
- Express 5.1.0 + TypeScript
- Integrated with Vite dev server
- 58+ API endpoints

**Database**:
- Supabase (PostgreSQL)
- 50+ tables
- Row Level Security (RLS)
- Event sourcing & audit logs
- PostGIS for spatial queries

**State Management**:
- React Context (4 providers)
- React Query
- Real-time subscriptions

**Authentication**:
- Supabase Auth
- JWT tokens
- Multi-role support

**Payments**:
- Stripe integration
- Razorpay integration

**Notifications**:
- Firebase Cloud Messaging (FCM)

**Package Manager**:
- PNPM 10.14.0 (MANDATORY)

---

## Project Structure

```
koolihub/
├── client/                   # Frontend (React SPA)
│   ├── pages/               # 51 route components
│   ├── components/          # 59+ reusable components
│   │   ├── ui/             # 50 Radix UI components
│   │   ├── admin/          # 27 admin components
│   │   ├── auth/           # 3 auth components
│   │   └── common/         # 6 shared components
│   ├── contexts/            # 4 React contexts
│   ├── hooks/              # 11 custom hooks
│   └── lib/                # 23 utility files
│
├── server/                  # Backend (Express)
│   ├── index.ts            # Main server setup
│   ├── routes/             # 12 API route files
│   └── lib/                # 2 server utilities
│
├── shared/                  # Shared types
│   └── api.ts              # 907 lines of TypeScript types
│
├── supabase/               # Database
│   └── migrations/         # 6 migration files
│
├── .cursor/rules/          # Project rules (THIS SYSTEM)
│   ├── comprehensive-project-rules.mdc
│   ├── scalability-architecture.mdc
│   ├── context-sync-enforcement.mdc
│   └── [9 existing rule files]
│
└── [Configuration files]
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── package.json
    └── netlify.toml
```

---

## Database Architecture

### Core Schema (50+ tables)

**Multi-Tenancy** (2 tables):
- `tenants` - Multi-tenant foundation
- Tenant types: marketplace, vendor, franchise, white_label

**Unified Offerings** (4 tables):
- `offerings` - Replaces products table
- `offering_variants` - Product variations
- `offering_attributes` - Dynamic attribute values
- `attribute_registry` - Attribute definitions

**Vendors & Merchants** (3 tables):
- `vendors` - Vendor management
- `vendor_users` - Vendor-user associations
- `merchants` - Physical store locations

**Inventory** (2 tables):
- `merchant_inventory` - Location-specific inventory
- `inventory_locations` - Warehouse/store locations

**Categories** (1 table):
- `categories` - Hierarchical categories (ltree support)

**Pricing** (3 tables):
- `price_lists` - Zone/vendor pricing
- `price_list_items` - Variant pricing
- `service_area_products` - Location-based product mapping

**Geography** (4 tables):
- `service_zones` - Geographic zones
- `serviceable_areas` - Pincode coverage
- `zone_service_availability` - Service availability
- `service_area_categories` - Category-area mapping

**Orders** (7 tables):
- `orders` - Main order table
- `order_items` - Line items
- `order_workflow` - Status history
- `order_addresses` - Shipping/billing
- `order_adjustments` - Discounts/taxes
- `order_promotions` - Applied promotions
- `order_delivery` - Delivery tracking

**Service Attributes** (5 tables):
- `service_types` - Service definitions
- `service_field_definitions` - Service-specific fields
- `service_attribute_config` - Service-level configs
- `category_attribute_config` - Category-level configs
- `default_mandatory_fields` - Required fields

**Audit & Events** (2 tables):
- `domain_events` - Event sourcing
- `audit_logs` - Audit trail

**Admin Features** (8 tables):
- `coupons`, `banners`, `notifications`
- `payments`, `payment_transactions`, `payment_methods`
- `app_config`, `smtp_config`, `social_config`

**Internationalization** (3 tables):
- `translations` - Multi-language support
- `locales` - Supported languages
- `locale_settings` - Locale formatting

---

## Key Business Concepts

### Multi-Vendor Architecture

**Vendor Hierarchy**:
1. Marketplace Tenant (KooliHub platform)
2. Vendor Tenants (individual stores)
3. Franchise Tenants
4. White-label Tenants

### Unified Offering Model

**Offering Types**:
- product - Physical goods
- service - Professional services
- ride - Transportation
- delivery - Courier services
- booking - Reservations
- rental - Equipment rental
- subscription - Recurring services
- digital - Digital products

### Attribute Inheritance System

**Hierarchy**: Default → Service → Category → Subcategory

**Levels**:
0. Mandatory System Fields (always present, locked)
1. Service-Level Attributes (service-specific)
2. Category-Level Attributes (category overrides)
3. Subcategory-Level Attributes (most specific)

**Database Function**: `get_product_form_attributes_v2()`

### Service Area Product Mapping

**Features**:
- Location-specific pricing
- Location-specific inventory
- Location-specific availability
- Featured products per location
- Scheduled availability

**Tables**: `service_area_products`, `service_area_categories`

---

## Development Workflow

### For New Features

1. ✅ Check applicable rules
2. ✅ Design database schema (if needed)
3. ✅ Create migration files
4. ✅ Update TypeScript types (`shared/api.ts`)
5. ✅ Create API endpoints (if needed)
6. ✅ Create React components
7. ✅ Add to Context (if global state)
8. ✅ Implement error handling
9. ✅ Add loading states
10. ✅ Write tests
11. ✅ Update documentation
12. ✅ Code review
13. ✅ Deploy

### For Bug Fixes

1. ✅ Identify root cause
2. ✅ Check if rules need updating
3. ✅ Fix the issue
4. ✅ Add regression test
5. ✅ Update docs (if behavior changed)
6. ✅ Verify no other files affected

### For Refactoring

1. ✅ Ensure backward compatibility
2. ✅ Update all references
3. ✅ Update types
4. ✅ Update tests
5. ✅ Update documentation
6. ✅ Run full test suite

---

## Auto-Sync Enforcement

### Automatic Context Updates

When you make changes, the system **automatically updates**:

**For React Components**:
- TypeScript prop interfaces
- Error handling
- Accessibility attributes
- Test files
- Component documentation

**For API Endpoints**:
- Shared types (`shared/api.ts`)
- Route handlers
- Server registration
- Authentication middleware
- Integration tests
- API documentation

**For Database Changes**:
- Migration files
- TypeScript types
- RLS policies
- Database documentation
- Rollback scripts

**For Business Logic**:
- Related rules
- Documentation
- Tests
- Type definitions

---

## Rule Compliance

### Enforcement Status
- **Active**: All rules are active and must be followed
- **Automated Checks**: Implemented via pre-commit hooks and CI/CD
- **Review Cycle**: Monthly for relevance, quarterly for updates

### Compliance Levels
- **CRITICAL**: Must be followed, blocking
- **HIGH**: Must be followed, non-blocking
- **MEDIUM**: Should be followed
- **LOW**: Nice to have

### Violation Handling
1. Automated checks catch violations
2. Code review ensures compliance
3. Documentation updates if needed
4. Rule updates if pattern changes

---

## Next Steps

### Immediate Actions
- [ ] Implement pre-commit hooks for rule checking
- [ ] Set up CI/CD pipeline with rule validation
- [ ] Create code generation templates
- [ ] Set up automated testing

### Short Term (1-3 months)
- [ ] Add rate limiting to APIs
- [ ] Implement comprehensive monitoring
- [ ] Migrate file uploads to cloud storage
- [ ] Add request validation middleware

### Long Term (6-12 months)
- [ ] Implement database sharding strategy
- [ ] Set up distributed caching (Redis)
- [ ] Implement CDN for static assets
- [ ] Scale horizontally

---

## Maintenance Schedule

### Weekly
- Review new rules added
- Check rule compliance in PRs

### Monthly
- Review rules for relevance
- Gather team feedback
- Update documentation

### Quarterly
- Major rules review
- Update templates
- Archive obsolete rules

### Annually
- Complete rules audit
- Major version update
- Architecture review

---

## Resources

### Documentation Files
- `COMPREHENSIVE_PROJECT_AUDIT_REPORT.md` - Full project audit
- `PROJECT_FUNCTIONALITY_MAP.md` - Complete functionality documentation
- `SUPER_APP_DATABASE_REDESIGN_COMPLETE.md` - Database architecture
- `ATTRIBUTE_INHERITANCE_SYSTEM_GUIDE.md` - Attribute system guide
- Multiple implementation summaries

### Configuration Files
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - TailwindCSS configuration
- `package.json` - Dependencies
- `netlify.toml` - Deployment configuration

### Key Source Files
- `shared/api.ts` - 907 lines of TypeScript types
- `client/App.tsx` - Application entry point
- `server/index.ts` - Server entry point
- `client/lib/supabase.ts` - Supabase client configuration

---

## Support & Questions

For questions about rules:
1. Check the relevant rule file
2. Review related documentation
3. Search for similar patterns in codebase
4. Consult this index

For rule updates:
1. Document the change
2. Update affected rule files
3. Increment version number
4. Update this index

---

**Index Version**: 1.0.0  
**Last Updated**: October 22, 2025  
**Next Review**: November 22, 2025  
**Status**: ✅ ACTIVE  
**Compliance**: MANDATORY

