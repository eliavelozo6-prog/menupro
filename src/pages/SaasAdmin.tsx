import React, { useEffect, useState } from 'react';
import { 
  Restaurante, 
  Plano, 
  Usuario,
  ConfiguracoesSaas,
  AvisoGeral
} from '../types';
import { 
  listarRestaurantes, 
  mudarStatusRestaurante, 
  excluirRestaurante,
  listarPlanos, 
  cadastrarPlano, 
  atualizarPlano, 
  excluirPlano,
  inicializarPlanosIniciais,
  obterConfiguracoesSaas,
  salvarConfiguracoesSaas,
  aprovarAssinaturaSaas,
  rejeitarAssinaturaSaas,
  obterIdsRestaurantesAdmin,
  calcularDiasRestantesPlano,
  formatarDataVencimentoPlano,
  CONFIGURACAO_SAAS_PADRAO,
  listarAvisosGerais,
  salvarAvisoGeral,
  alternarStatusAvisoGeral,
  excluirAvisoGeral
} from '../services/database';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { 
  ShieldAlert, 
  Store, 
  Users, 
  CreditCard, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  Search,
  Lock,
  Unlock,
  Check,
  QrCode,
  Copy,
  Save,
  Mail,
  Calendar,
  Megaphone,
  Bell,
  Send,
  Radio,
  Sparkles,
  ExternalLink,
  Eye,
  RefreshCw
} from 'lucide-react';

interface SaasAdminProps {
  usuario: Usuario | null;
}

