import React, { useState } from 'react';
import {
  Film,
  Image,
  FileText,
  FileCode,
  Video,
  ExternalLink,
  Download,
  CheckCircle2,
  Clock,
  Send,
  Sliders,
  CheckSquare,
  Square,
  Sparkles,
  Scissors,
  Layers,
  Music,
  Tv,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChannelTag } from '../ui/Badge';
import Button from '../ui/Button';
import { buildWhatsAppDispatchPayload, buildWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import { handleDownloadOrOpenFile } from '../../utils/fileHelpers';

export default function EditorWorkspace() {
  const { state, actions, currentUser } = useApp();

  // Local state for deliverables per task: { [taskId]: { finalVideoUrl, thumbnailAssetUrl } }
  const [deliverables, setDeliverables] = useState({});
  const [editingSOPs, setEditingSOPs] = useState({});

  const userRole = (currentUser?.role || '').toLowerCase();
  const isManager = currentUser?.role === 'super admin' || userRole.includes('admin') || userRole.includes('strat');
  const currentUserId = currentUser?.id;

  // Individual task isolation:
  // Managers see all pipeline editing tasks; Editors only see tasks specifically assigned to them
  const editingTasks = (state.tasks || []).filter((t) => {
    if (!t) return false;
    if (isManager) {
      return (
        t.stages?.editor?.status === 'In Progress' ||
        t.stages?.editor?.status === 'Pending' ||
        t.stages?.editor?.status === 'Completed' ||
        t.stages?.production?.status === 'Completed' ||
        Boolean(t.finalVideoUrl)
      );
    }
    return t.stages?.editor?.assigneeId === currentUserId || t.assignedLead === currentUserId;
  });

  const canEditTask = (task) => {
    if (isManager) return true;
    return task.stages?.editor?.assigneeId === currentUserId || task.assignedLead === currentUserId;
  };

  const getDeliverable = (task) => {
    return (
      deliverables[task.id] || {
        finalVideoUrl: task.finalVideoUrl || '',
        thumbnailAssetUrl: task.thumbnailAssetUrl || '',
      }
    );
  };

  const updateDeliverable = (taskId, field, value) => {
    setDeliverables((prev) => {
      const current = prev[taskId] || {
        finalVideoUrl: state.tasks.find((t) => t.id === taskId)?.finalVideoUrl || '',
        thumbnailAssetUrl: state.tasks.find((t) => t.id === taskId)?.thumbnailAssetUrl || '',
      };
      return {
        ...prev,
        [taskId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const getSopChecklist = (task) => {
    return (
      editingSOPs[task.id] || {
        soundDesign: true,
        colorGrade: true,
        retentionPacing: true,
        captions: true,
        chapters: false,
      }
    );
  };

  const toggleSop = (taskId, itemKey) => {
    setEditingSOPs((prev) => {
      const current = prev[taskId] || {
        soundDesign: true,
        colorGrade: true,
        retentionPacing: true,
        captions: true,
        chapters: false,
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

  const handleSubmitFinalCut = (task) => {
    const deliv = getDeliverable(task);
    const finalVideoUrl = deliv.finalVideoUrl?.trim();

    if (!finalVideoUrl) return;

    const channel = state.channels.find((c) => c.id === task.channelId);

    const handoffData = {
      finalVideoUrl,
      thumbnailAssetUrl: deliv.thumbnailAssetUrl,
    };

    // Determine NEXT recipient in sequence: Thumbnail Designer
    const thumbnailAssigneeId = task.stages?.thumbnail?.assigneeId;
    const targetRecipient =
      state.employees.find((e) => e.id === thumbnailAssigneeId) ||
      state.employees.find((e) => e.role.toLowerCase() === 'thumbnail') ||
      state.employees.find((e) => e.role.toLowerCase() === 'strategist');

    const notificationMeta = buildWhatsAppDispatchPayload({
      task: { ...task, ...handoffData },
      channel,
      employee: targetRecipient,
      stageName: 'THUMBNAIL DESIGN',
      triggerType: 'instant_handoff',
      completedBy: 'Video Editor',
      deliverableLink: finalVideoUrl,
    });

    // Save handoff
    actions.updateTaskHandoff(task.id, handoffData, notificationMeta);

    // Update stages: editor Completed, thumbnail In Progress
    actions.updateStage(task.id, 'editor', {
      assigneeId: task.stages?.editor?.assigneeId || currentUser?.id,
      status: 'Completed',
    });

    if (task.stages?.thumbnail?.status === 'Pending') {
      actions.updateStage(task.id, 'thumbnail', {
        assigneeId: task.stages?.thumbnail?.assigneeId,
        status: 'In Progress',
      });
    }

    alert(`🎉 Final master cut handed off! ⚡ Instant WhatsApp alert triggered to Thumbnail Designer (${targetRecipient?.name || 'Thumbnail Designer'}).`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
              Editing Suite
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Intake Assets & Master Delivery
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review scripts and raw media, apply retention editing, and deliver 4K master cuts.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Assigned Cuts</p>
            <p className="text-base font-extrabold text-slate-900">{editingTasks.length}</p>
          </div>
          <div className="w-px h-7 bg-slate-200" />
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Audio Standard</p>
            <p className="text-base font-extrabold text-emerald-600">-14 LUFS</p>
          </div>
        </div>
      </div>

      {/* Editing Task Cards */}
      <div className="space-y-5">
        {editingTasks.map((task) => {
          const channel = state.channels.find((c) => c.id === task.channelId);
          const deliv = getDeliverable(task);
          const sops = getSopChecklist(task);
          const isEditCompleted = task.stages?.editor?.status === 'Completed';

          return (
            <div
              key={task.id}
              className={`bg-white border rounded-2xl shadow-card p-5 space-y-5 transition-all ${
                isEditCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
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
                      isEditCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-300'
                    }`}
                  >
                    {isEditCompleted ? 'Edit Completed' : 'Editing In Progress'}
                  </span>
                </div>
              </div>

              {/* Title & Notes */}
              <div>
                <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                {task.notes && (
                  <p className="text-xs text-slate-500 mt-1">
                    🎬 <strong>Creative Direction:</strong> {task.notes}
                  </p>
                )}
              </div>

              {/* 1. SINGLE-VIEW INTAKE ASSETS BOX */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Layers size={14} className="text-indigo-600" />
                    Intake Assets (Scripts, Footage & Audio)
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium">
                    All inputs for this video in one place
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {/* Google Docs Script */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between space-y-2 shadow-xs">
                    <div className="flex items-start gap-2">
                      <FileText size={16} className="text-sky-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">Google Docs Script</p>
                        <p className="text-[10px] text-slate-500 truncate">Researcher brief & hooks</p>
                      </div>
                    </div>
                    {task.scriptDocUrl ? (
                      <a
                        href={task.scriptDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-xs transition-colors"
                      >
                        <span>Open Document</span>
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic text-center py-1">Pending Link</span>
                    )}
                  </div>

                  {/* Word Attachment */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between space-y-2 shadow-xs">
                    <div className="flex items-start gap-2">
                      <FileCode size={16} className="text-sky-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">Word Script (.docx)</p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {task.scriptDocxName ? (task.scriptDocxName.startsWith('data:') ? 'Script-Attachment.docx' : task.scriptDocxName) : 'Offline script draft'}
                        </p>
                      </div>
                    </div>
                    {task.scriptDocxName ? (
                      <button
                        type="button"
                        onClick={() => handleDownloadOrOpenFile(task.scriptDocxName, `${task.title || 'Script'}-Draft.docx`)}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-xs transition-colors cursor-pointer"
                        title="Download or open attached script file"
                      >
                        <Download size={11} />
                        <span>Download .docx</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic text-center py-1">Not Attached</span>
                    )}
                  </div>

                  {/* Raw Footage Folder */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between space-y-2 shadow-xs">
                    <div className="flex items-start gap-2">
                      <Video size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">Raw Footage Drive</p>
                        <p className="text-[10px] text-slate-500 truncate">4K multicam camera files</p>
                      </div>
                    </div>
                    {task.rawFootageUrl ? (
                      <a
                        href={task.rawFootageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold text-xs transition-colors"
                      >
                        <span>Open Footage Drive</span>
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic text-center py-1">Awaiting Shoot</span>
                    )}
                  </div>

                  {/* Audio Track / WAV Files */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between space-y-2 shadow-xs">
                    <div className="flex items-start gap-2">
                      <Music size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">Audio / WAV Track</p>
                        <p className="text-[10px] text-slate-500 truncate">Dedicated 24-bit audio</p>
                      </div>
                    </div>
                    {task.audioFileUrl ? (
                      <a
                        href={task.audioFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 font-semibold text-xs transition-colors"
                      >
                        <span>Open Audio Drive</span>
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic text-center py-1">
                        {task.rawFootageUrl ? 'Embedded in Footage' : 'Awaiting Shoot'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. DELIVERY SUBMISSION SECTION */}
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-2">
                    <Film size={15} className="text-emerald-700" />
                    Editor Deliverables Submission
                  </p>
                  {!canEditTask(task) && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      🔒 Assigned to another Editor (View-Only)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Final Video Drive URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Film size={13} className="text-emerald-600" />
                      1. Final Edited Video Drive URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        disabled={!canEditTask(task)}
                        value={deliv.finalVideoUrl}
                        onChange={(e) => updateDeliverable(task.id, 'finalVideoUrl', e.target.value)}
                        placeholder="https://drive.google.com/file/d/Final-Cut-Master.mov/..."
                        className={`flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                          !canEditTask(task) ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                        }`}
                      />
                      {deliv.finalVideoUrl && (
                        <a
                          href={deliv.finalVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-2 bg-white border border-slate-300 hover:border-emerald-500 text-emerald-700 rounded-lg flex items-center justify-center shadow-xs"
                          title="Open final cut"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">Master ProRes or 4K H.264 render</p>
                  </div>

                  {/* Thumbnail PSD / Asset Link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Image size={13} className="text-emerald-600" />
                      2. Thumbnail PSD / Asset Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        disabled={!canEditTask(task)}
                        value={deliv.thumbnailAssetUrl}
                        onChange={(e) => updateDeliverable(task.id, 'thumbnailAssetUrl', e.target.value)}
                        placeholder="https://drive.google.com/file/d/Thumbnail-v1.psd/..."
                        className={`flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                          !canEditTask(task) ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                        }`}
                      />
                      {deliv.thumbnailAssetUrl && (
                        <a
                          href={deliv.thumbnailAssetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-2 bg-white border border-slate-300 hover:border-emerald-500 text-emerald-700 rounded-lg flex items-center justify-center shadow-xs"
                          title="Open thumbnail file"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">Layered Photoshop PSD or PNG asset link</p>
                  </div>
                </div>
              </div>

              {/* 3. VIDEO EDITING SOP CHECKLIST */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Scissors size={13} className="text-emerald-600" />
                  Video Editing Quality SOP Checklist
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <button
                    type="button"
                    onClick={() => toggleSop(task.id, 'soundDesign')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {sops.soundDesign ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Sound Design: Risers, swooshes & dialogue leveled to -14 LUFS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSop(task.id, 'colorGrade')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {sops.colorGrade ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Color Grade: Normalized skin tones & studio LUT applied</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSop(task.id, 'retentionPacing')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {sops.retentionPacing ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Pacing: First 60 seconds has pattern interrupts every 4-6s</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSop(task.id, 'captions')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {sops.captions ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Captions: High-contrast styled animated on-screen subtitles</span>
                  </button>
                </div>
              </div>

              {/* Bottom Action: Hand off to Thumbnail Designer with Mandatory File Check */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="text-xs">
                  {!deliv.finalVideoUrl?.trim() ? (
                    <span className="text-amber-700 font-medium">
                      ⚠️ Final Edited Video Drive URL is mandatory to complete editing
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold">
                      ✓ Master video link ready for instant handoff
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(() => {
                    const thumbEmpId = task.stages?.thumbnail?.assigneeId;
                    const targetThumbnail =
                      state.employees.find((e) => e.id === thumbEmpId) ||
                      state.employees.find((e) => e.role.toLowerCase() === 'thumbnail') ||
                      state.employees.find((e) => e.role.toLowerCase() === 'strategist');
                    const waUrl = buildWhatsAppClickToChatUrl({
                      employee: targetThumbnail,
                      task,
                      channel: state.channels.find((c) => c.id === task.channelId),
                      phaseName: 'VIDEO EDITING',
                      deliverableLink: deliv.finalVideoUrl,
                      nextRoleName: 'Thumbnail Designer',
                    });
                    return (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                        title="Open WhatsApp chat with Thumbnail Designer"
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
                    disabled={!canEditTask(task) || !deliv.finalVideoUrl?.trim()}
                    onClick={() => handleSubmitFinalCut(task)}
                  >
                    Submit Final Cut & Hand Off
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {editingTasks.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
            No video editing tasks currently in queue.
          </div>
        )}
      </div>
    </div>
  );
}
