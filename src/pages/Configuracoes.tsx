import React, { useState, useEffect } from 'react';
import { Restaurante, Usuario, Plano, ConfiguracoesSaas } from '../types';
import { atualizarRestaurante, enviarComprovantePixRestaurante, listarPlanos, ordenarPlanos, obterConfiguracoesSaas, calcularDiasRestantesPlano, formatarDataVencimentoPlano } from '../services/database';
import { calcularStatusFuncionamento } from '../utils/horario';
import { Button } from '../components/Button';
import { QrCodeGenerator } from '../components/QrCodeGenerator';
import { CuponsManager } from '../components/CuponsManager';
import { TaxasEntregaManager } from '../components/TaxasEntregaManager';
import { AvaliacoesManager } from '../components/AvaliacoesManager';
import { CloudinaryUpload } from '../components/CloudinaryUpload';
import { 
  Building2, 
  Phone, 
  MapPin, 
  Clock, 
  Image as ImageIcon, 
  QrCode, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Zap,
  Gift,
  X,
  Copy,
  ShieldCheck,
  ArrowLeft,
  Calendar
} from 'lucide-react';

interface ConfiguracoesProps {
  usuario: Usuario | null;
  restaurante: Restaurante | null;
  onRestauranteAtualizado: () => void;
}

