import React, { useState } from 'react';
import {
  Filter,
  Search,
  Plus,
  ExternalLink,
  MessageSquare,
  Calendar,
  Trash2,
  Lock,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChannelTag } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import Button from '../ui/Button';
import { buildWhatsAppDispatchPayload, getNextSequentialRole } from '../../utils/whatsapp';
import AddTaskModal from '../dashboard/AddTaskModal';
import TaskHandoffModal from './TaskHandoffModal';
import { InlineEditText, InlineEditDate } from '../ui/InlineEdit';

const STAGE_COLUMNS = [
  { key: 'researcher', label: 'Researcher' },
  { key: 'anchor',     label: 'Anchor' },
  { key: 'production', label: 'Production' },
  { key: 'editor',     label: 'Editor' },
  { key: 'thumbnail',  label: 'Thumbnail' },
  { key: 'strategist', label: 'Strategist' },
];

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Review', 'Completed'];

export default function WorkflowSpreadsheet() {
  const { state, actions, currentUser } = useApp();

  const [channelFilter, setChannelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHandoffTask, setSelectedHandoffTask] = useState(null);

  const getCompletedAssetsCount = (task) => {
    return [
      Boolean(task.scriptDocUrl),
      Boolean(task.scriptDocxName),
      Boolean(task.rawFootageUrl),
      Boolean(task.finalVideoUrl),
      Boolean(task.thumbnailAssetUrl),
    ].filter(Boolean).length;
  };

  const activeEmployees = state.employees.filter((e) => e.active);

  const userRole = currentUser?.role?.toLowerCase() || 'admin';
  const isAdmin = userRole === 'admin' || userRole === 'super admin';

  // Permission check: Can current user edit a specific stage?
  const canEditStage = (stageKey) => {
    if (isAdmin) return true;
    return userRole === stageKey.toLowerCase();
  };

  // Handle assigning an employee to a stage
  const handleAssigneeChange = (task, stageKey, newAssigneeId) => {
    const prevAssigneeId = task.stages?.[stageKey]?.assigneeId;
    const currentStatus = task.stages?.[stageKey]?.status || 'Pending';

    let notificationPayload = null;

    if (newAssigneeId && newAssigneeId !== prevAssigneeId) {
      const assignedEmployee = state.employees.find((e) => e.id === newAssigneeId);
      const targetChannel = state.channels.find((c) => c.id === task.channelId);

      notificationPayload = buildWhatsAppDispatchPayload({
        task,
        channel: targetChannel,
        employee: assignedEmployee,
        stageName: stageKey.toUpperCase(),
        triggerType: 'assignment',
      });
    }

    actions.updateStage(
      task.id,
      stageKey,
      { assigneeId: newAssigneeId, status: currentStatus },
      notificationPayload
    );
  };

  // Handle stage status change with instant sequential notification
  const handleStatusChange = (task, stageKey, newStatus) => {
    const currentAssigneeId = task.stages?.[stageKey]?.assigneeId || '';
    let notificationPayload = null;

    if (newStatus === 'Completed') {
      const nextRoleKey = getNextSequentialRole(stageKey);
      if (nextRoleKey && task.stages?.[nextRoleKey]?.assigneeId) {
        const nextEmp = state.employees.find((e) => e.id === task.stages[nextRoleKey].assigneeId);
        const targetChannel = state.channels.find((c) => c.id === task.channelId);
        notificationPayload = buildWhatsAppDispatchPayload({
          task,
          channel: targetChannel,
          employee: nextEmp,
          stageName: nextRoleKey.toUpperCase(),
          triggerType: 'instant_handoff',
          completedBy: `${stageKey.toUpperCase()}`,
        });
      }
    }

    actions.updateStage(
      task.id,
      stageKey,
      { assigneeId: currentAssigneeId, status: newStatus },
      notificationPayload
    );
  };

  // Inline topic title update
  const handleInlineTitleSave = (task, newTitle) => {
    actions.updateTask({ ...task, title: newTitle });
  };

  // Inline date update
  const handleInlineDateSave = (task, newDate) => {
    actions.updateTask({ ...task, targetDate: newDate });
  };

  // Check if current user is allowed to add tasks
  const canAddTask = isAdmin || userRole === 'strategist';

  // Filter tasks
  const filteredTasks = state.tasks.filter((task) => {
    const matchesChannel = channelFilter === 'all' || task.channelId === channelFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.targetDate.includes(searchQuery);
    return matchesChannel && matchesSearch;
  });

  return (
    <div className="space-y-5 max-w-full">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Channel selector */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Channels ({state.tasks.length})</option>
              {state.channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topic or date..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-56"
            />
          </div>
        </div>

        {/* Add Task Trigger (Restricted to Admin & Strategist) */}
        {canAddTask && (
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)} icon={Plus}>
              + Add Video Task
            </Button>
          </div>
        )}
      </div>

      {/* 6-Stage Interactive Workflow Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">Channel</th>
                <th className="px-4 py-3.5 whitespace-nowrap min-w-[110px]">Date</th>
                <th className="px-4 py-3.5 min-w-[260px]">Topic / Video Title</th>
                <th className="px-3 py-3.5 text-center min-w-[160px]">Researcher</th>
                <th className="px-3 py-3.5 text-center min-w-[160px]">Anchor</th>
                <th className="px-3 py-3.5 text-center min-w-[160px]">Production</th>
                <th className="px-3 py-3.5 text-center min-w-[160px]">Editor</th>
                <th className="px-3 py-3.5 text-center min-w-[160px]">Thumbnail</th>
                <th className="px-3 py-3.5 text-center min-w-[160px]">Strategist</th>
                <th className="px-3 py-3.5 text-center w-10"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredTasks.map((task) => {
                const channel = state.channels.find((c) => c.id === task.channelId);

                return (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Channel Name */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <ChannelTag channel={channel} size="xs" />
                    </td>

                    {/* Target Date (Inline Editable) */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <InlineEditDate
                        value={task.targetDate}
                        onSave={(newDate) => handleInlineDateSave(task, newDate)}
                      />
                    </td>

                    {/* Topic / Video Title (Inline Editable) */}
                    <td className="px-4 py-3.5 align-middle">
                      <InlineEditText
                        value={task.title}
                        isBold={true}
                        onSave={(newTitle) => handleInlineTitleSave(task, newTitle)}
                        placeholder="Click to set topic title..."
                      />
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {task.driveUrl && (
                          <a
                            href={task.driveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            <ExternalLink size={10} /> Drive Assets
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedHandoffTask(task)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                          title="Inspect and edit the 5 handoff deliverables"
                        >
                          <Layers size={10} className="text-indigo-600" />
                          <span>Handoff ({getCompletedAssetsCount(task)}/5)</span>
                        </button>
                      </div>
                    </td>

                    {/* Roles */}
                    {STAGE_COLUMNS.map(({ key }) => {
                      const stageData = task.stages?.[key] || { assigneeId: '', status: 'Pending' };
                      const editable = canEditStage(key);

                      return (
                        <td key={key} className="px-2.5 py-3 align-middle border-l border-slate-100 bg-slate-50/30">
                          <div className="flex flex-col items-center gap-1.5 max-w-[150px] mx-auto">
                            {/* a) Assignee selector (clean, no initials badge) */}
                            <select
                              value={stageData.assigneeId || ''}
                              disabled={!editable}
                              onChange={(e) => handleAssigneeChange(task, key, e.target.value)}
                              className={`w-full text-[11px] font-medium bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer truncate text-center ${
                                !editable ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                              }`}
                              title={
                                editable
                                  ? 'Change assignee (Triggers 9 AM WhatsApp Reminder)'
                                  : `Only ${key} or Admin can reassign`
                              }
                            >
                              <option value="">Unassigned</option>
                              {activeEmployees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.role})
                                </option>
                              ))}
                            </select>

                            {/* b) Status dropdown (clean, centered, no message icon) */}
                            <select
                              value={stageData.status || 'Pending'}
                              disabled={!editable}
                              onChange={(e) => handleStatusChange(task, key, e.target.value)}
                              className={`w-full text-[10px] font-semibold rounded px-2 py-0.5 border cursor-pointer focus:outline-none transition-colors text-center ${
                                !editable ? 'opacity-60 cursor-not-allowed' : ''
                              } ${
                                stageData.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : stageData.status === 'In Progress'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : stageData.status === 'Review'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {STATUS_OPTIONS.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      );
                    })}

                    {/* Delete Task */}
                    <td className="px-2 py-3 text-center align-middle">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete task "${task.title}"?`)) {
                              actions.deleteTask(task.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                    No video tasks found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddTaskModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <TaskHandoffModal
        isOpen={Boolean(selectedHandoffTask)}
        task={selectedHandoffTask}
        onClose={() => setSelectedHandoffTask(null)}
      />
    </div>
  );
}
