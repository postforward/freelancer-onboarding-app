# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Start development server with hot module replacement
npm run dev

# Build for production (TypeScript check + Vite build)
npm run build

# Run ESLint to check code quality
npm run lint

# Preview production build locally
npm run preview
```

## High-Level Architecture

### Project Overview
This is a **Freelancer Onboarding Platform** built with React, TypeScript, and Supabase. It supports multi-tenant organizations and modular platform integrations.

### Core Architecture Patterns

1. **Modular Platform System**
   - Platform modules in `/src/modules/` implement a common interface
   - Each module handles user/group management and permissions
   - Registry pattern in `/src/services/platformModuleRegistry.ts` manages available modules
   - Categories: screen-sharing, file-sharing, collaboration, communication

2. **Multi-Tenant Architecture**
   - Organization-based tenancy with role-based access control
   - Roles: owner, admin, member
   - Context providers in `/src/contexts/` manage tenant state globally

3. **Service Factory Pattern**
   - `/src/services/serviceFactory.ts` switches between mock and real implementations
   - Environment-based toggling via `MOCK_ENABLED` flag
   - Mock services in `/src/services/mock/` for development

4. **State Management**
   - React Context API for global state
   - Key contexts: AuthContext, TenantContext, PlatformContext, FreelancerContext
   - Providers wrap the app in `/src/App.tsx`

### Key Technical Decisions

1. **TypeScript Configuration**
   - Strict mode enabled with comprehensive type checking
   - Project references for different environments (app, node)
   - Module resolution optimized for Vite

2. **Supabase Integration**
   - Authentication, database, and real-time features
   - Database schema in `/supabase/schema.sql`
   - Row-level security for multi-tenancy

3. **Development Workflow**
   - Mock data system for rapid development without backend
   - Debug utilities available via `window.debug` in development
   - Feature flags in `/src/config/environment.ts`

### Testing Infrastructure
- Test framework: Vitest (tests exist but dependency not yet added to package.json)
- Test locations: Module-specific `__tests__` directories
- Comprehensive mocking for platform integrations

### Deployment
- Netlify deployment with serverless functions in `/netlify/functions/`
- Static site generation via Vite
- Environment-based configuration for production