import React, { useState, useEffect } from 'react';
import { HeaderNavbar } from './components/HeaderNavbar';
import { PWAInstaller } from './components/PWAInstaller';
import { SosButtonModal } from './components/SosButtonModal';
import { EwsBannerModal } from './components/EwsBannerModal';
import { ReportFormModal } from './components/ReportFormModal';
import { ReportTrackingModal } from './components/ReportTrackingModal';
import { MapView } from './components/MapView';
import { AiMitigationChatbot } from './components/AiMitigationChatbot';
import { EmergencyContactsPanel } from './components/EmergencyContactsPanel';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { MobileBottomNav } from './components/MobileBottomNav';

import { Report, AppSettings, EmergencyContact, UserRole, ReportStatus } from './types';
import { getSupabaseClient } from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('map');

  // Modals state
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isEwsOpen, setIsEwsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // App state loaded from backend
  const [reports, setReports] = useState<Report[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'SIPITUNG',
    tagline: 'SIAGA PITULUNGAN - Bencana Alam & Trantibum',
    logoUrl: 'https://img.icons8.com/color/192/siren.png',
    agencyName: 'Pemerintah Daerah - BPBD & Satpol PP',
    contactPhone: '112 / (021) 555-0112',
    contactEmail: 'posko@sipitung.go.id',
    address: 'Gedung Pusdalops Kedaruratan & Trantibum Lt. 2',
    googleSheetsWebhookUrl: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    ewsActive: true,
    ewsNotice: {
      id: 'ews-1',
      title: 'PERINGATAN DINI CUACA EKSTREM & HUJAN DERAS',
      level: 'siaga',
      message:
        'Potensi hujan lebat disertai angin kencang di wilayah Jabodetabek. Warga di bantaran sungai diimbau siaga evakuasi mandiri.',
      date: '05 Agustus 2026',
      area: 'Jabodetabek & Jawa Barat'
    }
  });

  const [currentUser, setCurrentUser] = useState<UserRole | null>(null);
  const [trackingTicketId, setTrackingTicketId] = useState<string>('');

  // Fetch initial data on load
  useEffect(() => {
    fetchReports();
    fetchSettings();
  }, []);

  const fetchReports = async () => {
    let loadedFromApi = false;
    try {
      const res = await fetch('/api/reports');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reports) && data.reports.length > 0) {
          setReports(data.reports);
          loadedFromApi = true;
        }
      }
    } catch (err) {
      console.warn('API fetch unavailable, trying direct Supabase client...');
    }

    if (!loadedFromApi) {
      try {
        const sb = getSupabaseClient(settings);
        if (sb) {
          for (const tbl of ['reports', 'sipitung_reports']) {
            const { data, error } = await sb.from(tbl).select('*');
            if (!error && data && data.length > 0) {
              const parsed = data.map((r: any) => {
                let korbanObj = r.korban;
                if (typeof r.korban === 'string') {
                  try { korbanObj = JSON.parse(r.korban); } catch (e) { korbanObj = { deskripsi: r.korban }; }
                }
                return {
                  id: String(r.id),
                  ticketId: r.ticketId || r.ticket_id || r.ticketid || r.id,
                  namaPelapor: r.namaPelapor || r.nama_pelapor || r.namapelapor || 'Warga Tulis',
                  noWhatsapp: r.noWhatsapp || r.no_whatsapp || r.nowhatsapp || '',
                  desa: r.desa || 'Tulis',
                  alamat: r.alamat || 'Kecamatan Tulis',
                  latitude: Number(r.latitude) || -6.9536,
                  longitude: Number(r.longitude) || 109.8168,
                  jenisKejadian: r.jenisKejadian || r.jenis_kejadian || r.jeniskejadian || 'lainnya',
                  kategori: r.kategori || 'bencana',
                  waktuKejadian: r.waktuKejadian || r.waktu_kejadian || r.waktukejadian || new Date().toISOString(),
                  korban: korbanObj || { meninggal: 0, lukaBerat: 0, lukaRingan: 0, mengungsi: 0, rumahRusak: 0, deskripsi: 'Nihil' },
                  mediaUrl: r.mediaUrl || r.media_url || r.mediaurl || '',
                  mediaType: r.mediaType || r.media_type || r.mediatype || 'image',
                  deskripsi: r.deskripsi || '',
                  status: r.status || 'pending',
                  catatanPetugas: r.catatanPetugas || r.catatan_petugas || r.catatanpetugas || '',
                  petugasAssigned: r.petugasAssigned || r.petugas_assigned || r.petugasassigned || '',
                  createdAt: r.createdAt || r.created_at || r.createdat || new Date().toISOString(),
                  updatedAt: r.updatedAt || r.updated_at || r.updatedat || new Date().toISOString()
                };
              });
              setReports(parsed);
              break;
            }
          }
        }
      } catch (err) {
        console.error('Direct Supabase fetch error:', err);
      }
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          if (data.settings) setSettings(data.settings);
          if (data.contacts) setContacts(data.contacts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleReportSubmitted = (newReport: Report) => {
    setReports(prev => [newReport, ...prev]);
  };

  const handleSosTriggered = (sosReport: Report) => {
    setReports(prev => [sosReport, ...prev]);
  };

  const handleTrackTicket = (ticketId: string) => {
    setTrackingTicketId(ticketId);
    setActiveTab('track');
  };

  const handleUpdateReportStatus = async (
    id: string,
    status: ReportStatus,
    catatanPetugas: string,
    petugasAssigned: string
  ) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, catatanPetugas, petugasAssigned })
      });
      const data = await res.json();
      if (data.success) {
        setReports(prev => prev.map(r => (r.id === id ? data.report : r)));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setReports(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings, newContacts: EmergencyContact[]) => {
    setSettings(newSettings);
    setContacts(newContacts);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings, contacts: newContacts })
      });
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* PWA offline/install detector */}
      <PWAInstaller />

      {/* Navigation Top Header */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSosModal={() => setIsSosOpen(true)}
        openEwsModal={() => setIsEwsOpen(true)}
        openAuthModal={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        settings={settings}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 md:pb-0">
        {activeTab === 'map' && (
          <MapView
            reports={reports}
            onSelectReport={report => {
              handleTrackTicket(report.ticketId);
            }}
          />
        )}

        {activeTab === 'new-report' && (
          <ReportFormModal
            onReportSubmitted={handleReportSubmitted}
            onTrackTicket={handleTrackTicket}
            settings={settings}
          />
        )}

        {activeTab === 'track' && (
          <ReportTrackingModal initialTicketId={trackingTicketId} />
        )}

        {activeTab === 'ai-chatbot' && <AiMitigationChatbot settings={settings} />}

        {activeTab === 'contacts' && <EmergencyContactsPanel contacts={contacts} />}

        {activeTab === 'admin' && (
          <AdminPanel
            reports={reports}
            onUpdateReportStatus={handleUpdateReportStatus}
            onDeleteReport={handleDeleteReport}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            contacts={contacts}
            currentUser={currentUser}
            openAuthModal={() => setIsAuthOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSosModal={() => setIsSosOpen(true)}
        currentUser={currentUser}
        openAuthModal={() => setIsAuthOpen(true)}
      />

      {/* Modals */}
      <SosButtonModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        onSosTriggered={handleSosTriggered}
      />

      <EwsBannerModal
        isOpen={isEwsOpen}
        onClose={() => setIsEwsOpen(false)}
        ewsNotice={settings.ewsNotice}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={user => {
          setCurrentUser(user);
          setActiveTab('admin');
        }}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-200 uppercase tracking-wider">
            {settings.appName} - {settings.agencyName}
          </p>
          <p className="text-[11px] text-slate-400">
            {settings.address} | Posko Utama Hotline 24 Jam: {settings.contactPhone}
          </p>
          <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
            © 2026 SIPITUNG (Siaga Pitulungan). Sistem Informasi Aduan Bencana & Ketentraman Ketertiban Umum.
          </p>
        </div>
      </footer>
    </div>
  );
}
