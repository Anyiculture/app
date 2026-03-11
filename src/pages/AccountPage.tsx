import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, Briefcase, CalendarClock, CheckCircle2, CreditCard, Home, Lock, Shield, User, Users, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../components/ui/Toast';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Loading } from '../components/ui/Loading';
import { profileService } from '../services/profileService';
import { accountService, type AccountRole, type AccountState } from '../services/accountService';
import { supabase } from '../lib/supabase';

type AccountSection = 'overview' | 'personal' | 'roles' | 'billing' | 'security' | 'notifications';

interface PersonalFormData {
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  citizenship_country: string;
  residence_country: string;
  residence_province: string;
  residence_city: string;
  bio: string;
}

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

const SECTIONS: AccountSection[] = ['overview', 'personal', 'roles', 'billing', 'security', 'notifications'];

const EMPTY_PERSONAL_FORM: PersonalFormData = {
  first_name: '',
  last_name: '',
  display_name: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  nationality: '',
  citizenship_country: '',
  residence_country: '',
  residence_province: '',
  residence_city: '',
  bio: '',
};

const isSection = (value: string | null): value is AccountSection => {
  if (!value) return false;
  return SECTIONS.includes(value as AccountSection);
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString();
};

const normalizeStatus = (value: string | null | undefined) => {
  if (!value) return null;
  return value.replace(/_/g, ' ');
};

const roleLabel = (role: AccountRole, t: (key: string) => string) => {
  if (role === 'general') return t('account.roles.general') || 'General User';
  if (role === 'host_family') return t('settings.roles.hostFamily') || 'Host Family';
  if (role === 'au_pair') return t('settings.roles.auPair') || 'Au Pair';
  if (role === 'employer') return t('settings.roles.company') || 'Employer';
  return t('settings.roles.jobSeeker') || 'Job Seeker';
};

const approvalLabel = (status: string | null, t: (key: string) => string) => {
  switch (status) {
    case 'active':
    case 'approved':
    case 'premium_active':
      return t('account.status.approved') || 'Approved';
    case 'pending_approval':
      return t('account.status.pendingApproval') || 'Pending approval';
    case 'pending_payment':
      return t('account.status.pendingPayment') || 'Pending payment';
    case 'premium_expired':
      return t('account.status.expired') || 'Expired';
    case 'rejected':
      return t('account.status.rejected') || 'Rejected';
    default:
      return t('account.status.notRequired') || 'Not required';
  }
};

const paymentLabel = (status: string | null, t: (key: string) => string) => {
  if (!status) return '-';
  switch (status) {
    case 'approved':
      return t('account.status.paymentApproved') || 'Approved';
    case 'pending':
      return t('account.status.paymentPending') || 'Pending';
    case 'rejected':
      return t('account.status.paymentRejected') || 'Rejected';
    case 'not_submitted':
      return t('account.status.paymentNotSubmitted') || 'Not submitted';
    default:
      return status;
  }
};

const subscriptionStatusLabel = (status: string | null, t: (key: string) => string) => {
  switch (status) {
    case 'premium_active':
      return t('account.status.premiumActive') || 'Premium active';
    case 'pending_approval':
      return t('account.status.pendingApproval') || 'Pending approval';
    case 'premium_expired':
      return t('account.status.expired') || 'Premium expired';
    case 'rejected':
      return t('account.status.rejected') || 'Rejected';
    case 'free':
      return t('settings.billing.freePlan') || 'Free Plan';
    default:
      return '-';
  }
};

