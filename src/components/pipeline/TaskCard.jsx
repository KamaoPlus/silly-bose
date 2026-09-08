import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, ExternalLink, MoreVertical, Pencil, Trash2, BarChart2 } from 'lucide-react';
import { ChannelTag, StatusBadge } from '../ui/Badge';
import { AvatarGroup } from '../ui/Avatar';
import { formatDate, isOverdue, isDueToday } from '../../utils/dateHelpers';
import { useApp } from '../../context/AppContext';

export default function TaskCard({ task, onEdit, onLogMetrics }) {
  const { state, actions } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const channel = state.channels.find(c => c.id === task.channelId);

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const overdue = isOverdue(task.targetDate) && task.columnId !== 'published';
  const dueToday = isDueToday(task.targetDate) && !overdue;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-surface-700 border rounded-xl p-3.5 cursor-grab active:cursor-grabbing
        group relative select-none
        ${isDragging ? 'shadow-2xl border-accent/60 ring-1 ring-accent/40' : 'border-surface-500 hover:border-surface-400'}
        transition-colors duration-150
      `}
      {...attributes}
      {...listeners}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <ChannelTag channel={channel} size="xs" />
        <div className="relative flex-shrink-0">
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
            className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-surface-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-6 z-50 bg-surface-600 border border-surface-400 rounded-lg shadow-xl py-1 w-36 animate-slide-in"
              onPointerDown={e => e.stopPropagation()}
            >
              <button
                onClick={() => { setMenuOpen(false); onEdit(task); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-200 hover:bg-surface-500 transition-colors"
              >
                <Pencil size={13} /> Edit Task
              </button>
              {task.columnId === 'published' && (
                <button
                  onClick={() => { setMenuOpen(false); onLogMetrics(task); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-200 hover:bg-surface-500 transition-colors"
                >
                  <BarChart2 size={13} /> Log Metrics
                </button>
              )}
              <hr className="border-surface-400 my-1" />
              <button
                onClick={() => { setMenuOpen(false); actions.deleteTask(task.id); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-400 hover:bg-surface-500 transition-colors"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-100 leading-snug mb-3 line-clamp-2">
        {task.title}
      </p>

      {/* Assignees */}
      <div className="mb-3">
        <AvatarGroup assignees={task.assignees} size="sm" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className={overdue ? 'text-red-400' : dueToday ? 'text-yellow-400' : 'text-gray-500'} />
          <span className={`text-[11px] font-medium ${overdue ? 'text-red-400' : dueToday ? 'text-yellow-400' : 'text-gray-400'}`}>
            {overdue ? '⚠ ' : ''}{formatDate(task.targetDate)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={task.status} />
          {task.driveUrl && (
            <a
              href={task.driveUrl}
              target="_blank"
              rel="noreferrer"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
              className="text-gray-500 hover:text-accent transition-colors"
              title="Open Drive Folder"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Metrics indicator */}
      {task.metrics && (
        <div className="mt-2 pt-2 border-t border-surface-500">
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <BarChart2 size={10} className="text-green-400" />
            <span className="text-green-400">Metrics logged</span>
          </div>
        </div>
      )}
    </div>
  );
}
