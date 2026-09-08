import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import TaskCard from './TaskCard';

export default function PipelineColumn({ column, tasks, onAddTask, onEditTask, onLogMetrics }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const IconComponent = LucideIcons[column.icon] ?? LucideIcons.Circle;

  return (
    <div className="flex flex-col min-w-[272px] max-w-[272px]">
      {/* Column Header */}
      <div
        className="flex items-center justify-between mb-3 px-1"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: column.color + '22' }}
          >
            <IconComponent size={14} style={{ color: column.color }} />
          </div>
          <span className="text-sm font-semibold text-gray-200">{column.label}</span>
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: column.color + '22', color: column.color }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-surface-600 transition-colors"
          title={`Add task to ${column.label}`}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 rounded-xl p-2 min-h-[120px] transition-all duration-150
          ${isOver
            ? 'bg-accent/10 border-2 border-accent/40 border-dashed'
            : 'bg-surface-800/60 border border-surface-600/60'}
        `}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onLogMetrics={onLogMetrics}
              />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-8 gap-2 cursor-pointer group"
            onClick={() => onAddTask(column.id)}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed group-hover:border-accent transition-colors"
              style={{ borderColor: column.color + '44' }}
            >
              <Plus size={14} style={{ color: column.color }} className="opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Add task</span>
          </div>
        )}
      </div>
    </div>
  );
}
