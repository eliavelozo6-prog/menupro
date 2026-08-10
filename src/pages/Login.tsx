import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUsuario, loginComGoogle, redefinirSenha } from '../services/auth';
import { buscarRestaurantePorId } from '../services/database';
import { Lock, Mail, ArrowRight, AlertCircle, KeyRound, CheckCircle2, X, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { SEO } from '../components/SEO';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Estados para Esqueci Minha Senha
  const [modalEsqueciSenha, setModalEsqueciSenha] = useState(false);
  const [emailEsqueciSenha, setEmailEsqueciSenha] = useState('');
  const [loadingEsqueciSenha, setLoadingEsqueciSenha] = useState(false);
  const [sucessoEsqueciSenha, setSucessoEsqueciSenha] = useState('');
  const [erroEsqueciSenha, setErroEsqueciSenha] = useState('');

  const handleAbrirEsqueciSenha = () => {
    setEmailEsqueciSenha(email || '');
    setSucessoEsqueciSenha('');
    setErroEsqueciSenha('');
    setModalEsqueciSenha(true);
  };

  const handleEnviarRedefinicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailEsqueciSenha.trim()) {
      setErroEsqueciSenha('Por favor, informe seu e-mail.');
      return;
    }

    setErroEsqueciSenha('');
    setSucessoEsqueciSenha('');
    setLoadingEsqueciSenha(true);

    try {
      await redefinirSenha(emailEsqueciSenha.trim());
      setSucessoEsqueciSenha(`E-mail de redefinição enviado com sucesso para ${emailEsqueciSenha.trim()}! Verifique sua caixa de entrada e spams.`);
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setErroEsqueciSenha('Não foi encontrada nenhuma conta cadastrada com este e-mail.');
      } else if (err.code === 'auth/invalid-email') {
        setErroEsqueciSenha('Formato de e-mail inválido.');
      } else {
        setErroEsqueciSenha('Erro ao enviar e-mail de redefinição: ' + (err.message || 'Tente novamente.'));
      }
    } finally {
      setLoadingEsqueciSenha(false);
    }
  };

  const validarAcessoRestaurante = async (user: any) => {
    if (user.tipo === 'admin') {
      navigate('/saas-admin');
      return;
    }
    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      setErro('Preencha o e-mail e a senha para entrar.');
      return;
    }

    setErro('');
    setLoading(true);

    try {
      const user = await loginUsuario(email, senha);
      await validarAcessoRestaurante(user);
    } catch (err: any) {
      console.error('Erro no login:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErro('E-mail ou senha incorretos.');
      } else {
        setErro('Erro ao realizar login: ' + (err.message || 'Tente novamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErro('');
    setLoadingGoogle(true);

    try {
      const user = await loginComGoogle();
      await validarAcessoRestaurante(user);
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // Usuário fechou ou cancelou o pop-up, ação normal sem erro
        return;
      }
      if (code === 'auth/popup-blocked') {
        setErro('O pop-up de login foi bloqueado pelo seu navegador. Por favor, permita pop-ups para este site.');
        return;
      }
      console.error('Erro no login Google:', err);
      setErro('Erro ao entrar com Google: ' + (err?.message || 'Tente novamente.'));
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-4">
      <SEO 
        title="Acessar Painel - MenuPro Cardápio Digital"
        description="Acesse seu painel administrativo do restaurante no MenuPro para gerenciar produtos, pedidos, mesas e relatórios."
      />

      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-800">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 mx-auto flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg mb-2.5 sm:mb-3">
            M
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Acesso ao MenuPro</h2>
          <p className="text-xs text-slate-500 mt-1">Entre com suas credenciais para gerenciar seu cardápio</p>
        </div>

        {erro && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{erro}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loadingGoogle || loading}
          className="w-full mb-4 py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loadingGoogle ? 'Entrando com Google...' : 'Entrar com Google'}</span>
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-semibold text-[10px]">ou com e-mail e senha</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@restaurante.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Senha</label>
              <button
                type="button"
                onClick={handleAbrirEsqueciSenha}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full py-3.5 mt-2"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Entrar no Painel
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Ainda não tem um cardápio digital?
          </p>
          <Link
            to="/cadastro-restaurante"
            className="inline-block text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
          >
            Cadastrar Novo Restaurante →
          </Link>
        </div>
      </div>

      {/* Modal Esqueci a Senha */}
      {modalEsqueciSenha && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 my-auto">
            <button
              type="button"
              onClick={() => setModalEsqueciSenha(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Redefinir Senha</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Informe o e-mail associado à sua conta do MenuPro. Enviaremos as instruções com um link para redefinir sua senha.
              </p>
            </div>

            {sucessoEsqueciSenha && (
              <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-4 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{sucessoEsqueciSenha}</span>
              </div>
            )}

            {erroEsqueciSenha && (
              <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{erroEsqueciSenha}</span>
              </div>
            )}

            {!sucessoEsqueciSenha && (
              <form onSubmit={handleEnviarRedefinicao} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Seu E-mail</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={emailEsqueciSenha}
                      onChange={(e) => setEmailEsqueciSenha(e.target.value)}
                      placeholder="seu.email@restaurante.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={loadingEsqueciSenha}
                  className="w-full py-3.5"
                >
                  Enviar Link de Redefinição
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setModalEsqueciSenha(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Voltar ao Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Overlay de Autenticação com Google MenuPro */}
      {loadingGoogle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 animate-pulse" />

            <div className="relative flex items-center justify-center gap-3 py-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                M
              </div>
              <span className="text-slate-300 font-bold text-lg">+</span>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center justify-center gap-2">
                <span>Autenticando via Google</span>
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Conectando sua Conta Google com o <strong>MenuPro</strong>. Por favor, confirme o acesso na janela pop-up.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-emerald-900 text-xs font-semibold">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Aguardando autorização segura...</span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conexão criptografada de alta segurança</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

