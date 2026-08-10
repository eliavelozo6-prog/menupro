import React from 'react';
import { Edit2, Trash2, CheckCircle2, XCircle, Utensils } from 'lucide-react';
import { Produto } from '../types';

interface ProductCardProps {
  produto: Produto;
  onEdit: (produto: Produto) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, disponivel: boolean) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  produto,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const precoFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(produto.preco);

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
      produto.disponivel ? 'border-slate-200 shadow-xs hover:shadow-md' : 'border-slate-200 bg-slate-50/70 opacity-75'
    }`}>
      <div>
        {/* Product Image or Placeholder */}
        <div className="relative h-44 bg-slate-100 overflow-hidden flex items-center justify-center">
          {produto.imagem ? (
            <img
              src={produto.imagem}
              alt={produto.nome}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Image fallback
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <Utensils className="w-10 h-10 mb-1 opacity-60" />
              <span className="text-xs">Sem Imagem</span>
            </div>
          )}

          {/* Category Tag */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {produto.categoria || 'Geral'}
            </span>
            {(produto.maisVendido || produto.destaque || produto.badge === 'mais_vendido') && (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs border border-amber-300">
                🔥 Mais Vendido
              </span>
            )}
          </div>

          {/* Availability Status Badge */}
          <button
            onClick={() => onToggleStatus(produto.id, !produto.disponivel)}
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95 ${
              produto.disponivel 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                : 'bg-rose-500 text-white hover:bg-rose-600'
            }`}
            title="Clique para alternar disponibilidade"
          >
            {produto.disponivel ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Disponível</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Indisponível</span>
              </>
            )}
          </button>
        </div>

        {/* Info Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-bold text-slate-900 text-base line-clamp-1">{produto.nome}</h4>
            <span className="font-black text-emerald-600 text-base shrink-0">{precoFormatado}</span>
          </div>

          <p className="text-slate-600 text-xs line-clamp-2 min-h-[2.25rem] mb-2">
            {produto.descricao || 'Sem descrição cadastrada.'}
          </p>

          {produto.variacoes && produto.variacoes.length > 0 && (
            <div className="mb-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                ✨ {produto.variacoes.length} grupo(s) de opções / sabores
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">ID: {produto.id.slice(0, 6)}...</span>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(produto)}
            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Editar produto"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDelete(produto.id)}
            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Excluir produto"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
