import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { SEO } from '../components/SEO';

export const TermosDeUso: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      <SEO 
        title="Termos de Uso - MenuPro Cardápio Digital"
        description="Termos e condições de uso da plataforma MenuPro para restaurantes e consumidores."
      />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              MenuPro Termos
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex-1">
        <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Termos e Condições de Uso
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Regras de utilização do serviço MenuPro • Atualizado em Agosto de 2026
              </p>
            </div>
          </div>

          <div className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
            <section className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                1. Aceitação dos Termos
              </h2>
              <p>
                Ao cadastrar seu restaurante ou utilizar os cardápios digitais fornecidos pelo MenuPro, você declara ter lido, compreendido e concordado expressamente com estes Termos de Uso e com a nossa Política de Privacidade (LGPD).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white">2. Objeto e Serviços do MenuPro</h2>
              <p>
                O MenuPro é uma plataforma SaaS (Software as a Service) que fornece ferramentas de criação de cardápios digitais interativos por QR Code, gestão de comandas e mesas, recebimento e encaminhamento de pedidos via WhatsApp, além de painel financeiro e de relatórios.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white">3. Responsabilidades dos Restaurantes Parceiros</h2>
              <ul className="list-disc list-inside text-slate-400 space-y-1 pl-2">
                <li>Garantir a veracidade dos preços, descrições, fotos e disponibilidade dos produtos ofertados no cardápio.</li>
                <li>Manter atualizados os dados de contato, horário de funcionamento e chaves Pix para pagamento.</li>
                <li>Cumprir a legislação sanitária e de defesa do consumidor no atendimento aos seus clientes.</li>
                <li>Tratar com sigilo e segurança os dados dos clientes finais recebidos para fins de entrega.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white">4. Ausência de Taxas sobre Vendas</h2>
              <p>
                O MenuPro opera no modelo de assinatura por plano estipulado. O MenuPro <strong>não cobra comissões nem porcentagens sobre o valor dos pedidos</strong> realizados pelos clientes finais dos restaurantes parceiros.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white">5. Cancelamento e Modificações</h2>
              <p>
                O restaurante pode solicitar o cancelamento do seu plano a qualquer momento através do painel de controle ou do suporte oficial via WhatsApp/E-mail.
              </p>
            </section>

            <section className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-xs sm:text-sm text-slate-400 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-1">Dúvidas sobre os Termos?</p>
                <p>Caso precise de esclarecimentos, envie um e-mail para <a href="mailto:menuprosuporte@gmail.com" className="text-emerald-400 hover:underline">menuprosuporte@gmail.com</a>.</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 MenuPro. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};
