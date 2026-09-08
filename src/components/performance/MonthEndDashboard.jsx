import React, { useState } from 'react';
import { Trophy, Users, TrendingUp, Eye, Film, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLES } from '../../data/initialData';
import { calcMemberImpact, scoreColor, scoreBg } from '../../utils/impactScore';
import { Avatar } from '../ui/Avatar';

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2026, i, 1);
  return {
    value: `2026-${String(i + 1).padStart(2, '0')}`,
    label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  };
}).concat(
  Array.from({ length: 6 }, (_, i) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    };
  })
).filter((v, i, a) => a.findIndex(x => x.value === v.value) === i).sort((a, b) => b.value.localeCompare(a.value));

export default function MonthEndDashboard() {
  const { state } = useApp();
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  // Filter published tasks that fall in the selected month
  const publishedInMonth = state.tasks.filter(t =>
    t.columnId === 'published' &&
    t.metrics &&
    t.targetDate?.startsWith(selectedMonth)
  );

  // All published tasks (for overall stats regardless of month filter)
  const allPublished = state.tasks.filter(t => t.columnId === 'published' && t.metrics);

  const memberStats = ROLES.map(role => {
    const stats = calcMemberImpact(publishedInMonth, role);
    return { role, ...stats };
  });

  const topPerformer = memberStats.reduce(
    (best, m) => m.avgScore > (best?.avgScore ?? -1) ? m : best, null
  );

  const totalMonthViews = publishedInMonth.reduce((s, t) => s + (t.metrics?.views ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Month-End Team Impact</h2>
          <p className="text-sm text-gray-400 mt-0.5">Performance contribution across published videos</p>
        </div>
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="pl-3 pr-8 py-2 rounded-lg bg-surface-700 border border-surface-500 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-800 border border-surface-600 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Published This Month</p>
          <p className="text-3xl font-bold text-violet-400">{publishedInMonth.length}</p>
          <p className="text-xs text-gray-500 mt-1">videos with logged metrics</p>
        </div>
        <div className="bg-surface-800 border border-surface-600 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total Views</p>
          <p className="text-3xl font-bold text-sky-400">{totalMonthViews.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500 mt-1">across all channels</p>
        </div>
        <div className="bg-surface-800 border border-surface-600 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={14} className="text-yellow-400" />
            <p className="text-xs text-gray-400">Top Performer</p>
          </div>
          {topPerformer && topPerformer.videos > 0 ? (
            <>
              <div className="flex items-center gap-2 mt-1">
                <Avatar role={topPerformer.role} size="md" tooltip={false} />
                <div>
                  <p className="font-bold text-white text-sm">{topPerformer.role}</p>
                  <p className="text-xs text-yellow-400">{topPerformer.avgScore}% avg impact</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm mt-1">No data yet</p>
          )}
        </div>
      </div>

      {/* Team Impact Table */}
      <div className="bg-surface-800 border border-surface-600 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-600 flex items-center gap-2">
          <Users size={16} className="text-accent" />
          <h3 className="font-semibold text-gray-200">Team Impact Summary</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-600 bg-surface-700/40">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Team Member</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1"><Film size={11}/> Videos</div>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div className="flex items-center gap-1"><TrendingUp size={11}/> Avg Impact %</div>
              </th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div className="flex items-center justify-end gap-1"><Eye size={11}/> Total Views</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-600/40">
            {memberStats.map(({ role, videos, avgScore, totalViews }) => (
              <tr key={role} className="hover:bg-surface-700/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar role={role} size="md" tooltip={false} />
                    <div>
                      <p className="font-medium text-gray-200">{role}</p>
                      <p className="text-xs text-gray-500">
                        {videos === 0 ? 'No contributions this month' : `${videos} video${videos !== 1 ? 's' : ''} contributed`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`font-semibold ${videos > 0 ? 'text-gray-200' : 'text-gray-600'}`}>
                    {videos}
                  </span>
                </td>
                <td className="px-4 py-4 min-w-[200px]">
                  {videos > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-surface-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${scoreBg(avgScore)}`}
                          style={{ width: `${Math.min((avgScore / 150) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold tabular-nums w-14 text-right ${scoreColor(avgScore)}`}>
                        {avgScore}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-600 text-sm">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <span className={`font-semibold tabular-nums ${videos > 0 ? 'text-gray-200' : 'text-gray-600'}`}>
                    {videos > 0 ? totalViews.toLocaleString('en-IN') : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {publishedInMonth.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm border-t border-surface-600">
            No videos published with metrics logged for this month yet.
          </div>
        )}
      </div>
    </div>
  );
}
