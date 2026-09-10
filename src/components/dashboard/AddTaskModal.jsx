import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input, { Select } from '../ui/Input';
import { useApp } from '../../context/AppContext';
import { buildWhatsAppDispatchPayload } from '../../utils/whatsapp';
import { MessageSquare, Sparkles, Send, Zap } from 'lucide-react';

export default function AddTaskModal({ isOpen, onClose }) {
  const { state, actions, currentUser } = useApp();

  const [channelId, setChannelId] = useState('');
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [driveUrl, setDriveUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Primary assignee selection for quick task dispatch
  const [primaryRole, setPrimaryRole] = useState('researcher');
  const [primaryAssigneeId, setPrimaryAssigneeId] = useState('');

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (state.channels.length > 0 && !channelId) {
        setChannelId(state.channels[0].id);
      }
      // Pick first active researcher by default
      const defaultMember = state.employees.find((e) => e.active && e.role.toLowerCase() === 'researcher');
      if (defaultMember) {
        setPrimaryAssigneeId(defaultMember.id);
      } else if (state.employees.length > 0) {
        setPrimaryAssigneeId(state.employees[0].id);
      }
      setErrors({});
    }
  }, [isOpen, state.channels, state.employees]);

  // When primary role changes, suggest matching employee
  const handleRoleChange = (roleKey) => {
    setPrimaryRole(roleKey);
    const matchingEmp = state.employees.find(
      (e) => e.active && e.role.toLowerCase() === roleKey.toLowerCase()
    );
    if (matchingEmp) {
      setPrimaryAssigneeId(matchingEmp.id);
    }
  };

  const validate = () => {
    const errs = {};
    if (!channelId) errs.channelId = 'Please select a YouTube channel.';
    if (!title.trim()) errs.title = 'Topic / Video Title is required.';
    if (!targetDate) errs.targetDate = 'Scheduled date is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateTask = () => {
    if (!validate()) return;

    // Auto-map default employee for each of the 6 roles
    const getRoleEmpId = (rName) => {
      if (primaryRole === rName && primaryAssigneeId) return primaryAssigneeId;
      const match = state.employees.find((e) => e.active && e.role.toLowerCase() === rName.toLowerCase());
      return match ? match.id : '';
    };

    const targetChannel = state.channels.find((c) => c.id === channelId);
    const primaryEmployee = state.employees.find((e) => e.id === primaryAssigneeId);

    const newTask = {
      id: 'wf-' + Date.now().toString(36),
      channelId,
      workspaceId: targetChannel?.workspaceId || (currentUser?.workspaceId === 'global' ? (state.workspaces?.[0]?.id || 'ws-main') : (currentUser?.workspaceId || 'ws-main')),
      title: title.trim(),
      targetDate,
      driveUrl: driveUrl.trim(),
      notes: notes.trim(),
      scriptDocUrl: '',
      scriptDocxName: '',
      rawFootageUrl: '',
      finalVideoUrl: '',
      thumbnailAssetUrl: '',
      stages: {
        researcher: {
          assigneeId: getRoleEmpId('researcher'),
          status: 'Pending',
        },
        anchor: {
          assigneeId: getRoleEmpId('anchor'),
          status: 'Pending',
        },
        production: {
          assigneeId: getRoleEmpId('production'),
          status: 'Pending',
        },
        editor: {
          assigneeId: getRoleEmpId('editor'),
          status: 'Pending',
        },
        thumbnail: {
          assigneeId: getRoleEmpId('thumbnail'),
          status: 'Pending',
        },
        strategist: {
          assigneeId: getRoleEmpId('strategist'),
          status: 'Pending',
        },
      },
    };

    // BULK CREATION TRIGGER: Instantly dispatch notifications to all assigned team members across the pipeline
    const bulkNotificationPayload = buildWhatsAppDispatchPayload({
      task: newTask,
      channel: targetChannel,
      employee: primaryEmployee || { name: 'All Pipeline Assignees', phone: '+91 98765 00000', role: 'Pipeline Team' },
      stageName: 'FULL PIPELINE (6 ROLES)',
      triggerType: 'bulk_creation',
      totalAssigned: 'All 6 Roles (Researcher, Anchor, Production, Editor, Thumbnail, Strategist)',
    });

    actions.addTask(newTask, bulkNotificationPayload);
    onClose();

    // Reset form
    setTitle('');
    setDriveUrl('');
    setNotes('');
  };

  const channelOptions = state.channels.map((c) => ({ value: c.id, label: c.name }));

  const activeEmployees = state.employees.filter((e) => e.active);
  const employeeOptions = activeEmployees.map((e) => ({
    value: e.id,
    label: `${e.name} (${e.role}) - ${e.phone}`,
  }));

  const roleOptions = [
    { value: 'researcher', label: '1. Researcher (Facts & Script)' },
    { value: 'anchor',     label: '2. Anchor (On-Camera Host)' },
    { value: 'production', label: '3. Production (Filming & Multicam)' },
    { value: 'editor',     label: '4. Editor (Post-Production & 4K Cut)' },
    { value: 'thumbnail',  label: '5. Thumbnail (High-CTR Visual Assets)' },
    { value: 'strategist', label: '6. Strategist (Upload, Packaging & Launch)' },
  ];

  const selectedEmployee = state.employees.find((e) => e.id === primaryAssigneeId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule New Video Task" size="lg">
      <div className="space-y-4">
        {/* Bulk Instant Notification Notice */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
          <Zap size={16} className="text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">
            ⚡ Instant Bulk WhatsApp Dispatch: Creating this task will immediately trigger alerts to all 6 assigned team members across the pipeline.
          </span>
        </div>

        {/* Channel & Scheduled Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            id="task-channel"
            label="Target Channel"
            required
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            options={channelOptions}
            placeholder="Select a channel..."
            error={errors.channelId}
          />
          <Input
            id="task-date"
            label="Scheduled Production Date"
            type="date"
            required
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            error={errors.targetDate}
          />
        </div>

        {/* Video Title / Topic */}
        <Input
          id="task-title"
          label="Video Topic / Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 10 AI Tools Revolutionizing Content Creation in 2026"
          error={errors.title}
        />

        {/* Primary Assignee & Stage Selection */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            PRIMARY LEAD ASSIGNEE
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              id="task-primary-role"
              label="Starting Role"
              value={primaryRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              options={roleOptions}
            />
            <Select
              id="task-assignee"
              label="Assignee (From Team Members)"
              value={primaryAssigneeId}
              onChange={(e) => setPrimaryAssigneeId(e.target.value)}
              options={employeeOptions}
              placeholder="Assign team member..."
            />
          </div>

          {selectedEmployee && (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400">Lead Assignee WhatsApp:</span>
              <strong className="text-slate-800">{selectedEmployee.phone}</strong>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold ml-auto">
                ⚡ Instant Hook
              </span>
            </div>
          )}
        </div>

        {/* Shared Drive Folder URL */}
        <Input
          id="task-drive"
          label="Google Drive Production Folder URL (Optional)"
          type="url"
          value={driveUrl}
          onChange={(e) => setDriveUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
        />

        {/* Notes / Directive */}
        <div>
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
            Editorial Notes & Instructions
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key talking points, angle, target audience hook, competitor video links..."
            rows={3}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateTask}
            icon={Send}
          >
            Create Task & Dispatch Bulk Alerts
          </Button>
        </div>
      </div>
    </Modal>
  );
}
