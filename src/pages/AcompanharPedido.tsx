import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Pedido, Restaurante, StatusPedido } from '../types';
import { escutarPedidoUnico, buscarRestaurantePorId, enviarAvaliacaoPedido, solicitarCancelamentoPedido } from '../services/database';
import { 
  Clock, 
  CheckCircle2, 
  ShoppingBag, 
  Truck, 
  MapPin, 
  Utensils, 
  ArrowLeft,
  MessageCircle,
  Phone,
  Star,
  Send,
  Sparkles,
  Plus,
  Receipt,
  XCircle,
  AlertTriangle,
  X
} from 'lucide-react';

export const AcompanharPedido: React.FC = () => {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [loading, setLoading] = useState(true);

  // Rating State
  const [nota, setNota] = useState<number>(5);
  const [hoverNota, setHoverNota] = useState<number>(0);
  const [comentario, setComentario] = useState<string>('');
  const [enviandoRating, setEnviandoRating] = useState<boolean>(false);
  const [ratingEnviado, setRatingEnviado] = useState<boolean>(false);

  // Cancelamento State
  const [modalCancelamentoAberto, setModalCancelamentoAberto] = useState<boolean>(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState<string>('');
  const [enviandoCancelamento, setEnviandoCancelamento] = useState<boolean>(false);

  const handleSolicitarCancelamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedido) return;

    setEnviandoCancelamento(true);
    try {
      await solicitarCancelamentoPedido(pedido.id, motivoCancelamento.trim() || 'Solicitado pelo cliente');
      setModalCancelamentoAberto(false);
      setMotivoCancelamento('');
    } catch (err) {
      console.error('Erro ao solicitar cancelamento:', err);
    } finally {
      setEnviandoCancelamento(false);
    }
  };

  const handleSubmeterAvaliacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedido || !pedido.restauranteId) return;

    setEnviandoRating(true);
    try {
      await enviarAvaliacaoPedido({
        restauranteId: pedido.restauranteId,
        pedidoId: pedido.id,
        clienteNome: pedido.clienteNome,
        nota,
        comentario: comentario.trim() || undefined
      });
      setRatingEnviado(true);
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err);
    } finally {
      setEnviandoRating(false);
    }
  };

  useEffect(() => {
    if (!pedidoId) return;

    const unsubscribe = escutarPedidoUnico(pedidoId, async (pedidoData) => {
      setPedido(pedidoData);
      setLoading(false);

      if (pedidoData?.restauranteId && !restaurante) {
        const rest = await buscarRestaurantePorId(pedidoData.restauranteId);
        setRestaurante(rest);
      }
    });

    return () => unsubscribe();
  }, [pedidoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        Buscando status do pedido em tempo real...
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center text-white">
        <ShoppingBag className="w-16 h-16 text-slate-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">Pedido não localizado</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          Não foram encontrados dados para o pedido #{pedidoId}.
        </p>
        <Link to="/" className="px-6 py-3 bg-emerald-600 font-bold text-sm rounded-xl text-white">
          Voltar à Página Inicial
        </Link>
      </div>
    );
  }

  const isMesa = pedido.tipoEntrega === 'mesa' || Boolean(pedido.numeroMesa);

  // Stepper Status Order
  const statusSteps: { status: StatusPedido; label: string; icon: any }[] = [
    { status: 'Novo pedido', label: 'Pedido Recebido', icon: ShoppingBag },
    { status: 'Aceito', label: 'Aceito pelo Restaurante', icon: CheckCircle2 },
    { status: 'Preparando', label: 'Em Preparação', icon: Utensils },
    { status: 'Saiu para entrega', label: isMesa ? 'Pronto / Servido na Mesa' : 'Saiu para Entrega', icon: isMesa ? Utensils : Truck },
    { status: 'Finalizado', label: isMesa ? 'Atendimento Concluído' : 'Pedido Entregue', icon: CheckCircle2 },
  ];

  const statusIndexMap: Record<StatusPedido, number> = {
    'Novo pedido': 0,
    'Aceito': 1,
    'Preparando': 2,
    'Saiu para entrega': 3,
    'Finalizado': 4,
    'Cancelado': -1
  };

  const currentIndex = statusIndexMap[pedido.status];

  const whatsappPhone = (restaurante?.whatsapp || restaurante?.telefone || '').replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12">
      {/* Top Header */}
      <header className="bg-slate-900 text-white py-6 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to={restaurante?.slug ? `/cardapio/${restaurante.slug}${pedido.numeroMesa ? `?mesa=${pedido.numeroMesa}` : ''}` : '/'}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isMesa ? `Voltar ao Cardápio (Mesa ${pedido.numeroMesa || '01'})` : 'Voltar ao Cardápio'}</span>
          </Link>

          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
            {isMesa ? `MESA ${pedido.numeroMesa || '01'}` : 'Ao Vivo'}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 -mt-4 space-y-6">
        {/* Order Status Banner */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
            <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
          </div>

          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 block mb-1">
              {isMesa ? `Comanda da Mesa ${pedido.numeroMesa || '01'} — Pedido #${pedido.id.slice(0, 6)}` : `Status do Pedido #${pedido.id.slice(0, 6)}`}
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              {isMesa && pedido.status === 'Saiu para entrega' ? 'Pronto / Servido na Mesa' : pedido.status}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Restaurante: <strong className="text-slate-800">{restaurante?.nome || 'MenuPro'}</strong>
            </p>
          </div>

          {/* Lembrete de Envio do Comprovante Pix */}
          {pedido.formaPagamento?.toLowerCase().includes('pix') && pedido.status !== 'Cancelado' && whatsappPhone && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-2xl text-left space-y-2">
              <div className="flex items-center gap-2 font-black text-xs text-emerald-800">
                <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600 shrink-0" />
                <span>PAGAMENTO VIA PIX SELECIONADO</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Por favor, não se esqueça de <strong>enviar o comprovante do Pix no WhatsApp do restaurante</strong> para a confirmação do pedido.
              </p>
              <a
                href={`https://wa.me/55${whatsappPhone}?text=${encodeURIComponent(`Olá! Estou enviando o comprovante do Pix para o meu pedido #${pedido.id.slice(0, 6)}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>Enviar Comprovante do Pix via WhatsApp</span>
              </a>
            </div>
          )}

          {/* Solicitacao de Cancelamento Banner */}
          {pedido.solicitacaoCancelamento?.status === 'pendente' && (
            <div className="bg-amber-500/10 border border-amber-300 text-amber-950 p-4 rounded-2xl text-left space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                <span>SOLICITAÇÃO DE CANCELAMENTO ENVIADA</span>
              </div>
              <p className="text-xs text-amber-800">
                Seu pedido de cancelamento foi recebido e está aguardando aprovação do restaurante.
              </p>
              {pedido.solicitacaoCancelamento.motivo && (
                <p className="text-[11px] text-amber-900/80 italic">
                  Motivo: "{pedido.solicitacaoCancelamento.motivo}"
                </p>
              )}
            </div>
          )}

          {pedido.solicitacaoCancelamento?.status === 'recusado' && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl text-left space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-rose-800">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>SOLICITAÇÃO DE CANCELAMENTO RECUSADA</span>
              </div>
              <p className="text-xs text-rose-700">
                O restaurante recusou o cancelamento do pedido. Seu pedido continua ativo em preparo/entrega.
              </p>
            </div>
          )}

          {/* Cancelled Banner */}
          {pedido.status === 'Cancelado' ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-4 rounded-2xl">
              Este pedido foi cancelado pelo restaurante. Entre em contato via WhatsApp para mais informações.
            </div>
          ) : (
            /* Progress Timeline */
            <div className="pt-4 space-y-4">
              {statusSteps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = currentIndex >= idx;
                const isCurrent = currentIndex === idx;

                return (
                  <div key={step.status} className="flex items-center gap-4 text-left">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                      isCompleted 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <span className={`text-sm font-bold block ${isCurrent ? 'text-emerald-700' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                      {isCurrent && <span className="text-[11px] text-emerald-600 font-semibold block">Atualizado agora</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-col items-center justify-center gap-2">
            {whatsappPhone && (
              <a
                href={`https://wa.me/55${whatsappPhone}?text=${encodeURIComponent(`Olá, gostaria de informações sobre o meu pedido #${pedido.id.slice(0, 6)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                <span>Falar com o Restaurante no WhatsApp</span>
              </a>
            )}

            {pedido.status !== 'Finalizado' && pedido.status !== 'Cancelado' && (
              pedido.solicitacaoCancelamento?.status === 'pendente' ? (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                  ⏳ Solicitação de cancelamento em análise pelo restaurante
                </span>
              ) : (
                <details className="mt-1 text-center text-xs text-slate-400">
                  <summary className="cursor-pointer hover:text-slate-600 transition-colors select-none font-medium text-[11px] inline-flex items-center gap-1">
                    <span>Precisa cancelar o pedido?</span>
                  </summary>
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setModalCancelamentoAberto(true)}
                      className="text-rose-600 hover:text-rose-700 text-xs font-bold hover:underline inline-flex items-center gap-1 cursor-pointer bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Solicitar cancelamento ao restaurante</span>
                    </button>
                  </div>
                </details>
              )
            )}
          </div>
        </div>

        {/* Card de Garçom Digital / Comanda Aberta para Pedidos de Mesa */}
        {(pedido.tipoEntrega === 'mesa' || pedido.numeroMesa) && (
          <div className="bg-emerald-900 text-white rounded-3xl p-5 shadow-lg border border-emerald-800 space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-emerald-300 flex items-center justify-center font-black shrink-0 border border-emerald-700/80">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Comanda Aberta — MESA {pedido.numeroMesa || '01'}</h3>
                <p className="text-xs text-emerald-200 font-medium">
                  Seu pedido foi registrado e enviado para a cozinha!
                </p>
              </div>
            </div>

            <div className="bg-emerald-950/90 p-3 rounded-2xl border border-emerald-800/80 text-xs text-emerald-100 space-y-1">
              <p className="font-medium text-[11px] leading-relaxed">
                💡 <strong>Deseja pedir mais coisas?</strong> Você pode adicionar novos pratos, bebidas ou sobremesas a qualquer momento. Todos os pedidos da sua mesa ficam concentrados na mesma comanda!
              </p>
            </div>

            <Link
              to={`/cardapio/${restaurante?.slug || ''}?mesa=${pedido.numeroMesa || '01'}`}
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>Pedir Mais Itens (Mesa {pedido.numeroMesa || '01'})</span>
            </Link>
          </div>
        )}

        {/* Card para Fazer Outro Pedido em Delivery / Retirada */}
        {!isMesa && restaurante?.slug && (
          <div className="bg-emerald-50 rounded-3xl p-4.5 shadow-xs border border-emerald-200/80 text-center space-y-2 animate-in fade-in duration-200">
            <p className="text-xs text-emerald-950 font-bold">
              💡 Seu pedido foi enviado ao restaurante! Deseja fazer outro pedido?
            </p>
            <Link
              to={`/cardapio/${restaurante.slug}`}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl transition-all cursor-pointer shadow-xs hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>Fazer Outro Pedido no Cardápio</span>
            </Link>
          </div>
        )}

        {/* Order Details Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Resumo dos Itens</h3>

          <div className="divide-y divide-slate-100">
            {pedido.produtos.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{item.quantidade}x {item.nome}</span>
                  {item.observacao && <p className="text-[11px] text-amber-700 italic">Obs: {item.observacao}</p>}
                </div>
                <span className="font-bold text-slate-800">
                  R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm font-black text-slate-900">
            <span>Valor Total:</span>
            <span className="text-emerald-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valorTotal)}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1 text-slate-600">
            <div><strong>Cliente:</strong> {pedido.clienteNome}</div>
            <div><strong>Telefone:</strong> {pedido.telefone}</div>
            <div><strong>Atendimento:</strong> {
              isMesa 
                ? `Consumo na Mesa ${pedido.numeroMesa || '01'}` 
                : (pedido.tipoEntrega === 'entrega' ? pedido.endereco : 'Retirada no Balcão')
            }</div>
            {pedido.bairro && <div><strong>Bairro:</strong> {pedido.bairro}</div>}
            {pedido.taxaEntrega !== undefined && pedido.taxaEntrega > 0 && (
              <div><strong>Taxa de Entrega:</strong> R$ {pedido.taxaEntrega.toFixed(2).replace('.', ',')}</div>
            )}
            <div><strong>Forma de Pagamento:</strong> {pedido.formaPagamento}</div>
          </div>
        </div>

        {/* Avaliação do Pedido */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Avaliar a Experiência do Pedido</h3>
              <p className="text-xs text-slate-500">Sua opinião é muito importante para nós!</p>
            </div>
          </div>

          {ratingEnviado || pedido.avaliacaoNota ? (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-2">
              <Sparkles className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-black text-emerald-900 text-sm">Obrigado pela sua avaliação!</h4>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= (pedido.avaliacaoNota || nota)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              {(pedido.avaliacaoComentario || comentario) && (
                <p className="text-xs text-emerald-800 italic mt-1">
                  "{pedido.avaliacaoComentario || comentario}"
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmeterAvaliacao} className="space-y-4">
              <div className="flex flex-col items-center justify-center py-2 space-y-2 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700">Selecione uma nota de 1 a 5 estrelas:</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNota(star)}
                      onMouseEnter={() => setHoverNota(star)}
                      onMouseLeave={() => setHoverNota(0)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverNota || nota)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-extrabold text-amber-700">
                  {nota === 5 && '😍 Excelente!'}
                  {nota === 4 && '😊 Muito Bom!'}
                  {nota === 3 && '😐 Ok / Regular'}
                  {nota === 2 && '🙁 Pode Melhorar'}
                  {nota === 1 && '😞 Ruim'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Comentário ou Sugestão (Opcional):
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Conte-nos o que achou da comida, embalagem e tempo de entrega..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={enviandoRating}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{enviandoRating ? 'Enviando...' : 'Enviar Minha Avaliação'}</span>
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Modal de Solicitação de Cancelamento */}
      {modalCancelamentoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">Solicitar Cancelamento</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalCancelamentoAberto(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sua solicitação de cancelamento será enviada para o restaurante para ser analisada pelo administrador.
            </p>

            <form onSubmit={handleSolicitarCancelamento} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo do Cancelamento (Opcional):
                </label>
                <textarea
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  placeholder="Ex: Pedido feito por engano, mudança de planos, erro nos itens..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCancelamentoAberto(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Manter Pedido
                </button>
                <button
                  type="submit"
                  disabled={enviandoCancelamento}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{enviandoCancelamento ? 'Enviando...' : 'Enviar Pedido'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
