import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Clock, ShieldCheck, LogOut, Copy, Check, XCircle, AlertCircle } from 'lucide-react';
import { escutarAuth, logoutUsuario } from '../services/auth';
import { buscarRestaurantePorId, escutarRestaurantePorId, obterConfiguracoesSaas } from '../services/database';
import { Usuario, Restaurante, ConfiguracoesSaas } from '../types';

import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';

import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { CadastroRestaurante } from '../pages/CadastroRestaurante';
import { Dashboard } from '../pages/Dashboard';
import { Produtos } from '../pages/Produtos';
import { Pedidos } from '../pages/Pedidos';
import { Clientes } from '../pages/Clientes';
import { Financeiro } from '../pages/Financeiro';
import { Configuracoes } from '../pages/Configuracoes';
import { Mesas } from '../pages/Mesas';
import { SaasAdmin } from '../pages/SaasAdmin';
import { CardapioCliente } from '../pages/CardapioCliente';
import { AcompanharPedido } from '../pages/AcompanharPedido';
import { PoliticaPrivacidade } from '../pages/PoliticaPrivacidade';
import { TermosDeUso } from '../pages/TermosDeUso';
import { LgpdBanner } from '../components/LgpdBanner';

// Layout do Painel com Header e Sidebar
const LayoutPainel: React.FC<{
  usuario: Usuario | null;
  restaurante: Restaurante | null;
  onRestauranteAtualizado: () => void;
  children: React.ReactNode;
}> = ({ usuario, restaurante, onRestauranteAtualizado, children }) => {
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [configSaas, setConfigSaas] = useState<ConfiguracoesSaas | null>(null);
  const [chaveCopiada, setChaveCopiada] = useState(false);

  useEffect(() => {
    obterConfiguracoesSaas().then(setConfigSaas);
  }, []);

  const isRejeitado = usuario?.tipo !== 'admin' && restaurante && restaurante.statusPagamento === 'Rejeitado Pix';
  const pendenteAprovacao = 
    usuario?.tipo !== 'admin' && 
    restaurante && 
    !isRejeitado &&
    (restaurante.statusPagamento === 'Pendente Pix' || restaurante.ativo === false) &&
    !restaurante.planoAnterior; // Se tiver planoAnterior e estava ativo, não bloqueia o acesso ao painel durante o upgrade

  const chavePixOficial = configSaas?.chavePix || '38992097063';
  const titularOficial = configSaas?.titularPix || 'Élia Velozo de Oliveira';
  const bancoOficial = configSaas?.bancoPix || 'Nubank';
  const whatsappAdmin = (configSaas?.whatsappSuporte || '92982391133').replace(/\D/g, '');

  const handleCopiarChave = () => {
    navigator.clipboard.writeText(chavePixOficial);
    setChaveCopiada(true);
    setTimeout(() => setChaveCopiada(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header
        usuario={usuario}
        restaurante={restaurante}
        onToggleSidebar={() => setSidebarAberta(!sidebarAberta)}
      />

      <div className="flex flex-1">
        <Sidebar
          usuario={usuario}
          restaurante={restaurante}
          isOpen={sidebarAberta}
          onClose={() => setSidebarAberta(false)}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {isRejeitado ? (
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-rose-200 max-w-3xl mx-auto space-y-6 my-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 border border-rose-300 flex items-center justify-center shrink-0">
                  <XCircle className="w-7 h-7" />
                </div>
                <div>
                  <span className="inline-block bg-rose-100 text-rose-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-rose-300 mb-1">
                    ❌ Pagamento Pix Rejeitado
                  </span>
                  <h2 className="text-xl font-black text-slate-900">
                    Olá, {usuario?.nome || 'Cliente'}!
                  </h2>
                  <p className="text-xs text-slate-600">
                    O pagamento Pix para ativação do restaurante <strong className="text-slate-900">{restaurante?.nome}</strong> foi rejeitado.
                  </p>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl space-y-2">
                <h3 className="font-extrabold text-xs text-rose-950 uppercase tracking-wide flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>Motivo da Rejeição:</span>
                </h3>
                <p className="text-xs text-rose-900 font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-rose-200/60">
                  {restaurante?.motivoRejeicao || 'O comprovante Pix enviado não foi identificado ou não correspondeu ao valor do plano contratado.'}
                </p>
              </div>

              {/* Contato com Suporte */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wide block">
                  💬 Precisa de Ajuda? Entre em Contato com o Suporte:
                </span>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <a
                    href={`https://wa.me/55${whatsappAdmin}?text=${encodeURIComponent(`Olá! Meu restaurante "${restaurante?.nome || ''}" teve o Pix rejeitado. Gostaria de enviar um novo comprovante.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-center"
                  >
                    💬 WhatsApp: (92) 98239-1133
                  </a>
                  <a
                    href="mailto:menuprosuporte@gmail.com?subject=Suporte%20Pix%20Rejeitado"
                    className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-center"
                  >
                    ✉️ E-mail: menuprosuporte@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={async () => {
                    await logoutUsuario();
                    window.location.href = '/login';
                  }}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          ) : pendenteAprovacao ? (
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-amber-200 max-w-3xl mx-auto space-y-6 my-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 border border-amber-300 flex items-center justify-center shrink-0">
                  <Clock className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <span className="inline-block bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-amber-300 mb-1">
                    ⏳ Conta Logada — Aguardando Aprovação do Pix
                  </span>
                  <h2 className="text-xl font-black text-slate-900">
                    Olá, {usuario?.nome || 'Cliente'}!
                  </h2>
                  <p className="text-xs text-slate-600">
                    Sua conta do restaurante <strong className="text-slate-900">{restaurante?.nome}</strong> já foi criada no sistema.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl space-y-2">
                <h3 className="font-extrabold text-xs text-amber-950 uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Plano Escolhido: {restaurante?.plano}</span>
                </h3>
                <p className="text-xs text-amber-900 leading-relaxed">
                  As funcionalidades do seu painel e o seu cardápio público estão <strong>temporariamente suspensas</strong> até que o Administrador do MenuPro confirme o recebimento do seu pagamento Pix.
                </p>
              </div>

              {/* Box da Chave Pix Oficial do App */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wide block">
                  💳 Dados da Chave Pix Oficial do MenuPro:
                </span>
                <div className="bg-white border border-slate-200 p-4 rounded-xl text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-slate-500 font-medium block">Chave Pix (Oficial do App):</span>
                      <strong className="text-slate-900 text-sm font-extrabold font-mono select-all">{chavePixOficial}</strong>
                    </div>
                    <button
                      onClick={handleCopiarChave}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                    >
                      {chaveCopiada ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Chave Copiada!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Chave Pix</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium block">Titular da Conta:</span>
                      <strong className="text-slate-900 font-bold">{titularOficial}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">Banco:</span>
                      <strong className="text-slate-900 font-bold">{bancoOficial}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp do Administrador */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <a
                  href={`https://wa.me/55${whatsappAdmin}?text=${encodeURIComponent(`Olá! Fiz o cadastro do restaurante "${restaurante?.nome || ''}" no MenuPro (Plano: ${restaurante?.plano || ''}) e gostaria de enviar o comprovante Pix para liberação.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2"
                >
                  💬 Enviar Comprovante para o WhatsApp do ADM ({configSaas?.whatsappSuporte || '(92) 98239-1133'})
                </a>

                <button
                  onClick={async () => {
                    await logoutUsuario();
                    window.location.href = '/login';
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center animate-pulse">
                ✨ Assim que o Administrador aprovar no painel SaaS, seu aplicativo será liberado instantaneamente!
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
};

export const AppRoutes: React.FC = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const carregarRestaurante = async (restauranteId?: string) => {
    if (!restauranteId) {
      setRestaurante(null);
      return;
    }
    try {
      const rest = await buscarRestaurantePorId(restauranteId);
      setRestaurante(rest);
    } catch (err) {
      console.error('Erro ao buscar restaurante:', err);
    }
  };

  useEffect(() => {
    let unsubscribeRest: (() => void) | null = null;

    const unsubscribeAuth = escutarAuth((user) => {
      setUsuario(user);
      const isAdmin = user?.tipo === 'admin' || user?.email?.toLowerCase() === 'eliavelozo6@gmail.com';
      
      if (!isAdmin && user?.restauranteId) {
        if (unsubscribeRest) unsubscribeRest();
        unsubscribeRest = escutarRestaurantePorId(user.restauranteId, (rest) => {
          setRestaurante(rest);
        });
      } else {
        if (unsubscribeRest) unsubscribeRest();
        setRestaurante(null);
      }
      setCarregandoAuth(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRest) unsubscribeRest();
    };
  }, []);

  if (carregandoAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-2xl animate-bounce shadow-lg">
          M
        </div>
        <p className="text-sm font-medium text-slate-300">Carregando MenuPro SaaS...</p>
      </div>
    );
  }

  // Componente de Rota Protegida
  const RotaProtegida = ({ children }: { children: React.ReactNode }) => {
    if (!usuario) {
      return <Navigate to="/login" replace />;
    }

    return (
      <LayoutPainel
        usuario={usuario}
        restaurante={restaurante}
        onRestauranteAtualizado={() => {
          if (usuario?.restauranteId) carregarRestaurante(usuario.restauranteId);
        }}
      >
        {children}
      </LayoutPainel>
    );
  };

  // Componente de Rota Protegida para Administrador SaaS
  const RotaProtegidaAdmin = ({ children }: { children: React.ReactNode }) => {
    if (!usuario) {
      return <Navigate to="/login" replace />;
    }
    if (usuario.tipo !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return (
      <LayoutPainel
        usuario={usuario}
        restaurante={restaurante}
        onRestauranteAtualizado={() => {
          if (usuario?.restauranteId) carregarRestaurante(usuario.restauranteId);
        }}
      >
        {children}
      </LayoutPainel>
    );
  };

  return (
    <>
      <LgpdBanner />
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro-restaurante" element={<CadastroRestaurante />} />
        <Route path="/cardapio/:slug" element={<CardapioCliente />} />
        <Route path="/pedido/:pedidoId" element={<AcompanharPedido />} />
        <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
        <Route path="/termos-de-uso" element={<TermosDeUso />} />

      {/* Rotas do Painel do Restaurante */}
      <Route
        path="/dashboard"
        element={
          <RotaProtegida>
            <Dashboard usuario={usuario} restaurante={restaurante} />
          </RotaProtegida>
        }
      />
      <Route
        path="/produtos"
        element={
          <RotaProtegida>
            <Produtos usuario={usuario} restaurante={restaurante} />
          </RotaProtegida>
        }
      />
      <Route
        path="/pedidos"
        element={
          <RotaProtegida>
            <Pedidos usuario={usuario} restaurante={restaurante} />
          </RotaProtegida>
        }
      />
      <Route
        path="/mesas"
        element={
          <RotaProtegida>
            <Mesas usuario={usuario} restaurante={restaurante} />
          </RotaProtegida>
        }
      />
      <Route
        path="/clientes"
        element={
          <RotaProtegida>
            <Clientes usuario={usuario} restaurante={restaurante} />
          </RotaProtegida>
        }
      />
      <Route
        path="/financeiro"
        element={
          <RotaProtegida>
            <Financeiro usuario={usuario} restaurante={restaurante} />
          </RotaProtegida>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <RotaProtegida>
            <Configuracoes
              usuario={usuario}
              restaurante={restaurante}
              onRestauranteAtualizado={() => {
                if (usuario?.restauranteId) carregarRestaurante(usuario.restauranteId);
              }}
            />
          </RotaProtegida>
        }
      />

      {/* Rota do Administrador SaaS */}
      <Route
        path="/saas-admin"
        element={
          <RotaProtegidaAdmin>
            <SaasAdmin usuario={usuario} />
          </RotaProtegidaAdmin>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
};
