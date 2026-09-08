/**
 * WhatsApp Task Notification & Reminder Automation
 *
 * Data model / schema for the daily morning WhatsApp digest.
 * In a real backend, this would be a scheduled job (cron) that:
 *   1. Collects all tasks NOT in "Published" status (pending carry-over)
 *   2. Collects tasks with targetDate === today (new tasks)
 *   3. Merges and deduplicates
 *   4. Dispatches via WhatsApp Business API
 */

export const NOTIFICATION_CONFIG = {
  dispatchTime: '08:00',
  timezone: 'Asia/Kolkata',
  repeatUntilCompleted: true, // tasks carry over every morning until Published
  channels: {
    whatsapp: {
      apiProvider: 'Meta WhatsApp Business API',
      apiVersion: 'v19.0',
      endpoint: 'https://graph.facebook.com/v19.0/{phone-number-id}/messages',
      messageType: 'template',
      templateName: 'yt_daily_digest',
      language: 'en_US',
    },
  },
};

/**
 * Generates a mock WhatsApp API payload for a given digest.
 * @param {object} digest - { carriedOver: Task[], newToday: Task[], recipients: object[] }
 * @param {object[]} channels - channel definitions
 * @returns {object} Mock API payload
 */
export function generateWhatsAppPayload(digest, channels, recipient) {
  const { carriedOver, newToday } = digest;
  const allTasks = [...carriedOver, ...newToday];
  const date = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const formatTask = (task, type) => {
    const channel = channels.find(c => c.id === task.channelId);
    return {
      type,
      id: task.id,
      title: task.title,
      channel: channel?.name ?? 'Unknown Channel',
      status: task.status,
      targetDate: task.targetDate,
      assignees: Object.entries(task.assignees)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(', '),
      driveUrl: task.driveUrl || 'N/A',
    };
  };

  const messageBody = [
    `📋 *YT Ops Daily Digest — ${date}*`,
    `Hey ${recipient.name} (${recipient.role}) 👋`,
    '',
    carriedOver.length > 0
      ? `🔄 *Carried Over (${carriedOver.length})*\n` +
        carriedOver.map(t => `  • [${t.status}] ${t.title}`).join('\n')
      : '✅ No carried-over tasks!',
    '',
    newToday.length > 0
      ? `🆕 *Due Today (${newToday.length})*\n` +
        newToday.map(t => `  • ${t.title}`).join('\n')
      : '📭 No new tasks due today.',
    '',
    `Total active tasks: *${allTasks.length}*`,
    '_Mark tasks complete in YT Ops to remove from tomorrow\'s digest._',
  ].join('\n');

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient.phone,
    type: 'text',
    text: {
      preview_url: false,
      body: messageBody,
    },
    _meta: {
      dispatchTime: NOTIFICATION_CONFIG.dispatchTime,
      timezone: NOTIFICATION_CONFIG.timezone,
      totalTasks: allTasks.length,
      carriedOverCount: carriedOver.length,
      newTodayCount: newToday.length,
      generatedAt: new Date().toISOString(),
    },
    _structuredTasks: [
      ...carriedOver.map(t => formatTask(t, 'carried_over')),
      ...newToday.map(t => formatTask(t, 'new_today')),
    ],
  };
}

/**
 * Default recipients — in a real app these come from a team database.
 */
export const DEFAULT_RECIPIENTS = [
  { id: 'r-1', name: 'Strategist', role: 'Strategist', phone: '+91-XXXX-XXXX-01' },
  { id: 'r-2', name: 'Researcher', role: 'Researcher', phone: '+91-XXXX-XXXX-02' },
  { id: 'r-3', name: 'Camera', role: 'Camera', phone: '+91-XXXX-XXXX-03' },
  { id: 'r-4', name: 'Editor 1', role: 'Editor 1', phone: '+91-XXXX-XXXX-04' },
  { id: 'r-5', name: 'Editor 2', role: 'Editor 2', phone: '+91-XXXX-XXXX-05' },
  { id: 'r-6', name: 'Editor 3', role: 'Editor 3', phone: '+91-XXXX-XXXX-06' },
];
