import React, { useEffect, useState } from 'react';
import { Produto, Restaurante, Usuario, GrupoVariacao, VariacaoOpcao, Plano } from '../types';
import { 
  listarProdutosRestaurante, 
  cadastrarProduto, 
  atualizarProduto, 
  excluirProduto, 
  alternarDisponibilidadeProduto,
  listarPlanos
} from '../services/database';
import { ProductCard } from '../components/ProductCard';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { CloudinaryUpload } from '../components/CloudinaryUpload';
import { Plus, Search, Utensils, AlertCircle, Trash2, Layers } from 'lucide-react';

interface ProdutosProps {
  usuario: Usuario | null;
  restaurante: Restaurante | null;
}

export const Produtos: React.FC<ProdutosProps> = ({ restaurante }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');

  // Modal State
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  // Exclusão State
  const [produtoExcluir, setProdutoExcluir] = useState<Produto | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState('');

  // Form Fields
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [preco, setPreco] = useState('');
  const [imagem, setImagem] = useState('');
  const [disponivel, setDisponivel] = useState(true);
  const [maisVendido, setMaisVendido] = useState(false);
  const [variacoes, setVariacoes] = useState<GrupoVariacao[]>([]);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [limiteProdutosPlano, setLimiteProdutosPlano] = useState<number>(100);

  const carregarProdutos = async () => {
    if (!restaurante?.id) return;
    setLoading(true);
    try {
      const [lista, planos] = await Promise.all([
        listarProdutosRestaurante(restaurante.id),
        listarPlanos()
      ]);
      setProdutos(lista);

      // Determinar limite do plano do restaurante
      if (restaurante.planoId) {
        const pEncontrado = planos.find(p => p.id === restaurante.planoId);
        if (pEncontrado) {
          setLimiteProdutosPlano(pEncontrado.limiteProdutos);
        } else if (restaurante.plano) {
          const pPorNome = planos.find(p => p.nome.toLowerCase() === restaurante.plano?.toLowerCase());
          if (pPorNome) setLimiteProdutosPlano(pPorNome.limiteProdutos);
        }
      } else if (restaurante.plano) {
        const pPorNome = planos.find(p => p.nome.toLowerCase() === restaurante.plano?.toLowerCase());
        if (pPorNome) setLimiteProdutosPlano(pPorNome.limiteProdutos);
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, [restaurante]);

  const abrirModalCriar = () => {
    if (produtos.length >= limiteProdutosPlano) {
      alert(`Você atingiu o limite máximo de ${limiteProdutosPlano} produtos cadastrados no seu plano (${restaurante?.plano || 'atual'}). Para cadastrar mais produtos, altere seu plano nas Configurações.`);
      return;
    }

    setProdutoEditando(null);
    setNome('');
    setDescricao('');
    setCategoria('Lanches');
    setPreco('');
    setImagem('');
    setDisponivel(true);
    setMaisVendido(false);
    setVariacoes([]);
    setErro('');
    setModalAberto(true);
  };

  const abrirModalEditar = (prod: Produto) => {
    setProdutoEditando(prod);
    setNome(prod.nome);
    setDescricao(prod.descricao || '');
    setCategoria(prod.categoria);
    setPreco(prod.preco.toString());
    setImagem(prod.imagem || '');
    setDisponivel(prod.disponivel);
    setMaisVendido(Boolean(prod.maisVendido || prod.destaque || prod.badge === 'mais_vendido'));
    setVariacoes(prod.variacoes ? JSON.parse(JSON.stringify(prod.variacoes)) : []);
    setErro('');
    setModalAberto(true);
  };

  // Funções para gerenciar Variações / Opcionais / Sabores
  const adicionarGrupoVariacao = () => {
    const novoGrupo: GrupoVariacao = {
      id: `grupo-${Date.now()}`,
      titulo: 'Escolha o Sabor',
      obrigatorio: true,
      minimo: 1,
      maximo: 1,
      opcoes: [
        { id: `opt-${Date.now()}-1`, nome: 'Queijo', precoAdicional: 0 },
        { id: `opt-${Date.now()}-2`, nome: 'Carne', precoAdicional: 0 }
      ]
    };
    setVariacoes(prev => [...prev, novoGrupo]);
  };

  const removerGrupoVariacao = (grupoId: string) => {
    setVariacoes(prev => prev.filter(g => g.id !== grupoId));
  };

  const atualizarGrupoVariacao = (grupoId: string, campos: Partial<GrupoVariacao>) => {
    setVariacoes(prev => prev.map(g => g.id === grupoId ? { ...g, ...campos } : g));
  };

  const adicionarOpcao = (grupoId: string) => {
    setVariacoes(prev => prev.map(g => {
      if (g.id !== grupoId) return g;
      const novaOpt: VariacaoOpcao = {
        id: `opt-${Date.now()}`,
        nome: '',
        precoAdicional: 0
      };
      return { ...g, opcoes: [...g.opcoes, novaOpt] };
    }));
  };

  const removerOpcao = (grupoId: string, opcaoId: string) => {
    setVariacoes(prev => prev.map(g => {
      if (g.id !== grupoId) return g;
      return { ...g, opcoes: g.opcoes.filter(o => o.id !== opcaoId) };
    }));
  };

  const atualizarOpcao = (grupoId: string, opcaoId: string, campos: Partial<VariacaoOpcao>) => {
    setVariacoes(prev => prev.map(g => {
      if (g.id !== grupoId) return g;
      return {
        ...g,
        opcoes: g.opcoes.map(o => o.id === opcaoId ? { ...o, ...campos } : o)
      };
    }));
  };

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurante?.id) {
      setErro('Restaurante não identificado.');
      return;
    }
    if (!nome || !categoria || !preco) {
      setErro('Preencha os campos obrigatórios: Nome, Categoria e Preço.');
      return;
    }

    const precoNum = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) {
      setErro('Insira um preço válido.');
      return;
    }

    setSalvando(true);
    setErro('');

    try {
      if (produtoEditando) {
        await atualizarProduto(produtoEditando.id, {
          nome,
          descricao,
          categoria,
          preco: precoNum,
          imagem,
          disponivel,
          maisVendido,
          destaque: maisVendido,
          badge: maisVendido ? 'mais_vendido' : undefined,
          variacoes
        });
      } else {
        await cadastrarProduto({
          restauranteId: restaurante.id,
          nome,
          descricao,
          categoria,
          preco: precoNum,
          imagem,
          disponivel,
          maisVendido,
          destaque: maisVendido,
          badge: maisVendido ? 'mais_vendido' : undefined,
          variacoes
        });
      }

      setModalAberto(false);
      await carregarProdutos();
    } catch (err: any) {
      console.error('Erro ao salvar produto:', err);
      setErro('Erro ao salvar: ' + (err.message || 'Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = (id: string) => {
    const prod = produtos.find(p => p.id === id);
    if (prod) {
      setProdutoExcluir(prod);
      setErroExcluir('');
    }
  };

  const confirmarExclusao = async () => {
    if (!produtoExcluir) return;
    setExcluindo(true);
    setErroExcluir('');
    try {
      await excluirProduto(produtoExcluir.id);
      setProdutos(prev => prev.filter(p => p.id !== produtoExcluir.id));
      setProdutoExcluir(null);
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      setErroExcluir('Erro ao excluir produto: ' + (err.message || 'Tente novamente.'));
    } finally {
      setExcluindo(false);
    }
  };

  const handleAlternarDisponibilidade = async (id: string, disp: boolean) => {
    try {
      await alternarDisponibilidadeProduto(id, disp);
      setProdutos(prev => prev.map(p => p.id === id ? { ...p, disponivel: disp } : p));
    } catch (err) {
      console.error('Erro ao alternar disponibilidade:', err);
    }
  };

  // Categorias únicas existentes
  const categoriasExistentes = ['Todas', ...Array.from(new Set(produtos.map(p => p.categoria)))];

  // Filtro de produtos
  const produtosFiltrados = produtos.filter(p => {
    const combinaBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || 
                          (p.descricao && p.descricao.toLowerCase().includes(busca.toLowerCase()));
    const combinaCat = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
    return combinaBusca && combinaCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Title & Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gerenciamento de Produtos</h1>
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {produtos.length} / {limiteProdutosPlano >= 9999 ? '∞' : limiteProdutosPlano} itens ({restaurante?.plano || 'Plano Atual'})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Cadastre e edite pratos, bebidas e itens do cardápio digital</p>
        </div>

        <Button onClick={abrirModalCriar} icon={<Plus className="w-4 h-4" />}>
          Cadastrar Novo Produto
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto por nome ou ingrediente..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          {categoriasExistentes.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Product Grid or Empty State */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando produtos...</div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg mb-1">Nenhum dado encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Não foram encontrados produtos cadastrados para este filtro.
          </p>
          <Button onClick={abrirModalCriar} icon={<Plus className="w-4 h-4" />}>
            Cadastrar Primeiro Produto
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {produtosFiltrados.map((prod) => (
            <ProductCard
              key={prod.id}
              produto={prod}
              onEdit={abrirModalEditar}
              onDelete={handleExcluir}
              onToggleStatus={handleAlternarDisponibilidade}
            />
          ))}
        </div>
      )}

      {/* Modal Modal Form */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={produtoEditando ? 'Editar Produto' : 'Cadastrar Produto'}
      >
        <form onSubmit={handleSalvarProduto} className="space-y-4">
          {erro && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Produto *</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: X-Salada Especial com Fritas"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria *</label>
              <input
                type="text"
                required
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex: Lanches, Bebidas, Sobremesas"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preço (R$) *</label>
              <input
                type="text"
                required
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="29.90"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição do Produto</label>
            <textarea
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ingredientes, modo de preparo ou detalhes do prato..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
            />
          </div>

          {/* Destaque / Mais Vendido Switch */}
          <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                🔥
              </div>
              <div>
                <label className="text-xs font-black text-amber-950 uppercase tracking-wide block">
                  Destacar como "Mais Vendido"
                </label>
                <p className="text-[11px] text-amber-800 font-medium">
                  Exibe o selo <span className="font-bold">🔥 Mais Vendido</span> no cardápio e adiciona este produto à seção de destaques.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={maisVendido}
                onChange={(e) => setMaisVendido(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Variações / Sabores / Opcionais */}
          <div className="border-t border-slate-200 pt-4 mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Variações, Sabores e Opcionais (Opcional)</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Ideal para pastéis (sabores), lanches (adicionais) ou pizzas (tamanhos/sabores) sem criar anúncios separados.
                </p>
              </div>

              <button
                type="button"
                onClick={adicionarGrupoVariacao}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Grupo</span>
              </button>
            </div>

            {variacoes.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 p-3.5 rounded-xl text-center text-xs text-slate-500">
                Nenhum grupo de variação cadastrado. Se este produto tiver opções como "Sabores de Pastel" ou "Borda Recheada", clique no botão acima.
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {variacoes.map((grupo, gIdx) => (
                  <div key={grupo.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                          Título do Grupo #{gIdx + 1}
                        </label>
                        <input
                          type="text"
                          value={grupo.titulo}
                          onChange={(e) => atualizarGrupoVariacao(grupo.id, { titulo: e.target.value })}
                          placeholder="Ex: Escolha o Sabor, Adicionais, Tamanho"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={grupo.obrigatorio ?? true}
                            onChange={(e) => atualizarGrupoVariacao(grupo.id, { obrigatorio: e.target.checked, minimo: e.target.checked ? 1 : 0 })}
                            className="w-3.5 h-3.5 text-emerald-600 rounded-sm"
                          />
                          <span>Obrigatório?</span>
                        </label>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Máx Escolhas</label>
                          <select
                            value={grupo.maximo || 1}
                            onChange={(e) => atualizarGrupoVariacao(grupo.id, { maximo: parseInt(e.target.value) })}
                            className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2 py-1 outline-none"
                          >
                            <option value={1}>Apenas 1 opção</option>
                            <option value={2}>Até 2 opções</option>
                            <option value={3}>Até 3 opções</option>
                            <option value={5}>Até 5 opções</option>
                            <option value={10}>Até 10 opções</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => removerGrupoVariacao(grupo.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir grupo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Opções do Grupo */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Opções / Sabores deste Grupo
                      </span>

                      {grupo.opcoes.map((opcao) => (
                        <div key={opcao.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opcao.nome}
                            onChange={(e) => atualizarOpcao(grupo.id, opcao.id, { nome: e.target.value })}
                            placeholder="Ex: Queijo, Carne, Presunto..."
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                          />

                          <div className="w-28 flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                            <span className="text-[11px] font-bold text-slate-400">+R$</span>
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              value={opcao.precoAdicional ?? 0}
                              onChange={(e) => atualizarOpcao(grupo.id, opcao.id, { precoAdicional: parseFloat(e.target.value) || 0 })}
                              className="w-full text-xs font-bold text-slate-800 outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removerOpcao(grupo.id, opcao.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remover opção"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => adicionarOpcao(grupo.id)}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 mt-1 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar Opção / Sabor</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <CloudinaryUpload 
              imageUrl={imagem} 
              onImageChange={(url) => setImagem(url)} 
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="disponivel"
              checked={disponivel}
              onChange={(e) => setDisponivel(e.target.checked)}
              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded-sm border-slate-300"
            />
            <label htmlFor="disponivel" className="text-xs font-semibold text-slate-800">
              Produto disponível para vendas no cardápio
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={salvando}>
              {produtoEditando ? 'Atualizar Produto' : 'Cadastrar Produto'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={!!produtoExcluir}
        onClose={() => {
          if (!excluindo) {
            setProdutoExcluir(null);
            setErroExcluir('');
          }
        }}
        title="Excluir Produto"
      >
        <div className="space-y-4">
          {erroExcluir && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erroExcluir}</span>
            </div>
          )}

          <p className="text-sm text-slate-600 leading-relaxed">
            Tem certeza de que deseja excluir o produto <strong className="text-slate-900">{produtoExcluir?.nome}</strong> do seu cardápio? Esta ação não pode ser desfeita.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setProdutoExcluir(null);
                setErroExcluir('');
              }}
              disabled={excluindo}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={excluindo}
              onClick={confirmarExclusao}
            >
              Sim, Excluir Produto
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
