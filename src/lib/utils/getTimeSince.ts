export function getTimeSince(dateStr: string, options?: { suffix?: boolean }): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const suffix = options?.suffix !== false ? ' ago' : '';
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m${suffix}`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m${suffix}`;
}
