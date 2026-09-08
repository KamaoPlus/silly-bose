import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileCode,
  Video,
  Film,
  Image,
  ExternalLink,
  Upload,
  CheckCircle2,
  Clock,
  Send,
  Link2,
  Download,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ChannelTag } from '../ui/Badge';
import { useApp } from '../../context/AppContext';
import { buildWhatsAppDispatchPayload } from '../../utils/whatsapp';

export default function TaskHandoffModal({ isOpen, onClose, task }) {
  const { state, actions, currentUser } = useApp();

  const [scriptDocUrl, setScriptDocUrl] = useState('');
  const [scriptDocxName, setScriptDocxName] = useState('');
  const [rawFootageUrl, setRawFootageUrl] = useState('');
  const [finalVideoUrl, setFinalVideoUrl] = useState('');
  const [thumbnailAssetUrl, setThumbnailAssetUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (task) {
      setScriptDocUrl(task.scriptDocUrl || '');
      setScriptDocxName(task.scriptDocxName || '');
      setRawFootageUrl(task.rawFootageUrl || '');
      setFinalVideoUrl(task.finalVideoUrl || '');
      setThumbnailAssetUrl(task.thumbnailAssetUrl || '');
      setIsSaved(false);
    }
  }, [task]);

  if (!task) return null;

  const channel = state.channels.find((c) => c.id === task.channelId);
  const userRole = currentUser?.role?.toLowerCase() || 'admin';
  const isAdmin = userRole === 'admin';

  // Permission checks per field
  const canEditResearch = isAdmin || userRole === 'researcher' || userRole === 'strategist';
  const canEditProduction = isAdmin || userRole === 'production' || userRole === 'anchor';
  const canEditEditor = isAdmin || userRole === 'editor';
  const canEditThumbnail = isAdmin || userRole === 'thumbnail' || userRole === 'editor';

  // Calculate completed count
  const completedCount = [
    Boolean(scriptDocUrl),
    Boolean(scriptDocxName),
    Boolean(rawFootageUrl),
    Boolean(finalVideoUrl),
    Boolean(thumbnailAssetUrl),
  ].filter(Boolean).length;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScriptDocxName(file.name);
    }
  };

  const handleSave = (notifyNextRole = false) => {
    const handoffData = {
      scriptDocUrl,
      scriptDocxName,
      rawFootageUrl,
      finalVideoUrl,
      thumbnailAssetUrl,
    };

    let notificationMeta = null;

    if (notifyNextRole) {
      // Determine recipient based on sequential pipeline flow:
      // researcher -> anchor/production -> editor -> thumbnail -> strategist
      let targetEmployee = null;
      let targetStage = 'PRODUCTION';

      if (userRole === 'researcher' || (!task.rawFootageUrl && rawFootageUrl)) {
        const prodEmpId = task.stages?.production?.assigneeId;
        targetEmployee = state.employees.find((e) => e.id === prodEmpId) || state.employees.find((e) => e.role.toLowerCase() === 'production');
        targetStage = 'PRODUCTION / SHOOT';
      } else if (userRole === 'production' || (!task.finalVideoUrl && finalVideoUrl && !thumbnailAssetUrl)) {
        const editEmpId = task.stages?.editor?.assigneeId;
        targetEmployee = state.employees.find((e) => e.id === editEmpId) || state.employees.find((e) => e.role.toLowerCase() === 'editor');
        targetStage = 'VIDEO EDITING';
      } else if (userRole === 'editor' || (!task.thumbnailAssetUrl && thumbnailAssetUrl)) {
        const thumbEmpId = task.stages?.thumbnail?.assigneeId;
        targetEmployee = state.employees.find((e) => e.id === thumbEmpId) || state.employees.find((e) => e.role.toLowerCase() === 'thumbnail');
        targetStage = 'THUMBNAIL DESIGN';
      } else if (userRole === 'thumbnail') {
        const stratEmpId = task.stages?.strategist?.assigneeId;
        targetEmployee = state.employees.find((e) => e.id === stratEmpId) || state.employees.find((e) => e.role.toLowerCase() === 'strategist');
        targetStage = 'UPLOAD & PUBLISH';
      } else {
        targetEmployee = state.employees.find((e) => e.active);
      }

      if (targetEmployee) {
        notificationMeta = buildWhatsAppDispatchPayload({
          task: { ...task, ...handoffData },
          channel,
          employee: targetEmployee,
          stageName: targetStage,
          triggerType: 'instant_handoff',
        });
      }
    }

    actions.updateTaskHandoff(task.id, handoffData, notificationMeta);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asset & Script Handoff Pipeline"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="font-bold text-slate-800">{completedCount} of 5</span> assets delivered
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave(false)}
            >
              {isSaved ? 'Saved!' : 'Save Draft'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              onClick={() => handleSave(true)}
            >
              Save & Dispatch Next 9 AM WhatsApp
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Task Summary Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ChannelTag channel={channel} size="xs" />
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={11} /> Target: <strong className="text-slate-700">{task.targetDate}</strong>
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{task.title}</h3>
          </div>

          {/* Progress bar */}
          <div className="w-full sm:w-44 space-y-1.5 flex-shrink-0">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-500">Pipeline Handoff</span>
              <span className="text-emerald-700">{Math.round((completedCount / 5) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${(completedCount / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Section 1: Research Handoff */}
        <div className="border border-sky-100 bg-sky-50/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <div>
                <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                  Researcher Deliverables
                </h4>
                <p className="text-[11px] text-sky-700">Google Docs script draft + downloadable Word document</p>
              </div>
            </div>
            {scriptDocUrl && scriptDocxName && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                <CheckCircle2 size={12} /> Delivered
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* a) Google Docs Script URL */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <FileText size={13} className="text-sky-600" /> Google Docs Script URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={scriptDocUrl}
                  disabled={!canEditResearch}
                  onChange={(e) => setScriptDocUrl(e.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                  className={`flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none ${
                    !canEditResearch ? 'bg-slate-100 text-slate-500' : ''
                  }`}
                />
                {scriptDocUrl && (
                  <a
                    href={scriptDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-2 bg-white border border-slate-300 hover:border-sky-500 text-sky-600 rounded-lg flex items-center justify-center transition-colors shadow-xs"
                    title="Open Google Doc in new tab"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* b) Word File Script Attachment (.docx) */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <FileCode size={13} className="text-sky-600" /> Word File Script Attachment (.docx)
              </label>
              <div className="flex items-center gap-2">
                {scriptDocxName ? (
                  <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-white border border-sky-300 rounded-lg text-xs">
                    <span className="font-semibold text-slate-800 truncate">{scriptDocxName}</span>
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        type="button"
                        onClick={() => alert(`Downloading Word Script file: ${scriptDocxName}`)}
                        className="text-sky-600 hover:text-sky-800 p-1 rounded hover:bg-sky-50"
                        title="Download Word doc"
                      >
                        <Download size={13} />
                      </button>
                      {canEditResearch && (
                        <button
                          type="button"
                          onClick={() => setScriptDocxName('')}
                          className="text-slate-400 hover:text-red-600 text-xs px-1"
                          title="Remove attachment"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:border-sky-500 hover:text-sky-600 transition-colors ${canEditResearch ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                    <Upload size={14} />
                    <span>Upload Word Script (.docx)</span>
                    <input
                      type="file"
                      accept=".docx,.doc,.txt"
                      disabled={!canEditResearch}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Production / Cameraman Handoff */}
        <div className="border border-amber-100 bg-amber-50/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Production / Cameraman Deliverables
                </h4>
                <p className="text-[11px] text-amber-700">High-res raw A-roll footage, multicam cards, & separate WAV audio</p>
              </div>
            </div>
            {rawFootageUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                <CheckCircle2 size={12} /> Delivered
              </span>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Video size={13} className="text-amber-600" /> Raw Footage & Audio Drive Folder URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={rawFootageUrl}
                disabled={!canEditProduction}
                onChange={(e) => setRawFootageUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/raw-footage-wf-..."
                className={`flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                  !canEditProduction ? 'bg-slate-100 text-slate-500' : ''
                }`}
              />
              {rawFootageUrl && (
                <a
                  href={rawFootageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-2 bg-white border border-slate-300 hover:border-amber-500 text-amber-600 rounded-lg flex items-center justify-center transition-colors shadow-xs"
                  title="Open Raw Footage Drive"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Video Editor Deliverables */}
        <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <div>
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  Editor Deliverables
                </h4>
                <p className="text-[11px] text-emerald-700">Master 4K video render file + layered Photoshop thumbnail asset</p>
              </div>
            </div>
            {finalVideoUrl && thumbnailAssetUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                <CheckCircle2 size={12} /> Delivered
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* c) Final Video Drive URL */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Film size={13} className="text-emerald-600" /> Final Edited Video Drive URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={finalVideoUrl}
                  disabled={!canEditEditor}
                  onChange={(e) => setFinalVideoUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/Final-Cut-Master.mov/..."
                  className={`flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                    !canEditEditor ? 'bg-slate-100 text-slate-500' : ''
                  }`}
                />
                {finalVideoUrl && (
                  <a
                    href={finalVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-2 bg-white border border-slate-300 hover:border-emerald-500 text-emerald-600 rounded-lg flex items-center justify-center transition-colors shadow-xs"
                    title="Open Final Video"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* d) Thumbnail PSD / Asset Link */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Image size={13} className="text-emerald-600" /> Thumbnail PSD / Asset Link
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={thumbnailAssetUrl}
                  disabled={!canEditThumbnail}
                  onChange={(e) => setThumbnailAssetUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/Thumbnail-v1.psd/..."
                  className={`flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                    !canEditThumbnail ? 'bg-slate-100 text-slate-500' : ''
                  }`}
                />
                {thumbnailAssetUrl && (
                  <a
                    href={thumbnailAssetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-2 bg-white border border-slate-300 hover:border-emerald-500 text-emerald-600 rounded-lg flex items-center justify-center transition-colors shadow-xs"
                    title="Open Thumbnail PSD Link"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
          <Sparkles size={15} className="text-indigo-600 flex-shrink-0" />
          <span>
            Saving triggers a high-priority 9:00 AM WhatsApp reminder payload to the downstream team member with the asset links attached.
          </span>
        </div>
      </div>
    </Modal>
  );
}
