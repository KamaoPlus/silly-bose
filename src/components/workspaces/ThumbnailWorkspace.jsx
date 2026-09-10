import React, { useState } from 'react';
import {
  Image,
  FileText,
  FileCode,
  ExternalLink,
  Download,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  CheckSquare,
  Square,
  AlertTriangle,
  Layers,
  Palette,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChannelTag } from '../ui/Badge';
import Button from '../ui/Button';
import { buildWhatsAppDispatchPayload, buildWhatsAppClickToChatUrl } from '../../utils/whatsapp';

export default function ThumbnailWorkspace() {
  const { state, actions, currentUser } = useApp();

  const [thumbnailInputs, setThumbnailInputs] = useState({});
  const [sopChecklists, setSopChecklists] = useState({});

  const currentUserId = currentUser?.id;

  // Filter tasks where thumbnail is in progress, pending, or completed, or assigned to current user
  // If user is a thumbnail designer or admin, show all relevant tasks
  const thumbnailTasks = (state.tasks || []).filter((t) => {
    if (!t) return false;
    const isAssigned = t.stages?.thumbnail?.assigneeId === currentUserId;
    const isThumbnailStage =
      t.stages?.thumbnail?.status === 'In Progress' ||
      t.stages?.thumbnail?.status === 'Pending' ||
      t.stages?.thumbnail?.status === 'Completed' ||
      t.stages?.editor?.status === 'Completed' ||
      Boolean(t.thumbnailAssetUrl);
    // If user has thumbnail role, show all tasks that have thumbnail stage or are in pipeline
    const isDesignerRole = currentUser?.role?.toLowerCase().includes('thumb') || currentUser?.role?.toLowerCase().includes('design');
    return isAssigned || isThumbnailStage || isDesignerRole;
  });

  const getThumbnailUrl = (task) => {
    if (!task) return '';
    return thumbnailInputs[task.id] !== undefined
      ? thumbnailInputs[task.id]
      : (task.thumbnailAssetUrl || '');
  };

  const getChecklist = (task) => {
    if (!task) return { threeElementRule: true, highContrastGlow: true, mobileZoomTest: true, layeredPsdDelivered: false };
    return (
      sopChecklists[task.id] || {
        threeElementRule: true,
        highContrastGlow: true,
        mobileZoomTest: true,
        layeredPsdDelivered: false,
      }
    );
  };

  const toggleChecklist = (taskId, itemKey) => {
    if (!taskId) return;
    setSopChecklists((prev) => {
      const current = prev[taskId] || {
        threeElementRule: true,
        highContrastGlow: true,
        mobileZoomTest: true,
        layeredPsdDelivered: false,
      };
      return {
        ...prev,
        [taskId]: {
          ...current,
          [itemKey]: !current[itemKey],
        },
      };
    });
  };

  const handleSubmitThumbnail = (task) => {
    if (!task) return;
    const thumbnailAssetUrl = (getThumbnailUrl(task) || '').trim();
    if (!thumbnailAssetUrl) return; // Guarded by mandatory check

    const channel = (state.channels || []).find((c) => c?.id === task.channelId);

    // Find Strategist assignee (the next role in sequence)
    const stratAssigneeId = task.stages?.strategist?.assigneeId;
    const targetStrategist =
      (state.employees || []).find((e) => e?.id === stratAssigneeId) ||
      (state.employees || []).find((e) => e?.role?.toLowerCase().includes('strat'));

    const handoffData = { thumbnailAssetUrl };

    // Trigger instant WhatsApp payload
    const notificationMeta = buildWhatsAppDispatchPayload({
      task: { ...task, ...handoffData },
      channel,
      employee: targetStrategist,
      stageName: 'STRATEGIST UPLOAD & PUBLISH',
      triggerType: 'instant_handoff',
      completedBy: 'Thumbnail Designer',
      deliverableLink: thumbnailAssetUrl,
    });

    // Update handoff
    actions.updateTaskHandoff(task.id, handoffData, notificationMeta);

    // Mark thumbnail completed and strategist in progress
    actions.updateStage(task.id, 'thumbnail', {
      assigneeId: task.stages?.thumbnail?.assigneeId || currentUser?.id,
      status: 'Completed',
    });

    if (task.stages?.strategist?.status === 'Pending') {
      actions.updateStage(task.id, 'strategist', {
        assigneeId: task.stages?.strategist?.assigneeId,
        status: 'In Progress',
      });
    }

    alert(`🎨 Thumbnail asset submitted! ⚡ Instant WhatsApp alert triggered to Strategist (${targetStrategist?.name || 'Strategist'}).`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-xs font-bold text-pink-700 uppercase tracking-wide">
              Thumbnail Suite
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            High-CTR Visuals & PSD Assets
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Reference script cues, design 3-element compositions, and submit layered PSD master files.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Assigned</p>
            <p className="text-base font-extrabold text-slate-900">{thumbnailTasks.length}</p>
          </div>
          <div className="w-px h-7 bg-slate-200" />
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">CTR Target</p>
            <p className="text-base font-extrabold text-pink-600">≥ 7.5%</p>
          </div>
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-5">
        {thumbnailTasks.map((task) => {
          if (!task) return null;
          const channel = (state.channels || []).find((c) => c?.id === task.channelId);
          const currentUrl = getThumbnailUrl(task);
          const checklist = getChecklist(task);
          const isCompleted = task.stages?.thumbnail?.status === 'Completed';
          const isUrlMissing = !currentUrl.trim();

          return (
            <div
              key={task.id}
              className={`bg-white border rounded-2xl shadow-card p-5 space-y-5 transition-all ${
                isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ChannelTag channel={channel} size="xs" />
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Clock size={12} /> Target: <strong className="text-slate-800">{task.targetDate || 'TBD'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-pink-50 text-pink-700 border-pink-300'
                    }`}
                  >
                    {isCompleted ? 'Thumbnail Completed' : 'Design In Progress'}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-base font-bold text-slate-900">{task.title || 'Untitled Video'}</h3>
                {task.notes && (
                  <p className="text-xs text-slate-500 mt-1">
                    🎯 <strong>Creative Directive:</strong> {task.notes}
                  </p>
                )}
              </div>

              {/* SCRIPT CONTEXT ACCESS BOX */}
              <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-sky-950 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText size={14} className="text-sky-700" />
                    Researcher Script Access (Visual Context & Emotion Hooks)
                  </p>
                  <span className="text-[11px] text-sky-700 font-medium">Inspect story beats for visual cues</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {task.scriptDocUrl ? (
                    <a
                      href={task.scriptDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-sky-300 text-sky-800 hover:text-sky-950 hover:border-sky-500 font-semibold text-xs shadow-xs transition-colors"
                    >
                      <FileText size={14} className="text-sky-600" />
                      <span>Open Google Docs Script Draft</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic bg-white/70 px-3 py-1.5 rounded-lg border border-slate-200">
                      No Google Docs link submitted
                    </span>
                  )}

                  {task.scriptDocxName ? (
                    <button
                      type="button"
                      onClick={() => alert(`Downloading script reference: ${task.scriptDocxName}`)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-sky-300 text-sky-800 hover:text-sky-950 hover:border-sky-500 font-semibold text-xs shadow-xs transition-colors"
                    >
                      <FileCode size={14} className="text-sky-600" />
                      <span>Download Word Script ({task.scriptDocxName})</span>
                      <Download size={12} />
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic bg-white/70 px-3 py-1.5 rounded-lg border border-slate-200">
                      No .docx script attached
                    </span>
                  )}
                </div>
              </div>

              {/* REQUIRED DELIVERABLE: Final Thumbnail Asset / PSD Drive URL */}
              <div className="bg-pink-50/50 border border-pink-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-pink-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Image size={15} className="text-pink-700" />
                    Final Thumbnail Asset / PSD Drive URL *
                  </label>
                  <span className="text-[11px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded">
                    Mandatory Link
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={currentUrl}
                    onChange={(e) =>
                      setThumbnailInputs({ ...thumbnailInputs, [task.id]: e.target.value })
                    }
                    placeholder="https://drive.google.com/file/d/Thumbnail-Final-1280x720.psd/..."
                    className={`flex-1 text-xs px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-xs ${
                      isUrlMissing ? 'border-pink-300' : 'border-slate-300'
                    }`}
                  />
                  {currentUrl && (
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-white border border-slate-300 hover:border-pink-500 text-pink-700 rounded-lg flex items-center justify-center transition-colors shadow-xs"
                      title="Open thumbnail file in new tab"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                {isUrlMissing && (
                  <p className="text-[11px] text-pink-700 flex items-center gap-1 font-semibold">
                    <AlertTriangle size={12} />
                    Mandatory deliverable check: Paste your Photoshop PSD or Google Drive thumbnail asset URL to enable handoff.
                  </p>
                )}
              </div>

              {/* THUMBNAIL QUALITY SOP CHECKLIST */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Palette size={13} className="text-pink-600" />
                  Thumbnail CTR Standards & SOP Checklist
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <button
                    type="button"
                    onClick={() => toggleChecklist(task.id, 'threeElementRule')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {checklist.threeElementRule ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>3-Element Rule: Face cutout + Focal object + 3-word bold title</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChecklist(task.id, 'highContrastGlow')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {checklist.highContrastGlow ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Contrast: Background dimmed & subjects highlighted with color fringe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChecklist(task.id, 'mobileZoomTest')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {checklist.mobileZoomTest ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Mobile Test: Clear text legibility when zoomed down to 10% size</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChecklist(task.id, 'layeredPsdDelivered')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {checklist.layeredPsdDelivered ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Export Specs: 1280x720 16:9 ratio under 2MB limit with layered PSD</span>
                  </button>
                </div>
              </div>

              {/* ACTION FOOTER WITH MANDATORY FILE CHECK */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="text-xs">
                  {isUrlMissing ? (
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <AlertTriangle size={13} />
                      Cannot hand off: deliverable link required
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      Thumbnail asset link ready for instant handoff
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(() => {
                    const stratAssigneeId = task.stages?.strategist?.assigneeId;
                    const targetStrategist =
                      (state.employees || []).find((e) => e?.id === stratAssigneeId) ||
                      (state.employees || []).find((e) => e?.role?.toLowerCase().includes('strat'));
                    const waUrl = buildWhatsAppClickToChatUrl({
                      employee: targetStrategist,
                      task,
                      channel: (state.channels || []).find((c) => c?.id === task.channelId),
                      phaseName: 'THUMBNAIL DESIGN',
                      deliverableLink: currentUrl,
                      nextRoleName: 'Strategist',
                    });
                    return (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                        title="Open WhatsApp chat with Strategist"
                      >
                        <MessageSquare size={14} />
                        <span>Send WhatsApp Update</span>
                      </a>
                    );
                  })()}

                  <Button
                    variant="primary"
                    size="sm"
                    icon={Send}
                    disabled={isUrlMissing}
                    onClick={() => handleSubmitThumbnail(task)}
                  >
                    Submit Thumbnail & Hand Off
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {thumbnailTasks.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
            No thumbnail design tasks currently in queue.
          </div>
        )}
      </div>
    </div>
  );
}
