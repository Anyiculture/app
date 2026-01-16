export function translateJobType(jobType: string | undefined, t: (key: string) => string): string {
  if (!jobType) return '';

  const translations: Record<string, string> = {
    'full_time': t('jobs.fullTime'),
    'part_time': t('jobs.partTime'),
    'contract': t('jobs.contract'),
    'freelance': t('jobs.freelance'),
    'internship': t('jobs.internship'),
  };

  return translations[jobType] || jobType;
}

export function translateRemoteType(remoteType: string | undefined, t: (key: string) => string): string {
  if (!remoteType) return '';

  const translations: Record<string, string> = {
    'on_site': t('jobs.onSite'),
    'remote': t('jobs.remote'),
    'hybrid': t('jobs.hybrid'),
  };

  return translations[remoteType] || remoteType;
}

export function translateExperienceLevel(experienceLevel: string | undefined, t: (key: string) => string): string {
  if (!experienceLevel) return '';

  const translations: Record<string, string> = {
    'entry': t('jobs.entry'),
    'mid': t('jobs.mid'),
    'senior': t('jobs.senior'),
    'executive': t('jobs.executive'),
  };

  return translations[experienceLevel] || experienceLevel;
}
