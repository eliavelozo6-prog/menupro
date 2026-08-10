import React, { useState, useRef } from 'react';
import { Pedido, Restaurante } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { Printer, Check, Copy, Sliders, Store, User, MapPin, Phone, CreditCard, Clock, FileText } from 'lucide-react';

interface ComandaThermalModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  restaurante: Restaurante | null;
}

export const ComandaThermalModal: React.FC<ComandaThermalModalProps> = ({
  isOpen,
  onClose,
  pedido,
  restaurante
}) => {
  const [tamanhoPapel, setTamanhoPapel] = useState<'58mm' | '80mm'>('80mm');
  const [tipoComanda, setTipoComanda] = useState<'completa' | 'cozinha'>('completa');
  const [exibirLogo, setExibirLogo] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!pedido) return null;

  const precoFormatado = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const dataFormatada = new Date(pedido.data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleImprimir = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('Por favor, permita popups para abrir a janela de impressão.');
      return;
    }

    const is58 = tamanhoPapel === '58mm';
    const paperWidth = is58 ? '58mm' : '80mm';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comanda_Pedido_${pedido.id.slice(0, 6)}</title>
          <style>
            @page {
              size: ${paperWidth} auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace, sans-serif;
              width: ${paperWidth};
              margin: 0 auto;
              padding: 8px;
              background: #ffffff;
              color: #000000;
              font-size: ${is58 ? '11px' : '13px'};
              line-height: 1.3;
              -webkit-print-color-adjust: exact;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .dashed-line {
              border-bottom: 1px dashed #000000;
              margin: 6px 0;
            }
            .double-line {
              border-bottom: 2px solid #000000;
              margin: 6px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .item-obs {
              font-style: italic;
              padding-left: 10px;
              font-size: 0.9em;
            }
            .badge {
              border: 1px solid #000;
              padding: 2px 6px;
              font-weight: bold;
              display: inline-block;
              margin-top: 4px;
            }
            @media print {
              body {
                width: 100%;
                padding: 2mm;
              }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const copiarTextoComanda = () => {
    let txt = `==============================\n`;
    txt += `${restaurante?.nome || 'MenuPro'}\n`;
    txt += `PEDIDO #${pedido.id.slice(0, 6).toUpperCase()}\n`;
    txt += `Data: ${dataFormatada}\n`;
    txt += `Tipo: ${pedido.tipoEntrega.toUpperCase()}\n`;
    txt += `==============================\n`;
    txt += `Cliente: ${pedido.clienteNome}\n`;
    txt += `Tel: ${pedido.telefone}\n`;
    if (pedido.endereco) txt += `End: ${pedido.endereco}\n`;
    txt += `------------------------------\n`;
    txt += `ITENS DO PEDIDO:\n`;
    pedido.produtos.forEach(p => {
      txt += `${p.quantidade}x ${p.nome} - ${precoFormatado(p.preco * p.quantidade)}\n`;
      if (p.variacoesEscolhidas && p.variacoesEscolhidas.length > 0) {
        p.variacoesEscolhidas.forEach(v => {
          txt += `   └ ${v.grupoTitulo}: ${v.opcaoNome}\n`;
        });
      }
      if (p.observacao) txt += `   Obs: ${p.observacao}\n`;
    });
    txt += `------------------------------\n`;
    if (tipoComanda === 'completa') {
      txt += `Pagamento: ${pedido.formaPagamento}\n`;
      if (pedido.trocoPara) txt += `Troco para: ${pedido.trocoPara}\n`;
      txt += `TOTAL: ${precoFormatado(pedido.valorTotal)}\n`;
    }
    if (pedido.observacao) txt += `Obs Geral: ${pedido.observacao}\n`;
    txt += `==============================\n`;

    navigator.clipboard.writeText(txt);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Impressão de Comanda Térmica">
      <div className="space-y-5">
        {/* Configurations Bar */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              Largura da Bobina:
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-200 p-1 rounded-lg">
              <button
                onClick={() => setTamanhoPapel('58mm')}
                className={`py-1 rounded font-bold text-center transition-all ${
                  tamanhoPapel === '58mm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                58mm (Estreita)
              </button>
              <button
                onClick={() => setTamanhoPapel('80mm')}
                className={`py-1 rounded font-bold text-center transition-all ${
                  tamanhoPapel === '80mm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80mm (Padrão)
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Modelo da Comanda:
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-200 p-1 rounded-lg">
              <button
                onClick={() => setTipoComanda('completa')}
                className={`py-1 rounded font-bold text-center transition-all ${
                  tipoComanda === 'completa' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Caixa / Cliente
              </button>
              <button
                onClick={() => setTipoComanda('cozinha')}
                className={`py-1 rounded font-bold text-center transition-all ${
                  tipoComanda === 'cozinha' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Via Cozinha
              </button>
            </div>
          </div>
        </div>

        {/* Live Thermal Receipt Preview Box */}
        <div className="flex justify-center bg-slate-200 p-4 rounded-2xl overflow-x-auto max-h-[380px] overflow-y-auto border border-slate-300">
          <div
            className={`bg-white text-black p-4 shadow-md border border-slate-300 font-mono text-xs leading-relaxed transition-all ${
              tamanhoPapel === '58mm' ? 'w-[220px]' : 'w-[290px]'
            }`}
          >
            <div ref={printRef} className="space-y-1">
              {/* Header */}
              <div className="text-center">
                {exibirLogo && restaurante?.logo && (
                  <img
                    src={restaurante.logo}
                    alt="Logo"
                    className="w-12 h-12 object-contain mx-auto mb-1 rounded-full border border-black"
                  />
                )}
                <div className="font-black text-sm uppercase tracking-wider">
                  {restaurante?.nome || 'RESTAURANTE'}
                </div>
                {restaurante?.telefone && (
                  <div className="text-[10px]">Tel: {restaurante.telefone}</div>
                )}
                <div className="text-[10px] text-gray-700">{dataFormatada}</div>
              </div>

              <div className="border-b-2 border-black my-2" />

              {/* Order # and Type */}
              <div className="text-center">
                <div className="font-bold text-base">
                  PEDIDO #{pedido.id.slice(0, 6).toUpperCase()}
                </div>
                <div className="inline-block border border-black px-2 py-0.5 font-bold uppercase text-[11px] my-1">
                  {pedido.tipoEntrega === 'entrega' ? '🛵 ENTREGA' : '🛍️ RETIRADA / BALCÃO'}
                </div>
              </div>

              <div className="border-b border-dashed border-black my-2" />

              {/* Customer Info */}
              <div className="space-y-0.5 text-[11px]">
                <div><strong>Cliente:</strong> {pedido.clienteNome}</div>
                <div><strong>Fone:</strong> {pedido.telefone}</div>
                {pedido.endereco && (
                  <div><strong>Endereço:</strong> {pedido.endereco}</div>
                )}
              </div>

              <div className="border-b border-dashed border-black my-2" />

              {/* Items Section */}
              <div className="font-bold uppercase text-[11px] mb-1">
                {tipoComanda === 'cozinha' ? '=== VIA DA COZINHA ===' : 'ITENS DO PEDIDO'}
              </div>

              <div className="space-y-1.5">
                {pedido.produtos.map((item, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-1 last:border-0">
                    <div className="flex justify-between font-bold">
                      <span>{item.quantidade}x {item.nome}</span>
                      {tipoComanda === 'completa' && (
                        <span>{precoFormatado(item.preco * item.quantidade)}</span>
                      )}
                    </div>
                    {item.variacoesEscolhidas && item.variacoesEscolhidas.length > 0 && (
                      <div className="pl-2 space-y-0.5 text-[10px] font-semibold text-gray-800">
                        {item.variacoesEscolhidas.map((v, vIdx) => (
                          <div key={vIdx}>
                            └ {v.grupoTitulo}: {v.opcaoNome}
                          </div>
                        ))}
                      </div>
                    )}
                    {item.observacao && (
                      <div className="text-[10px] pl-2 font-semibold italic text-gray-800">
                        * OBS: {item.observacao}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-black my-2" />

              {/* Totals & Payment (if completa) */}
              {tipoComanda === 'completa' ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Pagamento:</span>
                    <span className="font-bold uppercase">{pedido.formaPagamento}</span>
                  </div>
                  {pedido.trocoPara && (
                    <div className="flex justify-between text-[10px]">
                      <span>Troco para:</span>
                      <span className="font-bold">{pedido.trocoPara}</span>
                    </div>
                  )}
                  <div className="border-b border-black my-1" />
                  <div className="flex justify-between text-sm font-black">
                    <span>TOTAL:</span>
                    <span>{precoFormatado(pedido.valorTotal)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-center font-bold">
                  Qtd Total de Itens: {pedido.produtos.reduce((acc, i) => acc + i.quantidade, 0)}
                </div>
              )}

              {/* General Observations */}
              {pedido.observacao && (
                <>
                  <div className="border-b border-dashed border-black my-2" />
                  <div className="text-[10px] bg-gray-100 p-1 border border-black">
                    <strong>OBSERVAÇÃO GERAL:</strong> {pedido.observacao}
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="border-b-2 border-black my-2" />
              <div className="text-center text-[9px] uppercase tracking-wider">
                MenuPro - Sistema de Cardápio Digital
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200">
          <button
            onClick={copiarTextoComanda}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiado ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copiado em Texto!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">
              Fechar
            </Button>
            <Button
              onClick={handleImprimir}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Comanda</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
