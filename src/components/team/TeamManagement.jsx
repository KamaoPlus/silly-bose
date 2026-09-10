import React, { useState } from 'react';
import {
  UserPlus,
  Users,
  Shield,
  Phone,
  Key,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  MessageSquare,
  Building,
  Plus,
  Globe,
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input, { Select } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

export default function TeamManagement() {
  const { state, rawState, actions, currentUser, isSuperAdmin, activeWorkspaceId, setActiveWorkspaceId } = useApp();

  const [activeTab, setActiveTab] = useState('employees'); // 'employees' | 'workspaces'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('');
  const [targetWorkspaceId, setTargetWorkspaceId] = useState('ws-main');
  const [errors, setErrors] = useState({});

  // Workspace creation modal states (Super Admin only)
  const [isWsModalOpen, setIsWsModalOpen] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [wsAdminName, setWsAdminName] = useState('');
  const [wsAdminPhone, setWsAdminPhone] = useState('');
  const [wsAdminPassword, setWsAdminPassword] = useState('');
  const [wsErrors, setWsErrors] = useState({});

  // Operational roles list
  const operationalRoles = ['Strategist', 'Researcher', 'Anchor', 'Production', 'Editor', 'Thumbnail'];

  // Role options: Admin can only choose operational roles. Super Admin can also create 'Admin'.
  const allowedRoles = isSuperAdmin
    ? ['Admin', ...operationalRoles]
    : operationalRoles;

  const handleOpenAdd = () => {
    setName('');
    setPhone('');
    setPassword('');
    setRole(allowedRoles[0] || 'Strategist');
    setTargetWorkspaceId(
      isSuperAdmin
        ? (state.workspaces?.[0]?.id || 'ws-main')
        : (currentUser?.workspaceId || 'ws-main')
    );
    setErrors({});
    setEditingEmployee(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setName(emp.name);
    setPhone(emp.phone);
    setPassword(emp.password || '••••••••');
    setRole(emp.role);
    setTargetWorkspaceId(emp.workspaceId || 'ws-main');
    setErrors({});
    setEditingEmployee(emp);
    setIsAddModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full Name is required.';
    if (!phone.trim()) errs.phone = 'Phone Number is required for WhatsApp alerts.';
    if (!password.trim()) errs.password = 'Password is required.';
    if (!role) errs.role = 'Role selection is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveEmployee = async () => {
    if (!validate()) return;

    const assignedWsId = isSuperAdmin
      ? targetWorkspaceId
      : (currentUser?.workspaceId || 'ws-main');

    if (editingEmployee) {
      const updated = {
        ...editingEmployee,
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim(),
        role,
        workspaceId: editingEmployee.role === 'Super Admin' ? 'global' : assignedWsId,
      };

      const userPayload = {
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        password: updated.password,
        role: updated.role,
        workspace_id: updated.workspaceId === 'global' ? null : updated.workspaceId,
        active: updated.active ?? true,
        joined_date: updated.joinedDate || new Date().toISOString().split('T')[0],
      };
      console.log('[Direct Supabase] Updating user:', userPayload);
      const { error: userError } = await supabase.from('users').upsert(userPayload, { onConflict: 'id' });
      if (userError) {
        console.error('[Direct Supabase] User update error:', userError);
        alert(`Failed to sync User update to Supabase: ${userError.message}`);
      }

      await actions.updateEmployee(updated);
    } else {
      const newEmployee = {
        id: 'emp-' + Date.now().toString(36),
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim(),
        role,
        workspaceId: role === 'Super Admin' ? 'global' : assignedWsId,
        active: true,
        joinedDate: new Date().toISOString().split('T')[0],
      };

      const userPayload = {
        id: newEmployee.id,
        name: newEmployee.name,
        phone: newEmployee.phone,
        password: newEmployee.password,
        role: newEmployee.role,
        workspace_id: newEmployee.workspaceId === 'global' ? null : newEmployee.workspaceId,
        active: true,
        joined_date: newEmployee.joinedDate,
      };
      console.log('[Direct Supabase] Inserting user:', userPayload);
      const { error: userError } = await supabase.from('users').upsert(userPayload, { onConflict: 'id' });
      if (userError) {
        console.error('[Direct Supabase] User insert error:', userError);
        alert(`Failed to sync User to Supabase: ${userError.message}`);
      } else {
        console.log('[Direct Supabase] User synced successfully!');
      }

      await actions.addEmployee(newEmployee);
    }

    setIsAddModalOpen(false);
  };

  const handleCreateWorkspace = async () => {
    const errs = {};
    if (!wsName.trim()) errs.name = 'Workspace name is required.';
    if (wsAdminPhone.trim() && !wsAdminPassword.trim()) {
      errs.adminPassword = 'Password is required when creating an Admin.';
    }
    if (Object.keys(errs).length > 0) {
      setWsErrors(errs);
      return;
    }

    const newWsId = 'ws-' + Date.now().toString(36);
    const newWs = {
      id: newWsId,
      name: wsName.trim(),
      description: wsDesc.trim(),
      adminPhone: wsAdminPhone.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    console.log('[Direct Supabase] Inserting workspace:', newWs);
    const wsPayload = {
      id: newWs.id,
      name: newWs.name,
      description: newWs.description,
      admin_phone: newWs.adminPhone,
    };
    const { error: wsError } = await supabase.from('workspaces').upsert(wsPayload, { onConflict: 'id' });
    if (wsError) {
      console.error('[Direct Supabase] Workspace insert error:', wsError);
      alert(`Failed to sync Workspace to Supabase: ${wsError.message}`);
    } else {
      console.log('[Direct Supabase] Workspace synced successfully!');
    }

    await actions.addWorkspace(newWs);

    // If admin phone is specified, provision the Admin account immediately
    if (wsAdminPhone.trim()) {
      const newAdminEmp = {
        id: 'emp-admin-' + Date.now().toString(36),
        name: wsAdminName.trim() || `${wsName.trim()} Admin`,
        phone: wsAdminPhone.trim(),
        password: wsAdminPassword.trim() || 'admin',
        role: 'Admin',
        workspaceId: newWsId,
        active: true,
        joinedDate: new Date().toISOString().split('T')[0],
      };

      const userPayload = {
        id: newAdminEmp.id,
        name: newAdminEmp.name,
        phone: newAdminEmp.phone,
        password: newAdminEmp.password,
        role: newAdminEmp.role,
        workspace_id: newAdminEmp.workspaceId,
        active: true,
        joined_date: newAdminEmp.joinedDate,
      };
      console.log('[Direct Supabase] Inserting workspace admin:', userPayload);
      const { error: userError } = await supabase.from('users').upsert(userPayload, { onConflict: 'id' });
      if (userError) {
        console.error('[Direct Supabase] Admin insert error:', userError);
        alert(`Failed to sync Workspace Admin to Supabase: ${userError.message}`);
      } else {
        console.log('[Direct Supabase] Workspace Admin synced successfully!');
      }

      await actions.addEmployee(newAdminEmp);

      try {
        const existingUsersRaw = window.localStorage.getItem('yt-ops-all-users-v1');
        const existingUsers = existingUsersRaw ? JSON.parse(existingUsersRaw) : (rawState.employees || []);
        const updatedUsers = [...existingUsers.filter(e => e.id !== newAdminEmp.id), newAdminEmp];
        window.localStorage.setItem('yt-ops-all-users-v1', JSON.stringify(updatedUsers));
      } catch (err) {
        console.warn('Failed to direct write to yt-ops-all-users-v1', err);
      }
    }

    setIsWsModalOpen(false);
    setWsName('');
    setWsDesc('');
    setWsAdminName('');
    setWsAdminPhone('');
    setWsAdminPassword('');
    setWsErrors({});
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Super Admin Workspace Management */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isSuperAdmin && activeTab === 'workspaces' ? 'Workspaces & Tenants' : 'Team Directory'}
            </h1>
            {isSuperAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Super Admin Master Control
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isSuperAdmin && activeTab === 'workspaces'
              ? 'Provision and isolate multi-tenant production workspaces with assigned Admin managers.'
              : 'Manage credentials, roles, and WhatsApp reminder dispatch numbers.'}
          </p>

          {/* Super Admin Tab Switcher */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setActiveTab('employees')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'employees'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Users size={14} />
                <span>Team Members ({state.employees.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('workspaces')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'workspaces'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building size={14} />
                <span>Workspaces ({state.workspaces?.length || 1})</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && activeTab === 'workspaces' ? (
            <Button
              variant="primary"
              onClick={() => {
                setWsName('');
                setWsDesc('');
                setWsAdminPhone('');
                setWsErrors({});
                setIsWsModalOpen(true);
              }}
              icon={Plus}
            >
              Create New Workspace
            </Button>
          ) : (
            <Button variant="primary" onClick={handleOpenAdd} icon={UserPlus}>
              Add New Employee
            </Button>
          )}
        </div>
      </div>

      {/* SUPER ADMIN WORKSPACES TAB */}
      {isSuperAdmin && activeTab === 'workspaces' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Building size={18} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Isolated Studio Workspaces ({state.workspaces?.length || 1})
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Active Workspace Filter: <strong className="text-indigo-600 uppercase">{activeWorkspaceId}</strong>
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(state.workspaces || []).map((ws) => {
              const wsEmployees = (rawState.employees || []).filter((e) => e.workspaceId === ws.id);
              const wsChannels = (rawState.channels || []).filter((c) => c.workspaceId === ws.id);
              const wsTasks = (rawState.tasks || []).filter((t) => t.workspaceId === ws.id);
              const isSelected = activeWorkspaceId === ws.id;

              return (
                <div
                  key={ws.id}
                  className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base">{ws.name}</h3>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                              Active View
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {ws.id}</p>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Building size={16} />
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {ws.description || 'Dedicated isolated production studio workspace.'}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Channels</p>
                        <p className="text-sm font-extrabold text-slate-800">{wsChannels.length}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Tasks</p>
                        <p className="text-sm font-extrabold text-slate-800">{wsTasks.length}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Staff</p>
                        <p className="text-sm font-extrabold text-slate-800">{wsEmployees.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveWorkspaceId(ws.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      {isSelected ? '✓ Currently Filtered' : 'Switch & Scope Data'}
                    </button>

                    {ws.id !== 'ws-main' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete workspace "${ws.name}"? This removes its channels, tasks, and employees.`)) {
                            actions.deleteWorkspace(ws.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Workspace"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Employee Directory Table */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Employee Directory ({state.employees.length})
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {isSuperAdmin && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Globe size={13} className="text-slate-400" />
                  <span>Workspace Filter:</span>
                  <select
                    value={activeWorkspaceId}
                    onChange={(e) => setActiveWorkspaceId(e.target.value)}
                    className="px-2 py-1 rounded bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="all">All Workspaces (Global View)</option>
                    {(state.workspaces || []).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <span className="text-xs text-slate-500">
                {state.employees.filter((e) => e.active).length} Active Members
              </span>
            </div>
          </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">WhatsApp Phone</th>
                <th className="px-6 py-3.5">Auth Password</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Joined</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Name & Avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={employee.name} role={employee.role} size="md" />
                      <div>
                        <p className="font-bold text-slate-900">{employee.name}</p>
                        <p className="text-xs text-slate-400 font-mono">ID: {employee.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role & Workspace */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        employee.role === 'Super Admin'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : employee.role === 'Admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {employee.role}
                      </span>
                      {employee.workspaceId && (
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Building size={10} className="text-slate-400" />
                          {state.workspaces?.find((w) => w.id === employee.workspaceId)?.name || employee.workspaceId}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4 text-slate-700 font-mono text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      <span>{employee.phone}</span>
                    </div>
                  </td>

                  {/* Password */}
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    <div className="flex items-center gap-1">
                      <Key size={12} className="text-slate-400" />
                      <span>{employee.password || '••••••••'}</span>
                    </div>
                  </td>

                  {/* Active/Inactive Toggle */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => actions.toggleEmployeeStatus(employee.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        employee.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                      }`}
                      title="Click to toggle status"
                    >
                      {employee.active ? (
                        <>
                          <CheckCircle size={12} className="text-emerald-600" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle size={12} className="text-slate-400" /> Inactive
                        </>
                      )}
                    </button>
                  </td>

                  {/* Joined Date */}
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {employee.joinedDate || '2025-01-01'}
                  </td>

                  {/* Edit & Delete actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(employee)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Employee"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete employee record for ${employee.name}?`)) {
                            actions.deleteEmployee(employee.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Employee"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {state.employees.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No team members provisioned in this workspace yet. Click "Add New Employee" to invite operational roles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingEmployee ? `Edit Employee — ${editingEmployee.name}` : 'Add New Employee'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            id="emp-name"
            label="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rohan Verma"
            error={errors.name}
          />

          <Input
            id="emp-phone"
            label="Phone Number (WhatsApp Verified)"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            helperText="Used for automatic morning 9:00 AM task dispatches."
            error={errors.phone}
          />

          {/* Password with Show/Hide toggle */}
          <div>
            <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase block mb-1.5">
              Portal Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3 py-2 pr-10 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          <Select
            id="emp-role"
            label="Assigned Role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={allowedRoles.map((r) => ({ value: r, label: r }))}
            error={errors.role}
          />

          {isSuperAdmin && (
            <Select
              id="emp-workspace"
              label="Assigned Workspace"
              required
              value={targetWorkspaceId}
              onChange={(e) => setTargetWorkspaceId(e.target.value)}
              options={(state.workspaces || []).map((w) => ({ value: w.id, label: w.name }))}
            />
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEmployee} icon={Shield}>
              {editingEmployee ? 'Save Changes' : 'Add Employee'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Super Admin: Create Workspace Modal */}
      {isSuperAdmin && (
        <Modal
          isOpen={isWsModalOpen}
          onClose={() => setIsWsModalOpen(false)}
          title="Provision New Isolated Studio Workspace"
          size="md"
        >
          <div className="space-y-4">
            <Input
              id="ws-name"
              label="Workspace Name"
              required
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              placeholder="e.g. Hindi Gaming Studio"
              error={wsErrors.name}
            />

            <Input
              id="ws-desc"
              label="Description / Purpose"
              value={wsDesc}
              onChange={(e) => setWsDesc(e.target.value)}
              placeholder="e.g. Dedicated production line for gaming channels"
            />

            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Allocate Workspace Admin (Optional)
              </p>
              <div className="space-y-3">
                <Input
                  id="ws-admin-name"
                  label="Admin Full Name"
                  value={wsAdminName}
                  onChange={(e) => setWsAdminName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                />

                <Input
                  id="ws-admin-phone"
                  label="Admin Phone Number (Login & WhatsApp)"
                  value={wsAdminPhone}
                  onChange={(e) => setWsAdminPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />

                <Input
                  id="ws-admin-pass"
                  label="Admin Password"
                  type="password"
                  value={wsAdminPassword}
                  onChange={(e) => setWsAdminPassword(e.target.value)}
                  placeholder="Create secure password..."
                  error={wsErrors.adminPassword}
                  helperText="Admin starts with a completely clean zero-state workspace (0 channels, 0 staff, 0 tasks)."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setIsWsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateWorkspace} icon={Building}>
                Provision Workspace
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