export const Configuracoes: React.FC<ConfiguracoesProps> = ({ usuario, restaurante, onRestauranteAtualizado }) => {
  const [nome, setNome] = useState(restaurante?.nome || '');
  const [logo, setLogo] = useState(restaurante?.logo || '');
  const [banner, setBanner] = useState(restaurante?.banner || '');
  const [telefone, setTelefone] = useState(restaurante?.telefone || '');
  const [whatsapp, setWhatsapp] = useState(restaurante?.whatsapp || '');
  const [endereco, setEndereco] = useState(restaurante?.endereco || '');
  const [horarioFuncionamento, setHorarioFuncionamento] = useState(restaurante?.horarioFuncionamento || '');
  const [slug, setSlug] = useState(restaurante?.slug || '');
  const [chavePix, setChavePix] = useState(restaurante?.chavePix || '');
  const [titularPix, setTitularPix] = useState(restaurante?.titularPix || '');

  // Estados para o Seletor Visual de Horário de Funcionamento
  const [diasOpcao, setDiasOpcao] = useState('Todos os dias');
  const [tipoTurno, setTipoTurno] = useState<'unico' | 'dois_turnos' | '24h'>('unico');
  const [horaAbertura1, setHoraAbertura1] = useState('11:00');
  const [horaFechamento1, setHoraFechamento1] = useState('23:00');
  const [horaAbertura2, setHoraAbertura2] = useState('18:00');
  const [horaFechamento2, setHoraFechamento2] = useState('23:30');
  const [modoDigitarTexto, setModoDigitarTexto] = useState(false);

  const gerarEAtualizarHorario = (dias: string, tipo: 'unico' | 'dois_turnos' | '24h', hA1: string, hF1: string, hA2: string, hF2: string) => {
    let resultado = '';
    if (tipo === '24h') {
      resultado = `${dias}: Aberto 24 Horas`;
    } else if (tipo === 'dois_turnos') {
      resultado = `${dias}: ${hA1} às ${hF1} e ${hA2} às ${hF2}`;
    } else {
      resultado = `${dias}: ${hA1} às ${hF1}`;
    }
    setHorarioFuncionamento(resultado);
  };

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const [planosDisponiveis, setPlanosDisponiveis] = useState<Plano[]>([]);
  const [modalPlanosAberto, setModalPlanosAberto] = useState(false);
  const [planoSelecionadoModal, setPlanoSelecionadoModal] = useState<Plano | null>(null);
  const [enviandoPagamento, setEnviandoPagamento] = useState(false);
  const [sucessoModalPix, setSucessoModalPix] = useState(false);

  const [configSaas, setConfigSaas] = useState<ConfiguracoesSaas | null>(null);

  useEffect(() => {
    if (restaurante) {
      setNome(restaurante.nome || '');
      setLogo(restaurante.logo || '');
      setBanner(restaurante.banner || '');
      setTelefone(restaurante.telefone || '');
      setWhatsapp(restaurante.whatsapp || '');
      setEndereco(restaurante.endereco || '');
      
      const strHorario = restaurante.horarioFuncionamento || '';
      setHorarioFuncionamento(strHorario);
      if (strHorario) {
        if (strHorario.toLowerCase().includes('24')) {
          setTipoTurno('24h');
        } else if (strHorario.includes(' e ')) {
          setTipoTurno('dois_turnos');
          const times = strHorario.match(/\d{1,2}:\d{2}/g);
          if (times && times.length >= 4) {
            setHoraAbertura1(times[0]);
            setHoraFechamento1(times[1]);
            setHoraAbertura2(times[2]);
            setHoraFechamento2(times[3]);
          }
        } else {
          setTipoTurno('unico');
          const times = strHorario.match(/\d{1,2}:\d{2}/g);
          if (times && times.length >= 2) {
            setHoraAbertura1(times[0]);
            setHoraFechamento1(times[1]);
          }
        }

        const partes = strHorario.split(':');
        if (partes.length > 1 && !partes[0].includes('Aberto')) {
          const d = partes[0].trim();
          if (d) setDiasOpcao(d);
        }
      }

      setSlug(restaurante.slug || '');
      setChavePix(restaurante.chavePix || '');
      setTitularPix(restaurante.titularPix || '');
    }
  }, [restaurante]);

  useEffect(() => {
    async function carregarPlanos() {
      try {
        const [lista, saasData] = await Promise.all([
          listarPlanos(),
          obterConfiguracoesSaas()
        ]);
        const ativos = lista.filter(p => p.ativo);
        setPlanosDisponiveis(ordenarPlanos(ativos));
        if (saasData) setConfigSaas(saasData);
      } catch (err) {
        console.error('Erro ao listar planos:', err);
      }
    }
    carregarPlanos();
  }, []);

  const handleSolicitarPlanoPix = async (plano: Plano) => {
    if (!restaurante?.id) return;
    setEnviandoPagamento(true);
    try {
      await enviarComprovantePixRestaurante(
        restaurante.id, 
        plano.nome, 
        plano.preco, 
        'Solicitação de Ativação/Renovação de Plano',
        plano.id
      );
      setSucessoModalPix(true);
      onRestauranteAtualizado();
    } catch (err) {
      console.error('Erro ao enviar solicitação Pix:', err);
    } finally {
      setEnviandoPagamento(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurante?.id) return;
    if (!nome || !slug || !whatsapp) {
      setErro('Nome do restaurante, link do cardápio e WhatsApp são obrigatórios.');
      return;
    }

    setSalvando(true);
    setErro('');
    setSucesso(false);

    try {
      await atualizarRestaurante(restaurante.id, {
        nome,
        logo,
        banner,
        telefone,
        whatsapp,
        endereco,
        horarioFuncionamento,
        chavePix,
        titularPix,
        slug: slug.toLowerCase().trim()
      });

      setSucesso(true);
      onRestauranteAtualizado();
      setTimeout(() => setSucesso(false), 4000);
    } catch (err: any) {
      console.error('Erro ao atualizar configurações:', err);
      setErro('Erro ao salvar configurações: ' + (err.message || 'Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  };

  const cardapioUrl = `${window.location.origin}/cardapio/${slug}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(cardapioUrl)}`;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Configurações do Restaurante</h1>
        <p className="text-xs text-slate-500 mt-1">
          Altere informações públicas do estabelecimento, WhatsApp de atendimento e gere seu QR Code
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            {sucesso && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Configurações atualizadas com sucesso!</span>
              </div>
            )}

            {erro && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Restaurante *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Slug do Cardápio (URL)</label>
              <div className="flex items-center">
                <span className="bg-slate-100 text-slate-500 px-3 py-2.5 border border-r-0 border-slate-200 rounded-l-xl text-xs font-mono">
                  /cardapio/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-sm font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp de Pedidos *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone Fixo</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Endereço Completo</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, Número, Bairro - Cidade/UF"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Seletor Visual de Horário de Funcionamento */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Seletor de Horário de Funcionamento</span>
                  </label>
                  <p className="text-[11px] text-slate-500">Escolha os dias e selecione os horários por clique e escolha de horas</p>
                </div>

                <button
                  type="button"
                  onClick={() => setModoDigitarTexto(!modoDigitarTexto)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                >
                  {modoDigitarTexto ? '⚡ Usar Seletor Visual' : '✏️ Digitar Texto Livre'}
                </button>
              </div>

              {modoDigitarTexto ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={horarioFuncionamento}
                      onChange={(e) => setHorarioFuncionamento(e.target.value)}
                      placeholder="Ex: Todos os dias: 11:00 às 23:00"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 1. Dias da Semana */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      🗓️ Dias de Atendimento:
                    </label>
                    <select
                      value={diasOpcao}
                      onChange={(e) => {
                        const novo = e.target.value;
                        setDiasOpcao(novo);
                        gerarEAtualizarHorario(novo, tipoTurno, horaAbertura1, horaFechamento1, horaAbertura2, horaFechamento2);
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                    >
                      <option value="Todos os dias">Todos os dias (Segunda a Domingo)</option>
                      <option value="Segunda a Sábado">Segunda a Sábado</option>
                      <option value="Segunda a Sexta">Segunda a Sexta (Dias Úteis)</option>
                      <option value="Terça a Domingo">Terça a Domingo</option>
                      <option value="Quarta a Domingo">Quarta a Domingo</option>
                      <option value="Quinta a Domingo">Quinta a Domingo</option>
                      <option value="Sexta a Domingo">Sexta, Sábado e Domingo (Finais de Semana)</option>
                      <option value="Sábado e Domingo">Apenas Sábado e Domingo</option>
                    </select>
                  </div>

                  {/* 2. Tipo de Funcionamento (Turnos) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      ⏰ Tipo de Turno / Horário:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTipoTurno('unico');
                          gerarEAtualizarHorario(diasOpcao, 'unico', horaAbertura1, horaFechamento1, horaAbertura2, horaFechamento2);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${tipoTurno === 'unico' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                      >
                        ☀️ Turno Único
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipoTurno('dois_turnos');
                          gerarEAtualizarHorario(diasOpcao, 'dois_turnos', horaAbertura1, horaFechamento1, horaAbertura2, horaFechamento2);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${tipoTurno === 'dois_turnos' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                      >
                        🍽️ 2 Turnos
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipoTurno('24h');
                          gerarEAtualizarHorario(diasOpcao, '24h', horaAbertura1, horaFechamento1, horaAbertura2, horaFechamento2);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${tipoTurno === '24h' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                      >
                        🚀 Aberto 24h
                      </button>
                    </div>
                  </div>

                  {/* 3. Seleção de Horários por Time Picker */}
                  {tipoTurno !== '24h' && (
                    <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                      {tipoTurno === 'unico' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">
                              Horário de Abertura:
                            </label>
                            <input
                              type="time"
                              value={horaAbertura1}
                              onChange={(e) => {
                                setHoraAbertura1(e.target.value);
                                gerarEAtualizarHorario(diasOpcao, 'unico', e.target.value, horaFechamento1, horaAbertura2, horaFechamento2);
                              }}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">
                              Horário de Fechamento:
                            </label>
                            <input
                              type="time"
                              value={horaFechamento1}
                              onChange={(e) => {
                                setHoraFechamento1(e.target.value);
                                gerarEAtualizarHorario(diasOpcao, 'unico', horaAbertura1, e.target.value, horaAbertura2, horaFechamento2);
                              }}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-extrabold text-emerald-800 uppercase mb-1">
                                ☀️ 1º Turno (Abertura):
                              </label>
                              <input
                                type="time"
                                value={horaAbertura1}
                                onChange={(e) => {
                                  setHoraAbertura1(e.target.value);
                                  gerarEAtualizarHorario(diasOpcao, 'dois_turnos', e.target.value, horaFechamento1, horaAbertura2, horaFechamento2);
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-extrabold text-emerald-800 uppercase mb-1">
                                ☀️ 1º Turno (Fechamento):
                              </label>
                              <input
                                type="time"
                                value={horaFechamento1}
                                onChange={(e) => {
                                  setHoraFechamento1(e.target.value);
                                  gerarEAtualizarHorario(diasOpcao, 'dois_turnos', horaAbertura1, e.target.value, horaAbertura2, horaFechamento2);
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                            <div>
                              <label className="block text-[11px] font-extrabold text-indigo-800 uppercase mb-1">
                                🌙 2º Turno (Abertura):
                              </label>
                              <input
                                type="time"
                                value={horaAbertura2}
                                onChange={(e) => {
                                  setHoraAbertura2(e.target.value);
                                  gerarEAtualizarHorario(diasOpcao, 'dois_turnos', horaAbertura1, horaFechamento1, e.target.value, horaFechamento2);
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-extrabold text-indigo-800 uppercase mb-1">
                                🌙 2º Turno (Fechamento):
                              </label>
                              <input
                                type="time"
                                value={horaFechamento2}
                                onChange={(e) => {
                                  setHoraFechamento2(e.target.value);
                                  gerarEAtualizarHorario(diasOpcao, 'dois_turnos', horaAbertura1, horaFechamento1, horaAbertura2, e.target.value);
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Botões de Preenchimento Rápido */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">Horários mais comuns:</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setHoraAbertura1('11:00');
                              setHoraFechamento1('23:00');
                              setTipoTurno('unico');
                              gerarEAtualizarHorario(diasOpcao, 'unico', '11:00', '23:00', horaAbertura2, horaFechamento2);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            11:00 às 23:00
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHoraAbertura1('18:00');
                              setHoraFechamento1('23:30');
                              setTipoTurno('unico');
                              gerarEAtualizarHorario(diasOpcao, 'unico', '18:00', '23:30', horaAbertura2, horaFechamento2);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            18:00 às 23:30
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHoraAbertura1('11:00');
                              setHoraFechamento1('15:00');
                              setHoraAbertura2('18:00');
                              setHoraFechamento2('23:00');
                              setTipoTurno('dois_turnos');
                              gerarEAtualizarHorario(diasOpcao, 'dois_turnos', '11:00', '15:00', '18:00', '23:00');
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            Almoço (11-15h) e Janta (18-23h)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHoraAbertura1('08:00');
                              setHoraFechamento1('18:00');
                              setTipoTurno('unico');
                              gerarEAtualizarHorario(diasOpcao, 'unico', '08:00', '18:00', horaAbertura2, horaFechamento2);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            08:00 às 18:00
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Visualização Resultante */}
                  {(() => {
                    const statusPreview = calcularStatusFuncionamento(horarioFuncionamento);
                    return (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs gap-2">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Horário Configurado para os Clientes:</span>
                          <span className="text-slate-700 font-bold">{horarioFuncionamento || 'Nenhum horário configurado.'}</span>
                        </div>
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1.5 border ${
                          statusPreview.aberto 
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${statusPreview.aberto ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
                          <span>{statusPreview.rotulo}</span>
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Logo / Foto do Restaurante</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ✨ Exibido no Topo do Cardápio Digital
                </span>
              </div>
              
              <CloudinaryUpload
                imageUrl={logo}
                onImageChange={(url) => setLogo(url)}
              />
            </div>

            {/* Banner de Capa do Cardápio */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Banner de Capa do Cardápio (Topo)</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  🎨 Imagem de Capa do Topo
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Adicione uma foto de capa panorâmica (ex: prato destaque, fachada ou ambiente) para dar um visual moderno ao topo do seu cardápio público.
              </p>
              
              <CloudinaryUpload
                imageUrl={banner}
                onImageChange={(url) => setBanner(url)}
              />
            </div>

            {/* Preview Visual do Banner + Logo */}
            {(banner || logo) && (
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pré-visualização do Topo do Cardápio</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    O Banner fica ao fundo e a Logo à frente
                  </span>
                </div>

                <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
                  {banner ? (
                    <div className="w-full h-28 sm:h-36 relative">
                      <img src={banner} alt="Banner Capa" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    </div>
                  ) : (
                    <div className="w-full h-16 bg-slate-800/60 flex items-center justify-center text-slate-400 text-xs font-semibold italic">
                      Sem imagem de banner (será exibido apenas o cabeçalho)
                    </div>
                  )}

                  <div className="p-3 pt-0 flex items-center gap-3 relative z-10">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-2xl border-2 border-slate-900 shrink-0 overflow-hidden ${banner ? '-mt-8 sm:-mt-10 ring-2 ring-slate-800' : ''}`}>
                      {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        (nome || 'RE').substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-white text-sm sm:text-base leading-tight">{nome || 'Nome do Seu Restaurante'}</h4>
                      {(() => {
                        const previewHeader = calcularStatusFuncionamento(horarioFuncionamento);
                        return (
                          <p className={`text-[11px] font-bold flex items-center gap-1 ${previewHeader.aberto ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${previewHeader.aberto ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                            <span>{previewHeader.rotulo}</span>
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Configuração do Pix do Restaurante para Recebimento no Cardápio */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs uppercase tracking-wide">
                  <span>💸 Chave Pix do Restaurante (Recebimento de Clientes)</span>
                </div>
                {!chavePix && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                    Pendente de Cadastro
                  </span>
                )}
              </div>

              {!chavePix && (
                <div className="bg-amber-50/90 p-3.5 rounded-xl border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-extrabold block text-amber-950">Atenção: Você ainda não cadastrou sua Chave Pix!</span>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Enquanto nenhuma chave for cadastrada, o cardápio utilizará o seu número de WhatsApp/celular do cadastro como opção padrão. Por favor, cadastre sua chave Pix e o nome do titular nos campos abaixo.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-600">
                Cadastre sua chave Pix oficial para exibição no checkout do seu cardápio público com botão de "Copiar Pix" para seus clientes.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Chave Pix (CPF/CNPJ/E-mail/Tel)</label>
                  <input
                    type="text"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder="Ex: 123.456.789-00 ou pix@restaurante.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Titular da Conta Pix</label>
                  <input
                    type="text"
                    value={titularPix}
                    onChange={(e) => setTitularPix(e.target.value)}
                    placeholder="Ex: João da Silva / Restaurante LTDA"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" isLoading={salvando} className="w-full sm:w-auto">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>

        {/* QR Code & Plan Info Box */}
        <div className="space-y-6">
          {/* Plan Status Box */}
          {usuario?.tipo === 'admin' ? (
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Tipo de Usuário</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  Master Admin
                </span>
              </div>

              <h3 className="font-extrabold text-lg text-white">
                Administrador Master SaaS
              </h3>

              <p className="text-xs text-slate-300">
                Sua conta ({usuario.email}) possui privilégios de Administrador Master do MenuPro, com acesso irrestrito a todos os módulos sem necessidade de planos.
              </p>

              <button
                type="button"
                onClick={() => window.location.href = '/saas-admin'}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Painel de Gestão SaaS Admin</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Plano Atual</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  restaurante?.statusPagamento === 'Confirmado Pix' || restaurante?.statusPagamento === 'Gratuito'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : restaurante?.statusPagamento === 'Pendente Pix'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {restaurante?.statusPagamento || 'Ativo'}
                </span>
              </div>

              <h3 className="font-extrabold text-lg text-white">
                {restaurante?.plano || 'Plano Degustação (30 Dias Grátis)'}
              </h3>

              {/* Data de Vencimento e Tempo Restante */}
              <div className="bg-slate-800/90 border border-slate-700/80 p-3 rounded-xl flex items-center justify-between text-xs my-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data de Vencimento</span>
                  <span className="font-extrabold text-emerald-400 text-sm flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{formatarDataVencimentoPlano(restaurante?.expiracaoPlano, restaurante?.criadoEm)}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Validade</span>
                  <span className="font-bold text-slate-200 text-xs">
                    {restaurante ? calcularDiasRestantesPlano(restaurante.expiracaoPlano, restaurante.criadoEm) : 0} dia(s) restante(s)
                  </span>
                </div>
              </div>

              {restaurante?.statusPagamento === 'Pendente Pix' && (
                <div className="bg-amber-950/60 border border-amber-500/40 p-3 rounded-xl space-y-1 text-xs text-amber-200">
                  <span className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Aguardando Confirmação do Pix
                  </span>
                  <p className="text-[11px] text-amber-300/80">
                    O pagamento do seu plano foi registrado e está aguardando liberação do Administrador.
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-300">
                Acesso a cardápio digital via QR Code, pedidos em tempo real via WhatsApp e gestão de produtos.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSucessoModalPix(false);
                  setPlanoSelecionadoModal(null);
                  setModalPlanosAberto(true);
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Ver Planos / Ativar / Renovar</span>
              </button>
            </div>
          )}

          {/* Direct Link Preview Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-600" />
              <span>Acesso Direto ao Cardápio</span>
            </h4>
            <p className="text-xs text-slate-500">
              Seu cardápio está online e atualizado em tempo real para os clientes.
            </p>
            <div className="text-xs font-mono text-slate-700 bg-slate-100 p-2.5 rounded-xl break-all">
              {cardapioUrl}
            </div>
            <a
              href={`/cardapio/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <span>Testar Cardápio em Nova Aba</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Taxas de Entrega por Bairro */}
      <TaxasEntregaManager restaurante={restaurante} />

      {/* Cupons de Desconto e Promoções */}
      <CuponsManager restaurante={restaurante} />

      {/* Avaliações e Feedback dos Clientes */}
      <AvaliacoesManager restaurante={restaurante} />

      {/* QR Code Generator Module */}
      <QrCodeGenerator restaurante={restaurante} />

      {/* Modal de Escolha e Ativação de Planos */}
      {modalPlanosAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-auto animate-in fade-in zoom-in-95">
              <button
                onClick={() => setModalPlanosAberto(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors z-20 cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 pr-8">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Planos & Ativação
                  </span>
                  {planoSelecionadoModal && (
                    <button
                      type="button"
                      onClick={() => setPlanoSelecionadoModal(null)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar aos Planos</span>
                    </button>
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-2">
                  {planoSelecionadoModal ? `Ativação do ${planoSelecionadoModal.nome}` : 'Escolha ou Renove seu Plano'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {planoSelecionadoModal 
                    ? 'Confira as instruções de pagamento via Pix abaixo para concluir a liberação.' 
                    : 'Selecione o plano ideal para seu estabelecimento. A ativação é realizada via Pix e liberada instantaneamente.'}
                </p>

                {/* Exibição da Data de Vencimento do Plano Atual */}
                <div className="mt-3 bg-slate-100 border border-slate-200 p-2.5 rounded-xl flex flex-wrap items-center justify-between text-xs gap-2">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Vencimento do seu plano atual:</span>
                  </span>
                  <span className="font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {formatarDataVencimentoPlano(restaurante?.expiracaoPlano, restaurante?.criadoEm)} ({restaurante ? calcularDiasRestantesPlano(restaurante.expiracaoPlano, restaurante.criadoEm) : 0}d restantes)
                  </span>
                </div>
              </div>

            {usuario?.tipo === 'admin' ? (
              <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg">Conta Administrador Master SaaS</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Como Administrador Master ({usuario.email}), sua conta possui acesso ilimitado sem necessidade de contratação ou pagamento de planos.
                </p>
                <button
                  onClick={() => setModalPlanosAberto(false)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            ) : sucessoModalPix ? (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg">Solicitação Enviada com Sucesso!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Sua intenção de renovação/ativação foi registrada no sistema. Assim que o pagamento Pix for confirmado pelo administrador, seu plano será liberado na hora!
                </p>
                <button
                  onClick={() => setModalPlanosAberto(false)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Entendi e Fechar
                </button>
              </div>
            ) : planoSelecionadoModal ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Plano Selecionado</span>
                    <h4 className="font-black text-slate-900 text-lg">{planoSelecionadoModal.nome}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-600">
                      R$ {planoSelecionadoModal.preco.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">/mês</span>
                  </div>
                </div>

                {(() => {
                  const diasRestantesAtuais = restaurante ? calcularDiasRestantesPlano(restaurante.expiracaoPlano, restaurante.criadoEm) : 0;
                  const totalDiasNovos = (diasRestantesAtuais > 0 ? diasRestantesAtuais : 0) + 30;
                  const dataNovaExpiracao = new Date();
                  dataNovaExpiracao.setDate(dataNovaExpiracao.getDate() + totalDiasNovos);
                  const novaDataStr = `${String(dataNovaExpiracao.getDate()).padStart(2, '0')}/${String(dataNovaExpiracao.getMonth() + 1).padStart(2, '0')}/${dataNovaExpiracao.getFullYear()}`;

                  return (
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-2xl text-xs space-y-2">
                      <div className="flex items-center gap-2 font-black text-emerald-900">
                        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Nova Data de Vencimento: <strong className="text-emerald-700 underline">{novaDataStr}</strong></span>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {diasRestantesAtuais > 0 ? (
                          <>
                            Seu plano atual ainda possui <strong>{diasRestantesAtuais} dia(s) restante(s)</strong>. Ao renovar para o <strong>{planoSelecionadoModal.nome}</strong>, esses <strong>{diasRestantesAtuais} dias</strong> serão somados aos <strong>30 dias</strong> do novo plano (total de <strong>{totalDiasNovos} dias</strong>), estendendo a validade até <strong>{novaDataStr}</strong>!
                          </>
                        ) : (
                          <>
                            Ao renovar/ativar o plano <strong>{planoSelecionadoModal.nome}</strong>, sua assinatura terá <strong>30 dias de validade</strong> até <strong>{novaDataStr}</strong>!
                          </>
                        )}
                      </p>
                    </div>
                  );
                })()}

                <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 space-y-3">
                  <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide block">
                    💳 Dados da Chave Pix Oficial do MenuPro
                  </span>
                  <p className="text-xs text-slate-600">
                    Realize a transferência Pix no valor de <strong>R$ {planoSelecionadoModal.preco.toFixed(2).replace('.', ',')}</strong> e envie o comprovante para o Administrador:
                  </p>
                  
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Chave Pix:</span>
                        <span className="font-mono text-xs text-slate-900 font-extrabold select-all">
                          {configSaas?.chavePix || '38992097063'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(configSaas?.chavePix || '38992097063');
                          alert('Chave Pix copiada para a área de transferência!');
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Chave
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400 font-medium block">Titular:</span>
                        <strong className="text-slate-900 font-bold">{configSaas?.titularPix || 'Élia Velozo de Oliveira'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Banco:</span>
                        <strong className="text-slate-900 font-bold">{configSaas?.bancoPix || 'Nubank'}</strong>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/55${(configSaas?.whatsappSuporte || '92982391133').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Solicitei a renovação/mudança para o plano ${planoSelecionadoModal.nome} no MenuPro (Restaurante: ${restaurante?.nome || ''}) e aqui está meu comprovante Pix.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    💬 Enviar Comprovante para o WhatsApp do ADM ({configSaas?.whatsappSuporte || '(92) 98239-1133'})
                  </a>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPlanoSelecionadoModal(null)}
                    className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Voltar e Escolher Outro
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSolicitarPlanoPix(planoSelecionadoModal)}
                    disabled={enviandoPagamento}
                    className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {enviandoPagamento ? (
                      <span>Registrando...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Já Fiz o Pix / Confirmar Ativação</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  {planosDisponiveis
                    .filter((p) => {
                      const isGratuito = p.preco === 0 || p.nome.toLowerCase().includes('degusta') || p.nome.toLowerCase().includes('grátis') || p.nome.toLowerCase().includes('gratis');
                      const jaPagouOuEstaEmPlanoPago = 
                        restaurante?.statusPagamento === 'Confirmado Pix' ||
                        restaurante?.statusPagamento === 'Pendente Pix' ||
                        !!restaurante?.dataAprovacaoPix ||
                        (!!restaurante?.plano && !restaurante.plano.toLowerCase().includes('degusta') && !restaurante.plano.toLowerCase().includes('grátis') && !restaurante.plano.toLowerCase().includes('gratis'));
                      
                      // Se já pagou ou está em plano pago, oculta plano gratuito/degustação
                      if (jaPagouOuEstaEmPlanoPago && isGratuito) {
                        return false;
                      }
                      return true;
                    })
                    .map((p) => {
                    const isDegustacao = p.preco === 0 || p.nome.toLowerCase().includes('degusta');
                    const isPlanoAtual = restaurante?.plano === p.nome;

                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                          isPlanoAtual 
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20' 
                            : 'bg-slate-50 border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-sm text-slate-900">{p.nome}</span>
                            {isPlanoAtual && (
                              <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                                Atual
                              </span>
                            )}
                          </div>
                          
                          <div className="my-2">
                            {p.preco === 0 ? (
                              <span className="text-lg font-black text-emerald-600">GRÁTIS</span>
                            ) : (
                              <span className="text-lg font-black text-slate-900">
                                R$ {p.preco.toFixed(2).replace('.', ',')}
                                <span className="text-[10px] text-slate-500 font-normal">/mês</span>
                              </span>
                            )}
                          </div>

                          <ul className="space-y-1.5 mb-3 text-[11px] text-slate-600">
                            {p.recursos.slice(0, 3).map((r, i) => (
                              <li key={i} className="flex items-center gap-1 truncate">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{r}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Data de Vencimento e Validade no Card */}
                          {(() => {
                            const diasRestantesAtuais = restaurante ? calcularDiasRestantesPlano(restaurante.expiracaoPlano, restaurante.criadoEm) : 0;
                            const totalDiasNovos = (diasRestantesAtuais > 0 ? diasRestantesAtuais : 0) + 30;
                            const dataNova = new Date();
                            dataNova.setDate(dataNova.getDate() + totalDiasNovos);
                            const dataNovaStr = `${String(dataNova.getDate()).padStart(2, '0')}/${String(dataNova.getMonth() + 1).padStart(2, '0')}/${dataNova.getFullYear()}`;

                            return (
                              <div className="mb-3 p-2 bg-slate-100/80 rounded-xl border border-slate-200/80 text-[10px] space-y-0.5">
                                <span className="text-slate-500 font-bold block flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-emerald-600" />
                                  {isPlanoAtual ? 'Vencimento Atual:' : 'Vencimento após Ativação:'}
                                </span>
                                <span className="font-extrabold text-slate-900 block text-[11px]">
                                  {isPlanoAtual 
                                    ? formatarDataVencimentoPlano(restaurante?.expiracaoPlano, restaurante?.criadoEm)
                                    : dataNovaStr}
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        <button
                          onClick={() => setPlanoSelecionadoModal(p)}
                          className={`w-full py-2 font-bold text-xs rounded-xl transition-all ${
                            isPlanoAtual
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {isPlanoAtual ? 'Plano Atual' : 'Selecionar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
