import React, { useState } from 'react';
import {
  Video,
  FileText,
  FileCode,
  ExternalLink,
  Download,
  CheckCircle2,
  Clock,
  Send,
  Camera,
  Mic,
  Music,
  Save,
  Sliders,
  CheckSquare,
  Square,
  Sparkles,
  Calendar,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChannelTag } from '../ui/Badge';
import Button from '../ui/Button';
import { buildWhatsAppDispatchPayload, buildWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import { handleDownloadOrOpenFile } from '../../utils/fileHelpers';

export default function ProductionWorkspace() {
  const { state, actions, currentUser } = useApp();

  // Local state for raw footage URL inputs, audio URL inputs, and SOP checklists per task
  const [footageInputs, setFootageInputs] = useState({});
  const [audioInputs, setAudioInputs] = useState({});
  const [sopChecklists, setSopChecklists] = useState({});

  const userRole = (currentUser?.role || '').toLowerCase();
  const isManager = currentUser?.role === 'super admin' || userRole.includes('admin') || userRole.includes('strat');
  const currentUserId = currentUser?.id;

  // Filter tasks in production / shoot stage or scheduled shoots
  // Managers see all shoot tasks; Production/Camera/Anchor crew ONLY see tasks assigned to them
  const shootTasks = (state.tasks || []).filter((t) => {
    if (!t) return false;
    if (isManager) {
      return (
        t.stages?.production?.status === 'In Progress' ||
        t.stages?.production?.status === 'Pending' ||
        t.stages?.anchor?.status === 'In Progress' ||
        t.stages?.production?.status === 'Completed' ||
        Boolean(t.rawFootageUrl)
      );
    }
    return (
      t.stages?.production?.assigneeId === currentUserId ||
      t.stages?.anchor?.assigneeId === currentUserId ||
      t.assignedLead === currentUserId
    );
  });

  // Sort by targetDate ascending
  shootTasks.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));

  const canEditTask = (task) => {
    if (isManager) return true;
    return (
      task?.stages?.production?.assigneeId === currentUserId ||
      task?.stages?.anchor?.assigneeId === currentUserId ||
      task?.assignedLead === currentUserId
    );
  };

  const getFootageUrl = (task) => {
    return footageInputs[task.id] !== undefined ? footageInputs[task.id] : task.rawFootageUrl || '';
  };

  const getAudioUrl = (task) => {
    return audioInputs[task.id] !== undefined ? audioInputs[task.id] : task.audioFileUrl || '';
  };

  const handleSaveLinks = async (task) => {
    const rawFootageUrl = getFootageUrl(task).trim();
    const audioFileUrl = getAudioUrl(task).trim();
    await actions.updateTaskHandoff(task.id, { rawFootageUrl, audioFileUrl });
    alert('✅ Footage & Audio links synced to Supabase database!');
  };

  const getChecklist = (task) => {
    return sopChecklists[task.id] || {
      lighting: true,
      camera4k: true,
      micBattery: true,
      backupCard: false,
    };
  };

  const toggleChecklist = (taskId, itemKey) => {
    setSopChecklists((prev) => {
      const current = prev[taskId] || { lighting: true, camera4k: true, micBattery: true, backupCard: false };
      return {
        ...prev,
        [taskId]: {
          ...current,
          [itemKey]: !current[itemKey],
        },
      };
    });
  };

  const handleCompleteShootAndHandoff = (task) => {
    const rawFootageUrl = getFootageUrl(task).trim();
    const audioFileUrl = getAudioUrl(task).trim();
    if (!rawFootageUrl) return;

    const channel = state.channels.find((c) => c.id === task.channelId);

    // Determine Editor recipient
    const editorAssigneeId = task.stages?.editor?.assigneeId;
    const targetEditor = state.employees.find((e) => e.id === editorAssigneeId) ||
                         state.employees.find((e) => e.role.toLowerCase() === 'editor');

    const handoffData = { rawFootageUrl, audioFileUrl };

    const notificationMeta = buildWhatsAppDispatchPayload({
      task: { ...task, ...handoffData },
      channel,
      employee: targetEditor,
      stageName: 'VIDEO EDITING',
      triggerType: 'instant_handoff',
      completedBy: 'Production & Cameraman',
      deliverableLink: rawFootageUrl,
    });

    // Save handoff
    actions.updateTaskHandoff(task.id, handoffData, notificationMeta);

    // Update stages
    actions.updateStage(task.id, 'production', {
      assigneeId: task.stages?.production?.assigneeId || currentUser?.id,
      status: 'Completed',
    });
    actions.updateStage(task.id, 'anchor', {
      assigneeId: task.stages?.anchor?.assigneeId,
      status: 'Completed',
    });

    if (task.stages?.editor?.status === 'Pending') {
      actions.updateStage(task.id, 'editor', {
        assigneeId: task.stages?.editor?.assigneeId,
        status: 'In Progress',
      });
    }

    alert(`🎬 Shoot marked completed! ⚡ Instant WhatsApp alert triggered to Editor (${targetEditor?.name || 'Video Editor'}).`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
              Production Studio
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Shoots & Footage Handoff
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Access teleprompter scripts, manage studio shoots, and upload raw media folders.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Upcoming Shoots</p>
            <p className="text-base font-extrabold text-slate-900">{shootTasks.length}</p>
          </div>
          <div className="w-px h-7 bg-slate-200" />
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Audio Standard</p>
            <p className="text-base font-extrabold text-amber-600">-12 dB Peak</p>
          </div>
        </div>
      </div>

      {/* Shoots Timetable List */}
      <div className="space-y-4">
        {shootTasks.map((task) => {
          const channel = state.channels.find((c) => c.id === task.channelId);
          const currentFootage = getFootageUrl(task);
          const currentAudio = getAudioUrl(task);
          const editable = canEditTask(task);
          const checklist = getChecklist(task);
          const isShootComplete = task.stages?.production?.status === 'Completed';
          const anchorEmployee = state.employees.find((e) => e.id === task.stages?.anchor?.assigneeId);

          return (
            <div
              key={task.id}
              className={`bg-white border rounded-2xl shadow-card p-5 space-y-5 transition-all ${
                isShootComplete ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              {/* Header: Date Timetable Badge, Channel, Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <Calendar size={13} />
                    <span>Shoot Date: {task.targetDate}</span>
                  </div>
                  <ChannelTag channel={channel} size="xs" />
                </div>

                <div className="flex items-center gap-2">
                  {!editable && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      🔒 Assigned to another Crew Member (View-Only)
                    </span>
                  )}
                  {anchorEmployee && (
                    <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                      🎙️ Anchor: <strong>{anchorEmployee.name}</strong>
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      isShootComplete
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {isShootComplete ? 'Shoot Completed' : 'Shoot Scheduled / In Studio'}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                {task.notes && (
                  <p className="text-xs text-slate-500 mt-1">
                    🎯 <strong>Studio Notes:</strong> {task.notes}
                  </p>
                )}
              </div>

              {/* Script Access Section: Directly View & Download Researcher Deliverables */}
              <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-sky-950 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText size={14} className="text-sky-700" />
                  Finalized Script Access (Prepared by Researcher)
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {task.scriptDocUrl ? (
                    <a
                      href={task.scriptDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-sky-300 text-sky-800 hover:text-sky-950 hover:border-sky-500 font-semibold text-xs shadow-xs transition-colors"
                    >
                      <FileText size={14} className="text-sky-600" />
                      <span>Open Google Docs Teleprompter Script</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic bg-white/70 px-3 py-1.5 rounded-lg border border-slate-200">
                      No Google Doc link submitted yet
                    </span>
                  )}

                  {task.scriptDocxName ? (
                    <button
                      type="button"
                      onClick={() => handleDownloadOrOpenFile(task.scriptDocxName, `${task.title || 'Script'}-Draft.docx`)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-sky-300 text-sky-800 hover:text-sky-950 hover:border-sky-500 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                      title="Download or open script attachment"
                    >
                      <FileCode size={14} className="text-sky-600" />
                      <span>Download {task.scriptDocxName.startsWith('data:') ? 'Script-Attachment.docx' : task.scriptDocxName} (.docx)</span>
                      <Download size={12} />
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic bg-white/70 px-3 py-1.5 rounded-lg border border-slate-200">
                      No .docx attachment submitted
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Handoff: Raw Footage & Audio Drive Folder URLs */}
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Video size={15} className="text-amber-700" />
                    Raw Footage & Audio Files Submission
                  </label>
                  <button
                    type="button"
                    disabled={!editable || (!currentFootage?.trim() && !currentAudio?.trim())}
                    onClick={() => handleSaveLinks(task)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors shadow-xs"
                    title="Persist footage & audio links to Supabase immediately"
                  >
                    <Save size={12} />
                    <span>Sync Links to Cloud</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 1. Raw Footage Drive URL */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Camera size={12} className="text-amber-600" />
                      1. Raw Footage Drive Folder URL *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        disabled={!editable}
                        value={currentFootage}
                        onChange={(e) =>
                          setFootageInputs({ ...footageInputs, [task.id]: e.target.value })
                        }
                        placeholder="https://drive.google.com/drive/folders/raw-footage-4k..."
                        className={`flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs ${
                          !editable ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                        }`}
                      />
                      {currentFootage && (
                        <a
                          href={currentFootage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-2 bg-white border border-slate-300 hover:border-amber-500 text-amber-700 rounded-lg flex items-center justify-center transition-colors shadow-xs"
                          title="Open footage drive in new tab"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 2. Audio Drive URL */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Music size={12} className="text-purple-600" />
                      2. Dedicated Audio / Multi-Mic WAV Folder URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        disabled={!editable}
                        value={currentAudio}
                        onChange={(e) =>
                          setAudioInputs({ ...audioInputs, [task.id]: e.target.value })
                        }
                        placeholder="https://drive.google.com/drive/folders/24bit-wav-audio..."
                        className={`flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-xs ${
                          !editable ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                        }`}
                      />
                      {currentAudio && (
                        <a
                          href={currentAudio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-2 bg-white border border-slate-300 hover:border-purple-500 text-purple-700 rounded-lg flex items-center justify-center transition-colors shadow-xs"
                          title="Open audio drive in new tab"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500">
                  Provide links to 4K camera files (A-roll + B-roll) and high-fidelity 24-bit 48kHz WAV audio files.
                </p>
              </div>

              {/* Production SOP Checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Sliders size={13} className="text-amber-600" />
                  Studio Pre-Flight & Recording SOP Checklist
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <button
                    type="button"
                    onClick={() => toggleChecklist(task.id, 'lighting')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {checklist.lighting ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Lighting: 3-point key/fill balance & eye reflection check</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChecklist(task.id, 'camera4k')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {checklist.camera4k ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Camera: 4K 24fps (Dialogue) / 60fps (B-roll slowmo) format</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChecklist(task.id, 'micBattery')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {checklist.micBattery ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Audio: Wireless lavalier charged & gain peaked at -6dB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChecklist(task.id, 'backupCard')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {checklist.backupCard ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Backup: Dual V90 SD cards verified and formatted</span>
                  </button>
                </div>
              </div>

              {/* Bottom Action: Hand off to Editor with Mandatory File Check */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="text-xs">
                  {!currentFootage?.trim() ? (
                    <span className="text-amber-700 font-medium">
                      ⚠️ Raw Footage & Audio Drive Folder URL is mandatory to complete shoot
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold">
                      ✓ Raw footage drive URL ready for instant handoff
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(() => {
                    const editEmpId = task.stages?.editor?.assigneeId;
                    const targetEditor =
                      state.employees.find((e) => e.id === editEmpId) ||
                      state.employees.find((e) => e.role.toLowerCase() === 'editor');
                    const waUrl = buildWhatsAppClickToChatUrl({
                      employee: targetEditor,
                      task,
                      channel: state.channels.find((c) => c.id === task.channelId),
                      phaseName: 'PRODUCTION & SHOOT',
                      deliverableLink: currentFootage,
                      nextRoleName: 'Editor',
                    });
                    return (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                        title="Open WhatsApp chat with Video Editor"
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
                    disabled={!editable || !currentFootage?.trim()}
                    onClick={() => handleCompleteShootAndHandoff(task)}
                  >
                    Mark Shoot Complete & Hand Off
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {shootTasks.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
            No shoots currently scheduled.
          </div>
        )}
      </div>
    </div>
  );
}
