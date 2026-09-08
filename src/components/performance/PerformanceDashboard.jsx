import React, { useState } from 'react';
import { BarChart2, TrendingUp, Eye, MousePointerClick, Clock, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calcImpactScore, scoreColor, scoreBg, scoreLabel } from '../../utils/impactScore';
import { ChannelTag } from '../ui/Badge';
import { formatDate } from '../../utils/dateHelpers';
import MetricsModal from './MetricsModal';
import Button from '../ui/Button';

function ImpactBar({ score }) {
  if (score === null) return <span className="text-gray-500 text-xs">—</span>;
  const pct = Math.min(score, 150);
  const bg = scoreBg(score);
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-surface-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bg}`}
          style={{ width: `${(pct / 150) * 100}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${scoreColor(score)}`}>
        {score}%
      </span>
    </div>
  );
}

export default function PerformanceDashboard() {
  const { state } = useApp();
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [channelFilter, setChannelFilter] = useState('all');

  const publishedTasks = state.tasks.filter(t => t.columnId === 'published');
  const filtered = publishedTasks.filter(t =>
    channelFilter === 'all' || t.channelId === channelFilter
  );

  const totalViews = filtered.reduce((s, t) => s + (t.metrics?.views ?? 0), 0);
  const scoredTasks = filtered.filter(t => t.metrics);
  const avgImpact = scoredTasks.length
    ? Math.round(
        scoredTasks.map(t => calcImpactScore(t.metrics) ?? 0).reduce((a, b) => a + b, 0) / scoredTasks.length * 10
      ) / 10
    : null;

  const handleLogMetrics = (task) => {
    setSelectedTask(task);
    setMetricsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Eye, label: 'Total Views', value: totalViews.toLocaleString('en-IN'), color: 'text-sky-400' },
          { icon: BarChart2, label: 'Published Videos', value: filtered.length, color: 'text-violet-400' },
          { icon: TrendingUp, label: 'Avg Impact Score', value: avgImpact !== null ? `${avgImpact}%` : '—', color: 'text-emerald-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-surface-800 border border-surface-600 rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-surface-700 flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChannelFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${channelFilter === 'all' ? 'bg-accent text-white' : 'bg-surface-700 text-gray-400 hover:text-gray-200'}`}
          >
            All Channels
          </button>
          {state.channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => setChannelFilter(ch.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${channelFilter === ch.id ? 'text-white' : 'bg-surface-700 text-gray-400 hover:text-gray-200'}`}
              style={channelFilter === ch.id ? { backgroundColor: ch.color } : {}}
            >
              {ch.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-800 border border-surface-600 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-600 bg-surface-700/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Video</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Channel</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Published</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1"><Eye size={12}/> Views</div>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1"><MousePointerClick size={12}/> CTR %</div>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1"><Clock size={12}/> Watch Time</div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Impact Score</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-600/50">
              {filtered.map(task => {
                const channel = state.channels.find(c => c.id === task.channelId);
                const score = task.metrics ? calcImpactScore(task.metrics) : null;
                return (
                  <tr key={task.id} className="hover:bg-surface-700/40 transition-colors">
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="font-medium text-gray-200 line-clamp-2 text-sm leading-snug">{task.title}</p>
                      {task.metrics && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          vs {task.metrics.viewTarget?.toLocaleString('en-IN')} target
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ChannelTag channel={channel} size="xs" />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(task.targetDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {task.metrics
                        ? <span className="text-gray-200 font-medium tabular-nums">{task.metrics.views.toLocaleString('en-IN')}</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {task.metrics
                        ? <span className="text-gray-200 font-medium tabular-nums">{task.metrics.ctr}%</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {task.metrics
                        ? <span className="text-gray-200 font-medium tabular-nums">{Math.floor(task.metrics.watchTime / 60)}m {task.metrics.watchTime % 60}s</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <div className="flex flex-col gap-1">
                        <ImpactBar score={score} />
                        {score !== null && (
                          <span className="text-[10px] text-gray-500">{scoreLabel(score)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="xs"
                        variant={task.metrics ? 'ghost' : 'secondary'}
                        onClick={() => handleLogMetrics(task)}
                        icon={BarChart2}
                      >
                        {task.metrics ? 'Edit' : 'Log'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">
                    No published videos yet. Move tasks to "Published" to start tracking performance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MetricsModal
        isOpen={metricsModalOpen}
        onClose={() => setMetricsModalOpen(false)}
        task={selectedTask}
      />
    </div>
  );
}
