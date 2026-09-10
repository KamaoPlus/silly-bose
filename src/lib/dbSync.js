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
    console.log('[Supabase] Fetching content/tasks from Supabase "contents" table...');
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
    return (data || []).map((t) => {
      // Decode metadata if stored in assigned_to or stages
      let meta = {};
      let assignedLead = '';
      if (t.assigned_to) {
        if (typeof t.assigned_to === 'string' && (t.assigned_to.startsWith('{') || t.assigned_to.startsWith('['))) {
          try {
            meta = JSON.parse(t.assigned_to);
          } catch {
            assignedLead = t.assigned_to;
          }
        } else if (typeof t.assigned_to === 'object') {
          meta = t.assigned_to;
        } else {
          assignedLead = String(t.assigned_to);
        }
      }

      let parsedStages = t.stages || meta.stages || {};
      if (typeof parsedStages === 'string') {
        try { parsedStages = JSON.parse(parsedStages); } catch { parsedStages = {}; }
      }

      return {
        id: t.id,
        workspaceId: t.workspace_id || meta.workspaceId || 'ws-main',
        channelId: t.channel_id || meta.channelId || '',
        title: t.title || 'Untitled Video',
        status: t.status || 'Pending',
        targetDate: t.target_date || meta.targetDate || '',
        driveUrl: t.drive_url || meta.driveUrl || '',
        notes: t.notes || meta.notes || '',
        scriptDocUrl: t.script_doc_url || meta.scriptDocUrl || '',
        scriptDocxName: t.script_docx_name || meta.scriptDocxName || '',
        rawFootageUrl: t.raw_footage_url || meta.rawFootageUrl || '',
        finalVideoUrl: t.final_video_url || meta.finalVideoUrl || '',
        thumbnailAssetUrl: t.thumbnail_asset_url || meta.thumbnailAssetUrl || '',
        stages: parsedStages,
        assignedLead: assignedLead || meta.assignedLead || '',
        createdAt: t.created_at || '',
      };
    });
  } catch (err) {
    console.warn('[Supabase] fetchTasks/contents exception:', err);
    return null;
  }
}

export async function syncTaskToRemote(task) {
  try {
    if (!task || !task.id) {
      console.error('[Supabase] syncTaskToRemote: No task or task.id provided');
      return { success: false, error: 'No task provided' };
    }

    // Determine representative status from stages or direct status
    let currentStatus = task.status;
    if (!currentStatus) {
      if (task.stages?.strategist?.status === 'Completed') currentStatus = 'Completed';
      else if (task.stages?.strategist?.status === 'Review') currentStatus = 'Review';
      else if (task.stages?.editor?.status === 'Completed') currentStatus = 'In Progress';
      else currentStatus = 'Pending';
    }

    // Determine representative assigned_to lead
    const leadAssignee =
      task.stages?.researcher?.assigneeId ||
      task.stages?.strategist?.assigneeId ||
      task.stages?.production?.assigneeId ||
      task.assignedLead ||
      '';

    // Store extended fields in assigned_to JSON envelope so all dates, drive links, and 6 stages persist
    const extendedMeta = {
      assignedLead: leadAssignee,
      targetDate: task.targetDate || '',
      driveUrl: task.driveUrl || '',
      notes: task.notes || '',
      scriptDocUrl: task.scriptDocUrl || '',
      scriptDocxName: task.scriptDocxName || '',
      rawFootageUrl: task.rawFootageUrl || '',
      finalVideoUrl: task.finalVideoUrl || '',
      thumbnailAssetUrl: task.thumbnailAssetUrl || '',
      stages: task.stages || {},
    };

    // Aligned strictly with the actual Supabase contents table schema:
    // id, workspace_id, channel_id, title, status, assigned_to
    const contentsPayload = {
      id: String(task.id),
      workspace_id: String(task.workspaceId || 'ws-main'),
      channel_id: String(task.channelId || ''),
      title: String(task.title || 'Untitled Video'),
      status: String(currentStatus || 'Pending'),
      assigned_to: JSON.stringify(extendedMeta),
    };

    console.log('[Supabase] Executing supabase.from("contents").upsert(...):', contentsPayload);
    let { data, error } = await supabase.from('contents').upsert(contentsPayload, { onConflict: 'id' }).select();

    if (error) {
      console.error('[Supabase] Error inserting/upserting into "contents":', error);
      // Also try with plain lead string if JSON string fails constraint
      console.log('[Supabase] Retrying contents upsert with plain assigned_to string...');
      const fallbackPayload = {
        ...contentsPayload,
        assigned_to: leadAssignee || 'Unassigned',
      };
      const retryRes = await supabase.from('contents').upsert(fallbackPayload, { onConflict: 'id' }).select();
      if (retryRes.error) {
        console.error('[Supabase] Retry failed as well:', retryRes.error);
        alert(`Supabase Contents Error: ${retryRes.error.message} (Code: ${retryRes.error.code || ''})`);
        return { success: false, error: retryRes.error };
      }
      data = retryRes.data;
      error = null;
    }

    console.log('[Supabase] Content successfully inserted/upserted into Supabase "contents":', data);
    return { success: true, data };
  } catch (err) {
    console.error('[Supabase] syncTaskToRemote exception:', err);
    alert(`Supabase Content Exception: ${err.message}`);
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

