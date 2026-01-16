import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { JobsPage } from './pages/JobsPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { PostJobPage } from './pages/PostJobPage';
import MyJobsPage from './pages/MyJobsPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { MarketplaceDetailPage } from './pages/MarketplaceDetailPage';
import { MarketplacePostPage } from './pages/MarketplacePostPage';
import { MarketplaceEditPage } from './pages/MarketplaceEditPage';
import MyListingsPage from './pages/MyListingsPage';
import PersonalizedHomePage from './pages/PersonalizedHomePage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { CreateEventPage } from './pages/CreateEventPage';
import MyEventsPage from './pages/MyEventsPage';
import { EducationPage } from './pages/EducationPage';
import { EducationDetailPage } from './pages/EducationDetailPage';
import { EducationApplicationsPage } from './pages/EducationApplicationsPage';
import { CreateEducationProgramPage } from './pages/CreateEducationProgramPage';
import { CreateCommunityPostPage } from './pages/CreateCommunityPostPage';
import { MyCommunityPostsPage } from './pages/MyCommunityPostsPage';
import { VisaPage } from './pages/VisaPage';
import { VisaDashboardPage } from './pages/VisaDashboardPage';
import { VisaApplicationPage } from './pages/VisaApplicationPage';
import { VisaApplicationDetailPage } from './pages/VisaApplicationDetailPage';
import { VisaAdminReviewPage } from './pages/VisaAdminReviewPage';
import { AuPairEditProfilePage } from './pages/AuPairEditProfilePage';
import { AuPairPage } from './pages/AuPairPage';
import { AuPairOnboardingPage } from './pages/AuPairOnboardingPage';
import { AuPairRoleSelectionPage } from './pages/AuPairRoleSelectionPage';
import { AuPairBrowsePage } from './pages/AuPairBrowsePage';
import { BrowseFamiliesPage } from './pages/BrowseFamiliesPage';
import { BrowseAuPairsPage } from './pages/BrowseAuPairsPage';
import { AuPairPaymentPage } from './pages/AuPairPaymentPage';
import { AuPairPaymentSuccessPage } from './pages/AuPairPaymentSuccessPage';
import { SubscriptionManagementPage } from './pages/SubscriptionManagementPage';
import { CommunityPage } from './pages/CommunityPage';
import { MessagingPage } from './pages/MessagingPage';
import { AdminPortalPage } from './pages/AdminPortalPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ResetAdminPinPage } from './pages/ResetAdminPinPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { JobsProtectedRoute } from './components/JobsProtectedRoute';
import { JobsRoleSelectionPage } from './pages/JobsRoleSelectionPage';
import { JobSeekerOnboarding } from './components/JobSeekerOnboarding';
import { EmployerOnboarding } from './components/EmployerOnboarding';
import { MySavedJobsPage } from './pages/MySavedJobsPage';
import { ApplicantManagementPage } from './pages/employer/ApplicantManagementPage';
import { InterviewsPage } from './pages/InterviewsPage';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Careers } from './pages/Careers';
import { Blog } from './pages/Blog';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { CandidateBrowsePage } from './pages/CandidateBrowsePage';
import { EmployerDashboardPage } from './pages/EmployerDashboardPage';
import { EmployerProfileEditPage } from './pages/EmployerProfileEditPage';
import { HostFamilyEditProfilePage } from './pages/HostFamilyEditProfilePage';
import { JobSeekerEditProfilePage } from './pages/JobSeekerEditProfilePage';
import { UnifiedProfileEditPage } from './pages/UnifiedProfileEditPage';
import { CompanyProfilePage } from './pages/CompanyProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';

import { AuPairProfilePage } from './pages/AuPairProfilePage';
import { HostFamilyProfilePage } from './pages/HostFamilyProfilePage';

import { SettingsPage } from './pages/SettingsPage';
import { SettingsLayout } from './pages/settings/SettingsLayout';
import { SettingsDashboardPage } from './pages/settings/SettingsDashboardPage';
import { GeneralSettingsPage } from './pages/settings/GeneralSettingsPage';
import { AuPairSettingsPage } from './pages/settings/AuPairSettingsPage';
import { HostFamilySettingsPage } from './pages/settings/HostFamilySettingsPage';
import { EmployerSettingsPage } from './pages/settings/EmployerSettingsPage';
import { JobSeekerSettingsPage } from './pages/settings/JobSeekerSettingsPage';
import { SecuritySettingsPage } from './pages/settings/SecuritySettingsPage';
import { BillingSettingsPage } from './pages/settings/BillingSettingsPage';

import { CandidateProfilePage } from './pages/CandidateProfilePage';

// ... (keep existing imports)

