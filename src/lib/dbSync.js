import { supabase } from './supabase';

/**
 * Cloud database service with seamless fallback to offline / local storage.
 * Handles workspaces, users, channels, tasks.
 */

// Helper to normalize phone strings for database matching
export const normalizePhone = (p = '') => {
  if (!p) return '';
  const digitsOnly = String(p).replace(/\D/g, '');
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly.slice(2);
  }
  return digitsOnly;
};

// ── WORKSPACES ─────────────────────────────────────────────────────────────
export async function fetchRemoteWorkspaces() {
  try {
    console.log('[Supabase] Fetching workspaces from Supabase...');
    const { data, error } = await supabase.from('workspaces').select('*');
    if (error) {
      console.error('[Supabase] fetchWorkspaces error:', error);
      return null;
    }
    console.log('[Supabase] Fetched workspaces successfully. Count:', data?.length || 0, data);
    return (data || []).map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description || '',
      adminPhone: w.admin_phone || '',
      createdAt: w.created_at ? new Date(w.created_at).toISOString().split('T')[0] : '',
    }));
  } catch (err) {
    console.error('[Supabase] fetchWorkspaces exception:', err);
    return null;
  }
}

export async function syncWorkspaceToRemote(workspace) {
  try {
    const payload = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description || '',
      admin_phone: workspace.adminPhone || '',
    };
    console.log('[Supabase] Inserting/Upserting workspace:', payload);
    const { data, error } = await supabase.from('workspaces').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.error('[Supabase] Workspace insert/upsert error:', error);
      alert(`Supabase Workspace Error: ${error.message} (${error.code || ''})`);
      return { success: false, error };
    }
    console.log('[Supabase] Workspace saved successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.error('[Supabase] syncWorkspace exception:', err);
    alert(`Supabase Workspace Exception: ${err.message}`);
    return { success: false, error: err };
  }
}

export async function deleteWorkspaceFromRemote(workspaceId) {
  try {
    console.log('[Supabase] Deleting workspace:', workspaceId);
    const { error } = await supabase.from('workspaces').delete().eq('id', workspaceId);
    if (error) {
      console.error('[Supabase] deleteWorkspace error:', error);
    }
  } catch (err) {
    console.error('[Supabase] deleteWorkspace error:', err);
  }
}

// ── USERS ──────────────────────────────────────────────────────────────────
export async function fetchRemoteUsers() {
  try {
    console.log('[Supabase] Fetching users from Supabase...');
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('[Supabase] fetchUsers error:', error);
      return null;
    }
    console.log('[Supabase] Fetched users successfully. Count:', data?.length || 0, data);
    return (data || []).map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      password: u.password,
      role: u.role,
      workspaceId: u.workspace_id,
      active: u.active ?? true,
      joinedDate: u.joined_date || '',
    }));
  } catch (err) {
    console.error('[Supabase] fetchUsers exception:', err);
    return null;
  }
}

export async function syncUserToRemote(user) {
  try {
    const payload = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      password: user.password,
      role: user.role,
      workspace_id: user.workspaceId === 'global' ? null : user.workspaceId,
      active: user.active ?? true,
      joined_date: user.joinedDate || new Date().toISOString().split('T')[0],
    };
    console.log('[Supabase] Inserting/Upserting user:', payload);
    const { data, error } = await supabase.from('users').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.error('[Supabase] User insert/upsert error:', error);
      alert(`Supabase User Error: ${error.message} (${error.code || ''})`);
      return { success: false, error };
    }
    console.log('[Supabase] User saved successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.error('[Supabase] syncUser exception:', err);
    alert(`Supabase User Exception: ${err.message}`);
    return { success: false, error: err };
  }
}

export async function deleteUserFromRemote(userId) {
  try {
    console.log('[Supabase] Deleting user:', userId);
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
      console.error('[Supabase] deleteUser error:', error);
    }
  } catch (err) {
    console.error('[Supabase] deleteUser error:', err);
  }
}

