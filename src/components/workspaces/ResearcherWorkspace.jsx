import React, { useState } from 'react';
import {
  FileText,
  FileCode,
  Upload,
  ExternalLink,
  CheckCircle2,
  Clock,
  Send,
  Download,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  CheckSquare,
  Square
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChannelTag } from '../ui/Badge';
import Button from '../ui/Button';
import { buildWhatsAppDispatchPayload } from '../../utils/whatsapp';

export default function ResearcherWorkspace() {
  const { state, actions, currentUser } = useApp();

  // Local draft states per task: { [taskId]: { docUrl, docxName, checklist: { c1, c2, c3, c4 } } }
  const [taskDrafts, setTaskDrafts] = useState({});

  // Filter tasks that need research or are assigned to current user
  const currentUserId = currentUser?.id;
  const researchTasks = state.tasks.filter((t) => {
    const isAssigned = t.stages?.researcher?.assigneeId === currentUserId;
    const isResearchStage = t.stages?.researcher?.status !== 'Completed';
    // If logged in as generic researcher, show all research tasks or assigned
    return isAssigned || isResearchStage || t.stages?.researcher?.assigneeId;
  });

  const getDraft = (task) => {
    return taskDrafts[task.id] || {
      docUrl: task.scriptDocUrl || '',
      docxName: task.scriptDocxName || '',
      checklist: {
        factCheck: true,
        sources: Boolean(task.scriptDocUrl),
        hookBeats: true,
        visualCues: false,
      },
    };
  };

  const updateDraftField = (taskId, field, value) => {
    setTaskDrafts((prev) => {
      const current = prev[taskId] || {
        docUrl: state.tasks.find((t) => t.id === taskId)?.scriptDocUrl || '',
        docxName: state.tasks.find((t) => t.id === taskId)?.scriptDocxName || '',
        checklist: { factCheck: true, sources: true, hookBeats: true, visualCues: false },
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

  const toggleChecklist = (taskId, itemKey) => {
    setTaskDrafts((prev) => {
      const current = prev[taskId] || {
        docUrl: state.tasks.find((t) => t.id === taskId)?.scriptDocUrl || '',
        docxName: state.tasks.find((t) => t.id === taskId)?.scriptDocxName || '',
        checklist: { factCheck: true, sources: true, hookBeats: true, visualCues: false },
      };
      return {
        ...prev,
        [taskId]: {
          ...current,
          checklist: {
            ...current.checklist,
            [itemKey]: !current.checklist[itemKey],
          },
        },
      };
    });
  };

  const handleFileUpload = (taskId, e) => {
    const file = e.target.files?.[0];
    if (file) {
      updateDraftField(taskId, 'docxName', file.name);
    }
  };

  // Submit script and hand off to Production / Anchor
  const handleSubmitAndHandoff = (task) => {
    const draft = getDraft(task);
    if (!draft.docUrl?.trim() && !draft.docxName?.trim()) return;

    const channel = state.channels.find((c) => c.id === task.channelId);

    // Save handoff fields
    const handoffData = {
      scriptDocUrl: draft.docUrl.trim(),
      scriptDocxName: draft.docxName.trim(),
    };

    // Find next assignee (Anchor / Production)
    const anchorAssigneeId = task.stages?.anchor?.assigneeId;
    const prodAssigneeId = task.stages?.production?.assigneeId;
    const targetProd =
      state.employees.find((e) => e.id === anchorAssigneeId) ||
      state.employees.find((e) => e.id === prodAssigneeId) ||
      state.employees.find((e) => e.role.toLowerCase() === 'production') ||
      state.employees.find((e) => e.role.toLowerCase() === 'anchor');

    const notificationMeta = buildWhatsAppDispatchPayload({
      task: { ...task, ...handoffData },
      channel,
      employee: targetProd,
      stageName: 'ANCHOR & SHOOT',
      triggerType: 'instant_handoff',
      completedBy: 'Researcher',
      deliverableLink: draft.docUrl || draft.docxName,
    });

    // Update handoff
    actions.updateTaskHandoff(task.id, handoffData, notificationMeta);

    // Mark researcher stage as Completed and anchor/production as In Progress
    actions.updateStage(task.id, 'researcher', {
      assigneeId: task.stages?.researcher?.assigneeId || currentUser?.id,
      status: 'Completed',
    });

    if (task.stages?.anchor?.status === 'Pending') {
      actions.updateStage(task.id, 'anchor', {
        assigneeId: task.stages?.anchor?.assigneeId,
        status: 'In Progress',
      });
    }
    if (task.stages?.production?.status === 'Pending') {
      actions.updateStage(task.id, 'production', {
        assigneeId: task.stages?.production?.assigneeId,
        status: 'In Progress',
      });
    }

    alert(`✅ Script handed off successfully! ⚡ Instant WhatsApp alert triggered to ${targetProd?.name || 'Production / Anchor'}.`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wide">
              Script & Research
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Script Outlines & Fact-Checking
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliver verified scripts with Google Docs links and offline .docx attachments.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Assigned</p>
            <p className="text-base font-extrabold text-slate-900">{researchTasks.length}</p>
          </div>
          <div className="w-px h-7 bg-slate-200" />
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Verification</p>
            <p className="text-base font-extrabold text-emerald-600">100%</p>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {researchTasks.map((task) => {
          const channel = state.channels.find((c) => c.id === task.channelId);
          const draft = getDraft(task);
          const isCompleted = task.stages?.researcher?.status === 'Completed';

          return (
            <div
              key={task.id}
              className={`bg-white border rounded-2xl shadow-card p-5 space-y-5 transition-all ${
                isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              {/* Top Row: Channel, Date, Topic */}
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
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-sky-50 text-sky-700 border-sky-300'
                    }`}
                  >
                    {isCompleted ? 'Research Completed' : 'Research In Progress'}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                {task.notes && (
                  <p className="text-xs text-slate-500 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    💡 <strong>Editorial Directive:</strong> {task.notes}
                  </p>
                )}
              </div>

              {/* Two Required Handoff Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-sky-50/50 border border-sky-100 rounded-xl p-4">
                {/* 1) Google Docs Script URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText size={14} className="text-sky-600" />
                    1. Google Docs Script URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={draft.docUrl}
                      onChange={(e) => updateDraftField(task.id, 'docUrl', e.target.value)}
                      placeholder="https://docs.google.com/document/d/..."
                      className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    {draft.docUrl && (
                      <a
                        href={draft.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-2 bg-white border border-slate-300 hover:border-sky-500 text-sky-600 rounded-lg flex items-center justify-center transition-colors shadow-xs"
                        title="Open Doc in new tab"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">Paste editable link for host and director review</p>
                </div>

                {/* 2) Word File Script Attachment (.docx) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCode size={14} className="text-sky-600" />
                    2. Word File Script Attachment (.docx)
                  </label>
                  {draft.docxName ? (
                    <div className="flex items-center justify-between px-3 py-2 bg-white border border-sky-300 rounded-lg text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileCode size={15} className="text-sky-600 flex-shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{draft.docxName}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          type="button"
                          onClick={() => alert(`Simulating download for: ${draft.docxName}`)}
                          className="text-sky-600 hover:text-sky-800 p-1 rounded hover:bg-sky-50"
                          title="Download file"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDraftField(task.id, 'docxName', '')}
                          className="text-slate-400 hover:text-red-600 text-xs px-1"
                          title="Remove attachment"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:border-sky-500 hover:text-sky-600 cursor-pointer transition-colors">
                      <Upload size={14} />
                      <span>Upload Word Script (.docx)</span>
                      <input
                        type="file"
                        accept=".docx,.doc,.txt"
                        onChange={(e) => handleFileUpload(task.id, e)}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-[10px] text-slate-400">Offline teleprompter and anchor backup copy</p>
                </div>
              </div>

              {/* SOP Checklist for Research Quality */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Research SOP & Fact-Checking Standards
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <button
                    type="button"
                    onClick={() => toggleChecklist(task.id, 'factCheck')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {draft.checklist.factCheck ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Primary statistics verified with official reports</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChecklist(task.id, 'sources')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {draft.checklist.sources ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>Direct source links inserted into footnotes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChecklist(task.id, 'hookBeats')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {draft.checklist.hookBeats ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>30-second retention hook & pattern interrupt outlined</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChecklist(task.id, 'visualCues')}
                    className="flex items-center gap-2 text-left hover:text-slate-900"
                  >
                    {draft.checklist.visualCues ? (
                      <CheckSquare size={15} className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span>B-roll visual suggestions noted in brackets [B-ROLL]</span>
                  </button>
                </div>
              </div>

              {/* Bottom Action: Hand off with Mandatory File Check */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="text-xs">
                  {!draft.docUrl?.trim() && !draft.docxName?.trim() ? (
                    <span className="text-amber-700 font-medium">
                      ⚠️ Google Doc URL or Word .docx file is mandatory to complete research
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold">
                      ✓ Script deliverable attached & ready for handoff
                    </span>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon={Send}
                  disabled={!draft.docUrl?.trim() && !draft.docxName?.trim()}
                  onClick={() => handleSubmitAndHandoff(task)}
                >
                  Submit Script & Hand Off to Production / Anchor
                </Button>
              </div>
            </div>
          );
        })}

        {researchTasks.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
            No research tasks currently assigned.
          </div>
        )}
      </div>
    </div>
  );
}
