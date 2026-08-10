import React, { useEffect, useState } from 'react';
import { 
  listarPedidosRestaurante, 
  listarProdutosRestaurante, 
  escutarPedidosRestaurante,
  calcularDiasRestantesPlano,
  formatarDataVencimentoPlano,
  limparMotivoRejeicao,
  escutarAvisosGeraisAtivos
} from '../services/database';
import { Pedido, Produto, Restaurante, Usuario, AvisoGeral } from '../types';
import { OrderCard } from '../components/OrderCard';
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  UtensilsCrossed, 
  TrendingUp, 
  ExternalLink,
  PlusCircle,
  AlertCircle,
  Gift,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Headphones,
  MessageCircle,
  Mail,
  Megaphone,
  Sparkles,
  Bell,
  RefreshCw,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SuporteModal } from '../components/SuporteModal';

interface DashboardProps {
  usuario: Usuario | null;
  restaurante: Restaurante | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ usuario, restaurante }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuporteOpen, setIsSuporteOpen] = useState(false);
  const [motivoLido, setMotivoLido] = useState(false);

  // Avisos gerais transmitidos pelo Admin do SaaS
  const [avisosAtivos, setAvisosAtivos] = useState<AvisoGeral[]>([]);
  const [avisosFechadosIds, setAvisosFechadosIds] = useState<string[]>([]);

  useEffect(() => {
    // Escutar avisos do sistema em tempo real
    const unsubAvisos = escutarAvisosGeraisAtivos((lista) => {
      setAvisosAtivos(lista);
    });

    if (!restaurante?.id) {
      setLoading(false);
      return () => unsubAvisos();
    }

    // Carregar produtos
    async function carregarProdutos() {
      try {
        const prods = await listarProdutosRestaurante(restaurante!.id);
        setProdutos(prods);
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
      }
    }

    carregarProdutos();

    // Escutar pedidos em tempo real no Firestore
    const unsubscribe = escutarPedidosRestaurante(restaurante.id, (pedidosLista) => {
      setPedidos(pedidosLista);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubAvisos();
    };
  }, [restaurante]);

  // Cálculos de métricas reais do Firestore
  const hojeStr = new Date().toISOString().split('T')[0];

  const pedidosHoje = pedidos.filter(p => p.data.startsWith(hojeStr) && p.status !== 'Cancelado');
  const vendasHoje = pedidosHoje.reduce((acc, p) => acc + p.valorTotal, 0);

  const pedidosPendentes = pedidos.filter(p => 
    p.status === 'Novo pedido' || p.status === 'Aceito' || p.status === 'Preparando' || p.status === 'Saiu para entrega'
  );

  const pedidosConcluidos = pedidos.filter(p => p.status === 'Finalizado');

  const diasRestantes = restaurante 
    ? calcularDiasRestantesPlano(restaurante.expiracaoPlano, restaurante.criadoEm)
    : 30;

  const isPlanoGratuito = !restaurante?.plano || 
    restaurante.plano.toLowerCase().includes('degusta') || 
    restaurante.plano.toLowerCase().includes('grátis') || 
    restaurante.plano.toLowerCase().includes('gratis');

  const isPlanoPagoAtivo = !isPlanoGratuito && (
    restaurante?.statusPagamento === 'Confirmado Pix' || 
    restaurante?.ativo !== false
  );

  return (
    <div className="space-y-6">
      {/* Avisos Transmitidos pelo Administrador do SaaS */}
      {avisosAtivos.filter(a => !avisosFechadosIds.includes(a.id)).map((aviso) => (
        <div
          key={aviso.id}
          className={`p-4 sm:p-5 rounded-2xl border text-left shadow-md transition-all space-y-2 relative ${
            aviso.tipo === 'novidade'
              ? 'bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900 border-indigo-500/40 text-white'
              : aviso.tipo === 'info'
              ? 'bg-gradient-to-r from-blue-900 via-slate-900 to-slate-950 border-blue-500/40 text-white'
              : aviso.tipo === 'alerta'
              ? 'bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 border-amber-500/50 text-amber-100'
              : 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 text-slate-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              {aviso.tipo === 'novidade' && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-black uppercase tracking-wider border border-purple-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-300" />
                  Novidade MenuPro
                </span>
              )}
              {aviso.tipo === 'info' && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-black uppercase tracking-wider border border-blue-400/30 flex items-center gap-1">
                  <Bell className="w-3 h-3 text-blue-300" />
                  Comunicado do Sistema
                </span>
              )}
              {aviso.tipo === 'alerta' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-black uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-300" />
                  Alerta do Sistema
                </span>
              )}
              {aviso.tipo === 'manutencao' && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-wider border border-slate-500/30 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-slate-300" />
                  Aviso de Manutenção
                </span>
              )}

              <span className="text-[10px] text-slate-300 font-mono">
                {new Date(aviso.dataCriacao).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <button
              onClick={() => setAvisosFechadosIds(prev => [...prev, aviso.id])}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              title="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3 className="font-black text-sm sm:text-base text-white leading-snug">
              {aviso.titulo}
            </h3>
            <p className="mt-1 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
              {aviso.mensagem}
            </p>
          </div>

          {aviso.linkDestino && (
            <div className="pt-1">
              <a
                href={aviso.linkDestino}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-black shadow-sm transition-all"
              >
                <span>{aviso.textoBotao || 'Ver Detalhes'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      ))}

      {/* Banner de Aviso de Rejeição de Troca de Plano */}
      {restaurante?.motivoRejeicao && !motivoLido && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-black text-amber-950 text-sm">
                ⚠️ Solicitação de Mudança de Plano Rejeitada
              </strong>
              <p className="mt-0.5 leading-relaxed text-amber-900">
                {restaurante.motivoRejeicao}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              setMotivoLido(true);
              if (restaurante?.id) {
                await limparMotivoRejeicao(restaurante.id);
              }
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shrink-0 cursor-pointer text-xs"
          >
            Ciente / Ok
          </button>
        </div>
      )}

      {/* Banner de Aguardando Aprovação de Upgrade Pix */}
      {restaurante?.statusPagamento === 'Pendente Pix' && restaurante?.planoAnterior && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center gap-3 text-indigo-900 text-xs">
          <Clock className="w-5 h-5 text-indigo-600 shrink-0 animate-pulse" />
          <div>
            <strong className="block font-black text-indigo-950 text-xs uppercase tracking-wider">
              ⏳ Solicitação de Troca de Plano em Análise
            </strong>
            <p className="mt-0.5 text-indigo-800">
              Sua solicitação do novo plano (<strong>{restaurante.planoSolicitado || restaurante.plano}</strong>) está aguardando confirmação do Pix pelo suporte. Seu plano atual (<strong>{restaurante.planoAnterior}</strong>) continua totalmente ativo.
            </p>
          </div>
        </div>
      )}

      {/* Banner de Status do Teste Grátis / Plano */}
      {usuario?.tipo === 'admin' ? (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-indigo-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white">Conta Administrador Master SaaS</span>
                <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-400/40 uppercase tracking-wider">
                  SaaS Admin
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Você está conectado com a conta Master ({usuario.email}). Acesso livre a todas as telas do sistema e gestão completa da plataforma.
              </p>
            </div>
          </div>

          <Link
            to="/saas-admin"
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>Gerenciar SaaS Admin</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : isPlanoPagoAtivo ? (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 rounded-2xl border border-emerald-600/70 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-white">Plano Ativo: {restaurante?.plano}</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  Vence em: {formatarDataVencimentoPlano(restaurante?.expiracaoPlano, restaurante?.criadoEm)}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Sua assinatura do <strong>{restaurante?.plano}</strong> está ativa até <strong>{formatarDataVencimentoPlano(restaurante?.expiracaoPlano, restaurante?.criadoEm)}</strong> ({diasRestantes} dias restantes).
              </p>
            </div>
          </div>

          <Link
            to="/configuracoes"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-all shrink-0"
          >
            Gerenciar Plano
          </Link>
        </div>
      ) : diasRestantes <= 0 ? (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white p-5 rounded-2xl border border-rose-700/80 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white uppercase tracking-wider">🔴 Teste Grátis Expirado</span>
                <span className="bg-rose-500/30 text-rose-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-rose-400/40">
                  Suspenso
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-1">
                Seu período de teste gratuito acabou. Escolha um plano para reativar seu cardápio e continuar recebendo pedidos ao vivo.
              </p>
            </div>
          </div>

          <Link
            to="/configuracoes"
            className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>Ativar Plano Agora</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : diasRestantes <= 7 ? (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white p-5 rounded-2xl border border-amber-600/70 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/30 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-amber-300">⚠️ Seu Teste Grátis está Acabando!</span>
                <span className="bg-amber-500/30 text-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-400/40">
                  Restam {diasRestantes} dia{diasRestantes > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Faltam apenas {diasRestantes} dia{diasRestantes > 1 ? 's' : ''} para o fim do seu teste de 30 dias. Ative um plano para garantir que seu cardápio continue no ar sem interrupções!
              </p>
            </div>
          </div>

          <Link
            to="/configuracoes"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all shrink-0"
          >
            Ativar Plano
          </Link>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 rounded-2xl border border-emerald-800/60 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-white">{restaurante?.plano || 'Plano Degustação 30 Dias Grátis'}</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  Vence em: {formatarDataVencimentoPlano(restaurante?.expiracaoPlano, restaurante?.criadoEm)}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Aproveite acesso completo até <strong>{formatarDataVencimentoPlano(restaurante?.expiracaoPlano, restaurante?.criadoEm)}</strong> ({diasRestantes} dias restantes).
              </p>
            </div>
          </div>

          <Link
            to="/configuracoes"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all shrink-0"
          >
            Gerenciar Plano
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Painel do Restaurante</h1>
            <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full border ${
              usuario?.tipo === 'admin'
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                : isPlanoPagoAtivo 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {usuario?.tipo === 'admin' ? 'Administrador Master' : (restaurante?.plano || 'Plano Degustação')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visão geral de desempenho e pedidos em tempo real do {restaurante?.nome || 'seu restaurante'}
          </p>
        </div>

        {restaurante?.slug && (
          <a
            href={`/cardapio/${restaurante.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
          >
            <span>Ver Cardápio Ao Vivo</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Alerta de Chave Pix Pendente de Cadastro */}
      {!restaurante?.chavePix && (
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100/80 rounded-xl text-amber-700 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-amber-950">
                Chave Pix do Estabelecimento não cadastrada
              </h4>
              <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                Os seus clientes estão vendo temporariamente seu celular ({restaurante?.whatsapp || restaurante?.telefone || 'do cadastro'}) como opção Pix. Cadastre sua Chave Pix oficial (CPF, CNPJ, E-mail, Chave Aleatória, etc.) para personalizar o recebimento no cardápio.
              </p>
            </div>
          </div>
          <Link
            to="/configuracoes"
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 self-end sm:self-auto"
          >
            <span>Cadastrar Chave Pix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Vendas do Dia */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Vendas do Dia</span>
            <span className="text-2xl font-black text-slate-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vendasHoje)}
            </span>
          </div>
        </div>

        {/* Pedidos Pendentes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pedidos Pendentes</span>
            <span className="text-2xl font-black text-slate-900">{pedidosPendentes.length}</span>
          </div>
        </div>

        {/* Pedidos Concluídos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Concluídos</span>
            <span className="text-2xl font-black text-slate-900">{pedidosConcluidos.length}</span>
          </div>
        </div>

        {/* Quantidade de Produtos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Produtos no Menu</span>
            <span className="text-2xl font-black text-slate-900">{produtos.length}</span>
          </div>
        </div>
      </div>

      {/* Quick Setup Warning if no products yet */}
      {produtos.length === 0 && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Seu cardápio ainda não possui produtos cadastrados!</h4>
              <p className="text-xs text-amber-800 mt-0.5">Cadastre seus primeiros pratos ou bebidas para liberar o cardápio público aos clientes.</p>
            </div>
          </div>
          <Link
            to="/produtos"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Produtos</span>
          </Link>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Últimos Pedidos em Tempo Real</h3>
            <p className="text-xs text-slate-500">Acompanhamento automático e atualizações ao vivo</p>
          </div>

          <Link to="/pedidos" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
            Ver Todos os Pedidos →
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Carregando dados...</div>
        ) : pedidos.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <span className="font-bold text-slate-700 text-base block">Nenhum dado encontrado</span>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Assim que os clientes fizerem os primeiros pedidos pelo seu cardápio digital, eles aparecerão aqui instantaneamente.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pedidos.slice(0, 6).map((pedido) => (
              <OrderCard
                key={pedido.id}
                pedido={pedido}
                onUpdateStatus={async (id, status) => {
                  const { atualizarStatusPedido } = await import('../services/database');
                  await atualizarStatusPedido(id, status);
                }}
                onResponderCancelamento={async (id, aceito, motivo) => {
                  const { responderSolicitacaoCancelamento } = await import('../services/database');
                  await responderSolicitacaoCancelamento(id, aceito, motivo);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card de Atendimento e Suporte do Sistema */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl border border-slate-700/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-base text-white">Precisa de Ajuda ou Suporte Técnico?</h4>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                Atendimento Oficial
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Fale direto com a equipe do MenuPro de acordo com o seu plano por WhatsApp (92 98239-1133) ou E-mail (menuprosuporte@gmail.com).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsSuporteOpen(true)}
            className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Headphones className="w-4 h-4" />
            <span>Solicitar Suporte</span>
          </button>
        </div>
      </div>

      <SuporteModal
        isOpen={isSuporteOpen}
        onClose={() => setIsSuporteOpen(false)}
        usuario={usuario}
        restaurante={restaurante}
      />
    </div>
  );
};
