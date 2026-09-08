import React from 'react';

export function ChannelTag({ channel, size = 'sm' }) {
  if (!channel) return null;
  const sizes = {
    xs: 'text-[11px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold tracking-tight ${sizes[size]}`}
      style={{
        backgroundColor: `${channel.color}15`,
        color: channel.color,
        border: `1px solid ${channel.color}35`,
      }}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: channel.color }} />
      {channel.name}
    </span>
  );
}

export function StatusBadge({ status, size = 'sm' }) {
  const styles = {
    Pending: 'bg-slate-100 text-slate-700 border-slate-300',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    Review: 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${sizes[size]} ${
        styles[status] || styles.Pending
      }`}
    >
      {status}
    </span>
  );
}

export function RoleTag({ role, size = 'sm' }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
      {role}
    </span>
  );
}
