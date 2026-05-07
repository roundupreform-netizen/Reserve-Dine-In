import React from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingCart, 
  Bell, 
  BarChart3, 
  Activity,
  ArrowUpRight,
  TrendingUp,
  Users,
  Timer
} from 'lucide-react';

const PlaceholderView = ({ title, icon: Icon, description }: { title: string, icon: any, description: string }) => (
  <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
    <div className="max-w-6xl mx-auto">
      <header className="mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-white">{title}</h1>
          <p className="text-white/40 font-medium">{description}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Module Metric</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-3xl font-black text-white">4.2k</h3>
                  <span className="text-emerald-500 text-[10px] font-black flex items-center mb-1">
                    <ArrowUpRight size={12} className="mr-0.5" /> +12%
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500 blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity" />
          </div>
        ))}
      </div>

      <div className="bg-[#121215] border border-white/5 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center text-white/10">
          <Activity size={48} strokeWidth={1} />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Under Construction</h2>
          <p className="text-sm text-white/40 leading-relaxed">This module is currently being optimized for high-volume restaurant operations. Real-time sync is pending.</p>
        </div>
      </div>
    </div>
  </div>
);

export const PreOrdersView = () => <PlaceholderView title="Pre-Order Pulse" icon={ShoppingCart} description="Kitchen forecasting and item attachment tracking" />;
export const HighTeaView = () => <PlaceholderView title="Event Suite" icon={Bell} description="High-tea packages and grand hall booking schedule" />;
export const ReportsView = () => <PlaceholderView title="Grand Analytics" icon={BarChart3} description="Financial performance and customer behavior patterns" />;
