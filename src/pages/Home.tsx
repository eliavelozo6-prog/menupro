import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, QrCode, Smartphone, ArrowRight, CheckCircle2, Shield, Store, Zap, Sparkles, Search } from 'lucide-react';
import { Plano, Restaurante } from '../types';
import { listarPlanos, listarRestaurantes, inicializarPlanosIniciais, ordenarPlanos, obterIdsRestaurantesAdmin } from '../services/database';
import { SEO } from '../components/SEO';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para busca e paginação de restaurantes na Landing Page
  const [buscaRestaurante, setBuscaRestaurante] = useState('');
  const [paginaRestaurantes, setPaginaRestaurantes] = useState(1);
  const ITENS_POR_PAGINA = 6;

  useEffect(() => {
    async function carregarDados() {
      try {
        await inicializarPlanosIniciais();
        const [planosData, restData, adminRestIds] = await Promise.all([
          listarPlanos(),
          listarRestaurantes(),
          obterIdsRestaurantesAdmin()
        ]);
        const ativos = planosData.filter(p => p.ativo);
        setPlanos(ordenarPlanos(ativos));

        const adminEmails = ['eliavelozo6@gmail.com', 'admin@menupro.com'];
        const restSemAdmin = restData.filter(r => {
          if (!r.ativo) return false;
          if (adminRestIds.includes(r.id)) return false;
          
          const restEmail = (r.email || '').toLowerCase().trim();
          if (adminEmails.some(e => restEmail.includes(e.toLowerCase().trim()))) return false;
          if (restEmail.includes('eliavelozo') || restEmail.includes('admin@')) return false;
          
          const nomeLower = (r.nome || '').toLowerCase().trim();
          const slugLower = (r.slug || '').toLowerCase().trim();
          if (nomeLower.includes('eliavelozo') || slugLower.includes('eliavelozo')) return false;
          if (nomeLower.includes('admin') || slugLower.includes('admin')) return false;

          return true;
        });
        setRestaurantes(restSemAdmin);
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  // Filtro e Paginação calculados
  const restaurantesFiltrados = restaurantes.filter(r => 
    r.nome.toLowerCase().includes(buscaRestaurante.toLowerCase().trim()) ||
    (r.endereco && r.endereco.toLowerCase().includes(buscaRestaurante.toLowerCase().trim()))
  );

  const totalPaginasRest = Math.ceil(restaurantesFiltrados.length / ITENS_POR_PAGINA);
  const restaurantesExibidos = restaurantesFiltrados.slice(
    (paginaRestaurantes - 1) * ITENS_POR_PAGINA,
    paginaRestaurantes * ITENS_POR_PAGINA
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      <SEO 
        title="MenuPro - Cardápio Digital QR Code & Pedidos WhatsApp para Restaurantes"
        description="Transforme seu restaurante com o MenuPro. Crie seu cardápio digital em minutos com pedidos no WhatsApp, gestão de mesas, comanda e impressão de pedidos sem taxas por venda."
      />

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-base sm:text-xl shadow-md shrink-0">
              M
            </div>
            <span className="font-extrabold text-lg sm:text-2xl text-slate-900 tracking-tight">
              Menu<span className="text-emerald-600">Pro</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-slate-100"
            >
              <span className="sm:hidden">Entrar</span>
              <span className="hidden sm:inline">Entrar no Painel</span>
            </Link>
            <Link
              to="/cadastro-restaurante"
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl shadow-xs sm:shadow-md transition-all active:scale-95 shrink-0"
            >
              <span className="sm:hidden">Cadastrar</span>
              <span className="hidden sm:inline">Crie seu Cardápio Digital</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Banner */}
        <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              SaaS de Cardápio Digital &bull; 30 Dias Grátis para Testar
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              Transforme seu restaurante em um <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Império Digital</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
              Receba pedidos instantâneos via QR Code na mesa ou delivery direto no WhatsApp. Experimente <strong>30 dias grátis</strong> sem cartão de crédito!
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/cadastro-restaurante"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-base px-8 py-4 rounded-2xl shadow-lg shadow-emerald-900/30 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <span>Experimente 30 Dias Grátis</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#planos"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-base px-6 py-4 rounded-2xl border border-slate-700 transition-colors"
              >
                Ver Planos e Preços
              </a>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">QR Code Inteligente</h3>
                <p className="text-slate-600 text-sm">Seu cliente escaneia o código na mesa ou acessa o link e abre o cardápio sem precisar baixar nenhum aplicativo.</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">PWA Instalável</h3>
                <p className="text-slate-600 text-sm">Painel e cardápio leve, rápido e instalável diretamente no celular ou computador do estabelecimento, sem precisar baixar na loja de apps.</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Gestão em Tempo Real</h3>
                <p className="text-slate-600 text-sm">Acompanhe novos pedidos chegando instantaneamente na tela com atualização em tempo real do status.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Active Restaurants List */}
        {restaurantes.length > 0 && (
          <section className="py-16 bg-slate-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Restaurantes Ativos na Plataforma</h2>
                <p className="text-slate-600 text-sm mt-2">Conheça alguns dos estabelecimentos que usam o MenuPro</p>
              </div>

              {/* Filtro de Busca & Contador */}
              {restaurantes.length > 3 && (
                <div className="max-w-md mx-auto mb-8 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar restaurante por nome..."
                      value={buscaRestaurante}
                      onChange={(e) => {
                        setBuscaRestaurante(e.target.value);
                        setPaginaRestaurantes(1);
                      }}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {restaurantesFiltrados.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-medium bg-white rounded-2xl border border-slate-200 max-w-md mx-auto">
                  Nenhum restaurante encontrado com o nome "{buscaRestaurante}".
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {restaurantesExibidos.map((rest) => (
                      <div key={rest.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-lg shrink-0 overflow-hidden border border-slate-100">
                              {rest.logo ? <img src={rest.logo} alt={rest.nome} className="w-full h-full object-cover rounded-xl" /> : rest.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 text-base truncate">{rest.nome}</h4>
                              <span className="text-xs text-slate-500 truncate block">{rest.endereco || 'Endereço não informado'}</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 mb-4">
                            Atendendo via Cardápio Digital MenuPro
                          </p>
                        </div>

                        <Link
                          to={`/cardapio/${rest.slug}`}
                          className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 hover:bg-emerald-600 hover:text-white font-bold text-xs text-slate-800 rounded-xl transition-all"
                        >
                          <Store className="w-4 h-4" />
                          <span>Ver Cardápio Público</span>
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* Paginação / Controles */}
                  {totalPaginasRest > 1 && (
                    <div className="mt-8 flex items-center justify-between border-t border-slate-200/80 pt-6">
                      <span className="text-xs text-slate-500 font-semibold">
                        Exibindo {restaurantesExibidos.length} de {restaurantesFiltrados.length} restaurante(s)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={paginaRestaurantes === 1}
                          onClick={() => setPaginaRestaurantes(prev => Math.max(prev - 1, 1))}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer shadow-2xs"
                        >
                          Anterior
                        </button>
                        <span className="text-xs font-bold text-slate-700 px-2">
                          Página {paginaRestaurantes} de {totalPaginasRest}
                        </span>
                        <button
                          type="button"
                          disabled={paginaRestaurantes >= totalPaginasRest}
                          onClick={() => setPaginaRestaurantes(prev => Math.min(prev + 1, totalPaginasRest))}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer shadow-2xs"
                        >
                          Próxima
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* Pricing Plans Section */}
        <section id="planos" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">Planos Transparentes</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Escolha o plano perfeito para o seu restaurante</h2>
              <p className="text-slate-600 text-base">Sem fidelidade, cancele quando quiser. Todos os planos incluem banco de dados dedicado e cardápio digital.</p>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500">Carregando planos reais...</div>
            ) : planos.length === 0 ? (
              <div className="text-center py-12 text-slate-500">Nenhum plano ativo encontrado.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {planos.map((plano) => {
                  const isDegustacao = plano.preco === 0 || plano.id.includes('degustacao') || plano.nome.toLowerCase().includes('degustação') || plano.nome.toLowerCase().includes('degustacao');

                  return (
                    <div
                      key={plano.id}
                      className={`rounded-3xl p-6 border-2 transition-all flex flex-col justify-between relative shadow-xs ${
                        isDegustacao 
                          ? 'bg-gradient-to-b from-emerald-50/90 to-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' 
                          : 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                      }`}
                    >
                      {isDegustacao && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                          <span>30 Dias Grátis &bull; Teste sem Cartão</span>
                        </div>
                      )}

                      <div>
                        <div className="mt-2 mb-2">
                          <h3 className="font-black text-xl text-slate-900 leading-tight">{plano.nome}</h3>
                        </div>

                        <p className="text-slate-600 text-xs mb-5 min-h-[2.5rem] leading-relaxed">{plano.descricao}</p>

                        <div className="mb-6 pb-4 border-b border-slate-200/60">
                          {plano.preco === 0 ? (
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-emerald-600">GRÁTIS</span>
                              <span className="text-slate-500 text-xs font-semibold">/ 30 dias</span>
                            </div>
                          ) : (
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-slate-900">
                                R$ {plano.preco.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-slate-500 text-xs font-medium">/mês</span>
                            </div>
                          )}
                        </div>

                        <ul className="space-y-2.5 mb-6">
                          {plano.recursos.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => navigate(`/cadastro-restaurante?plano=${plano.id}`)}
                        className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer ${
                          isDegustacao
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 shadow-md'
                            : 'bg-slate-900 hover:bg-emerald-600'
                        }`}
                      >
                        {isDegustacao ? 'Testar 30 Dias Grátis' : `Contratar ${plano.nome}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-lg">Menu<span className="text-emerald-500">Pro</span></span>
            <span>&bull; Todos os direitos reservados.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link to="/login" className="hover:text-white transition-colors">Acesso Administrativo</Link>
            <Link to="/cadastro-restaurante" className="hover:text-white transition-colors">Cadastrar Restaurante</Link>
            <Link to="/politica-de-privacidade" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">Política de Privacidade (LGPD)</Link>
            <Link to="/termos-de-uso" className="hover:text-white transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
