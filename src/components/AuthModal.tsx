import React, { useState } from 'react';
import { LogIn, ShieldCheck, X } from 'lucide-react';
import { UserRole } from '../types';
import { PRESET_USERS } from '../data/initialData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = PRESET_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      onLoginSuccess(found);
    } else {
      onLoginSuccess({
        name: email ? email.split('@')[0] : 'Administrator Pusdalops',
        role: 'admin',
        email: email || 'admin@sipitung.go.id',
        phone: '081234567890',
        unit: 'Pusdalops Administrator'
      });
    }
    setEmail('');
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-white my-auto">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-red-700 to-amber-700 flex items-center justify-between border-b border-red-500/40">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-yellow-300" />
            <h3 className="font-extrabold text-base text-white uppercase tracking-wider">LOGIN PETUGAS & ADMIN</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/20 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Form Login Manual */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">Email / No. WhatsApp / NIP</label>
              <input
                type="text"
                required
                placeholder="Masukkan Email, No. WhatsApp, atau NIP"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">Kata Sandi</label>
              <input
                type="password"
                required
                placeholder="Masukkan Kata Sandi"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl uppercase tracking-wider transition shadow-lg shadow-red-950/50 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Sekarang</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

