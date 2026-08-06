import React from 'react';
import {
  ShieldAlert,
  Map,
  PlusCircle,
  Search,
  Bot,
  Phone,
  Settings,
  LogIn,
  LogOut,
  AlertTriangle,
  Siren,
  Bell,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { AppSettings, UserRole } from '../types';

interface HeaderNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openSosModal: () => void;
  openEwsModal: () => void;
  openAuthModal: () => void;
  currentUser: UserRole | null;
  setCurrentUser: (user: UserRole | null) => void;
  settings: AppSettings;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeTab,
  setActiveTab,
  openSosModal,
  openEwsModal,
  openAuthModal,
  currentUser,
  setCurrentUser,
  settings
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-xl border-b border-slate-800">
      {/* Top Banner Running Ticker EWS */}
      {settings.ewsActive && settings.ewsNotice && (
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white px-3 py-1.5 text-xs font-semibold flex items-center justify-between shadow-inner border-b border-red-500/40 overflow-hidden">
          <div
            className="flex items-center space-x-1.5 shrink-0 z-10 bg-red-700/90 px-2 py-0.5 rounded-lg shadow cursor-pointer mr-2"
            onClick={openEwsModal}
          >
            <span className="animate-pulse bg-white text-red-700 px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">
              EWS {settings.ewsNotice.level}
            </span>
          </div>

          {/* Running Text Marquee */}
          <div className="flex-1 overflow-hidden cursor-pointer" onClick={openEwsModal}>
            <marquee scrollamount="5" className="font-bold text-xs text-amber-100 flex items-center">
              🚨 <strong className="text-white mx-1">{settings.ewsNotice.title}:</strong> {settings.ewsNotice.message} ({settings.ewsNotice.area || 'Kecamatan Tulis, Kab. Batang'})
            </marquee>
          </div>

          <button
            onClick={openEwsModal}
            className="shrink-0 z-10 bg-black/30 hover:bg-black/50 text-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ml-2 border border-white/20"
          >
            Detail &rarr;
          </button>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 flex items-center justify-between gap-1 sm:gap-3 w-full max-w-full overflow-hidden">
        {/* Brand & Logo */}
        <div
          onClick={() => setActiveTab('map')}
          className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group shrink"
        >
          <div className="relative shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              <Siren className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-bounce" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base sm:text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent truncate">
                {settings.appName || 'SIPITUNG'}
              </h1>
              <span className="text-[9px] sm:text-[10px] bg-red-600/80 text-white font-bold px-1 py-0.2 rounded uppercase tracking-wider border border-red-500/40 shrink-0">
                24/7
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-300 truncate font-medium hidden sm:block">
              {settings.tagline || 'SIAGA PITULUNGAN - Bencana & Trantibum'}
            </p>
          </div>
        </div>

        {/* SOS Emergency Call Button & Quick Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Tombol SOS Merah Panic */}
          <button
            id="sos-button-main"
            onClick={openSosModal}
            className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-extrabold shadow-md shadow-red-900/50 border border-red-500/50 flex items-center space-x-1 transition-all transform hover:scale-105 active:scale-95 animate-pulse shrink-0"
          >
            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 animate-spin-slow shrink-0" />
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase">SOS</span>
          </button>

          {/* Tombol HOTLINE WhatsApp Admin */}
          <a
            href={`https://wa.me/${(settings.adminWhatsappNumber || '082327313277').replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent('Halo Posko Pusdalops SIPITUNG Kecamatan Tulis, saya ingin menghubungi Hotline Kedaruratan/Aduan.')}`}
            target="_blank"
            rel="noopener noreferrer"
            id="hotline-button-main"
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-extrabold shadow-md shadow-emerald-900/40 border border-emerald-400/50 flex items-center space-x-1 transition-all transform hover:scale-105 active:scale-95 shrink-0"
            title="Hubungi Hotline WhatsApp Admin Pusdalops Tulis 24 Jam"
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200 shrink-0" />
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase">HOTLINE</span>
          </a>

          {/* User Auth Indicator / Login Button */}
          {currentUser ? (
            <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs shrink-0">
              <div className="text-right">
                <p className="font-bold text-slate-100 truncate max-w-[70px] sm:max-w-[120px]">{currentUser.name}</p>
                <p className="text-[8px] sm:text-[10px] text-amber-400 uppercase font-semibold">{currentUser.role}</p>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                title="Keluar / Logout"
                className="p-1 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-lg transition ml-0.5"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold flex items-center space-x-1 transition shrink-0"
              title="Masuk Petugas / Admin"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Masuk</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="bg-slate-950 border-t border-slate-800/80 px-2 sm:px-4 py-1.5 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 sm:space-x-2 min-w-max">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'map'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Peta Sebaran</span>
          </button>

          <button
            onClick={() => setActiveTab('new-report')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'new-report'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>Buat Aduan / Laporan</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'track'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Lacak Status Aduan</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-chatbot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'ai-chatbot'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>SiagA AI Mitigasi</span>
            <span className="bg-emerald-500 text-slate-950 text-[9px] px-1 py-0.2 rounded font-extrabold uppercase">
              Gemini
            </span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'contacts'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Nomor Darurat</span>
          </button>

          {/* Admin Tab (Restricted strictly to logged-in Admin) */}
          <button
            onClick={() => {
              if (!currentUser || currentUser.role !== 'admin') {
                openAuthModal();
              } else {
                setActiveTab('admin');
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'admin'
                ? 'bg-slate-700 text-amber-300 border border-amber-400/40 shadow-md'
                : 'text-amber-400/90 hover:bg-slate-800 hover:text-amber-300'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Panel Admin & Pengaturan</span>
            {currentUser && currentUser.role === 'admin' ? (
              <span className="bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1 rounded uppercase">ADMIN</span>
            ) : (
              <span className="bg-red-500/80 text-white text-[9px] font-extrabold px-1 rounded uppercase">TERKUNCI</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
