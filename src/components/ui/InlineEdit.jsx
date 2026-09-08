import React, { useState } from 'react';
import {
  Check,
  X,
  Edit2,
  Calendar,
  ExternalLink,
  Trash2,
  Save,
} from 'lucide-react';

/**
 * Inline editable text component
 */
export function InlineEditText({
  value,
  onSave,
  className = '',
  textClassName = '',
  inputClassName = '',
  placeholder = 'Click to edit...',
  isBold = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleStart = () => {
    setTempValue(value);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (tempValue.trim() !== '') {
      onSave(tempValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <input
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className={`px-2 py-0.5 text-xs bg-white border border-indigo-500 rounded focus:outline-none shadow-xs ${inputClassName}`}
        />
        <button
          onClick={handleSave}
          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
          title="Save"
        >
          <Check size={13} />
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
          title="Cancel"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <span
      onClick={handleStart}
      className={`cursor-pointer hover:bg-indigo-50/70 px-1.5 py-0.5 -mx-1.5 rounded transition-colors group/inline inline-flex items-center gap-1 ${textClassName} ${
        isBold ? 'font-bold text-slate-900' : 'text-slate-800'
      }`}
      title="Click to edit inline"
    >
      <span>{value || placeholder}</span>
      <Edit2
        size={11}
        className="opacity-0 group-hover/inline:opacity-100 text-slate-400 transition-opacity flex-shrink-0"
      />
    </span>
  );
}

/**
 * Inline editable date component
 */
export function InlineEditDate({ value, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const handleSave = (newVal) => {
    onSave(newVal);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-1">
        <input
          type="date"
          value={tempDate}
          onChange={(e) => setTempDate(e.target.value)}
          onBlur={() => handleSave(tempDate)}
          autoFocus
          className="px-1.5 py-0.5 text-[11px] bg-white border border-indigo-500 rounded focus:outline-none"
        />
      </div>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-indigo-50/70 px-1 py-0.5 rounded transition-colors group/date inline-flex items-center gap-1 text-xs font-medium text-slate-700"
      title="Click to change date"
    >
      <Calendar size={12} className="text-slate-400" />
      <span>{value}</span>
      <Edit2 size={10} className="opacity-0 group-hover/date:opacity-100 text-slate-400" />
    </span>
  );
}
