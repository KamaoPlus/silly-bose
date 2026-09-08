import React from 'react';
import {
  LayoutDashboard,
  PlaySquare,
  Table,
  Users,
  Award,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Video,
  Film,
  Sparkles,
  Image,
  FolderOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Sidebar({ activeView, onViewChange, collapsed, onToggleCollapse }) {
  const { currentUser, actions } = useApp();

  const userRole = currentUser?.role?.toLowerCase() || 'admin';
  const isAdmin = userRole === 'admin';

  // Build role-specific navigation list
  const getNavItems = () => {
    switch (userRole) {
      case 'researcher':
        return [
          { id: 'researcher-workspace', label: 'Script & Research', icon: FileText, badge: 'Active' },
          { id: 'workflow', label: 'Workflow', icon: Table, badge: '6 Roles' },
          { id: 'kpi', label: 'KPIs & SOPs', icon: Award, badge: null },
          { id: 'resources', label: 'Useful Resources', icon: FolderOpen, badge: 'Studio' },
        ];
      case 'production':
      case 'anchor':
        return [
          { id: 'production-workspace', label: 'Shoots & Footage', icon: Video, badge: 'Studio' },
          { id: 'workflow', label: 'Workflow', icon: Table, badge: '6 Roles' },
          { id: 'kpi', label: 'KPIs & SOPs', icon: Award, badge: null },
          { id: 'resources', label: 'Useful Resources', icon: FolderOpen, badge: 'Studio' },
        ];
      case 'editor':
        return [
          { id: 'editor-workspace', label: 'Editing Workspace', icon: Film, badge: 'Master' },
          { id: 'workflow', label: 'Workflow', icon: Table, badge: '6 Roles' },
          { id: 'kpi', label: 'KPIs & SOPs', icon: Award, badge: null },
          { id: 'resources', label: 'Useful Resources', icon: FolderOpen, badge: 'Studio' },
        ];
      case 'thumbnail':
        return [
          { id: 'thumbnail-workspace', label: 'Thumbnail Suite', icon: Image, badge: 'Design' },
          { id: 'workflow', label: 'Workflow', icon: Table, badge: '6 Roles' },
          { id: 'kpi', label: 'KPIs & SOPs', icon: Award, badge: null },
          { id: 'resources', label: 'Useful Resources', icon: FolderOpen, badge: 'Studio' },
        ];
      case 'strategist':
        return [
          { id: 'strategist-workspace', label: 'Review & Publish', icon: Sparkles, badge: 'Upload' },
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null }, // Moved to 2nd position
          { id: 'channels', label: 'Channels', icon: PlaySquare, badge: null },
          { id: 'workflow', label: 'Workflow', icon: Table, badge: '6 Roles' },
          { id: 'kpi', label: 'KPIs & SOPs', icon: Award, badge: null },
          { id: 'resources', label: 'Useful Resources', icon: FolderOpen, badge: 'Studio' },
        ];
      case 'admin':
      default:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
          { id: 'channels', label: 'Channels', icon: PlaySquare, badge: null },
          { id: 'workflow', label: 'Workflow', icon: Table, badge: '6 Roles' },
          { id: 'team', label: 'Team & Users', icon: Users, badge: null },
          { id: 'kpi', label: 'KPIs & SOPs', icon: Award, badge: null },
          { id: 'resources', label: 'Useful Resources', icon: FolderOpen, badge: 'Shared' },
        ];
    }
  };

  const mainNavItems = getNavItems();

  return (
    <aside
      className={`
        flex flex-col bg-white border-r border-slate-200 flex-shrink-0
        transition-all duration-200 z-20 shadow-xs
        ${collapsed ? 'w-[70px]' : 'w-[245px]'}
      `}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            style={{ backgroundColor: 'var(--primary-color)' }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold flex-shrink-0 shadow-sm"
          >
            <PlaySquare size={20} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 truncate leading-tight">
                YT Production
              </p>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase truncate">
                Complete Management
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Modules */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto no-scrollbar">
        {!collapsed && (
          <div className="px-3 flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Admin Modules' : `${currentUser?.role || 'Role'} Suite`}
            </p>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
              {userRole}
            </span>
          </div>
        )}

        {mainNavItems.map(({ id, label, icon: Icon, badge }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              title={collapsed ? label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs
                transition-all duration-150 select-none cursor-pointer
                ${
                  isActive
                    ? 'bg-[var(--primary-light)] text-[var(--primary-text)] shadow-xs border border-[var(--primary-color)]/30 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }
                ${collapsed ? 'justify-center px-0' : ''}
              `}
            >
              <Icon
                size={18}
                style={isActive ? { color: 'var(--primary-color)' } : undefined}
                className={!isActive ? 'text-slate-500' : ''}
              />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{label}</span>
                  {badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-200/70 text-slate-700">
                      {badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer: Logout & Collapse */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-1.5">
        <button
          onClick={actions.logout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title="Sign out of workspace"
        >
          <LogOut size={15} />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors text-xs font-semibold cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /> <span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
