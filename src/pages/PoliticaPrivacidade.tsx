import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Database, Eye, FileText, UserCheck, Trash2, Mail } from 'lucide-react';
import { SEO } from '../components/SEO';

export const PoliticaPrivacidade: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      <SEO 
        title="Política de Privacidade e LGPD - MenuPro"
        description="Conheça a Política de Privacidade e como o MenuPro trata e protege seus dados pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)."
      />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              MenuPro LGPD
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex-1">
        <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Política de Privacidade e Proteção de Dados (LGPD)
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) • Última atualização: Agosto de 2026
              </p>
            </div>
          </div>

          <div className="space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed">
            {/* Introdução */}
            <section className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                1. Compromisso com a sua Privacidade
              </h2>
              <p>
                O <strong>MenuPro</strong> compromete-se com a segurança, transparência e privacidade dos dados de todos os seus usuários (restaurantes parceiros, administradores e clientes finais que acessam os cardápios digitais). Esta política explica detalhadamente como coletamos, utilizamos, armazenamos e protegemos suas informações de acordo com a LGPD.
              </p>
            </section>

            {/* Dados Coletados */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-400" />
                2. Quais Dados Pessoais Coletamos
              </h2>
              <p>Coletamos apenas os dados estritamente necessários para o funcionamento e entrega do serviço:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <h3 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> Restaurantes e Contratantes
                  </h3>
                  <ul className="list-disc list-inside text-xs sm:text-sm text-slate-400 space-y-1">
                    <li>Nome completo / Razão Social</li>
                    <li>E-mail corporativo ou pessoal</li>
                    <li>Telefone / WhatsApp de contato</li>
                    <li>Endereço do estabelecimento</li>
                    <li>Dados de autenticação (UID e credenciais encriptadas)</li>
                  </ul>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <h3 className="font-bold text-teal-400 mb-1 flex items-center gap-1.5">
                    <Eye className="w-4 h-4" /> Consumidores / Clientes do Cardápio
                  </h3>
                  <ul className="list-disc list-inside text-xs sm:text-sm text-slate-400 space-y-1">
                    <li>Nome fornecido ao realizar o pedido</li>
                    <li>Telefone / WhatsApp (para envio do pedido)</li>
                    <li>Endereço de entrega (rua, número, bairro, complemento)</li>
                    <li>Histórico e status dos pedidos efetuados</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Finalidade do Tratamento */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                3. Finalidade e Base Legal do Tratamento
              </h2>
              <p>O tratamento dos seus dados pessoais fundamenta-se nas seguintes hipóteses legais da LGPD:</p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 pl-2">
                <li><strong>Execução de Contrato (Art. 7º, V):</strong> Permitir a criação de cardápios, recebimento de pedidos no WhatsApp, envio de comprovantes e acompanhamento de entregas.</li>
                <li><strong>Cumprimento de Obrigação Legal (Art. 7º, II):</strong> Manutenção de registros de acesso conforme o Marco Civil da Internet (Lei nº 12.965/2014).</li>
                <li><strong>Legítimo Interesse (Art. 7º, IX):</strong> Melhoria contínua da usabilidade do sistema, prevenção de fraudes e suporte técnico aos restaurantes.</li>
              </ul>
            </section>

            {/* Compartilhamento de Dados */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-teal-400" />
                4. Compartilhamento e Proteção dos Dados
              </h2>
              <p>
                <strong>O MenuPro NÃO vende, aluga ou comercializa dados pessoais de usuários ou estabelecimentos em hipótese alguma.</strong>
              </p>
              <p>Os dados do consumidor são repassados exclusivamente ao estabelecimento gastronômico escolhido pelo próprio consumidor para viabilizar o preparo e a entrega do pedido via WhatsApp ou comanda.</p>
            </section>

            {/* Direitos do Titular (Art. 18 LGPD) */}
            <section className="bg-emerald-950/30 border border-emerald-500/20 p-5 rounded-2xl space-y-3">
              <h2 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                5. Seus Direitos como Titular de Dados (Art. 18 da LGPD)
              </h2>
              <p className="text-slate-300">
                Você tem o direito de solicitar a qualquer momento, de forma gratuita e facilitada:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="flex items-start gap-2 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Confirmação e Acesso:</strong> Confirmar a existência de tratamento e consultar seus dados.</span>
                </div>
                <div className="flex items-start gap-2 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados.</span>
                </div>
                <div className="flex items-start gap-2 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Anonymização/Eliminação:</strong> Exclusão definitiva de dados desnecessários ou excessivos.</span>
                </div>
                <div className="flex items-start gap-2 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Portabilidade:</strong> Solicitar a exportação dos seus dados em formato legível.</span>
                </div>
              </div>
            </section>

            {/* Encarregado pelo Tratamento de Dados (DPO) */}
            <section className="space-y-3 border-t border-slate-800 pt-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-400" />
                6. Encarregado de Proteção de Dados (DPO) & Contato LGPD
              </h2>
              <p>
                Para exercer qualquer um dos seus direitos ou tirar dúvidas sobre o tratamento de dados no MenuPro, entre em contato direto com o nosso Encarregado de Dados:
              </p>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
                <div>
                  <p className="text-white font-bold">MenuPro Suporte & Privacidade LGPD</p>
                  <p className="text-slate-400">E-mail: menuprosuporte@gmail.com</p>
                  <p className="text-slate-400">Atendimento: Segunda a Sexta, das 08h às 18h</p>
                </div>
                <a
                  href="mailto:menuprosuporte@gmail.com?subject=Solicitacao%20LGPD%20MenuPro"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
                >
                  <Mail className="w-4 h-4" /> Solicitar Atendimento LGPD
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 MenuPro. Todos os direitos reservados. Em conformidade com a LGPD (Lei nº 13.709/2018).</p>
      </footer>
    </div>
  );
};