export const router = createBrowserRouter([
  {
    path: '/signin',
    element: <SignInPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/reset-admin-pin',
    element: <ResetAdminPinPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: 'families/browse',
        element: <BrowseFamiliesPage />, 
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'au-pairs/browse',
        element: <BrowseAuPairsPage />, 
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'host-family/profile/:id',
        element: <HostFamilyProfilePage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'au-pair/profile/:id',
        element: <AuPairProfilePage />,
        errorElement: <ErrorBoundary />,
      },
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'profile/edit',
        element: (
          <ProtectedRoute>
            <UnifiedProfileEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'home',
        element: <PersonalizedHomePage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'settings',
        element: <SettingsLayout />,
        errorElement: <ErrorBoundary />,
        children: [
          { index: true, element: <SettingsDashboardPage /> },
          { path: 'general', element: <GeneralSettingsPage /> },
          { path: 'security', element: <SecuritySettingsPage /> },
          { path: 'billing', element: <BillingSettingsPage /> },
          { path: 'au-pair', element: <AuPairSettingsPage /> },
          { path: 'host-family', element: <HostFamilySettingsPage /> },
          { path: 'employer', element: <EmployerSettingsPage /> },
          { path: 'job-seeker', element: <JobSeekerSettingsPage /> },
        ]
      },
      {
        path: 'profile',
        element: <SettingsPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'profile/:id',
        element: <ProfilePage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'company/:id',
        element: <CompanyProfilePage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'jobs',
        element: <JobsPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'jobs/role-selection',
        element: <JobsRoleSelectionPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'jobs/onboarding/job-seeker',
        element: (
          <JobsProtectedRoute>
            <JobSeekerOnboarding />
          </JobsProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'jobs/onboarding/employer',
        element: (
          <JobsProtectedRoute>
            <EmployerOnboarding />
          </JobsProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'jobs/post',
        element: (
          <JobsProtectedRoute requireRole="employer">
            <PostJobPage />
          </JobsProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'jobs/my-jobs',
        element: (
          <JobsProtectedRoute requireProfileCompletion={false}>
            <MyJobsPage />
          </JobsProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'jobs/saved',
        element: <MySavedJobsPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'employer/applicants',
        element: (
          <JobsProtectedRoute requireRole="employer">
            <ApplicantManagementPage />
          </JobsProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'employer/dashboard',
        element: (<JobsProtectedRoute requireRole="employer">
            <EmployerDashboardPage />
          </JobsProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'employer/profile/edit',
        element: (
          <JobsProtectedRoute requireRole="employer">
            <EmployerProfileEditPage />
          </JobsProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'interviews',
        element: <InterviewsPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'jobs/:id',
        element: <JobDetailPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'saved-jobs',
        element: <MySavedJobsPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'marketplace',
        element: <MarketplacePage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'marketplace/post',
        element: <MarketplacePostPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'marketplace/my-listings',
        element: <MyListingsPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'marketplace/:id',
        element: <MarketplaceDetailPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'marketplace/:id/edit',
        element: <MarketplaceEditPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'events',
        element: <EventsPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'events/create',
        element: <CreateEventPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'events/my-events',
        element: <MyEventsPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'events/:id',
        element: <EventDetailPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'education',
        element: <EducationPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'education/applications',
        element: <EducationApplicationsPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'education/create',
        element: <CreateEducationProgramPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'education/:id/edit',
        element: <CreateEducationProgramPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'education/:id',
        element: <EducationDetailPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'aupair',
        element: <AuPairPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'aupair/onboarding',
        element: <AuPairOnboardingPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'visa',
        element: <VisaPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'visa/dashboard',
        element: <VisaDashboardPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'visa/application/:id',
        element: <VisaApplicationPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'visa/application/:id/view',
        element: <VisaApplicationDetailPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'visa/admin/review',
        element: <VisaAdminReviewPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'au-pair',
        element: <AuPairRoleSelectionPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'au-pair/select-role',
        element: <AuPairRoleSelectionPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'au-pair/onboarding',
        element: <AuPairOnboardingPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'au-pair/edit-profile',
        element: <AuPairEditProfilePage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'au-pair/edit-family-profile',
        element: <HostFamilyEditProfilePage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'jobs/edit-profile',
        element: <JobSeekerEditProfilePage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'au-pair/dashboard',
        element: <AuPairPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'au-pair/browse',
        element: <AuPairBrowsePage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'au-pair/payment',
        element: (
          <ProtectedRoute>
            <AuPairPaymentPage />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'au-pair/payment/success',
        element: (
          <ProtectedRoute>
            <AuPairPaymentSuccessPage />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'au-pair/subscription',
        element: (
          <ProtectedRoute>
            <SubscriptionManagementPage />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'community',
        element: <CommunityPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'community/create',
        element: <CreateCommunityPostPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'community/my-posts',
        element: <MyCommunityPostsPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'candidates',
        element: <JobsProtectedRoute requireRole="employer"><CandidateBrowsePage /></JobsProtectedRoute>,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'candidate/:id',
        element: <JobsProtectedRoute requireRole="employer"><CandidateProfilePage /></JobsProtectedRoute>,
        errorElement: <ErrorBoundary />,
      },

      {
        path: 'messages',
        element: <MessagingPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'admin',
        element: <AdminPortalPage />,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'contact',
        element: <Contact />,
      },
      {
        path: 'careers',
        element: <Careers />,
      },
      {
        path: 'blog',
        element: <Blog />,
      },
      {
        path: 'privacy',
        element: <Privacy />,
      },
      {
        path: 'terms',
        element: <Terms />,
      },
      {
        path: '*',
        element: <ErrorBoundary />,
      },
    ],
  },
]);
