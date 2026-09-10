/**
 * WhatsApp Notification Automation Helper
 * Simulates Meta WhatsApp Business API payload creation and formatting for:
 * 1. Instant Sequential Handoff Triggers (immediate notification to the next role)
 * 2. Bulk Creation Alerts (notifying all pipeline assignees upon task creation)
 * 3. Daily Morning Digests
 */

export const PIPELINE_SEQUENCE = [
  'researcher',
  'anchor',
  'production',
  'editor',
  'thumbnail',
  'strategist',
];

export function getNextSequentialRole(currentRoleKey) {
  const normalized = currentRoleKey.toLowerCase();
  const idx = PIPELINE_SEQUENCE.indexOf(normalized);
  if (idx !== -1 && idx < PIPELINE_SEQUENCE.length - 1) {
    return PIPELINE_SEQUENCE[idx + 1];
  }
  return null;
}

export function buildWhatsAppDispatchPayload({
  task,
  channel,
  employee,
  stageName,
  triggerType = 'instant_handoff',
  completedBy = null,
  deliverableLink = null,
  totalAssigned = null,
}) {
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = task.targetDate || new Date().toISOString().split('T')[0];

  let messageText = '';
  let scheduledDispatch = '⚡ Instant Dispatch (Real-time Webhook)';
  let badgeText = '⚡ Instant Alert';

  if (triggerType === 'bulk_creation') {
    scheduledDispatch = '⚡ Instant Bulk Dispatch';
    badgeText = '⚡ Bulk Pipeline Alert';
    messageText =
      `🚀 *YT Ops Instant Video Creation Alert*\n\n` +
      `Hey ${employee ? employee.name : 'Team'} 👋\n` +
      `A new production task has been scheduled across all channels:\n\n` +
      `🎬 *Topic:* ${task.title}\n` +
      `📺 *Channel:* ${channel ? channel.name : 'Channel'}\n` +
      `📅 *Target Publish Date:* ${dateFormatted}\n` +
      `🎯 *Your Assigned Role:* ${stageName || 'Pipeline Role'}\n` +
      `👥 *Team Members Notified:* ${totalAssigned || 'All 6 Stage Assignees'}\n\n` +
      `_Check your workspace to inspect the briefing and schedule._`;
  } else if (triggerType === 'instant_handoff') {
    scheduledDispatch = '⚡ Instant Sequential Trigger';
    badgeText = '⚡ Sequential Handoff';
    messageText =
      `⚡ *YT Ops Instant Stage Handoff Alert*\n\n` +
      `Hey ${employee ? employee.name : 'Team Member'} 👋\n` +
      `The previous stage for your video has been marked *Completed* by ${completedBy || 'the team'}:\n\n` +
      `🎬 *Topic:* ${task.title}\n` +
      `📺 *Channel:* ${channel ? channel.name : 'Channel'}\n` +
      `🎯 *Your Stage Is Now Active:* ${stageName}\n` +
      (deliverableLink ? `🔗 *Delivered Asset Link:* ${deliverableLink}\n` : '') +
      `📅 *Due Date:* ${dateFormatted}\n\n` +
      `_Please proceed with your work and submit your deliverable once completed._`;
  } else if (triggerType === 'assignment') {
    scheduledDispatch = 'Daily at 09:00 AM IST';
    badgeText = '9:00 AM Queue';
    messageText =
      `🔔 *YT Ops Assignment Update*\n\n` +
      `Hey ${employee?.name} (${employee?.role}) 👋\n` +
      `You were assigned to the *${stageName}* stage for:\n` +
      `🎬 *${task.title}* on *${channel ? channel.name : 'Channel'}*\n` +
      `📅 *Due:* ${dateFormatted}\n\n` +
      `Please check the shared Drive link and guidelines.`;
  } else {
    messageText = `⚡ *YT Ops Status Notification*\n\nTask "${task.title}" updated for stage *${stageName}* by ${employee?.name || 'System'}.`;
  }

  return {
    id: 'wa-msg-' + Date.now().toString(36),
    recipientName: employee ? employee.name : 'Assigned Team Member',
    recipientPhone: employee ? employee.phone : '+91 98765 00000',
    recipientRole: employee ? employee.role : stageName,
    channelName: channel ? channel.name : 'YouTube Channel',
    topic: task.title,
    scheduledDispatch,
    badgeText,
    triggeredAt: timestamp,
    triggerType,
    rawPayload: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: employee ? employee.phone.replace(/[^0-9+]/g, '') : '+919876500000',
      type: 'template',
      template: {
        name: 'yt_instant_task_dispatch_v3',
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: employee ? employee.name : 'Team Member' },
              { type: 'text', text: task.title },
              { type: 'text', text: channel ? channel.name : 'Channel' },
              { type: 'text', text: dateFormatted },
            ],
          },
        ],
      },
      preview_text: messageText,
    },
    waUrl: buildWhatsAppClickToChatUrl({
      employee,
      task,
      channel,
      phaseName: stageName,
      deliverableLink,
      nextRoleName: stageName,
    }),
  };
}

/**
 * Click-to-Chat WhatsApp URL Generator
 * Generates dynamic https://wa.me/<PhoneNumber>?text=... link pre-populated with:
 * - Video Title
 * - Channel Name
 * - Completed / Handoff Phase
 * - Relevant Google Docs / Drive links
 * - Next Assigned Team Member's Role
 */
export function buildWhatsAppClickToChatUrl({
  employee,
  task,
  channel,
  phaseName,
  deliverableLink = null,
  nextRoleName = null,
}) {
  if (!employee && !task) return '#';

  // Normalize recipient phone number for wa.me (digits only)
  let rawPhone = employee?.phone || '';
  let digits = rawPhone.replace(/\D/g, '');

  // Default to India country code 91 if 10-digit number without country code
  if (digits.length === 10) {
    digits = '91' + digits;
  }

  const channelName = channel?.name || 'Studio Channel';
  const taskTitle = task?.title || 'Video Project';
  const targetDate = task?.targetDate || '';
  const nextRole = nextRoleName || employee?.role || 'Next Team Lead';

  let messageLines = [
    `*⚡ YouTube Production Update*`,
    ``,
    `*Topic:* ${taskTitle}`,
    `*Channel:* ${channelName}`,
    `*Completed Stage:* ${phaseName || 'Stage Completed'}`,
    `*Next Stage Role:* ${nextRole}`,
  ];

  if (deliverableLink) {
    messageLines.push(`*Deliverable Link:* ${deliverableLink}`);
  }
  if (targetDate) {
    messageLines.push(`*Target Date:* ${targetDate}`);
  }

  messageLines.push(``);
  messageLines.push(`_Please review in YT Production OS workspace to proceed with your deliverable._`);

  const encodedMessage = encodeURIComponent(messageLines.join('\n'));

  return digits ? `https://wa.me/${digits}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
}