// ── CHANNELS ───────────────────────────────────────────────────────────────
export async function fetchRemoteChannels() {
  try {
    console.log('[Supabase] Fetching channels from Supabase...');
    const { data, error } = await supabase.from('channels').select('*');
    if (error) {
      console.error('[Supabase] fetchChannels error:', error);
      return null;
    }
    console.log('[Supabase] Fetched channels successfully. Count:', data?.length || 0, data);
    return (data || []).map((c) => ({
      id: c.id,
      workspaceId: c.workspace_id,
      name: c.name,
      handle: c.handle || '',
      color: c.color || '#4f46e5',
      disabled: c.disabled ?? false,
    }));
  } catch (err) {
    console.error('[Supabase] fetchChannels exception:', err);
    return null;
  }
}

export async function syncChannelToRemote(channel) {
  try {
    const payload = {
      id: channel.id,
      workspace_id: channel.workspaceId,
      name: channel.name,
      handle: channel.handle || '',
      color: channel.color || '#4f46e5',
      disabled: channel.disabled ?? false,
    };
    console.log('[Supabase] Inserting/Upserting channel:', payload);
    const { data, error } = await supabase.from('channels').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.error('[Supabase] Channel insert/upsert error:', error);
      alert(`Supabase Channel Error: ${error.message} (${error.code || ''})`);
      return { success: false, error };
    }
    console.log('[Supabase] Channel saved successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.error('[Supabase] syncChannel exception:', err);
    alert(`Supabase Channel Exception: ${err.message}`);
    return { success: false, error: err };
  }
}

export async function deleteChannelFromRemote(channelId) {
  try {
    console.log('[Supabase] Deleting channel:', channelId);
    const { error } = await supabase.from('channels').delete().eq('id', channelId);
    if (error) {
      console.error('[Supabase] deleteChannel error:', error);
    }
  } catch (err) {
    console.error('[Supabase] deleteChannel error:', err);
  }
}

// ── TEAM MEMBERS (CHANNEL / WORKSPACE ASSIGNMENTS) ──────────────────────────
export async function fetchRemoteTeamMembers() {
  try {
    console.log('[Supabase] Fetching team_members from Supabase...');
    const { data, error } = await supabase.from('team_members').select('*');
    if (error) {
      console.warn('[Supabase] fetchTeamMembers error or RLS policy:', error.message);
      return [];
    }
    console.log('[Supabase] Fetched team_members successfully. Count:', data?.length || 0, data);
    return (data || []).map((tm) => ({
      id: tm.id,
      channelId: tm.channel_id,
      userId: tm.user_id,
      role: tm.role,
      name: tm.name || '',
      phone: tm.phone || '',
      workspaceId: tm.workspace_id || '',
    }));
  } catch (err) {
    console.warn('[Supabase] fetchTeamMembers exception:', err);
    return [];
  }
}

export async function syncTeamMemberToRemote(member) {
  try {
    // We construct a payload compatible with both normalized (user_id/channel_id)
    // and flat schemas (id, user_id, channel_id, role, etc.)
    const payload = {
      id: member.id || ('tm-' + Date.now().toString(36)),
      role: member.role || 'Member',
    };
    if (member.channelId || member.channel_id) {
      payload.channel_id = member.channelId || member.channel_id;
    }
    if (member.userId || member.user_id || member.id) {
      payload.user_id = member.userId || member.user_id || member.id;
    }

    console.log('[Supabase] Inserting/Upserting team_member:', payload);
    const { data, error } = await supabase.from('team_members').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.warn('[Supabase] Team member sync note:', error.message);
      return { success: false, error };
    }
    console.log('[Supabase] Team member synced successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] syncTeamMember exception:', err);
    return { success: false, error: err };
  }
}

export async function deleteTeamMemberFromRemote(memberId) {
  try {
    console.log('[Supabase] Deleting team_member:', memberId);
    // Delete by id or by user_id
    const { error: err1 } = await supabase.from('team_members').delete().eq('id', memberId);
    const { error: err2 } = await supabase.from('team_members').delete().eq('user_id', memberId);
    if (err1 && err2) {
      console.warn('[Supabase] deleteTeamMember notice:', err1.message);
    }
  } catch (err) {
    console.warn('[Supabase] deleteTeamMember exception:', err);
  }
}

