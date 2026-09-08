import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useApp } from '../../context/AppContext';
import { Target, BookOpen, Zap, Plus, Trash2, CheckCircle2, Edit3, Save } from 'lucide-react';

export default function RoleDetailModal({ isOpen, onClose, role }) {
  const { actions, currentUser } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [weeklyTargets, setWeeklyTargets] = useState('');
  const [kpis, setKpis] = useState([]);
  const [sops, setSops] = useState([]);

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  React.useEffect(() => {
    if (role && isOpen) {
      setDescription(role.description || '');
      setWeeklyTargets(role.weeklyTargets || '');
      setKpis(role.kpis || []);
      setSops(role.sops || []);
      setIsEditing(false);
    }
  }, [role, isOpen]);

  if (!role) return null;

  // KPI management
  const handleAddKpi = () => {
    setKpis([...kpis, { label: '', target: '', unit: '' }]);
  };

  const handleKpiChange = (idx, field, value) => {
    const next = [...kpis];
    next[idx][field] = value;
    setKpis(next);
  };

  const handleRemoveKpi = (idx) => {
    setKpis(kpis.filter((_, i) => i !== idx));
  };

  // SOP management
  const handleAddSop = () => {
    setSops([...sops, '']);
  };

  const handleSopChange = (idx, value) => {
    const next = [...sops];
    next[idx] = value;
    setSops(next);
  };

  const handleRemoveSop = (idx) => {
    setSops(sops.filter((_, i) => i !== idx));
  };

  const handleSaveAll = () => {
    const updatedRole = {
      ...role,
      description: description.trim(),
      weeklyTargets: weeklyTargets.trim(),
      kpis: kpis.filter((k) => k.label.trim()),
      sops: sops.filter((s) => s.trim()),
    };
    actions.updateRole(updatedRole);
    setIsEditing(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${role.emoji} ${role.role} — Operational Guidelines & SOP Details`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Top summary & Edit trigger */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: role.color }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mission Statement & Role Scope
              </span>
            </div>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full mt-2 p-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {role.description}
              </p>
            )}
          </div>

          {isAdmin && (
            <Button
              variant={isEditing ? 'success' : 'secondary'}
              size="xs"
              onClick={() => (isEditing ? handleSaveAll() : setIsEditing(true))}
              icon={isEditing ? Save : Edit3}
            >
              {isEditing ? 'Save Changes' : 'Edit Guidelines'}
            </Button>
          )}
        </div>

        {/* Measurable KPIs Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={16} style={{ color: role.color }} />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Measurable Key Performance Indicators (KPIs)
              </h3>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={handleAddKpi}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus size={13} /> Add KPI
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between gap-2"
              >
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={kpi.label}
                      onChange={(e) => handleKpiChange(idx, 'label', e.target.value)}
                      placeholder="Metric label"
                      className="flex-1 text-xs border border-slate-300 rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={kpi.target}
                      onChange={(e) => handleKpiChange(idx, 'target', e.target.value)}
                      placeholder="Target"
                      className="w-16 text-xs border border-slate-300 rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={kpi.unit}
                      onChange={(e) => handleKpiChange(idx, 'unit', e.target.value)}
                      placeholder="Unit"
                      className="w-14 text-xs border border-slate-300 rounded px-2 py-1"
                    />
                    <button
                      onClick={() => handleRemoveKpi(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-xs font-medium text-slate-600">{kpi.label}</span>
                    <span
                      className="font-bold px-2.5 py-1 rounded-lg text-xs"
                      style={{ backgroundColor: `${role.color}15`, color: role.color }}
                    >
                      {kpi.target} {kpi.unit}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step-by-Step SOP Checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} style={{ color: role.color }} />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Step-by-Step Standard Operating Procedure (SOP Checklist)
              </h3>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={handleAddSop}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus size={13} /> Add Step
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {sops.map((sop, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-xs"
              >
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={sop}
                      onChange={(e) => handleSopChange(idx, e.target.value)}
                      className="flex-1 text-xs border border-slate-300 rounded px-2 py-1"
                    />
                    <button
                      onClick={() => handleRemoveSop(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-700 leading-relaxed">
                    {sop}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Target Benchmark */}
        <div
          className="p-4 rounded-xl border flex items-center justify-between gap-4"
          style={{
            backgroundColor: `${role.color}08`,
            borderColor: `${role.color}30`,
          }}
        >
          <div className="flex items-center gap-2">
            <Zap size={18} style={{ color: role.color }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Weekly Minimum Output Target
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={weeklyTargets}
                  onChange={(e) => setWeeklyTargets(e.target.value)}
                  className="mt-1 text-xs bg-white border border-slate-300 rounded px-2 py-1 w-80"
                />
              ) : (
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  {role.weeklyTargets}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {isEditing && (
            <Button variant="primary" onClick={handleSaveAll} icon={Save}>
              Save All Changes
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
