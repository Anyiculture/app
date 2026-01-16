import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../../components/ui/Button';
import { Shield, Key, Lock, Trash2 } from 'lucide-react';

export function SecuritySettingsPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-gray-100 pb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Shield className="text-gray-700" size={32} />
            {t('settings.accountSecurity')}
        </h2>
        <p className="text-gray-500 mt-2 text-md">{t('settings.security.desc')}</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <Key size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{t('auth.changePassword')}</h3>
                        <p className="text-sm text-gray-500">{t('settings.security.passwordDesc')}</p>
                    </div>
                </div>
                <Button variant="outline">{t('common.update')}</Button>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-xl text-green-600">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{t('settings.security.2fa')}</h3>
                        <p className="text-sm text-gray-500">{t('settings.security.2faDesc')}</p>
                    </div>
                </div>
                <Button variant="outline">{t('common.enable')}</Button>
            </div>
        </div>

        <div className="pt-8 border-t border-gray-100">
             <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-xl text-red-600">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-900">{t('settings.security.deleteAccount')}</h3>
                            <p className="text-sm text-red-700">{t('settings.security.deleteDesc')}</p>
                        </div>
                    </div>
                    <Button className="bg-red-600 hover:bg-red-700 text-white border-red-600">{t('common.delete')}</Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
