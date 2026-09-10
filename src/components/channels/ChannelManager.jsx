import React, { useState } from 'react';
import {
  Plus,
  PlaySquare,
  Calendar,
  Trash2,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useApp } from '../../context/AppContext';
import ChannelCalendarView from './ChannelCalendarView';

const COLOR_PRESETS = [
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#0284c7', // Sky
  '#db2777', // Pink
  '#0d9488', // Teal
];

export default function ChannelManager() {
  const { state, actions, currentUser } = useApp();

  const [selectedCalendarChannel, setSelectedCalendarChannel] = useState(null);

  // Add / Edit Channel Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [channelName, setChannelName] = useState('');
  const [handle, setHandle] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [error, setError] = useState('');

  const roleLower = currentUser?.role?.toLowerCase() || '';
  const isAdmin = roleLower === 'admin' || roleLower === 'super admin';

  if (selectedCalendarChannel) {
    return (
      <ChannelCalendarView
        channel={selectedCalendarChannel}
        onBack={() => setSelectedCalendarChannel(null)}
      />
    );
  }

  const handleOpenAdd = () => {
    setEditingChannel(null);
    setChannelName('');
    setHandle('');
    setColor(COLOR_PRESETS[0]);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (channel) => {
    setEditingChannel(channel);
    setChannelName(channel.name);
    setHandle(channel.handle || '');
    setColor(channel.color || COLOR_PRESETS[0]);
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveChannel = () => {
    const trimmedName = channelName.trim();
    if (!trimmedName) {
      setError('Channel name is required.');
      return;
    }

    const isDuplicate = state.channels.some(
      (c) =>
        (!editingChannel || c.id !== editingChannel.id) &&
        c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setError(`A channel named "${trimmedName}" already exists. Duplicate names are not allowed.`);
      return;
    }

    const formattedHandle = handle.trim()
      ? handle.startsWith('@')
        ? handle.trim()
        : `@${handle.trim()}`
      : `@${trimmedName.toLowerCase().replace(/\s+/g, '')}`;

    if (editingChannel) {
      actions.updateChannel({
        ...editingChannel,
        name: trimmedName,
        handle: formattedHandle,
        color,
      });
    } else {
      const newChannel = {
        id: 'ch-' + Date.now().toString(36),
        name: trimmedName,
        handle: formattedHandle,
        color,
        workspaceId: currentUser?.workspaceId === 'global' ? (state.workspaces?.[0]?.id || 'ws-main') : (currentUser?.workspaceId || 'ws-main'),
      };
      actions.addChannel(newChannel);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Channels & Content Calendars
          </h1>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={handleOpenAdd} icon={Plus}>
            Add New Channel
          </Button>
        )}
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.channels.map((channel) => {
          const channelTasks = state.tasks.filter((t) => t.channelId === channel.id);
          const completedCount = channelTasks.filter((t) =>
            Object.values(t.stages || {}).every((s) => s.status === 'Completed')
          ).length;

          return (
            <div
              key={channel.id}
              onClick={() => setSelectedCalendarChannel(channel)}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card hover:shadow-dropdown hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-xs flex-shrink-0"
                      style={{ backgroundColor: channel.color }}
                    >
                      <PlaySquare size={24} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {channel.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {channel.handle}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(channel);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Channel"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete channel "${channel.name}" and associated tasks?`)) {
                            actions.deleteChannel(channel.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Channel"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-xl font-extrabold text-slate-900">{channelTasks.length}</p>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Total Topics
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-xl font-extrabold text-emerald-600">{completedCount}</p>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Completed
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Prompt */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} /> Open Content Calendar
                </span>
                <span>→</span>
              </div>
            </div>
          );
        })}
      </div>

      {state.channels.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-card flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
            <PlaySquare size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Channels in this Workspace</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            This workspace is fresh. Start building your studio pipeline by adding your first YouTube channel.
          </p>
          {isAdmin && (
            <Button variant="primary" size="sm" onClick={handleOpenAdd} icon={Plus} className="mt-4">
              Add First Channel
            </Button>
          )}
        </div>
      )}

      {/* Add / Edit Channel Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChannel ? `Edit Channel: ${editingChannel.name}` : 'Add New Channel'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            id="channel-name"
            label="Channel Name"
            required
            value={channelName}
            onChange={(e) => {
              setChannelName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Science Unlocked"
            error={error}
          />

          <Input
            id="channel-handle"
            label="Handle / URL Identifier"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@scienceunlocked"
            helperText="Used for internal tagging and automated WhatsApp message templates."
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase block mb-2">
              Brand Accent Color
            </label>
            <div className="flex items-center gap-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === preset ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
                title="Custom color"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
            <AlertCircle size={15} className="text-slate-500 flex-shrink-0" />
            <span>Channel names must be unique to avoid pipeline routing conflicts.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveChannel} icon={Plus}>
              {editingChannel ? 'Save Changes' : 'Save Channel'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
