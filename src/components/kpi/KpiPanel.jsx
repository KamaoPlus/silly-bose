import React, { useState } from 'react';
import {
  Plus,
  BookOpen,
  Target,
  Zap,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useApp } from '../../context/AppContext';
import RoleDetailModal from './RoleDetailModal';

const ROLE_COLOR_PRESETS = [
  '#4f46e5', // Indigo
  '#0284c7', // Sky
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#059669', // Emerald
  '#e11d48', // Rose
  '#d97706', // Amber
  '#0d9488', // Teal
];

export default function KpiSopModule() {
  const { state, actions, currentUser } = useApp();

  const [selectedDetailRole, setSelectedDetailRole] = useState(null);

  // Add Role modal state
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [roleTitle, setRoleTitle] = useState('');
  const [roleEmoji, setRoleEmoji] = useState('🎯');
  const [roleColor, setRoleColor] = useState(ROLE_COLOR_PRESETS[0]);
  const [roleDesc, setRoleDesc] = useState('');
  const [weeklyTargets, setWeeklyTargets] = useState('');

  const [kpisList, setKpisList] = useState([
    { label: 'Weekly Deliverables', target: '3+', unit: 'items' },
  ]);
  const [sopsList, setSopsList] = useState([
    'Review pipeline tasks and verify requirements before starting.',
  ]);

  const [errors, setErrors] = useState({});

  const userRole = currentUser?.role?.toLowerCase() || 'admin';
  const isAdmin = userRole === 'admin';

  // Admin views all roles; all other team members ONLY view their own specific role
  const visibleRoles = isAdmin
    ? state.roles
    : state.roles.filter((r) => {
        const rName = r.role?.toLowerCase() || '';
        const rId = r.id?.toLowerCase() || '';
        return (
          rName === userRole ||
          rId === userRole ||
          rName.includes(userRole) ||
          userRole.includes(rName) ||
          (userRole === 'thumbnail' && (rId === 'thumbnail' || rName.includes('thumbnail')))
        );
      });

  const handleOpenAddRole = () => {
    setRoleTitle('');
    setRoleEmoji('🎯');
    setRoleColor(ROLE_COLOR_PRESETS[0]);
    setRoleDesc('');
    setWeeklyTargets('');
    setKpisList([{ label: 'Weekly Output Target', target: '3+', unit: '' }]);
    setSopsList(['Follow standardized quality check guidelines before task submission.']);
    setErrors({});
    setIsAddRoleModalOpen(true);
  };

  const handleAddKpiRow = () => {
    setKpisList([...kpisList, { label: '', target: '', unit: '' }]);
  };

  const handleKpiChange = (idx, field, value) => {
    const updated = [...kpisList];
    updated[idx][field] = value;
    setKpisList(updated);
  };

  const handleRemoveKpiRow = (idx) => {
    setKpisList(kpisList.filter((_, i) => i !== idx));
  };

  const handleAddSopRow = () => {
    setSopsList([...sopsList, '']);
  };

  const handleSopChange = (idx, value) => {
    const updated = [...sopsList];
    updated[idx] = value;
    setSopsList(updated);
  };

  const handleRemoveSopRow = (idx) => {
    setSopsList(sopsList.filter((_, i) => i !== idx));
  };

  const handleSaveRole = () => {
    if (!roleTitle.trim()) {
      setErrors({ title: 'Role title is required.' });
      return;
    }

    const newRole = {
      id: 'role-' + Date.now().toString(36),
      role: roleTitle.trim(),
      emoji: roleEmoji.trim() || '🎯',
      color: roleColor,
      description: roleDesc.trim() || 'Custom production workflow role.',
      kpis: kpisList.filter((k) => k.label.trim()),
      sops: sopsList.filter((s) => s.trim()),
      weeklyTargets: weeklyTargets.trim() || 'Meet all scheduled delivery SLAs.',
    };

    actions.addRole(newRole);
    setIsAddRoleModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Role KPIs & Standard Operating Procedures (SOPs)
          </h1>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={handleOpenAddRole} icon={Plus}>
            + Add Role
          </Button>
        )}
      </div>

      {/* Role Cards Grid (Filtered to current role for non-admins) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleRoles.map((role) => (
          <div
            key={role.id}
            onClick={() => setSelectedDetailRole(role)}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card hover:border-indigo-300 hover:shadow-dropdown transition-all flex flex-col justify-between cursor-pointer group"
            style={{ borderTop: `4px solid ${role.color}` }}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs"
                    style={{ backgroundColor: `${role.color}15` }}
                  >
                    {role.emoji}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {role.role}
                    </h3>
                  </div>
                </div>
              </div>

              {/* KPIs Section */}
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  <Target size={14} style={{ color: role.color }} />
                  <span>Key Performance Indicators</span>
                </div>
                <div className="space-y-2">
                  {role.kpis?.map((kpi, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0"
                    >
                      <span className="text-slate-600 font-medium">{kpi.label}</span>
                      <span
                        className="font-bold px-2 py-0.5 rounded text-[11px]"
                        style={{ backgroundColor: `${role.color}15`, color: role.color }}
                      >
                        {kpi.target} {kpi.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SOPs Section */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <BookOpen size={14} style={{ color: role.color }} />
                  <span>SOP Checklist ({role.sops?.length || 0} Steps)</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {role.sops?.slice(0, 3).map((sop, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2
                        size={13}
                        className="flex-shrink-0 mt-0.5"
                        style={{ color: role.color }}
                      />
                      <span className="line-clamp-1">{sop}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* View Full Checklist Prompt */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
              <span className="flex items-center gap-1">
                Open Detailed Checklist & Guidelines
              </span>
              <ArrowRight size={13} />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Role Modal */}
      <RoleDetailModal
        isOpen={!!selectedDetailRole}
        onClose={() => setSelectedDetailRole(null)}
        role={selectedDetailRole}
      />

      {/* Add Role Modal */}
      <Modal isOpen={isAddRoleModalOpen} onClose={() => setIsAddRoleModalOpen(false)} title="Add New Role & SOP Guidelines" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Input
                id="new-role-title"
                label="Role Title"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Thumbnail Designer / Creative Director"
                error={errors.title}
              />
            </div>
            <div>
              <Input
                id="new-role-emoji"
                label="Role Emoji"
                value={roleEmoji}
                onChange={(e) => setRoleEmoji(e.target.value)}
                placeholder="🎨"
              />
            </div>
          </div>

          <Input
            id="new-role-desc"
            label="Role Responsibility Summary"
            value={roleDesc}
            onChange={(e) => setRoleDesc(e.target.value)}
            placeholder="Main responsibilities, impact on channel growth..."
          />

          {/* Role Color Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase block mb-2">
              Role Accent Color
            </label>
            <div className="flex items-center gap-3">
              {ROLE_COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setRoleColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    roleColor === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Dynamic KPIs Builder */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Measurable KPIs
              </span>
              <button
                type="button"
                onClick={handleAddKpiRow}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus size={13} /> Add KPI
              </button>
            </div>

            {kpisList.map((kpi, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Metric Label (e.g. Turnaround Time)"
                  value={kpi.label}
                  onChange={(e) => handleKpiChange(idx, 'label', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Target (e.g. ≤ 24h)"
                  value={kpi.target}
                  onChange={(e) => handleKpiChange(idx, 'target', e.target.value)}
                  className="w-28 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={kpi.unit}
                  onChange={(e) => handleKpiChange(idx, 'unit', e.target.value)}
                  className="w-20 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                {kpisList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveKpiRow(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Dynamic SOPs Builder */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Standard Operating Procedures (SOP Checklist)
              </span>
              <button
                type="button"
                onClick={handleAddSopRow}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus size={13} /> Add SOP
              </button>
            </div>

            {sopsList.map((sop, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Step ${idx + 1}: e.g. Pre-render check on audio levels...`}
                  value={sop}
                  onChange={(e) => handleSopChange(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                {sopsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSopRow(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Input
            id="new-role-weekly"
            label="Weekly Performance Target"
            value={weeklyTargets}
            onChange={(e) => setWeeklyTargets(e.target.value)}
            placeholder="e.g. 5 Thumbnails completed with A/B variations"
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setIsAddRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRole} icon={Sparkles}>
              Create Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
