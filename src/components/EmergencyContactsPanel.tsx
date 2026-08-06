import React from 'react';
import {
  PhoneCall,
  MessageSquare,
  ShieldAlert,
  Flame,
  LifeBuoy,
  Ambulance,
  Building2,
  CloudRain,
  Phone
} from 'lucide-react';
import { EmergencyContact } from '../types';

interface EmergencyContactsPanelProps {
  contacts: EmergencyContact[];
}

export const EmergencyContactsPanel: React.FC<EmergencyContactsPanelProps> = ({ contacts }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white space-y-6 shadow-2xl">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-600/30 rounded-2xl border border-red-500/40">
              <PhoneCall className="w-8 h-8 text-yellow-300 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">DIREKTORI NOMOR DARURAT INTEGRASI</h2>
              <p className="text-xs text-slate-300">Panggilan Cepat Kedaruratan Bencana, Medis, Keamanan & Trantibum 24 Jam Bebas Pulsa</p>
            </div>
          </div>
        </div>

        {/* Hotlines Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(c => (
            <div
              key={c.id}
              className="bg-slate-950 border border-slate-800 hover:border-red-500/50 p-5 rounded-2xl space-y-3 transition group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 uppercase">
                  {c.category}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-slate-100 group-hover:text-red-400 transition">{c.name}</h4>
                <p className="text-2xl font-mono font-black text-amber-400 mt-1">{c.number}</p>
              </div>

              <div className="pt-2 flex gap-2">
                <a
                  href={`tel:${c.number.replace(/[^0-9]/g, '')}`}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Panggil Sekarang</span>
                </a>

                <a
                  href={`https://wa.me/62${c.number.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center space-x-1 transition"
                  title="WhatsApp Posko"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
