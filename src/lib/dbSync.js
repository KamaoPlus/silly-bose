import { supabase } from './supabase';
import { sanitizeExternalUrl } from '../utils/fileHelpers';

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
      // Decode metadata from assets_json or assigned_to
      let assets = {};
      if (t.assets_json) {
        if (typeof t.assets_json === 'string') {
          try { assets = JSON.parse(t.assets_json); } catch { assets = {}; }
        } else if (typeof t.assets_json === 'object') {
          assets = t.assets_json;
        }
      }

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

      let parsedStages = t.stages || assets.stages || meta.stages || {};
      if (typeof parsedStages === 'string') {
        try { parsedStages = JSON.parse(parsedStages); } catch { parsedStages = {}; }
      }

      // Resolve script doc link: either script_doc_link column or scriptDocUrl from meta/assets
      const scriptDocUrl = sanitizeExternalUrl(t.script_doc_link || t.script_doc_url || assets.scriptDocUrl || assets.script_doc_link || meta.scriptDocUrl || meta.script_doc_link || '');
      // Resolve script file: either script_file_url column or scriptDocxName
      const scriptDocxName = sanitizeExternalUrl(t.script_file_url || t.script_docx_name || assets.scriptDocxName || assets.script_file_url || meta.scriptDocxName || meta.script_file_url || '');
      // Resolve raw footage
      const rawFootageUrl = sanitizeExternalUrl(t.raw_footage_url || assets.rawFootageUrl || assets.raw_footage_url || meta.rawFootageUrl || meta.raw_footage_url || '');
      // Resolve audio file
      const audioFileUrl = sanitizeExternalUrl(t.audio_file_url || assets.audioFileUrl || assets.audio_file_url || meta.audioFileUrl || meta.audio_file_url || '');
      // Resolve edited video cut
      const finalVideoUrl = sanitizeExternalUrl(t.edited_video_url || t.final_video_url || assets.finalVideoUrl || assets.edited_video_url || meta.finalVideoUrl || meta.edited_video_url || '');
      // Resolve thumbnail asset
      const thumbnailAssetUrl = sanitizeExternalUrl(t.thumbnail_url || t.thumbnail_asset_url || assets.thumbnailAssetUrl || assets.thumbnail_url || meta.thumbnailAssetUrl || meta.thumbnail_url || '');

      const status = t.status || assets.status || meta.status || 'Pending';
      const stage = t.stage || assets.stage || meta.stage || '';

      // Auto-harmonize parsedStages if status or stage reflects shooting completion
      if (status === 'Shot' || stage === 'Editing' || Boolean(rawFootageUrl)) {
        if (!parsedStages.production) parsedStages.production = {};
        parsedStages.production.status = 'Completed';
        if (!parsedStages.anchor) parsedStages.anchor = {};
        parsedStages.anchor.status = 'Completed';
        if (parsedStages.editor && parsedStages.editor.status === 'Pending') {
          parsedStages.editor.status = 'In Progress';
        }
      }

      return {
        id: t.id,
        workspaceId: t.workspace_id || assets.workspaceId || meta.workspaceId || 'ws-main',
        channelId: t.channel_id || assets.channelId || meta.channelId || '',
        title: t.title || 'Untitled Video',
        status,
        stage,
        targetDate: t.target_date || assets.targetDate || meta.targetDate || '',
        driveUrl: t.drive_url || assets.driveUrl || meta.driveUrl || '',
        scriptDocUrl,
        script_doc_link: scriptDocUrl,
        scriptDocxName,
        script_file_url: scriptDocxName,
        rawFootageUrl,
        raw_footage_url: rawFootageUrl,
        audioFileUrl,
        audio_file_url: audioFileUrl,
        finalVideoUrl,
        edited_video_url: finalVideoUrl,
        thumbnailAssetUrl,
        thumbnail_url: thumbnailAssetUrl,
        stages: parsedStages,
        assignedLead: assignedLead || assets.assignedLead || meta.assignedLead || '',
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
      else if (task.stages?.production?.status === 'Completed') currentStatus = 'Shot';
      else if (task.stages?.production?.status === 'In Progress') currentStatus = 'In Production';
      else currentStatus = 'Pending';
    }

    // Determine representative pipeline stage
    let currentStage = task.stage || '';
    if (!currentStage) {
      if (task.stages?.strategist?.status === 'Completed') currentStage = 'Published';
      else if (task.stages?.thumbnail?.status === 'Completed') currentStage = 'Strategist';
      else if (task.stages?.editor?.status === 'Completed') currentStage = 'Thumbnail';
      else if (task.stages?.production?.status === 'Completed' || currentStatus === 'Shot') currentStage = 'Editing';
      else if (task.stages?.production?.status === 'In Progress' || currentStatus === 'In Production' || currentStatus === 'Shooting') currentStage = 'Production';
      else if (task.stages?.researcher?.status === 'Completed') currentStage = 'Shoot';
      else currentStage = 'Research';
    }

    // Determine representative assigned_to lead
    const leadAssignee =
      task.stages?.researcher?.assigneeId ||
      task.stages?.strategist?.assigneeId ||
      task.stages?.production?.assigneeId ||
      task.assignedLead ||
      '';

    const scriptDocUrl = task.scriptDocUrl || task.script_doc_link || '';
    const scriptDocxName = task.scriptDocxName || task.script_file_url || '';
    const rawFootageUrl = task.rawFootageUrl || task.raw_footage_url || '';
    const audioFileUrl = task.audioFileUrl || task.audio_file_url || '';
    const finalVideoUrl = task.finalVideoUrl || task.edited_video_url || '';
    const thumbnailAssetUrl = task.thumbnailAssetUrl || task.thumbnail_url || '';

    // Store extended multi-stage metadata in assets_json and envelope
    const assetsPayload = {
      targetDate: task.targetDate || '',
      driveUrl: task.driveUrl || '',
      notes: task.notes || '',
      status: currentStatus,
      stage: currentStage,
      scriptDocUrl,
      script_doc_link: scriptDocUrl,
      scriptDocxName,
      script_file_url: scriptDocxName,
      rawFootageUrl,
      raw_footage_url: rawFootageUrl,
      audioFileUrl,
      audio_file_url: audioFileUrl,
      finalVideoUrl,
      edited_video_url: finalVideoUrl,
      thumbnailAssetUrl,
      thumbnail_url: thumbnailAssetUrl,
      stages: task.stages || {},
      assignedLead: leadAssignee,
    };

    // Full schema-aligned payload using dedicated columns:
    // status, stage, script_doc_link, script_file_url, raw_footage_url, audio_file_url, edited_video_url, thumbnail_url, notes, assets_json
    const contentsPayload = {
      id: String(task.id),
      workspace_id: String(task.workspaceId || 'ws-main'),
      channel_id: String(task.channelId || ''),
      title: String(task.title || 'Untitled Video'),
      status: String(currentStatus || 'Pending'),
      stage: String(currentStage || ''),
      assigned_to: leadAssignee || JSON.stringify(assetsPayload),
      notes: task.notes || '',
      script_doc_link: scriptDocUrl || null,
      script_file_url: scriptDocxName || null,
      raw_footage_url: rawFootageUrl || null,
      audio_file_url: audioFileUrl || null,
      edited_video_url: finalVideoUrl || null,
      thumbnail_url: thumbnailAssetUrl || null,
      assets_json: assetsPayload,
    };

    console.log('[Supabase] Executing supabase.from("contents").upsert(...):', contentsPayload);
    let { data, error } = await supabase.from('contents').upsert(contentsPayload, { onConflict: 'id' }).select();

    // Fallback: If DB table schema lacks dedicated 'stage' column, retry without it
    if (error && (error.message?.toLowerCase().includes('stage') || error.code === 'PGRST204')) {
      console.warn('[Supabase] Retrying without stage column:', error.message);
      delete contentsPayload.stage;
      const retry = await supabase.from('contents').upsert(contentsPayload, { onConflict: 'id' }).select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[Supabase] Error inserting/upserting into "contents":', error);
      alert(`Supabase Contents Error: ${error.message} (Code: ${error.code || ''})`);
      return { success: false, error };
    }

    console.log('[Supabase] Content & Pipeline Assets successfully synced to Supabase "contents":', data);
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

