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
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input, { Select } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { useApp } from '../../context/AppContext';

export default function TeamManagement() {
  const { state, actions } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('');
  const [errors, setErrors] = useState({});

  const roleList = state.roles.map((r) => r.role);

  const handleOpenAdd = () => {
    setName('');
    setPhone('');
    setPassword('');
    setRole(roleList[0] || 'Strategist');
    setErrors({});
    setEditingEmployee(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setName(emp.name);
    setPhone(emp.phone);
    setPassword(emp.password || '••••••••');
    setRole(emp.role);
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

  const handleSaveEmployee = () => {
    if (!validate()) return;

    if (editingEmployee) {
      actions.updateEmployee({
        ...editingEmployee,
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim(),
        role,
      });
    } else {
      const newEmployee = {
        id: 'emp-' + Date.now().toString(36),
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim(),
        role,
        active: true,
        joinedDate: new Date().toISOString().split('T')[0],
      };
      actions.addEmployee(newEmployee);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Team Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage credentials, roles, and WhatsApp reminder dispatch numbers.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd} icon={UserPlus}>
          Add New Employee
        </Button>
      </div>

      {/* Employee Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Employee Directory ({state.employees.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {state.employees.filter((e) => e.active).length} Active Members
          </span>
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

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {employee.role}
                    </span>
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
            </tbody>
          </table>
        </div>
      </div>

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
            options={roleList.map((r) => ({ value: r, label: r }))}
            error={errors.role}
          />

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
    </div>
  );
}
