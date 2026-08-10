import React, { useEffect, useState } from 'react';
import { Cliente, Restaurante, Usuario } from '../types';
import { listarClientesRestaurante } from '../services/database';
import { Users, Phone, MapPin, ShoppingBag, DollarSign, Search, MessageCircle } from 'lucide-react';

interface ClientesProps {
  usuario: Usuario | null;
  restaurante: Restaurante | null;
}

export const Clientes: React.FC<ClientesProps> = ({ restaurante }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    async function carregarClientes() {
      if (!restaurante?.id) return;
      try {
        const lista = await listarClientesRestaurante(restaurante.id);
        setClientes(lista);
      } catch (err) {
        console.error('Erro ao carregar clientes:', err);
      } finally {
        setLoading(false);
      }
    }
    carregarClientes();
  }, [restaurante]);

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) || 
    c.telefone.includes(busca)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Base de Clientes Reais</h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
              LGPD Ok
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Histórico completo de clientes salvos conforme a LGPD (Lei 13.709/2018) com autorização para entrega.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando clientes...</div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg mb-1">Nenhum dado encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ainda não há registros de clientes para este restaurante no banco de dados. Os dados dos clientes são gerados automaticamente a partir dos primeiros pedidos recebidos.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente) => {
            const whatsappPhone = cliente.telefone.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/55${whatsappPhone}?text=${encodeURIComponent(`Olá ${cliente.nome}, agradecemos a sua preferência no ${restaurante?.nome || 'MenuPro'}!`)}`;

            return (
              <div key={cliente.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{cliente.nome}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cliente.telefone}</span>
                      </div>
                    </div>

                    {whatsappPhone && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                        title="Enviar mensagem no WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 fill-emerald-600" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{cliente.endereco || 'Endereço não informado'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total de Pedidos</span>
                    <span className="text-sm font-black text-slate-900">{cliente.totalPedidos || 1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Gasto</span>
                    <span className="text-sm font-black text-emerald-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.totalGasto || 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
