import React, { useState, useEffect } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar as CalendarIcon, 
  Grid3X3, 
  UtensilsCrossed, 
  Coffee, 
  Store, 
  BarChart3, 
  Settings, 
  GripVertical,
  LogOut,
  Bell,
  Search,
  ShoppingCart,
  Zap,
  Users,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOutlet } from '../../contexts/OutletContext';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import Logo8848 from '../8848/8848Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { trainerEngine } from '../../services/8848/8848TrainerEngine';
import { use8848TrainerStore } from '../../store/8848/use8848TrainerStore';

export type NavItem = 
  | 'dashboard' 
  | 'reservations' 
  | 'calendar' 
  | 'tables' 
  | 'preorders' 
  | 'hightea' 
  | 'dineInMenu' 
  | 'highTeaMenu' 
  | 'outlet' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onNavigate, isCollapsed, setIsCollapsed }) => {
  const { userData, logout } = useAuth();
  const { outlet } = useOutlet();
  const { t } = useTranslation();
  const { isActive: isTrainerActive } = use8848TrainerStore();

  const handleToggleTrainer = () => {
    if (isTrainerActive) {
      trainerEngine.stopTrainer();
    } else {
      trainerEngine.startTrainer();
    }
  };

  const menuGroups = [
    {
      title: t('common.operations', 'Operations'),
      items: [
        { id: 'dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
        { id: 'reservations', label: t('common.reservations'), icon: BookOpen },
        { id: 'calendar', label: t('common.calendar', 'Calendar View'), icon: CalendarIcon },
        { id: 'tables', label: t('common.tables'), icon: Grid3X3 },
      ]
    },
    {
      title: t('common.diningMenu', 'Dining & Menu'),
      items: [
        { id: 'preorders', label: t('common.preorders', 'Pre-Orders'), icon: ShoppingCart },
        { id: 'hightea', label: t('common.hightea', 'High Tea Events'), icon: Bell },
        { id: 'dineInMenu', label: t('common.dineInMenu', 'Dine-In Menu'), icon: UtensilsCrossed },
        { id: 'highTeaMenu', label: t('common.highTeaMenu', 'High Tea Menu'), icon: Coffee },
      ]
    },
    {
      title: t('common.administration', 'Administration'),
      items: [
        { id: 'outlet', label: t('common.outlet', 'Outlet Management'), icon: Store },
        { id: 'reports', label: t('common.reports', 'Reports & Analytics'), icon: BarChart3 },
        { id: 'settings', label: t('common.settings'), icon: Settings },
      ]
    }
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="h-screen bg-[#0A0A0B] border-r border-white/5 flex flex-col relative z-50"
    >
      {/* Brand Header */}
      <div className="p-6 mb-4">
        <button 
          onClick={() => onNavigate('outlet')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left outline-none group"
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-all",
            outlet?.logo 
              ? "bg-transparent" 
              : "bg-black/40 border border-white/5 shadow-xl"
          )}>
            {outlet?.logo ? (
              <img src={outlet.logo} alt="Outlet logo" className="w-full h-full object-contain p-1" />
            ) : (
              <Logo8848 size={32} glow={false} animated={false} pulse={false} />
            )}
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-lg font-black tracking-tighter text-white uppercase truncate max-w-[160px]">
                  {outlet?.name || "RESERVE LUXE"}
                </h1>
                <p className="text-[8px] font-bold tracking-[0.3em] text-amber-500/60 uppercase">
                  {outlet?.subtitle || "Management Suite"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto no-scrollbar space-y-8">
        {/* AI Trainer Activation Button */}
        <div className="mb-6">
          <button
            id="ai-trainer-btn"
            data-8848-id="ai-trainer-btn"
            onClick={handleToggleTrainer}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all relative overflow-hidden group",
              isTrainerActive 
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                : "bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white border border-white/5"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg",
              isTrainerActive ? "bg-black/10" : "bg-white/5"
            )}>
              <GraduationCap size={20} className={cn(isTrainerActive ? "text-black" : "text-amber-500")} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                   Operational
                </span>
                <span className="text-sm font-black tracking-tight uppercase">
                  AI Trainer
                </span>
              </div>
            )}
            
            {/* Pulsing indicator when active */}
            {isTrainerActive && (
              <motion.div
                layoutId="trainer-glow"
                className="absolute inset-0 bg-white/20"
                animate={{ opacity: [0, 0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </button>
        </div>

        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            {!isCollapsed && (
              <p className="px-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  data-8848-id={`nav-${item.id}`}
                  onClick={() => onNavigate(item.id as NavItem)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                    activeItem === item.id 
                      ? "bg-amber-500/10 text-amber-500" 
                      : "text-white/40 hover:bg-white/[0.03] hover:text-white"
                  )}
                >
                  <item.icon size={20} className={cn("transition-transform group-active:scale-95", activeItem === item.id ? "text-amber-500" : "opacity-40")} />
                  {!isCollapsed && (
                    <span className="text-sm font-bold tracking-tight">{item.label}</span>
                  )}
                  {activeItem === item.id && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-6 bg-amber-500 rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile & Collapse Footer */}
      <div className="p-4 space-y-4">
        <div className={cn(
          "bg-white/[0.03] rounded-2xl p-4 flex items-center gap-3",
          isCollapsed && "justify-center px-2"
        )}>
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold shrink-0">
            {userData?.displayName?.[0] || 'A'}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{userData?.displayName || 'Admin'}</p>
              <p className="text-[10px] text-white/30 truncate">{userData?.email}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isCollapsed && <LanguageSwitcher />}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex-1 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 transition-colors"
          >
            {isCollapsed ? <GripVertical size={20} /> : <GripVertical size={20} />}
          </button>
          <button 
            onClick={logout}
            className="w-12 h-12 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
