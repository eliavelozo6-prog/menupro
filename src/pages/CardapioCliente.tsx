import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  buscarRestaurantePorSlug, 
  buscarRestaurantePorId, 
  listarProdutosRestaurante, 
  criarPedido,
  buscarCupomPorCodigo,
  buscarTaxasBairrosRestaurante,
  buscarAvaliacoesRestaurante,
  escutarPedidoUnico,
  solicitarCancelamentoPedido
} from '../services/database';
import { Restaurante, Produto, PedidoItem, Cupom, TaxaBairro, Avaliacao, VariacaoEscolhida, GrupoVariacao, VariacaoOpcao, Pedido } from '../types';
import { calcularStatusFuncionamento } from '../utils/horario';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  Phone, 
  MapPin, 
  Clock, 
  Search, 
  MessageCircle, 
  CheckCircle2, 
  Utensils, 
  ArrowRight,
  AlertCircle,
  QrCode,
  Ticket,
  Tag,
  Star,
  Bike,
  MessageSquare,
  Copy,
  Check,
  CreditCard,
  LayoutGrid,
  List,
  DollarSign,
  Trash2,
  Receipt
} from 'lucide-react';
import { Button } from '../components/Button';
import { SEO } from '../components/SEO';

export const CardapioCliente: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const mesaParam = searchParams.get('mesa');
  const navigate = useNavigate();

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');
  const [modoVisualizacao, setModoVisualizacao] = useState<'grid' | 'lista'>('grid');

  // Cart State
  const [carrinho, setCarrinho] = useState<PedidoItem[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [checkoutAberto, setCheckoutAberto] = useState(false);

  // Item Note Modal
  const [itemParaModal, setItemParaModal] = useState<Produto | null>(null);
  const [quantidadeItem, setQuantidadeItem] = useState(1);
  const [observacaoItem, setObservacaoItem] = useState('');

  // Checkout Form
  const [clienteNome, setClienteNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState(mesaParam ? `Mesa ${mesaParam}` : '');
  const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada' | 'mesa'>(mesaParam ? 'mesa' : 'entrega');
  const [numeroMesaInput, setNumeroMesaInput] = useState(mesaParam || '01');
  const [formaPagamento, setFormaPagamento] = useState(mesaParam ? 'Pagar no Caixa / Mesa' : 'Pix');
  const [trocoPara, setTrocoPara] = useState('');
  const [copiouPix, setCopiouPix] = useState(false);
  const [observacaoPedido, setObservacaoPedido] = useState('');
  const [copiouLinkCardapio, setCopiouLinkCardapio] = useState(false);

  const handleCompartilharWhatsApp = () => {
    if (!restaurante) return;
    const urlCardapio = window.location.href;
    const texto = `Olá! Confira o cardápio digital do *${restaurante.nome}* e faça seu pedido online de forma rápida:\n\n${urlCardapio}`;
    
    if (navigator.share) {
      navigator.share({
        title: restaurante.nome,
        text: `Cardápio Digital de ${restaurante.nome}`,
        url: urlCardapio
      }).catch(() => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
      });
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
    }
  };

  const handleCopiarLinkCardapio = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiouLinkCardapio(true);
    setTimeout(() => setCopiouLinkCardapio(false), 2500);
  };

  // Cupons
  const [cupomInput, setCupomInput] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<Cupom | null>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [erroCupom, setErroCupom] = useState('');
  const [sucessoCupom, setSucessoCupom] = useState('');

  // Taxas por Bairro
  const [taxasBairros, setTaxasBairros] = useState<TaxaBairro[]>([]);
  const [bairroSelecionadoId, setBairroSelecionadoId] = useState<string>('');

  // Avaliações
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [modalAvaliacoesAberto, setModalAvaliacoesAberto] = useState(false);

  // Pedidos Locais da Sessão / Comanda
  const [meusPedidosIds, setMeusPedidosIds] = useState<string[]>([]);
  const [meusPedidosLocais, setMeusPedidosLocais] = useState<Pedido[]>([]);
  const [modalMeusPedidosAberto, setModalMeusPedidosAberto] = useState(false);

  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [erroCheckout, setErroCheckout] = useState('');
  const [pedidoSucessoMesa, setPedidoSucessoMesa] = useState<{ id: string; numeroMesa: string; itemsCount: number; total: number } | null>(null);

  const handleEncerrarSessao = () => {
    if (confirm('Deseja realmente encerrar a sessão e limpar a comanda local desta mesa?')) {
      if (restaurante?.id) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`menupro_pedidos_${restaurante.id}`)) {
            localStorage.removeItem(key);
          }
        }
      }
      setMeusPedidosIds([]);
      setMeusPedidosLocais([]);
      setCarrinho([]);
      setModalMeusPedidosAberto(false);
      alert('Sessão encerrada com sucesso!');
    }
  };

  // Carregar histórico de pedidos locais do localStorage (Apenas para consumo em MESA)
  useEffect(() => {
    if (!restaurante?.id || !mesaParam) {
      setMeusPedidosIds([]);
      return;
    }
    const storageKey = `menupro_pedidos_${restaurante.id}_mesa_${mesaParam}`;
    const salvos = localStorage.getItem(storageKey);
    if (salvos) {
      try {
        const parsed = JSON.parse(salvos);
        if (Array.isArray(parsed)) {
          setMeusPedidosIds(parsed);
        }
      } catch (e) {
        console.error('Erro ao ler pedidos locais do localStorage:', e);
      }
    } else {
      setMeusPedidosIds([]);
    }
  }, [restaurante?.id, mesaParam]);

  // Escutar atualizações em tempo real dos pedidos realizados nesta sessão
  useEffect(() => {
    if (meusPedidosIds.length === 0) {
      setMeusPedidosLocais([]);
      return;
    }

    const unsubs = meusPedidosIds.map(id => {
      return escutarPedidoUnico(id, (p) => {
        if (p) {
          setMeusPedidosLocais(prev => {
            const idx = prev.findIndex(item => item.id === p.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = p;
              return copy;
            } else {
              return [p, ...prev];
            }
          });
        }
      });
    });

    return () => unsubs.forEach(u => u());
  }, [meusPedidosIds]);

  useEffect(() => {
    async function carregarCardapio() {
      if (!slug) return;
      setLoading(true);
      try {
        // Tenta buscar por slug, se não encontrar tenta por ID
        let rest = await buscarRestaurantePorSlug(slug);
        if (!rest) {
          rest = await buscarRestaurantePorId(slug);
        }

        if (rest) {
          setRestaurante(rest);
          const [prods, taxas, avs] = await Promise.all([
            listarProdutosRestaurante(rest.id),
            buscarTaxasBairrosRestaurante(rest.id),
            buscarAvaliacoesRestaurante(rest.id)
          ]);
          setProdutos(prods.filter(p => p.disponivel));
          setTaxasBairros(taxas.filter(t => t.ativo));
          setAvaliacoes(avs);

          // Se tiver taxa de bairro cadastrada, pré-seleciona a primeira
          if (taxas.filter(t => t.ativo).length > 0) {
            setBairroSelecionadoId(taxas.filter(t => t.ativo)[0].id);
          }
        } else {
          setRestaurante(null);
        }
      } catch (err) {
        console.error('Erro ao carregar cardapio:', err);
      } finally {
        setLoading(false);
      }
    }
    carregarCardapio();
  }, [slug]);

  // Estado de seleção de variações
  const [variacoesSelecionadas, setVariacoesSelecionadas] = useState<Record<string, string[]>>({});

  // Modais de Adição ao Carrinho
  const abrirModalItem = (prod: Produto) => {
    setItemParaModal(prod);
    setQuantidadeItem(1);
    setObservacaoItem('');

    // Preencher valores padrões de seleção
    const initialMap: Record<string, string[]> = {};
    if (prod.variacoes && prod.variacoes.length > 0) {
      prod.variacoes.forEach(g => {
        if (g.obrigatorio && (g.maximo || 1) === 1 && g.opcoes && g.opcoes.length > 0) {
          initialMap[g.id] = [g.opcoes[0].id];
        } else {
          initialMap[g.id] = [];
        }
      });
    }
    setVariacoesSelecionadas(initialMap);
  };

  const toggleVariacaoOpcao = (grupo: GrupoVariacao, opcaoId: string) => {
    const max = grupo.maximo || 1;
    setVariacoesSelecionadas(prev => {
      const atuais = prev[grupo.id] || [];
      if (max === 1) {
        return { ...prev, [grupo.id]: [opcaoId] };
      } else {
        if (atuais.includes(opcaoId)) {
          return { ...prev, [grupo.id]: atuais.filter(id => id !== opcaoId) };
        } else {
          if (atuais.length < max) {
            return { ...prev, [grupo.id]: [...atuais, opcaoId] };
          }
          return prev;
        }
      }
    });
  };

  const obterVariacoesEscolhidas = (): VariacaoEscolhida[] => {
    if (!itemParaModal?.variacoes) return [];
    const res: VariacaoEscolhida[] = [];
    itemParaModal.variacoes.forEach(g => {
      const selIds = variacoesSelecionadas[g.id] || [];
      selIds.forEach(oId => {
        const opt = g.opcoes.find(o => o.id === oId);
        if (opt) {
          res.push({
            grupoId: g.id,
            grupoTitulo: g.titulo,
            opcaoId: opt.id,
            opcaoNome: opt.nome,
            precoAdicional: opt.precoAdicional || 0
          });
        }
      });
    });
    return res;
  };

  const variacoesEscolhidasAtual = itemParaModal ? obterVariacoesEscolhidas() : [];
  const precoAdicionalTotalUnitario = variacoesEscolhidasAtual.reduce((acc, v) => acc + v.precoAdicional, 0);
  const precoUnitarioCalculado = (itemParaModal?.preco || 0) + precoAdicionalTotalUnitario;

  const validarVariacoesObrigatorias = (): { valido: boolean; mensagem?: string } => {
    if (!itemParaModal?.variacoes) return { valido: true };
    for (const g of itemParaModal.variacoes) {
      if (g.obrigatorio) {
        const min = g.minimo || 1;
        const sel = variacoesSelecionadas[g.id] || [];
        if (sel.length < min) {
          return {
            valido: false,
            mensagem: `Por favor, selecione pelo menos ${min} opção em "${g.titulo}".`
          };
        }
      }
    }
    return { valido: true };
  };

  const adicionarAoCarrinho = () => {
    if (!itemParaModal) return;

    const validacao = validarVariacoesObrigatorias();
    if (!validacao.valido) {
      alert(validacao.mensagem);
      return;
    }

    const vars = obterVariacoesEscolhidas();

    const novoItem: PedidoItem = {
      id: `${itemParaModal.id}-${Date.now()}`,
      produtoId: itemParaModal.id,
      nome: itemParaModal.nome,
      preco: precoUnitarioCalculado,
      quantidade: quantidadeItem,
      observacao: observacaoItem.trim(),
      variacoesEscolhidas: vars.length > 0 ? vars : undefined
    };

    setCarrinho(prev => [...prev, novoItem]);
    setItemParaModal(null);
  };

  const adicionarDiretoAoCarrinho = (prod: Produto, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    // Se o produto tiver variações/opcionais configurados, obriga a abrir o modal de escolha
    if (prod.variacoes && prod.variacoes.length > 0) {
      abrirModalItem(prod);
      return;
    }

    setCarrinho(prev => {
      const itemExistenteIndex = prev.findIndex(
        item => item.produtoId === prod.id && (!item.observacao || item.observacao === '') && (!item.variacoesEscolhidas || item.variacoesEscolhidas.length === 0)
      );

      if (itemExistenteIndex >= 0) {
        const novoCarrinho = [...prev];
        novoCarrinho[itemExistenteIndex] = {
          ...novoCarrinho[itemExistenteIndex],
          quantidade: novoCarrinho[itemExistenteIndex].quantidade + 1
        };
        return novoCarrinho;
      } else {
        const novoItem: PedidoItem = {
          id: `${prod.id}-${Date.now()}`,
          produtoId: prod.id,
          nome: prod.nome,
          preco: prod.preco,
          quantidade: 1,
          observacao: ''
        };
        return [...prev, novoItem];
      }
    });
  };

  const obterQtdNoCarrinho = (prodId: string) => {
    return carrinho
      .filter(item => item.produtoId === prodId)
      .reduce((sum, item) => sum + item.quantidade, 0);
  };

  const diminuirQtdDireto = (prodId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    setCarrinho(prev => {
      const itemsDoProduto = prev.filter(item => item.produtoId === prodId);
      if (itemsDoProduto.length === 0) return prev;

      const ultimoItem = itemsDoProduto[itemsDoProduto.length - 1];
      if (ultimoItem.quantidade > 1) {
        return prev.map(item => 
          item.id === ultimoItem.id 
            ? { ...item, quantidade: item.quantidade - 1 } 
            : item
        );
      } else {
        return prev.filter(item => item.id !== ultimoItem.id);
      }
    });
  };

  const alterarQtdItemCarrinho = (itemId: string, novaQtd: number) => {
    if (novaQtd <= 0) {
      removerDoCarrinho(itemId);
      return;
    }
    setCarrinho(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantidade: novaQtd } : item
    ));
  };

  const removerDoCarrinho = (itemId: string) => {
    setCarrinho(prev => prev.filter(item => item.id !== itemId));
  };

  const bairroSelecionado = taxasBairros.find(t => t.id === bairroSelecionadoId);
  const taxaEntregaCalculada = (tipoEntrega === 'entrega' && bairroSelecionado) ? bairroSelecionado.taxa : 0;

  const avaliacoesExibidas = avaliacoes.filter(a => a.exibirNoCardapio === true);
  const totalAvaliacoes = avaliacoesExibidas.length;
  const mediaAvaliacoes = totalAvaliacoes > 0
    ? (avaliacoesExibidas.reduce((acc, c) => acc + c.nota, 0) / totalAvaliacoes).toFixed(1)
    : (avaliacoes.length > 0 
        ? (avaliacoes.reduce((acc, c) => acc + c.nota, 0) / avaliacoes.length).toFixed(1) 
        : '5.0');

  const subtotalCarrinho = carrinho.reduce((sum, i) => sum + (i.preco * i.quantidade), 0);
  let valorDesconto = 0;
  if (cupomAplicado) {
    if (cupomAplicado.tipo === 'porcentagem') {
      valorDesconto = (subtotalCarrinho * cupomAplicado.valor) / 100;
    } else {
      valorDesconto = Math.min(cupomAplicado.valor, subtotalCarrinho);
    }
  }
  const valorTotalCarrinho = Math.max(0, subtotalCarrinho - valorDesconto + taxaEntregaCalculada);

  const handleAplicarCupom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!restaurante?.id) return;
    const cod = cupomInput.trim().toUpperCase();
    if (!cod) {
      setErroCupom('Digite o código do cupom.');
      return;
    }

    setValidandoCupom(true);
    setErroCupom('');
    setSucessoCupom('');

    try {
      const cupom = await buscarCupomPorCodigo(restaurante.id, cod);
      if (!cupom) {
        setErroCupom('Cupom inválido ou não encontrado.');
        return;
      }

      if (!cupom.ativo) {
        setErroCupom('Este cupom não está mais ativo.');
        return;
      }

      if (cupom.validade && new Date(cupom.validade) < new Date()) {
        setErroCupom('Este cupom já expirou.');
        return;
      }

      if (cupom.limiteUsos && cupom.usosAtuais >= cupom.limiteUsos) {
        setErroCupom('Este cupom atingiu o limite máximo de usos.');
        return;
      }

      if (cupom.valorMinimo && subtotalCarrinho < cupom.valorMinimo) {
        const minFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cupom.valorMinimo);
        setErroCupom(`Este cupom requer pedido mínimo de ${minFmt}.`);
        return;
      }

      setCupomAplicado(cupom);
      setSucessoCupom(`Cupom ${cupom.codigo} aplicado com sucesso!`);
    } catch (err) {
      console.error('Erro ao aplicar cupom:', err);
      setErroCupom('Erro ao validar cupom. Tente novamente.');
    } finally {
      setValidandoCupom(false);
    }
  };

  const handleRemoverCupom = () => {
    setCupomAplicado(null);
    setCupomInput('');
    setErroCupom('');
    setSucessoCupom('');
  };

  // Helper para verificar status Aberto/Fechado em tempo real
  const statusFuncionamento = calcularStatusFuncionamento(
    restaurante?.horarioFuncionamento,
    restaurante?.ativo !== false
  );

  // Helper para selos de destaques / badges dos pratos
  const obterBadgeProduto = (prod: Produto) => {
    if (prod.maisVendido || prod.destaque || prod.badge === 'mais_vendido') {
      return { rotulo: '🔥 Mais Vendido', bg: 'bg-amber-500 text-slate-950 font-black border-amber-400' };
    }
    if (prod.badge === 'promocao' || prod.nome.toLowerCase().includes('promo') || prod.nome.toLowerCase().includes('combo')) {
      return { rotulo: '🏷️ Promoção', bg: 'bg-rose-600 text-white font-extrabold border-rose-500' };
    }
    if (prod.badge === 'vegano' || prod.nome.toLowerCase().includes('vegan') || (prod.descricao && prod.descricao.toLowerCase().includes('vegano'))) {
      return { rotulo: '🌱 Vegano', bg: 'bg-emerald-600 text-white font-bold border-emerald-500' };
    }
    if (prod.badge === 'chef') {
      return { rotulo: '⭐ Recomendação do Chef', bg: 'bg-indigo-600 text-white font-bold border-indigo-500' };
    }
    return null;
  };

  const categorias = [
    '🔥 Mais Vendidos',
    'Todas',
    ...Array.from(new Set(produtos.map(p => p.categoria)))
  ];

  const existeMaisVendidosCadastrados = produtos.some(p => p.maisVendido || p.destaque || p.badge === 'mais_vendido');

  const produtosFiltrados = produtos.filter((p, index) => {
    const combinaBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || 
                          (p.descricao && p.descricao.toLowerCase().includes(busca.toLowerCase()));
    
    let combinaCat = true;
    if (categoriaSelecionada === '🔥 Mais Vendidos') {
      if (existeMaisVendidosCadastrados) {
        combinaCat = Boolean(p.maisVendido || p.destaque || p.badge === 'mais_vendido');
      } else {
        // Fallback caso o restaurante ainda não tenha marcado nenhum produto como "Mais Vendido"
        combinaCat = index < 4;
      }
    } else if (categoriaSelecionada !== 'Todas') {
      combinaCat = p.categoria === categoriaSelecionada;
    }

    return combinaBusca && combinaCat;
  });

  const handleFinalizarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurante) return;
    
    if (!statusFuncionamento.aberto) {
      setErroCheckout(`O estabelecimento está FECHADO no momento. Não é possível aceitar novos pedidos fora do horário de funcionamento (${statusFuncionamento.horarioExibicao}).`);
      return;
    }

    const isPedidoMesa = tipoEntrega === 'mesa' && Boolean(mesaParam);
    const numeroMesaFinal = mesaParam || '01';

    // Para delivery, endereço é obrigatório
    if (tipoEntrega === 'entrega' && !endereco) {
      setErroCheckout('Informe o endereço completo para entrega.');
      return;
    }

    // Para delivery e retirada, nome e telefone são obrigatórios. Para mesa, são totalmente opcionais!
    if (!isPedidoMesa && (!clienteNome.trim() || !telefone.trim())) {
      setErroCheckout('Por favor, informe seu nome e telefone para entrega ou retirada.');
      return;
    }

    setEnviandoPedido(true);
    setErroCheckout('');

    try {
      const nomeFinal = clienteNome.trim() || (isPedidoMesa ? `Cliente (Mesa ${numeroMesaFinal})` : 'Cliente');
      const telefoneFinal = telefone.trim() || (isPedidoMesa ? '(Atendimento Local)' : 'Não informado');

      const pedidoRealizado = await criarPedido({
        restauranteId: restaurante.id,
        clienteNome: nomeFinal,
        telefone: telefoneFinal,
        endereco: isPedidoMesa 
          ? `Consumo na Mesa ${numeroMesaFinal}` 
          : (tipoEntrega === 'entrega' ? endereco : 'Atendimento no Local / Balcão'),
        ...(tipoEntrega === 'entrega' && bairroSelecionado ? { bairro: bairroSelecionado.nomeBairro, taxaEntrega: taxaEntregaCalculada } : {}),
        tipoEntrega: isPedidoMesa ? 'mesa' : tipoEntrega,
        ...(isPedidoMesa ? { numeroMesa: numeroMesaFinal, statusComanda: 'Aberta' } : {}),
        formaPagamento,
        ...(formaPagamento === 'Dinheiro' && trocoPara ? { trocoPara } : {}),
        produtos: carrinho.map(item => ({
          id: item.id,
          nome: item.nome,
          preco: item.preco,
          quantidade: item.quantidade,
          ...(item.observacao ? { observacao: item.observacao } : {}),
          ...(item.variacoesEscolhidas && item.variacoesEscolhidas.length > 0 ? { variacoesEscolhidas: item.variacoesEscolhidas } : {})
        })),
        valorTotal: valorTotalCarrinho,
        ...(cupomAplicado ? { cupomCodigo: cupomAplicado.codigo, desconto: valorDesconto } : {}),
        ...(observacaoPedido ? { observacao: observacaoPedido } : {})
      });

      // Opção de abrir conversa no WhatsApp do restaurante com o espelho do pedido
      const whatsappPhone = (restaurante.whatsapp || restaurante.telefone || '').replace(/\D/g, '');
      if (whatsappPhone) {
        const resumoItems = carrinho.map(i => {
          let linha = `${i.quantidade}x ${i.nome} (R$ ${(i.preco * i.quantidade).toFixed(2).replace('.', ',')})`;
          if (i.variacoesEscolhidas && i.variacoesEscolhidas.length > 0) {
            const varsStr = i.variacoesEscolhidas.map(v => `   └ ${v.grupoTitulo}: ${v.opcaoNome}${v.precoAdicional > 0 ? ` (+R$ ${v.precoAdicional.toFixed(2).replace('.', ',')})` : ''}`).join('\n');
            linha += `\n${varsStr}`;
          }
          if (i.observacao) {
            linha += `\n   Obs: ${i.observacao}`;
          }
          return linha;
        }).join('\n');
        const isPixPayment = formaPagamento.toLowerCase().includes('pix');
        const avisoPix = isPixPayment 
          ? `\n\n📌 *IMPORTANTE:* Por favor, *envie o comprovante do Pix nesta conversa* logo em seguida para a confirmação do seu pedido!` 
          : '';

        const mensagem = `*Novo Pedido via MenuPro - #${pedidoRealizado.id.slice(0, 6)}*\n\n` +
          `*Cliente:* ${nomeFinal}\n` +
          `*Telefone:* ${telefoneFinal}\n` +
          `*Tipo:* ${isPedidoMesa ? `Pedido na Mesa ${numeroMesaFinal}` : (tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada')}\n` +
          `*Forma de Pagamento:* ${formaPagamento}\n\n` +
          `*Itens do Pedido:*\n${resumoItems}\n\n` +
          `*Valor Total:* R$ ${valorTotalCarrinho.toFixed(2).replace('.', ',')}` +
          `${avisoPix}\n\n` +
          `Acompanhar pedido em tempo real: ${window.location.origin}/pedido/${pedidoRealizado.id}`;

        const waUrl = `https://wa.me/55${whatsappPhone}?text=${encodeURIComponent(mensagem)}`;
        window.open(waUrl, '_blank');
      }

      const totalPedidoOriginal = valorTotalCarrinho;
      const countItensOriginal = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

      // Salvar no histórico de comanda apenas se for consumo em MESA
      if (restaurante?.id && isPedidoMesa) {
        const storageKey = `menupro_pedidos_${restaurante.id}_mesa_${numeroMesaFinal}`;
        setMeusPedidosIds(prev => {
          const novas = [pedidoRealizado.id, ...prev.filter(id => id !== pedidoRealizado.id)];
          try {
            localStorage.setItem(storageKey, JSON.stringify(novas));
          } catch (e) {
            console.error('Erro ao salvar pedidos locais:', e);
          }
          return novas;
        });
      }

      setCarrinho([]);
      setCheckoutAberto(false);

      if (isPedidoMesa) {
        setPedidoSucessoMesa({
          id: pedidoRealizado.id,
          numeroMesa: numeroMesaFinal,
          itemsCount: countItensOriginal,
          total: totalPedidoOriginal
        });
      } else {
        navigate(`/pedido/${pedidoRealizado.id}`);
      }
    } catch (err: any) {
      console.error('Erro ao registrar pedido:', err);
      setErroCheckout('Erro ao finalizar pedido: ' + (err.message || 'Tente novamente.'));
    } finally {
      setEnviandoPedido(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        Carregando cardápio digital...
      </div>
    );
  }

  if (!restaurante) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center text-white">
        <Utensils className="w-16 h-16 text-slate-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">Restaurante não encontrado</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          Nenhum dado encontrado para este endereço de cardápio digital.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-emerald-600 font-bold text-sm rounded-xl text-white hover:bg-emerald-500 cursor-pointer"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  if (restaurante.ativo === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black mb-2">Cardápio Temporariamente Bloqueado</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          Este estabelecimento ({restaurante.nome}) encontra-se suspenso ou bloqueado no momento. Entre em contato com a administração do restaurante.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm rounded-xl text-white transition-colors cursor-pointer"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-24">
      <SEO 
        title={`${restaurante ? restaurante.nome : 'Cardápio Digital'} - Pedidos Online | MenuPro`}
        description={restaurante?.descricao || `Cardápio digital de ${restaurante?.nome || 'restaurante'}. Confira pratos, bebidas e faça seu pedido online via WhatsApp!`}
        image={restaurante?.bannerUrl || restaurante?.logoUrl}
        jsonLd={restaurante ? {
          '@context': 'https://schema.org',
          '@type': 'Restaurant',
          'name': restaurante.nome,
          'description': restaurante.descricao || `Cardápio Digital de ${restaurante.nome}`,
          'image': restaurante.bannerUrl || restaurante.logoUrl,
          'telephone': restaurante.telefone,
          'address': restaurante.endereco,
          'servesCuisine': restaurante.categoria || 'Geral',
          'url': window.location.href
        } : undefined}
      />

      {/* Selo de Alerta em Horário Fechado */}
      {!statusFuncionamento.aberto && (
        <div className="bg-rose-950 text-rose-100 border-b border-rose-800/80 py-3 px-4 text-center font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 z-30 relative animate-in slide-in-from-top duration-200">
          <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
          <span>
            <strong>ESTABELECIMENTO FECHADO NO MOMENTO:</strong> O envio de novos pedidos está suspenso. Horário de Funcionamento: {statusFuncionamento.horarioExibicao}
          </span>
        </div>
      )}

      {/* Garçom Digital Banner */}
      {mesaParam && (
        <div className="bg-emerald-600 text-white py-2.5 px-4 text-center font-extrabold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 relative z-30">
          <Utensils className="w-4 h-4" />
          <span>GARÇOM DIGITAL ATIVO — Você está fazendo o pedido na <strong>MESA {mesaParam.toUpperCase()}</strong></span>
        </div>
      )}

      {/* Container de Capa e Cabeçalho do Restaurante */}
      <div className="relative bg-slate-900 text-white shadow-md">
        {/* Banner de Capa Superior do Cardápio (Fica ao Fundo) */}
        {restaurante.banner && (
          <div className="w-full h-44 sm:h-64 relative overflow-hidden bg-slate-950 border-b border-slate-800">
            <img 
              src={restaurante.banner} 
              alt={`Capa ${restaurante.nome}`} 
              className="w-full h-full object-cover relative z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-black/20 z-1" />
          </div>
        )}

        {/* Restaurant Header (Logo sobreposta à frente do Banner) */}
        <header className={`pb-8 px-4 relative z-10 ${restaurante.banner ? 'pt-0' : 'pt-6'}`}>
          <div className={`max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left ${restaurante.banner ? '-mt-12 sm:-mt-16' : ''}`}>
            {/* Foto de Perfil / Logo (Fica à frente cobrindo a borda do banner) */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-2xl shrink-0 overflow-hidden border-4 border-slate-900 relative z-30 ring-2 ring-slate-800/80">
              {restaurante.logo ? (
                <img src={restaurante.logo} alt={restaurante.nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-slate-200">{restaurante.nome.substring(0, 2).toUpperCase()}</span>
              )}
            </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black tracking-tight">{restaurante.nome}</h1>
              
              {/* Badge Status Aberto / Fechado em Tempo Real */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-xs ${
                statusFuncionamento.aberto 
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50' 
                  : 'bg-rose-950/80 text-rose-400 border-rose-500/50'
              }`}>
                <span className={`w-2 h-2 rounded-full ${statusFuncionamento.aberto ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span>{statusFuncionamento.rotulo}</span>
              </span>
            </div>

            {/* Avaliações Badge & Previsão de Entrega */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
              <button
                onClick={() => setModalAvaliacoesAberto(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-extrabold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{mediaAvaliacoes}</span>
                <span className="text-slate-400 font-medium">({totalAvaliacoes} {totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})</span>
              </button>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{statusFuncionamento.tempoEstimado} (Tempo Médio)</span>
              </span>

              {taxasBairros.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-950 text-sky-300 font-bold text-[11px] rounded-xl border border-sky-800">
                  <Bike className="w-3.5 h-3.5 text-sky-400" />
                  <span>Entrega por Bairro Ativa</span>
                </span>
              )}
            </div>

            {/* Botões Compartilhar no WhatsApp, Copiar Link & Ver Comanda */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
              {meusPedidosIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModalMeusPedidosAberto(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer border border-amber-300 animate-in fade-in"
                  title={mesaParam ? "Consultar Comanda Digital" : "Ver Meus Pedidos"}
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-950" />
                  <span>{mesaParam ? `Ver Comanda (${meusPedidosIds.length})` : `Meus Pedidos (${meusPedidosIds.length})`}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCompartilharWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer border border-emerald-400/40"
                title="Compartilhar Cardápio no WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>Compartilhar no WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopiarLinkCardapio}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                title="Copiar Link do Cardápio"
              >
                {copiouLinkCardapio ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiouLinkCardapio ? 'Link Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>

            {restaurante.endereco && (
              <p className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{restaurante.endereco}</span>
              </p>
            )}
            
            <p className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Horário: {statusFuncionamento.horarioExibicao}</span>
            </p>
          </div>
        </div>
      </header>
      </div>

      {/* Main Menu Container */}
      <main className="max-w-4xl mx-auto px-4 -mt-4 space-y-4 relative z-10">
        {mesaParam && (
          <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-md flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-200" />
              <span>Você está fazendo o pedido na <strong>MESA {mesaParam}</strong></span>
            </div>
            <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black">
              Atendimento no Local
            </span>
          </div>
        )}

        {/* Sticky Search & Category Navigation Bar */}
        <div className="sticky top-0 z-30 bg-slate-100/95 backdrop-blur-md pt-3 pb-3 -mx-4 px-4 border-b border-slate-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar no cardápio..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
              />
            </div>

            {/* Botão Ver Comanda / Meus Pedidos */}
            {meusPedidosIds.length > 0 && (
              <button
                type="button"
                onClick={() => setModalMeusPedidosAberto(true)}
                className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border border-amber-300 animate-in fade-in"
                title={mesaParam ? "Consultar Comanda Digital" : "Ver Meus Pedidos"}
              >
                <Receipt className="w-4 h-4 text-slate-950" />
                <span className="hidden xs:inline">{mesaParam ? 'Minha Comanda' : 'Meus Pedidos'}</span>
                <span className="bg-slate-950 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                  {meusPedidosIds.length}
                </span>
              </button>
            )}

            {/* Seletor de Layout: 2 Colunas (Grid) vs 1 Coluna (Lista) */}
            <div className="bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setModoVisualizacao('grid')}
                title="Exibir em 2 Colunas"
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  modoVisualizacao === 'grid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">2 Colunas</span>
              </button>
              <button
                type="button"
                onClick={() => setModoVisualizacao('lista')}
                title="Exibir em Lista (1 Coluna)"
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  modoVisualizacao === 'lista'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Lista</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto py-1 max-w-4xl mx-auto scrollbar-none">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaSelecionada(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                  categoriaSelecionada === cat
                    ? 'bg-emerald-600 text-white shadow-md scale-102 font-extrabold'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200/80'
                }`}
              >
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Items List */}
        {produtosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <span className="font-bold text-slate-800 text-base block">Nenhum dado encontrado</span>
            <p className="text-xs text-slate-500 mt-1">Nenhum produto disponível nesta categoria no momento.</p>
          </div>
        ) : (
          <div className={modoVisualizacao === 'grid' ? "grid grid-cols-2 gap-3 sm:gap-4" : "space-y-3"}>
            {produtosFiltrados.map((prod) => {
              const badgeInfo = obterBadgeProduto(prod);

              // MODO 2 COLUNAS (GRID)
              if (modoVisualizacao === 'grid') {
                return (
                  <div
                    key={prod.id}
                    onClick={() => abrirModalItem(prod)}
                    className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between gap-2.5 cursor-pointer relative overflow-hidden group"
                  >
                    {prod.imagem ? (
                      <div className="w-full h-28 sm:h-36 rounded-xl overflow-hidden bg-slate-100 relative border border-slate-100 shrink-0">
                        <img src={prod.imagem} alt={prod.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        {badgeInfo && (
                          <span className={`absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-black rounded border shadow-2xs ${badgeInfo.bg}`}>
                            {badgeInfo.rotulo}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-20 sm:h-24 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors relative shrink-0">
                        <Utensils className="w-6 h-6 sm:w-8 sm:h-8 opacity-40" />
                        {badgeInfo && (
                          <span className={`absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-black rounded border shadow-2xs ${badgeInfo.bg}`}>
                            {badgeInfo.rotulo}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1 flex-1 min-w-0">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider block truncate">
                        {prod.categoria}
                      </span>
                      <h3 className="font-black text-slate-900 text-xs sm:text-sm group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug">
                        {prod.nome}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">{prod.descricao || 'Sem descrição.'}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto gap-1">
                      <span className="font-black text-slate-900 text-xs sm:text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.preco)}
                      </span>
                      
                      {obterQtdNoCarrinho(prod.id) > 0 ? (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 p-0.5 rounded-xl shrink-0 shadow-2xs"
                        >
                          <button
                            type="button"
                            onClick={(e) => diminuirQtdDireto(prod.id, e)}
                            title="Diminuir quantidade"
                            className="w-7 h-7 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg flex items-center justify-center font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-black text-xs text-emerald-950 px-1 min-w-[18px] text-center">
                            {obterQtdNoCarrinho(prod.id)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => adicionarDiretoAoCarrinho(prod, e)}
                            title="Aumentar quantidade"
                            className="w-7 h-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => adicionarDiretoAoCarrinho(prod, e)}
                          title="Adicionar ao carrinho"
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // MODO LISTA 1 COLUNA
              return (
                <div
                  key={prod.id}
                  onClick={() => abrirModalItem(prod)}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-emerald-500 transition-all flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden group"
                >
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">
                        {prod.categoria}
                      </span>
                      {badgeInfo && (
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-md border shadow-2xs ${badgeInfo.bg}`}>
                          {badgeInfo.rotulo}
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-slate-900 text-base group-hover:text-emerald-700 transition-colors">{prod.nome}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{prod.descricao || 'Sem descrição.'}</p>
                    <span className="font-black text-slate-900 text-base block pt-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.preco)}
                    </span>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                    {prod.imagem ? (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 relative border border-slate-100">
                        <img src={prod.imagem} alt={prod.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : null}

                    {obterQtdNoCarrinho(prod.id) > 0 ? (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 p-1 rounded-xl shrink-0 shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={(e) => diminuirQtdDireto(prod.id, e)}
                          title="Diminuir quantidade"
                          className="w-8 h-8 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg flex items-center justify-center font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-black text-sm text-emerald-950 px-1.5 min-w-[20px] text-center">
                          {obterQtdNoCarrinho(prod.id)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => adicionarDiretoAoCarrinho(prod, e)}
                          title="Aumentar quantidade"
                          className="w-8 h-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => adicionarDiretoAoCarrinho(prod, e)}
                        title="Adicionar ao carrinho"
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {carrinho.length > 0 ? (
        <div className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto z-30">
          <button
            onClick={() => setCarrinhoAberto(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm transition-transform active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="bg-emerald-800 text-white text-xs px-2.5 py-1 rounded-lg">
                {carrinho.reduce((s, i) => s + i.quantidade, 0)} items
              </span>
              <span>Ver Seu Pedido Atual</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-black">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalCarrinho)}
              </span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      ) : meusPedidosIds.length > 0 ? (
        <div className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto z-30">
          <button
            onClick={() => setModalMeusPedidosAberto(true)}
            className="w-full bg-slate-900 hover:bg-black text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between font-bold text-xs transition-all active:scale-98 cursor-pointer border border-slate-700/80 backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">
                <Receipt className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <span className="block font-black text-amber-300 text-xs sm:text-sm">
                  Minha Comanda ({meusPedidosIds.length} {meusPedidosIds.length === 1 ? 'pedido' : 'pedidos'})
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Total acumulado: R$ {meusPedidosLocais.reduce((acc, p) => acc + (p.valorTotal || 0), 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-black text-xs shrink-0">
              <span>Ver Comanda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      ) : null}

      {/* Modal de Foto HD & Detalhes do Prato */}
      {itemParaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden border border-slate-200 my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Foto HD Preview / Header Image */}
            <div className="relative h-48 sm:h-56 bg-slate-900 overflow-hidden shrink-0">
              {itemParaModal.imagem ? (
                <img
                  src={itemParaModal.imagem}
                  alt={itemParaModal.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-slate-400 p-6 text-center space-y-2">
                  <Utensils className="w-16 h-16 text-emerald-500/40" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cardápio Digital HD</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

              {/* Botão de Fechar Modal */}
              <button
                onClick={() => setItemParaModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors shadow-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Tag / Category Badge no topo da foto */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30">
                  {itemParaModal.categoria}
                </span>
                {obterBadgeProduto(itemParaModal) && (
                  <span className={`px-3 py-1 text-xs font-black rounded-full border shadow-sm ${obterBadgeProduto(itemParaModal)?.bg}`}>
                    {obterBadgeProduto(itemParaModal)?.rotulo}
                  </span>
                )}
              </div>
            </div>

            {/* Conteúdo do Prato / Ingredientes & Observações */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black text-2xl text-slate-900 tracking-tight">{itemParaModal.nome}</h3>
                  <span className="text-xl font-black text-emerald-600 shrink-0">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemParaModal.preco)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  {itemParaModal.descricao || 'Item preparado na hora com ingredientes frescos e selecionados.'}
                </p>
              </div>

              {/* Tempo de Preparo & Informações do Prato */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tempo estimado de preparo: <strong className="text-slate-900">{itemParaModal.tempoPreparo || '15 a 25 min'}</strong></span>
                </div>

                {itemParaModal.ingredientes && (
                  <div className="pt-1.5 border-t border-slate-200/60">
                    <span className="font-bold text-slate-800 block mb-0.5">Ingredientes:</span>
                    <p className="text-slate-600">{itemParaModal.ingredientes}</p>
                  </div>
                )}

                {itemParaModal.alergicos && (
                  <div className="pt-1 text-[11px] text-amber-700 font-medium">
                    ⚠️ Alergênicos / Contém: {itemParaModal.alergicos}
                  </div>
                )}
              </div>

              {/* Grupos de Variações / Sabores / Opcionais do Produto */}
              {itemParaModal.variacoes && itemParaModal.variacoes.length > 0 && (
                <div className="space-y-4 pt-1 border-t border-slate-100">
                  {itemParaModal.variacoes.map((grupo) => {
                    const max = grupo.maximo || 1;
                    const selecionados = variacoesSelecionadas[grupo.id] || [];
                    const ehObrigatorio = grupo.obrigatorio;

                    return (
                      <div key={grupo.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block">
                              {grupo.titulo}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              {max === 1 ? 'Escolha 1 opção' : `Escolha até ${max} opções`}
                            </span>
                          </div>

                          {ehObrigatorio ? (
                            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200">
                              Obrigatório
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                              Opcional
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {grupo.opcoes.map((opcao) => {
                            const estaSelecionado = selecionados.includes(opcao.id);

                            return (
                              <button
                                type="button"
                                key={opcao.id}
                                onClick={() => toggleVariacaoOpcao(grupo, opcao.id)}
                                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                  estaSelecionado
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-500'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-medium'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                    estaSelecionado ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                                  }`}>
                                    {estaSelecionado && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <span className="text-xs truncate">{opcao.nome}</span>
                                </div>

                                {opcao.precoAdicional !== undefined && opcao.precoAdicional > 0 && (
                                  <span className="text-xs font-black text-emerald-700 shrink-0">
                                    + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opcao.precoAdicional)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Campo para Observação e Adicionais */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  ✏️ Observações ou Adicionais do Prato:
                </label>
                <textarea
                  rows={2}
                  value={observacaoItem}
                  onChange={(e) => setObservacaoItem(e.target.value)}
                  placeholder="Ex: Sem cebola, molho à parte, ponto da carne bem passado..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Seleção de Quantidade e Botão Adicionar ao Pedido */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start bg-slate-100 p-2 rounded-2xl border border-slate-200 shrink-0">
                  <span className="text-xs font-black text-slate-700 uppercase pl-1">Quantidade:</span>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantidadeItem(Math.max(1, quantidadeItem - 1))}
                      title="Diminuir"
                      className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={quantidadeItem}
                      onChange={(e) => setQuantidadeItem(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-10 text-center font-black text-base text-slate-900 bg-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantidadeItem(quantidadeItem + 1)}
                      title="Aumentar"
                      className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Button onClick={adicionarAoCarrinho} className="w-full py-3.5 text-sm font-black shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                  Adicionar ({quantidadeItem}) • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoUnitarioCalculado * quantidadeItem)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl p-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h3 className="font-bold text-lg text-slate-900">Seu Pedido</h3>
                <button onClick={() => setCarrinhoAberto(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto my-4">
                {carrinho.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{item.nome}</h4>
                      {item.variacoesEscolhidas && item.variacoesEscolhidas.length > 0 && (
                        <div className="space-y-0.5 my-1">
                          {item.variacoesEscolhidas.map((v, vIdx) => (
                            <p key={vIdx} className="text-[11px] text-indigo-700 font-semibold leading-tight">
                              └ {v.grupoTitulo}: {v.opcaoNome}
                              {v.precoAdicional > 0 && <span className="text-indigo-500 font-normal"> (+R$ {v.precoAdicional.toFixed(2).replace('.', ',')})</span>}
                            </p>
                          ))}
                        </div>
                      )}
                      {item.observacao && <p className="text-xs text-amber-700 italic">Obs: {item.observacao}</p>}
                      <span className="text-xs text-slate-500 font-semibold block">
                        R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {/* Seletor de Quantidade Interativo do Item no Carrinho */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => alterarQtdItemCarrinho(item.id, item.quantidade - 1)}
                          title="Diminuir"
                          className="w-7 h-7 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-xs px-2 text-slate-900 min-w-[20px] text-center">
                          {item.quantidade}
                        </span>
                        <button
                          type="button"
                          onClick={() => alterarQtdItemCarrinho(item.id, item.quantidade + 1)}
                          title="Aumentar"
                          className="w-7 h-7 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removerDoCarrinho(item.id)}
                        title="Remover produto do pedido"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              {/* Cupom de Desconto Input */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-amber-600" />
                  <span>Possui um Cupom de Desconto?</span>
                </label>

                {cupomAplicado ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span>{cupomAplicado.codigo}</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-md">
                        {cupomAplicado.tipo === 'porcentagem' ? `-${cupomAplicado.valor}%` : `-R$ ${cupomAplicado.valor}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoverCupom}
                      className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cupomInput}
                      onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
                      placeholder="Ex: PRIMEIRA10"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAplicarCupom()}
                      disabled={validandoCupom}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {validandoCupom ? '...' : 'Aplicar'}
                    </button>
                  </div>
                )}

                {erroCupom && <p className="text-[11px] text-rose-600 font-medium">{erroCupom}</p>}
                {sucessoCupom && <p className="text-[11px] text-emerald-700 font-medium">{sucessoCupom}</p>}
              </div>

              {/* Total breakdown */}
              <div className="space-y-1 pt-1">
                {valorDesconto > 0 && (
                  <>
                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                      <span>Subtotal:</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotalCarrinho)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-700 font-bold">
                      <span>Desconto ({cupomAplicado?.codigo}):</span>
                      <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorDesconto)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center text-lg font-black text-slate-900 pt-1">
                  <span>Total a Pagar:</span>
                  <span className="text-emerald-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalCarrinho)}
                  </span>
                </div>
              </div>

              {!statusFuncionamento.aberto ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                  <span>Estabelecimento fechado no momento. Horário: {statusFuncionamento.horarioExibicao}</span>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    setCarrinhoAberto(false);
                    setCheckoutAberto(true);
                  }}
                  className="w-full py-4 text-base"
                >
                  Avançar para Checkout
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Form Modal */}
      {checkoutAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0 z-10">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  {tipoEntrega === 'mesa' ? 'Finalizar Pedido na Mesa' : 'Dados de Entrega e Pagamento'}
                </h3>
                <p className="text-xs text-slate-500">
                  {tipoEntrega === 'mesa' ? 'Confirme e envie seu pedido direto para a cozinha' : 'Informe seus dados para concluir o pedido'}
                </p>
              </div>
              <button type="button" onClick={() => setCheckoutAberto(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalizarPedido} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {erroCheckout && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{erroCheckout}</span>
                </div>
              )}

              {/* Seleção do Tipo de Pedido */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">Como deseja receber seu pedido? *</label>
                <div className={`grid ${mesaParam ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  {mesaParam && (
                    <button
                      type="button"
                      onClick={() => {
                        setTipoEntrega('mesa');
                        setFormaPagamento('Pagar no Caixa / Mesa');
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                        tipoEntrega === 'mesa' ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-2xs' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Utensils className="w-4 h-4 text-emerald-600" />
                      <span>Consumo Mesa</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setTipoEntrega('entrega');
                      if (formaPagamento === 'Pagar no Caixa / Mesa') setFormaPagamento('Pix');
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                      tipoEntrega === 'entrega' ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-2xs' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Bike className="w-4 h-4 text-sky-600" />
                    <span>Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoEntrega('retirada');
                      if (formaPagamento === 'Pagar no Caixa / Mesa') setFormaPagamento('Pix');
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                      tipoEntrega === 'retirada' ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-2xs' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span>Retirada</span>
                  </button>
                </div>
              </div>

              {/* Banner / Detalhes para Pedidos na Mesa */}
              {tipoEntrega === 'mesa' && mesaParam && (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-emerald-700" />
                      <span className="font-extrabold text-xs text-emerald-950 uppercase tracking-wide">
                        Atendimento Local / Garçom Digital
                      </span>
                    </div>
                    <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      Sem Frete
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200 text-xs">
                    <span className="font-bold text-slate-700">Mesa Identificada:</span>
                    <span className="font-black text-emerald-700 text-sm bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300">
                      MESA {mesaParam.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                    ⚡ <strong>Pedido Rápido na Mesa:</strong> Não é necessário preencher endereço. O pedido é enviado diretamente para a cozinha e servido em sua mesa!
                  </p>
                </div>
              )}

              {/* Dados do Cliente (Opcional na Mesa) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Seu Nome {tipoEntrega === 'mesa' ? <span className="text-emerald-600 font-normal lowercase">(opcional)</span> : '*'}
                  </label>
                  <input
                    type="text"
                    required={tipoEntrega !== 'mesa'}
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder={tipoEntrega === 'mesa' ? `Mesa ${mesaParam || numeroMesaInput || '01'} (Opcional)` : "Ex: Maria Santos"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    WhatsApp / Telefone {tipoEntrega === 'mesa' ? <span className="text-emerald-600 font-normal lowercase">(opcional)</span> : '*'}
                  </label>
                  <input
                    type="text"
                    required={tipoEntrega !== 'mesa'}
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder={tipoEntrega === 'mesa' ? "(Opcional na mesa)" : "(11) 99999-9999"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {tipoEntrega === 'entrega' && (
                <div className="space-y-3">
                  {taxasBairros.length > 0 && (
                    <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-2xl space-y-1.5">
                      <label className="text-xs font-bold text-sky-900 flex items-center gap-1.5 uppercase">
                        <Bike className="w-4 h-4 text-sky-600" />
                        <span>Selecione seu Bairro ou Região *</span>
                      </label>
                      <select
                        value={bairroSelecionadoId}
                        onChange={(e) => setBairroSelecionadoId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-sky-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
                      >
                        {taxasBairros.map((tb) => (
                          <option key={tb.id} value={tb.id}>
                            {tb.nomeBairro} — {tb.taxa === 0 ? 'Grátis' : `Taxa: R$ ${tb.taxa.toFixed(2).replace('.', ',')}`} {tb.tempoEstimadoMinutos ? `(${tb.tempoEstimadoMinutos})` : ''}
                          </option>
                        ))}
                      </select>
                      {bairroSelecionado && (
                        <div className="flex items-center justify-between text-[11px] text-sky-800 font-semibold pt-1">
                          <span>Frete: <strong>{bairroSelecionado.taxa === 0 ? 'Grátis' : `R$ ${bairroSelecionado.taxa.toFixed(2).replace('.', ',')}`}</strong></span>
                          {bairroSelecionado.tempoEstimadoMinutos && (
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-sky-600" /> Est: {bairroSelecionado.tempoEstimadoMinutos}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Endereço Completo de Entrega *</label>
                    <input
                      type="text"
                      required
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Rua, Número, Ap / Bloco, Ponto de Referência"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Seleção Interativa de Formas de Pagamento & Troco */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase">Forma de Pagamento *</label>
                
                {tipoEntrega === 'mesa' ? (
                  <div className="bg-emerald-50 border-2 border-emerald-500/80 p-4 rounded-2xl space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 text-emerald-950 font-black text-sm">
                      <Receipt className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Pagar no Caixa / Mesa (Comanda Aberta)</span>
                    </div>
                    <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                      💳 Os valores deste e dos próximos pedidos são lançados na sua <strong>Comanda Aberta da Mesa {mesaParam || numeroMesaInput || '01'}</strong>. Você acerta o pagamento diretamente no caixa ou com o garçom ao encerrar a conta!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('Pix')}
                      className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        formaPagamento === 'Pix'
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-emerald-600" />
                      <span>Pix (Chave On-line)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormaPagamento('Cartão de Crédito')}
                      className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        formaPagamento === 'Cartão de Crédito'
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span>Cartão de Crédito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormaPagamento('Cartão de Débito')}
                      className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        formaPagamento === 'Cartão de Débito'
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      <span>Cartão de Débito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormaPagamento('Dinheiro')}
                      className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        formaPagamento === 'Dinheiro'
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <DollarSign className="w-5 h-5 text-amber-600" />
                      <span>Dinheiro</span>
                    </button>
                  </div>
                )}

                {/* Exibição Chave Pix com Copiar/Colar */}
                {formaPagamento === 'Pix' && (
                  <div className="bg-emerald-950 text-emerald-50 p-4 rounded-2xl border border-emerald-800 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                        Chave Pix do Restaurante:
                      </span>
                      {restaurante?.chavePix ? (
                        <span className="text-[10px] bg-emerald-900/80 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-700/50">
                          {restaurante.titularPix || 'Chave Oficial'}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-900/80 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-700/50">
                          Celular do Cadastro
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/60 font-mono text-xs text-white">
                      <span className="flex-1 truncate select-all">
                        {restaurante?.chavePix || restaurante?.whatsapp || 'Chave não cadastrada'}
                      </span>
                      {(restaurante?.chavePix || restaurante?.whatsapp) && (
                        <button
                          type="button"
                          onClick={() => {
                            const chave = restaurante?.chavePix || restaurante?.whatsapp || '';
                            navigator.clipboard.writeText(chave);
                            setCopiouPix(true);
                            setTimeout(() => setCopiouPix(false), 3000);
                          }}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiouPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiouPix ? 'Copiado!' : 'Copiar Pix'}</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-emerald-300">
                      {restaurante?.chavePix
                        ? '💡 Copie a chave Pix acima, realize a transferência no app do seu banco e conclua o pedido.'
                        : '⚠️ O restaurante ainda não cadastrou uma Chave Pix específica nas Configurações. Usando o número de celular/WhatsApp cadastrado como alternativa.'}
                    </p>

                    <div className="bg-emerald-900/90 border border-emerald-500/50 p-2.5 rounded-xl text-[11px] text-emerald-200 flex items-start gap-2">
                      <QrCode className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>📲 Envio do Comprovante:</strong> Ao finalizar, o WhatsApp do restaurante será aberto automaticamente. <strong>Por favor, envie o comprovante do Pix por lá!</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Opções de Cartão na Maquininha */}
                {(formaPagamento === 'Cartão de Crédito' || formaPagamento === 'Cartão de Débito') && (
                  <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>
                      {tipoEntrega === 'entrega' ? (
                        <>Nosso entregador levará a maquininha para pagamento em <strong>{formaPagamento}</strong>.</>
                      ) : tipoEntrega === 'mesa' ? (
                        <>O pagamento na maquininha em <strong>{formaPagamento}</strong> será realizado na mesa / caixa do estabelecimento.</>
                      ) : (
                        <>O pagamento na maquininha em <strong>{formaPagamento}</strong> será realizado no balcão no momento da retirada.</>
                      )}
                    </span>
                  </div>
                )}

                {/* Campo de Troco Dinheiro com Calculadora Real-time */}
                {formaPagamento === 'Dinheiro' && (
                  <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-3 animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-amber-950 uppercase">
                      💰 Troco para quanto? (Deixe em branco se não precisar)
                    </label>
                    
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">R$</span>
                      <input
                        type="text"
                        value={trocoPara}
                        onChange={(e) => setTrocoPara(e.target.value)}
                        placeholder="Ex: 50,00 ou 100,00"
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {(() => {
                      if (!trocoPara.trim()) return null;
                      const numVal = parseFloat(trocoPara.replace('.', '').replace(',', '.'));
                      if (isNaN(numVal)) return null;

                      const diferenca = numVal - valorTotalCarrinho;
                      if (diferenca < 0) {
                        return (
                          <div className="text-xs font-bold text-rose-700 bg-rose-100 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Atenção: O valor pago (R$ {numVal.toFixed(2)}) é menor que o total (R$ {valorTotalCarrinho.toFixed(2)}).</span>
                          </div>
                        );
                      }
                      return (
                        <div className="text-xs font-extrabold text-emerald-900 bg-emerald-100/90 p-2.5 rounded-xl border border-emerald-300 flex items-center justify-between">
                          <span>Troco estimado a receber:</span>
                          <span className="text-emerald-700 text-sm font-black">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diferenca)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observações do Pedido</label>
                <textarea
                  rows={2}
                  value={observacaoPedido}
                  onChange={(e) => setObservacaoPedido(e.target.value)}
                  placeholder="Alguma instrução especial para a entrega ou cozinha?"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Resumo do Total */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Subtotal:</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotalCarrinho)}</span>
                </div>
                {valorDesconto > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-bold">
                    <span>Desconto ({cupomAplicado?.codigo}):</span>
                    <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorDesconto)}</span>
                  </div>
                )}
                {tipoEntrega === 'entrega' && (
                  <div className="flex justify-between items-center text-sky-800 font-bold">
                    <span>Taxa de Entrega ({bairroSelecionado?.nomeBairro || 'Delivery'}):</span>
                    <span>{taxaEntregaCalculada === 0 ? 'Grátis' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(taxaEntregaCalculada)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-black text-slate-900 text-base pt-1 border-t border-slate-200">
                  <span>Total Final:</span>
                  <span className="text-emerald-600 text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalCarrinho)}
                  </span>
                </div>
              </div>

              {!statusFuncionamento.aberto && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-rose-950">Estabelecimento Fechado</p>
                    <p className="text-rose-800 text-[11px] mt-0.5">
                      Não é possível enviar o pedido no momento pois o restaurante está fora do horário de funcionamento ({statusFuncionamento.horarioExibicao}).
                    </p>
                  </div>
                </div>
              )}

              {/* Aviso LGPD / Privacidade */}
              <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <span>
                  Seus dados serão utilizados exclusivamente para entrega e acompanhamento do pedido, em conformidade com a <strong>LGPD</strong>.
                </span>
                <a 
                  href="/politica-de-privacidade" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-700 font-bold hover:underline shrink-0"
                >
                  Saiba mais
                </a>
              </div>

              <Button 
                type="submit" 
                isLoading={enviandoPedido} 
                disabled={enviandoPedido || !statusFuncionamento.aberto}
                className={`w-full py-4 text-base mt-2 ${!statusFuncionamento.aberto ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-500 shadow-none' : ''}`}
              >
                {!statusFuncionamento.aberto 
                  ? 'Estabelecimento Fechado' 
                  : (tipoEntrega === 'mesa' 
                      ? `Confirmar Pedido na Mesa ${mesaParam || numeroMesaInput || '01'}` 
                      : 'Enviar Pedido ao Restaurante')}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Avaliações / Feedback dos Clientes */}
      {modalAvaliacoesAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <h3 className="font-bold text-lg text-slate-900">Avaliações do {restaurante.nome}</h3>
              </div>
              <button onClick={() => setModalAvaliacoesAberto(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-around text-center">
              <div>
                <span className="text-3xl font-black text-slate-900">{mediaAvaliacoes}</span>
                <span className="text-xs text-slate-500 block font-medium">Nota Média</span>
              </div>
              <div className="h-8 w-px bg-amber-200" />
              <div>
                <span className="text-3xl font-black text-slate-900">{totalAvaliacoes}</span>
                <span className="text-xs text-slate-500 block font-medium">Avaliações</span>
              </div>
            </div>

            {avaliacoesExibidas.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-1">
                <p className="font-bold text-slate-600">Nenhum comentário selecionado para exibição no momento.</p>
                <p>Avalie o restaurante ao concluir seu pedido!</p>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {avaliacoesExibidas.map((a) => (
                  <div key={a.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{a.clienteNome}</span>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= a.nota ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {a.comentario && <p className="text-slate-700 italic">"{a.comentario}"</p>}
                    <span className="text-[10px] text-slate-400 block text-right">
                      {new Date(a.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Sucesso - Pedido na Mesa (Consumo Local) */}
      {pedidoSucessoMesa && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50 shadow-inner">
              <Utensils className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                Pedido Enviado para a Cozinha! ⚡
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                MESA {pedidoSucessoMesa.numeroMesa.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pedido <strong>#{pedidoSucessoMesa.id.slice(0, 6)}</strong> registrado com sucesso na comanda.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-700 font-bold">
                <span>Resumo deste pedido:</span>
                <span>{pedidoSucessoMesa.itemsCount} {pedidoSucessoMesa.itemsCount === 1 ? 'item' : 'itens'}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                <span>Valor deste Pedido:</span>
                <span className="text-emerald-600">R$ {pedidoSucessoMesa.total.toFixed(2).replace('.', ',')}</span>
              </div>

              {meusPedidosIds.length > 1 && (
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-950 font-bold flex justify-between items-center text-xs mt-2">
                  <span>Total Acumulado ({meusPedidosIds.length} pedidos):</span>
                  <span className="text-amber-800 font-black">
                    R$ {meusPedidosLocais.reduce((acc, p) => acc + (p.valorTotal || 0), 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <p>📍 <strong>Atendimento Local:</strong> Os itens já estão em preparo e serão levados diretamente até a sua mesa.</p>
                <p>💳 <strong>Pagamento:</strong> Os valores foram adicionados à sua comanda e você acerta no caixa ou com o garçom ao encerrar a conta.</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setPedidoSucessoMesa(null)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Fazer Novo Pedido (Mesa {pedidoSucessoMesa.numeroMesa})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPedidoSucessoMesa(null);
                  setModalMeusPedidosAberto(true);
                }}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Receipt className="w-4 h-4 text-slate-950" />
                <span>Visualizar Comanda Completa ({meusPedidosIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Itens Pedidos / Comanda da Sessão */}
      {modalMeusPedidosAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">Resumo da Comanda Digital</h3>
                  <p className="text-xs text-slate-500">
                    {mesaParam ? `Atendimento na Mesa ${mesaParam}` : (restaurante?.nome || 'Seus Pedidos')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalMeusPedidosAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Summary Banner */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-black tracking-wider block">
                  Total da Comanda ({meusPedidosLocais.length} {meusPedidosLocais.length === 1 ? 'pedido' : 'pedidos'})
                </span>
                <span className="text-xs text-slate-300">
                  {meusPedidosLocais.reduce((acc, p) => acc + (p.produtos ? p.produtos.reduce((s, i) => s + i.quantidade, 0) : 0), 0)} itens solicitados
                </span>
              </div>

              <span className="text-2xl font-black text-emerald-400">
                R$ {meusPedidosLocais.reduce((sum, p) => sum + (p.valorTotal || 0), 0).toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* List of Orders */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {meusPedidosLocais.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Receipt className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700 text-sm">Nenhum pedido localizado nesta sessão.</p>
                  <p className="text-xs text-slate-400">Adicione produtos ao carrinho e confirme para realizar seu primeiro pedido!</p>
                </div>
              ) : (
                meusPedidosLocais.map((p, idx) => {
                  const statusColor = 
                    p.status === 'Novo pedido' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    p.status === 'Aceito' ? 'bg-sky-100 text-sky-900 border-sky-300' :
                    p.status === 'Pronto' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                    p.status === 'Entregue' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                    'bg-rose-100 text-rose-900 border-rose-300';

                  return (
                    <div key={p.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-slate-200/80 pb-2">
                        <div>
                          <span className="font-black text-slate-900 block">
                            Pedido #{p.id.slice(0, 6)} ({meusPedidosLocais.length - idx}º pedido)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(p.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${statusColor}`}>
                          {p.status}
                        </span>
                      </div>

                      {/* Cancelation status note if requested */}
                      {p.solicitacaoCancelamento?.status === 'pendente' && (
                        <div className="bg-amber-100 text-amber-900 border border-amber-300 p-2 rounded-xl text-[11px] font-bold">
                          ⏳ Cancelamento solicitado ao restaurante. Aguardando decisão do estabelecimento...
                        </div>
                      )}
                      {p.solicitacaoCancelamento?.status === 'recusado' && (
                        <div className="bg-rose-100 text-rose-900 border border-rose-200 p-2 rounded-xl text-[11px] font-bold">
                          ❌ Solicitação de cancelamento recusada pelo restaurante.
                        </div>
                      )}

                      {/* Items inside order */}
                      <div className="space-y-1.5 text-xs">
                        {p.produtos && p.produtos.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between items-start text-slate-800">
                            <div className="space-y-0.5">
                              <span className="font-bold">
                                {item.quantidade}x {item.nome}
                              </span>
                              {item.variacoesEscolhidas && item.variacoesEscolhidas.length > 0 && (
                                <div className="text-[11px] text-slate-500 pl-2 border-l-2 border-slate-300">
                                  {item.variacoesEscolhidas.map(v => `${v.grupoTitulo}: ${v.opcaoNome}`).join(' • ')}
                                </div>
                              )}
                              {item.observacao && (
                                <p className="text-[10px] text-amber-800 italic">Obs: {item.observacao}</p>
                              )}
                            </div>
                            <span className="font-bold shrink-0 ml-2">
                              R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Order Subtotal & Track */}
                      <div className="pt-2 border-t border-slate-200/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setModalMeusPedidosAberto(false);
                              navigate(`/pedido/${p.id}`);
                            }}
                            className="text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 hover:underline text-[11px]"
                          >
                            <span>Acompanhar Status</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <div className="font-black text-slate-900 text-xs sm:text-sm">
                            Subtotal: <span className="text-emerald-700">R$ {(p.valorTotal || 0).toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>

                        {/* Botão de Cancelar Pedido (Pouco escondido conforme solicitado) */}
                        {p.status !== 'Finalizado' && p.status !== 'Cancelado' && p.solicitacaoCancelamento?.status !== 'pendente' && (
                          <details className="text-[10px] text-slate-400">
                            <summary className="cursor-pointer hover:text-slate-600 font-medium transition-colors select-none py-0.5">
                              Opções do pedido / Ajuda
                            </summary>
                            <div className="pt-1 pb-0.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm('Deseja enviar um pedido de cancelamento ao restaurante?')) {
                                    const motivo = prompt('Informe o motivo do cancelamento (opcional):');
                                    if (motivo !== null) {
                                      try {
                                        await solicitarCancelamentoPedido(p.id, motivo);
                                        alert('Solicitação de cancelamento enviada com sucesso! Aguarde a resposta do restaurante.');
                                      } catch (e) {
                                        alert('Erro ao solicitar cancelamento.');
                                      }
                                    }
                                  }
                                }}
                                className="text-rose-500 hover:text-rose-700 text-[10px] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <span>Solicitar cancelamento deste pedido</span>
                              </button>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => setModalMeusPedidosAberto(false)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Itens à Comanda / Continuar Navegando</span>
              </button>

              {(meusPedidosIds.length > 0 || meusPedidosLocais.length > 0) && (
                <button
                  type="button"
                  onClick={handleEncerrarSessao}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all border border-rose-200 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Encerrar Sessão / Limpar Comanda do Aparelho</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
