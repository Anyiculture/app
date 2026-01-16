# General Onboarding & Auth Flow Implementation

## COMPLETED ✅

### 1. Database Schema
- **Migration Applied**: `add_general_onboarding_fields`
- **New Fields Added to `profiles` table**:
  - `first_name`, `last_name` - Collected at signup
  - `display_name` - Public name used across platform
  - `phone` - For platform safety
  - `current_city` - Current city in China
  - `interested_modules` - Array of selected modules
  - `primary_interest` - Main interest/priority
  - `date_of_birth`, `gender`, `nationality` - Personal info
  - `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relationship` - Safety
  - `consent_data_processing`, `consent_communications` - GDPR compliance
  - `last_login_at`, `is_first_login` - Login tracking

### 2. General Onboarding Component
- **File**: `src/components/GeneralOnboarding.tsx`
- **4-Step Process**:
  1. **Personal Info**: Display name, phone, DOB, gender, nationality
  2. **Location**: Current city (China cities only)
  3. **Interests**: Select interested modules + primary interest
  4. **Safety**: Emergency contact + consent checkboxes
- **Features**:
  - Safety notice explaining why info is collected
  - Required fields validation
  - Beautiful gradient UI matching platform design

### 3. Updated Authentication
- **Auth Context** (`src/contexts/AuthContext.tsx`):
  - `signUp` now accepts `firstName` and `lastName`
  - Added `signInWithGoogle()` for OAuth
  - Auto-creates profile on signup/signin
  - Tracks `is_first_login` and `last_login_at`

- **Sign Up Page** (`src/pages/SignUpPage.tsx`):
  - Collects `firstName` and `lastName` (not fullName)
  - Google OAuth button added
  - Routes to `/dashboard` after signup (not `/signin`)
  - Clean UI with "or continue with" divider

- **Sign In Page** (`src/pages/SignInPage.tsx`):
  - Google OAuth button added
  - Same UI consistency

## REMAINING TASKS 🔨

### 4. Routing Logic (HIGH PRIORITY)
**What Needs to be Done**:
- Update `DashboardPage` to check if user has completed onboarding
- If `onboarding_completed` is false, show `<GeneralOnboarding />` component
- After onboarding completes, reload profile and show actual dashboard

**Implementation**:
```typescript
// In DashboardPage.tsx
const [profile, setProfile] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadProfile();
}, [user]);

const loadProfile = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  setProfile(data);
  setLoading(false);
};

if (!profile?.onboarding_completed) {
  return <GeneralOnboarding userId={user.id} onComplete={loadProfile} />;
}

// Show normal dashboard...
```

### 5. Dashboard Greeting (HIGH PRIORITY)
**What Needs to be Done**:
- Check `is_first_login` field
- If true: "Welcome, {display_name}"
- If false: "Welcome back, {display_name}"
- If onboarding incomplete: Show notice "Complete your profile for better personalization and safety."

**Implementation**:
```typescript
<h1 className="text-3xl font-bold">
  {profile.is_first_login ? t('dashboard.welcome') : t('dashboard.welcomeBack')}, {profile.display_name}
</h1>

{!profile.onboarding_completed && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <p className="text-sm text-yellow-800">
      {t('dashboard.completeProfileNotice')}
    </p>
  </div>
)}
```

### 6. i18n Translations (CRITICAL)
**Missing Translation Keys** - Add to both `en.json` and `zh.json`:

