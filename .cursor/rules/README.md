# KooliHub Cursor Rules

This directory contains comprehensive Cursor Rules for the KooliHub multi-vendor super app project. These rules provide AI assistants with detailed guidance about the project structure, development patterns, and business logic.

## Rule Files Overview

### Core Architecture Rules

1. **[project-structure.mdc](./project-structure.mdc)** *(Always Applied)*
   - Complete project overview and directory structure
   - Tech stack and key configuration files
   - Development commands and path aliases

2. **[development-guidelines.mdc](./development-guidelines.mdc)** *(Always Applied)*
   - General development principles and standards
   - Package management (PNPM) guidelines
   - API endpoint strategy and TypeScript configuration

### Component & Frontend Rules

3. **[ui-components.mdc](./ui-components.mdc)** *(TypeScript/TSX files)*
   - UI component development with Radix UI
   - TailwindCSS styling system
   - Component library usage and accessibility

4. **[routing-pages.mdc](./routing-pages.mdc)** *(Pages & App.tsx)*
   - React Router 6 SPA routing system
   - Page structure and route management
   - Navigation and protection patterns

5. **[state-management.mdc](./state-management.mdc)** *(Context & Hooks)*
   - React Context patterns and usage
   - Custom hooks development
   - React Query integration

### Backend & Data Rules

6. **[api-backend.mdc](./api-backend.mdc)** *(Server & Shared files)*
   - Express API development guidelines
   - Shared type system management
   - Server endpoint patterns

7. **[database-supabase.mdc](./database-supabase.mdc)** *(Database operations)* **[CLEAN ARCHITECTURE]**
   - Supabase PostgreSQL guidelines
   - Clean, modern schema without backward compatibility
   - Unified offering model and hierarchical categories
   - Multi-tenant, multi-vendor architecture with RLS

### Specialized System Rules

8. **[admin-system.mdc](./admin-system.mdc)** *(Admin components & pages)*
   - Admin panel development guidelines
   - Multi-vendor management features
   - Access control and permissions

9. **[business-domain.mdc](./business-domain.mdc)** *(Business logic guidance)* **[UPDATED]**
   - KooliHub business model and domain logic
   - Multi-vendor marketplace operations (redesigned for multi-tenant)
   - Service types and dynamic attribute system

### Quality & Deployment Rules

10. **[testing-quality.mdc](./testing-quality.mdc)** *(Test files)*
    - Vitest testing framework usage
    - Quality assurance standards
    - Performance and security testing

11. **[deployment-production.mdc](./deployment-production.mdc)** *(Production guidance)*
    - Build and deployment strategies
    - Environment configuration
    - Production optimization and scaling

## How to Use These Rules

### Always Applied Rules
- `project-structure.mdc` and `development-guidelines.mdc` are automatically applied to every AI interaction
- These provide essential context about the project architecture

### File-Specific Rules
- Rules with `globs` patterns are automatically applied when working with matching file types
- For example, `ui-components.mdc` applies to all `.tsx` and `.ts` files

### Manual Rules
- Rules with descriptions can be manually referenced when needed
- Use `/apply rule` command in Cursor to manually apply specific rules

## Rule Categories

### 🏗️ Architecture & Structure
- Project structure and organization
- Development guidelines and standards
- Package management and configuration

### 🎨 Frontend Development
- UI components and styling
- Routing and navigation
- State management patterns

### ⚙️ Backend Development
- API development and shared types
- Database operations and schema
- Real-time features and integrations

### 👥 Business & Domain
- Multi-vendor marketplace logic
- Admin system and permissions
- Business rules and workflows

### 🧪 Quality & Production
- Testing strategies and standards
- Deployment and production setup
- Performance and security guidelines

## Recent Major Updates

### Database Redesign & Cleanup (December 2024)
The database schema has been completely redesigned and cleaned up to support:

#### **Unified Offering Model**
- Single `offerings` table replacing the monolithic `products` table
- Support for all service/product types (goods, rides, handyman, bookings, etc.)
- Dynamic offering variants and attributes

#### **Multi-Tenant Architecture**
- Complete tenant isolation with Row Level Security (RLS)
- Support for multiple vendors within each tenant
- Hierarchical role-based access control

#### **Advanced Features**
- **Hierarchical Categories**: PostgreSQL `ltree` extension for unlimited category depth
- **Dynamic Attributes**: Flexible attribute registry without schema changes
- **Multi-Location Merchants**: Support for vendors with multiple outlets/stores
- **Service Zone Management**: Pincode/zone-based service availability with scheduling

#### **Clean Architecture (Final)**
- **Removed Backward Compatibility**: Clean slate approach, no legacy code
- **Eliminated Legacy Tables**: Removed old `products`, `product_variants`, etc.
- **Modern Schema**: Pure offering-based model optimized for performance
- **Enhanced Functions**: New business logic functions replacing compatibility layers

### Security & Performance Advisory

Based on Supabase security analysis, attention is needed for:

#### **High Priority Security Issues:**
- 🔴 Multiple tables have RLS enabled but no policies defined
- 🔴 Several views use SECURITY DEFINER property (security risk)
- 🔴 Some tables missing RLS entirely (product_variants, inventory_locations, etc.)
- 🟡 Function search paths need to be set for security

#### **Performance Optimizations:**
- ⚡ Many foreign keys lack covering indexes
- ⚡ Multiple permissive RLS policies should be consolidated
- ⚡ Auth function calls in RLS policies need `(select auth.function())` optimization
- ⚡ 100+ unused indexes should be reviewed and potentially removed

## Contributing to Rules

When updating or adding new rules:

1. Follow the established file naming convention
2. Use appropriate frontmatter metadata (`alwaysApply`, `globs`, `description`)
3. Reference files using the `[filename](mdc:path)` format
4. Update this README when adding new rules
5. Ensure rules are specific and actionable
6. Update security and performance recommendations as needed

## Best Practices

- Keep rules focused on specific domains
- Provide concrete examples where possible
- Reference actual project files for context
- Update rules as the project evolves
- Test rules with AI assistants to ensure effectiveness
- Monitor Supabase advisors for security and performance guidance