const messagingLabel = (state: AccountState | null, t: (key: string) => string) => {
  if (!state) return '-';
  if (state.billing.contactAccessEnabled) return t('account.messaging.enabled') || 'Messaging and contact access enabled';
  switch (state.messagingAccess?.reason) {
    case 'onboarding_incomplete':
      return t('account.messaging.onboardingIncomplete') || 'Messaging locked until onboarding is complete';
    case 'not_premium':
      return t('account.messaging.notPremium') || 'Messaging locked until premium activation';
    case 'payment_pending':
      return t('account.messaging.paymentPending') || 'Messaging locked while payment is under review';
    case 'payment_rejected':
      return t('account.messaging.paymentRejected') || 'Messaging locked due to rejected payment';
    case 'subscription_expired':
      return t('account.messaging.subscriptionExpired') || 'Messaging locked because your subscription expired';
    default:
      return t('account.messaging.locked') || 'Messaging currently locked';
  }
};

export function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [accountState, setAccountState] = useState<AccountState | null>(null);
  const [personalForm, setPersonalForm] = useState<PersonalFormData>(EMPTY_PERSONAL_FORM);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    sms: false,
    inApp: true,
  });

  const activeSection = isSection(searchParams.get('section')) ? (searchParams.get('section') as AccountSection) : 'overview';

  const navItems = useMemo(
    () => [
      { id: 'overview' as const, label: t('account.sections.overview') || 'Overview', icon: User },
      { id: 'personal' as const, label: t('account.sections.personalInfo') || 'Personal Info', icon: User },
      { id: 'roles' as const, label: t('account.sections.roleProfiles') || 'Role Profiles', icon: Users },
      { id: 'billing' as const, label: t('account.sections.billing') || 'Billing & Subscription', icon: CreditCard },
      { id: 'security' as const, label: t('account.sections.security') || 'Security', icon: Shield },
      { id: 'notifications' as const, label: t('account.sections.notifications') || 'Notifications', icon: Bell },
    ],
    [t]
  );

  const loadAccount = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const state = await accountService.getAccountState(user.id);
      setAccountState(state);
      const profile = state.profile;
      setPersonalForm({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        display_name: profile?.display_name || '',
        phone: profile?.phone || '',
        date_of_birth: profile?.date_of_birth || '',
        gender: profile?.gender || '',
        nationality: profile?.nationality || '',
        citizenship_country: profile?.citizenship_country || '',
        residence_country: profile?.residence_country || '',
        residence_province: profile?.residence_province || '',
        residence_city: profile?.residence_city || '',
        bio: profile?.bio || '',
      });
      const storageKey = `account-notifications-${user.id}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<NotificationSettings>;
        setNotifications({
          email: typeof saved.email === 'boolean' ? saved.email : Boolean(profile?.consent_communications),
          sms: Boolean(saved.sms),
          inApp: typeof saved.inApp === 'boolean' ? saved.inApp : true,
        });
      } else {
        setNotifications({ email: Boolean(profile?.consent_communications), sms: false, inApp: true });
      }
    } catch (error) {
      console.error('Failed to load account state:', error);
      showToast('error', t('account.loadError') || 'Failed to load account information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.id) void loadAccount();
  }, [authLoading, user?.id]);

  const setSection = (section: AccountSection) => setSearchParams({ section });

  const onPersonalChange = (field: keyof PersonalFormData, value: string) => {
    setPersonalForm((prev) => ({ ...prev, [field]: value }));
  };

  const savePersonalInfo = async () => {
    if (!user?.id) return;
    setSavingPersonal(true);
    try {
      await profileService.updateProfile(user.id, personalForm);
      showToast('success', t('settings.profile.updateSuccess') || 'Profile updated successfully');
      await loadAccount();
    } catch (error) {
      console.error('Failed to save personal profile:', error);
      showToast('error', t('settings.profile.updateError') || 'Failed to update profile');
    } finally {
      setSavingPersonal(false);
    }
  };

  const saveNotifications = async () => {
    if (!user?.id) return;
    setSavingNotifications(true);
    try {
      await profileService.updateProfile(user.id, { consent_communications: notifications.email });
      localStorage.setItem(`account-notifications-${user.id}`, JSON.stringify(notifications));
      showToast('success', t('account.notifications.saved') || 'Notification preferences updated');
    } catch (error) {
      console.error('Failed to save notifications:', error);
      showToast('error', t('account.notifications.saveError') || 'Failed to update notification settings');
    } finally {
      setSavingNotifications(false);
    }
  };

  const sendResetPassword = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showToast('success', t('account.security.resetSent') || 'Password reset email sent');
    } catch (error) {
      console.error('Failed to send reset email:', error);
      showToast('error', t('account.security.resetError') || 'Failed to send reset email');
    } finally {
      setSendingReset(false);
    }
  };

  const renderOverview = () => {
    if (!accountState) return null;
    const billing = accountState.billing;
    const isHostFamily = accountState.roles.includes('host_family');
    const summary = [
      { label: t('account.overview.roles') || 'Account roles', value: accountState.roles.map((role) => roleLabel(role, t)).join(', ') || '-' },
      { label: t('account.overview.approvalStatus') || 'Approval status', value: approvalLabel(accountState.approvalStatus, t) },
      { label: t('account.overview.profileCompletion') || 'Profile completion', value: accountState.profileCompletion !== null ? `${accountState.profileCompletion}%` : '-' },
    ];

    if (isHostFamily) {
      summary.splice(2, 0,
        { label: t('account.overview.subscriptionStatus') || 'Subscription status', value: subscriptionStatusLabel(billing.subscriptionStatus, t) },
        { label: t('account.overview.paymentStatus') || 'Payment status', value: paymentLabel(billing.paymentStatus, t) },
        { label: t('account.overview.nextBillingDate') || 'Next billing / plan end', value: formatDate(billing.renewalDate || billing.subscriptionEndDate) }
      );
    }

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-xl font-semibold text-gray-900">{t('account.overview.title') || 'Account Overview'}</h2>
          <p className="mt-2 text-sm text-gray-700">{messagingLabel(accountState, t)}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {summary.map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className="mt-2 text-base font-semibold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRoleProfiles = () => {
    if (!user || !accountState) return null;

    const cards = accountState.roles
      .filter((role): role is Exclude<AccountRole, 'general'> => role !== 'general')
      .map((role) => {
        const roleProfile = accountState.roleProfiles[role];
        const hasProfile = Boolean(roleProfile);
        const status = normalizeStatus(roleProfile?.profile_status) || (hasProfile ? 'active' : 'setup required');

        if (role === 'host_family') {
          return {
            role,
            icon: Home,
            description: t('account.roles.hostFamilyDesc') || 'Manage your host family profile and approval state',
            status,
            primaryAction: () => navigate('/au-pair/edit-family-profile'),
            primaryLabel: hasProfile ? t('account.actions.editProfile') || 'Edit profile' : t('account.actions.completeSetup') || 'Complete setup',
            secondaryAction: hasProfile ? () => navigate(`/host-family/profile/${user.id}`) : () => navigate('/au-pair/select-role'),
            secondaryLabel: hasProfile ? t('account.actions.viewProfile') || 'View profile' : t('account.actions.startOnboarding') || 'Start onboarding',
          };
        }

        if (role === 'au_pair') {
          return {
            role,
            icon: Users,
            description: t('account.roles.auPairDesc') || 'Manage your Au Pair profile and visibility',
            status,
            primaryAction: () => navigate('/au-pair/edit-profile'),
            primaryLabel: hasProfile ? t('account.actions.editProfile') || 'Edit profile' : t('account.actions.completeSetup') || 'Complete setup',
            secondaryAction: hasProfile ? () => navigate(`/au-pair/profile/${user.id}`) : () => navigate('/au-pair/select-role'),
            secondaryLabel: hasProfile ? t('account.actions.viewProfile') || 'View profile' : t('account.actions.startOnboarding') || 'Start onboarding',
          };
        }

        if (role === 'employer') {
          return {
            role,
            icon: Briefcase,
            description: t('account.roles.employerDesc') || 'Manage your employer profile and hiring settings',
            status,
            primaryAction: () => navigate('/employer/profile/edit'),
            primaryLabel: hasProfile ? t('account.actions.editProfile') || 'Edit profile' : t('account.actions.completeSetup') || 'Complete setup',
            secondaryAction: () => navigate('/employer/dashboard'),
            secondaryLabel: t('account.actions.openDashboard') || 'Open dashboard',
          };
        }

        return {
          role,
          icon: Briefcase,
          description: t('account.roles.jobSeekerDesc') || 'Manage your job seeker profile and applications',
          status,
          primaryAction: () => navigate('/jobs/edit-profile'),
          primaryLabel: hasProfile ? t('account.actions.editProfile') || 'Edit profile' : t('account.actions.completeSetup') || 'Complete setup',
          secondaryAction: () => navigate('/jobs/role-selection'),
          secondaryLabel: t('account.actions.manageRole') || 'Manage role',
        };
      });

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-900">{t('account.roles.general') || 'General User'}</p>
          <p className="mt-1 text-sm text-gray-600">{t('account.roles.generalDesc') || 'Shared identity settings are managed in Personal Info.'}</p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSection('personal')}>
              {t('account.actions.editPersonalInfo') || 'Edit personal info'}
            </Button>
          </div>
        </div>

        {cards.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
            {t('account.roles.noRoleProfiles') || 'No role profiles enabled yet.'}
          </div>
        )}

        {cards.map((card) => (
          <div key={card.role} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <card.icon className="h-5 w-5 text-gray-700" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{roleLabel(card.role as AccountRole, t)}</p>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 capitalize">{card.status}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={card.primaryAction}>{card.primaryLabel}</Button>
              <Button size="sm" variant="outline" onClick={card.secondaryAction}>{card.secondaryLabel}</Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBilling = () => {
    if (!accountState) return null;
    const billing = accountState.billing;
    const isHostFamily = accountState.roles.includes('host_family');

    if (!isHostFamily) {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-semibold text-gray-900">{t('account.billing.notApplicableTitle') || 'No host-family subscription on this account'}</p>
            <p className="mt-2 text-sm text-gray-600">
              {t('account.billing.notApplicableDesc') || 'Host Family Premium billing (100 CNY/month) applies only to users with the Host Family role.'}
            </p>
            <div className="mt-4">
              <Button size="sm" variant="outline" onClick={() => setSection('roles')}>
                {t('account.actions.manageRole') || 'Manage roles'}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const planText =
      billing.currentPlan === 'premium'
        ? (t('settings.billing.premiumPlan') || 'Premium Plan')
        : billing.currentPlan === 'free'
          ? (t('settings.billing.freePlan') || 'Free Plan')
          : '-';

    const statusText = subscriptionStatusLabel(billing.subscriptionStatus, t);
    const rejectionReason = accountState.latestPaymentSubmission?.admin_notes || null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('account.billing.currentPlan') || 'Current plan'}</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{planText}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('account.billing.paymentStatus') || 'Payment status'}</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{paymentLabel(billing.paymentStatus, t)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('account.billing.subscriptionStatus') || 'Subscription status'}</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{statusText}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('account.billing.subscriptionStart') || 'Subscription start date'}</p>
            <p className="mt-2 text-base font-semibold text-gray-900">{formatDate(billing.subscriptionStartDate)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('account.billing.subscriptionEnd') || 'Subscription end / renewal date'}</p>
            <p className="mt-2 text-base font-semibold text-gray-900">{formatDate(billing.renewalDate || billing.subscriptionEndDate)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('account.billing.approvalDate') || 'Approval date'}</p>
            <p className="mt-2 text-base font-semibold text-gray-900">{formatDate(billing.approvalDate)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('account.billing.contactAccess') || 'Contact access'}</p>
            <p className="mt-2 text-base font-semibold text-gray-900">
              {billing.contactAccessEnabled ? (t('account.billing.contactEnabled') || 'Enabled') : (t('account.billing.contactLocked') || 'Locked')}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('account.billing.price') || 'Price'}</p>
            <p className="mt-2 text-base font-semibold text-gray-900">100 CNY / month</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-700">
            {billing.subscriptionStatus === 'premium_active'
              ? ((t('account.billing.activeUntilHint') || 'Premium active until {{date}}. You can contact au pairs.')
                .replace('{{date}}', formatDate(billing.subscriptionEndDate)))
              : billing.subscriptionStatus === 'pending_approval'
                ? (t('account.billing.pendingApprovalHint') || 'Payment submitted, awaiting admin approval. You remain on the Free Plan until approval.')
                : billing.subscriptionStatus === 'premium_expired'
                  ? (t('account.billing.expiredHint') || 'Subscription expired, you are now on the Free Plan. Renew to continue contacting au pairs.')
                  : billing.subscriptionStatus === 'rejected'
                    ? (t('account.billing.rejectedHint') || 'Payment was rejected. Submit a new payment proof to request approval again.')
                    : (t('account.billing.pendingPaymentHint') || 'You are on the Free Plan. Submit payment proof to activate Premium.')}
          </p>
          {billing.subscriptionStatus === 'rejected' && rejectionReason && (
            <p className="mt-2 text-sm text-red-700">
              {t('account.billing.rejectionReason') || 'Rejection reason'}: {rejectionReason}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {billing.subscriptionStatus !== 'premium_active' && (
              <Button size="sm" onClick={() => navigate('/au-pair/payment')}>
                {t('account.actions.managePayment') || 'Manage payment'}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => navigate('/account?section=overview')}>
              {t('account.actions.viewOverview') || 'View overview'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Button onClick={() => navigate('/signin')}>{t('auth.signIn') || 'Sign In'}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 relative overflow-hidden">
      <BackgroundBlobs className="opacity-50" />
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="rounded-3xl border border-white/60 bg-white/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-6 md:px-10">
            <h1 className="text-3xl font-bold text-gray-900">{t('common.account') || 'Account'}</h1>
            <p className="mt-2 text-gray-600">
              {t('account.subtitle') || 'Manage your account, profile roles, subscription, and security in one place.'}
            </p>
          </div>

          <div className="border-b border-gray-100 px-4 md:px-8">
            <nav className="flex gap-2 overflow-x-auto py-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    activeSection === item.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 md:p-8">
            {activeSection === 'overview' && renderOverview()}

            {activeSection === 'personal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input label={t('settings.profile.firstName')} value={personalForm.first_name} onChange={(e) => onPersonalChange('first_name', e.target.value)} />
                  <Input label={t('settings.profile.lastName')} value={personalForm.last_name} onChange={(e) => onPersonalChange('last_name', e.target.value)} />
                  <Input label={t('settings.profile.displayName')} value={personalForm.display_name} onChange={(e) => onPersonalChange('display_name', e.target.value)} />
                  <Input label={t('settings.profile.phone')} value={personalForm.phone} onChange={(e) => onPersonalChange('phone', e.target.value)} />
                  <Input label={t('settings.profile.dob')} type="date" value={personalForm.date_of_birth} onChange={(e) => onPersonalChange('date_of_birth', e.target.value)} />
                  <Input label={t('settings.profile.gender')} value={personalForm.gender} onChange={(e) => onPersonalChange('gender', e.target.value)} />
                  <Input label={t('settings.profile.nationality')} value={personalForm.nationality} onChange={(e) => onPersonalChange('nationality', e.target.value)} />
                  <Input
                    label={t('settings.profile.citizenship') || t('profilePage.details.citizenship') || 'Citizenship'}
                    value={personalForm.citizenship_country}
                    onChange={(e) => onPersonalChange('citizenship_country', e.target.value)}
                  />
                  <Input label={t('settings.profile.residence')} value={personalForm.residence_country} onChange={(e) => onPersonalChange('residence_country', e.target.value)} />
                  <Input label={t('settings.profile.province')} value={personalForm.residence_province} onChange={(e) => onPersonalChange('residence_province', e.target.value)} />
                  <Input label={t('settings.profile.city')} value={personalForm.residence_city} onChange={(e) => onPersonalChange('residence_city', e.target.value)} />
                </div>
                <Textarea label={t('settings.profile.bio')} value={personalForm.bio} rows={4} onChange={(e) => onPersonalChange('bio', e.target.value)} />
                <div className="pt-2">
                  <Button onClick={savePersonalInfo} isLoading={savingPersonal}>{t('common.saveChanges') || 'Save Changes'}</Button>
                </div>
              </div>
            )}

            {activeSection === 'roles' && renderRoleProfiles()}

            {activeSection === 'billing' && renderBilling()}

            {activeSection === 'security' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Lock className="mt-1 h-5 w-5 text-gray-700" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t('auth.changePassword') || 'Change Password'}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {t('settings.security.passwordDesc') || 'Send a password reset link to your account email.'}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={sendResetPassword} isLoading={sendingReset}>
                      {t('account.security.sendResetLink') || 'Send reset link'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Shield className="mt-1 h-5 w-5 text-gray-700" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t('settings.security.2fa') || 'Two-Factor Authentication'}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {t('settings.security.2faDesc') || 'Add an extra layer of security to your account.'}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" disabled>{t('account.security.comingSoon') || 'Coming soon'}</Button>
                  </div>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="mt-1 h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">{t('settings.security.deleteAccount') || 'Delete Account'}</p>
                      <p className="mt-1 text-sm text-red-700">
                        {t('account.security.deleteAccountHelp') || 'For account deletion requests, please contact support.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="space-y-4">
                    <label className="flex items-center justify-between gap-4">
                      <span>
                        <p className="text-sm font-semibold text-gray-900">{t('settings.notifications.email') || 'Email Notifications'}</p>
                        <p className="text-sm text-gray-600">{t('settings.notifications.emailDesc') || 'Receive important account updates by email.'}</p>
                      </span>
                      <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications((prev) => ({ ...prev, email: e.target.checked }))} className="h-5 w-5 rounded border-gray-300" />
                    </label>

                    <label className="flex items-center justify-between gap-4">
                      <span>
                        <p className="text-sm font-semibold text-gray-900">{t('settings.notifications.sms') || 'SMS Notifications'}</p>
                        <p className="text-sm text-gray-600">{t('settings.notifications.smsDesc') || 'Receive important alerts by SMS.'}</p>
                      </span>
                      <input type="checkbox" checked={notifications.sms} onChange={(e) => setNotifications((prev) => ({ ...prev, sms: e.target.checked }))} className="h-5 w-5 rounded border-gray-300" />
                    </label>

                    <label className="flex items-center justify-between gap-4">
                      <span>
                        <p className="text-sm font-semibold text-gray-900">{t('settings.notifications.inApp') || 'In-App Notifications'}</p>
                        <p className="text-sm text-gray-600">{t('settings.notifications.inAppDesc') || 'Show notifications inside the platform.'}</p>
                      </span>
                      <input type="checkbox" checked={notifications.inApp} onChange={(e) => setNotifications((prev) => ({ ...prev, inApp: e.target.checked }))} className="h-5 w-5 rounded border-gray-300" />
                    </label>
                  </div>
                  <div className="mt-6">
                    <Button onClick={saveNotifications} isLoading={savingNotifications}>{t('common.saveChanges') || 'Save Changes'}</Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 md:px-8">
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-600" />
                {approvalLabel(accountState?.approvalStatus || null, t)}
              </span>
              <span className="inline-flex items-center gap-2">
                <CreditCard size={14} className="text-blue-600" />
                {paymentLabel(accountState?.billing.paymentStatus || null, t)}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarClock size={14} className="text-purple-600" />
                {formatDate(accountState?.billing.subscriptionEndDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
