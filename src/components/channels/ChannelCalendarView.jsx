import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  Calendar as CalendarIcon,
  Film,
  ExternalLink,
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { StatusBadge } from '../ui/Badge';
import { useApp } from '../../context/AppContext';
import { buildWhatsAppDispatchPayload } from '../../utils/whatsapp';

export default function ChannelCalendarView({ channel, onBack }) {
  const { state, actions } = useApp();

  // Current month navigator state (default to today's year & month)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Quick schedule modal on cell click
  const [selectedDate, setSelectedDate] = useState(null);
  const [quickTopic, setQuickTopic] = useState('');
  const [quickDriveUrl, setQuickDriveUrl] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Get total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Tasks for this channel
  const channelTasks = state.tasks.filter((t) => t.channelId === channel.id);

  // Month navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleCellClick = (dayNumber) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    setSelectedDate(formattedDate);
    setQuickTopic('');
    setQuickDriveUrl('');
    setIsScheduleModalOpen(true);
  };

  const handleCreateScheduledTopic = () => {
    if (!quickTopic.trim()) return;

    // Pick first available strategist
    const defaultStrat = state.employees.find((e) => e.active && e.role.toLowerCase() === 'strategist') || state.employees[0];

    const newTask = {
      id: 'wf-' + Date.now().toString(36),
      channelId: channel.id,
      title: quickTopic.trim(),
      targetDate: selectedDate,
      driveUrl: quickDriveUrl.trim(),
      notes: 'Scheduled via Notion-style Monthly Calendar.',
      stages: {
        strategist:  { assigneeId: defaultStrat?.id || '', status: 'Pending' },
        researcher:  { assigneeId: '', status: 'Pending' },
        anchor:      { assigneeId: '', status: 'Pending' },
        production:  { assigneeId: '', status: 'Pending' },
        editor:      { assigneeId: '', status: 'Pending' },
        uploader:    { assigneeId: '', status: 'Pending' },
      },
    };

    const notificationPayload = buildWhatsAppDispatchPayload({
      task: newTask,
      channel,
      employee: defaultStrat,
      stageName: 'STRATEGIST',
      triggerType: 'creation',
    });

    actions.addTask(newTask, notificationPayload);
    setIsScheduleModalOpen(false);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Calendar Top Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onBack} icon={ArrowLeft}>
            Back to Channels
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: channel.color }}
              />
              <h2 className="text-lg font-extrabold text-slate-900">{channel.name} Calendar</h2>
            </div>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-[130px] text-center">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Notion-Style Calendar Grid (Day 1 to 28/30/31) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        {/* Calendar Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-2.5 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 border-b border-slate-200">
          {/* Offset for first day of week */}
          {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, idx) => (
            <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[110px] p-2" />
          ))}

          {/* Actual days in month */}
          {Array.from({ length: totalDays }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday =
              new Date().toISOString().split('T')[0] === dateString;

            // Find tasks scheduled on this day
            const tasksOnDate = channelTasks.filter((t) => t.targetDate === dateString);

            return (
              <div
                key={`day-${dayNum}`}
                onClick={() => handleCellClick(dayNum)}
                className={`min-h-[110px] p-2 flex flex-col justify-between group cursor-pointer transition-colors ${
                  isToday ? 'bg-indigo-50/30' : 'hover:bg-slate-50'
                }`}
              >
                {/* Date header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold w-6 h-6 rounded-full ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-700 group-hover:text-indigo-600'
                    }`}
                  >
                    {dayNum}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(dayNum);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 rounded transition-all"
                    title="Schedule Topic on this date"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Scheduled topics list inside cell */}
                <div className="space-y-1 my-1 overflow-y-auto max-h-[75px] no-scrollbar">
                  {tasksOnDate.map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] p-1.5 rounded-md bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all text-slate-800"
                    >
                      <div className="font-semibold truncate flex items-center gap-1">
                        <Film size={10} className="text-indigo-600 flex-shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </div>
                      {task.driveUrl && (
                        <a
                          href={task.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] text-indigo-600 hover:underline flex items-center gap-0.5 mt-0.5"
                        >
                          <ExternalLink size={9} /> Drive Link
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {/* Empty cue */}
                {tasksOnDate.length === 0 && (
                  <span className="text-[10px] text-slate-300 group-hover:text-slate-400 text-right pr-1">
                    + Topic
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Schedule Topic Modal for Clicked Date */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`Schedule Video on ${selectedDate}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            Scheduling on channel: <strong className="text-slate-900">{channel.name}</strong> on date <strong className="text-indigo-700">{selectedDate}</strong>.
          </div>

          <Input
            id="quick-topic-title"
            label="Video Title / Topic Idea"
            required
            value={quickTopic}
            onChange={(e) => setQuickTopic(e.target.value)}
            placeholder="e.g. Behind the Scenes: 48h Filmmaking Sprint"
          />

          <Input
            id="quick-drive-url"
            label="Drive Folder Link (Optional)"
            value={quickDriveUrl}
            onChange={(e) => setQuickDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateScheduledTopic} icon={Plus}>
              Save to Calendar & Alert WhatsApp
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
