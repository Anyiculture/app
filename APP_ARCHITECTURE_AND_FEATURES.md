# AnYiculture - Complete Application Architecture & Features Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Application Structure](#application-structure)
4. [Core Features & Modules](#core-features--modules)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Authentication & Authorization](#authentication--authorization)
7. [Database Schema](#database-schema)
8. [Key Services](#key-services)
9. [Payment & Subscription System](#payment--subscription-system)
10. [Routing & Navigation](#routing--navigation)
11. [Internationalization](#internationalization)
12. [Personalization System](#personalization-system)

---

## 🎯 Overview

**AnYiculture** is a comprehensive bilingual (English/Chinese) SaaS platform designed for professionals working, studying, and living in China. It provides an integrated ecosystem of services including job searching, marketplace, events, education, visa services, au pair matching, and community networking.

### Key Principles:
- **Bilingual Support**: Full English/Chinese language switching
- **Role-Based Access**: Multi-role system per module
- **Personalized Experience**: Content recommendations based on user behavior
- **Community-Driven**: User-generated content and interactions
- **Modular Architecture**: Independent modules with shared infrastructure

---

## 🛠 Technology Stack

### Frontend
- **React 18.3** with TypeScript
- **Vite** - Build tool and dev server
- **React Router v7** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Hook Form** + **Zod** - Form validation
- **i18next** - Internationalization

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Authentication
  - Storage for images/videos
  - Edge Functions
- **Stripe** - Payment processing

### State Management
- React Context API:
  - `AuthContext` - User authentication state
  - `I18nContext` - Language management
  - `PersonalizationContext` - User preferences and recommendations
  - `ToastProvider` - Global notifications

---

## 📁 Application Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication forms
│   ├── personalization/ # Role switcher, recommendations
│   ├── stripe/         # Subscription components
│   └── ui/             # Generic UI components (Button, Modal, etc.)
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── i18n/               # Internationalization config & translations
├── lib/                # Third-party library configurations
├── pages/              # Page components (route handlers)
├── router.tsx          # Application routing configuration
├── services/           # Business logic services
├── utils/              # Utility functions
└── constants/          # Static data (cities, job categories)
```

---

## 🎨 Core Features & Modules

### 1. **Jobs Module** 💼
**Purpose**: Job posting and application management for professionals in China

**User Roles**:
- **Job Seeker**: Browse jobs, apply, save favorites, track applications
- **Employer**: Post jobs, review applications, manage candidates

**Features**:
- Job posting with rich details (salary, location, requirements)
- Advanced filtering (category, location, salary, type, remote/hybrid)
- Application management with status tracking
- Saved jobs functionality
- Job preferences and notifications
- Application status workflow: `pending` → `reviewed` → `shortlisted` → `rejected` / `withdrawn`
- View tracking and analytics

**Onboarding Flow**:
- Role selection (Job Seeker vs Employer)
- Profile completion based on role
- Skills, experience, location preferences

**Protected Routes**:
- `/post-job` - Requires `employer` role
- `/my-jobs` - Requires `employer` role
- `/saved-jobs` - Requires authentication

---

### 2. **Marketplace Module** 🛍️
**Purpose**: Buy/sell second-hand items within the community

**User Roles**:
- **Buyer**: Browse listings, save favorites, contact sellers
- **Seller**: Create listings, manage inventory, respond to inquiries

**Features**:
- Item listing with images/videos
- Bilingual listings (English/Chinese)
- Categories and subcategories
- Price negotiation flag
- Condition indicators (new, like new, used, etc.)
- Location-based search
- Favorites/saved items
- Direct messaging with sellers
- Item status: `active`, `sold`, `expired`, `draft`

**Data Model**:
- Categories, subcategories
- Multi-image support
- Video URL support
- WeChat contact option
- Contact methods (in-app message, WeChat, phone)

---

### 3. **Events Module** 📅
**Purpose**: Discover and organize community events

**User Roles**:
- **Event Attendee**: Browse events, register, check-in
- **Event Organizer**: Create events, manage registrations, track attendance

**Features**:
- Event creation with rich details
- Categories (networking, cultural, professional, social)
- Registration management
- Capacity limits
- Ticketing (free/paid)
- Online/hybrid/offline events
- Event calendar view
- Registration status tracking
- Check-in functionality
- Event reviews and comments
- Favorites/bookmarks

**Event Types**:
- Physical location events
- Online events (with link)
- Hybrid events

**Registration Flow**:
- Registration form (name, email, phone, dietary restrictions)
- Additional guests
- Payment for paid events
- Confirmation and reminders

---

### 4. **Education Module** 🎓
**Purpose**: Educational resources and program applications

**User Roles**:
- **Student**: Browse programs, submit interest/applications, track status
- **Educator**: Create programs, review applications, manage students

**Features**:
- Program types (courses, workshops, webinars, resources)
- Bilingual content
- Education levels (beginner, intermediate, advanced)
- Program details (duration, schedule, delivery mode)
- Application/interest submission
- Application tracking
- Document requirements
- Eligibility checks
- Tuition and financial aid information
- Institution information

**Application Status**:
- `submitted` → `reviewed` → `accepted` / `rejected` / `waitlisted`

---

### 5. **Visa Module** 🛂
**Purpose**: Visa application management and guidance

**User Roles**:
- **Applicant**: Create applications, upload documents, track status
- **Consultant** (Admin): Review applications, request documents, approve/reject

**Visa Types**:
- Work Z visa
- Student X visa
- Family Q/S visas
- Business M visa
- Other

**Features**:
- Step-by-step application wizard
- Document upload and management
- Document types: passport, photo, invitation letter, work permit, admission letter, police record, etc.
- Application status tracking
- Admin review workflow
- Document request system
- Application history/audit trail
- Secure document storage (Supabase Storage)
- Messaging with consultants

**Application Status Flow**:
`draft` → `submitted` → `in_review` → `documents_requested` → `approved` / `rejected`

**Admin Features**:
- Review dashboard
- Request additional documents
- Add notes and decision comments
- View application history

---

### 6. **Au Pair Module** 👶
**Purpose**: Match au pairs with host families

**User Roles**:
- **Au Pair**: Create profile, browse families, apply to positions
- **Host Family**: Create profile, browse au pairs, invite candidates

**Features**:
- Comprehensive profile creation
- Matching algorithm based on preferences
- Profile status: `draft`, `pending_review`, `active`, `matched`
- Subscription-based premium features
- Messaging between au pairs and families
- Video uploads (intro, experience videos)
- Photo galleries
- Preference matching (countries, cities, age groups, experience)
- Monthly salary/benefits negotiation

**Au Pair Profile Fields**:
- Personal info (age, gender, nationality)
- Languages spoken
- Education level
- Childcare experience
- Preferred countries/cities
- Availability dates
- Skills and certifications
- Work preferences (hours, days off, live-in)

**Host Family Profile Fields**:
- Family composition
- Children ages and personalities
- Housing details (room, bathroom, helper)
- Location (country, city, neighborhood)
- Expectations and rules
- Monthly salary offer
- Benefits

**Subscription Model**:
- Free tier: Limited features
- Premium: Full messaging, profile visibility, unlimited applications

---

### 7. **Community Module** 👥
**Purpose**: Social networking and content sharing

**Features**:
- Post creation with text and images
- Categories for posts
- Like/comment functionality
- Feed browsing
- User profiles
- Follow/connection system
- Post moderation (admin/moderator)
- Reporting system

**Post Features**:
- Rich text content
- Image uploads (multiple)
- Categories
- Likes and comments count
- Timestamps
- Edit/delete own posts

---

### 8. **Messaging System** 💬
**Purpose**: In-app messaging between users

**Features**:
- Context-aware conversations (linked to jobs, au pair listings, events, etc.)
- Real-time message updates
- Unread message counts
- Conversation blocking
- Message types: `user`, `system`, `admin`
- Conversation history
- Last message preview

**Conversation Contexts**:
- Job applications
- Au pair inquiries
- Event registrations
- Marketplace items
- Visa consultations
- General support

---

### 9. **Admin Portal** 👨‍💼
**Purpose**: Platform administration and moderation

**Admin Roles**:
- `super_admin` - Full platform access
- `admin` - General administration
- `moderator` - Content moderation
- `education_admin` - Education module only
- `jobs_admin` - Jobs module only
- `marketplace_admin` - Marketplace only
- `events_admin` - Events only

**Features**:
- User management (view, ban, delete)
- Content moderation
- Analytics and statistics
- Activity logging
- Role management
- Permission system

**Statistics Tracked**:
- Total users
- Total jobs, marketplace items, events, education programs
- Pending applications/interests
- Active conversations

---

### 10. **Subscription & Payment** 💳
**Purpose**: Monetization via Stripe integration

**Integration**:
- Stripe Checkout for payments
- Supabase Edge Functions for webhooks
- Subscription management
- Payment history

**Features**:
- Multiple subscription tiers
- One-time payments
- Subscription cancellation
- Payment status tracking
- Invoice management

**Stripe Configuration**:
- Edge Functions:
  - `stripe-checkout` - Create checkout sessions
  - `stripe-webhook` - Handle Stripe events
- Webhook events handled:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - Subscription lifecycle events

---

## 👤 User Roles & Permissions

### Module-Specific Roles

Each module has its own role system, allowing users to have different roles in different modules:

**Jobs Module**:
- `job_seeker`
- `employer`

**Au Pair Module**:
- `au_pair`
- `host_family`

**Events Module**:
- `event_attendee`
- `event_organizer`

**Education Module**:
- `student`
- `educator`

**Marketplace Module**:
- `buyer`
- `seller`

**Visa Module**:
- `applicant`
- `consultant` (admin role)

**Community Module**:
- `member`
- `moderator` (admin role)

### Primary Role System
- Users can have one **primary role** that determines default dashboard view
- Users can add multiple roles across modules
- Role switching interface available

---

## 🔐 Authentication & Authorization

### Authentication Methods
1. **Email/Password**: Traditional signup and login
2. **Google OAuth**: Social login integration
3. **Session Management**: Supabase Auth handles sessions

### Authorization Flow

**Public Routes**:
- Landing page (`/`)
- Sign in (`/signin`)
- Sign up (`/signup`)
- Forgot password (`/forgot-password`)

**Protected Routes**:
- Require authentication
- Some require specific roles (e.g., `/post-job` requires `employer` role)

**Role-Based Route Protection**:
```typescript
<JobsProtectedRoute requireRole="employer">
  <PostJobPage />
</JobsProtectedRoute>
```

**Onboarding Flow**:
- First-time users complete general onboarding
- Module-specific onboarding when accessing protected features
- Role selection before accessing role-restricted features

---

## 🗄️ Database Schema

### Core Tables

**profiles**
- User profile information
- Onboarding status
- Preferences
- Module-specific flags (e.g., `au_pair_role`, `au_pair_subscription_status`)

**jobs**
- Job postings
- Status: `draft`, `published`, `closed`, `archived`
- Rich metadata (salary, location, requirements)

**job_applications**
- Job applications
- Status: `pending`, `reviewed`, `shortlisted`, `rejected`, `withdrawn`

**saved_jobs**
- User's saved job listings

**marketplace_items**
- Marketplace listings
- Bilingual content
- Image/video storage

**events**
- Event information
- Capacity, pricing, location

**event_registrations**
- User event registrations
- Check-in status

**education_resources**
- Educational programs
- Bilingual content

**education_interests**
- Program applications/interests
- Status tracking

**visa_applications**
- Visa application data
- Status workflow
- Document references

**visa_documents**
- Uploaded documents
- Linked to applications

**au_pair_profiles**
- Au pair candidate profiles

**host_family_profiles**
- Host family profiles

**community_posts**
- Social posts
- Categories, likes, comments

**conversations**
- Messaging conversations
- Context linking

**messages**
- Individual messages
- Read status

**user_personalization**
- User preferences
- Primary role
- Favorite modules

**user_role_assignments**
- Multi-role support
- Module-specific roles
- Primary role flag

**admin_roles**
- Admin role assignments
- Permissions

**admin_activity_log**
- Admin action tracking
- Audit trail

**stripe_user_subscriptions**
- Subscription data
- Payment status

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can read their own data
- Users can create/update their own content
- Public content (active jobs, events) visible to all authenticated users
- Admin roles have elevated permissions

---

## 🔧 Key Services

### Service Layer Architecture

**jobsService.ts**
- Job CRUD operations
- Filtering and search
- Application management

**marketplaceService.ts**
- Listing management
- Category handling
- Favorite functionality

**eventsService.ts**
- Event creation/management
- Registration handling
- Check-in functionality

**educationService.ts**
- Program management
- Application processing
- Interest tracking

**visaService.ts**
- Application management
- Document handling
- Status workflow

**auPairService.ts**
- Profile management
- Matching algorithm
- Subscription status

**messagingService.ts**
- Conversation management
- Message sending/receiving
- Unread counts

**communityService.ts**
- Post management
- Like/comment operations
- Feed generation

**adminService.ts**
- User management
- Role assignment
- Activity logging
- Statistics

**personalizationService.ts**
- User preference management
- Role assignment
- Recommendation generation

**recommendationEngine.ts**
- Content recommendations
- Personalized suggestions
- Algorithm-based matching

**analyticsService.ts**
- User behavior tracking
- Content engagement metrics
- Module visit tracking

**notificationService.ts**
- Push notifications
- Email notifications
- In-app notifications

**searchService.ts**
- Global search functionality
- Cross-module search
- Filtering and sorting

---

## 💳 Payment & Subscription System

### Stripe Integration

**Components**:
- `useStripe` hook - Subscription state management
- `SubscriptionCard` component - Plan display and purchase
- Edge Functions for checkout and webhooks

**Flow**:
1. User selects subscription plan
2. Frontend calls Edge Function `stripe-checkout`
3. Edge Function creates Stripe Checkout Session
4. User redirected to Stripe Checkout
5. After payment, Stripe sends webhook to `stripe-webhook`
6. Edge Function updates database with subscription details
7. User redirected to success page

**Subscription Features**:
- Monthly/annual subscriptions
- One-time payments
- Subscription cancellation
- Payment history
- Status tracking (active, cancelled, past_due)

**Au Pair Premium Features**:
- Unlimited messaging
- Enhanced profile visibility
- Priority in search results
- Advanced matching features

---

## 🗺️ Routing & Navigation

### Route Structure

**Public Routes**:
```
/ - Landing page
/signin - Sign in page
/signup - Sign up page
/forgot-password - Password reset
```

**Protected Routes** (require authentication):
```
/dashboard - Main dashboard
/home - Personalized home page
/settings - User settings
/profile/:id - User profile
```

**Module Routes**:
```
/jobs - Job listings
/jobs/:id - Job details
/jobs/role-selection - Role selection
/jobs/onboarding/job-seeker - Job seeker onboarding
/jobs/onboarding/employer - Employer onboarding
/post-job - Post job (employer only)
/my-jobs - My jobs (employer only)
/saved-jobs - Saved jobs

/marketplace - Marketplace listings
/marketplace/post - Create listing
/marketplace/my-listings - My listings
/marketplace/:id - Listing details

/events - Event listings
/events/create - Create event
/events/my-events - My events
/events/:id - Event details

/education - Education programs
/education/create - Create program
/education/applications - My applications
/education/:id - Program details

/visa - Visa center
/visa/dashboard - Visa dashboard
/visa/application/:id - Visa application
/visa/admin/review - Admin review (admin only)

/au-pair - Au pair module
/au-pair/select-role - Role selection
/au-pair/onboarding - Profile creation
/au-pair/dashboard - Au pair dashboard
/au-pair/browse - Browse families/au pairs
/au-pair/payment - Subscription payment
/au-pair/subscription - Subscription management

/community - Community feed
/messages - Messaging center
/admin - Admin portal (admin only)
```

### Navigation Components

**App.tsx**:
- Main layout wrapper
- Navigation bar (conditional based on auth)
- Sidebar for authenticated users

**Sidebar**:
- Module navigation
- User profile menu
- Language switcher
- Sign out button

**Navigation**:
- Public navigation for unauthenticated users
- Minimal navigation for authenticated users (sidebar handles main nav)

---

## 🌐 Internationalization

### Implementation
- **i18next** for translation management
- **React-i18next** for React integration
- **I18nContext** for language state

### Supported Languages
- English (`en`) - Default
- Chinese (`zh`) - Simplified Chinese

### Translation Files
- `src/i18n/locales/en.json`
- `src/i18n/locales/zh.json`

### Features
- Language persistence in localStorage
- Language switcher in navigation
- Bilingual content support:
  - User-generated content can have both languages
  - System UI translated
  - Content titles/descriptions support both languages

---

## 🎯 Personalization System

### Core Concepts

**Primary Role**:
- One primary role determines default dashboard
- User can switch primary role
- Affects recommendations and default views

**Module Engagement Tracking**:
- Tracks which modules user visits
- Tracks content interactions (views, clicks, applications)
- Used for recommendations

**Content Interactions**:
- View tracking
- Click tracking
- Application tracking
- Save/favorite tracking
- Time spent tracking

**Recommendations**:
- Job recommendations based on preferences and history
- Event recommendations based on interests
- Marketplace recommendations based on browsing
- Au pair matches based on compatibility

**Personalization Preferences**:
- Favorite modules
- Preferred language
- Preferred currency
- Email digest frequency
- Auto-match enabled/disabled
- Show recommendations enabled/disabled

### Recommendation Engine

**Algorithm**:
- Content-based filtering
- User behavior analysis
- Preference matching
- Location-based recommendations
- Time-based relevance

**Recommendation Types**:
- Jobs matching skills and location
- Events matching interests
- Marketplace items matching preferences
- Au pair families/candidates matching requirements
- Education programs matching goals

---

## 🔄 Onboarding Flows

### General Onboarding
- First-time user registration
- Basic profile information
- Interest selection (which modules user is interested in)
- Language preference
- Location information

### Module-Specific Onboarding

**Jobs Module**:
- Role selection (Job Seeker vs Employer)
- Profile completion based on role
- Skills and experience
- Preferences (location, salary, job type)

**Au Pair Module**:
- Role selection (Au Pair vs Host Family)
- Comprehensive profile creation
- Document uploads
- Preferences and requirements
- Optional subscription payment

**Other Modules**:
- Role selection if applicable
- Basic profile information
- Preferences setup

---

## 📊 Analytics & Tracking

### Tracked Metrics

**User Behavior**:
- Module visits
- Page views
- Content interactions
- Time spent
- Search queries
- Filter usage

**Content Performance**:
- View counts
- Application/interest counts
- Engagement rates
- Conversion rates

**System Metrics**:
- Active users
- New registrations
- Module popularity
- Feature usage

### Analytics Service
- Event tracking via `analytics_events` table
- Helper functions for common events
- Privacy-compliant tracking

---

## 🔒 Security Features

### Authentication Security
- Supabase Auth handles password hashing
- Session management
- JWT tokens
- OAuth integration

### Data Security
- Row Level Security (RLS) on all tables
- User-specific data isolation
- Admin permission checks
- Secure file uploads (Supabase Storage)

### API Security
- Edge Functions use service role key
- Webhook signature verification
- CORS configuration
- Input validation (Zod schemas)

---

## 🚀 Key Features Summary

### User-Facing Features
✅ Bilingual interface (English/Chinese)
✅ Multi-role system per module
✅ Personalized dashboard and recommendations
✅ In-app messaging system
✅ Real-time notifications
✅ Advanced search and filtering
✅ Save/favorite functionality
✅ Application/registration tracking
✅ Profile management
✅ Content creation and management
✅ Payment and subscription handling

### Admin Features
✅ User management
✅ Content moderation
✅ Role assignment
✅ Analytics dashboard
✅ Activity logging
✅ Module-specific administration

### Technical Features
✅ Responsive design (mobile-friendly)
✅ Progressive loading
✅ Error boundaries
✅ Toast notifications
✅ Loading states
✅ Optimistic updates
✅ Offline support (partial)

---

## 📝 Notes for Developers

### Environment Variables Required
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Migrations
All migrations are in `supabase/migrations/` and should be run in order.

### Adding New Modules
1. Create service in `src/services/`
2. Create pages in `src/pages/`
3. Add routes in `src/router.tsx`
4. Create database tables and RLS policies
5. Add to navigation components
6. Update personalization system if needed

### Testing Features
- Use seed data functions in `src/utils/seedAllData.ts` for development
- Check browser console for errors
- Use Supabase dashboard for database inspection
- Test with different user roles

---

## 🎓 Learning Resources

- React Router v7: https://reactrouter.com/
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
- i18next: https://www.i18next.com/

---

**Last Updated**: January 2025
**Version**: Final Production Build
