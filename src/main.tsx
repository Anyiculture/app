import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import { ToastProvider } from './components/ui/Toast';
import { router } from './router';
import './i18n/config';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <PersonalizationProvider>
          <ToastProvider> 
            <RouterProvider router={router} />
           </ToastProvider>
        </PersonalizationProvider>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>
);
