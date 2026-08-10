import React, { useEffect, useState, useRef } from 'react';
import { Pedido, Restaurante, StatusPedido, Usuario } from '../types';
import { escutarPedidosRestaurante, atualizarStatusPedido, responderSolicitacaoCancelamento } from '../services/database';
import { OrderCard } from '../components/OrderCard';
import { ComandaThermalModal } from '../components/ComandaThermalModal';
import { 
  ShoppingBag, 
  Bell, 
  RefreshCw, 
  Printer, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  X 
} from 'lucide-react';

interface PedidosProps {
  usuario: Usuario | null;
  restaurante: Restaurante | null;
}

// Função de áudio campainha (Web Audio API)
let audioCtxGlobal: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtxGlobal) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioCtxGlobal = new AudioCtx();
    }
  }
  if (audioCtxGlobal && audioCtxGlobal.state === 'suspended') {
    audioCtxGlobal.resume().catch(() => {});
  }
  return audioCtxGlobal;
};

const tocarSomCampainha = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const agora = ctx.currentTime;

    // Primeiro toque da campainha (Ding - 880Hz / A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, agora);
    gain1.gain.setValueAtTime(0.6, agora);
    gain1.gain.exponentialRampToValueAtTime(0.0001, agora + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(agora);
    osc1.stop(agora + 0.8);

    // Harmônico do primeiro toque (1760Hz)
    const osc1h = ctx.createOscillator();
    const gain1h = ctx.createGain();
    osc1h.type = 'triangle';
    osc1h.frequency.setValueAtTime(1760, agora);
    gain1h.gain.setValueAtTime(0.2, agora);
    gain1h.gain.exponentialRampToValueAtTime(0.0001, agora + 0.6);
    osc1h.connect(gain1h);
    gain1h.connect(ctx.destination);
    osc1h.start(agora);
    osc1h.stop(agora + 0.6);

    // Segundo toque da campainha (Dong - 1174.66Hz / D6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, agora + 0.25);
    gain2.gain.setValueAtTime(0.8, agora + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.0001, agora + 1.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(agora + 0.25);
    osc2.stop(agora + 1.4);

    // Harmônico do segundo toque (2349.32Hz)
    const osc2h = ctx.createOscillator();
    const gain2h = ctx.createGain();
    osc2h.type = 'triangle';
    osc2h.frequency.setValueAtTime(2349.32, agora + 0.25);
    gain2h.gain.setValueAtTime(0.3, agora + 0.25);
    gain2h.gain.exponentialRampToValueAtTime(0.0001, agora + 1.0);
    osc2h.connect(gain2h);
    gain2h.connect(ctx.destination);
    osc2h.start(agora + 0.25);
    osc2h.stop(agora + 1.0);
  } catch (err) {
    console.warn('Não foi possível reproduzir som de alerta:', err);
  }
};

