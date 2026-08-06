import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Wifi, WifiOff, X } from 'lucide-react';

export const PWAInstaller: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs px-4 py-2 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>
              <strong>Mode Luring (Offline):</strong> Koneksi internet terputus. Data laporan lokal tetap tersimpan di perangkat Anda.
            </span>
          </div>
          <span className="text-[10px] bg-amber-800 px-2 py-0.5 rounded uppercase font-bold">Offline</span>
        </div>
      )}

      {/* PWA Install Banner */}
      {deferredPrompt && !isInstalled && !dismissed && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-red-500/40 flex items-center justify-between gap-3 animate-bounce-short">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100">Pasang Aplikasi SIPITUNG (PWA)</p>
              <p className="text-xs text-slate-400">Akses cepat layar utama & laporan offline 24/7</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition"
            >
              Pasang
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
