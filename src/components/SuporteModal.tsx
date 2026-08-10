import React from 'react';
import { Headphones, Mail, MessageCircle, X, ShieldCheck, Zap, Clock, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Restaurante, Usuario } from '../types';

interface SuporteModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
  restaurante: Restaurante | null;
}

export const SuporteModal: React.FC<SuporteModalProps> = ({ isOpen, onClose, usuario, restaurante }) => {
  if (!isOpen) return null;

  const planoNome = restaurante?.plano || 'Degustação (Grátis 7 dias)';
  const isPlanoVip = planoNome.toLowerCase().includes('anual') || planoNome.toLowerCase().includes('vip');
  const isPlanoPro = planoNome.toLowerCase().includes('mensal') || planoNome.toLowerCase().includes('pro');

  const emailSuporte = 'menuprosuporte@gmail.com';
  const whatsappSuporteRaw = '5592982391133';
  const whatsappSuporteFormatado = '(92) 98239-1133';

  // Mensagem pré-formatada para WhatsApp
  const mensagemWhatsApp = `Olá equipe de Suporte MenuPro!

Gostaria de solicitar suporte técnico/atendimento:
- Restaurante: ${restaurante?.nome || 'Não informado'}
- Responsável: ${usuario?.nome || 'Não informado'}
- E-mail cadastrado: ${usuario?.email || 'Não informado'}
- Plano Ativo: ${planoNome}

Como podem me ajudar?`;

  const linkWhatsApp = `https://wa.me/${whatsappSuporteRaw}?text=${encodeURIComponent(mensagemWhatsApp)}`;

  // Assunto e corpo para E-mail
  const emailSubject = `[Suporte MenuPro] - ${restaurante?.nome || usuario?.nome || 'Atendimento'}`;
  const emailBody = `Olá, suporte do MenuPro,

Preciso de ajuda com a plataforma:

Dados da Conta:
- Restaurante: ${restaurante?.nome || 'N/A'}
- Usuário: ${usuario?.nome || 'N/A'}
- E-mail de Login: ${usuario?.email || 'N/A'}
- Plano Atual: ${planoNome}

Descrição da dúvida ou problema:
[Descreva aqui o que você precisa...]`;

  const linkEmail = `mailto:${emailSuporte}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Top Banner Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Solicitar Suporte Técnico</h3>
            <p className="text-xs text-slate-500 mt-0.5">Atendimento oficial para restaurantes MenuPro</p>
          </div>
        </div>

        {/* Nível de Suporte do Plano */}
        <div className={`p-4 rounded-2xl border mb-6 text-xs ${
          isPlanoVip 
            ? 'bg-indigo-50/80 border-indigo-200/80 text-indigo-950' 
            : isPlanoPro 
            ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950' 
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-extrabold flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
              {isPlanoVip && <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />}
              {isPlanoPro && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
              Plano Atual: {planoNome}
            </span>
            <span className="font-bold text-[11px] bg-white px-2 py-0.5 rounded-full border shadow-2xs">
              {isPlanoVip ? 'Suporte VIP 24/7' : isPlanoPro ? 'Suporte Prioritário' : 'Suporte Padrão'}
            </span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed mt-1">
            {isPlanoVip 
              ? 'Seu plano possui atendimento com prioridade máxima e SLA reduzido no WhatsApp e E-mail.' 
              : isPlanoPro 
              ? 'Atendimento prioritário em horário comercial diretamente com nossa equipe de especialistas.' 
              : 'Atendimento via fila comum por WhatsApp e E-mail comercial.'}
          </p>
        </div>

        {/* Opções de Contato */}
        <div className="space-y-3">
          {/* WhatsApp Direct */}
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all shadow-md hover:shadow-lg font-semibold text-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-700/50 rounded-xl">
                <MessageCircle className="w-5 h-5 text-emerald-100" />
              </div>
              <div className="text-left">
                <div className="font-bold">Suporte via WhatsApp</div>
                <div className="text-xs text-emerald-100 font-normal">{whatsappSuporteFormatado}</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </a>

          {/* Email Direct */}
          <a
            href={linkEmail}
            className="group flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-md hover:shadow-lg font-semibold text-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-xl text-slate-300">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="font-bold">Suporte via E-mail</div>
                <div className="text-xs text-slate-400 font-normal">{emailSuporte}</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Horário: 08h às 22h (Seg a Dom)
          </span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Atendimento Ativo
          </span>
        </div>
      </div>
    </div>
  );
};