export const Pedidos: React.FC<PedidosProps> = ({ restaurante }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [pedidoParaImprimir, setPedidoParaImprimir] = useState<Pedido | null>(null);

  // Alerta Sonoro State & References
  const [somHabilitado, setSomHabilitado] = useState<boolean>(true);
  const [audioDesbloqueado, setAudioDesbloqueado] = useState<boolean>(false);
  const [ultimoPedidoNotificado, setUltimoPedidoNotificado] = useState<Pedido | null>(null);
  const primeiraCargaRef = useRef<boolean>(true);
  const pedidosConhecidosIdsRef = useRef<Set<string>>(new Set());

  // Desbloquear AudioContext na primeira interação do usuário com a página
  useEffect(() => {
    const desbloquear = () => {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => setAudioDesbloqueado(true));
        } else {
          setAudioDesbloqueado(true);
        }
      }
    };

    window.addEventListener('click', desbloquear);
    window.addEventListener('touchstart', desbloquear);

    return () => {
      window.removeEventListener('click', desbloquear);
      window.removeEventListener('touchstart', desbloquear);
    };
  }, []);

  useEffect(() => {
    if (!restaurante?.id) {
      setLoading(false);
      return;
    }

    // Escutar alterações de pedidos em tempo real no Firestore
    const unsubscribe = escutarPedidosRestaurante(restaurante.id, (pedidosLista) => {
      const novosIds = new Set(pedidosLista.map(p => p.id));

      if (primeiraCargaRef.current) {
        pedidosConhecidosIdsRef.current = novosIds;
        primeiraCargaRef.current = false;
      } else {
        // Verificar se há novos pedidos recém-chegados
        const pedidoNovo = pedidosLista.find(
          p => !pedidosConhecidosIdsRef.current.has(p.id) && p.status === 'Novo pedido'
        );

        if (pedidoNovo) {
          if (somHabilitado) {
            tocarSomCampainha();
          }

          // Vibração em dispositivos móveis
          if (navigator.vibrate) {
            try { navigator.vibrate([200, 100, 200, 100, 300]); } catch (e) {}
          }

          setUltimoPedidoNotificado(pedidoNovo);
        }

        pedidosConhecidosIdsRef.current = novosIds;
      }

      setPedidos(pedidosLista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurante, somHabilitado]);

  const testarSom = () => {
    tocarSomCampainha();
  };

  const handleUpdateStatus = async (id: string, status: StatusPedido) => {
    try {
      await atualizarStatusPedido(id, status);
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
    }
  };

  const handleResponderCancelamento = async (id: string, aceito: boolean, motivo?: string) => {
    try {
      await responderSolicitacaoCancelamento(id, aceito, motivo);
    } catch (err) {
      console.error('Erro ao responder solicitação de cancelamento:', err);
    }
  };

  const cancelamentoPendenteCount = pedidos.filter(p => p.solicitacaoCancelamento?.status === 'pendente').length;

  const statusCategorias = [
    'Todos', 
    ...(cancelamentoPendenteCount > 0 ? ['Cancelamentos Solicitados'] : []),
    'Novo pedido', 
    'Aceito', 
    'Preparando', 
    'Saiu para entrega', 
    'Finalizado', 
    'Cancelado'
  ];

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroStatus === 'Todos') return true;
    if (filtroStatus === 'Cancelamentos Solicitados') return p.solicitacaoCancelamento?.status === 'pendente';
    return p.status === filtroStatus;
  });

  const novosPedidosCount = pedidos.filter(p => p.status === 'Novo pedido').length;

  return (
    <div className="space-y-6">
      {/* Banner de Autorização de Áudio no Navegador */}
      {!audioDesbloqueado && (
        <div className="bg-amber-500 text-slate-950 p-3.5 rounded-2xl shadow-md flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 shrink-0" />
            <p className="text-xs font-bold">
              🔊 <strong>Ativar Campainha de Novos Pedidos:</strong> Por segurança do navegador, clique em qualquer lugar ou no botão ao lado para liberar o som de notificação.
            </p>
          </div>
          <button
            onClick={() => {
              tocarSomCampainha();
              setAudioDesbloqueado(true);
            }}
            className="px-3 py-1.5 bg-slate-950 text-amber-400 font-extrabold text-xs rounded-xl hover:bg-slate-900 cursor-pointer shrink-0 shadow-xs"
          >
            🔔 Ativar Som
          </button>
        </div>
      )}

      {/* Toast de Notificação de Novo Pedido em Tempo Real */}
      {ultimoPedidoNotificado && (
        <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-rose-600 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6 fill-rose-600" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-wide">🔔 NOVO PEDIDO RECEBIDO!</h4>
              <p className="text-xs text-rose-100 mt-0.5">
                <strong>{ultimoPedidoNotificado.clienteNome}</strong> fez um pedido de{' '}
                <strong>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ultimoPedidoNotificado.valorTotal)}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFiltroStatus('Novo pedido');
                setUltimoPedidoNotificado(null);
              }}
              className="bg-white text-rose-900 px-3 py-1.5 rounded-xl font-black text-xs hover:bg-rose-50 cursor-pointer shadow-xs"
            >
              Ver Pedidos
            </button>
            <button
              onClick={() => setUltimoPedidoNotificado(null)}
              className="p-1 hover:bg-rose-700 rounded-lg text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Pedidos</h1>
            {novosPedidosCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <Bell className="w-3 h-3 fill-white" />
                {novosPedidosCount} {novosPedidosCount === 1 ? 'Novo' : 'Novos'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Recebimento e acompanhamento de pedidos em tempo real com alertas sonoros de campainha
          </p>
        </div>

        {/* Som Controls and Status Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const novo = !somHabilitado;
              setSomHabilitado(novo);
              if (novo) tocarSomCampainha();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              somHabilitado
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
            title="Alternar alerta sonoro de novos pedidos"
          >
            {somHabilitado ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>{somHabilitado ? 'Som Ativado' : 'Som Mudo'}</span>
          </button>

          <button
            onClick={testarSom}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Testar campainha de aviso"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Testar Som</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold">Tempo Real Ativo</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {statusCategorias.map((cat) => {
          const count = cat === 'Todos' 
            ? pedidos.length 
            : cat === 'Cancelamentos Solicitados'
            ? cancelamentoPendenteCount
            : pedidos.filter(p => p.status === cat).length;
          const isSelected = filtroStatus === cat;
          return (
            <button
              key={cat}
              onClick={() => setFiltroStatus(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : cat === 'Cancelamentos Solicitados'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold animate-pulse'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{cat === 'Saiu para entrega' ? 'Pronto na Mesa / Entrega' : cat}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                isSelected 
                  ? 'bg-emerald-500 text-slate-950 font-black' 
                  : cat === 'Cancelamentos Solicitados'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Grid or Empty State */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando pedidos em tempo real...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg mb-1">Nenhum dado encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filtroStatus === 'Todos' 
              ? 'Seu restaurante ainda não possui pedidos cadastrados no sistema.' 
              : `Nenhum pedido encontrado com o status "${filtroStatus}".`}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidosFiltrados.map((pedido) => (
            <OrderCard
              key={pedido.id}
              pedido={pedido}
              onUpdateStatus={handleUpdateStatus}
              onResponderCancelamento={handleResponderCancelamento}
              onImprimirComanda={(p) => setPedidoParaImprimir(p)}
            />
          ))}
        </div>
      )}

      {/* Modal de Impressão Térmica de Comanda */}
      <ComandaThermalModal
        isOpen={!!pedidoParaImprimir}
        onClose={() => setPedidoParaImprimir(null)}
        pedido={pedidoParaImprimir}
        restaurante={restaurante}
      />
    </div>
  );
};
