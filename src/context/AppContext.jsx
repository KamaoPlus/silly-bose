import React, { createContext, useCallback, useContext, useReducer, useEffect, useState } from 'react';
import {
  INITIAL_CHANNELS,
  DEFAULT_ROLES,
  INITIAL_EMPLOYEES,
  INITIAL_WORKFLOW_TASKS,
  INITIAL_RESOURCE_FOLDERS,
} from '../data/initialData';
import { useLocalStorage } from '../hooks/useLocalStorage';

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

export const ADMIN_USER = {
  id: 'admin-1',
  name: 'Studio Admin',
  role: 'Admin',
  phone: '9769369798',
  password: 'admin',
  email: 'admin@ytops.com',
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

    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        lastNotification: null,
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [savedTasks, setSavedTasks] = useLocalStorage('yt-ops-workflow-v4', INITIAL_WORKFLOW_TASKS);
  const [savedChannels, setSavedChannels] = useLocalStorage('yt-ops-channels-v4', INITIAL_CHANNELS);
  const [savedEmployees, setSavedEmployees] = useLocalStorage('yt-ops-employees-v5', INITIAL_EMPLOYEES);
  const [savedRoles, setSavedRoles] = useLocalStorage('yt-ops-roles-v4', DEFAULT_ROLES);
  const [savedResources, setSavedResources] = useLocalStorage('yt-ops-resources-v1', INITIAL_RESOURCE_FOLDERS);

  // Authentication State
  const [currentUser, setCurrentUser] = useLocalStorage('yt-ops-auth-user', ADMIN_USER);

  // Theme & Font Settings
  const [themeColorId, setThemeColorId] = useLocalStorage('yt-ops-theme-color', 'indigo');
  const [fontFamilyId, setFontFamilyId] = useLocalStorage('yt-ops-theme-font', 'Inter');

  const [state, dispatch] = useReducer(appReducer, {
    tasks: savedTasks,
    channels: savedChannels,
    employees: savedEmployees,
    roles: savedRoles,
    resources: savedResources,
    lastNotification: null,
  });

  useEffect(() => { setSavedTasks(state.tasks); }, [state.tasks, setSavedTasks]);
  useEffect(() => { setSavedChannels(state.channels); }, [state.channels, setSavedChannels]);
  useEffect(() => { setSavedEmployees(state.employees); }, [state.employees, setSavedEmployees]);
  useEffect(() => { setSavedRoles(state.roles); }, [state.roles, setSavedRoles]);
  useEffect(() => { setSavedResources(state.resources); }, [state.resources, setSavedResources]);

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
  }, []);

  const updateChannel = useCallback((channel) => {
    dispatch({ type: 'UPDATE_CHANNEL', payload: channel });
  }, []);

  const deleteChannel = useCallback((id) => {
    dispatch({ type: 'DELETE_CHANNEL', payload: id });
  }, []);

  const addEmployee = useCallback((employee) => {
    dispatch({ type: 'ADD_EMPLOYEE', payload: employee });
  }, []);

  const updateEmployee = useCallback((employee) => {
    dispatch({ type: 'UPDATE_EMPLOYEE', payload: employee });
  }, []);

  const toggleEmployeeStatus = useCallback((id) => {
    dispatch({ type: 'TOGGLE_EMPLOYEE_STATUS', payload: id });
  }, []);

  const deleteEmployee = useCallback((id) => {
    dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
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

  return (
    <AppContext.Provider
      value={{
        state,
        currentUser,
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
