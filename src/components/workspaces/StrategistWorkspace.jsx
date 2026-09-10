import React, { useState } from 'react';
import {
  Sparkles,
  Film,
  Image,
  ExternalLink,
  CheckCircle2,
  Clock,
  Calendar,
  Send,
  UploadCloud,
  CheckSquare,
  Square,
  AlertCircle,
  Plus,
  PlaySquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChannelTag } from '../ui/Badge';
import Button from '../ui/Button';
import AddTaskModal from '../dashboard/AddTaskModal';
import { buildWhatsAppDispatchPayload } from '../../utils/whatsapp';

export default function StrategistWorkspace({ onNavigateView }) {
  const { state, actions } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState('all');

  // Filter tasks that have final video/thumbnail or are in strategist review / ready to publish / published
  const reviewTasks = state.tasks.filter((t) => {
    const matchesChannel = selectedChannelFilter === 'all' || t.channelId === selectedChannelFilter;
    const hasDeliverables = Boolean(t.finalVideoUrl || t.thumbnailAssetUrl);
    const isReadyOrDone =
      t.stages?.editor?.status === 'Completed' ||
      t.stages?.thumbnail?.status === 'Completed' ||
      t.stages?.strategist?.status === 'In Progress' ||
      t.stages?.strategist?.status === 'Completed';
    return matchesChannel && (hasDeliverables || isReadyOrDone);
  });

  const handleMarkStatus = (task, newStatus) => {
    const channel = state.channels.find((c) => c.id === task.channelId);

    // Update strategist stage directly (upload & publish)
    actions.updateStage(task.id, 'strategist', {
      assigneeId: task.stages?.strategist?.assigneeId,
      status: newStatus,
    });

    if (newStatus === 'Completed') {
      const notificationMeta = buildWhatsAppDispatchPayload({
        task,
        channel,
        employee: currentUser,
        stageName: 'VIDEO PUBLISHED ON YOUTUBE',
        triggerType: 'instant_handoff',
        completedBy: 'Strategist',
      });
      actions.updateTaskHandoff(task.id, {}, notificationMeta);
    }

    alert(`🚀 Video "${task.title}" updated to "${newStatus}"!`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
              Review & Publish
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Publishing Hub & Quality Check
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect master video cuts, verify thumbnail PSDs, package metadata, and schedule release.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Ready for Review</p>
            <p className="text-base font-extrabold text-slate-900">{reviewTasks.length}</p>
          </div>
          <div className="w-px h-7 bg-slate-200" />
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Publish Target</p>
            <p className="text-base font-extrabold text-indigo-600">100%</p>
          </div>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-card">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">Filter Channel:</span>
          <select
            value={selectedChannelFilter}
            onChange={(e) => setSelectedChannelFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Channels ({state.tasks.length})</option>
            {state.channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Pending Final Review: <strong className="text-slate-900">{reviewTasks.length} videos</strong>
          </span>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            + Schedule Video Task
          </Button>
        </div>
      </div>

      {/* Final Deliverables Review Queue */}
      <div className="space-y-4">
        {reviewTasks.map((task) => {
          const channel = state.channels.find((c) => c.id === task.channelId);
          const stratStage = task.stages?.strategist?.status || 'Pending';
          const isPublished = stratStage === 'Completed';
          const isReadyToPublish = stratStage === 'Review' || stratStage === 'In Progress' || (task.finalVideoUrl && task.thumbnailAssetUrl);

          return (
            <div
              key={task.id}
              className={`bg-white border rounded-2xl shadow-card p-5 space-y-5 transition-all ${
                isPublished
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-indigo-100 bg-indigo-50/10'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ChannelTag channel={channel} size="xs" />
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Clock size={12} /> Target: <strong className="text-slate-800">{task.targetDate}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      isPublished
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : isReadyToPublish
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {isPublished
                      ? '🚀 Published'
                      : isReadyToPublish
                      ? '⚡ Ready for Upload Review'
                      : 'Pending Final Render'}
                  </span>
                </div>
              </div>

              {/* Title & Metadata */}
              <div>
                <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                {task.notes && (
                  <p className="text-xs text-slate-500 mt-1">
                    🎯 <strong>Strategy Directive:</strong> {task.notes}
                  </p>
                )}
              </div>

              {/* Deliverables Inspection Box (Final Video & Thumbnail) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                {/* 1. Final Master Video Cut */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Film size={14} className="text-emerald-600" />
                      Final 4K Master Video
                    </span>
                    {task.finalVideoUrl ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Missing
                      </span>
                    )}
                  </div>

                  {task.finalVideoUrl ? (
                    <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-3">
                      <div className="truncate text-xs font-mono text-emerald-900">
                        {task.finalVideoUrl}
                      </div>
                      <a
                        href={task.finalVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex-shrink-0"
                      >
                        <span>Open Video</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-400 italic">
                      Editor has not submitted the final video drive link yet.
                    </div>
                  )}
                </div>

                {/* 2. Thumbnail PSD Asset */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Image size={14} className="text-emerald-600" />
                      Thumbnail PSD & Visual Asset
                    </span>
                    {task.thumbnailAssetUrl ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Missing
                      </span>
                    )}
                  </div>

                  {task.thumbnailAssetUrl ? (
                    <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-3">
                      <div className="truncate text-xs font-mono text-emerald-900">
                        {task.thumbnailAssetUrl}
                      </div>
                      <a
                        href={task.thumbnailAssetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex-shrink-0"
                      >
                        <span>Open PSD</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-400 italic">
                      Thumbnail asset link not submitted yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Strategist Publishing Approval Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-500">
                  {task.finalVideoUrl && task.thumbnailAssetUrl ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Ready for YouTube Uploading & Metadata Packaging
                    </span>
                  ) : (
                    <span>Waiting on complete deliverables before approval</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleMarkStatus(task, 'Review')}
                  >
                    Mark Ready to Publish
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={UploadCloud}
                    onClick={() => handleMarkStatus(task, 'Completed')}
                  >
                    Publish Now (Mark Completed)
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {reviewTasks.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
            No completed video cuts currently in review.
          </div>
        )}
      </div>

      <AddTaskModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
