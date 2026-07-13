export function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return 'Just now';
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatPostLifespan(expiresAt: string | null, isPermanent: boolean): string {
  if (isPermanent) {
    return 'Permanent';
  }

  if (!expiresAt) {
    return '24 Hours';
  }

  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  const remainingHours = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60)));
  return `${remainingHours}h left`;
}
