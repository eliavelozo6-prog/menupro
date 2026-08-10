import React, { useState, useEffect } from 'react';
import { TaxaBairro, Restaurante } from '../types';
import { 
  buscarTaxasBairrosRestaurante, 
  cadastrarTaxaBairro, 
  atualizarTaxaBairro, 
  excluirTaxaBairro 
} from '../services/database';
import { Button } from './Button';
import { Modal } from './Modal';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  DollarSign, 
  Clock, 
  Power, 
  AlertCircle, 
  Bike 
} from 'lucide-react';

interface TaxasEntregaManagerProps {
  restaurante: Restaurante | null;
}

export const TaxasEntregaManager: React.FC<TaxasEntregaManagerProps> = ({ restaurante }) => {
  const [taxas, setTaxas] = useState<TaxaBairro[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalAberto, setModalAberto] = useState(false);
  const [taxaEditando, setTaxaEditando] = useState<TaxaBairro | null>(null);

  // Form
  const [nomeBairro, setNomeBairro] = useState('');
  const [valorTaxa, setValorTaxa] = useState('');
  const [tempoEstimado, setTempoEstimado] = useState('');
  const [ativo, setAtivo] = useState(true);

  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  // Exclusao
  const [taxaExcluir, setTaxaExcluir] = useState<TaxaBairro | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregarTaxas = async () => {
    if (!restaurante?.id) return;
    setLoading(true);
    try {
      const lista = await buscarTaxasBairrosRestaurante(restaurante.id);
      setTaxas(lista);
    } catch (err) {
      console.error('Erro ao carregar taxas de bairros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTaxas();
  }, [restaurante?.id]);

  const abrirModalNovo = () => {
    setTaxaEditando(null);
    setNomeBairro('');
    setValorTaxa('');
    setTempoEstimado('30 - 45 min');
    setAtivo(true);
    setErroForm('');
    setModalAberto(true);
  };

  const abrirModalEditar = (t: TaxaBairro) => {
    setTaxaEditando(t);
    setNomeBairro(t.nomeBairro);
    setValorTaxa(t.taxa.toString());
    setTempoEstimado(t.tempoEstimadoMinutos || '30 - 45 min');
    setAtivo(t.ativo);
    setErroForm('');
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurante?.id) return;

    const nomeClean = nomeBairro.trim();
    if (!nomeClean) {
      setErroForm('Informe o nome do bairro ou região.');
      return;
    }

    const taxaNum = parseFloat(valorTaxa.replace(',', '.'));
    if (isNaN(taxaNum) || taxaNum < 0) {
      setErroForm('Informe um valor de taxa válido (0 para entrega grátis).');
      return;
    }

    setSalvando(true);
    setErroForm('');

    try {
      if (taxaEditando) {
        await atualizarTaxaBairro(taxaEditando.id, {
          nomeBairro: nomeClean,
          taxa: taxaNum,
          tempoEstimadoMinutos: tempoEstimado.trim() || undefined,
          ativo
        });
      } else {
        await cadastrarTaxaBairro({
          restauranteId: restaurante.id,
          nomeBairro: nomeClean,
          taxa: taxaNum,
          tempoEstimadoMinutos: tempoEstimado.trim() || undefined,
          ativo
        });
      }

      setModalAberto(false);
      await carregarTaxas();
    } catch (err: any) {
      console.error('Erro ao salvar taxa:', err);
      setErroForm('Erro ao salvar taxa de entrega: ' + (err.message || 'Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleAtivo = async (t: TaxaBairro) => {
    try {
      await atualizarTaxaBairro(t.id, { ativo: !t.ativo });
      setTaxas(prev => prev.map(item => item.id === t.id ? { ...item, ativo: !item.ativo } : item));
    } catch (err) {
      console.error('Erro ao alternar status da taxa:', err);
    }
  };

  const confirmarExclusao = async () => {
    if (!taxaExcluir) return;
    setExcluindo(true);
    try {
      await excluirTaxaBairro(taxaExcluir.id);
      setTaxas(prev => prev.filter(t => t.id !== taxaExcluir.id));
      setTaxaExcluir(null);
    } catch (err) {
      console.error('Erro ao excluir taxa:', err);
    } finally {
      setExcluindo(false);
    }
  };

  const precoFormatado = (v: number) =>
    v === 0 ? 'Grátis' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Bike className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Taxas de Entrega por Bairro / Região</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre o valor do frete e o tempo estimado de entrega para cada bairro ou raio de atendimento
          </p>
        </div>

        <Button onClick={abrirModalNovo} className="flex items-center justify-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>Novo Bairro</span>
        </Button>
      </div>

      {/* Grid of Neighborhood Fees */}
      {loading ? (
        <div className="text-center py-8 text-xs text-slate-400">Carregando taxas de bairros...</div>
      ) : taxas.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="font-bold text-slate-700 text-sm">Nenhuma taxa de bairro cadastrada</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Cadastre bairros com taxas personalizadas para que seus clientes saibam exatamente o valor da entrega ao informar o endereço.
            </p>
          </div>
          <Button onClick={abrirModalNovo} variant="outline" className="text-xs">
            + Cadastrar Bairro Exemplo
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {taxas.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-2xl border transition-all space-y-3 relative ${
                !t.ativo
                  ? 'bg-slate-50 border-slate-200 opacity-70'
                  : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                  <h4 className="font-bold text-slate-900 text-sm tracking-tight">{t.nomeBairro}</h4>
                </div>

                <button
                  onClick={() => handleToggleAtivo(t)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 cursor-pointer transition-colors ${
                    t.ativo
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{t.ativo ? 'Ativo' : 'Inativo'}</span>
                </button>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xl font-black text-slate-900">
                  {precoFormatado(t.taxa)}
                </span>
                {t.tempoEstimadoMinutos && (
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {t.tempoEstimadoMinutos}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                <button
                  onClick={() => abrirModalEditar(t)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Editar Bairro"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTaxaExcluir(t)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Excluir Bairro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro / Edição */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={taxaEditando ? 'Editar Bairro / Região' : 'Cadastrar Bairro e Taxa de Entrega'}
      >
        <form onSubmit={handleSalvar} className="space-y-4">
          {erroForm && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erroForm}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nome do Bairro ou Região *
            </label>
            <input
              type="text"
              required
              value={nomeBairro}
              onChange={(e) => setNomeBairro(e.target.value)}
              placeholder="Ex: Centro, Jardim América, Zona Norte, Até 5km"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Taxa de Delivery (R$) *
              </label>
              <input
                type="text"
                required
                value={valorTaxa}
                onChange={(e) => setValorTaxa(e.target.value)}
                placeholder="Ex: 8.00 (0 para grátis)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tempo Estimado
              </label>
              <input
                type="text"
                value={tempoEstimado}
                onChange={(e) => setTempoEstimado(e.target.value)}
                placeholder="Ex: 30 - 45 min"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="taxaAtiva"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
            />
            <label htmlFor="taxaAtiva" className="text-xs font-bold text-slate-800 cursor-pointer">
              Bairro Ativo e disponível para seleção no checkout
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setModalAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={salvando}>
              Salvar Taxa
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmação de Exclusão */}
      <Modal
        isOpen={!!taxaExcluir}
        onClose={() => setTaxaExcluir(null)}
        title="Excluir Taxa de Bairro"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Tem certeza que deseja excluir a taxa do bairro <strong className="text-slate-900">{taxaExcluir?.nomeBairro}</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setTaxaExcluir(null)} disabled={excluindo}>
              Cancelar
            </Button>
            <Button variant="danger" isLoading={excluindo} onClick={confirmarExclusao}>
              Excluir Taxa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