// ── TASKS / CONTENTS ───────────────────────────────────────────────────────
export async function fetchRemoteTasks() {
  try {
    console.log('[Supabase] Fetching content/tasks from Supabase (trying "contents" table)...');
    let res = await supabase.from('contents').select('*');
    if (res.error) {
      console.warn('[Supabase] "contents" table query notice:', res.error.message);
      console.log('[Supabase] Trying "tasks" table fallback...');
      res = await supabase.from('tasks').select('*');
    }

    if (res.error) {
      console.warn('[Supabase] Both "contents" and "tasks" fetch error:', res.error.message);
      return null;
    }

    const data = res.data;
    console.log('[Supabase] Fetched contents/tasks successfully. Count:', data?.length || 0, data);
    return (data || []).map((t) => ({
      id: t.id,
      workspaceId: t.workspace_id,
      channelId: t.channel_id,
      title: t.title,
      targetDate: t.target_date || '',
      driveUrl: t.drive_url || '',
      notes: t.notes || '',
      scriptDocUrl: t.script_doc_url || '',
      scriptDocxName: t.script_docx_name || '',
      rawFootageUrl: t.raw_footage_url || '',
      finalVideoUrl: t.final_video_url || '',
      thumbnailAssetUrl: t.thumbnail_asset_url || '',
      stages: typeof t.stages === 'object' && t.stages !== null ? t.stages : {},
      createdAt: t.created_at || '',
    }));
  } catch (err) {
    console.warn('[Supabase] fetchTasks/contents exception:', err);
    return null;
  }
}

export async function syncTaskToRemote(task) {
  try {
    if (!task || !task.id) return { success: false, error: 'No task provided' };
    const payload = {
      id: task.id,
      channel_id: task.channelId || task.channel_id || null,
      workspace_id: task.workspaceId || task.workspace_id || 'ws-main',
      title: task.title || 'Untitled Video',
      target_date: task.targetDate || task.target_date || '',
      drive_url: task.driveUrl || task.drive_url || '',
      notes: task.notes || '',
      script_doc_url: task.scriptDocUrl || task.script_doc_url || '',
      script_docx_name: task.scriptDocxName || task.script_docx_name || '',
      raw_footage_url: task.rawFootageUrl || task.raw_footage_url || '',
      final_video_url: task.finalVideoUrl || task.final_video_url || '',
      thumbnail_asset_url: task.thumbnailAssetUrl || task.thumbnail_asset_url || '',
      stages: task.stages || {},
    };

    console.log('[Supabase] Inserting/Upserting into "contents":', payload);
    let res = await supabase.from('contents').upsert(payload, { onConflict: 'id' }).select();

    if (res.error) {
      console.warn('[Supabase] "contents" upsert notice:', res.error.message);
      console.log('[Supabase] Trying "tasks" upsert fallback...');
      res = await supabase.from('tasks').upsert(payload, { onConflict: 'id' }).select();
    }

    if (res.error) {
      console.warn('[Supabase] Task sync warning on both tables:', res.error.message);
      return { success: false, error: res.error };
    }

    console.log('[Supabase] Content/Task synced successfully:', res.data);
    return { success: true, data: res.data };
  } catch (err) {
    console.warn('[Supabase] syncTask exception:', err);
    return { success: false, error: err };
  }
}

export async function deleteTaskFromRemote(taskId) {
  try {
    if (!taskId) return;
    console.log('[Supabase] Deleting content/task:', taskId);
    const [delContents, delTasks] = await Promise.all([
      supabase.from('contents').delete().eq('id', taskId),
      supabase.from('tasks').delete().eq('id', taskId),
    ]);
    if (delContents.error && delTasks.error) {
      console.warn('[Supabase] deleteTask error on both tables:', delContents.error.message);
    }
  } catch (err) {
    console.warn('[Supabase] deleteTask exception:', err);
  }
}

