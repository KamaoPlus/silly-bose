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
    const { data, error } = await supabase.from('workspaces').select('*');
    if (error || !data) return null;
    return data.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description || '',
      adminPhone: w.admin_phone || '',
      createdAt: w.created_at ? new Date(w.created_at).toISOString().split('T')[0] : '',
    }));
  } catch (err) {
    console.warn('Supabase fetchWorkspaces fallback:', err);
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
    const { error } = await supabase.from('workspaces').upsert(payload, { onConflict: 'id' });
    if (error) console.warn('Supabase syncWorkspace error:', error.message);
  } catch (err) {
    console.warn('Supabase syncWorkspace exception:', err);
  }
}

export async function deleteWorkspaceFromRemote(workspaceId) {
  try {
    await supabase.from('workspaces').delete().eq('id', workspaceId);
  } catch (err) {
    console.warn('Supabase deleteWorkspace error:', err);
  }
}

// ── USERS ──────────────────────────────────────────────────────────────────
export async function fetchRemoteUsers() {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error || !data) return null;
    return data.map((u) => ({
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
    console.warn('Supabase fetchUsers fallback:', err);
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
    const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
    if (error) console.warn('Supabase syncUser error:', error.message);
  } catch (err) {
    console.warn('Supabase syncUser exception:', err);
  }
}

export async function deleteUserFromRemote(userId) {
  try {
    await supabase.from('users').delete().eq('id', userId);
  } catch (err) {
    console.warn('Supabase deleteUser error:', err);
  }
}

// ── CHANNELS ───────────────────────────────────────────────────────────────
export async function fetchRemoteChannels() {
  try {
    const { data, error } = await supabase.from('channels').select('*');
    if (error || !data) return null;
    return data.map((c) => ({
      id: c.id,
      workspaceId: c.workspace_id,
      name: c.name,
      handle: c.handle || '',
      color: c.color || '#4f46e5',
      disabled: c.disabled ?? false,
    }));
  } catch (err) {
    console.warn('Supabase fetchChannels fallback:', err);
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
    const { error } = await supabase.from('channels').upsert(payload, { onConflict: 'id' });
    if (error) console.warn('Supabase syncChannel error:', error.message);
  } catch (err) {
    console.warn('Supabase syncChannel exception:', err);
  }
}

export async function deleteChannelFromRemote(channelId) {
  try {
    await supabase.from('channels').delete().eq('id', channelId);
  } catch (err) {
    console.warn('Supabase deleteChannel error:', err);
  }
}
