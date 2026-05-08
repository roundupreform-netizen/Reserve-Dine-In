import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthScreen from './views/AuthScreen';
import Sidebar, { NavItem } from './components/layout/Sidebar';
import DashboardView from './views/DashboardView';
import ReservationsView from './views/ReservationsView';
import CalendarView from './views/CalendarView';
import TableManagement from './views/ManagementViews/TableManagement';
import MenuManagement from './views/ManagementViews/MenuManagement';
import OutletManagement from './views/ManagementViews/OutletManagement';
import { PreOrdersView, HighTeaView, ReportsView } from './views/PlaceholderViews';
import { AnimatePresence, motion } from 'motion/react';
import NewReservationModal from './components/modals/NewReservationModal';

function App() {
  const { user, userData, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavItem>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 bg-amber-500 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.5)]"
        />
      </div>
    );
  }

  if (!userData) return <AuthScreen />;

  const renderContent = () => {
    const props = { onNewReservation: () => setIsNewReservationModalOpen(true) };
    
    switch (activeTab) {
      case 'dashboard': return <DashboardView onNavigate={(tab) => setActiveTab(tab)} {...props} />;
      case 'reservations': return <ReservationsView {...props} />;
      case 'calendar': return <CalendarView />;
      case 'tables': return <TableManagement />;
      case 'dineInMenu': return <MenuManagement />;
      case 'highTeaMenu': return <MenuManagement />; // Reusing the component but with internal state
      case 'outlet': return <OutletManagement />;
      case 'preorders': return <PreOrdersView />;
      case 'hightea': return <HighTeaView />;
      case 'reports': return <ReportsView />;
      default: return <DashboardView {...props} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-white overflow-hidden">
      <Sidebar 
        activeItem={activeTab} 
        onNavigate={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Gradient Accents */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500 blur-[150px] opacity-[0.05] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col overflow-hidden relative z-10"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <NewReservationModal 
        isOpen={isNewReservationModalOpen} 
        onClose={() => setIsNewReservationModalOpen(false)} 
      />
    </div>
  );
}

export default App;