```json
{
  "auth": {
    "firstName": "First Name",
    "lastName": "Last Name",
    "firstNamePlaceholder": "John",
    "lastNamePlaceholder": "Doe",
    "signInWithGoogle": "Sign in with Google",
    "orContinueWith": "or continue with email",
    "googleSignInError": "Failed to sign in with Google"
  },
  "onboarding": {
    "title": "Complete Your Profile",
    "personalInfo": "Personal Information",
    "personalInfoDesc": "Tell us about yourself",
    "displayName": "Display Name",
    "displayNamePlaceholder": "How should we call you?",
    "displayNameHelp": "This name will be visible to other users",
    "phoneNumber": "Phone Number",
    "phoneHelp": "For platform safety and verification",
    "dateOfBirth": "Date of Birth",
    "gender": "Gender",
    "male": "Male",
    "female": "Female",
    "other": "Other",
    "preferNotToSay": "Prefer not to say",
    "nationality": "Nationality",
    "nationalityPlaceholder": "e.g., Chinese, American",
    "location": "Location",
    "locationDesc": "Where are you currently located?",
    "currentCity": "Current City",
    "interests": "Your Interests",
    "interestsDesc": "What brings you to AnYiculture?",
    "interestedModules": "I'm interested in",
    "primaryInterest": "My primary interest is",
    "primaryInterestHelp": "This helps us personalize your experience",
    "safety": "Safety Information",
    "safetyDesc": "Help us keep you safe",
    "whyWeAsk": "Why we ask for this:",
    "safetyNotice": "We collect this information to ensure platform safety, verify identities, and provide emergency support if needed. Your data is protected and will never be shared without your consent.",
    "emergencyContactName": "Emergency Contact Name",
    "emergencyContactNamePlaceholder": "Full name",
    "emergencyContactPhone": "Emergency Contact Phone",
    "emergencyContactRelationship": "Relationship",
    "parent": "Parent",
    "spouse": "Spouse",
    "sibling": "Sibling",
    "friend": "Friend",
    "consentDataProcessing": "I consent to data processing for platform safety and personalization",
    "consentCommunications": "I want to receive platform updates and notifications",
    "complete": "Complete Profile",
    "saveFailed": "Failed to save profile. Please try again."
  },
  "dashboard": {
    "welcome": "Welcome",
    "welcomeBack": "Welcome back",
    "completeProfileNotice": "Complete your profile for better personalization and safety."
  },
  "nav": {
    "auPair": "Au Pair"
  }
}
```

### 7. Au Pair Routing Guard (NICE TO HAVE)
**What Needs to be Done**:
- When user clicks on Au Pair nav link, check if onboarding is complete
- If not complete, redirect to dashboard (which shows onboarding)
- This ensures users complete general onboarding before module-specific onboarding

## TESTING CHECKLIST

### Auth Flow
- [ ] Sign up with first name + last name creates profile
- [ ] Sign up routes to dashboard (not signin)
- [ ] Google OAuth creates profile if doesn't exist
- [ ] First-time users see onboarding on dashboard
- [ ] Returning users skip onboarding

### Onboarding
- [ ] All 4 steps display correctly
- [ ] Required fields are enforced
- [ ] China cities dropdown works
- [ ] Module selection works (multi-select)
- [ ] Primary interest only shows selected modules
- [ ] Consent checkbox is required
- [ ] Emergency contact is optional
- [ ] On completion, redirects to dashboard

### Dashboard
- [ ] First login: "Welcome, {name}"
- [ ] Return visit: "Welcome back, {name}"
- [ ] Incomplete profile shows notice
- [ ] Complete profile doesn't show notice

### Security
- [ ] Profile data is saved correctly
- [ ] RLS policies prevent unauthorized access
- [ ] OAuth redirects to correct URL
- [ ] No data leakage in API responses

## FILE CHANGES

**Created**:
- `src/components/GeneralOnboarding.tsx`
- `supabase/migrations/20260108_add_general_onboarding_fields.sql`

**Modified**:
- `src/contexts/AuthContext.tsx` - Added Google OAuth, profile creation
- `src/pages/SignUpPage.tsx` - First/last name, Google OAuth
- `src/pages/SignInPage.tsx` - Google OAuth
- `src/pages/DashboardPage.tsx` - **NEEDS UPDATE** for onboarding check

**Needs Translation Updates**:
- `src/i18n/locales/en.json`
- `src/i18n/locales/zh.json`

## ARCHITECTURE NOTES

### Profile Creation Flow
1. User signs up with email/password OR Google OAuth
2. AuthContext creates profile with `onboarding_completed: false`, `is_first_login: true`
3. User is redirected to `/dashboard`
4. Dashboard checks `onboarding_completed` field
5. If false, renders `<GeneralOnboarding />` instead of dashboard content
6. After onboarding completes, sets `onboarding_completed: true`, `is_first_login: false`
7. Dashboard reloads profile and shows greeting + content

### Module-Specific Onboarding (e.g., Au Pair)
- General onboarding MUST be completed first
- Module-specific onboarding (like Au Pair host family) happens after
- Users can have both general + module onboarding incomplete

### Data Safety
- Phone number collected for verification/safety
- Emergency contact for user protection
- Consent fields for GDPR compliance
- All personal data protected by RLS policies
- Never exposed in client-side code
