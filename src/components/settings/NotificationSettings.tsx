import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function NotificationSettings() {
  const { t } = useI18n();
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [inAppEnabled, setInAppEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {t('settings.notifications.label')}
      </h1>
      <p className="text-gray-600">
        {t('settings.notifications.description') || t('settings.description')}
      </p>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                {t('settings.notifications.email') || 'Email Notifications'}
              </p>
              <p className="text-sm text-gray-600">
                {t('settings.notifications.emailDesc') || 'Receive important updates via email.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="h-5 w-5"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                {t('settings.notifications.sms') || 'SMS Notifications'}
              </p>
              <p className="text-sm text-gray-600">
                {t('settings.notifications.smsDesc') || 'Get text message alerts.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={smsEnabled}
              onChange={(e) => setSmsEnabled(e.target.checked)}
              className="h-5 w-5"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                {t('settings.notifications.inApp') || 'In-App Notifications'}
              </p>
              <p className="text-sm text-gray-600">
                {t('settings.notifications.inAppDesc') || 'Show notifications inside the app.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={inAppEnabled}
              onChange={(e) => setInAppEnabled(e.target.checked)}
              className="h-5 w-5"
            />
          </div>
        </div>

        <div className="mt-6">
          <Button>
            {t('common.save') || 'Save'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
