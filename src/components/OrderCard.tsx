import React, { useState } from 'react';
import { Pedido, StatusPedido } from '../types';
import { responderSolicitacaoCancelamento } from '../services/database';
import { 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  Printer, 
  Utensils, 
  ChefHat, 
  Bike, 
  ShoppingBag,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface OrderCardProps {
  pedido: Pedido;
  onUpdateStatus: (id: string, status: StatusPedido) => void;
  onResponderCancelamento?: (id: string, aceito: boolean, motivo?: string) => Promise<void> | void;
  onImprimirComanda?: (pedido: Pedido) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ pedido, onUpdateStatus, onResponderCancelamento, onImprimirComanda }) => {
  const [processandoCancelamento, setProcessandoCancelamento] = useState(false);
  const isMesa = pedido.tipoEntrega === 'mesa' || Boolean(pedido.numeroMesa);

  const precoFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(pedido.valorTotal);

  const statusColors: Record<StatusPedido, { bg: string; text: string; border: string }> = {
    'Novo pedido': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
    'Aceito': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300' },
    'Preparando': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300' },
    'Saiu para entrega': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300' },
    'Finalizado': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
    'Cancelado': { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300' },
  };

  const statusOptions: StatusPedido[] = [
    'Novo pedido',
    'Aceito',
    'Preparando',
    'Saiu para entrega',
    'Finalizado',
    'Cancelado',
  ];

  const dataFormatada = new Date(pedido.data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const whatsappPhone = pedido.telefone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${whatsappPhone}?text=${encodeURIComponent(
    `Olá ${pedido.clienteNome}, sobre o seu pedido #${pedido.id.slice(0, 6)} no valor de ${precoFormatado}:`
  )}`;

  const getWhatsAppStatusUrl = (tipoMsg: 'preparo' | 'entrega' | 'pronto') => {
    const pedidoIdCurto = pedido.id.slice(0, 6);
    let texto = '';
    if (tipoMsg === 'preparo') {
      texto = isMesa
        ? `Olá *${pedido.clienteNome}*! 👋 Seu pedido *#${pedidoIdCurto}* da *Mesa ${pedido.numeroMesa || '01'}* foi aceito e já está em preparo na cozinha! 🍳`
        : `Olá *${pedido.clienteNome}*! 👋 Seu pedido *#${pedidoIdCurto}* no valor de ${precoFormatado} foi aceito e já está em preparo na cozinha! 🍳`;
    } else if (tipoMsg === 'entrega') {
      texto = isMesa
        ? `Olá *${pedido.clienteNome}*! 🍽️ Seu pedido *#${pedidoIdCurto}* da *Mesa ${pedido.numeroMesa || '01'}* ficou pronto e acabou de ser servido na sua mesa! Bom apetite! 😋`
        : `Olá *${pedido.clienteNome}*! 🛵 Seu pedido *#${pedidoIdCurto}* saiu para entrega com nosso entregador!\n📍 Endereço: ${pedido.endereco || 'A combinar'}`;
    } else if (tipoMsg === 'pronto') {
      texto = isMesa
        ? `Olá *${pedido.clienteNome}*! 🎉 Seu atendimento na *Mesa ${pedido.numeroMesa || '01'}* (Pedido *#${pedidoIdCurto}*) foi finalizado! Agradecemos a preferência! ❤️`
        : `Olá *${pedido.clienteNome}*! 🎉 Seu pedido *#${pedidoIdCurto}* está PRONTO e aguardando você para retirada no balcão!`;
    }
    return `https://wa.me/55${whatsappPhone}?text=${encodeURIComponent(texto)}`;
  };

  const getStatusBadgeLabel = (status: StatusPedido) => {
    if (isMesa && status === 'Saiu para entrega') {
      return 'Pronto / Servido na Mesa';
    }
    return status;
  };

  return (
    <div className={`bg-white rounded-2xl border-2 ${statusColors[pedido.status].border} shadow-xs overflow-hidden flex flex-col justify-between transition-all`}>
      {/* Card Header */}
      <div className={`p-4 ${statusColors[pedido.status].bg} border-b ${statusColors[pedido.status].border} flex items-center justify-between`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">Pedido #{pedido.id.slice(0, 6)}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[pedido.status].bg} ${statusColors[pedido.status].text} border ${statusColors[pedido.status].border}`}>
              {getStatusBadgeLabel(pedido.status)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{dataFormatada}</span>
          </div>
        </div>

        <span className="font-black text-slate-900 text-lg">{precoFormatado}</span>
      </div>

      {/* Customer Info */}
      <div className="p-4 space-y-3 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-slate-900 text-sm">{pedido.clienteNome}</p>
            <div className="flex items-center gap-1.5 text-slate-600 text-xs mt-0.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{pedido.telefone || '(Sem telefone)'}</span>
            </div>
          </div>

          {whatsappPhone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
              title="Conversar no WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>

        {/* Alerta de Solicitação de Cancelamento do Cliente */}
        {pedido.solicitacaoCancelamento?.status === 'pendente' && (
          <div className="p-3.5 bg-amber-500/10 border-2 border-amber-500 rounded-2xl space-y-2 shadow-xs relative z-10">
            <div className="flex items-center justify-between text-amber-950 font-black text-xs">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 animate-bounce" />
                <span>SOLICITAÇÃO DE CANCELAMENTO PELO CLIENTE</span>
              </span>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full shrink-0">
                Pendente
              </span>
            </div>

            <p className="text-xs text-slate-800 bg-white p-2.5 rounded-xl border border-amber-200/80">
              <strong>Motivo informado:</strong> "{pedido.solicitacaoCancelamento.motivo || 'Sem motivo informado'}"
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={processandoCancelamento}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setProcessandoCancelamento(true);
                  try {
                    if (onResponderCancelamento) {
                      await onResponderCancelamento(pedido.id, true);
                    } else {
                      await responderSolicitacaoCancelamento(pedido.id, true);
                    }
                  } catch (err) {
                    console.error("Erro ao aceitar cancelamento:", err);
                  } finally {
                    setProcessandoCancelamento(false);
                  }
                }}
                className="flex-1 py-2 px-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{processandoCancelamento ? 'Processando...' : 'Aceitar Cancelamento'}</span>
              </button>

              <button
                type="button"
                disabled={processandoCancelamento}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setProcessandoCancelamento(true);
                  try {
                    if (onResponderCancelamento) {
                      await onResponderCancelamento(pedido.id, false);
                    } else {
                      await responderSolicitacaoCancelamento(pedido.id, false);
                    }
                  } catch (err) {
                    console.error("Erro ao recusar cancelamento:", err);
                  } finally {
                    setProcessandoCancelamento(false);
                  }
                }}
                className="flex-1 py-2 px-2.5 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-slate-300" />
                <span>{processandoCancelamento ? 'Processando...' : 'Recusar'}</span>
              </button>
            </div>
          </div>
        )}

        {pedido.solicitacaoCancelamento?.status === 'recusado' && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between font-bold">
            <span>⚠️ Solicitação de cancelamento recusada pelo restaurante</span>
          </div>
        )}

        {pedido.solicitacaoCancelamento?.status === 'aceito' && (
          <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between font-bold">
            <span>ℹ️ Pedido cancelado mediante solicitação do cliente</span>
          </div>
        )}

        {/* Tipo de Entrega / Mesa */}
        <div className={`flex items-start gap-2 text-xs p-2.5 rounded-xl border ${
          isMesa 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
            : 'bg-slate-50 border-slate-100 text-slate-600'
        }`}>
          {isMesa ? (
            <Utensils className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase tracking-wide text-[10px] block">
                {isMesa 
                  ? `Consumo Local / Garçom Digital` 
                  : (pedido.tipoEntrega === 'entrega' ? 'Entrega no Endereço' : 'Retirada no Balcão')}
              </span>
              {isMesa ? (
                <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-md shadow-2xs">
                  MESA {pedido.numeroMesa || '01'}
                </span>
              ) : (
                pedido.bairro && (
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded-md">
                    {pedido.bairro}
                  </span>
                )
              )}
            </div>
            <span>
              {isMesa 
                ? `Atendimento presencial na Mesa ${pedido.numeroMesa || '01'}` 
                : (pedido.endereco || 'Retirada no local')}
            </span>
            {!isMesa && pedido.taxaEntrega !== undefined && pedido.taxaEntrega > 0 && (
              <span className="block text-[11px] text-sky-700 font-semibold mt-0.5">
                Taxa de Entrega: R$ {pedido.taxaEntrega.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
        </div>

        {/* Product Items List */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Itens do Pedido</span>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {pedido.produtos.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                <div className="text-slate-800">
                  <strong className="text-emerald-600 font-bold">{item.quantidade}x</strong> {item.nome}
                  {item.variacoesEscolhidas && item.variacoesEscolhidas.length > 0 && (
                    <div className="pl-3 space-y-0.5 my-0.5">
                      {item.variacoesEscolhidas.map((v, vIdx) => (
                        <span key={vIdx} className="block text-[11px] text-indigo-700 font-medium">
                          └ {v.grupoTitulo}: {v.opcaoNome}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.observacao && <span className="block text-[11px] text-amber-700 italic">Obs: {item.observacao}</span>}
                </div>
                <span className="font-medium text-slate-700 shrink-0 ml-2">
                  {(item.preco * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment & Notes */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Forma de Pagamento:</span>
            <span className="font-bold text-slate-800 capitalize">{pedido.formaPagamento}</span>
          </div>
          {pedido.trocoPara && (
            <div className="flex items-center justify-between text-slate-600">
              <span>Troco para:</span>
              <span className="font-bold text-emerald-700">{pedido.trocoPara}</span>
            </div>
          )}
          {pedido.observacao && (
            <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900 text-xs mt-1">
              <strong>Observação Geral:</strong> {pedido.observacao}
            </div>
          )}
        </div>

        {/* ⚡ BOTÕES RÁPIDOS DE ATUALIZAÇÃO DE STATUS (Painel do Dono/ADM) */}
        <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Atualizar Status (Ação Rápida):</span>
            {isMesa && <span className="text-emerald-700 font-extrabold text-[10px]">Mesa {pedido.numeroMesa || '01'}</span>}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateStatus(pedido.id, 'Preparando')}
              className={`py-2 px-1 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                pedido.status === 'Preparando'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200'
              }`}
              title="Marcar como Em Preparo na Cozinha"
            >
              <ChefHat className="w-4 h-4" />
              <span className="text-[10px] leading-none">Em Preparo</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateStatus(pedido.id, 'Saiu para entrega')}
              className={`py-2 px-1 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                pedido.status === 'Saiu para entrega'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
              }`}
              title={isMesa ? 'Marcar como Pronto e Servido na Mesa' : 'Marcar como Saiu para Entrega'}
            >
              {isMesa ? <Utensils className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
              <span className="text-[10px] leading-none">{isMesa ? 'Pronto na Mesa' : 'Saiu Entrega'}</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateStatus(pedido.id, 'Finalizado')}
              className={`py-2 px-1 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                pedido.status === 'Finalizado'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
              }`}
              title="Marcar como Finalizado / Concluído"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] leading-none">Finalizar</span>
            </button>
          </div>
        </div>

        {/* 📲 Notificação Automática no WhatsApp do Cliente (1-Clique) */}
        {whatsappPhone && (
          <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <MessageCircle className="w-3 h-3 fill-emerald-600 text-emerald-600" />
              <span>Notificar Cliente no WhatsApp:</span>
            </span>
            <div className="flex flex-wrap gap-1">
              <a
                href={getWhatsAppStatusUrl('preparo')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (pedido.status === 'Novo pedido' || pedido.status === 'Aceito') {
                    onUpdateStatus(pedido.id, 'Preparando');
                  }
                }}
                className="flex-1 min-w-[85px] py-1 px-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold text-center transition-colors"
                title="Avisar no WhatsApp que o pedido está em preparo"
              >
                🟡 Em Preparo
              </a>

              <a
                href={getWhatsAppStatusUrl('entrega')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (pedido.status !== 'Saiu para entrega') {
                    onUpdateStatus(pedido.id, 'Saiu para entrega');
                  }
                }}
                className="flex-1 min-w-[85px] py-1 px-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-[10px] font-bold text-center transition-colors"
                title={isMesa ? 'Avisar no WhatsApp que o pedido está pronto e servido na mesa' : 'Avisar no WhatsApp que o pedido saiu para entrega'}
              >
                {isMesa ? '🍽️ Servido na Mesa' : '🛵 Saiu pra Entrega'}
              </a>

              <a
                href={getWhatsAppStatusUrl('pronto')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (pedido.status !== 'Finalizado') {
                    onUpdateStatus(pedido.id, 'Finalizado');
                  }
                }}
                className="flex-1 min-w-[85px] py-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[10px] font-bold text-center transition-colors"
                title={isMesa ? 'Avisar no WhatsApp que o atendimento foi concluído' : 'Avisar no WhatsApp que o pedido está pronto para retirada'}
              >
                {isMesa ? '🎉 Finalizado' : '🎉 Pronto/Retirada'}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
        {onImprimirComanda && (
          <button
            onClick={() => onImprimirComanda(pedido)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Imprimir Comanda Térmica (58mm/80mm)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Comanda</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 w-full">
          <label className="text-[11px] font-bold text-slate-500 shrink-0 hidden sm:inline">Status:</label>
          <select
            value={pedido.status}
            onChange={(e) => onUpdateStatus(pedido.id, e.target.value as StatusPedido)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg font-medium p-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'Saiu para entrega' && isMesa ? 'Pronto / Servido na Mesa' : option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

