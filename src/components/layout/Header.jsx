import React, { useState } from 'react';
import { PlaySquare, Palette, Shield } from 'lucide-react';
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
  const { state, currentUser } = useApp();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const meta = VIEW_METADATA[activeView] || VIEW_METADATA.dashboard;

  return (
    <>
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-slate-200 bg-white/95 backdrop-blur-sm z-10">
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

          {/* Studio Admin Profile Block on Top Right */}
          {currentUser && (
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <Avatar name={currentUser.name} role={currentUser.role} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                <p
                  style={{ color: 'var(--primary-color)' }}
                  className="text-[10px] font-semibold flex items-center gap-0.5 leading-tight"
                >
                  <Shield size={10} />
                  <span>{currentUser.role}</span>
                </p>
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
