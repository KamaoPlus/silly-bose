import React, { useState } from 'react';
import { PlaySquare, Palette, Shield, Building, Globe } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ThemeSettingsModal from '../ui/ThemeSettingsModal';
import { Avatar } from '../ui/Avatar';

const VIEW_METADATA = {
  dashboard: {
    title: 'Dashboard',
    subtitle: '',
  },
  channels: {
    title: 'Channels & Calendars',
    subtitle: '',
  },
  workflow: {
    title: 'Production Pipeline',
    subtitle: '',
  },
  team: {
    title: 'Team Directory',
    subtitle: '',
  },
  kpi: {
    title: 'KPIs & SOPs',
    subtitle: '',
  },
  'researcher-workspace': {
    title: 'Script & Research',
    subtitle: '',
  },
  'production-workspace': {
    title: 'Production Studio',
    subtitle: '',
  },
  'editor-workspace': {
    title: 'Editing Suite',
    subtitle: '',
  },
  'thumbnail-workspace': {
    title: 'Thumbnail Suite',
    subtitle: '',
  },
  'strategist-workspace': {
    title: 'Review & Publish',
    subtitle: '',
  },
  resources: {
    title: 'Useful Resources',
    subtitle: '',
  },
};

export default function Header({ activeView }) {
  const { state, currentUser, isSuperAdmin, activeWorkspaceId, setActiveWorkspaceId } = useApp();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const meta = VIEW_METADATA[activeView] || VIEW_METADATA.dashboard;
  const currentWs = (state.workspaces || []).find((w) => w.id === (currentUser?.workspaceId || 'ws-main'));

  return (
    <>
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-slate-200 bg-white/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
              {meta.title}
            </h1>
            {meta.subtitle && (
              <p className="text-xs text-slate-500 hidden sm:block leading-tight mt-0.5">
                {meta.subtitle}
              </p>
            )}
          </div>

          {/* Workspace Badge / Selector */}
          {isSuperAdmin ? (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <Globe size={13} className="text-amber-700" />
              <span className="font-semibold">Scope:</span>
              <select
                value={activeWorkspaceId}
                onChange={(e) => setActiveWorkspaceId(e.target.value)}
                className="bg-transparent font-bold text-amber-950 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Workspaces</option>
                {(state.workspaces || []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          ) : currentWs ? (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
              <Building size={12} className="text-slate-500" />
              <span className="font-bold">{currentWs.name}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {/* Theme & Font Customization Trigger */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-xs cursor-pointer"
            title="Customize Accent Color & Font Family"
          >
            <Palette size={14} style={{ color: 'var(--primary-color)' }} />
            <span className="hidden sm:inline">Theme & Font</span>
          </button>

          {/* Profile Block on Top Right */}
          {currentUser && (
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <Avatar name={currentUser.name} role={currentUser.role} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                    <Shield size={10} className="text-amber-700" />
                    Super Admin
                  </span>
                ) : (
                  <p
                    style={{ color: 'var(--primary-color)' }}
                    className="text-[10px] font-semibold flex items-center gap-0.5 leading-tight"
                  >
                    <Shield size={10} />
                    <span>{currentUser.role}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </>
  );
}
