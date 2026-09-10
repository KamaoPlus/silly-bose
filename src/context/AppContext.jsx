import React, { createContext, useCallback, useContext, useReducer, useEffect, useState } from 'react';
import {
  INITIAL_CHANNELS,
  DEFAULT_ROLES,
  INITIAL_EMPLOYEES,
  INITIAL_WORKFLOW_TASKS,
  INITIAL_RESOURCE_FOLDERS,
  INITIAL_WORKSPACES,
} from '../data/initialData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  fetchRemoteWorkspaces,
  fetchRemoteUsers,
  fetchRemoteChannels,
  syncWorkspaceToRemote,
  deleteWorkspaceFromRemote,
  syncUserToRemote,
  deleteUserFromRemote,
  syncChannelToRemote,
  deleteChannelFromRemote,
} from '../lib/dbSync';

export const THEME_PALETTES = [
  { id: 'indigo',  name: 'Indigo',  color: '#4f46e5', hover: '#4338ca', light: '#eef2ff', text: '#3730a3', border: '#c7d2fe', ring: 'rgba(79, 70, 229, 0.25)' },
  { id: 'slate',   name: 'Slate',   color: '#334155', hover: '#1e293b', light: '#f1f5f9', text: '#0f172a', border: '#cbd5e1', ring: 'rgba(51, 65, 85, 0.25)' },
  { id: 'emerald', name: 'Emerald', color: '#059669', hover: '#047857', light: '#ecfdf5', text: '#065f46', border: '#a7f3d0', ring: 'rgba(5, 150, 105, 0.25)' },
  { id: 'violet',  name: 'Violet',  color: '#7c3aed', hover: '#6d28d9', light: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe', ring: 'rgba(124, 58, 237, 0.25)' },
  { id: 'rose',    name: 'Rose',    color: '#e11d48', hover: '#be123c', light: '#fff1f2', text: '#9f1239', border: '#fecdd3', ring: 'rgba(225, 29, 72, 0.25)' },
  { id: 'amber',   name: 'Amber',   color: '#d97706', hover: '#b45309', light: '#fffbeb', text: '#92400e', border: '#fde68a', ring: 'rgba(217, 119, 6, 0.25)' },
];

export const FONT_FAMILIES = [
  { id: 'Inter',   name: 'Inter',   css: "'Inter', sans-serif" },
  { id: 'Poppins', name: 'Poppins', css: "'Poppins', sans-serif" },
  { id: 'Roboto',  name: 'Roboto',  css: "'Roboto', sans-serif" },
];

export const SUPER_ADMIN_USER = {
  id: 'emp-superadmin',
  name: 'Super Admin',
  role: 'Super Admin',
  phone: '9769369798',
  password: 'admin',
  workspaceId: 'global',
};

const AppContext = createContext(null);

function appReducer(state, action) {
  switch (action.type) {
    // ─── Task Actions ────────────────────────────────────────────────────────
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
        lastNotification: action.payload._notificationMeta || null,
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? { ...t, ...action.payload } : t)),
        lastNotification: action.payload._notificationMeta || state.lastNotification,
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
      };

    case 'UPDATE_STAGE': {
      const { taskId, stageKey, updates } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            stages: {
              ...t.stages,
              [stageKey]: {
                ...t.stages[stageKey],
                ...updates,
              },
            },
          };
        }),
        lastNotification: action.payload._notificationMeta || state.lastNotification,
      };
    }

    case 'UPDATE_TASK_HANDOFF': {
      const { taskId, handoffData, notificationMeta } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...handoffData } : t)),
        lastNotification: notificationMeta || state.lastNotification,
      };
    }

    // ─── Channel Actions ─────────────────────────────────────────────────────
    case 'ADD_CHANNEL':
      return {
        ...state,
        channels: [...state.channels, action.payload],
      };

    case 'UPDATE_CHANNEL':
      return {
        ...state,
        channels: state.channels.map((c) => (c.id === action.payload.id ? { ...c, ...action.payload } : c)),
      };

    case 'TOGGLE_CHANNEL_STATUS':
      return {
        ...state,
        channels: state.channels.map((c) =>
          c.id === action.payload ? { ...c, disabled: !c.disabled } : c
        ),
      };

    case 'DELETE_CHANNEL':
      return {
        ...state,
        channels: state.channels.filter((c) => c.id !== action.payload),
        tasks: state.tasks.filter((t) => t.channelId !== action.payload),
      };

    // ─── Employee Actions ────────────────────────────────────────────────────
    case 'ADD_EMPLOYEE':
      return {
        ...state,
        employees: [...state.employees, action.payload],
      };

    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map((e) => (e.id === action.payload.id ? { ...e, ...action.payload } : e)),
      };

    case 'TOGGLE_EMPLOYEE_STATUS':
      return {
        ...state,
        employees: state.employees.map((e) =>
          e.id === action.payload ? { ...e, active: !e.active } : e
        ),
      };

    case 'DELETE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.filter((e) => e.id !== action.payload),
      };

    // ─── Role Actions ────────────────────────────────────────────────────────
    case 'ADD_ROLE':
      return {
        ...state,
        roles: [...state.roles, action.payload],
      };

    case 'UPDATE_ROLE':
      return {
        ...state,
        roles: state.roles.map((r) => (r.id === action.payload.id ? { ...r, ...action.payload } : r)),
      };

    // ─── Useful Resources Actions ────────────────────────────────────────────
    case 'ADD_RESOURCE_FOLDER':
      return {
        ...state,
        resources: [...state.resources, action.payload],
      };

    case 'DELETE_RESOURCE_FOLDER':
      return {
        ...state,
        resources: state.resources.filter((f) => f.id !== action.payload),
      };

    case 'ADD_RESOURCE_ITEM': {
      const { folderId, item } = action.payload;
      return {
        ...state,
        resources: state.resources.map((f) =>
          f.id === folderId ? { ...f, items: [...(f.items || []), item] } : f
        ),
      };
    }

    case 'DELETE_RESOURCE_ITEM': {
      const { folderId, itemId } = action.payload;
      return {
        ...state,
        resources: state.resources.map((f) =>
          f.id === folderId ? { ...f, items: (f.items || []).filter((i) => i.id !== itemId) } : f
        ),
      };
    }

    // ─── Workspace Actions (Super Admin) ─────────────────────────────────────
    case 'ADD_WORKSPACE':
      return {
        ...state,
        workspaces: [...(state.workspaces || []), action.payload],
      };

    case 'UPDATE_WORKSPACE':
      return {
        ...state,
        workspaces: (state.workspaces || []).map((w) =>
          w.id === action.payload.id ? { ...w, ...action.payload } : w
        ),
      };

    case 'DELETE_WORKSPACE':
      return {
        ...state,
        workspaces: (state.workspaces || []).filter((w) => w.id !== action.payload),
        channels: state.channels.filter((c) => c.workspaceId !== action.payload),
        tasks: state.tasks.filter((t) => t.workspaceId !== action.payload),
        employees: state.employees.filter((e) => e.workspaceId !== action.payload),
      };

    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        lastNotification: null,
      };

    case 'SYNC_REMOTE_DATA': {
      const { workspaces, users, channels } = action.payload;
      const nextWorkspaces = workspaces && workspaces.length ? workspaces : state.workspaces;
      
      // Merge users: keep existing local users and merge new ones from remote
      let nextEmployees = [...state.employees];
      if (users && users.length) {
        const existingIds = new Set(nextEmployees.map(e => e.id));
        users.forEach(u => {
          if (!existingIds.has(u.id)) {
            nextEmployees.push(u);
          } else {
            nextEmployees = nextEmployees.map(e => e.id === u.id ? { ...e, ...u } : e);
          }
        });
      }

      let nextChannels = [...state.channels];
      if (channels && channels.length) {
        const chIds = new Set(nextChannels.map(c => c.id));
        channels.forEach(c => {
          if (!chIds.has(c.id)) {
            nextChannels.push(c);
          } else {
            nextChannels = nextChannels.map(ch => ch.id === c.id ? { ...ch, ...c } : ch);
          }
        });
      }

      return {
        ...state,
        workspaces: nextWorkspaces,
        employees: nextEmployees,
        channels: nextChannels,
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [savedWorkspaces, setSavedWorkspaces] = useLocalStorage('yt-ops-workspaces-v3', INITIAL_WORKSPACES);
  const [savedTasks, setSavedTasks] = useLocalStorage('yt-ops-workflow-v7', INITIAL_WORKFLOW_TASKS);
  const [savedChannels, setSavedChannels] = useLocalStorage('yt-ops-channels-v7', INITIAL_CHANNELS);
  const [savedEmployees, setSavedEmployees] = useLocalStorage('yt-ops-all-users-v1', INITIAL_EMPLOYEES);
  const [savedRoles, setSavedRoles] = useLocalStorage('yt-ops-roles-v6', DEFAULT_ROLES);
  const [savedResources, setSavedResources] = useLocalStorage('yt-ops-resources-v3', INITIAL_RESOURCE_FOLDERS);

  // Active workspace filter for Super Admin (defaults to 'all' or specific workspace)
  const [activeWorkspaceId, setActiveWorkspaceId] = useLocalStorage('yt-ops-active-workspace', 'all');

  // Authentication State: null by default (forces Login Page unless authenticated)
  const [currentUser, setCurrentUser] = useLocalStorage('yt-ops-session-v1', null);

  // Theme & Font Settings
  const [themeColorId, setThemeColorId] = useLocalStorage('yt-ops-theme-color', 'indigo');
  const [fontFamilyId, setFontFamilyId] = useLocalStorage('yt-ops-theme-font', 'Inter');

  const [state, dispatch] = useReducer(appReducer, {
    workspaces: savedWorkspaces,
    tasks: savedTasks,
    channels: savedChannels,
    employees: savedEmployees,
    roles: savedRoles,
    resources: savedResources,
    lastNotification: null,
  });

  useEffect(() => { setSavedWorkspaces(state.workspaces); }, [state.workspaces, setSavedWorkspaces]);
  useEffect(() => { setSavedTasks(state.tasks); }, [state.tasks, setSavedTasks]);
  useEffect(() => { setSavedChannels(state.channels); }, [state.channels, setSavedChannels]);
  useEffect(() => {
    setSavedEmployees(state.employees);
    try {
      window.localStorage.setItem('yt-ops-all-users-v1', JSON.stringify(state.employees));
    } catch {
      // ignore
    }
  }, [state.employees, setSavedEmployees]);
  useEffect(() => { setSavedRoles(state.roles); }, [state.roles, setSavedRoles]);
  useEffect(() => { setSavedResources(state.resources); }, [state.resources, setSavedResources]);

  // Initial Sync from Supabase Cloud Database (if available)
  useEffect(() => {
    let isMounted = true;
    async function initCloudSync() {
      try {
        const [remoteWorkspaces, remoteUsers, remoteChannels] = await Promise.all([
          fetchRemoteWorkspaces(),
          fetchRemoteUsers(),
          fetchRemoteChannels(),
        ]);

        if (isMounted && (remoteWorkspaces || remoteUsers || remoteChannels)) {
          dispatch({
            type: 'SYNC_REMOTE_DATA',
            payload: {
              workspaces: remoteWorkspaces,
              users: remoteUsers,
              channels: remoteChannels,
            },
          });
        }
      } catch (err) {
        console.warn('Initial cloud database sync skipped:', err);
      }
    }
    initCloudSync();
    return () => { isMounted = false; };
  }, []);

  // Apply Theme & Font CSS variables dynamically
  useEffect(() => {
    const palette = THEME_PALETTES.find((p) => p.id === themeColorId) || THEME_PALETTES[0];
    const font = FONT_FAMILIES.find((f) => f.id === fontFamilyId) || FONT_FAMILIES[0];

    const root = document.documentElement;
    root.style.setProperty('--primary-color', palette.color);
    root.style.setProperty('--primary-hover', palette.hover);
    root.style.setProperty('--primary-light', palette.light);
    root.style.setProperty('--primary-text', palette.text);
    root.style.setProperty('--primary-border', palette.border);
    root.style.setProperty('--primary-ring', palette.ring);
    root.style.setProperty('--app-font', font.css);
  }, [themeColorId, fontFamilyId]);

  // Auth actions
  const login = useCallback((user) => {
    setCurrentUser(user);
  }, [setCurrentUser]);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem('yt-ops-session-v1');
      window.localStorage.removeItem('yt-ops-auth-user');
    } catch {
      // ignore
    }
    setCurrentUser(null);
  }, [setCurrentUser]);

  // Actions
  const addTask = useCallback((task, notificationPayload) => {
    dispatch({
      type: 'ADD_TASK',
      payload: { ...task, _notificationMeta: notificationPayload },
    });
  }, []);

  const updateTask = useCallback((task) => {
    dispatch({ type: 'UPDATE_TASK', payload: task });
  }, []);

  const deleteTask = useCallback((id) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  }, []);

  const updateStage = useCallback((taskId, stageKey, updates, notificationPayload) => {
    dispatch({
      type: 'UPDATE_STAGE',
      payload: { taskId, stageKey, updates, _notificationMeta: notificationPayload },
    });
  }, []);

  const updateTaskHandoff = useCallback((taskId, handoffData, notificationMeta) => {
    dispatch({
      type: 'UPDATE_TASK_HANDOFF',
      payload: { taskId, handoffData, notificationMeta },
    });
  }, []);

  const addChannel = useCallback((channel) => {
    dispatch({ type: 'ADD_CHANNEL', payload: channel });
    syncChannelToRemote(channel);
  }, []);

  const updateChannel = useCallback((channel) => {
    dispatch({ type: 'UPDATE_CHANNEL', payload: channel });
    syncChannelToRemote(channel);
  }, []);

  const toggleChannelStatus = useCallback((id) => {
    dispatch({ type: 'TOGGLE_CHANNEL_STATUS', payload: id });
    const ch = state.channels.find((c) => c.id === id);
    if (ch) syncChannelToRemote({ ...ch, disabled: !ch.disabled });
  }, [state.channels]);

  const deleteChannel = useCallback((id) => {
    dispatch({ type: 'DELETE_CHANNEL', payload: id });
    deleteChannelFromRemote(id);
  }, []);

  const addEmployee = useCallback((employee) => {
    dispatch({ type: 'ADD_EMPLOYEE', payload: employee });
    syncUserToRemote(employee);
  }, []);

  const updateEmployee = useCallback((employee) => {
    dispatch({ type: 'UPDATE_EMPLOYEE', payload: employee });
    syncUserToRemote(employee);
  }, []);

  const toggleEmployeeStatus = useCallback((id) => {
    dispatch({ type: 'TOGGLE_EMPLOYEE_STATUS', payload: id });
    const emp = state.employees.find((e) => e.id === id);
    if (emp) syncUserToRemote({ ...emp, active: !emp.active });
  }, [state.employees]);

  const deleteEmployee = useCallback((id) => {
    dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
    deleteUserFromRemote(id);
  }, []);

  const addRole = useCallback((role) => {
    dispatch({ type: 'ADD_ROLE', payload: role });
  }, []);

  const updateRole = useCallback((role) => {
    dispatch({ type: 'UPDATE_ROLE', payload: role });
  }, []);

  const dismissNotification = useCallback(() => {
    dispatch({ type: 'DISMISS_NOTIFICATION' });
  }, []);

  const triggerNotification = useCallback((notificationPayload) => {
    dispatch({ type: 'UPDATE_TASK', payload: { _notificationMeta: notificationPayload, id: 'noop' } });
  }, []);

  const addResourceFolder = useCallback((folder) => {
    dispatch({ type: 'ADD_RESOURCE_FOLDER', payload: folder });
  }, []);

  const deleteResourceFolder = useCallback((folderId) => {
    dispatch({ type: 'DELETE_RESOURCE_FOLDER', payload: folderId });
  }, []);

  const addResourceItem = useCallback((folderId, item) => {
    dispatch({ type: 'ADD_RESOURCE_ITEM', payload: { folderId, item } });
  }, []);

  const deleteResourceItem = useCallback((folderId, itemId) => {
    dispatch({ type: 'DELETE_RESOURCE_ITEM', payload: { folderId, itemId } });
  }, []);

  // Workspace Actions (Super Admin)
  const addWorkspace = useCallback((workspace) => {
    dispatch({ type: 'ADD_WORKSPACE', payload: workspace });
    syncWorkspaceToRemote(workspace);
  }, []);

  const updateWorkspace = useCallback((workspace) => {
    dispatch({ type: 'UPDATE_WORKSPACE', payload: workspace });
    syncWorkspaceToRemote(workspace);
  }, []);

  const deleteWorkspace = useCallback((workspaceId) => {
    dispatch({ type: 'DELETE_WORKSPACE', payload: workspaceId });
    deleteWorkspaceFromRemote(workspaceId);
  }, []);

  // Compute scoped state based on currentUser and activeWorkspaceId
  // Super Admin: sees either all data or filtered by activeWorkspaceId
  // Admin & other team members: strictly scoped to their user.workspaceId (e.g. 'ws-main')
  const userRole = currentUser?.role?.toLowerCase() || '';
  const isSuperAdmin = userRole === 'super admin';
  const effectiveWorkspaceId = isSuperAdmin
    ? activeWorkspaceId
    : (currentUser?.workspaceId || 'ws-main');

  const scopedChannels = state.channels.filter((c) => {
    if (isSuperAdmin && effectiveWorkspaceId === 'all') return true;
    return (c.workspaceId || 'ws-main') === effectiveWorkspaceId;
  });

  const scopedTasks = state.tasks.filter((t) => {
    if (isSuperAdmin && effectiveWorkspaceId === 'all') return true;
    const taskWsId = t.workspaceId || state.channels.find((c) => c.id === t.channelId)?.workspaceId || 'ws-main';
    return taskWsId === effectiveWorkspaceId;
  });

  const scopedEmployees = state.employees.filter((e) => {
    if (isSuperAdmin && effectiveWorkspaceId === 'all') return true;
    if (e.role === 'Super Admin') return isSuperAdmin;
    return (e.workspaceId || 'ws-main') === effectiveWorkspaceId;
  });

  const scopedState = {
    ...state,
    channels: scopedChannels,
    tasks: scopedTasks,
    employees: scopedEmployees,
    rawState: state, // Access for super admin to all raw data
  };

  return (
    <AppContext.Provider
      value={{
        state: scopedState,
        rawState: state,
        currentUser,
        isSuperAdmin,
        activeWorkspaceId,
        setActiveWorkspaceId,
        themeColorId,
        setThemeColorId,
        fontFamilyId,
        setFontFamilyId,
        actions: {
          login,
          logout,
          addTask,
          updateTask,
          deleteTask,
          updateStage,
          updateTaskHandoff,
          addChannel,
          updateChannel,
          toggleChannelStatus,
          deleteChannel,
          addEmployee,
          updateEmployee,
          toggleEmployeeStatus,
          deleteEmployee,
          addRole,
          updateRole,
          dismissNotification,
          triggerNotification,
          addResourceFolder,
          deleteResourceFolder,
          addResourceItem,
          deleteResourceItem,
          addWorkspace,
          updateWorkspace,
          deleteWorkspace,
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
