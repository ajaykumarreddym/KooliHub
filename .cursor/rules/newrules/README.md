# KooliHub New Rules - Comprehensive Development Guidelines

## Overview

This directory contains comprehensive rule files for developing KooliHub features with consistency, scalability, and maintainability. These rules cover everything from Figma design integration to state management patterns.

---

## Rules Index

### Design & Styling

| File | Description | Key Topics |
|------|-------------|------------|
| [01-figma-design-integration.mdc](./01-figma-design-integration.mdc) | Figma MCP integration | Design extraction, token mapping, component generation |
| [02-design-tokens.mdc](./02-design-tokens.mdc) | Complete token system | Colors, typography, spacing, effects |
| [07-color-system.mdc](./07-color-system.mdc) | Color management | Semantic colors, service palettes, status colors |

### Code Organization

| File | Description | Key Topics |
|------|-------------|------------|
| [03-typography-strings.mdc](./03-typography-strings.mdc) | Typography & strings | Font styles, UI text, localization prep |
| [04-constants-config.mdc](./04-constants-config.mdc) | Constants & configuration | App config, enums, feature flags |
| [05-utils-helpers.mdc](./05-utils-helpers.mdc) | Utility functions | Formatting, validation, array/object helpers |
| [06-services-architecture.mdc](./06-services-architecture.mdc) | Service layer | API services, Supabase services, external integrations |

### Components & Patterns

| File | Description | Key Topics |
|------|-------------|------------|
| [08-reusable-components.mdc](./08-reusable-components.mdc) | Reusable widgets | Loading, error, empty states, badges, avatars |
| [09-error-handling.mdc](./09-error-handling.mdc) | Error management | Error boundaries, API errors, form errors |
| [10-state-management-patterns.mdc](./10-state-management-patterns.mdc) | State patterns | Context, React Query, local state |

### Best Practices

| File | Description | Key Topics |
|------|-------------|------------|
| [11-no-hardcoding.mdc](./11-no-hardcoding.mdc) | No hardcoding rules | Centralized values, constants, configurations |

---

## Quick Start Guide

### 1. Starting a New Feature

1. **Read the relevant rules** for your feature type
2. **Check existing patterns** in the codebase
3. **Create required files** following the structure guidelines
4. **Use centralized constants** - never hardcode values

### 2. Key File Locations

```
client/lib/
├── constants.ts      # App constants, enums
├── config.ts         # Environment config
├── strings.ts        # UI strings
├── typography.ts     # Typography styles
├── tokens.ts         # Design tokens
├── routes.ts         # Route paths
├── utils.ts          # Core utilities (cn)
├── format-utils.ts   # Formatting helpers
├── date-utils.ts     # Date utilities
├── validation-utils.ts # Validation helpers
├── service-colors.ts # Service palettes
├── status-colors.ts  # Status colors
└── errors.ts         # Error classes
```

### 3. Component Structure

```
client/components/
├── ui/               # Radix-based primitives
├── common/           # Shared components
├── widgets/          # Composed widgets
└── {feature}/        # Feature-specific
    ├── atoms/
    ├── molecules/
    └── organisms/
```

---

## Essential Patterns

### Using Design Tokens

```typescript
// Colors
<div className="bg-primary text-primary-foreground">

// Service colors
import { getServiceColor } from '@/lib/service-colors';
const colors = getServiceColor('grocery');

// Status colors
import { getOrderStatusColor } from '@/lib/status-colors';
const colors = getOrderStatusColor(status);
```

### Using Typography

```typescript
import { HEADINGS, BODY, DATA_TEXT } from '@/lib/typography';

<h1 className={HEADINGS.h1}>Title</h1>
<p className={BODY.description}>Description</p>
<span className={DATA_TEXT.price}>{formatCurrency(price)}</span>
```

### Using Strings (No Hardcoding)

```typescript
import { ACTIONS, MESSAGES, PLACEHOLDERS } from '@/lib/strings';

<Button>{ACTIONS.save}</Button>
<Input placeholder={PLACEHOLDERS.search} />
toast({ title: MESSAGES.success.created });
```

### Using Constants

```typescript
import { PAGINATION, TIMEOUTS, ORDER_STATUS } from '@/lib/constants';

// Pagination
useQuery({ queryKey: ['items', { limit: PAGINATION.defaultPageSize }] });

// Status checks
if (order.status === ORDER_STATUS.DELIVERED) { }

// Timeouts
setTimeout(fn, TIMEOUTS.toast);
```

---

## Checklists

### Before Creating a Component

- [ ] Check if similar component exists in `/components/ui/` or `/components/common/`
- [ ] Identify if it should be a widget, common component, or feature-specific
- [ ] Define TypeScript interface for props
- [ ] Support `className` prop for customization

### Before Adding Styles

- [ ] Check if color exists in design tokens
- [ ] Use semantic colors (`bg-primary`) not raw colors
- [ ] Use typography constants for text styles
- [ ] Avoid arbitrary values (`text-[14px]`)

### Before Adding Strings

- [ ] Add to `lib/strings.ts` instead of hardcoding
- [ ] Use message functions for dynamic text
- [ ] Check existing strings for reuse

### Before Creating Services

- [ ] Place in appropriate folder (`api/`, `supabase/`, `external/`)
- [ ] Use typed responses
- [ ] Handle errors properly
- [ ] Create corresponding React Query hooks

---

## Rule Dependencies

```
Figma Integration → Design Tokens → Color System
                                  → Typography

Constants/Config → Services Architecture → State Management
                                        → Error Handling

Typography/Strings → No Hardcoding → Reusable Components
```

---

## Related Rules

For additional context, see the parent rules directory:

- `../.cursor/rules/design-system-rules.mdc` - High-level design system
- `../.cursor/rules/feature-scaffold-template.mdc` - Feature scaffolding
- `../.cursor/rules/ui-components.mdc` - UI component guidelines
- `../.cursor/rules/state-management.mdc` - State management overview

---

## Contributing

When adding new rules:

1. Follow the existing `.mdc` format
2. Include practical code examples
3. Add DO/DON'T sections
4. Update this README index
5. Reference related files

