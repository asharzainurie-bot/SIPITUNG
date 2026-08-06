import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, RefreshCw, ShieldCheck, HelpCircle } from 'lucide-react';
import { AppSettings, FaqItem } from '../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  source?: 'manual_admin' | 'gemini' | 'manual_fallback';
}

interface AiMitigationChatbotProps {
  settings?: AppSettings;
}

export const AiMitigationChatbot: React.FC<AiMitigationChatbotProps> = ({ settings }) => {
  const adminFaqs = settings?.chatbotFaqs || [];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: 'Salam Siaga! Saya **Mesin Balasan Otomatis SIPITUNG**, Asisten Informasi Pertanyaan & Jawaban resmi dari Admin Posko Pusdalops Kecamatan Tulis.\n\nSilakan pilih atau ketik pertanyaan di bawah untuk mendapatkan jawaban otomatis yang dirancang khusus oleh Admin.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      source: 'manual_admin'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = adminFaqs.length > 0
    ? adminFaqs.map(f => f.question)
    : [
        'Bagaimana prosedur evakuasi mandiri saat terjadi banjir?',
        'Apa yang harus dilakukan jika terjadi gempa bumi?',
        'Bagaimana cara melaporkan Pungli, Parkir Liar, atau Gangguan Ketertiban (Satpol PP)?',
        'Berapa nomor darurat yang bisa dihubungi 24 jam?',
        'Apa saja barang yang harus disiapkan dalam Tas Siaga Bencana (Emergency Kit)?'
      ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend })
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: 'msg-bot-' + Date.now(),
        sender: 'bot',
        text: data.reply || 'Maaf, terjadi kendala saat memproses jawaban otomatis.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'manual_admin'
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'bot',
        text: '⚠️ Terjadi gangguan koneksi ke mesin balasan otomatis. Silakan coba lagi.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[650px] text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <Bot className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white">AI CHAT - Mesin Balasan Otomatis Admin</h3>
                <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                  MANUAL ADMIN Q&A
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Pertanyaan & Jawaban Dirancang Langsung oleh Admin Pusdalops Tulis</p>
            </div>
          </div>
          <button
            onClick={() =>
              setMessages([
                {
                  id: 'msg-1',
                  sender: 'bot',
                  text: 'Percakapan direset. Silakan tanyakan informasi yang sudah disiapkan oleh Admin.',
                  timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                }
              ])
            }
            title="Reset Chat"
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-slate-950/80 p-2.5 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-amber-400 font-bold uppercase shrink-0 flex items-center space-x-1">
            <HelpCircle className="w-3 h-3" />
            <span>Pertanyaan Otomatis Admin:</span>
          </span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-amber-900/60 border border-slate-700 hover:border-amber-500/40 text-[11px] font-medium text-slate-200 transition shrink-0 whitespace-nowrap"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Message List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.sender === 'user' ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-950 font-black'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl space-y-2 shadow-md leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-red-600 text-white rounded-tr-none'
                    : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[9px] opacity-75">
                  {msg.sender === 'bot' && (
                    <span className="flex items-center space-x-1 text-amber-400 font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{msg.source === 'manual_admin' ? 'Jawaban Resmi Admin' : 'Sistem Otomatis'}</span>
                    </span>
                  )}
                  <span className="ml-auto">{msg.timestamp}</span>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs italic pl-2">
              <Bot className="w-4 h-4 animate-spin text-amber-400" />
              <span>Memproses jawaban dari basis data Admin...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ketik pertanyaan Anda (misal: 'banjir', 'pungli', 'evakuasi')..."
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 text-white text-xs px-4 py-3 rounded-2xl focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition flex items-center space-x-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
