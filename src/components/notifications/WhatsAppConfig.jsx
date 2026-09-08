import React, { useState } from 'react';
import {
  MessageSquare, Clock, RefreshCw, Send, Users, Smartphone,
  Code2, ChevronDown, ChevronRight, Calendar, AlertCircle, CheckCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateWhatsAppPayload, DEFAULT_RECIPIENTS, NOTIFICATION_CONFIG } from '../../data/notificationSchema';
import { isDueToday, isOverdue } from '../../utils/dateHelpers';
import { ChannelTag, StatusBadge } from '../ui/Badge';

export default function WhatsAppConfig() {
  const { state } = useApp();
  const [selectedRecipient, setSelectedRecipient] = useState(DEFAULT_RECIPIENTS[0]);
  const [showPayload, setShowPayload] = useState(false);

  // Build the digest
  const today = new Date().toISOString().split('T')[0];

  const pendingTasks = state.tasks.filter(t =>
    t.columnId !== 'published' && t.status !== 'Published'
  );

  const carriedOver = pendingTasks.filter(t => {
    const past = t.targetDate && t.targetDate < today;
    const notToday = !isDueToday(t.targetDate);
    return past || (!isDueToday(t.targetDate) && t.targetDate);
  }).filter(t => isOverdue(t.targetDate));

  const newToday = pendingTasks.filter(t => isDueToday(t.targetDate));

  const digest = { carriedOver, newToday };

  const payload = generateWhatsAppPayload(digest, state.channels, selectedRecipient);

  const SectionLabel = ({ icon: Icon, label, count, color }) => (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={15} style={{ color }} />
      <span className="text-sm font-semibold text-gray-200">{label}</span>
      {count !== undefined && (
        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: color + '22', color }}>
          {count}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">WhatsApp Notification Config</h2>
        <p className="text-sm text-gray-400 mt-0.5">Daily morning digest — schema, pending tasks, and mock API payload</p>
      </div>

      {/* Config Overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Clock, label: 'Dispatch Time', value: NOTIFICATION_CONFIG.dispatchTime, sub: NOTIFICATION_CONFIG.timezone, color: '#6366f1' },
          { icon: RefreshCw, label: 'Carry-Over Until', value: 'Completed', sub: 'Tasks repeat every morning', color: '#22c55e' },
          { icon: Users, label: 'Recipients', value: DEFAULT_RECIPIENTS.length, sub: 'team members', color: '#38bdf8' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-surface-800 border border-surface-600 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }} />
              <p className="text-xs text-gray-400">{label}</p>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Left: Pending Tasks in Tomorrow's Digest */}
        <div className="bg-surface-800 border border-surface-600 rounded-xl p-5">
          <SectionLabel icon={AlertCircle} label="Carried-Over Tasks" count={carriedOver.length} color="#f59e0b" />
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {carriedOver.length === 0 && (
              <div className="flex items-center gap-2 py-6 justify-center">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-sm text-green-400">No carried-over tasks! 🎉</span>
              </div>
            )}
            {carriedOver.map(task => {
              const channel = state.channels.find(c => c.id === task.channelId);
              return (
                <div key={task.id} className="flex items-start justify-between gap-3 p-3 bg-surface-700 rounded-lg border border-yellow-700/30 group">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <AlertCircle size={13} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-200 line-clamp-2">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <ChannelTag channel={channel} size="xs" />
                        <StatusBadge status={task.status} />
                        <span className="text-[10px] text-red-400">Overdue ({task.targetDate})</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => actions.moveTask(task.id, 'published')}
                    className="flex-shrink-0 px-2 py-1 rounded bg-green-900/40 hover:bg-green-800/60 text-green-300 border border-green-700/40 text-[10px] font-medium transition-colors flex items-center gap-1"
                    title="Mark Completed and move to Published"
                  >
                    <CheckCircle size={11} />
                    Done
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-surface-600 pt-4">
            <SectionLabel icon={Calendar} label="Due Today" count={newToday.length} color="#38bdf8" />
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {newToday.length === 0 && (
                <p className="text-xs text-gray-500 py-3 text-center">No tasks due today.</p>
              )}
              {newToday.map(task => {
                const channel = state.channels.find(c => c.id === task.channelId);
                return (
                  <div key={task.id} className="flex items-start justify-between gap-3 p-3 bg-surface-700 rounded-lg border border-sky-700/30">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Calendar size={13} className="text-sky-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-200 line-clamp-2">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <ChannelTag channel={channel} size="xs" />
                          <StatusBadge status={task.status} />
                          <span className="text-[10px] text-sky-400">Due Today</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => actions.moveTask(task.id, 'published')}
                      className="flex-shrink-0 px-2 py-1 rounded bg-green-900/40 hover:bg-green-800/60 text-green-300 border border-green-700/40 text-[10px] font-medium transition-colors flex items-center gap-1"
                      title="Mark Completed and move to Published"
                    >
                      <CheckCircle size={11} />
                      Done
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: WhatsApp Message Preview */}
        <div className="bg-surface-800 border border-surface-600 rounded-xl p-5">
          <SectionLabel icon={Smartphone} label="Message Preview" color="#25D366" />

          {/* Recipient selector */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-400">Preview as:</span>
            <div className="relative">
              <select
                value={selectedRecipient.id}
                onChange={e => setSelectedRecipient(DEFAULT_RECIPIENTS.find(r => r.id === e.target.value))}
                className="pl-2 pr-6 py-1 rounded-md bg-surface-700 border border-surface-500 text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-accent appearance-none cursor-pointer"
              >
                {DEFAULT_RECIPIENTS.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* WhatsApp Chat Bubble */}
          <div className="bg-[#0b1418] rounded-xl p-4 border border-[#2a3942]">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#2a3942]">
              <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
                <MessageSquare size={14} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">YT Ops Bot</p>
                <p className="text-[10px] text-gray-500">+91-XXXX-YT-OPS</p>
              </div>
            </div>
            <div className="bg-[#202c33] rounded-lg rounded-tl-none p-3 max-h-52 overflow-y-auto">
              <pre className="text-[11px] text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {payload.text.body}
              </pre>
              <p className="text-[9px] text-gray-600 text-right mt-2">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ✓✓
              </p>
            </div>
          </div>

          {/* API Payload Toggle */}
          <button
            onClick={() => setShowPayload(p => !p)}
            className="mt-4 flex items-center gap-2 text-xs text-accent hover:text-accent-light transition-colors font-medium"
          >
            <Code2 size={13} />
            {showPayload ? 'Hide' : 'Show'} API Payload
            {showPayload ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {showPayload && (
            <div className="mt-3 bg-surface-900 border border-surface-600 rounded-lg p-3 max-h-64 overflow-auto">
              <pre className="text-[10px] text-green-400 font-mono leading-relaxed">
                {JSON.stringify({ ...payload, text: { ...payload.text, body: '[message body above]' } }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Schema Docs */}
      <div className="bg-surface-800 border border-surface-600 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Code2 size={15} className="text-accent" />
          <h3 className="font-semibold text-gray-200">Notification Schema Reference</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Dispatch Config</p>
            <div className="space-y-2 text-xs">
              {[
                { key: 'dispatchTime', val: '"08:00"', desc: 'Daily send time' },
                { key: 'timezone', val: '"Asia/Kolkata"', desc: 'IST timezone' },
                { key: 'repeatUntilCompleted', val: 'true', desc: 'Carry-over until Published' },
                { key: 'apiProvider', val: '"Meta WhatsApp Business API"', desc: 'Integration target' },
                { key: 'apiVersion', val: '"v19.0"', desc: 'Graph API version' },
              ].map(({ key, val, desc }) => (
                <div key={key} className="flex gap-2">
                  <code className="text-accent-light font-mono">{key}:</code>
                  <code className="text-yellow-400 font-mono">{val}</code>
                  <span className="text-gray-500">— {desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Digest Structure</p>
            <div className="space-y-2 text-xs">
              {[
                { key: 'carriedOver', val: 'Task[]', desc: 'Overdue / pending tasks' },
                { key: 'newToday', val: 'Task[]', desc: 'Tasks due today' },
                { key: 'taskStatus', val: '"pending" | "completed"', desc: 'Carry-over gating' },
                { key: 'recipients', val: '[{name, phone, role}]', desc: 'Per-role dispatch' },
                { key: 'generatedAt', val: 'ISO 8601', desc: 'Payload timestamp' },
              ].map(({ key, val, desc }) => (
                <div key={key} className="flex gap-2">
                  <code className="text-accent-light font-mono">{key}:</code>
                  <code className="text-yellow-400 font-mono">{val}</code>
                  <span className="text-gray-500">— {desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
