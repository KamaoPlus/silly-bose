import React, { useState, useEffect } from 'react';
import { Link, ExternalLink, Video, Music } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input, { Select } from '../ui/Input';
import { ChannelTag } from '../ui/Badge';
import { useApp } from '../../context/AppContext';
import { ROLES, PIPELINE_COLUMNS } from '../../data/initialData';
import { sanitizeExternalUrl } from '../../utils/fileHelpers';

const STATUSES = ['Pending', 'In Progress', 'Blocked', 'Ready', 'Published'];

function generateId() {
  return 'task-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const BLANK_TASK = {
  id: null,
  title: '',
  channelId: '',
  columnId: 'strategy',
  assignees: Object.fromEntries(ROLES.map(r => [r, false])),
  targetDate: '',
  driveUrl: '',
  status: 'Pending',
  notes: '',
  metrics: null,
  defaultTargets: { views: '', ctr: '', watchTime: '' },
};

export default function TaskModal({ isOpen, onClose, editTask = null, defaultColumnId = 'strategy' }) {
  const { state, actions } = useApp();
  const [form, setForm] = useState(BLANK_TASK);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editTask) {
        setForm({ ...BLANK_TASK, ...editTask });
      } else {
        setForm({ ...BLANK_TASK, id: null, columnId: defaultColumnId });
      }
      setErrors({});
    }
  }, [isOpen, editTask, defaultColumnId]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setTarget = (field, value) => setForm(f => ({ ...f, defaultTargets: { ...f.defaultTargets, [field]: value } }));
  const toggleAssignee = (role) => setForm(f => ({
    ...f, assignees: { ...f.assignees, [role]: !f.assignees[role] },
  }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.channelId) e.channelId = 'Channel is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editTask) {
      actions.updateTask(form);
    } else {
      actions.addTask({ ...form, id: generateId() });
    }
    onClose();
  };

  const channelOptions = state.channels.map(c => ({ value: c.id, label: c.name }));
  const colOptions = PIPELINE_COLUMNS.map(c => ({ value: c.id, label: c.label }));
  const selectedChannel = state.channels.find(c => c.id === form.channelId);

  const ROLE_COLORS = {
    'Strategist': 'border-violet-500 bg-violet-500/10 text-violet-300',
    'Researcher': 'border-sky-500 bg-sky-500/10 text-sky-300',
    'Camera':     'border-amber-500 bg-amber-500/10 text-amber-300',
    'Editor 1':   'border-orange-500 bg-orange-500/10 text-orange-300',
    'Editor 2':   'border-pink-500 bg-pink-500/10 text-pink-300',
    'Editor 3':   'border-emerald-500 bg-emerald-500/10 text-emerald-300',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editTask ? 'Edit Task' : 'New Task'} size="lg">
      <div className="space-y-5">
        {/* Title */}
        <Input
          id="title" label="Video Title" required
          value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="e.g. 10 AI Tools That Will Replace Your Job"
          error={errors.title}
        />

        {/* Channel + Status row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              id="channel" label="Channel" required
              value={form.channelId} onChange={e => set('channelId', e.target.value)}
              options={channelOptions} placeholder="Select channel…"
            />
            {errors.channelId && <p className="text-xs text-red-400 mt-1">{errors.channelId}</p>}
            {selectedChannel && <div className="mt-1.5"><ChannelTag channel={selectedChannel} /></div>}
          </div>
          <Select
            id="status" label="Status"
            value={form.status} onChange={e => set('status', e.target.value)}
            options={STATUSES.map(s => ({ value: s, label: s }))}
          />
        </div>

        {/* Column + Target Date */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            id="column" label="Pipeline Stage"
            value={form.columnId} onChange={e => set('columnId', e.target.value)}
            options={colOptions}
          />
          <Input
            id="targetDate" label="Target Date" type="date"
            value={form.targetDate} onChange={e => set('targetDate', e.target.value)}
          />
        </div>

        {/* Drive URL */}
        <Input
          id="driveUrl" label="Google Drive URL"
          value={form.driveUrl} onChange={e => set('driveUrl', e.target.value)}
          placeholder="https://drive.google.com/drive/folders/…"
        />

        {/* Production Attachments / Handoff Action Links */}
        {(sanitizeExternalUrl(form.raw_footage_url || form.rawFootageUrl) || sanitizeExternalUrl(form.audio_file_url || form.audioFileUrl)) && (
          <div className="bg-surface-700/60 border border-surface-500 rounded-xl p-3.5 space-y-2">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">
              Production Handoff Assets
            </p>
            <div className="flex flex-wrap gap-2.5">
              {sanitizeExternalUrl(form.raw_footage_url || form.rawFootageUrl) && (
                <a
                  href={sanitizeExternalUrl(form.raw_footage_url || form.rawFootageUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <Video size={13} />
                  <span>🎥 Raw Footage Drive</span>
                  <ExternalLink size={11} />
                </a>
              )}
              {sanitizeExternalUrl(form.audio_file_url || form.audioFileUrl) && (
                <a
                  href={sanitizeExternalUrl(form.audio_file_url || form.audioFileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <Music size={13} />
                  <span>🎙️ Raw Audio File</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Assignees */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-2">Assignees</p>
          <div className="flex flex-wrap gap-2">
            {ROLES.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => toggleAssignee(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  form.assignees[role]
                    ? ROLE_COLORS[role]
                    : 'border-surface-500 text-gray-500 hover:border-surface-400 hover:text-gray-300'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Default Targets */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-2">Performance Targets (per-video defaults)</p>
          <div className="grid grid-cols-3 gap-3">
            <Input
              id="viewTarget" label="Target Views" type="number"
              value={form.defaultTargets.views}
              onChange={e => setTarget('views', e.target.value)}
              placeholder="50000"
            />
            <Input
              id="ctrTarget" label="Target CTR %" type="number"
              value={form.defaultTargets.ctr}
              onChange={e => setTarget('ctr', e.target.value)}
              placeholder="6.5"
            />
            <Input
              id="watchTarget" label="Target Watch Time (s)" type="number"
              value={form.defaultTargets.watchTime}
              onChange={e => setTarget('watchTime', e.target.value)}
              placeholder="480"
            />
          </div>
        </div>

        {/* Notes */}
        <Input
          id="notes" label="Notes" type="textarea"
          value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Production notes, shooting directions, etc."
        />

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-surface-600">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>
            {editTask ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
