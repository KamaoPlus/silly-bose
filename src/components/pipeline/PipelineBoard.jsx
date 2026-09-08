import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useApp } from '../../context/AppContext';
import { PIPELINE_COLUMNS } from '../../data/initialData';
import PipelineColumn from './PipelineColumn';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import MetricsModal from '../performance/MetricsModal';

export default function PipelineBoard({ channelFilter }) {
  const { state, actions } = useApp();
  const [activeTask, setActiveTask] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [metricsTask, setMetricsTask] = useState(null);
  const [defaultColumnId, setDefaultColumnId] = useState('strategy');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Filter tasks by channel
  const filteredTasks = state.tasks.filter(t =>
    channelFilter === 'all' || t.channelId === channelFilter
  );

  const getColumnTasks = (colId) =>
    filteredTasks.filter(t => t.columnId === colId);

  const handleDragStart = ({ active }) => {
    setActiveTask(state.tasks.find(t => t.id === active.id) ?? null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Determine source and destination columns
    const sourceTask = state.tasks.find(t => t.id === activeId);
    if (!sourceTask) return;

    const sourceColId = sourceTask.columnId;

    // over could be a column id or another task id
    const destColId = PIPELINE_COLUMNS.find(c => c.id === overId)?.id
      ?? state.tasks.find(t => t.id === overId)?.columnId;

    if (!destColId) return;

    if (sourceColId !== destColId) {
      // Move to different column
      actions.moveTask(activeId, destColId);
    } else {
      // Reorder within same column
      const colTasks = getColumnTasks(sourceColId);
      const oldIdx = colTasks.findIndex(t => t.id === activeId);
      const newIdx = colTasks.findIndex(t => t.id === overId);
      if (oldIdx !== newIdx && newIdx !== -1) {
        const reordered = arrayMove(colTasks.map(t => t.id), oldIdx, newIdx);
        actions.reorderTasks(reordered, sourceColId);
      }
    }
  };

  const handleAddTask = (colId) => {
    setEditTask(null);
    setDefaultColumnId(colId);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditTask(task);
    setTaskModalOpen(true);
  };

  const handleLogMetrics = (task) => {
    setMetricsTask(task);
    setMetricsModalOpen(true);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Board */}
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
          {PIPELINE_COLUMNS.map(col => (
            <PipelineColumn
              key={col.id}
              column={col}
              tasks={getColumnTasks(col.id)}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onLogMetrics={handleLogMetrics}
            />
          ))}
        </div>

        {/* Drag Overlay — floating ghost card */}
        <DragOverlay>
          {activeTask && (
            <div className="rotate-2 scale-105">
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onLogMetrics={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        editTask={editTask}
        defaultColumnId={defaultColumnId}
      />

      <MetricsModal
        isOpen={metricsModalOpen}
        onClose={() => setMetricsModalOpen(false)}
        task={metricsTask}
      />
    </>
  );
}
