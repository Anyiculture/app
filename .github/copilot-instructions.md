# AnYiculture - AI Coding Assistant Instructions

## Project Overview
AnYiculture is a comprehensive bilingual (English/Chinese) SaaS platform for professionals in China, featuring modular architecture with 7 core modules: Jobs, Marketplace, Events, Education, Visa, Au Pair, and Community. Built with React 18 + TypeScript + Supabase + Tailwind CSS.

## Architecture Patterns

### Modular Design
- **Independent Modules**: Each module (Jobs, Marketplace, Events, etc.) operates semi-independently with shared infrastructure
- **Shared Services**: Common services like auth, i18n, personalization, messaging span all modules
- **Database Schema**: Complex PostgreSQL schema with Row Level Security (RLS) policies
- **Service Layer**: Dedicated service files (`src/services/`) for each module handling Supabase operations

### Key Directories
- `src/components/` - Reusable UI components organized by module/feature
- `src/pages/` - Route handlers, one per major page
- `src/services/` - Business logic and database operations
- `src/contexts/` - React Context providers for global state
- `scripts/` - Node.js utilities for database operations and testing

## Development Workflow

### Essential Commands
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # ESLint checking
npm run typecheck    # TypeScript checking
```

### Database Operations
Use scripts in `/scripts/` directory for database tasks:
```bash
node scripts/seedJobs.js        # Seed job data
node scripts/testAllOnboarding.js  # Test onboarding flows
node scripts/verifySchema.js    # Check database schema
```

### Testing Approach
- **Manual E2E Scripts**: Extensive Node.js scripts in `/scripts/` for testing complete user flows
- **No Automated Tests**: Rely on manual testing scripts for validation
- **Database Validation**: Scripts check data integrity and relationships

## Code Patterns

### Authentication & Authorization
```tsx
// Protected routes with role checking
<JobsProtectedRoute requireRole="employer">
  <PostJobPage />
</JobsProtectedRoute>

// Context usage
const { user, profile } = useAuth();
```

### Service Layer Pattern
```typescript
// src/services/jobsService.ts
export const jobsService = {
  async getJobs(filters) {
    let query = supabase.from('jobs').select('*');
    // Apply filters...
    return query;
  }
};
```

### State Management
- **AuthContext**: User authentication and profile data
- **I18nContext**: Language switching and translations
- **PersonalizationContext**: User preferences and recommendations

### Internationalization
- Bilingual support (en/zh) with `i18next`
- Translation keys in `src/i18n/locales/`
- Components use `useTranslation()` hook

### Routing Structure
- Flat route structure with module prefixes: `/jobs/*`, `/marketplace/*`, `/au-pair/*`
- Protected routes for role-specific features
- Nested routes for settings: `/settings/*`

## Database Patterns

### Row Level Security
All tables use RLS policies. User data access follows:
- Users can read/update their own records
- Public content (jobs, events) visible to authenticated users
- Admin roles have elevated permissions

### Common Table Patterns
- `profiles` - Base user profiles with onboarding status
- `{module}_profiles` - Module-specific profile extensions (e.g., `profiles_employer`)
- Status workflows: `draft` → `published` → `archived`
- Bilingual content fields: `title_en`, `title_zh`, `description_en`, `description_zh`

## Component Patterns

### Form Handling
```tsx
// React Hook Form + Zod validation
const schema = z.object({ email: z.string().email() });
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

### UI Components
- **Tailwind CSS** for styling with utility classes
- **Lucide React** for icons
- **Custom UI components** in `src/components/ui/`
- **Loading/Error states** for all async operations

### Error Boundaries
Wrap routes with `<ErrorBoundary />` for graceful error handling.

## Module-Specific Patterns

### Jobs Module
- Role-based: `job_seeker` vs `employer`
- Application workflow: `pending` → `reviewed` → `shortlisted` → `rejected`
- Protected routes require specific roles

### Au Pair Module
- Subscription-based premium features
- Matching algorithm based on preferences
- Profile status: `draft` → `active` → `matched`

### Visa Module
- Document upload with Supabase Storage
- Admin review workflow
- Status tracking: `draft` → `submitted` → `approved`

## Key Files to Reference
- `APP_ARCHITECTURE_AND_FEATURES.md` - Complete system overview
- `IMPLEMENTATION_SUMMARY.md` - Current implementation status
- `src/router.tsx` - Route definitions and protection
- `src/services/jobsService.ts` - Service layer example
- `src/contexts/AuthContext.tsx` - Authentication pattern
- `scripts/testAllOnboarding.js` - Testing approach example</content>
<parameter name="filePath">c:\Users\OMEN\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\.github\copilot-instructions.md