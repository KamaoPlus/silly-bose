import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import ChannelManager from './components/channels/ChannelManager';
import WorkflowSpreadsheet from './components/workflow/WorkflowSpreadsheet';
import TeamManagement from './components/team/TeamManagement';
import KpiSopModule from './components/kpi/KpiPanel';
import WhatsAppNotificationBanner from './components/notifications/WhatsAppNotificationBanner';
import LoginPage from './components/auth/LoginPage';
import ResearcherWorkspace from './components/workspaces/ResearcherWorkspace';
import ProductionWorkspace from './components/workspaces/ProductionWorkspace';
import EditorWorkspace from './components/workspaces/EditorWorkspace';
import StrategistWorkspace from './components/workspaces/StrategistWorkspace';
import ThumbnailWorkspace from './components/workspaces/ThumbnailWorkspace';
import UsefulResources from './components/resources/UsefulResources';
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard';
import AdminDirectoryDrillDown from './components/superadmin/AdminDirectoryDrillDown';
import StorageMonitoring from './components/superadmin/StorageMonitoring';

function AppContent() {
  const { currentUser, isSuperAdmin } = useApp();
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Set default view on user login or role change
  useEffect(() => {
    if (currentUser) {
      const role = (currentUser.role || '').toLowerCase();
      if (role.includes('thumb') || role.includes('design')) {
        setActiveView('thumbnail-workspace');
      } else if (role.includes('research')) {
        setActiveView('researcher-workspace');
      } else if (role.includes('shoot') || role.includes('prod') || role.includes('anchor') || role.includes('camera')) {
        setActiveView('production-workspace');
      } else if (role.includes('edit')) {
        setActiveView('editor-workspace');
      } else if (role.includes('strat')) {
        setActiveView('strategist-workspace');
      } else if (role.includes('admin')) {
        setActiveView('dashboard');
      } else {
        setActiveView('dashboard');
      }
    }
  }, [currentUser?.id, currentUser?.role]);

  // If user is not authenticated, render Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  const userRole = currentUser.role?.toLowerCase() || 'admin';

  const renderModule = () => {
    // ── Super Admin Dedicated Views ──
    if (isSuperAdmin) {
      switch (activeView) {
        case 'dashboard':
          return <SuperAdminDashboard onNavigateView={setActiveView} />;
        case 'admin-directory':
          return <AdminDirectoryDrillDown />;
        case 'storage-resources':
          return <StorageMonitoring />;
        default:
          return <SuperAdminDashboard onNavigateView={setActiveView} />;
      }
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard onNavigateView={setActiveView} />;
      case 'channels':
        if (['admin', 'strategist', 'anchor'].includes(userRole)) {
          return <ChannelManager />;
        }
        return <Dashboard onNavigateView={setActiveView} />;
      case 'workflow':
        return <WorkflowSpreadsheet />;
      case 'team':
        if (userRole === 'admin') {
          return <TeamManagement />;
        }
        return <Dashboard onNavigateView={setActiveView} />;
      case 'kpi':
        return <KpiSopModule />;

      // ── Dedicated Role Workspaces ──
      case 'researcher-workspace':
        return <ResearcherWorkspace />;
      case 'production-workspace':
        return <ProductionWorkspace />;
      case 'editor-workspace':
        return <EditorWorkspace />;
      case 'thumbnail-workspace':
        return <ThumbnailWorkspace />;
      case 'strategist-workspace':
        return <StrategistWorkspace onNavigateView={setActiveView} />;

      // ── Central Shared Useful Resources ──
      case 'resources':
        return <UsefulResources />;

      default:
        return <Dashboard onNavigateView={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* 5-Module Sidebar with RBAC & Logout */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header activeView={activeView} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderModule()}
        </main>
      </div>

      {/* Real-time WhatsApp Notification Dispatch Popup */}
      <WhatsAppNotificationBanner />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
