export function formatNumber(num: number): string {
  if (!Number.isFinite(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(Math.round(num));
}

export function getRelativeTime(dateString?: string | null): string {
  if (!dateString) return "reciente";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "reciente";
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) return "hace poco";
    return `${diffHours}h`;
  }
  if (diffDays > 365) return `${Math.floor(diffDays / 365)}a`;
  if (diffDays > 30) return `${Math.floor(diffDays / 30)}m`;
  return `${diffDays}d`;
}
