export function translateEducationLevel(level: string | undefined, t: (key: string) => string): string {
  if (!level) return '';
  const key = `education.levels.${level.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? level : translated;
}

export function translateProgramType(type: string | undefined, t: (key: string) => string): string {
  if (!type) return '';
  const key = `education.programTypes.${type.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? type.replace(/_/g, ' ') : translated;
}

export function translateDeliveryMode(mode: string | undefined, t: (key: string) => string): string {
  if (!mode) return '';
  const key = `education.deliveryModes.${mode.toLowerCase().replace('-', '')}`;
  const translated = t(key);
  return translated === key ? mode.replace(/-/g, ' ') : translated;
}

export function translateScheduleType(type: string | undefined, t: (key: string) => string): string {
  if (!type) return '';
  const key = `education.scheduleTypes.${type.toLowerCase().replace('-', '')}`;
  const translated = t(key);
  return translated === key ? type.replace(/-/g, ' ') : translated;
}
