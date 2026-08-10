import React, { useEffect, useState } from 'react';
import { 
  Mesa, 
  Pedido, 
  Produto, 
  Restaurante, 
  Usuario 
} from '../types';
import { 
  listarMesas, 
  salvarMesa, 
  excluirMesa, 
  atualizarStatusMesa, 
  fecharComandaMesa, 
  gerarMesasIniciais,
  limparMesasDuplicadas,
  escutarPedidosRestaurante,
  listarProdutosRestaurante,
  criarPedido
} from '../services/database';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ComandaThermalModal } from '../components/ComandaThermalModal';
import { 
  QrCode, 
  Plus, 
  Trash2, 
  Receipt, 
  CheckCircle2, 
  Printer, 
  Utensils, 
  RefreshCw, 
  DollarSign, 
  Clock, 
  AlertCircle,
  Copy,
  Check,
  X,
  ShoppingBag
} from 'lucide-react';

interface MesasProps {
  usuario: Usuario | null;
  restaurante: Restaurante | null;
}

export const Mesas: React.FC<MesasProps> = ({ restaurante }) => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Nova/Editar Mesa
  const [modalMesaAberto, setModalMesaAberto] = useState(false);
  const [numeroMesaInput, setNumeroMesaInput] = useState('');
  const [nomeMesaInput, setNomeMesaInput] = useState('');
  const [salvandoMesa, setSalvandoMesa] = useState(false);

  // Modal QR Code da Mesa
  const [mesaQrCode, setMesaQrCode] = useState<Mesa | null>(null);
  const [copiadoUrl, setCopiadoUrl] = useState(false);

  // Modal Comanda Aberta da Mesa
  const [mesaComanda, setMesaComanda] = useState<Mesa | null>(null);
  const [fechandoComanda, setFechandoComanda] = useState(false);

  // Modal Lançar Item na Comanda (Garçom / Caixa)
  const [modalLancarItemAberto, setModalLancarItemAberto] = useState(false);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('');
  const [qtdLancar, setQtdLancar] = useState(1);
  const [obsLancar, setObsLancar] = useState('');
  const [lancandoItem, setLancandoItem] = useState(false);

  // Modal Impressão da Conta
  const [pedidoParaImprimir, setPedidoParaImprimir] = useState<Pedido | null>(null);

  // Modal Confirmar Exclusão de Mesa
  const [mesaParaExcluir, setMesaParaExcluir] = useState<Mesa | null>(null);
  const [excluindoMesa, setExcluindoMesa] = useState(false);

  // Modal Confirmar Fechamento de Comanda
  const [mesaParaFecharComanda, setMesaParaFecharComanda] = useState<Mesa | null>(null);

  // Mensagem de Feedback
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const handleImprimirPlacaMesa = (mesa: Mesa) => {
    if (!restaurante) return;
    const urlMesa = `${urlBase}/cardapio/${restaurante.slug}?mesa=${mesa.numero}`;
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(urlMesa)}`;

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Placa_Mesa_${mesa.numero}_${restaurante.nome}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #ffffff;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              color: #0f172a;
            }
            .plate-card {
              border: 4px solid #10b981;
              border-radius: 28px;
              padding: 36px 28px;
              width: 320px;
              text-align: center;
              background: #ffffff;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
              box-sizing: border-box;
            }
            .restaurant-badge {
              background-color: #0f172a;
              color: #10b981;
              font-size: 15px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding: 10px 18px;
              border-radius: 14px;
              margin-bottom: 20px;
              display: inline-block;
            }
            .cardapio-tag {
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 2.5px;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 6px;
            }
            .mesa-title {
              font-size: 32px;
              font-weight: 900;
              color: #0f172a;
              margin: 0 0 16px 0;
              line-height: 1;
            }
            .qr-wrapper {
              background: #f8fafc;
              border: 2px dashed #10b981;
              border-radius: 20px;
              padding: 16px;
              display: inline-block;
              margin-bottom: 20px;
            }
            .qr-code-img {
              width: 220px;
              height: 220px;
              display: block;
              margin: 0 auto;
            }
            .action-text {
              font-size: 14px;
              font-weight: 800;
              color: #047857;
              margin-bottom: 6px;
              text-transform: uppercase;
            }
            .sub-text {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 20px;
              line-height: 1.4;
            }
            .steps-footer {
              border-top: 2px dashed #e2e8f0;
              padding-top: 14px;
              font-size: 10px;
              font-weight: 700;
              color: #334155;
            }
            @media print {
              body {
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .plate-card {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="plate-card">
            <div class="restaurant-badge">
              🍽️ ${restaurante.nome}
            </div>
            <div class="cardapio-tag">CARDÁPIO DIGITAL</div>
            <h1 class="mesa-title">${mesa.nome || `Mesa ${mesa.numero}`}</h1>
            <div class="qr-wrapper">
              <img src="${qrImgUrl}" alt="QR Code Mesa ${mesa.numero}" class="qr-code-img" />
            </div>
            <div class="action-text">ESCANEE PARA PEDIR</div>
            <div class="sub-text">Aponte a câmera do seu celular para fazer seu pedido à mesa</div>
            <div class="steps-footer">
              1. Abra a Câmera  •  2. Escaneie  •  3. Peça à Mesa
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=650,height=800');
    if (win) {
      win.document.write(printHtml);
      win.document.close();
    } else {
      let iframe = document.getElementById('iframe-print-placa-mesa') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'iframe-print-placa-mesa';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
      }
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(printHtml);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 500);
      }
    }
  };

  useEffect(() => {
    if (!restaurante?.id) {
      setLoading(false);
      return;
    }

    async function carregarDados() {
      setLoading(true);
      try {
        let [mesasData, produtosData] = await Promise.all([
          listarMesas(restaurante!.id),
          listarProdutosRestaurante(restaurante!.id)
        ]);

        if (mesasData.length === 0) {
          const iniciais = await gerarMesasIniciais(restaurante!.id, 10);
          setMesas(iniciais);
        } else {
          // Verifica se há duplicatas e limpa automaticamente
          const numeros = mesasData.map(m => m.numero.trim().toLowerCase());
          if (new Set(numeros).size !== numeros.length) {
            await limparMesasDuplicadas(restaurante!.id);
            mesasData = await listarMesas(restaurante!.id);
          }
          setMesas(mesasData);
        }

        setProdutos(produtosData.filter(p => p.disponivel));
      } catch (err) {
        console.error('Erro ao carregar mesas:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();

    // Listener de pedidos em tempo real
    const unsubscribe = escutarPedidosRestaurante(restaurante.id, (pedidosLista) => {
      setPedidos(pedidosLista);
    });

    return () => unsubscribe();
  }, [restaurante]);

  // Atualizar lista de mesas
  const recarregarMesas = async () => {
    if (!restaurante?.id) return;
    try {
      const data = await listarMesas(restaurante.id);
      setMesas(data);
    } catch (err) {
      console.error('Erro ao recarregar mesas:', err);
    }
  };

  const handleLimparDuplicadasManualmente = async () => {
    if (!restaurante?.id) return;
    setLoading(true);
    try {
      const removidas = await limparMesasDuplicadas(restaurante.id);
      await recarregarMesas();
      if (removidas > 0) {
        setFeedback({ tipo: 'sucesso', texto: `${removidas} mesa(s) duplicada(s) foram removidas com sucesso!` });
      } else {
        setFeedback({ tipo: 'sucesso', texto: 'Nenhuma mesa duplicada encontrada.' });
      }
    } catch (err) {
      console.error('Erro ao limpar mesas duplicadas:', err);
      setFeedback({ tipo: 'erro', texto: 'Erro ao limpar mesas duplicadas.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarMesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurante?.id || !numeroMesaInput.trim()) return;

    setSalvandoMesa(true);
    try {
      await salvarMesa({
        restauranteId: restaurante.id,
        numero: numeroMesaInput.trim(),
        nome: nomeMesaInput.trim() || `Mesa ${numeroMesaInput.trim()}`,
        status: 'Livre'
      });
      await recarregarMesas();
      setModalMesaAberto(false);
      setNumeroMesaInput('');
      setNomeMesaInput('');
      setFeedback({ tipo: 'sucesso', texto: 'Mesa cadastrada com sucesso!' });
    } catch (err) {
      console.error('Erro ao salvar mesa:', err);
      setFeedback({ tipo: 'erro', texto: 'Erro ao salvar mesa. Tente novamente.' });
    } finally {
      setSalvandoMesa(false);
    }
  };

  const handleConfirmarExcluirMesa = async () => {
    if (!mesaParaExcluir || !mesaParaExcluir.id) {
      setFeedback({ tipo: 'erro', texto: 'Mesa inválida para exclusão.' });
      return;
    }
    setExcluindoMesa(true);
    try {
      await excluirMesa(mesaParaExcluir.id);
      const idRemovida = mesaParaExcluir.id;
      const numRemovida = mesaParaExcluir.numero;
      setMesas(prev => prev.filter(m => m.id !== idRemovida));
      setMesaParaExcluir(null);
      await recarregarMesas();
      setFeedback({ tipo: 'sucesso', texto: `Mesa ${numRemovida} removida com sucesso!` });
    } catch (err: any) {
      console.error('Erro ao excluir mesa:', err);
      setFeedback({ tipo: 'erro', texto: 'Erro ao excluir mesa: ' + (err?.message || 'Tente novamente.') });
    } finally {
      setExcluindoMesa(false);
    }
  };

  const handleConfirmarFecharComanda = async () => {
    if (!restaurante?.id || !mesaParaFecharComanda) return;

    setFechandoComanda(true);
    try {
      await fecharComandaMesa(restaurante.id, mesaParaFecharComanda.numero);
      await recarregarMesas();
      setMesaComanda(null);
      const nomeMesa = mesaParaFecharComanda.nome || 'Mesa ' + mesaParaFecharComanda.numero;
      setMesaParaFecharComanda(null);
      setFeedback({ tipo: 'sucesso', texto: `Comanda da ${nomeMesa} finalizada com sucesso! Mesa liberada.` });
    } catch (err) {
      console.error('Erro ao fechar comanda:', err);
      setFeedback({ tipo: 'erro', texto: 'Erro ao fechar comanda.' });
    } finally {
      setFechandoComanda(false);
    }
  };

  const handleLancarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurante?.id || !mesaComanda || !produtoSelecionadoId) return;

    const prod = produtos.find(p => p.id === produtoSelecionadoId);
    if (!prod) return;

    setLancandoItem(true);
    try {
      await criarPedido({
        restauranteId: restaurante.id,
        clienteNome: `Cliente ${mesaComanda.nome || 'Mesa ' + mesaComanda.numero}`,
        telefone: 'Presencial',
        endereco: `Consumo no local - ${mesaComanda.nome || 'Mesa ' + mesaComanda.numero}`,
        tipoEntrega: 'mesa',
        numeroMesa: mesaComanda.numero,
        statusComanda: 'Aberta',
        formaPagamento: 'Comanda na Mesa',
        produtos: [{
          id: `${prod.id}-${Date.now()}`,
          produtoId: prod.id,
          nome: prod.nome,
          preco: prod.preco,
          quantidade: qtdLancar,
          observacao: obsLancar
        }],
        valorTotal: prod.preco * qtdLancar,
        status: 'Aceito'
      });

      // Atualizar status da mesa para Ocupada
      await atualizarStatusMesa(mesaComanda.id, 'Ocupada');
      await recarregarMesas();

      setModalLancarItemAberto(false);
      setProdutoSelecionadoId('');
      setQtdLancar(1);
      setObsLancar('');
    } catch (err) {
      console.error('Erro ao lançar item na comanda:', err);
      alert('Erro ao lançar item. Tente novamente.');
    } finally {
      setLancandoItem(false);
    }
  };

  const urlBase = window.location.origin;

  // Filtrar pedidos ativos para cada mesa
  const getPedidosAtivosMesa = (numeroMesa: string) => {
    return pedidos.filter(p => 
      p.numeroMesa === numeroMesa && 
      p.status !== 'Finalizado' && 
      p.status !== 'Cancelado'
    );
  };

  const getTotalComandaMesa = (numeroMesa: string) => {
    const ativos = getPedidosAtivosMesa(numeroMesa);
    return ativos.reduce((acc, curr) => acc + curr.valorTotal, 0);
  };

  if (!restaurante) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800 text-lg">Restaurante não encontrado</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in duration-200 ${
          feedback.tipo === 'sucesso' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.texto}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Utensils className="w-3.5 h-3.5" />
            Módulo Garçom Digital & Consumo no Local
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Gestão de Mesas & Comandas</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Gere QR Codes individuais por mesa. O cliente faz o pedido direto do celular ao sentar e os itens entram direto na comanda da mesa em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            onClick={handleLimparDuplicadasManualmente}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-4 rounded-2xl border border-slate-700 text-xs"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Limpar Duplicadas
          </Button>
          <Button
            onClick={() => setModalMesaAberto(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-5 rounded-2xl shadow-lg"
            icon={<Plus className="w-4 h-4" />}
          >
            Adicionar Mesa
          </Button>
        </div>
      </div>

      {/* Mesas Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          <span>Carregando mesas do restaurante...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {mesas.map((mesa) => {
            const pedidosMesa = getPedidosAtivosMesa(mesa.numero);
            const totalComanda = getTotalComandaMesa(mesa.numero);
            const temPedidos = pedidosMesa.length > 0;
            const statusAtual = temPedidos ? 'Ocupada' : 'Livre';

            const urlMesa = `${urlBase}/cardapio/${restaurante.slug}?mesa=${mesa.numero}`;

            return (
              <div
                key={mesa.id}
                className={`bg-white rounded-3xl border-2 p-5 shadow-xs transition-all flex flex-col justify-between gap-4 ${
                  temPedidos 
                    ? 'border-amber-400/80 bg-amber-50/20' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Mesa Nº {mesa.numero}
                    </span>
                    <h3 className="font-black text-slate-900 text-lg leading-tight">
                      {mesa.nome || `Mesa ${mesa.numero}`}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    temPedidos
                      ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {statusAtual}
                  </span>
                </div>

                {/* Comanda Info */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                      Pedidos Ativos:
                    </span>
                    <span className="font-bold text-slate-900">{pedidosMesa.length}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Total da Comanda:</span>
                    <span className="text-emerald-700 font-black text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalComanda)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMesaQrCode(mesa)}
                      className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Placa / QR</span>
                    </button>

                    <button
                      onClick={() => setMesaComanda(mesa)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        temPedidos
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Ver Comanda</span>
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setMesaParaExcluir(mesa)}
                      title="Excluir esta mesa"
                      className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-rose-200/80 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover Mesa</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal QR Code da Mesa */}
      {mesaQrCode && (
        <Modal
          isOpen={Boolean(mesaQrCode)}
          onClose={() => setMesaQrCode(null)}
          title={`Placa de Atendimento — ${mesaQrCode.nome || 'Mesa ' + mesaQrCode.numero}`}
        >
          <div className="space-y-6 text-center">
            <p className="text-xs text-slate-600">
              Imprima ou exiba este QR Code na mesa. O cliente escaneia a placa com a câmera do celular e faz os pedidos diretamente!
            </p>

            <div className="bg-slate-900 text-white p-6 rounded-3xl border-4 border-emerald-500 max-w-xs mx-auto shadow-2xl space-y-4">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                <Utensils className="w-4 h-4" />
                {restaurante.nome}
              </div>

              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${urlBase}/cardapio/${restaurante.slug}?mesa=${mesaQrCode.numero}`)}`}
                  alt={`QR Code Mesa ${mesaQrCode.numero}`}
                  className="w-44 h-44 mx-auto"
                />
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">CARDÁPIO DIGITAL</span>
                <h3 className="text-2xl font-black text-white">{mesaQrCode.nome || `Mesa ${mesaQrCode.numero}`}</h3>
                <p className="text-[11px] text-emerald-300 mt-1">Escaneie para ver o menu e fazer seu pedido</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                <input
                  type="text"
                  readOnly
                  value={`${urlBase}/cardapio/${restaurante.slug}?mesa=${mesaQrCode.numero}`}
                  className="bg-transparent border-none text-xs font-mono text-slate-700 w-full outline-none select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${urlBase}/cardapio/${restaurante.slug}?mesa=${mesaQrCode.numero}`);
                    setCopiadoUrl(true);
                    setTimeout(() => setCopiadoUrl(false), 2500);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copiadoUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiadoUrl ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>

              <Button
                onClick={() => handleImprimirPlacaMesa(mesaQrCode)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg cursor-pointer"
                icon={<Printer className="w-4 h-4 text-emerald-400" />}
              >
                Imprimir Placa da Mesa
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Ver Comanda da Mesa */}
      {mesaComanda && (
        <Modal
          isOpen={Boolean(mesaComanda)}
          onClose={() => setMesaComanda(null)}
          title={`Comanda Aberta — ${mesaComanda.nome || 'Mesa ' + mesaComanda.numero}`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl">
              <div>
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">Consumo no Local</span>
                <h3 className="text-lg font-black">{mesaComanda.nome || `Mesa ${mesaComanda.numero}`}</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Consumido</span>
                <span className="text-xl font-black text-emerald-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    getTotalComandaMesa(mesaComanda.numero)
                  )}
                </span>
              </div>
            </div>

            {/* Pedidos na Mesa */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {getPedidosAtivosMesa(mesaComanda.numero).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  Nenhum pedido lançado nesta comanda no momento.
                </div>
              ) : (
                getPedidosAtivosMesa(mesaComanda.numero).map((ped) => (
                  <div key={ped.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-800">
                        Pedido #{ped.id.slice(-5)} &bull; {ped.clienteNome}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(ped.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      {ped.produtos.map((p, idx) => (
                        <div key={idx} className="flex justify-between text-slate-700">
                          <span>
                            <strong>{p.quantidade}x</strong> {p.nome}
                            {p.observacao && <span className="text-slate-400 italic font-normal ml-1">({p.observacao})</span>}
                          </span>
                          <span className="font-mono font-medium">
                            R$ {(p.preco * p.quantidade).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => setPedidoParaImprimir(ped)}
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        Imprimir Via Cozinha / Comanda
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <Button
                onClick={() => setModalLancarItemAberto(true)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white"
                icon={<Plus className="w-4 h-4" />}
              >
                Lançar Item Direto pelo Garçom
              </Button>

              {getPedidosAtivosMesa(mesaComanda.numero).length > 0 && (
                <Button
                  onClick={() => setMesaParaFecharComanda(mesaComanda)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Fechar Comanda e Liberar Mesa
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Lançar Item pelo Garçom */}
      {modalLancarItemAberto && (
        <Modal
          isOpen={modalLancarItemAberto}
          onClose={() => setModalLancarItemAberto(false)}
          title={`Lançar Pedido na ${mesaComanda?.nome || 'Mesa ' + mesaComanda?.numero}`}
        >
          <form onSubmit={handleLancarItem} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Selecione o Produto *</label>
              <select
                required
                value={produtoSelecionadoId}
                onChange={(e) => setProdutoSelecionadoId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Selecione o item do cardápio --</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - R$ {p.preco.toFixed(2).replace('.', ',')} ({p.categoria})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={qtdLancar}
                  onChange={(e) => setQtdLancar(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observação</label>
                <input
                  type="text"
                  placeholder="Ex: Sem cebola, bem passado"
                  value={obsLancar}
                  onChange={(e) => setObsLancar(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={lancandoItem}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              icon={<Plus className="w-4 h-4" />}
            >
              Adicionar à Comanda
            </Button>
          </form>
        </Modal>
      )}

      {/* Modal Cadastrar Nova Mesa */}
      <Modal
        isOpen={modalMesaAberto}
        onClose={() => setModalMesaAberto(false)}
        title="Adicionar Nova Mesa"
      >
        <form onSubmit={handleSalvarMesa} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Número da Mesa *</label>
            <input
              type="text"
              required
              placeholder="Ex: 01, 02, 15, VIP-1"
              value={numeroMesaInput}
              onChange={(e) => setNumeroMesaInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome de Exibição (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: Mesa 01 - Salão Principal / Varanda"
              value={nomeMesaInput}
              onChange={(e) => setNomeMesaInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <Button
            type="submit"
            isLoading={salvandoMesa}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            Cadastrar Mesa
          </Button>
        </form>
      </Modal>

      {/* Modal Impressão Térmica */}
      {pedidoParaImprimir && restaurante && (
        <ComandaThermalModal
          isOpen={Boolean(pedidoParaImprimir)}
          pedido={pedidoParaImprimir}
          restaurante={restaurante}
          onClose={() => setPedidoParaImprimir(null)}
        />
      )}

      {/* Modal Confirmar Exclusão de Mesa */}
      {mesaParaExcluir && (
        <Modal
          isOpen={Boolean(mesaParaExcluir)}
          onClose={() => setMesaParaExcluir(null)}
          title={`Excluir ${mesaParaExcluir.nome || 'Mesa ' + mesaParaExcluir.numero}`}
        >
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-base">
                Tem certeza que deseja remover esta mesa?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                A <strong>{mesaParaExcluir.nome || `Mesa ${mesaParaExcluir.numero}`}</strong> será apagada do seu cadastro e o QR Code gerado deixará de funcionar.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <Button
                type="button"
                onClick={() => setMesaParaExcluir(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                isLoading={excluindoMesa}
                onClick={handleConfirmarExcluirMesa}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                icon={<Trash2 className="w-4 h-4" />}
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Confirmar Fechamento de Comanda */}
      {mesaParaFecharComanda && (
        <Modal
          isOpen={Boolean(mesaParaFecharComanda)}
          onClose={() => setMesaParaFecharComanda(null)}
          title={`Fechar Comanda — ${mesaParaFecharComanda.nome || 'Mesa ' + mesaParaFecharComanda.numero}`}
        >
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-base">
                Finalizar e liberar a mesa?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Ao fechar a comanda, os pedidos ativos da <strong>{mesaParaFecharComanda.nome || `Mesa ${mesaParaFecharComanda.numero}`}</strong> serão marcados como finalizados e o status voltará para Livre.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <Button
                type="button"
                onClick={() => setMesaParaFecharComanda(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Voltar
              </Button>
              <Button
                type="button"
                isLoading={fechandoComanda}
                onClick={handleConfirmarFecharComanda}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirmar & Liberar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
