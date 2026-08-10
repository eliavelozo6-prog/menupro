import React, { useState } from 'react';
import { Menu, LogOut, ExternalLink, Store, Shield, Headphones } from 'lucide-react';
import { Usuario, Restaurante } from '../types';
import { logoutUsuario } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { SuporteModal } from './SuporteModal';

interface HeaderProps {
  usuario: Usuario | null;
  restaurante: Restaurante | null;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ usuario, restaurante, onToggleSidebar }) => {
  const [isSuporteOpen, setIsSuporteOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUsuario();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  return (
    <>
      <SuporteModal 
        isOpen={isSuporteOpen} 
        onClose={() => setIsSuporteOpen(false)} 
        usuario={usuario} 
        restaurante={restaurante} 
      />

      <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            title="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-base sm:text-lg shadow-xs shrink-0">
              M
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight leading-none block">
                Menu<span className="text-emerald-600">Pro</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium tracking-wide uppercase">Cardápio Digital SaaS</span>
            </div>
          </div>

          {restaurante && usuario?.tipo !== 'admin' && (
            <div className="hidden md:flex items-center gap-2 ml-6 pl-6 border-l border-slate-200">
              <Store className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-800">{restaurante.nome}</span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${restaurante.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {restaurante.ativo ? 'Ativo' : 'Bloqueado'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {usuario?.tipo !== 'admin' && (
            <button
              onClick={() => setIsSuporteOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Solicitar Suporte Técnico"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Suporte</span>
            </button>
          )}

          {restaurante?.slug && usuario?.tipo !== 'admin' && (
            <a
              href={`/cardapio/${restaurante.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-lg transition-colors"
            >
              <span className="hidden sm:inline">Ver Meu Cardápio</span>
              <span className="sm:hidden">Cardápio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {usuario?.tipo === 'admin' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin SaaS</span>
            </span>
          )}

          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-medium text-slate-800 leading-tight">{usuario?.nome || 'Usuário'}</span>
            <span className="text-xs text-slate-500">{usuario?.email}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Sair da Conta"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
    </>
  );
};
