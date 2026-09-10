import React from 'react';
import {
  Users,
  PlaySquare,
  HardDrive,
  Building,
  Shield,
  ArrowRight,
  UserCheck,
  UserX,
  TrendingUp,
  FolderOpen,
  Activity,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Helper to convert size strings to megabytes
export const parseSizeToMB = (sizeStr = '') => {
  if (!sizeStr) return 0;
  const num = parseFloat(sizeStr);
  if (isNaN(num)) return 0;
  if (sizeStr.toUpperCase().includes('GB')) return num * 1024;
  if (sizeStr.toUpperCase().includes('KB')) return num / 1024;
  return num; // assume MB
};

export default function SuperAdminDashboard({ onNavigateView }) {
  const { state, rawState, actions } = useApp();

  // All records platform-wide (rawState holds global data)
  const allEmployees = rawState.employees || [];
  const allWorkspaces = rawState.workspaces || [];
  const allChannels = rawState.channels || [];
  const allTasks = rawState.tasks || [];
  const allResources = rawState.resources || [];

  // Admins count
  const allAdmins = allEmployees.filter((e) => e.role === 'Admin');
  const activeAdmins = allAdmins.filter((e) => e.active);

  // Operational team members count (excluding Super Admin and Admins)
  const teamUsers = allEmployees.filter((e) => e.role !== 'Super Admin' && e.role !== 'Admin');
  const activeTeamUsers = teamUsers.filter((e) => e.active);

  // Global Storage Used calculation
  let totalResourceMB = 0;
  allResources.forEach((folder) => {
    (folder.items || []).forEach((item) => {
      totalResourceMB += parseSizeToMB(item.size);
    });
  });

  // Calculate estimated media drive storage (from tasks with rawFootageUrl / finalVideoUrl / thumbnailAssetUrl)
  let estimatedMediaMB = 0;
  allTasks.forEach((task) => {
    if (task.rawFootageUrl) estimatedMediaMB += 2400; // ~2.4 GB per shoot
    if (task.finalVideoUrl) estimatedMediaMB += 850;  // ~850 MB master 4K
    if (task.thumbnailAssetUrl) estimatedMediaMB += 45; // ~45 MB PSD
  });

  const totalStorageMB = totalResourceMB + estimatedMediaMB;
  const totalStorageGB = (totalStorageMB / 1024).toFixed(1);
  const storageQuotaGB = 100; // 100 GB allocated quota
  const storagePercent = Math.min(100, Math.round((totalStorageMB / (storageQuotaGB * 1024)) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Shield size={12} /> Super Admin Control Hub
            </span>
            <span className="text-xs text-slate-400">• Multi-Tenant Platform Monitoring</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Global Studio Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time oversight of workspaces, tenant admins, YouTube channels, and infrastructure storage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateView('admin-directory')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Users size={16} />
            <span>Manage Admins ({allAdmins.length})</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateView('storage-resources')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <HardDrive size={16} />
            <span>Storage Usage</span>
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Admins */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Active Admins</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Shield size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{activeAdmins.length}</span>
            <span className="text-xs text-slate-500">of {allAdmins.length} provisioned</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Building size={12} className="text-amber-600" /> Across {allWorkspaces.length} tenant workspaces
          </p>
        </div>

        {/* Total Channels */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Channels</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <PlaySquare size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{allChannels.length}</span>
            <span className="text-xs text-indigo-600 font-semibold">
              {allChannels.filter((c) => !c.disabled).length} active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Activity size={12} className="text-indigo-600" /> {allTasks.length} total production topics
          </p>
        </div>

        {/* Total Team Users */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Team Users</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{teamUsers.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">{activeTeamUsers.length} active</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <UserCheck size={12} className="text-emerald-600" /> Operational studio staff
          </p>
        </div>

        {/* Global Storage Used */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Global Storage Used</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <HardDrive size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalStorageGB} GB</span>
            <span className="text-xs text-slate-500">/ {storageQuotaGB} GB</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                storagePercent > 85 ? 'bg-rose-500' : storagePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(5, storagePercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Workspaces & Tenants Quick Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Summary Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Building size={18} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Tenant Workspaces ({allWorkspaces.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigateView('admin-directory')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              Open Directory <ArrowRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {allWorkspaces.map((ws) => {
              const wsAdmin = allEmployees.find((e) => e.role === 'Admin' && e.workspaceId === ws.id);
              const wsChannels = allChannels.filter((c) => c.workspaceId === ws.id);
              const wsStaff = allEmployees.filter((e) => e.workspaceId === ws.id && e.role !== 'Admin');
              const isSuspended = wsAdmin && !wsAdmin.active;

              return (
                <div key={ws.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isSuspended ? 'bg-rose-100 text-rose-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      <Building size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{ws.name}</h3>
                        {isSuspended ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                            Workspace Suspended
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>Admin: <strong className="text-slate-800">{wsAdmin?.name || 'Unassigned'}</strong></span>
                        <span>•</span>
                        <span>Phone: <strong className="font-mono text-slate-700">{wsAdmin?.phone || ws.adminPhone || 'N/A'}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-900">{wsChannels.length} Channels</p>
                      <p className="text-[11px] text-slate-500">{wsStaff.length} Operational Staff</p>
                    </div>
                    <button
                      onClick={() => onNavigateView('admin-directory')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Storage Meter & Quick Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HardDrive size={18} className="text-rose-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Storage Allocation
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500">{storagePercent}% Capacity</span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-600">Total Consumed</span>
                  <span className="font-bold text-slate-900">{totalStorageGB} GB of {storageQuotaGB} GB</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${Math.max(4, storagePercent)}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    Shared Assets & LUTs
                  </span>
                  <strong className="text-slate-800">{(totalResourceMB / 1024).toFixed(2)} GB</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Footage & Video Masters
                  </span>
                  <strong className="text-slate-800">{(estimatedMediaMB / 1024).toFixed(2)} GB</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Remaining Free Quota
                  </span>
                  <strong className="text-slate-800">
                    {(storageQuotaGB - totalStorageMB / 1024).toFixed(1)} GB
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateView('storage-resources')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Full Storage Breakdown</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
