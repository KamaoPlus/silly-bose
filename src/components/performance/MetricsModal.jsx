import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useApp } from '../../context/AppContext';

export default function MetricsModal({ isOpen, onClose, task }) {
  const { actions } = useApp();
  const [form, setForm] = useState({
    views: '', ctr: '', watchTime: '',
    viewTarget: '', ctrTarget: '', watchTimeTarget: '',
  });

  useEffect(() => {
    if (task && isOpen) {
      setForm({
        views: task.metrics?.views ?? '',
        ctr: task.metrics?.ctr ?? '',
        watchTime: task.metrics?.watchTime ?? '',
        viewTarget: task.metrics?.viewTarget ?? task.defaultTargets?.views ?? '',
        ctrTarget: task.metrics?.ctrTarget ?? task.defaultTargets?.ctr ?? '',
        watchTimeTarget: task.metrics?.watchTimeTarget ?? task.defaultTargets?.watchTime ?? '',
      });
    }
  }, [task, isOpen]);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = () => {
    const metrics = {
      views: Number(form.views),
      ctr: Number(form.ctr),
      watchTime: Number(form.watchTime),
      viewTarget: Number(form.viewTarget),
      ctrTarget: Number(form.ctrTarget),
      watchTimeTarget: Number(form.watchTimeTarget),
    };
    actions.logMetrics(task.id, metrics);
    onClose();
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Metrics — ${task.title}`} size="md">
      <div className="space-y-5">
        <div className="p-3 rounded-lg bg-surface-700 border border-surface-500 text-xs text-gray-400">
          💡 Enter <strong className="text-gray-300">actual</strong> YouTube analytics data. Targets are pre-filled from the task defaults — you can adjust them here.
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-300 mb-3">Actual Performance</p>
          <div className="grid grid-cols-3 gap-3">
            <Input id="views" label="Views" type="number"
              value={form.views} onChange={e => set('views', e.target.value)} placeholder="62000" />
            <Input id="ctr" label="CTR %" type="number"
              value={form.ctr} onChange={e => set('ctr', e.target.value)} placeholder="7.2" />
            <Input id="watchTime" label="Avg Watch Time (s)" type="number"
              value={form.watchTime} onChange={e => set('watchTime', e.target.value)} placeholder="510" />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-300 mb-3">Targets (editable)</p>
          <div className="grid grid-cols-3 gap-3">
            <Input id="viewTarget" label="View Target" type="number"
              value={form.viewTarget} onChange={e => set('viewTarget', e.target.value)} placeholder="50000" />
            <Input id="ctrTarget" label="CTR Target %" type="number"
              value={form.ctrTarget} onChange={e => set('ctrTarget', e.target.value)} placeholder="6.5" />
            <Input id="watchTarget" label="Watch Target (s)" type="number"
              value={form.watchTimeTarget} onChange={e => set('watchTimeTarget', e.target.value)} placeholder="480" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-surface-600">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Metrics</Button>
        </div>
      </div>
    </Modal>
  );
}
