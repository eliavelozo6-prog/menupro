import React, { useEffect, useState } from 'react';
import { Pedido, Restaurante, Usuario } from '../types';
import { listarPedidosRestaurante } from '../services/database';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  Award, 
  Calendar,
  Clock,
  Download,
  Printer,
  Filter,
  Flame,
  PieChart as PieIcon,
  Bike
} from 'lucide-react';
import { Button } from '../components/Button';

interface FinanceiroProps {
  usuario: Usuario | null;
  restaurante: Restaurante | null;
}

export const Financeiro: React.FC<FinanceiroProps> = ({ restaurante }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos');

  useEffect(() => {
    async function carregar() {
      if (!restaurante?.id) return;
      try {
        const lista = await listarPedidosRestaurante(restaurante.id);
        setPedidos(lista);
      } catch (err) {
        console.error('Erro ao carregar dados financeiros:', err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [restaurante]);

  // Apenas pedidos válidos (não cancelados)
  const pedidosValidos = pedidos.filter(p => p.status !== 'Cancelado');

  // Filtragem por Período
  const pedidosFiltrados = pedidosValidos.filter(p => {
    const dataP = new Date(p.data);
    const agora = new Date();
    if (filtroPeriodo === 'hoje') {
      return dataP.toDateString() === agora.toDateString();
    } else if (filtroPeriodo === 'semana') {
      const seteDiasAtras = new Date(agora);
      seteDiasAtras.setDate(agora.getDate() - 7);
      return dataP >= seteDiasAtras;
    } else if (filtroPeriodo === 'mes') {
      return dataP.getMonth() === agora.getMonth() && dataP.getFullYear() === agora.getFullYear();
    }
    return true;
  });

  // Métricas Principais do Período
  const faturamentoTotal = pedidosFiltrados.reduce((sum, p) => sum + p.valorTotal, 0);
  const totalPedidos = pedidosFiltrados.length;
  const ticketMedio = totalPedidos > 0 ? faturamentoTotal / totalPedidos : 0;

  // Cálculo de Horário de Pico
  const contagemHoras: Record<number, number> = {};
  pedidosFiltrados.forEach(p => {
    const hora = new Date(p.data).getHours();
    contagemHoras[hora] = (contagemHoras[hora] || 0) + 1;
  });
  let horaPico = -1;
  let maxPedidosPico = 0;
  Object.entries(contagemHoras).forEach(([horaStr, count]) => {
    const horaNum = parseInt(horaStr, 10);
    if (count > maxPedidosPico) {
      maxPedidosPico = count;
      horaPico = horaNum;
    }
  });
  const textoHorarioPico = horaPico !== -1 
    ? `${horaPico}h - ${horaPico + 1}h (${maxPedidosPico} ${maxPedidosPico === 1 ? 'pedido' : 'pedidos'})`
    : 'Sem dados suficientes';

  // Vendas por Forma de Pagamento
  const formasPagamentoMap: Record<string, number> = {};
  pedidosFiltrados.forEach(p => {
    const forma = p.formaPagamento || 'Outros';
    formasPagamentoMap[forma] = (formasPagamentoMap[forma] || 0) + p.valorTotal;
  });

  // Vendas por Tipo de Entrega (Delivery vs Balcão vs Mesa)
  const tiposEntregaMap: Record<string, { total: number; count: number }> = {};
  pedidosFiltrados.forEach(p => {
    const tipo = p.tipoEntrega === 'entrega' ? 'Delivery (Entrega)' : p.tipoEntrega === 'mesa' ? 'Consumo na Mesa' : 'Retirada Balcão';
    if (!tiposEntregaMap[tipo]) {
      tiposEntregaMap[tipo] = { total: 0, count: 0 };
    }
    tiposEntregaMap[tipo].total += p.valorTotal;
    tiposEntregaMap[tipo].count += 1;
  });

  // Ranking de Pratos e Bebidas Mais Vendidos
  const rankingProdutosMap: Record<string, { nome: string; quantidade: number; faturamento: number }> = {};
  pedidosFiltrados.forEach(p => {
    p.produtos.forEach(prod => {
      if (!rankingProdutosMap[prod.nome]) {
        rankingProdutosMap[prod.nome] = { nome: prod.nome, quantidade: 0, faturamento: 0 };
      }
      rankingProdutosMap[prod.nome].quantidade += prod.quantidade;
      rankingProdutosMap[prod.nome].faturamento += (prod.preco * prod.quantidade);
    });
  });
  const listaMaisVendidos = Object.values(rankingProdutosMap).sort((a, b) => b.quantidade - a.quantidade);

  // Exportar Excel/CSV
  const handleExportarCSV = () => {
    let csv = 'ID Pedido;Data/Hora;Cliente;Telefone;Tipo Entrega;Forma Pagamento;Valor Total (R$)\n';
    pedidosFiltrados.forEach(p => {
      const dt = new Date(p.data).toLocaleString('pt-BR');
      csv += `"${p.id.slice(0, 8)}";"${dt}";"${p.clienteNome}";"${p.telefone}";"${p.tipoEntrega}";"${p.formaPagamento}";"${p.valorTotal.toFixed(2)}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Vendas_${restaurante?.nome || 'Restaurante'}_${filtroPeriodo}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Impressão / PDF
  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Export Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard de Vendas & Relatórios</h1>
          <p className="text-xs text-slate-500 mt-1">
            Análise consolidada de faturamento, ticket médio e itens campeões de vendas do {restaurante?.nome || 'seu restaurante'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleExportarCSV} variant="outline" className="text-xs gap-1.5 py-2.5">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel (CSV)</span>
          </Button>

          <Button onClick={handleImprimir} className="text-xs gap-1.5 py-2.5 shadow-md">
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </Button>
        </div>
      </div>

      {/* Bar de Filtro de Período */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Filtrar Período de Vendas:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['hoje', 'semana', 'mes', 'todos'] as const).map(p => {
            const rotulos = {
              hoje: '☀️ Hoje (Diário)',
              semana: '📅 Últimos 7 Dias',
              mes: '🗓️ Este Mês',
              todos: '🚀 Todo o Período'
            };
            const ativo = filtroPeriodo === p;
            return (
              <button
                key={p}
                onClick={() => setFiltroPeriodo(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  ativo 
                    ? 'bg-emerald-500 text-slate-950 shadow-sm scale-105' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {rotulos[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Faturamento Bruto</span>
            <span className="text-xl font-black text-slate-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoTotal)}
            </span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Ticket Médio</span>
            <span className="text-xl font-black text-slate-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio)}
            </span>
          </div>
        </div>

        {/* Total Pedidos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Pedidos Faturados</span>
            <span className="text-xl font-black text-slate-900">{totalPedidos}</span>
          </div>
        </div>

        {/* Horário de Pico */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Horário de Pico</span>
            <span className="text-sm font-black text-slate-900 block truncate">{textoHorarioPico}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Carregando dados financeiros do sistema...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-2">
          <TrendingUp className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Nenhum pedido encontrado no período selecionado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tente selecionar o período "Todo o Período" ou aguarde novos pedidos serem concluídos no cardápio.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda (2 Cols): Mais Vendidos + Transações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pratos e Bebidas Mais Vendidos (Ranking) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h3 className="font-bold text-slate-900 text-base">Pratos & Bebidas Mais Vendidos</h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">{listaMaisVendidos.length} itens vendidos</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                {listaMaisVendidos.slice(0, 10).map((prod, index) => {
                  const percent = faturamentoTotal > 0 ? (prod.faturamento / faturamentoTotal) * 100 : 0;
                  return (
                    <div key={index} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          index === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          index === 1 ? 'bg-slate-200 text-slate-800' :
                          index === 2 ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{index + 1}
                        </span>

                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs block truncate">{prod.nome}</span>
                          <span className="text-[11px] text-slate-500">
                            <strong>{prod.quantidade} unidades</strong> vendidas
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-emerald-700 text-xs block">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.faturamento)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">({percent.toFixed(1)}% das vendas)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Histórico Recente de Vendas */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-base">Últimas Vendas Registradas</h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">{pedidosFiltrados.length} pedidos</span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {pedidosFiltrados.slice(0, 15).map((pedido) => (
                  <div key={pedido.id} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{pedido.clienteNome}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-1.5 py-0.5 rounded-md">
                          #{pedido.id.slice(0, 6)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {new Date(pedido.data).toLocaleString('pt-BR')} &bull; {pedido.formaPagamento}
                      </span>
                    </div>

                    <span className="font-black text-emerald-700 text-sm shrink-0 ml-2">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valorTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna Direita (1 Col): Formas de Pagamento & Modalidades */}
          <div className="space-y-6">
            {/* Formas de Pagamento Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Formas de Pagamento</h3>
              </div>

              <div className="space-y-3">
                {Object.keys(formasPagamentoMap).length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum registro de pagamento.</p>
                ) : (
                  Object.entries(formasPagamentoMap).map(([forma, valor]) => {
                    const percentual = faturamentoTotal > 0 ? (valor / faturamentoTotal) * 100 : 0;
                    return (
                      <div key={forma} className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span className="font-bold capitalize text-slate-900">{forma}</span>
                          <span className="font-black text-emerald-700">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentual}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 block text-right font-semibold">
                          {percentual.toFixed(1)}% do faturamento
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modalidades de Pedido (Delivery vs Balcão vs Mesa) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-base">Canais de Atendimento</h3>
              </div>

              <div className="space-y-2.5">
                {Object.entries(tiposEntregaMap).map(([tipo, data]) => (
                  <div key={tipo} className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{tipo}</span>
                      <span className="text-[11px] text-sky-800 font-medium">{data.count} {data.count === 1 ? 'pedido' : 'pedidos'}</span>
                    </div>

                    <span className="font-black text-sky-950 text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
