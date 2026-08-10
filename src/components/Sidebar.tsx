import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Settings, 
  ShieldAlert,
  QrCode,
  Utensils,
  X,
  Headphones
} from 'lucide-react';
import { Usuario, Restaurante } from '../types';
import { SuporteModal } from './SuporteModal';

interface SidebarProps {
  usuario: Usuario | null;
  restaurante: Restaurante | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ usuario, restaurante, isOpen, onClose }) => {
  const [isSuporteOpen, setIsSuporteOpen] = useState(false);
  const isSaasAdmin = usuario?.tipo === 'admin';

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, role: 'restaurante' },
    { label: 'Produtos', path: '/produtos', icon: UtensilsCrossed, role: 'restaurante' },
    { label: 'Pedidos', path: '/pedidos', icon: ShoppingBag, role: 'restaurante' },
    { label: 'Mesas / Garçom', path: '/mesas', icon: Utensils, role: 'restaurante' },
    { label: 'Clientes', path: '/clientes', icon: Users, role: 'restaurante' },
    { label: 'Financeiro', path: '/financeiro', icon: TrendingUp, role: 'restaurante' },
    { label: 'Configurações', path: '/configuracoes', icon: Settings, role: 'restaurante' },
  ];

  return (
    <>
      <SuporteModal 
        isOpen={isSuporteOpen} 
        onClose={() => setIsSuporteOpen(false)} 
        usuario={usuario} 
        restaurante={restaurante} 
      />

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Header in Sidebar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-white text-lg">MenuPro</span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Restaurant Banner Info */}
        {restaurante && usuario?.tipo !== 'admin' && (
          <div className="p-4 border-b border-slate-800 bg-slate-800/40">
            <div className="text-xs text-slate-400 font-medium">Restaurante Conectado</div>
            <div className="text-sm font-bold text-white truncate">{restaurante.nome}</div>
            <div className="mt-2 flex items-center gap-2">
              <a
                href={`/cardapio/${restaurante.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Cardápio QR Code</span>
              </a>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Gestão do Restaurante
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all
                  ${isActive 
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Solicitar Suporte Item */}
          <button
            onClick={() => {
              if (onClose) onClose();
              setIsSuporteOpen(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 transition-all cursor-pointer border border-emerald-500/20 mt-2"
          >
            <Headphones className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>Solicitar Suporte</span>
          </button>

          {isSaasAdmin && (
            <div className="pt-6 border-t border-slate-800 mt-6">
              <div className="px-3 py-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Administrador SaaS
              </div>
              <NavLink
                to="/saas-admin"
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all
                  ${isActive 
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm' 
                    : 'text-indigo-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <ShieldAlert className="w-5 h-5 shrink-0 text-indigo-400" />
                <span>Painel SaaS Admin</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          MenuPro v1.0.0 &bull; Sistema Profissional
        </div>
      </aside>
    </>
  );
};
