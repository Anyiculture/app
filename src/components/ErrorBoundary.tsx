import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import { Button } from './ui/Button';
import { useI18n } from '../contexts/I18nContext';

export function ErrorBoundary() {
  const error = useRouteError();
  const { t } = useI18n();

  let errorMessage: string;
  let errorStatus: number | undefined;

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    errorMessage = error.statusText || error.data?.message || t('common.unknownError');
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = t('common.unknownError');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {errorStatus || t('common.error')}
          </h1>
          <p className="text-xl text-gray-600 mb-6">{errorMessage}</p>
        </div>

        <div className="space-y-3">
          <Link to="/dashboard" className="block">
            <Button className="w-full">
              <span className="flex items-center justify-center gap-2">
                <Home size={20} />
                {t('common.backToDashboard')}
              </span>
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            {t('common.reloadPage')}
          </Button>
        </div>

        {error instanceof Error && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              {t('common.technicalDetails')}
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

