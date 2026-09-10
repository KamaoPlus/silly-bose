import React, { useState } from 'react';
import {
  HardDrive,
  Folder,
  FileText,
  Video,
  Music,
  Image,
  Layers,
  Building,
  Shield,
  Download,
  ExternalLink,
  Search,
  Filter,
  BarChart3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { parseSizeToMB } from './SuperAdminDashboard';

export default function StorageMonitoring() {
  const { state, rawState } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkspaceFilter, setSelectedWorkspaceFilter] = useState('all');

  const allWorkspaces = rawState.workspaces || [];
  const allEmployees = rawState.employees || [];
  const allChannels = rawState.channels || [];
  const allTasks = rawState.tasks || [];
  const allResources = rawState.resources || [];

  // Calculate global resource file size
  let globalResourceMB = 0;
  allResources.forEach((folder) => {
    (folder.items || []).forEach((item) => {
      globalResourceMB += parseSizeToMB(item.size);
    });
  });

  // Calculate media drives size
  let globalMediaMB = 0;
  allTasks.forEach((task) => {
    if (task.rawFootageUrl) globalMediaMB += 2400;
    if (task.finalVideoUrl) globalMediaMB += 850;
    if (task.thumbnailAssetUrl) globalMediaMB += 45;
  });

  const totalGlobalMB = globalResourceMB + globalMediaMB;
  const storageLimitGB = 100;
  const storagePercent = Math.min(100, Math.round((totalGlobalMB / (storageLimitGB * 1024)) * 100));

  // Compute breakdown per workspace
  const workspaceBreakdown = allWorkspaces.map((ws) => {
    const admin = allEmployees.find((e) => e.role === 'Admin' && e.workspaceId === ws.id);
    const channels = allChannels.filter((c) => c.workspaceId === ws.id);
    const channelIds = channels.map((c) => c.id);
    const tasks = allTasks.filter((t) => channelIds.includes(t.channelId) || t.workspaceId === ws.id);

    // Workspace media calculation
    let wsMediaMB = 0;
    let rawCount = 0;
    let masterCount = 0;
    let psdCount = 0;

    tasks.forEach((t) => {
      if (t.rawFootageUrl) {
        wsMediaMB += 2400;
        rawCount++;
      }
      if (t.finalVideoUrl) {
        wsMediaMB += 850;
        masterCount++;
      }
      if (t.thumbnailAssetUrl) {
        wsMediaMB += 45;
        psdCount++;
      }
    });

    // Pro-rate shared resources or direct workspace resources
    const wsResourceMB = (globalResourceMB / Math.max(1, allWorkspaces.length));
    const totalWsMB = wsMediaMB + wsResourceMB;

    return {
      workspace: ws,
      admin,
      channelsCount: channels.length,
      tasksCount: tasks.length,
      rawCount,
      masterCount,
      psdCount,
      mediaMB: wsMediaMB,
      totalMB: totalWsMB,
      totalGB: (totalWsMB / 1024).toFixed(2),
    };
  });

  const filteredWorkspaces = workspaceBreakdown.filter((item) => {
    if (selectedWorkspaceFilter !== 'all' && item.workspace.id !== selectedWorkspaceFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.workspace.name.toLowerCase().includes(q) ||
      (item.admin && item.admin.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">
              Infrastructure Monitoring
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Storage & Useful Resources Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track multi-tenant cloud storage distribution across raw footage, 4K masters, PSD assets, and shared studio LUTs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Platform Consumption</p>
            <p className="text-base font-extrabold text-slate-900">
              {(totalGlobalMB / 1024).toFixed(2)} GB <span className="text-xs font-semibold text-slate-400">/ {storageLimitGB} GB</span>
            </p>
          </div>
        </div>
      </div>

      {/* Global Quota Overview Card */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Global Platform Cloud Drive
            </span>
            <h2 className="text-xl font-extrabold mt-0.5">Overall Allocation & Footprint</h2>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-amber-400">{storagePercent}%</span>
            <p className="text-xs text-slate-400">Total Quota Occupied</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                storagePercent > 80 ? 'bg-rose-500' : storagePercent > 50 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.max(3, storagePercent)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                <Video size={13} className="text-indigo-400" /> Raw Footages
              </span>
              <p className="text-lg font-extrabold text-white mt-1">
                {((allTasks.filter((t) => t.rawFootageUrl).length * 2400) / 1024).toFixed(1)} GB
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {allTasks.filter((t) => t.rawFootageUrl).length} Shoot drives linked
              </p>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                <Layers size={13} className="text-emerald-400" /> Master 4K Videos
              </span>
              <p className="text-lg font-extrabold text-white mt-1">
                {((allTasks.filter((t) => t.finalVideoUrl).length * 850) / 1024).toFixed(1)} GB
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {allTasks.filter((t) => t.finalVideoUrl).length} Final video deliverables
              </p>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                <Image size={13} className="text-rose-400" /> Thumbnail PSDs
              </span>
              <p className="text-lg font-extrabold text-white mt-1">
                {((allTasks.filter((t) => t.thumbnailAssetUrl).length * 45) / 1024).toFixed(1)} GB
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {allTasks.filter((t) => t.thumbnailAssetUrl).length} Layered PSD archives
              </p>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                <Folder size={13} className="text-amber-400" /> Shared Studio Assets
              </span>
              <p className="text-lg font-extrabold text-white mt-1">
                {(globalResourceMB / 1024).toFixed(1)} GB
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {allResources.reduce((acc, f) => acc + (f.items?.length || 0), 0)} Studio repository files
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Breakdown per Workspace/Admin Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Storage Breakdown per Workspace & Admin
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by workspace or admin..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
              />
            </div>

            <select
              value={selectedWorkspaceFilter}
              onChange={(e) => setSelectedWorkspaceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="all">All Workspaces ({allWorkspaces.length})</option>
              {allWorkspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Workspace / Tenant</th>
                <th className="px-6 py-4">Responsible Admin</th>
                <th className="px-6 py-4">Managed Channels</th>
                <th className="px-6 py-4">Production Assets</th>
                <th className="px-6 py-4">Estimated Consumption</th>
                <th className="px-6 py-4 text-right">Quota Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkspaces.map((item) => {
                const wsSharePercent = Math.round((item.totalMB / (storageLimitGB * 1024)) * 100);

                return (
                  <tr key={item.workspace.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Workspace */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold">
                          <Building size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.workspace.name}</p>
                          <p className="text-slate-400 font-mono text-[11px]">ID: {item.workspace.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Admin */}
                    <td className="px-6 py-4">
                      {item.admin ? (
                        <div>
                          <p className="font-bold text-slate-800">{item.admin.name}</p>
                          <p className="text-slate-500 font-mono text-xs">{item.admin.phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Channels */}
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      <span>{item.channelsCount} YouTube Channels</span>
                    </td>

                    {/* Production Assets Breakdown */}
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-semibold">
                          {item.rawCount} Shoots
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-semibold">
                          {item.masterCount} Videos
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-semibold">
                          {item.psdCount} PSDs
                        </span>
                      </div>
                    </td>

                    {/* Estimated Storage */}
                    <td className="px-6 py-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold text-slate-900">{item.totalGB} GB</span>
                        <span className="text-[11px] text-slate-400">({Math.round(item.totalMB)} MB)</span>
                      </div>
                    </td>

                    {/* Progress Bar */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex flex-col items-end gap-1">
                        <span className="font-bold text-slate-800 text-xs">{wsSharePercent}% of platform</span>
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.max(5, wsSharePercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shared Studio Repository Explorer (Global View for Super Admin) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Folder size={18} className="text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Studio Shared Resource Folders ({allResources.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Available across all workspaces and production teams
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allResources.map((folder) => {
            let folderMB = 0;
            (folder.items || []).forEach((item) => {
              folderMB += parseSizeToMB(item.size);
            });

            return (
              <div
                key={folder.id}
                className="border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-all bg-white shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: folder.color || '#4f46e5' }}
                    >
                      <Folder size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{folder.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{folder.items?.length || 0} Assets</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {folderMB.toFixed(1)} MB
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                  {folder.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  {(folder.items || []).slice(0, 2).map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-xs text-slate-700">
                      <span className="truncate max-w-[170px]">• {it.title}</span>
                      <span className="font-mono text-[10px] text-slate-400">{it.format} ({it.size})</span>
                    </div>
                  ))}
                  {(folder.items?.length || 0) > 2 && (
                    <p className="text-[11px] text-slate-400 font-medium">
                      + {(folder.items.length - 2)} more assets...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
