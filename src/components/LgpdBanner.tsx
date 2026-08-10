import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, CheckCircle2, X } from 'lucide-react';

export const LgpdBanner: React.FC = () => {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const consentimento = localStorage.getItem('menupro_lgpd_consent');
    if (!consentimento) {
      // Exibe o banner após 1 segundo para animação suave
      const timer = setTimeout(() => setVisivel(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAceitarTodos = () => {
    localStorage.setItem('menupro_lgpd_consent', JSON.stringify({
      status: 'aceito_todos',
      data: new Date().toISOString()
    }));
    setVisivel(false);
  };

  const handleApenasEssenciais = () => {
    localStorage.setItem('menupro_lgpd_consent', JSON.stringify({
      status: 'apenas_essenciais',
      data: new Date().toISOString()
    }));
    setVisivel(false);
  };

  if (!visivel) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 text-slate-100 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md relative">
        <button
          onClick={handleApenasEssenciais}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="Fechar e aceitar essenciais"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              Sua Privacidade & LGPD
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Utilizamos cookies e armazenamento local essenciais para garantir o correto funcionamento do cardápio e segurança dos seus pedidos, em conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong>.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                onClick={handleAceitarTodos}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aceitar Todos
              </button>

              <button
                onClick={handleApenasEssenciais}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition-all border border-slate-700 cursor-pointer"
              >
                Apenas Essenciais
              </button>

              <Link
                to="/politica-de-privacidade"
                onClick={() => setVisivel(false)}
                className="text-xs text-emerald-400 hover:underline font-medium ml-auto"
              >
                Ler Política
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
