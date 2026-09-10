import React, { useState } from 'react';
import {
  Users,
  Building,
  PlaySquare,
  Shield,
  ChevronRight,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Eye,
  Phone,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Search,
  ExternalLink,
  Video,
  UserX,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input, { Select } from '../ui/Input';
import { Avatar } from '../ui/Avatar';

export default function AdminDirectoryDrillDown() {
  const { state, rawState, actions } = useApp();

  // Drill-down levels: 'admins' | 'channels' | 'team'
  const [currentLevel, setCurrentLevel] = useState('admins');
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Admin Modal states
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [workspaceMode, setWorkspaceMode] = useState('new'); // 'new' | 'existing'
  const [selectedExistingWsId, setSelectedExistingWsId] = useState('');
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Add Channel Modal state (within Admin drilldown)
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelHandle, setChannelHandle] = useState('');
  const [channelColor, setChannelColor] = useState('#4f46e5');
  const [channelError, setChannelError] = useState('');

  // All records platform-wide from rawState
  const allEmployees = rawState.employees || [];
  const allWorkspaces = rawState.workspaces || [];
  const allChannels = rawState.channels || [];
  const allTasks = rawState.tasks || [];

  // Admins list
  const adminList = allEmployees.filter((e) => e.role === 'Admin');

  // Currently selected entities
  const selectedAdmin = adminList.find((a) => a.id === selectedAdminId);
  const selectedWorkspace = allWorkspaces.find((w) => w.id === selectedAdmin?.workspaceId);

  // Channels under selected admin's workspace
  const channelsUnderAdmin = allChannels.filter(
    (c) => c.workspaceId === selectedAdmin?.workspaceId
  );

  const selectedChannel = allChannels.find((c) => c.id === selectedChannelId);

  // Operational team members under this channel / workspace
  const teamMembersUnderChannel = allEmployees.filter((e) => {
    if (e.role === 'Super Admin' || e.role === 'Admin') return false;
    // Team member belongs to workspace
    if (e.workspaceId !== selectedAdmin?.workspaceId) return false;
    return true;
  });

  // Level 1: Add New Admin submit
  const handleCreateAdmin = (e) => {
    e?.preventDefault();
    const errs = {};
    if (!adminName.trim()) errs.name = 'Admin name is required.';
    if (!adminPhone.trim()) errs.phone = 'Phone number is required.';
    if (!adminPassword.trim()) errs.password = 'Password is required.';

    if (workspaceMode === 'new' && !newWsName.trim()) {
      errs.wsName = 'Workspace studio name is required.';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    let assignedWsId = selectedExistingWsId;
    if (workspaceMode === 'new') {
      assignedWsId = 'ws-' + Date.now().toString(36);
      const newWs = {
        id: assignedWsId,
        name: newWsName.trim(),
        description: newWsDesc.trim() || 'Dedicated tenant studio workspace',
        adminPhone: adminPhone.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      actions.addWorkspace(newWs);
    }

    const newAdmin = {
      id: 'emp-admin-' + Date.now().toString(36),
      name: adminName.trim(),
      phone: adminPhone.trim(),
      password: adminPassword.trim(),
      role: 'Admin',
      workspaceId: assignedWsId,
      active: true,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    actions.addEmployee(newAdmin);

    setIsAddAdminOpen(false);
    setAdminName('');
    setAdminPhone('');
    setAdminPassword('');
    setNewWsName('');
    setNewWsDesc('');
    setFormErrors({});
  };

  // Level 2: Add Channel under selected admin
  const handleCreateChannelForAdmin = (e) => {
    e?.preventDefault();
    if (!channelName.trim()) {
      setChannelError('Channel name is required.');
      return;
    }

    const trimmedName = channelName.trim();
    const isDuplicate = allChannels.some(
      (c) => c.workspaceId === selectedAdmin?.workspaceId && c.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setChannelError(`Channel "${trimmedName}" already exists in this workspace.`);
      return;
    }

    const handleFormatted = channelHandle.trim()
      ? channelHandle.startsWith('@') ? channelHandle.trim() : `@${channelHandle.trim()}`
      : `@${trimmedName.toLowerCase().replace(/\s+/g, '')}`;

    const newChannel = {
      id: 'ch-' + Date.now().toString(36),
      workspaceId: selectedAdmin?.workspaceId,
      name: trimmedName,
      handle: handleFormatted,
      color: channelColor,
      disabled: false,
    };

    actions.addChannel(newChannel);
    setIsAddChannelOpen(false);
    setChannelName('');
    setChannelHandle('');
    setChannelError('');
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Breadcrumb Component
  // ──────────────────────────────────────────────────────────────────────────
  const renderBreadcrumb = () => (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-xs">
      <button
        onClick={() => {
          setCurrentLevel('admins');
          setSelectedAdminId(null);
          setSelectedChannelId(null);
        }}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
          currentLevel === 'admins'
            ? 'bg-amber-100 text-amber-900 font-bold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Shield size={14} className="text-amber-600" />
        <span>Admin Directory</span>
      </button>

      {selectedAdmin && (
        <>
          <ChevronRight size={14} className="text-slate-400" />
          <button
            onClick={() => {
              setCurrentLevel('channels');
              setSelectedChannelId(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              currentLevel === 'channels'
                ? 'bg-indigo-100 text-indigo-900 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building size={14} className="text-indigo-600" />
            <span>Admin: {selectedAdmin.name} ({selectedWorkspace?.name || selectedAdmin.workspaceId})</span>
          </button>
        </>
      )}

      {selectedChannel && (
        <>
          <ChevronRight size={14} className="text-slate-400" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold">
            <PlaySquare size={14} className="text-emerald-600" />
            <span>Channel: {selectedChannel.name} (Assigned Team)</span>
          </div>
        </>
      )}
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // LEVEL 1: ADMIN DIRECTORY
  // ──────────────────────────────────────────────────────────────────────────
  const renderAdminLevel = () => {
    const filteredAdmins = adminList.filter((a) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const ws = allWorkspaces.find((w) => w.id === a.workspaceId);
      return (
        a.name.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        (ws && ws.name.toLowerCase().includes(q))
      );
    });

    return (
      <div className="space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-card">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Admins by name, phone, or workspace..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium hidden md:inline">
              Total Admins: <strong className="text-slate-900">{adminList.length}</strong>
            </span>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedExistingWsId(allWorkspaces[0]?.id || 'ws-main');
                setIsAddAdminOpen(true);
              }}
              icon={Plus}
            >
              + Add New Admin
            </Button>
          </div>
        </div>

        {/* Admins Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Admin Profile</th>
                  <th className="px-6 py-4">Allocated Workspace</th>
                  <th className="px-6 py-4">Channels</th>
                  <th className="px-6 py-4">Operational Staff</th>
                  <th className="px-6 py-4">Access Status</th>
                  <th className="px-6 py-4">Auth Password</th>
                  <th className="px-6 py-4 text-right">Drill-Down & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmins.map((admin) => {
                  const ws = allWorkspaces.find((w) => w.id === admin.workspaceId);
                  const channels = allChannels.filter((c) => c.workspaceId === admin.workspaceId);
                  const staff = allEmployees.filter((e) => e.workspaceId === admin.workspaceId && e.role !== 'Admin');
                  const isBlocked = !admin.active;

                  return (
                    <tr
                      key={admin.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isBlocked ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Name & Phone */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={admin.name} role="Admin" size="md" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-sm">{admin.name}</p>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Admin
                              </span>
                            </div>
                            <p className="text-slate-500 font-mono text-xs flex items-center gap-1 mt-0.5">
                              <Phone size={11} className="text-slate-400" />
                              {admin.phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Workspace */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <Building size={13} className="text-indigo-600" />
                            {ws?.name || admin.workspaceId}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {admin.workspaceId}</p>
                        </div>
                      </td>

                      {/* Channels count */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedAdminId(admin.id);
                            setCurrentLevel('channels');
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-colors cursor-pointer"
                        >
                          <PlaySquare size={13} />
                          <span>{channels.length} Channels</span>
                        </button>
                      </td>

                      {/* Staff count */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                          <Users size={13} className="text-slate-500" />
                          <span>{staff.length} Members</span>
                        </span>
                      </td>

                      {/* Access Status / Block */}
                      <td className="px-6 py-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            <Lock size={12} /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Active Access
                          </span>
                        )}
                      </td>

                      {/* Auth Password */}
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        <div className="flex items-center gap-1">
                          <Key size={12} className="text-slate-400" />
                          <span>{admin.password || 'admin'}</span>
                        </div>
                      </td>

                      {/* Drill-down and Revoke Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Drill-Down to Channels Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAdminId(admin.id);
                              setCurrentLevel('channels');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                            title="Drill into Admin Channels"
                          >
                            <span>Inspect Channels</span>
                            <ChevronRight size={13} />
                          </button>

                          {/* Block/Deactivate Admin (Instantly revokes workspace access) */}
                          <button
                            type="button"
                            onClick={() => {
                              const confirmMsg = isBlocked
                                ? `Unblock and restore workspace access for Admin "${admin.name}"?`
                                : `Block and instantly suspend workspace access for Admin "${admin.name}"?`;
                              if (window.confirm(confirmMsg)) {
                                actions.toggleEmployeeStatus(admin.id);
                              }
                            }}
                            className={`p-2 rounded-lg font-bold transition-colors cursor-pointer ${
                              isBlocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            }`}
                            title={isBlocked ? 'Unblock Admin' : 'Block / Deactivate Admin'}
                          >
                            {isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                          </button>

                          {/* Delete Admin */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Permanently delete Admin "${admin.name}"? This cannot be undone.`)) {
                                actions.deleteEmployee(admin.id);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Admin"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────────────────────
  // LEVEL 2: CHANNEL DRILL-DOWN
  // ──────────────────────────────────────────────────────────────────────────
  const renderChannelsLevel = () => {
    return (
      <div className="space-y-4">
        {/* Admin Header Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                setCurrentLevel('admins');
                setSelectedAdminId(null);
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Back to All Admins"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Channels managed by {selectedAdmin?.name}
                </h2>
                {!selectedAdmin?.active && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    Admin Suspended
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Workspace: <strong className="text-slate-800">{selectedWorkspace?.name}</strong> • Phone: <span className="font-mono text-slate-700">{selectedAdmin?.phone}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => {
                setChannelName('');
                setChannelHandle('');
                setChannelError('');
                setIsAddChannelOpen(true);
              }}
              icon={Plus}
            >
              + Add Channel
            </Button>
          </div>
        </div>

        {/* Channel Cards Grid */}
        {channelsUnderAdmin.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
            <PlaySquare size={36} className="mx-auto text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-700 text-sm">No Channels in this Workspace</h3>
            <p className="text-xs text-slate-400 mt-1">This Admin has not provisioned any YouTube channels yet.</p>
            <button
              onClick={() => setIsAddChannelOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all cursor-pointer"
            >
              + Create First Channel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelsUnderAdmin.map((channel) => {
              const channelTasks = allTasks.filter((t) => t.channelId === channel.id);
              const isDisabled = Boolean(channel.disabled);

              return (
                <div
                  key={channel.id}
                  className={`bg-white border rounded-2xl p-5 shadow-card transition-all flex flex-col justify-between ${
                    isDisabled ? 'border-rose-200 bg-rose-50/10 opacity-80' : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: channel.color || '#4f46e5' }}
                        >
                          <PlaySquare size={22} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm truncate">{channel.name}</h3>
                          <p className="text-xs text-slate-500 font-mono truncate">{channel.handle}</p>
                        </div>
                      </div>

                      {isDisabled && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex-shrink-0">
                          Disabled
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <p className="text-xs font-bold text-slate-400 uppercase">Topics</p>
                        <p className="text-sm font-extrabold text-slate-800">{channelTasks.length}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <p className="text-xs font-bold text-slate-400 uppercase">Assigned Team</p>
                        <p className="text-sm font-extrabold text-indigo-600">{teamMembersUnderChannel.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* View Channel Team Members Drill-down */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChannelId(channel.id);
                        setCurrentLevel('team');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Users size={13} />
                      <span>Assigned Team</span>
                      <ChevronRight size={13} />
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Disable / Enable Channel */}
                      <button
                        type="button"
                        onClick={() => {
                          const confirmMsg = isDisabled
                            ? `Enable channel "${channel.name}"?`
                            : `Disable channel "${channel.name}"? Team members will see it paused.`;
                          if (window.confirm(confirmMsg)) {
                            actions.toggleChannelStatus(channel.id);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isDisabled
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                        title={isDisabled ? 'Enable Channel' : 'Disable Channel'}
                      >
                        {isDisabled ? 'Enable' : 'Disable'}
                      </button>

                      {/* Remove Channel */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Permanently remove channel "${channel.name}" and associated video tasks?`)) {
                            actions.deleteChannel(channel.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Channel"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────────────────────
  // LEVEL 3: TEAM MEMBERS DRILL-DOWN
  // ──────────────────────────────────────────────────────────────────────────
  const renderTeamLevel = () => {
    return (
      <div className="space-y-4">
        {/* Channel Header Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                setCurrentLevel('channels');
                setSelectedChannelId(null);
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Back to Channels"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedChannel?.color || '#4f46e5' }}
                />
                <h2 className="text-lg font-extrabold text-slate-900">
                  {selectedChannel?.name} — Operational Team Directory
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin: <strong className="text-slate-800">{selectedAdmin?.name}</strong> • Channel Handle: <span className="font-mono text-slate-700">{selectedChannel?.handle}</span>
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            {teamMembersUnderChannel.length} Operational Staff
          </div>
        </div>

        {/* Team Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
          {teamMembersUnderChannel.length === 0 ? (
            <div className="p-10 text-center">
              <Users size={36} className="mx-auto text-slate-300 mb-2" />
              <h3 className="font-bold text-slate-700 text-sm">No Operational Staff Assigned Yet</h3>
              <p className="text-xs text-slate-400 mt-1">
                The Admin ({selectedAdmin?.name}) has not onboarded researchers, editors, or production staff to this workspace yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Team Member</th>
                    <th className="px-6 py-3.5">Assigned Role</th>
                    <th className="px-6 py-3.5">WhatsApp Contact</th>
                    <th className="px-6 py-3.5">Credentials</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Individual Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembersUnderChannel.map((member) => {
                    const isRevoked = !member.active;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Member Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={member.name} role={member.role} size="md" />
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{member.name}</p>
                              <p className="text-slate-400 font-mono text-[11px]">ID: {member.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {member.role}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4 font-mono text-slate-700 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-400" />
                            <span>{member.phone}</span>
                          </div>
                        </td>

                        {/* Password */}
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                          <div className="flex items-center gap-1">
                            <Key size={12} className="text-slate-400" />
                            <span>{member.password || 'password123'}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {isRevoked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              Access Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          )}
                        </td>

                        {/* Individual Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Revoke Access Button without affecting Admin */}
                            <button
                              type="button"
                              onClick={() => {
                                const confirmMsg = isRevoked
                                  ? `Restore access for user "${member.name}"?`
                                  : `Revoke system access for user "${member.name}"? (Admin access remains intact)`;
                                if (window.confirm(confirmMsg)) {
                                  actions.toggleEmployeeStatus(member.id);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                isRevoked
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              }`}
                              title={isRevoked ? 'Restore Access' : 'Revoke Access'}
                            >
                              {isRevoked ? 'Restore Access' : 'Revoke Access'}
                            </button>

                            {/* Remove User */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Permanently remove member "${member.name}" from workspace?`)) {
                                  actions.deleteEmployee(member.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove User"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Hierarchical Tenant Control</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
              Super Admin Master
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Drill-down access governance: Inspect from high-level Admin managers down to individual operational channel staff.
          </p>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {renderBreadcrumb()}

      {/* View Content depending on current level */}
      {currentLevel === 'admins' && renderAdminLevel()}
      {currentLevel === 'channels' && renderChannelsLevel()}
      {currentLevel === 'team' && renderTeamLevel()}

      {/* ── MODAL: Add New Admin ── */}
      <Modal
        isOpen={isAddAdminOpen}
        onClose={() => setIsAddAdminOpen(false)}
        title="Provision New Studio Admin"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <Input
            label="Admin Full Name"
            placeholder="e.g. Vikramaditya Singhania"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            error={formErrors.name}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="WhatsApp Phone"
              placeholder="e.g. 9876543210"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              error={formErrors.phone}
              required
            />
            <Input
              label="Login Password"
              placeholder="e.g. adminPass123"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              error={formErrors.password}
              required
            />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Workspace Allocation
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setWorkspaceMode('new')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                  workspaceMode === 'new'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                + Create New Workspace
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode('existing')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                  workspaceMode === 'existing'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Assign to Existing
              </button>
            </div>

            {workspaceMode === 'new' ? (
              <div className="space-y-3">
                <Input
                  label="New Workspace Name"
                  placeholder="e.g. BlueWave Media Studio"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  error={formErrors.wsName}
                  required
                />
                <Input
                  label="Workspace Description (Optional)"
                  placeholder="e.g. Secondary YouTube documentary team"
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <Select
                  label="Select Existing Workspace"
                  value={selectedExistingWsId}
                  onChange={(e) => setSelectedExistingWsId(e.target.value)}
                  options={allWorkspaces.map((w) => ({ value: w.id, label: w.name }))}
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsAddAdminOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Provision Admin Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Add Channel for Admin ── */}
      <Modal
        isOpen={isAddChannelOpen}
        onClose={() => setIsAddChannelOpen(false)}
        title={`Add YouTube Channel for ${selectedAdmin?.name || 'Admin'}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateChannelForAdmin} className="space-y-4">
          <Input
            label="Channel Name"
            placeholder="e.g. AI Blueprint Daily"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            error={channelError}
            required
          />

          <Input
            label="Channel Handle (@handle)"
            placeholder="e.g. @aiblueprint"
            value={channelHandle}
            onChange={(e) => setChannelHandle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Theme Brand Accent
            </label>
            <div className="flex items-center gap-2">
              {['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setChannelColor(col)}
                  className={`w-7 h-7 rounded-lg transition-transform cursor-pointer ${
                    channelColor === col ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsAddChannelOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Channel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
