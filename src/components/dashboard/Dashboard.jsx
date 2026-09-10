import React, { useState } from 'react';
import {
  Plus,
  PlaySquare,
  Clock,
  CheckCircle2,
  Users,
  MessageSquare,
  Calendar,
  ArrowRight,
  TrendingUp,
  Layers,
  FileText,
  FileCode,
  Video,
  Film,
  Image,
  ExternalLink,
  Music,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import { ChannelTag, StatusBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import AddTaskModal from './AddTaskModal';
import TaskHandoffModal from '../workflow/TaskHandoffModal';

export const getActivePipelineStatus = (task) => {
  const explicitStatus = task.status;
  const explicitStage = task.stage;

  if (explicitStatus === 'Done' || explicitStatus === 'Completed' || task.stages?.strategist?.status === 'Completed') {
    return { stage: 'Published', status: 'Done', color: 'emerald' };
  }
  if (task.finalVideoUrl || task.edited_video_url || task.stages?.editor?.status === 'Completed') {
    if (task.thumbnailAssetUrl || task.thumbnail_url || task.stages?.thumbnail?.status === 'Completed') {
      return { stage: 'Strategist', status: 'Ready to Publish', color: 'indigo' };
    }
    return { stage: 'Thumbnail', status: 'Designing Thumb', color: 'purple' };
  }
  if (task.stages?.editor?.status === 'In Progress' || explicitStage?.toLowerCase().includes('edit') || explicitStatus === 'Editing') {
    return { stage: 'Editing', status: 'Editing', color: 'blue' };
  }
  if (task.stages?.production?.status === 'Completed' || explicitStatus === 'Shot' || task.rawFootageUrl || task.raw_footage_url) {
    return { stage: 'Production', status: 'Shot', color: 'amber' };
  }
  if (task.stages?.production?.status === 'In Progress' || explicitStatus === 'In Production' || explicitStatus === 'Shooting') {
    return { stage: 'Production', status: explicitStatus || 'In Production', color: 'amber' };
  }
  if (task.scriptDocUrl || task.script_doc_link || task.stages?.researcher?.status === 'Completed') {
    return { stage: 'Production', status: 'Ready to Shoot', color: 'sky' };
  }
  if (task.stages?.researcher?.status === 'In Progress' || explicitStatus === 'Researching') {
    return { stage: 'Research', status: 'Researching', color: 'slate' };
  }
  return { stage: explicitStage || 'Production', status: explicitStatus || 'In Production', color: 'amber' };
};

export default function Dashboard({ onNavigateView }) {
  const { state, currentUser } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHandoffTask, setSelectedHandoffTask] = useState(null);

  const userRole = currentUser?.role?.toLowerCase() || 'admin';
  const canAddTask = userRole === 'admin' || userRole === 'strategist';

  // Statistics calculation
  const totalTasks = state.tasks.length;
  const activeChannels = state.channels.length;
  const activeTeamMembers = state.employees.filter((e) => e.active).length;

  const completedCount = state.tasks.filter((t) =>
    Object.values(t.stages || {}).every((s) => s.status === 'Completed')
  ).length;

  const inProgressCount = totalTasks - completedCount;

  // Recent 5 tasks
  const recentTasks = [...state.tasks].slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Clean Top Banner with High-Contrast Action Button */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            YouTube Production OS
          </h1>
        </div>

        {/* Primary Action Button restricted to Admin & Strategist */}
        {canAddTask && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{ backgroundColor: 'var(--primary-color)' }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex-shrink-0 cursor-pointer"
          >
            <Plus size={18} className="text-white" strokeWidth={2.5} />
            <span>+ Add Task</span>
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Active Productions</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <PlaySquare size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{inProgressCount}</span>
            <span className="text-xs text-slate-500">of {totalTasks} videos</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Clock size={12} className="text-amber-500" /> Tasks currently in pipeline
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Completed Videos</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{completedCount}</span>
            <span className="text-xs text-emerald-600 font-semibold">
              {totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}% rate
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-500" /> Fully finalized & uploaded
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Active Channels</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Calendar size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{activeChannels}</span>
            <span className="text-xs text-slate-500">managed</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Calendar view available per channel
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Team Members</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{activeTeamMembers}</span>
            <span className="text-xs text-slate-500">active employees</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Mapped across 6 pipeline roles
          </p>
        </div>
      </div>

      {/* Global Asset & Script Handoff Pipeline Status */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              Global Asset & Script Handoff Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              End-to-end transparent visibility of all 5 deliverables across all active channel workflows
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span>5 Core Deliverables Monitored</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Channel & Video</th>
                <th className="px-3 py-3 text-center">Stage & Status</th>
                <th className="px-3 py-3 text-center">1. Docs Script</th>
                <th className="px-3 py-3 text-center">2. Word .docx</th>
                <th className="px-3 py-3 text-center">3. Footage & Audio</th>
                <th className="px-3 py-3 text-center">4. Final Cut</th>
                <th className="px-3 py-3 text-center">5. Thumbnail PSD</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.tasks.map((task) => {
                const channel = state.channels.find((c) => c.id === task.channelId);
                const stageInfo = getActivePipelineStatus(task);
                const docUrl = task.script_doc_link || task.scriptDocUrl;
                const docxName = task.script_file_url || task.scriptDocxName;
                const footageUrl = task.raw_footage_url || task.rawFootageUrl;
                const audioUrl = task.audio_file_url || task.audioFileUrl;
                const videoUrl = task.edited_video_url || task.finalVideoUrl;
                const thumbUrl = task.thumbnail_url || task.thumbnailAssetUrl;

                const hasDoc = Boolean(docUrl);
                const hasDocx = Boolean(docxName);
                const hasFootage = Boolean(footageUrl);
                const hasAudio = Boolean(audioUrl);
                const hasVideo = Boolean(videoUrl);
                const hasThumb = Boolean(thumbUrl);
                const totalReady = [hasDoc, hasDocx, hasFootage || hasAudio, hasVideo, hasThumb].filter(Boolean).length;

                return (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ChannelTag channel={channel} size="xs" />
                        <span className="text-[10px] text-slate-400 font-medium">• {task.targetDate}</span>
                      </div>
                      <p className="font-bold text-slate-900 truncate">{task.title}</p>
                    </td>

                    {/* Dynamic Pipeline Stage & Status Badge */}
                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase border shadow-2xs ${
                            stageInfo.color === 'emerald'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : stageInfo.color === 'amber'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : stageInfo.color === 'blue'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : stageInfo.color === 'purple'
                              ? 'bg-purple-50 text-purple-700 border-purple-300'
                              : stageInfo.color === 'indigo'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                              : stageInfo.color === 'sky'
                              ? 'bg-sky-50 text-sky-700 border-sky-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {stageInfo.status}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold">{stageInfo.stage}</span>
                      </div>
                    </td>

                    {/* 1. Google Docs */}
                    <td className="px-3 py-3.5 text-center">
                      {hasDoc ? (
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
                          title="Open Google Doc"
                        >
                          <FileText size={10} /> Done
                        </a>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">Waiting</span>
                      )}
                    </td>

                    {/* 2. Word docx */}
                    <td className="px-3 py-3.5 text-center">
                      {hasDocx ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200"
                          title={docxName}
                        >
                          <FileCode size={10} /> .docx
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">Waiting</span>
                      )}
                    </td>

                    {/* 3. Raw Footage & Audio Drive */}
                    <td className="px-3 py-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {hasFootage ? (
                          <a
                            href={footageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                            title="Open Raw Footage Drive"
                          >
                            <Video size={10} /> 4K Ready
                          </a>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Waiting</span>
                        )}
                        {hasAudio && (
                          <a
                            href={audioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors"
                            title="Listen Audio / Open Drive"
                          >
                            <Music size={10} /> Audio
                          </a>
                        )}
                      </div>
                    </td>

                    {/* 4. Final Video Cut */}
                    <td className="px-3 py-3.5 text-center">
                      {hasVideo ? (
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          title="Open Final Video"
                        >
                          <Film size={10} /> Master
                        </a>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">Editing</span>
                      )}
                    </td>

                    {/* 5. Thumbnail PSD */}
                    <td className="px-3 py-3.5 text-center">
                      {hasThumb ? (
                        <a
                          href={thumbUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          title="Open Thumbnail PSD"
                        >
                          <Image size={10} /> PSD
                        </a>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">Pending</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedHandoffTask(task)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <span>Handoff</span>
                        <span className="text-[10px] text-slate-500 font-semibold">({totalReady}/5)</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {state.tasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    No active tasks in this workspace. Click "Add Video Task" above to start production.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Pipeline Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Production Schedule</h2>
            <p className="text-xs text-slate-500">Latest tasks in the production queue</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateView('workflow')}
            icon={ArrowRight}
          >
            Open Full Workflow Spreadsheet
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Channel</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Topic / Video Title</th>
                <th className="px-6 py-3">Strategist</th>
                <th className="px-6 py-3">Researcher</th>
                <th className="px-6 py-3">Editor</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTasks.map((task) => {
                const channel = state.channels.find((c) => c.id === task.channelId);
                const stratEmp = state.employees.find((e) => e.id === task.stages?.strategist?.assigneeId);
                const resEmp = state.employees.find((e) => e.id === task.stages?.researcher?.assigneeId);
                const editEmp = state.employees.find((e) => e.id === task.stages?.editor?.assigneeId);

                return (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <ChannelTag channel={channel} size="xs" />
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-medium text-slate-600">
                      {task.targetDate}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900 max-w-xs truncate">
                      {task.title}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {stratEmp ? (
                          <>
                            <Avatar name={stratEmp.name} role={stratEmp.role} size="xs" />
                            <span className="text-xs text-slate-700">{stratEmp.name}</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {resEmp ? (
                          <>
                            <Avatar name={resEmp.name} role={resEmp.role} size="xs" />
                            <span className="text-xs text-slate-700">{resEmp.name}</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {editEmp ? (
                          <>
                            <Avatar name={editEmp.name} role={editEmp.role} size="xs" />
                            <span className="text-xs text-slate-700">{editEmp.name}</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => onNavigateView('workflow')}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {recentTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No tasks scheduled yet. Start by clicking "Add Video Task".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <TaskHandoffModal
        isOpen={Boolean(selectedHandoffTask)}
        task={selectedHandoffTask}
        onClose={() => setSelectedHandoffTask(null)}
      />
    </div>
  );
}
