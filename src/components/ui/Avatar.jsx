import React from 'react';

const ROLE_COLORS = {
  Strategist: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Researcher: 'bg-sky-100 text-sky-800 border-sky-200',
  Anchor: 'bg-purple-100 text-purple-800 border-purple-200',
  Production: 'bg-amber-100 text-amber-800 border-amber-200',
  Editor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Uploader: 'bg-rose-100 text-rose-800 border-rose-200',
};

export function Avatar({ name, role, size = 'sm' }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const colorClass = ROLE_COLORS[role] || 'bg-slate-100 text-slate-700 border-slate-300';

  const sizes = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-xs font-medium',
    lg: 'w-10 h-10 text-sm font-semibold',
  };

  return (
    <div
      title={name ? `${name} (${role || 'Team Member'})` : undefined}
      className={`${sizes[size]} ${colorClass} rounded-full flex items-center justify-center font-bold border flex-shrink-0 select-none shadow-xs`}
    >
      {initials}
    </div>
  );
}
