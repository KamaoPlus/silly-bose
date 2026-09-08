/**
 * Calculate the Impact Score % for a published video.
 *
 * Formula:
 *   Impact % = (Views/ViewTarget × 0.40) + (CTR/CTRTarget × 0.30) + (WatchTime/WatchTarget × 0.30)
 *   Capped at 150% to handle viral outliers.
 */
export function calcImpactScore(metrics) {
  const { views, ctr, watchTime, viewTarget, ctrTarget, watchTimeTarget } = metrics;

  if (!viewTarget || !ctrTarget || !watchTimeTarget) return null;

  const viewScore    = (views / viewTarget) * 0.40;
  const ctrScore     = (ctr / ctrTarget) * 0.30;
  const watchScore   = (watchTime / watchTimeTarget) * 0.30;

  const raw = (viewScore + ctrScore + watchScore) * 100;
  return Math.min(Math.round(raw * 10) / 10, 150);
}

/**
 * Get a colour class based on score threshold.
 */
export function scoreColor(score) {
  if (score === null) return 'text-gray-500';
  if (score >= 100) return 'text-green-400';
  if (score >= 75)  return 'text-yellow-400';
  if (score >= 50)  return 'text-orange-400';
  return 'text-red-400';
}

export function scoreBg(score) {
  if (score === null) return 'bg-gray-700';
  if (score >= 100) return 'bg-green-500';
  if (score >= 75)  return 'bg-yellow-500';
  if (score >= 50)  return 'bg-orange-500';
  return 'bg-red-500';
}

export function scoreLabel(score) {
  if (score === null) return '—';
  if (score >= 120) return '🚀 Viral';
  if (score >= 100) return '✅ Hit';
  if (score >= 75)  return '⚡ Close';
  if (score >= 50)  return '⚠️ Below';
  return '❌ Miss';
}

/**
 * Calculate per-member impact contribution from a set of tasks.
 * @param {object[]} tasks - all published tasks with metrics
 * @param {string} role - role name
 */
export function calcMemberImpact(tasks, role) {
  const contributed = tasks.filter(
    t => t.columnId === 'published' && t.metrics && t.assignees?.[role]
  );
  if (!contributed.length) return { videos: 0, avgScore: 0, totalViews: 0 };

  const scores = contributed
    .map(t => calcImpactScore(t.metrics))
    .filter(s => s !== null);

  const avgScore = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0;

  const totalViews = contributed.reduce((sum, t) => sum + (t.metrics?.views ?? 0), 0);

  return { videos: contributed.length, avgScore, totalViews };
}
