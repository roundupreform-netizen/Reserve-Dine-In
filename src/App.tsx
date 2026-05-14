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
import { format } from 'date-fns';
import NewReservationModal from './components/modals/NewReservationModal';
import { Toaster } from 'react-hot-toast';
import AIOrb from './components/8848/AIOrb';
import DiagnosticEngine from './components/8848/DiagnosticEngine';
import WalkthroughEngine from './components/8848/WalkthroughEngine';
import { TrainerOverlay8848 } from './components/8848/8848TrainerOverlay';
import { LanguageMenu8848 } from './components/8848/8848LanguageMenu';
import { useAIContextSync } from './hooks/use8848';
import { useAIStore } from './store/useAIStore';

import { navigationEngine, actionEngine } from './services/8848/8848ActionEngine';

import { HighlightOverlay8848 } from './components/8848/8848HighlightOverlay';
import { ChatWindow8848 } from './components/8848/8848ChatWindow';

function App() {
  const { user, userData, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavItem>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // AI Context Synchronization
  const { updateContext } = useAIContextSync(
    activeTab, 
    isNewReservationModalOpen ? 'new_reservation' : null
  );

  // Register AI Navigation Engine
  useEffect(() => {
    navigationEngine.register({
      setTab: (tab) => setActiveTab(tab),
      setModal: (name, open) => {
        if (name === 'new_reservation') setIsNewReservationModalOpen(open);
      }
    });
  }, []);

  // AI Action Listener
  useEffect(() => {
    const unsubscribe = useAIStore.subscribe((state, prevState) => {
      const lastMessage = state.messages[state.messages.length - 1];
      const prevMessage = prevState.messages[prevState.messages.length - 1];
      
      // Only trigger if it's a new AI message with actions
      if (lastMessage?.role === 'ai' && lastMessage !== prevMessage && lastMessage.actions) {
        lastMessage.actions.forEach((action: any) => {
          actionEngine.execute(action);
        });
      }
    });
    return unsubscribe;
  }, []);

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

  // skip auth check for now as requested
  // if (!userData) return <AuthScreen />;

  const renderContent = () => {
    const props = { 
      onNewReservation: () => setIsNewReservationModalOpen(true),
      selectedDate,
      setSelectedDate
    };
    
    switch (activeTab) {
      case 'dashboard': return <DashboardView onNavigate={(tab) => setActiveTab(tab)} {...props} />;
      case 'reservations': return <ReservationsView {...props} />;
      case 'calendar': return (
        <CalendarView 
          selectedDate={selectedDate} 
          onDateSelect={(date) => setSelectedDate(date)} 
          onDateOpen={(date) => { 
            setSelectedDate(date); 
            setActiveTab('reservations'); 
          }} 
        />
      );
      case 'tables': return <TableManagement />;
      case 'dineInMenu': return <MenuManagement initialMenuType="dine-in" />;
      case 'highTeaMenu': return <MenuManagement initialMenuType="high-tea" />; // Correctly passing prop
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
        initialDate={format(selectedDate, 'yyyy-MM-dd')}
      />

      {/* 8848 METERS AI LAYER */}
      <DiagnosticEngine />
      <WalkthroughEngine />
      <TrainerOverlay8848 />
      <LanguageMenu8848 />
      <HighlightOverlay8848 />
      <ChatWindow8848 />
      <AIOrb />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0F0F12',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '1rem',
            fontSize: '12px',
            fontFamily: 'inherit',
          },
        }}
      />
    </div>
  );
}

export default App;
