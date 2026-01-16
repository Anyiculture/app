import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function SettingsDashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/settings/general', { replace: true });
  }, [navigate]);

  return null;
}
