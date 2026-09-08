import React, { useEffect } from 'react';
import { MessageSquare, X, Clock, CheckCircle2, PhoneCall } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function WhatsAppNotificationBanner() {
  const { state, actions } = useApp();
  const notification = state.lastNotification;

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        actions.dismissNotification();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [notification, actions]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-slide-in">
      <div className="bg-white border-2 border-emerald-500/80 rounded-xl shadow-2xl p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white flex-shrink-0">
              <MessageSquare size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900">WhatsApp Notification Triggered</p>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {notification.badgeText || '⚡ Instant Alert'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock size={11} /> {notification.triggeredAt} • {notification.scheduledDispatch}
              </p>
            </div>
          </div>
          <button
            onClick={actions.dismissNotification}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Message details */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 space-y-1">
          <div className="flex justify-between items-center text-[11px] text-slate-500 pb-1 border-b border-slate-200">
            <span>To: <strong className="text-slate-800">{notification.recipientName}</strong> ({notification.recipientRole})</span>
            <span className="font-mono text-emerald-700 font-medium">{notification.recipientPhone}</span>
          </div>
          <p className="font-medium text-slate-900 pt-0.5 line-clamp-1">
            🎬 {notification.topic}
          </p>
          <p className="text-[11px] text-slate-500 line-clamp-1">
            Channel: <span className="text-slate-700 font-medium">{notification.channelName}</span>
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-emerald-700 font-medium">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Queued for automatic morning dispatch
          </span>
          <span className="text-slate-400">Meta WhatsApp API v19</span>
        </div>
      </div>
    </div>
  );
}
