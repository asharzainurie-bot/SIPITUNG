import React from 'react';
import { Map, PlusCircle, Search, Bot, Phone, Settings, ShieldAlert } from 'lucide-react';
import { UserRole } from '../types';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openSosModal: () => void;
  currentUser: UserRole | null;
  openAuthModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  openSosModal,
  currentUser,
  openAuthModal
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl block md:hidden">
      <div className="grid grid-cols-6 items-center text-center h-16 px-1 max-w-md mx-auto">
        {/* Peta */}
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'map' ? 'text-red-500 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[9px] mt-1 tracking-tight">Peta</span>
        </button>

        {/* Buat Aduan */}
        <button
          onClick={() => setActiveTab('new-report')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'new-report' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="p-1 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow-lg">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[9px] mt-0.5 tracking-tight font-bold text-amber-400">Lapor</span>
        </button>

        {/* Lacak Tiket */}
        <button
          onClick={() => setActiveTab('track')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'track' ? 'text-red-500 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[9px] mt-1 tracking-tight">Lacak</span>
        </button>

        {/* AI Chatbot */}
        <button
          onClick={() => setActiveTab('ai-chatbot')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'ai-chatbot' ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-5 h-5 text-emerald-400" />
          <span className="text-[9px] mt-1 tracking-tight">AI Chat</span>
        </button>

        {/* Emergency Contacts */}
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'contacts' ? 'text-red-500 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Phone className="w-5 h-5" />
          <span className="text-[9px] mt-1 tracking-tight">Kontak</span>
        </button>

        {/* Admin */}
        <button
          onClick={() => {
            if (!currentUser || currentUser.role !== 'admin') {
              if (openAuthModal) openAuthModal();
            } else {
              setActiveTab('admin');
            }
          }}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'admin' ? 'text-amber-300 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px] mt-1 tracking-tight">Admin</span>
        </button>
      </div>
    </div>
  );
};
