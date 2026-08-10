import React, { useState, useEffect } from 'react';
import { Cupom, Restaurante } from '../types';
import { 
  buscarCuponsRestaurante, 
  cadastrarCupom, 
  atualizarCupom, 
  excluirCupom 
} from '../services/database';
import { Button } from './Button';
import { Modal } from './Modal';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Edit3, 
  Percent, 
  DollarSign, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Power 
} from 'lucide-react';

interface CuponsManagerProps {
  restaurante: Restaurante | null;
}

export const CuponsManager: React.FC<CuponsManagerProps> = ({ restaurante }) => {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalAberto, setModalAberto] = useState(false);
  const [cupomEditando, setCupomEditando] = useState<Cupom | null>(null);

  // Form Fields
  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState<'porcentagem' | 'fixo'>('porcentagem');
  const [valor, setValor] = useState('');
  const [valorMinimo, setValorMinimo] = useState('');
  const [limiteUsos, setLimiteUsos] = useState('');
  const [validade, setValidade] = useState('');
  const [ativo, setAtivo] = useState(true);

  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Exclusão State
  const [cupomExcluir, setCupomExcluir] = useState<Cupom | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregarCupons = async () => {
    if (!restaurante?.id) return;
    setLoading(true);
    try {
      const lista = await buscarCuponsRestaurante(restaurante.id);
      setCupons(lista);
    } catch (err) {
      console.error('Erro ao carregar cupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCupons();
  }, [restaurante?.id]);

  const abrirModalNovo = () => {
    setCupomEditando(null);
    setCodigo('');
    setTipo('porcentagem');
    setValor('');
    setValorMinimo('');
    setLimiteUsos('');
    setValidade('');
    setAtivo(true);
    setErroForm('');
    setModalAberto(true);
  };

  const abrirModalEditar = (cupom: Cupom) => {
    setCupomEditando(cupom);
    setCodigo(cupom.codigo);
    setTipo(cupom.tipo);
    setValor(cupom.valor.toString());
    setValorMinimo(cupom.valorMinimo ? cupom.valorMinimo.toString() : '');
    setLimiteUsos(cupom.limiteUsos ? cupom.limiteUsos.toString() : '');
    setValidade(cupom.validade ? cupom.validade.split('T')[0] : '');
    setAtivo(cupom.ativo);
    setErroForm('');
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurante?.id) return;

    const codClean = codigo.trim().toUpperCase();
    if (!codClean) {
      setErroForm('Digite o código do cupom (ex: PRIMEIRACOMPRA10).');
      return;
    }

    const valNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valNum) || valNum <= 0) {
      setErroForm('Informe um valor de desconto válido e maior que zero.');
      return;
    }

    if (tipo === 'porcentagem' && valNum > 100) {
      setErroForm('Desconto em porcentagem não pode ser maior que 100%.');
      return;
    }

    setSalvando(true);
    setErroForm('');

    try {
      const vMin = valorMinimo ? parseFloat(valorMinimo.replace(',', '.')) : undefined;
      const lUsos = limiteUsos ? parseInt(limiteUsos, 10) : undefined;
      const valISO = validade ? new Date(`${validade}T23:59:59`).toISOString() : undefined;

      if (cupomEditando) {
        await atualizarCupom(cupomEditando.id, {
          codigo: codClean,
          tipo,
          valor: valNum,
          valorMinimo: vMin,
          limiteUsos: lUsos,
          validade: valISO,
          ativo
        });
      } else {
        await cadastrarCupom({
          restauranteId: restaurante.id,
          codigo: codClean,
          tipo,
          valor: valNum,
          valorMinimo: vMin,
          limiteUsos: lUsos,
          validade: valISO,
          ativo
        });
      }

      setModalAberto(false);
      await carregarCupons();
    } catch (err: any) {
      console.error('Erro ao salvar cupom:', err);
      setErroForm('Erro ao salvar cupom: ' + (err.message || 'Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleAtivo = async (cupom: Cupom) => {
    try {
      await atualizarCupom(cupom.id, { ativo: !cupom.ativo });
      setCupons(prev => prev.map(c => c.id === cupom.id ? { ...c, ativo: !c.ativo } : c));
    } catch (err) {
      console.error('Erro ao alternar status do cupom:', err);
    }
  };

  const confirmarExclusao = async () => {
    if (!cupomExcluir) return;
    setExcluindo(true);
    try {
      await excluirCupom(cupomExcluir.id);
      setCupons(prev => prev.filter(c => c.id !== cupomExcluir.id));
      setCupomExcluir(null);
    } catch (err) {
      console.error('Erro ao excluir cupom:', err);
    } finally {
      setExcluindo(false);
    }
  };

  const copiarCodigo = (c: Cupom) => {
    navigator.clipboard.writeText(c.codigo);
    setCopiadoId(c.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const precoFormatado = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Cupons de Desconto & Promoções</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Crie códigos promocionais (ex: FRETEGRATIS, PRIMEIRACOMPRA) com limite de usos e regras de valor mínimo
          </p>
        </div>

        <Button onClick={abrirModalNovo} className="flex items-center justify-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>Novo Cupom</span>
        </Button>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="text-center py-8 text-xs text-slate-400">Carregando cupons promocionais...</div>
      ) : cupons.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="font-bold text-slate-700 text-sm">Nenhum cupom cadastrado</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Crie seu primeiro cupom promocional para incentivar os clientes a fazerem pedidos pelo cardápio digital.
            </p>
          </div>
          <Button onClick={abrirModalNovo} variant="outline" className="text-xs">
            + Cadastrar Cupom Exemplo
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cupons.map((c) => {
            const expirado = c.validade && new Date(c.validade) < new Date();
            const esgotado = c.limiteUsos && c.usosAtuais >= c.limiteUsos;
            const inativo = !c.ativo || expirado || esgotado;

            return (
              <div
                key={c.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                  inativo
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                }`}
              >
                {/* Header Ticket Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copiarCodigo(c)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-black font-mono tracking-wider flex items-center gap-1 cursor-pointer"
                      title="Clique para copiar"
                    >
                      <span>{c.codigo}</span>
                      {copiadoId === c.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-amber-600" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleAtivo(c)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 cursor-pointer transition-colors ${
                      c.ativo && !expirado && !esgotado
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{c.ativo ? (expirado ? 'Expirado' : esgotado ? 'Esgotado' : 'Ativo') : 'Inativo'}</span>
                  </button>
                </div>

                {/* Discount Value */}
                <div>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {c.tipo === 'porcentagem' ? `${c.valor}% OFF` : `${precoFormatado(c.valor)} OFF`}
                  </span>
                  {c.valorMinimo && c.valorMinimo > 0 && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Pedido mín: {precoFormatado(c.valorMinimo)}
                    </p>
                  )}
                </div>

                {/* Stats / Info */}
                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Usos:
                    </span>
                    <span className="font-bold text-slate-800">
                      {c.usosAtuais} {c.limiteUsos ? `/ ${c.limiteUsos}` : 'usos'}
                    </span>
                  </div>

                  {c.validade && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Validade:
                      </span>
                      <span className={`font-bold ${expirado ? 'text-rose-600' : 'text-slate-800'}`}>
                        {new Date(c.validade).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 pt-1">
                  <button
                    onClick={() => abrirModalEditar(c)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Editar Cupom"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCupomExcluir(c)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Cupom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cadastro / Edição de Cupom */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={cupomEditando ? 'Editar Cupom Promocional' : 'Novo Cupom de Desconto'}
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
              Código do Cupom * (caixa alta)
            </label>
            <input
              type="text"
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ex: BENVINDO10, FRETEGRATIS, SEXTAOFF"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Desconto</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as 'porcentagem' | 'fixo')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="porcentagem">Porcentagem (%)</option>
                <option value="fixo">Valor Fixo (R$)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Valor do Desconto *
              </label>
              <input
                type="text"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={tipo === 'porcentagem' ? 'Ex: 10 (%)' : 'Ex: 15.00 (R$)'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Pedido Mínimo (R$)
              </label>
              <input
                type="text"
                value={valorMinimo}
                onChange={(e) => setValorMinimo(e.target.value)}
                placeholder="Ex: 50.00 (Opcional)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Limite de Usos Totais
              </label>
              <input
                type="number"
                min="1"
                value={limiteUsos}
                onChange={(e) => setLimiteUsos(e.target.value)}
                placeholder="Ex: 50 (Opcional)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Data de Validade (Opcional)
            </label>
            <input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="cupomAtivo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
            />
            <label htmlFor="cupomAtivo" className="text-xs font-bold text-slate-800 cursor-pointer">
              Cupom Ativo e disponível para uso no cardápio
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setModalAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={salvando}>
              Salvar Cupom
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmação de Exclusão */}
      <Modal
        isOpen={!!cupomExcluir}
        onClose={() => setCupomExcluir(null)}
        title="Excluir Cupom Promocional"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Tem certeza que deseja excluir o cupom <strong className="text-slate-900">{cupomExcluir?.codigo}</strong>?
            Esta ação removerá o código do seu cardápio.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCupomExcluir(null)} disabled={excluindo}>
              Cancelar
            </Button>
            <Button variant="danger" isLoading={excluindo} onClick={confirmarExclusao}>
              Excluir Cupom
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
