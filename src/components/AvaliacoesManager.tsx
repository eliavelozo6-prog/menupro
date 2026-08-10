import React, { useState, useEffect } from 'react';
import { Avaliacao, Restaurante } from '../types';
import { buscarAvaliacoesRestaurante, alternarExibicaoAvaliacao } from '../services/database';
import { 
  Star, 
  MessageSquare, 
  Calendar, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Sparkles,
  Filter
} from 'lucide-react';

interface AvaliacoesManagerProps {
  restaurante: Restaurante | null;
}

export const AvaliacoesManager: React.FC<AvaliacoesManagerProps> = ({ restaurante }) => {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'exibidas' | 'ocultas'>('todas');
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      if (!restaurante?.id) return;
      setLoading(true);
      try {
        const lista = await buscarAvaliacoesRestaurante(restaurante.id);
        setAvaliacoes(lista);
      } catch (err) {
        console.error('Erro ao carregar avaliações:', err);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [restaurante?.id]);

  const handleToggleExibicao = async (id: string, estadoAtual?: boolean) => {
    const novoEstado = !estadoAtual;
    setProcessandoId(id);
    try {
      await alternarExibicaoAvaliacao(id, novoEstado);
      setAvaliacoes(prev => prev.map(a => a.id === id ? { ...a, exibirNoCardapio: novoEstado } : a));
    } catch (err) {
      console.error('Erro ao alternar exibição da avaliação:', err);
      alert('Erro ao atualizar exibição do comentário.');
    } finally {
      setProcessandoId(null);
    }
  };

  const total = avaliacoes.length;
  const exibidasQtd = avaliacoes.filter(a => a.exibirNoCardapio).length;
  const ocultasQtd = total - exibidasQtd;

  const mediaGeral = total > 0
    ? (avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / total).toFixed(1)
    : '5.0';

  const avaliacoesFiltradas = avaliacoes.filter(a => {
    if (filtro === 'exibidas') return a.exibirNoCardapio === true;
    if (filtro === 'ocultas') return !a.exibirNoCardapio;
    return true;
  });

  // Distribution
  const dist = [5, 4, 3, 2, 1].map(n => ({
    nota: n,
    qtd: avaliacoes.filter(a => a.nota === n).length,
    pct: total > 0 ? (avaliacoes.filter(a => a.nota === n).length / total) * 100 : 0
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Avaliações e Feedback dos Clientes</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Selecione quais comentários dos clientes serão exibidos no seu cardápio público
          </p>
        </div>
      </div>

      {/* Informativo Seleção Manual */}
      <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <p className="font-extrabold uppercase tracking-wide">
            📌 Seleção Manual de Comentários no Cardápio
          </p>
          <p className="text-amber-900 leading-relaxed font-medium">
            Por padrão, os comentários recebidos <strong>não aparecem automaticamente</strong> no cardápio público. 
            Você tem total controle: clique no botão de cada avaliação para <strong className="text-emerald-800">exibir</strong> ou <strong className="text-slate-800">ocultar</strong> no cardápio do seu restaurante.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-slate-400">Carregando avaliações dos clientes...</div>
      ) : (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            {/* Media Box */}
            <div className="flex flex-col items-center justify-center text-center p-3 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-1">
                <span>{mediaGeral}</span>
                <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
              </div>
              <p className="text-xs font-bold text-slate-600 mt-1">Nota Média Geral</p>
              <span className="text-[11px] text-slate-500 font-medium">{total} avaliação(ões) no total</span>
              <span className="text-[11px] text-emerald-700 font-bold mt-0.5">
                {exibidasQtd} exibida(s) no cardápio
              </span>
            </div>

            {/* Distribution */}
            <div className="md:col-span-2 space-y-1.5 justify-center flex flex-col px-2">
              {dist.map(d => (
                <div key={d.nota} className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 w-12 text-slate-700 font-bold shrink-0">
                    <span>{d.nota}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-[11px] text-slate-500">{d.qtd}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filtros de Lista */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Gerenciar Comentários</span>
            </h3>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFiltro('todas')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtro === 'todas' ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todas ({total})
              </button>
              <button
                type="button"
                onClick={() => setFiltro('exibidas')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtro === 'exibidas' ? 'bg-emerald-600 text-white shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Exibidas ({exibidasQtd})
              </button>
              <button
                type="button"
                onClick={() => setFiltro('ocultas')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtro === 'ocultas' ? 'bg-slate-700 text-white shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Ocultas ({ocultasQtd})
              </button>
            </div>
          </div>

          {/* Reviews List */}
          {avaliacoesFiltradas.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">
                {filtro === 'exibidas' 
                  ? 'Nenhum comentário selecionado para o cardápio público' 
                  : filtro === 'ocultas' 
                  ? 'Nenhum comentário oculto' 
                  : 'Nenhuma avaliação recebida ainda'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {filtro === 'exibidas' 
                  ? 'Alterne para "Todas" e escolha quais comentários deseja publicar no cardápio digital!' 
                  : 'Quando os clientes finalizarem os pedidos, as avaliações e opiniões aparecerão nesta lista.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3.5">
              {avaliacoesFiltradas.map((a) => {
                const estaExibida = Boolean(a.exibirNoCardapio);
                const emProgresso = processandoId === a.id;

                return (
                  <div 
                    key={a.id} 
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      estaExibida 
                        ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs' 
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200">
                          {a.clienteNome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">{a.clienteNome}</span>
                          <span className="text-[10px] text-slate-400">
                            Pedido #{a.pedidoId ? a.pedidoId.substring(0, 8) : 'Direto'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-black text-amber-900">
                          <span>{a.nota}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </div>

                        {/* Toggle Exibição no Cardápio */}
                        <button
                          type="button"
                          disabled={emProgresso}
                          onClick={() => handleToggleExibicao(a.id, a.exibirNoCardapio)}
                          className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border ${
                            estaExibida
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          {estaExibida ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Exibido no Cardápio</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                              <span>Oculto (Clique para Exibir)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {a.comentario ? (
                      <p className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200/80 italic font-medium leading-relaxed">
                        "{a.comentario}"
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        (Cliente deixou apenas a nota sem comentário escrito)
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(a.data).toLocaleDateString('pt-BR')} às {new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {estaExibida && (
                        <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Visible no menu público
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
