import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { cadastrarUsuario } from '../services/auth';
import { criarRestaurante, listarPlanos, inicializarPlanosIniciais, obterConfiguracoesSaas, CONFIGURACAO_SAAS_PADRAO } from '../services/database';
import { Plano, ConfiguracoesSaas } from '../types';
import { Button } from '../components/Button';
import { SEO } from '../components/SEO';
import { 
  CheckCircle2, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  ArrowRight, 
  AlertCircle, 
  Building2,
  QrCode,
  Copy,
  Check,
  CreditCard,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const CadastroRestaurante: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planoIdParam = searchParams.get('plano');

  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4>(1); // 1: Conta, 2: Plano, 3: Pagamento Pix (se pago), 4: Restaurante
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [configSaas, setConfigSaas] = useState<ConfiguracoesSaas>(CONFIGURACAO_SAAS_PADRAO);
  const [copiadoPix, setCopiadoPix] = useState(false);
  const [confirmouPix, setConfirmouPix] = useState(false);

  // Form states
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [planoSelecionado, setPlanoSelecionado] = useState<string>('');

  const [nomeRestaurante, setNomeRestaurante] = useState('');
  const [slugRestaurante, setSlugRestaurante] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [endereco, setEndereco] = useState('');

  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        await inicializarPlanosIniciais();
        const [lista, pixData] = await Promise.all([
          listarPlanos(),
          obterConfiguracoesSaas()
        ]);
        const ativos = lista.filter(p => p.ativo);
        setPlanos(ativos);
        if (pixData) {
          setConfigSaas(pixData);
        }
        if (planoIdParam && ativos.some(p => p.id === planoIdParam)) {
          setPlanoSelecionado(planoIdParam);
        } else if (ativos.length > 0) {
          setPlanoSelecionado(ativos[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar dados de cadastro:', err);
      } finally {
        setLoadingPlanos(false);
      }
    }
    carregarDadosIniciais();
  }, [planoIdParam]);

  const planoAtual = planos.find(p => p.id === planoSelecionado);
  const isPlanoPago = Boolean(planoAtual && planoAtual.preco > 0);

  const copiarChavePix = () => {
    if (!configSaas?.chavePix) return;
    navigator.clipboard.writeText(configSaas.chavePix);
    setCopiadoPix(true);
    setTimeout(() => setCopiadoPix(false), 3000);
  };

  const handleNomeRestauranteChange = (val: string) => {
    setNomeRestaurante(val);
    const autoSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSlugRestaurante(autoSlug);
  };

  const handleEtapa1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeUsuario || !email || !senha) {
      setErro('Preencha todos os campos da conta.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve conter pelo menos 6 caracteres.');
      return;
    }
    setErro('');
    setEtapa(2);
  };

  const handleEtapa2 = () => {
    if (!planoSelecionado) {
      setErro('Selecione um plano para continuar.');
      return;
    }
    setErro('');
    if (isPlanoPago) {
      setEtapa(3); // Etapa 3 = Pagamento Pix
    } else {
      setEtapa(4); // Etapa 4 = Dados do Restaurante
    }
  };

  const handleFinalizarCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeRestaurante || !slugRestaurante || !whatsapp) {
      setErro('Preencha o nome do restaurante, link/slug e número do WhatsApp.');
      return;
    }

    setErro('');
    setLoading(true);

    try {
      const planoObj = planos.find(p => p.id === planoSelecionado);

      // 1. Criar o restaurante no Firestore
      // Se for plano pago, nasce inativo (ativo: false) e com status "Pendente Pix"
      const novoRest = await criarRestaurante({
        nome: nomeRestaurante,
        slug: slugRestaurante,
        telefone,
        whatsapp,
        endereco,
        email: email,
        plano: planoObj?.nome || 'Plano Degustação (30 Dias Grátis)',
        planoId: planoSelecionado,
        statusPagamento: isPlanoPago ? 'Pendente Pix' : 'Gratuito',
        ativo: !isPlanoPago
      });

      // 2. Criar conta de usuário vinculada diretamente ao ID do restaurante
      await cadastrarUsuario(
        nomeUsuario,
        email,
        senha,
        'restaurante',
        novoRest.id
      );

      // 3. Entrar diretamente no painel do aplicativo logado na conta recém-criada
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erro ao cadastrar restaurante:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está cadastrado. Por favor, faça login para acessar sua conta ou escolha outro e-mail.');
      } else if (err.code === 'auth/weak-password') {
        setErro('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
        setErro('E-mail informado é inválido.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErro('O cadastro por e-mail e senha está temporariamente indisponível.');
      } else {
        setErro('Erro no cadastro: ' + (err.message || 'Tente novamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6">
      <SEO 
        title="Cadastrar Restaurante - Cardápio Digital QR Code | MenuPro"
        description="Cadastre seu restaurante na plataforma MenuPro e tenha seu cardápio digital por QR Code com pedidos no WhatsApp funcionando em poucos minutos."
      />

      {/* Header Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between mb-4 sm:mb-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-base sm:text-lg">
            M
          </div>
          <span className="font-extrabold text-white text-lg sm:text-xl">
            Menu<span className="text-emerald-500">Pro</span>
          </span>
        </Link>

        <Link
          to="/login"
          className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors shrink-0"
        >
          <span className="sm:hidden">Fazer Login</span>
          <span className="hidden sm:inline">Já tem conta? Fazer Login</span>
        </Link>
      </div>

      {/* Form Container */}
      <div className={`${etapa === 2 ? 'max-w-6xl' : 'max-w-2xl'} mx-auto w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl transition-all duration-300`}>
        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 overflow-x-auto">
          <div className={`flex items-center gap-2 ${etapa >= 1 ? 'text-emerald-600 font-bold' : 'text-slate-400'} shrink-0`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${etapa >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</div>
            <span className="text-xs hidden sm:inline">Criar Conta</span>
          </div>
          <div className="w-6 sm:w-12 h-0.5 bg-slate-200 shrink-0" />
          <div className={`flex items-center gap-2 ${etapa >= 2 ? 'text-emerald-600 font-bold' : 'text-slate-400'} shrink-0`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${etapa >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</div>
            <span className="text-xs hidden sm:inline">Plano</span>
          </div>
          
          {isPlanoPago && (
            <>
              <div className="w-6 sm:w-12 h-0.5 bg-slate-200 shrink-0" />
              <div className={`flex items-center gap-2 ${etapa >= 3 ? 'text-emerald-600 font-bold' : 'text-slate-400'} shrink-0`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${etapa >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</div>
                <span className="text-xs hidden sm:inline">Pagamento Pix</span>
              </div>
            </>
          )}

          <div className="w-6 sm:w-12 h-0.5 bg-slate-200 shrink-0" />
          <div className={`flex items-center gap-2 ${etapa >= 4 || (!isPlanoPago && etapa >= 3) ? 'text-emerald-600 font-bold' : 'text-slate-400'} shrink-0`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${etapa >= 4 || (!isPlanoPago && etapa >= 3) ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {isPlanoPago ? '4' : '3'}
            </div>
            <span className="text-xs hidden sm:inline">Seu Restaurante</span>
          </div>
        </div>

        {erro && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{erro}</span>
          </div>
        )}

        {/* Etapa 1: Dados do Usuário */}
        {etapa === 1 && (
          <form onSubmit={handleEtapa1} className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Passo 1: Crie seu Acesso</h2>
            <p className="text-xs text-slate-500">Insira suas informações pessoais para administrar o painel do seu restaurante.</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Seu Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={nomeUsuario}
                  onChange={(e) => setNomeUsuario(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail Profissional</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@seurestaurante.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-3.5 mt-4" icon={<ArrowRight className="w-4 h-4" />}>
              Avançar para Escolha do Plano
            </Button>
          </form>
        )}

        {/* Etapa 2: Seleção de Plano */}
        {etapa === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Passo 2: Escolha seu Plano SaaS</h2>
              <p className="text-xs text-slate-500 mt-1">Escolha o plano ideal com todos os recursos atualizados para o seu restaurante.</p>
            </div>

            {loadingPlanos ? (
              <div className="py-12 text-center text-slate-500 text-sm">Carregando planos disponíveis...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {planos.map((p) => {
                  const isDegustacao = p.preco === 0 || p.id.includes('degustacao') || p.nome.toLowerCase().includes('degustação') || p.nome.toLowerCase().includes('degustacao');
                  const isSelecionado = planoSelecionado === p.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setPlanoSelecionado(p.id)}
                      className={`rounded-3xl p-6 border-2 transition-all flex flex-col justify-between cursor-pointer relative shadow-xs hover:shadow-md ${
                        isSelecionado
                          ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/30'
                          : isDegustacao
                          ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/50 to-white hover:border-emerald-500'
                          : 'border-slate-200 hover:border-emerald-400 bg-white'
                      }`}
                    >
                      {isSelecionado && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-xs flex items-center gap-1 z-10 whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          <span>Plano Selecionado</span>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {isDegustacao ? (
                            <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-100 fill-amber-100" />
                              30 Dias Grátis
                            </span>
                          ) : (
                            <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <QrCode className="w-3 h-3" />
                              Pix Mensal
                            </span>
                          )}
                        </div>

                        <h3 className="font-black text-lg text-slate-900 leading-tight mb-1">{p.nome}</h3>
                        <p className="text-slate-500 text-xs mb-4 min-h-[2.5rem] leading-relaxed">{p.descricao}</p>

                        <div className="mb-4 pb-3 border-b border-slate-200/80">
                          {p.preco === 0 ? (
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-emerald-600">GRÁTIS</span>
                              <span className="text-slate-500 text-xs font-semibold">/ 30 dias</span>
                            </div>
                          ) : (
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-slate-900">
                                R$ {p.preco.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-slate-500 text-xs font-medium">/mês</span>
                            </div>
                          )}
                        </div>

                        {p.recursos && p.recursos.length > 0 && (
                          <ul className="space-y-2 mb-4">
                            {p.recursos.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanoSelecionado(p.id);
                        }}
                        className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 mt-3 cursor-pointer ${
                          isSelecionado
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isSelecionado ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Selecionado</span>
                          </>
                        ) : (
                          <span>Escolher Este Plano</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setEtapa(1)} className="py-3.5">
                Voltar
              </Button>
              <Button onClick={handleEtapa2} className="flex-1 py-3.5" icon={<ArrowRight className="w-4 h-4" />}>
                {isPlanoPago ? `Avançar com ${planoAtual?.nome || 'Plano'} (Pagamento Pix)` : 'Avançar para Dados do Restaurante'}
              </Button>
            </div>
          </div>
        )}

        {/* Etapa 3: Pagamento Pix (Apenas para Planos Pagos) */}
        {etapa === 3 && isPlanoPago && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {planoAtual?.nome} — R$ {planoAtual?.preco.toFixed(2).replace('.', ',')} / mês
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Passo 3: Pagamento da Mensalidade via Pix</h2>
              <p className="text-xs text-slate-500 mt-1">Escaneie o QR Code ou copie a chave Pix para realizar a transferência do valor da assinatura.</p>
            </div>

            {/* Pix Box */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-800/90 p-5 rounded-2xl border border-slate-700/80">
                {/* QR Code */}
                <div className="flex flex-col items-center shrink-0">
                  {configSaas.chavePix ? (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(configSaas.chavePix)}`}
                      alt="QR Code Pix SaaS"
                      className="w-36 h-36 rounded-2xl bg-white p-2 border-2 border-emerald-500/50 shadow-md"
                    />
                  ) : (
                    <div className="w-36 h-36 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-500">
                      QR Code Indisponível
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-emerald-400 mt-2 uppercase tracking-wider">QR Code Pix</span>
                </div>

                {/* Pix Details */}
                <div className="space-y-3 w-full text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Chave Pix Oficial:</label>
                    <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="font-mono text-emerald-400 font-bold truncate flex-1 select-all text-sm">
                        {configSaas.chavePix || 'eliavelozo6@gmail.com'}
                      </span>
                      <button
                        type="button"
                        onClick={copiarChavePix}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                          copiadoPix 
                            ? 'bg-emerald-500 text-slate-950' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {copiadoPix ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar Chave
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block font-bold">TITULAR:</span>
                      <span className="font-semibold text-white truncate block">{configSaas.titularPix || 'MenuPro SaaS'}</span>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block font-bold">BANCO:</span>
                      <span className="font-semibold text-white truncate block">{configSaas.bancoPix || 'Nubank'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                    <span className="font-bold text-emerald-400 block mb-0.5">Valor a Pagar:</span>
                    <span className="text-lg font-black text-white">R$ {planoAtual?.preco.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>

              {/* Instructions List */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
                <span className="font-bold text-emerald-400 text-xs block">Instruções de Pagamento:</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Abra o aplicativo do seu banco de preferência e selecione a opção <strong>Pix</strong>.</li>
                  <li>Escaneie o QR Code acima ou cole a chave Pix oficial do MenuPro (<strong>{configSaas.chavePix || '38992097063'}</strong>).</li>
                  <li>Confira o valor de <strong>R$ {planoAtual?.preco.toFixed(2).replace('.', ',')}</strong> e o titular (<strong>{configSaas.titularPix || 'Élia Velozo de Oliveira'}</strong>).</li>
                  <li>Após pagar, você pode enviar o comprovante no WhatsApp do Suporte ADM e concluir seu cadastro.</li>
                </ol>
              </div>

              {/* Botão de WhatsApp do Administrador */}
              <a
                href={`https://wa.me/55${(configSaas.whatsappSuporte || '92982391133').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Estou realizando o cadastro no MenuPro para o restaurante "${nomeRestaurante || nomeUsuario}" (Plano: ${planoAtual?.nome || ''}) e gostaria de enviar o comprovante Pix.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2"
              >
                💬 Enviar Comprovante para o WhatsApp do ADM ({configSaas.whatsappSuporte || '(92) 98239-1133'})
              </a>

              {/* Confirmation Checkbox */}
              <label className="flex items-center gap-3 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmouPix}
                  onChange={(e) => setConfirmouPix(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <span className="text-xs font-semibold text-emerald-200">
                  Já realizei a transferência do Pix no meu banco para o plano {planoAtual?.nome}
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setEtapa(2)} className="py-3.5">
                Voltar aos Planos
              </Button>
              <Button 
                onClick={() => {
                  setErro('');
                  setEtapa(4);
                }} 
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700" 
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Já Paguei via Pix — Ir para Dados do Restaurante
              </Button>
            </div>
          </div>
        )}

        {/* Etapa 4 (ou 3 se grátis): Dados do Restaurante */}
        {(etapa === 4 || (!isPlanoPago && etapa === 3)) && (
          <form onSubmit={handleFinalizarCadastro} className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Plano Selecionado: {planoAtual?.nome}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {isPlanoPago ? 'Passo 4: Dados do Seu Restaurante' : 'Passo 3: Dados do Seu Restaurante'}
              </h2>
              <p className="text-xs text-slate-500">Defina o nome e o link público do seu cardápio digital.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Restaurante</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={nomeRestaurante}
                  onChange={(e) => handleNomeRestauranteChange(e.target.value)}
                  placeholder="Ex: Burger King House"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Link do Cardápio (Slug Único)</label>
              <div className="flex items-center">
                <span className="bg-slate-100 text-slate-500 px-3 py-3 border border-r-0 border-slate-200 rounded-l-xl text-xs font-mono">
                  /cardapio/
                </span>
                <input
                  type="text"
                  required
                  value={slugRestaurante}
                  onChange={(e) => setSlugRestaurante(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="burger-king-house"
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-r-xl text-sm font-mono text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp de Pedidos</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone Fixo (Opcional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 3333-3333"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Endereço Físico</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua das Flores, 123 - Centro"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="aceiteLgpd"
                required
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
              />
              <label htmlFor="aceiteLgpd" className="cursor-pointer">
                Declaro que li e concordo com os <a href="/termos-de-uso" target="_blank" className="text-emerald-600 font-bold hover:underline">Termos de Uso</a> e a <a href="/politica-de-privacidade" target="_blank" className="text-emerald-600 font-bold hover:underline">Política de Privacidade (LGPD)</a> do MenuPro.
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setEtapa(isPlanoPago ? 3 : 2)} className="py-3.5">
                Voltar
              </Button>
              <Button type="submit" isLoading={loading} className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700" icon={<CheckCircle2 className="w-4 h-4" />}>
                Concluir e Acessar Painel
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="text-center text-xs text-slate-500 mt-6">
        MenuPro SaaS Platform &bull; Segurança e Persistência Firebase Firestore
      </div>
    </div>
  );
};