export const SaasAdmin: React.FC<SaasAdminProps> = ({ usuario }) => {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);

  // State for Pix Rejection Modal
  const [restauranteRejeitarModal, setRestauranteRejeitarModal] = useState<Restaurante | null>(null);
  const [motivoRejeicaoInput, setMotivoRejeicaoInput] = useState<string>('');
  const [rejeitando, setRejeitando] = useState(false);

  // Tab State
  const [abaAtiva, setAbaAtiva] = useState<'restaurantes' | 'planos' | 'pix' | 'aprova-pix' | 'avisos'>('restaurantes');

  // Avisos e Comunicados Geral State
  const [avisos, setAvisos] = useState<AvisoGeral[]>([]);
  const [idAvisoEdicao, setIdAvisoEdicao] = useState<string | null>(null);
  const [tituloAviso, setTituloAviso] = useState('');
  const [mensagemAviso, setMensagemAviso] = useState('');
  const [tipoAviso, setTipoAviso] = useState<'info' | 'novidade' | 'alerta' | 'manutencao'>('novidade');
  const [linkDestinoAviso, setLinkDestinoAviso] = useState('');
  const [textoBotaoAviso, setTextoBotaoAviso] = useState('');
  const [ativoAviso, setAtivoAviso] = useState(true);
  const [salvandoAviso, setSalvandoAviso] = useState(false);
  const [avisoExcluir, setAvisoExcluir] = useState<AvisoGeral | null>(null);
  const [excluindoAviso, setExcluindoAviso] = useState(false);

  // SaaS Pix Config State
  const [configPix, setConfigPix] = useState<ConfiguracoesSaas>(CONFIGURACAO_SAAS_PADRAO);
  const [salvandoPix, setSalvandoPix] = useState(false);
  const [sucessoPix, setSucessoPix] = useState(false);

  // Modal Plan State
  const [modalPlanoAberto, setModalPlanoAberto] = useState(false);
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null);

  // Plan Form
  const [nomePlano, setNomePlano] = useState('');
  const [descricaoPlano, setDescricaoPlano] = useState('');
  const [precoPlano, setPrecoPlano] = useState('');
  const [limiteProdutosPlano, setLimiteProdutosPlano] = useState('');
  const [recursosPlanoStr, setRecursosPlanoStr] = useState('');
  const [ativoPlano, setAtivoPlano] = useState(true);

  const [salvandoPlano, setSalvandoPlano] = useState(false);
  const [erroPlano, setErroPlano] = useState('');

  // Exclusão Plano
  const [planoExcluir, setPlanoExcluir] = useState<Plano | null>(null);
  const [excluindoPlano, setExcluindoPlano] = useState(false);

  // Restaurante Filters & Delete State
  const [buscaRestaurante, setBuscaRestaurante] = useState('');
  const [filtroStatusRestaurante, setFiltroStatusRestaurante] = useState<'todos' | 'ativos' | 'bloqueados'>('todos');
  const [restauranteExcluir, setRestauranteExcluir] = useState<Restaurante | null>(null);
  const [excluindoRestaurante, setExcluindoRestaurante] = useState(false);
  const [loadingStatusId, setLoadingStatusId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await inicializarPlanosIniciais();
      const [restData, planosData, pixData, adminRestIds, avisosData] = await Promise.all([
        listarRestaurantes(),
        listarPlanos(),
        obterConfiguracoesSaas(),
        obterIdsRestaurantesAdmin(),
        listarAvisosGerais()
      ]);
      const adminEmails = ['eliavelozo6@gmail.com', 'admin@menupro.com'];
      const restSemAdmin = restData.filter(r => {
        if (adminRestIds.includes(r.id)) return false;
        if (r.email && adminEmails.includes(r.email.toLowerCase().trim())) return false;
        return true;
      });
      setRestaurantes(restSemAdmin);
      setPlanos(planosData);
      setAvisos(avisosData);
      if (pixData) {
        setConfigPix(pixData);
      }
    } catch (err) {
      console.error('Erro ao carregar dados SaaS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleToggleStatusRestaurante = async (id: string, nome: string, atualAtivo: boolean) => {
    setLoadingStatusId(id);
    setFeedbackMsg(null);
    try {
      await mudarStatusRestaurante(id, !atualAtivo);
      setRestaurantes(prev => prev.map(r => r.id === id ? { ...r, ativo: !atualAtivo } : r));
      setFeedbackMsg({
        tipo: 'sucesso',
        texto: `Status do restaurante "${nome}" alterado para ${!atualAtivo ? 'ATIVO' : 'BLOQUEADO'} com sucesso!`
      });
    } catch (err: any) {
      console.error('Erro ao mudar status do restaurante:', err);
      setFeedbackMsg({
        tipo: 'erro',
        texto: 'Erro ao alterar status do restaurante: ' + (err.message || 'Tente novamente.')
      });
    } finally {
      setLoadingStatusId(null);
    }
  };

  const handleExcluirRestaurante = (rest: Restaurante) => {
    setRestauranteExcluir(rest);
  };

  const confirmarExclusaoRestaurante = async () => {
    if (!restauranteExcluir) return;
    setExcluindoRestaurante(true);
    setFeedbackMsg(null);
    try {
      await excluirRestaurante(restauranteExcluir.id);
      setRestaurantes(prev => prev.filter(r => r.id !== restauranteExcluir.id));
      setFeedbackMsg({
        tipo: 'sucesso',
        texto: `O restaurante "${restauranteExcluir.nome}" foi excluído permanentemente.`
      });
      setRestauranteExcluir(null);
    } catch (err: any) {
      console.error('Erro ao excluir restaurante:', err);
      setFeedbackMsg({
        tipo: 'erro',
        texto: 'Erro ao excluir restaurante: ' + (err.message || 'Tente novamente.')
      });
    } finally {
      setExcluindoRestaurante(false);
    }
  };

  const abrirModalCriarPlano = () => {
    setPlanoEditando(null);
    setNomePlano('');
    setDescricaoPlano('');
    setPrecoPlano('');
    setLimiteProdutosPlano('50');
    setRecursosPlanoStr('Cardápio QR Code\nSuporte Prioritário\nGestão de Pedidos');
    setAtivoPlano(true);
    setErroPlano('');
    setModalPlanoAberto(true);
  };

  const abrirModalEditarPlano = (p: Plano) => {
    setPlanoEditando(p);
    setNomePlano(p.nome);
    setDescricaoPlano(p.descricao);
    setPrecoPlano(p.preco.toString());
    setLimiteProdutosPlano(p.limiteProdutos.toString());
    setRecursosPlanoStr(p.recursos.join('\n'));
    setAtivoPlano(p.ativo);
    setErroPlano('');
    setModalPlanoAberto(true);
  };

  const handleSalvarPlano = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomePlano || !precoPlano) {
      setErroPlano('Nome e preço do plano são obrigatórios.');
      return;
    }

    const precoNum = parseFloat(precoPlano.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) {
      setErroPlano('Insira um preço válido.');
      return;
    }

    const limiteNum = parseInt(limiteProdutosPlano) || 100;
    const recursosArr = recursosPlanoStr
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    setSalvandoPlano(true);
    setErroPlano('');

    try {
      if (planoEditando) {
        await atualizarPlano(planoEditando.id, {
          nome: nomePlano,
          descricao: descricaoPlano,
          preco: precoNum,
          limiteProdutos: limiteNum,
          recursos: recursosArr,
          ativo: ativoPlano
        });
      } else {
        await cadastrarPlano({
          nome: nomePlano,
          descricao: descricaoPlano,
          preco: precoNum,
          limiteProdutos: limiteNum,
          recursos: recursosArr,
          ativo: ativoPlano
        });
      }

      setModalPlanoAberto(false);
      await carregarDados();
    } catch (err: any) {
      console.error('Erro ao salvar plano:', err);
      setErroPlano('Erro ao salvar plano: ' + (err.message || 'Tente novamente.'));
    } finally {
      setSalvandoPlano(false);
    }
  };

  const handleExcluirPlano = (id: string) => {
    const p = planos.find(pl => pl.id === id);
    if (p) {
      setPlanoExcluir(p);
    }
  };

  const confirmarExclusaoPlano = async () => {
    if (!planoExcluir) return;
    setExcluindoPlano(true);
    try {
      await excluirPlano(planoExcluir.id);
      setPlanos(prev => prev.filter(p => p.id !== planoExcluir.id));
      setPlanoExcluir(null);
    } catch (err) {
      console.error('Erro ao excluir plano:', err);
    } finally {
      setExcluindoPlano(false);
    }
  };

  const handleSalvarPix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configPix.chavePix || !configPix.titularPix) {
      alert('Por favor, informe ao menos a Chave Pix e o Nome do Titular.');
      return;
    }
    setSalvandoPix(true);
    setSucessoPix(false);
    try {
      await salvarConfiguracoesSaas(configPix);
      setSucessoPix(true);
      setTimeout(() => setSucessoPix(false), 4000);
    } catch (err) {
      console.error('Erro ao salvar Pix SaaS:', err);
      alert('Erro ao salvar configurações do Pix. Tente novamente.');
    } finally {
      setSalvandoPix(false);
    }
  };

  // Handlers para Avisos e Comunicados do Sistema
  const handleLimparFormAviso = () => {
    setIdAvisoEdicao(null);
    setTituloAviso('');
    setMensagemAviso('');
    setTipoAviso('novidade');
    setLinkDestinoAviso('');
    setTextoBotaoAviso('');
    setAtivoAviso(true);
  };

  const handleEditarAviso = (aviso: AvisoGeral) => {
    setIdAvisoEdicao(aviso.id);
    setTituloAviso(aviso.titulo);
    setMensagemAviso(aviso.mensagem);
    setTipoAviso(aviso.tipo || 'novidade');
    setLinkDestinoAviso(aviso.linkDestino || '');
    setTextoBotaoAviso(aviso.textoBotao || '');
    setAtivoAviso(aviso.ativo);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleSalvarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloAviso.trim() || !mensagemAviso.trim()) {
      alert('Por favor, preencha o título e a mensagem do aviso.');
      return;
    }

    setSalvandoAviso(true);
    try {
      const res = await salvarAvisoGeral({
        id: idAvisoEdicao || undefined,
        titulo: tituloAviso,
        mensagem: mensagemAviso,
        tipo: tipoAviso,
        linkDestino: linkDestinoAviso,
        textoBotao: textoBotaoAviso,
        ativo: ativoAviso,
        criadoPor: usuario?.email || 'Administrador'
      });

      if (idAvisoEdicao) {
        setAvisos(prev => prev.map(a => a.id === res.id ? res : a));
        setFeedbackMsg({ tipo: 'sucesso', texto: `Comunicado "${res.titulo}" atualizado com sucesso!` });
      } else {
        setAvisos(prev => [res, ...prev]);
        setFeedbackMsg({ tipo: 'sucesso', texto: `🎉 Comunicado "${res.titulo}" publicado com sucesso para todos os restaurantes!` });
      }

      handleLimparFormAviso();
    } catch (err: any) {
      console.error('Erro ao salvar comunicado:', err);
      setFeedbackMsg({ tipo: 'erro', texto: 'Erro ao publicar comunicado: ' + (err.message || 'Tente novamente.') });
    } finally {
      setSalvandoAviso(false);
    }
  };

  const handleToggleStatusAviso = async (id: string, ativoAtual: boolean) => {
    try {
      await alternarStatusAvisoGeral(id, !ativoAtual);
      setAvisos(prev => prev.map(a => a.id === id ? { ...a, ativo: !ativoAtual } : a));
    } catch (err: any) {
      console.error('Erro ao alternar status do aviso:', err);
      alert('Erro ao alterar status do aviso.');
    }
  };

  const confirmarExclusaoAviso = async () => {
    if (!avisoExcluir) return;
    setExcluindoAviso(true);
    try {
      await excluirAvisoGeral(avisoExcluir.id);
      setAvisos(prev => prev.filter(a => a.id !== avisoExcluir.id));
      setAvisoExcluir(null);
      setFeedbackMsg({ tipo: 'sucesso', texto: 'Comunicado excluído com sucesso.' });
    } catch (err: any) {
      console.error('Erro ao excluir aviso:', err);
      alert('Erro ao excluir comunicado.');
    } finally {
      setExcluindoAviso(false);
    }
  };

  const handleAprovarPix = async (id: string, nome: string) => {
    setLoadingStatusId(id);
    setFeedbackMsg(null);
    try {
      const res = await aprovarAssinaturaSaas(id);
      await carregarDados();
      const msgDias = res.diasRestantesAnteriores > 0 
        ? `Plano do restaurante "${nome}" aprovado! (${res.diasRestantesAnteriores} dias do plano anterior + 30 dias do novo plano = ${res.totalDiasConcedidos} dias totais de acesso concedidos).`
        : `Plano do restaurante "${nome}" aprovado com sucesso! Acesso ativado por 30 dias.`;
      setFeedbackMsg({ tipo: 'sucesso', texto: msgDias });
    } catch (err: any) {
      console.error('Erro ao aprovar Pix:', err);
      setFeedbackMsg({ tipo: 'erro', texto: 'Erro ao aprovar Pix: ' + (err.message || 'Tente novamente.') });
    } finally {
      setLoadingStatusId(null);
    }
  };

  const abrirModalRejeitar = (rest: Restaurante) => {
    setRestauranteRejeitarModal(rest);
    if (rest.planoAnterior) {
      setMotivoRejeicaoInput(`Sua solicitação de alteração para o plano "${rest.planoSolicitado || rest.plano}" foi rejeitada pelo suporte. Seu restaurante permanece ativo no plano anterior ("${rest.planoAnterior}").`);
    } else {
      setMotivoRejeicaoInput('O comprovante Pix não foi identificado ou o valor estava incorreto. Por favor, entre em contato com nosso suporte ou envie um novo comprovante.');
    }
  };

  const handleConfirmarRejeitarPix = async () => {
    if (!restauranteRejeitarModal) return;
    setRejeitando(true);
    setFeedbackMsg(null);
    try {
      const res = await rejeitarAssinaturaSaas(restauranteRejeitarModal.id, motivoRejeicaoInput);
      await carregarDados();
      if (res.retornouPlanoAnterior) {
        setFeedbackMsg({ 
          tipo: 'sucesso', 
          texto: `Solicitação de troca de plano do restaurante "${restauranteRejeitarModal.nome}" rejeitada. O restaurante retornou ao plano anterior ("${res.planoAnteriorNome}") e continuará com acesso ativo.` 
        });
      } else {
        setFeedbackMsg({ 
          tipo: 'sucesso', 
          texto: `Inscrição do restaurante "${restauranteRejeitarModal.nome}" rejeitada e conta inativada.` 
        });
      }
      setRestauranteRejeitarModal(null);
    } catch (err: any) {
      console.error('Erro ao rejeitar Pix:', err);
      setFeedbackMsg({ tipo: 'erro', texto: 'Erro ao rejeitar Pix: ' + (err.message || 'Tente novamente.') });
    } finally {
      setRejeitando(false);
    }
  };

  // SaaS Metrics Calculations
  const totalRestaurantes = restaurantes.length;
  const restaurantesAtivos = restaurantes.filter(r => r.ativo).length;
  const pendentesPixList = restaurantes.filter(r => r.statusPagamento === 'Pendente Pix' || (r.comprovantePix && r.statusPagamento !== 'Confirmado Pix'));
  const faturamentoEstimadoMensal = restaurantes.reduce((sum, r) => {
    const planoEncontrado = planos.find(p => p.id === r.planoId || p.nome === r.plano);
    return sum + (planoEncontrado ? planoEncontrado.preco : 49.90);
  }, 0);

  const restaurantesFiltrados = restaurantes.filter(r => {
    const qLower = buscaRestaurante.toLowerCase();
    const combinaBusca = r.nome.toLowerCase().includes(qLower) ||
                          r.slug.toLowerCase().includes(qLower) ||
                          (r.email && r.email.toLowerCase().includes(qLower)) ||
                          (r.whatsapp && r.whatsapp.includes(buscaRestaurante));
    const combinaStatus = filtroStatusRestaurante === 'todos' ||
                          (filtroStatusRestaurante === 'ativos' && r.ativo) ||
                          (filtroStatusRestaurante === 'bloqueados' && !r.ativo);
    return combinaBusca && combinaStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              Painel Geral do Administrador SaaS
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              Admin: {usuario?.email || 'eliavelozo6@gmail.com'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Gerenciamento MenuPro</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Acompanhe o faturamento da plataforma, gerencie restaurantes cadastrados e controle planos e assinaturas.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0 text-right">
          <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-200 block">Faturamento Mensal Estimado</span>
          <span className="text-2xl font-black text-emerald-400">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoEstimadoMensal)}
          </span>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Restaurantes</span>
            <span className="text-2xl font-black text-slate-900">{totalRestaurantes}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Restaurantes Ativos</span>
            <span className="text-2xl font-black text-slate-900">{restaurantesAtivos}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Planos Ativos</span>
            <span className="text-2xl font-black text-slate-900">{planos.filter(p => p.ativo).length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Assinaturas SaaS</span>
            <span className="text-2xl font-black text-slate-900">{totalRestaurantes}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setAbaAtiva('restaurantes')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            abaAtiva === 'restaurantes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Gerenciar Restaurantes ({restaurantes.length})
        </button>

        <button
          onClick={() => setAbaAtiva('planos')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            abaAtiva === 'planos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Gerenciar Planos SaaS ({planos.length})
        </button>

        <button
          onClick={() => setAbaAtiva('pix')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            abaAtiva === 'pix'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4 text-emerald-600" />
          <span>Configuração Chave Pix SaaS</span>
        </button>

        <button
          onClick={() => setAbaAtiva('aprova-pix')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            abaAtiva === 'aprova-pix'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🧾 Aprovações de Pix</span>
          {pendentesPixList.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-black bg-amber-500 text-white rounded-full animate-pulse">
              {pendentesPixList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAbaAtiva('avisos')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            abaAtiva === 'avisos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4 text-indigo-600" />
          <span>📢 Avisos e Comunicados</span>
          {avisos.filter(a => a.ativo).length > 0 && (
            <span className="px-2 py-0.5 text-xs font-black bg-indigo-600 text-white rounded-full">
              {avisos.filter(a => a.ativo).length}
            </span>
          )}
        </button>
      </div>

      {/* Restaurantes Tab */}
      {abaAtiva === 'restaurantes' && (
        <div className="space-y-4">
          {/* Feedback Messages */}
          {feedbackMsg && (
            <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold ${
              feedbackMsg.tipo === 'sucesso' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {feedbackMsg.tipo === 'sucesso' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedbackMsg.texto}</span>
              </div>
              <button 
                onClick={() => setFeedbackMsg(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaRestaurante}
                onChange={(e) => setBuscaRestaurante(e.target.value)}
                placeholder="Buscar por nome, e-mail, slug ou WhatsApp..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto text-xs font-bold">
              <button
                onClick={() => setFiltroStatusRestaurante('todos')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filtroStatusRestaurante === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Todos ({restaurantes.length})
              </button>
              <button
                onClick={() => setFiltroStatusRestaurante('ativos')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filtroStatusRestaurante === 'ativos' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Ativos ({restaurantes.filter(r => r.ativo).length})
              </button>
              <button
                onClick={() => setFiltroStatusRestaurante('bloqueados')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filtroStatusRestaurante === 'bloqueados' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Bloqueados ({restaurantes.filter(r => !r.ativo).length})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Carregando restaurantes do Firestore...</div>
            ) : restaurantesFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Store className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <span className="font-bold text-slate-700 block">Nenhum restaurante encontrado</span>
                <p className="text-xs text-slate-400 mt-1">
                  {buscaRestaurante || filtroStatusRestaurante !== 'todos'
                    ? 'Nenhum restaurante corresponde aos filtros aplicados.'
                    : 'Nenhum restaurante cadastrado na plataforma até o momento.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Restaurante</th>
                      <th className="p-4">E-mail de Cadastro</th>
                      <th className="p-4">Link/Slug</th>
                      <th className="p-4">Plano</th>
                      <th className="p-4">WhatsApp</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {restaurantesFiltrados.map((rest) => (
                      <tr key={rest.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{rest.nome}</span>
                          <span className="text-[10px] text-slate-400">ID: {rest.id.slice(0, 8)}</span>
                        </td>

                        <td className="p-4">
                          {rest.email ? (
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 w-fit">
                              <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="select-all">{rest.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Não informado</span>
                          )}
                        </td>

                        <td className="p-4 font-mono text-emerald-600">
                          <a href={`/cardapio/${rest.slug}`} target="_blank" rel="noreferrer" className="hover:underline">
                            /cardapio/{rest.slug}
                          </a>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-lg block w-fit">
                              {rest.plano || 'Básico'}
                            </span>
                            {rest.statusPagamento && (
                              <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                rest.statusPagamento === 'Confirmado Pix'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : rest.statusPagamento === 'Pendente Pix'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {rest.statusPagamento}
                              </span>
                            )}
                            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Vence: <strong>{formatarDataVencimentoPlano(rest.expiracaoPlano, rest.criadoEm)}</strong></span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-slate-600">{rest.whatsapp || '-'}</td>

                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            rest.ativo ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {rest.ativo ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Ativo</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-rose-600" />
                                <span>Bloqueado</span>
                              </>
                            )}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Botão de Aprovar Pix Se Estiver Pendente */}
                            {rest.statusPagamento === 'Pendente Pix' && (
                              <button
                                onClick={() => handleAprovarPix(rest.id, rest.nome)}
                                disabled={loadingStatusId === rest.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                                title="Aprovar Pix e Liberar Restaurante"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{loadingStatusId === rest.id ? 'Aprovando...' : 'Aprovar Pix'}</span>
                              </button>
                            )}

                            {/* Botão de Bloquear / Ativar */}
                            <button
                              onClick={() => handleToggleStatusRestaurante(rest.id, rest.nome, rest.ativo)}
                              disabled={loadingStatusId === rest.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                rest.ativo
                                  ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                              } disabled:opacity-50`}
                              title={rest.ativo ? 'Bloquear acesso do restaurante' : 'Ativar acesso do restaurante'}
                            >
                              {loadingStatusId === rest.id ? (
                                <span>Processando...</span>
                              ) : rest.ativo ? (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Bloquear</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>Ativar</span>
                                </>
                              )}
                            </button>

                            {/* Botão de Apagar Restaurante */}
                            <button
                              onClick={() => handleExcluirRestaurante(rest)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                              title="Excluir Restaurante do SaaS"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Planos Tab */}
      {abaAtiva === 'planos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Planos Oferecidos aos Restaurantes</h3>
              <p className="text-xs text-slate-500">Crie, edite ou desative os valores de assinatura SaaS</p>
            </div>

            <Button onClick={abrirModalCriarPlano} icon={<Plus className="w-4 h-4" />}>
              Criar Novo Plano
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {planos.map((plano) => (
              <div key={plano.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-xl text-slate-900">{plano.nome}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      plano.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {plano.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs mb-4">{plano.descricao}</p>

                  <div className="mb-4">
                    <span className="text-3xl font-black text-slate-900">
                      R$ {plano.preco.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-slate-400 text-xs">/mês</span>
                  </div>

                  <ul className="space-y-2 mb-6 border-t border-slate-100 pt-3">
                    {plano.recursos.map((rec, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => abrirModalEditarPlano(plano)}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar Plano"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleExcluirPlano(plano.id)}
                    className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Excluir Plano"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pix Config Tab */}
      {abaAtiva === 'pix' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                <QrCode className="w-3.5 h-3.5" />
                Recebimentos SaaS via Pix
              </span>
              <h2 className="text-2xl font-black tracking-tight">Configurar Sua Chave Pix</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Esta chave Pix será apresentada aos novos restaurantes no momento da escolha de planos pagos (como Básico, Pro e Premium) durante o cadastro.
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 shrink-0 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">Chave Pix Ativa</span>
              <span className="text-sm font-black font-mono text-white block mt-0.5">{configPix.chavePix || 'Não definida'}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-extrabold text-slate-900 text-lg">Dados da Sua Chave Pix</h3>
                <p className="text-xs text-slate-500 mt-0.5">Preencha com exatidão os dados do titular da conta bancária.</p>
              </div>

              {sucessoPix && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Chave Pix e instruções de pagamento salvas com sucesso!</span>
                </div>
              )}

              <form onSubmit={handleSalvarPix} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chave Pix (E-mail, CPF/CNPJ, Tel ou Aleatória) *</label>
                  <input
                    type="text"
                    required
                    value={configPix.chavePix}
                    onChange={(e) => setConfigPix(prev => ({ ...prev, chavePix: e.target.value }))}
                    placeholder="Ex: eliavelozo6@gmail.com ou 11999999999"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Chave</label>
                    <select
                      value={configPix.tipoChave}
                      onChange={(e: any) => setConfigPix(prev => ({ ...prev, tipoChave: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                    >
                      <option value="email">E-mail</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="telefone">Telefone</option>
                      <option value="aleatoria">Chave Aleatória</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Banco / Instituição</label>
                    <input
                      type="text"
                      value={configPix.bancoPix}
                      onChange={(e) => setConfigPix(prev => ({ ...prev, bancoPix: e.target.value }))}
                      placeholder="Ex: Nubank / Mercado Pago"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Titular / Beneficiário *</label>
                  <input
                    type="text"
                    required
                    value={configPix.titularPix}
                    onChange={(e) => setConfigPix(prev => ({ ...prev, titularPix: e.target.value }))}
                    placeholder="Ex: Elia Velozo / MenuPro SaaS"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp de Suporte / Envio de Comprovante *</label>
                  <input
                    type="text"
                    required
                    value={configPix.whatsappSuporte || ''}
                    onChange={(e) => setConfigPix(prev => ({ ...prev, whatsappSuporte: e.target.value }))}
                    placeholder="Ex: 92982391133"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Número de WhatsApp do Administrador para onde os novos restaurantes enviarão os comprovantes.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Instruções para o Assinante</label>
                  <textarea
                    rows={3}
                    value={configPix.instrucoesPix || ''}
                    onChange={(e) => setConfigPix(prev => ({ ...prev, instrucoesPix: e.target.value }))}
                    placeholder="Ex: Realize a transferência via Pix e guarde o comprovante. A ativação do plano é automática."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>

                <Button type="submit" isLoading={salvandoPix} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white" icon={<Save className="w-4 h-4" />}>
                  Salvar Chave Pix SaaS
                </Button>
              </form>
            </div>

            {/* Preview Card */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block mb-2">
                  Pré-visualização para os Restaurantes
                </span>
                <h4 className="text-xl font-black text-white">Como os clientes verão na hora de pagar:</h4>
                <p className="text-xs text-slate-400 mt-1">
                  É assim que o quadro de pagamento via Pix será renderizado durante o cadastro de novas contas em planos pagos.
                </p>
              </div>

              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                  <span className="text-xs font-bold text-slate-300">Pagamento via Pix</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    SaaS Oficial
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  {configPix.chavePix ? (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(configPix.chavePix)}`} 
                      alt="QR Code Pix"
                      className="w-28 h-28 rounded-xl bg-white p-2 shrink-0 border border-slate-700"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-500 shrink-0">
                      Sem QR Code
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs flex-1 w-full">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Chave Pix:</span>
                      <span className="font-mono font-bold text-emerald-400 break-all select-all">{configPix.chavePix || 'Sua Chave Pix'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Titular:</span>
                      <span className="text-slate-200 font-semibold">{configPix.titularPix || 'Nome do Beneficiário'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Banco:</span>
                      <span className="text-slate-300">{configPix.bancoPix || 'Instituição Financeira'}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  "{configPix.instrucoesPix || 'Realize o pagamento e conclua o cadastro.'}"
                </p>
              </div>

              <div className="text-[11px] text-slate-400 text-center">
                &bull; Configuração armazenada com segurança no banco de dados Firestore da plataforma.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pix Approvals Tab */}
      {abaAtiva === 'aprova-pix' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Aprovação de Assinaturas Pix em 1 Clique</h2>
              <p className="text-xs text-slate-500 mt-1">
                Aprove os pagamentos Pix e ative o plano dos restaurantes com um único clique. Integração bancária automática em breve!
              </p>
            </div>
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold shrink-0">
              {pendentesPixList.length} solicitação(ões) pendente(s)
            </div>
          </div>

          {feedbackMsg && (
            <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold ${
              feedbackMsg.tipo === 'sucesso' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              <span>{feedbackMsg.texto}</span>
              <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700">
                &times;
              </button>
            </div>
          )}

          {pendentesPixList.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Nenhum Pagamento Pendente</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Todos os restaurantes com pagamentos Pix pendentes já foram aprovados e ativados.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {pendentesPixList.map((rest) => {
                const isMudancaPlano = !!rest.planoAnterior;
                const planoSolicitadoNome = rest.planoSolicitado || rest.plano || 'Plano Pago';
                const diasRestantesAnt = (rest.ativo && rest.statusPagamento !== 'Pendente Pix') 
                  ? calcularDiasRestantesPlano(rest.expiracaoPlano, rest.criadoEm) 
                  : 0;
                const totalCalculado = diasRestantesAnt + 30;

                return (
                  <div key={rest.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isMudancaPlano ? (
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                                🔄 Troca / Upgrade de Plano
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                🆕 Novo Cadastro
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-black text-slate-900 mt-2">{rest.nome}</h3>
                          
                          <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                            <p className="font-semibold text-slate-800">
                              Plano Solicitado: <strong className="text-emerald-700 font-extrabold">{planoSolicitadoNome}</strong>
                            </p>
                            {isMudancaPlano && (
                              <p className="text-slate-500">
                                Plano Atual/Anterior: <strong className="text-slate-700">{rest.planoAnterior}</strong>
                              </p>
                            )}
                            {rest.email && (
                              <p className="text-indigo-700 font-medium flex items-center gap-1 mt-1">
                                <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>{rest.email}</span>
                              </p>
                            )}
                            <p className="text-slate-500">WhatsApp: {rest.whatsapp || 'Não informado'}</p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-200 shrink-0">
                          Pendente Pix
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                          <span>⚡ Impacto da Decisão:</span>
                        </div>

                        <p className="text-slate-700">
                          <strong>Ao Aprovar:</strong> Ativa o plano <strong>{planoSolicitadoNome}</strong> por {totalCalculado} dias.
                        </p>

                        {isMudancaPlano ? (
                          <p className="text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200/60 text-[11px] font-medium">
                            ℹ️ <strong>Ao Rejeitar:</strong> O restaurante NÃO será bloqueado. Ele <strong>retornará ao plano anterior ({rest.planoAnterior})</strong> mantendo seu acesso ativo.
                          </p>
                        ) : (
                          <p className="text-rose-800 bg-rose-50/80 p-2 rounded-lg border border-rose-200/60 text-[11px] font-medium">
                            ⚠️ <strong>Ao Rejeitar:</strong> A conta do restaurante ficará inativa com status "Rejeitado Pix".
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        onClick={() => abrirModalRejeitar(rest)}
                        disabled={loadingStatusId === rest.id}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Rejeitar
                      </button>
                      <button
                        onClick={() => handleAprovarPix(rest.id, rest.nome)}
                        disabled={loadingStatusId === rest.id}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{loadingStatusId === rest.id ? 'Aprovando...' : 'Aprovar Assinatura'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Avisos e Comunicados Tab */}
      {abaAtiva === 'avisos' && (
        <div className="space-y-6">
          {/* Banner de Apresentação */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border border-indigo-500/30">
                <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Transmissão Geral de Mensagens
              </span>
              <h2 className="text-xl sm:text-2xl font-black">Central de Avisos e Comunicados aos Restaurantes</h2>
              <p className="text-xs text-indigo-200/90 leading-relaxed max-w-2xl">
                Crie e publique recados, novidades do sistema, alertas de manutenção e informativos. Todos os restaurantes cadastrados visualizarão o banner em destaque no topo dos seus painéis de controle.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shrink-0 text-center sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">Total de Avisos Ativos</span>
              <span className="text-2xl font-black text-emerald-400">
                {avisos.filter(a => a.ativo).length}
              </span>
            </div>
          </div>

          {/* Feedback Messages */}
          {feedbackMsg && (
            <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold ${
              feedbackMsg.tipo === 'sucesso' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {feedbackMsg.tipo === 'sucesso' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedbackMsg.texto}</span>
              </div>
              <button 
                onClick={() => setFeedbackMsg(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* Grid: Form + Live Preview */}
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Coluna 1: Formulário de Envio / Edição (7 colunas) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      {idAvisoEdicao ? 'Editar Comunicado' : 'Publicar Novo Comunicado'}
                    </h3>
                    <p className="text-xs text-slate-500">Preencha os dados do aviso que deseja enviar aos restaurantes</p>
                  </div>
                </div>

                {idAvisoEdicao && (
                  <button
                    onClick={handleLimparFormAviso}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>

              <form onSubmit={handleSalvarAviso} className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Título do Aviso / Atualização *
                  </label>
                  <input
                    type="text"
                    required
                    value={tituloAviso}
                    onChange={(e) => setTituloAviso(e.target.value)}
                    placeholder="Ex: 🚀 Lançada nova funcionalidade de Garçom Digital por QR Code!"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                {/* Tipo / Categoria */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Tipo do Comunicado *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoAviso('novidade')}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        tipoAviso === 'novidade'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>🚀 Novidade</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoAviso('info')}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        tipoAviso === 'info'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                      <span>ℹ️ Informativo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoAviso('alerta')}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        tipoAviso === 'alerta'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>⚠️ Alerta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoAviso('manutencao')}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        tipoAviso === 'manutencao'
                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>🛠️ Manutenção</span>
                    </button>
                  </div>
                </div>

                {/* Mensagem Completa */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Conteúdo / Mensagem Completa *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={mensagemAviso}
                    onChange={(e) => setMensagemAviso(e.target.value)}
                    placeholder="Escreva os detalhes do aviso, instruções ou novidades que os donos de restaurante precisam saber..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                {/* Botão e Link Opcionais */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      Link Externo (Opcional)
                    </label>
                    <input
                      type="url"
                      value={linkDestinoAviso}
                      onChange={(e) => setLinkDestinoAviso(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      Texto do Botão (Opcional)
                    </label>
                    <input
                      type="text"
                      value={textoBotaoAviso}
                      onChange={(e) => setTextoBotaoAviso(e.target.value)}
                      placeholder="Ex: Saber Mais"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Status Ativo / Oculto */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ativoAviso"
                      checked={ativoAviso}
                      onChange={(e) => setAtivoAviso(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="ativoAviso" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Ativo no painel dos restaurantes (Exibir imediatamente)
                    </label>
                  </div>

                  <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                    ativoAviso ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {ativoAviso ? 'Visível' : 'Rascunho / Oculto'}
                  </span>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  {idAvisoEdicao && (
                    <button
                      type="button"
                      onClick={handleLimparFormAviso}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={salvandoAviso}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{salvandoAviso ? 'Publicando...' : idAvisoEdicao ? 'Atualizar Aviso' : '🚀 Publicar para Todos os Restaurantes'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Coluna 2: Live Preview Card (5 colunas) */}
            <div className="lg:col-span-5 bg-slate-900 p-6 rounded-3xl text-white shadow-xl space-y-4 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                    Pré-Visualização do Dono do Restaurante
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-bold">
                  Ao Vivo
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                Veja abaixo como este aviso aparecerá no topo do painel de controle do restaurante:
              </p>

              {/* Card de Preview do Restaurante */}
              <div className={`p-5 rounded-2xl border text-left shadow-lg transition-all space-y-3 ${
                tipoAviso === 'novidade'
                  ? 'bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-indigo-950/90 border-indigo-500/40 text-white'
                  : tipoAviso === 'info'
                  ? 'bg-gradient-to-r from-blue-900/90 to-slate-900/90 border-blue-500/40 text-white'
                  : tipoAviso === 'alerta'
                  ? 'bg-gradient-to-r from-amber-950/90 via-amber-900/90 to-slate-900/90 border-amber-500/50 text-amber-100'
                  : 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-600 text-slate-100'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {tipoAviso === 'novidade' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-black uppercase tracking-wider border border-purple-400/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-300" />
                        Novidade MenuPro
                      </span>
                    )}
                    {tipoAviso === 'info' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-black uppercase tracking-wider border border-blue-400/30 flex items-center gap-1">
                        <Bell className="w-3 h-3 text-blue-300" />
                        Informativo
                      </span>
                    )}
                    {tipoAviso === 'alerta' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-black uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-300" />
                        Alerta do Sistema
                      </span>
                    )}
                    {tipoAviso === 'manutencao' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-wider border border-slate-500/30 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-slate-300" />
                        Manutenção
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-white leading-snug">
                    {tituloAviso.trim() || 'Título da sua mensagem aparecerá aqui'}
                  </h4>
                  <p className="mt-1 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                    {mensagemAviso.trim() || 'O conteúdo completo da sua atualização ou recado para todos os restaurantes cadastrados na plataforma.'}
                  </p>
                </div>

                {linkDestinoAviso.trim() && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-black shadow-sm">
                      {textoBotaoAviso.trim() || 'Ver Mais'}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Histórico de Comunicados Cadastrados */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Histórico de Comunicados ({avisos.length})
                </h3>
                <p className="text-xs text-slate-500">Gerencie a visibilidade dos comunicados transmitidos aos restaurantes</p>
              </div>

              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {avisos.filter(a => a.ativo).length} Visíveis Atualmente
              </span>
            </div>

            {avisos.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                <Megaphone className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold">Nenhum comunicado enviado ainda.</p>
                <p className="text-[11px]">Utilize o formulário acima para transmitir o primeiro aviso para todos os restaurantes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {avisos.map((aviso) => (
                  <div
                    key={aviso.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      aviso.ativo
                        ? 'bg-white border-slate-200 shadow-xs hover:border-indigo-200'
                        : 'bg-slate-50/70 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        {aviso.tipo === 'novidade' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                            🚀 Novidade
                          </span>
                        )}
                        {aviso.tipo === 'info' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                            ℹ️ Informativo
                          </span>
                        )}
                        {aviso.tipo === 'alerta' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                            ⚠️ Alerta
                          </span>
                        )}
                        {aviso.tipo === 'manutencao' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider">
                            🛠️ Manutenção
                          </span>
                        )}

                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          aviso.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {aviso.ativo ? 'Visível aos Restaurantes' : 'Oculto'}
                        </span>

                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(aviso.dataCriacao).toLocaleDateString('pt-BR')} às {new Date(aviso.dataCriacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {aviso.titulo}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {aviso.mensagem}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        onClick={() => handleToggleStatusAviso(aviso.id, aviso.ativo)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          aviso.ativo
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {aviso.ativo ? 'Ocultar' : 'Exibir'}
                      </button>

                      <button
                        onClick={() => handleEditarAviso(aviso)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => setAvisoExcluir(aviso)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Excluir comunicado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Visualizador de Comprovante Ampliado */}
      <Modal
        isOpen={modalPlanoAberto}
        onClose={() => setModalPlanoAberto(false)}
        title={planoEditando ? 'Editar Plano SaaS' : 'Criar Novo Plano SaaS'}
      >
        <form onSubmit={handleSalvarPlano} className="space-y-4">
          {erroPlano && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erroPlano}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Plano *</label>
            <input
              type="text"
              required
              value={nomePlano}
              onChange={(e) => setNomePlano(e.target.value)}
              placeholder="Ex: Plano Master"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preço Mensal (R$) *</label>
              <input
                type="text"
                required
                value={precoPlano}
                onChange={(e) => setPrecoPlano(e.target.value)}
                placeholder="79.90"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Limite de Produtos</label>
              <input
                type="number"
                value={limiteProdutosPlano}
                onChange={(e) => setLimiteProdutosPlano(e.target.value)}
                placeholder="100"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição Curta</label>
            <input
              type="text"
              value={descricaoPlano}
              onChange={(e) => setDescricaoPlano(e.target.value)}
              placeholder="Descrição atrativa do plano..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Recursos (Um por linha)</label>
            <textarea
              rows={4}
              value={recursosPlanoStr}
              onChange={(e) => setRecursosPlanoStr(e.target.value)}
              placeholder="Cardápio QR Code&#10;Relatórios Financeiros&#10;Suporte 24h"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="ativoPlano"
              checked={ativoPlano}
              onChange={(e) => setAtivoPlano(e.target.checked)}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded-sm border-slate-300"
            />
            <label htmlFor="ativoPlano" className="text-xs font-semibold text-slate-800">
              Plano ativo para novas contratações
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setModalPlanoAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="secondary" isLoading={salvandoPlano}>
              {planoEditando ? 'Atualizar Plano' : 'Criar Plano'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação Excluir Plano */}
      <Modal
        isOpen={!!planoExcluir}
        onClose={() => {
          if (!excluindoPlano) {
            setPlanoExcluir(null);
          }
        }}
        title="Excluir Plano SaaS"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Tem certeza que deseja excluir o plano <strong className="text-slate-900">{planoExcluir?.nome}</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setPlanoExcluir(null)}
              disabled={excluindoPlano}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={excluindoPlano}
              onClick={confirmarExclusaoPlano}
            >
              Excluir Plano
            </Button>
          </div>
        </div>
      </Modal>
      {/* Modal de Confirmação Excluir Restaurante */}
      <Modal
        isOpen={!!restauranteExcluir}
        onClose={() => {
          if (!excluindoRestaurante) {
            setRestauranteExcluir(null);
          }
        }}
        title="Excluir Restaurante do SaaS"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-rose-900 font-bold mb-1">Ação Irreversível</strong>
              <span>
                A exclusão removerá o cadastro do restaurante <strong className="text-slate-900">{restauranteExcluir?.nome}</strong> (slug: <code className="font-mono bg-rose-100 px-1 py-0.5 rounded">{restauranteExcluir?.slug}</code>) do banco de dados da plataforma.
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            Tem certeza que deseja apagar este restaurante definitivamente?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setRestauranteExcluir(null)}
              disabled={excluindoRestaurante}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={excluindoRestaurante}
              onClick={confirmarExclusaoRestaurante}
            >
              Excluir Restaurante
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Rejeição de Pix / Assinatura */}
      <Modal
        isOpen={!!restauranteRejeitarModal}
        onClose={() => {
          if (!rejeitando) setRestauranteRejeitarModal(null);
        }}
        title={`Rejeitar Pagamento Pix — ${restauranteRejeitarModal?.nome || ''}`}
      >
        <div className="space-y-4">
          {restauranteRejeitarModal?.planoAnterior ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs leading-relaxed space-y-1">
              <span className="font-extrabold block text-emerald-950 flex items-center gap-1 text-sm">
                🔄 Restauração de Plano Anterior
              </span>
              <p>
                Este restaurante já possui acesso no plano <strong>{restauranteRejeitarModal.planoAnterior}</strong>. Ao rejeitar esta solicitação, ele <strong>não será bloqueado</strong> e continuará utilizando o seu plano anterior normalmente.
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs leading-relaxed space-y-1">
              <span className="font-extrabold block text-rose-950 flex items-center gap-1 text-sm">
                ❌ Bloqueio de Novo Cadastro
              </span>
              <p>
                Esta é uma nova inscrição. Ao rejeitar o Pix, a conta do restaurante ficará com o status <strong>"Rejeitado Pix"</strong> e o acesso será bloqueado até que um novo pagamento seja aprovado.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Motivo da Rejeição (Será exibido para o restaurante)
            </label>
            <textarea
              rows={3}
              value={motivoRejeicaoInput}
              onChange={(e) => setMotivoRejeicaoInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
              placeholder="Informe o motivo da rejeição..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setRestauranteRejeitarModal(null)}
              disabled={rejeitando}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              type="button"
              isLoading={rejeitando}
              onClick={handleConfirmarRejeitarPix}
            >
              Confirmar Rejeição
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação Excluir Aviso */}
      <Modal
        isOpen={!!avisoExcluir}
        onClose={() => {
          if (!excluindoAviso) setAvisoExcluir(null);
        }}
        title="Excluir Comunicado do Sistema"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Tem certeza que deseja excluir permanentemente o comunicado <strong className="text-slate-900">"{avisoExcluir?.titulo}"</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setAvisoExcluir(null)}
              disabled={excluindoAviso}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={excluindoAviso}
              onClick={confirmarExclusaoAviso}
            >
              Excluir Comunicado
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
