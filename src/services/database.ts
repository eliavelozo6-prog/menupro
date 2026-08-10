import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  Restaurante, 
  Produto, 
  Pedido, 
  Cliente, 
  Plano, 
  Cupom,
  TaxaBairro,
  Avaliacao,
  StatusPedido,
  PedidoItem,
  ConfiguracoesSaas,
  Mesa,
  AvisoGeral
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Remove recursivamente todas as propriedades com valor `undefined` 
 * para evitar erros de validação do Firestore no setDoc e updateDoc.
 */
export function removerUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removerUndefined) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const key of Object.keys(obj as Record<string, any>)) {
    const val = (obj as Record<string, any>)[key];
    if (val !== undefined) {
      clean[key] = removerUndefined(val);
    }
  }
  return clean as T;
}

// Planos padrão estáticos para fallback
export const PLANOS_PADRAO: Plano[] = [
  {
    id: 'plano-degustacao',
    nome: 'Plano Degustação (30 Dias Grátis)',
    descricao: 'Experimente todas as funcionalidades do MenuPro sem custos por 30 dias.',
    preco: 0.00,
    limiteProdutos: 50,
    diasDegustacao: 30,
    recursos: [
      '30 Dias de Teste 100% Grátis',
      'Cardápio Digital QR Code',
      'Gestão Completa de Pedidos ao Vivo',
      'Integração WhatsApp Automática',
      'Até 50 produtos cadastrados',
      'Sem necessidade de cartão de crédito'
    ],
    ativo: true
  },
  {
    id: 'plano-basico',
    nome: 'Plano Básico',
    descricao: 'Ideal para pequenos restaurantes e lanchonetes iniciando no digital.',
    preco: 49.90,
    limiteProdutos: 30,
    recursos: ['Cardápio Digital QR Code', 'Gestão de Pedidos Básica', 'Até 30 produtos', 'Suporte por E-mail'],
    ativo: true
  },
  {
    id: 'plano-pro',
    nome: 'Plano Profissional (Pro)',
    descricao: 'Para restaurantes em expansão com alto volume de vendas.',
    preco: 89.90,
    limiteProdutos: 150,
    recursos: ['Cardápio QR Code Ilimitado', 'Integração WhatsApp Direta', 'Gestão de Clientes e Financeiro', 'Até 150 produtos', 'Suporte Prioritário'],
    ativo: true
  },
  {
    id: 'plano-premium',
    nome: 'Plano Premium',
    descricao: 'Solução completa para franquias e grandes restaurantes.',
    preco: 149.90,
    limiteProdutos: 9999,
    recursos: ['Produtos Ilimitados', 'Domínio Customizado', 'Relatórios Financeiros Avançados', 'Suporte VIP 24/7', 'QR Codes Personalizados'],
    ativo: true
  }
];

// ==========================================
// RESTAURANTES
// ==========================================

export function calcularDiasRestantesPlano(expiracaoPlano?: string, criadoEm?: string): number {
  if (!expiracaoPlano && !criadoEm) return 0;
  
  let expiracaoMs: number;
  if (expiracaoPlano) {
    expiracaoMs = new Date(expiracaoPlano).getTime();
  } else if (criadoEm) {
    const criado = new Date(criadoEm);
    criado.setDate(criado.getDate() + 30);
    expiracaoMs = criado.getTime();
  } else {
    return 0;
  }

  const diff = expiracaoMs - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function obterDataVencimentoPlano(expiracaoPlano?: string, criadoEm?: string): Date | null {
  if (expiracaoPlano) {
    const data = new Date(expiracaoPlano);
    if (!isNaN(data.getTime())) return data;
  }
  if (criadoEm) {
    const criado = new Date(criadoEm);
    if (!isNaN(criado.getTime())) {
      criado.setDate(criado.getDate() + 30);
      return criado;
    }
  }
  return null;
}

export function formatarDataVencimentoPlano(expiracaoPlano?: string, criadoEm?: string): string {
  const data = obterDataVencimentoPlano(expiracaoPlano, criadoEm);
  if (!data) return 'Não definida';
  
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export async function criarRestaurante(dados: Omit<Restaurante, 'id' | 'criadoEm'> & { ativo?: boolean }): Promise<Restaurante> {
  const restauranteRef = doc(collection(db, 'restaurantes'));
  const agora = new Date();
  const expiracao = new Date(agora);
  
  // Se for plano pago no cadastro ou status 'Pendente Pix', o restaurante não ganha 30 dias de teste grátis
  const isPlanoPagoOuPendente = dados.statusPagamento === 'Pendente Pix' || (dados.planoId && dados.planoId !== 'plano-degustacao');
  
  if (!isPlanoPagoOuPendente) {
    expiracao.setDate(expiracao.getDate() + 30); // 30 dias de teste grátis apenas para Plano Degustação
  }

  const novoRestaurante: Restaurante = {
    ...dados,
    ativo: dados.ativo !== undefined ? dados.ativo : !isPlanoPagoOuPendente,
    id: restauranteRef.id,
    plano: dados.plano || 'Plano Degustação (30 Dias Grátis)',
    planoId: dados.planoId || 'plano-degustacao',
    expiracaoPlano: dados.expiracaoPlano || expiracao.toISOString(),
    criadoEm: agora.toISOString()
  };
  try {
    await setDoc(restauranteRef, removerUndefined(novoRestaurante));
    return novoRestaurante;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'restaurantes');
    throw error;
  }
}

export async function buscarRestaurantePorId(id: string): Promise<Restaurante | null> {
  if (!id) return null;
  const docRef = doc(db, 'restaurantes', id);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Restaurante;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `restaurantes/${id}`);
    return null;
  }
}

export function escutarRestaurantePorId(id: string, callback: (restaurante: Restaurante | null) => void) {
  if (!id) {
    callback(null);
    return () => {};
  }
  const docRef = doc(db, 'restaurantes', id);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as Restaurante);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Erro ao escutar restaurante:', error);
  });
}

export async function buscarRestaurantePorSlug(slug: string): Promise<Restaurante | null> {
  if (!slug) return null;
  try {
    const q = query(collection(db, 'restaurantes'), where('slug', '==', slug.toLowerCase().trim()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as Restaurante;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'restaurantes');
    return null;
  }
}

export async function listarRestaurantes(): Promise<Restaurante[]> {
  try {
    let list: Restaurante[] = [];
    try {
      const q = query(collection(db, 'restaurantes'), orderBy('criadoEm', 'desc'));
      const snap = await getDocs(q);
      list = snap.docs.map(doc => doc.data() as Restaurante);
    } catch {
      const snap = await getDocs(collection(db, 'restaurantes'));
      list = snap.docs.map(doc => doc.data() as Restaurante);
    }

    // Buscar e-mails cadastrados na coleção 'usuarios' para garantir exibição do e-mail do restaurante
    try {
      const snapUsers = await getDocs(collection(db, 'usuarios'));
      const emailMap = new Map<string, string>();
      snapUsers.docs.forEach(uDoc => {
        const uData = uDoc.data();
        if (uData.restauranteId && uData.email) {
          emailMap.set(uData.restauranteId, uData.email);
        }
      });

      return list.map(r => ({
        ...r,
        email: r.email || emailMap.get(r.id) || ''
      }));
    } catch {
      return list;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'restaurantes');
    return [];
  }
}

export async function obterIdsRestaurantesAdmin(): Promise<string[]> {
  const adminEmails = ['eliavelozo6@gmail.com', 'admin@menupro.com'];
  const adminRestIds: string[] = [];

  // 1. Tentar verificar na coleção usuarios (funciona quando o usuário está autenticado)
  try {
    const snapUsuarios = await getDocs(collection(db, 'usuarios'));
    snapUsuarios.docs.forEach(docSnap => {
      const u = docSnap.data() as any;
      const emailNorm = u.email ? u.email.toLowerCase().trim() : '';
      if (u.tipo === 'admin' || adminEmails.some(adm => emailNorm.includes(adm))) {
        if (u.restauranteId && !adminRestIds.includes(u.restauranteId)) {
          adminRestIds.push(u.restauranteId);
        }
      }
    });
  } catch {
    // Leitura não permitida para visitantes não autenticados
  }

  // 2. Verificar na coleção restaurantes (leitura pública permitida)
  try {
    const snapRest = await getDocs(collection(db, 'restaurantes'));
    snapRest.docs.forEach(docSnap => {
      const r = docSnap.data() as any;
      const emailNorm = (r.email || '').toLowerCase().trim();
      const nomeNorm = (r.nome || '').toLowerCase().trim();
      const slugNorm = (r.slug || '').toLowerCase().trim();

      const eAdminEmail = adminEmails.some(adm => emailNorm.includes(adm.toLowerCase().trim())) ||
                          emailNorm.includes('eliavelozo') ||
                          emailNorm.includes('admin');

      const eAdminNomeOuSlug = nomeNorm.includes('eliavelozo') || 
                               slugNorm.includes('eliavelozo') ||
                               nomeNorm.includes('admin') ||
                               slugNorm.includes('admin');

      const isFlagAdmin = r.tipo === 'admin' || r.isAdmin === true || r.isDemo === true;

      if (eAdminEmail || eAdminNomeOuSlug || isFlagAdmin) {
        if (!adminRestIds.includes(r.id)) {
          adminRestIds.push(r.id);
        }
      }
    });
  } catch (err) {
    console.warn('Erro ao buscar restaurantes de admin:', err);
  }

  return adminRestIds;
}

export async function atualizarRestaurante(id: string, dados: Partial<Restaurante>): Promise<void> {
  const docRef = doc(db, 'restaurantes', id);
  try {
    await updateDoc(docRef, removerUndefined(dados));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `restaurantes/${id}`);
    throw error;
  }
}

export async function mudarStatusRestaurante(id: string, ativo: boolean): Promise<void> {
  const docRef = doc(db, 'restaurantes', id);
  try {
    const snap = await getDoc(docRef);
    const rest = snap.exists() ? (snap.data() as Restaurante) : null;
    const updateData: any = { ativo };

    // Se estiver ativando um restaurante que estava pendente ou rejeitado, confirma o Pix e estende por 30 dias (somando dias restantes apenas se o restaurante já estava ativo)
    if (ativo && (rest?.statusPagamento === 'Pendente Pix' || rest?.statusPagamento === 'Rejeitado Pix')) {
      updateData.statusPagamento = 'Confirmado Pix';
      const diasRestantes = (rest && rest.ativo && rest.statusPagamento !== 'Pendente Pix') 
        ? calcularDiasRestantesPlano(rest.expiracaoPlano, rest.criadoEm) 
        : 0;
      const dataExpiracao = new Date();
      dataExpiracao.setDate(dataExpiracao.getDate() + diasRestantes + 30);
      updateData.expiracaoPlano = dataExpiracao.toISOString();
      updateData.dataAprovacaoPix = new Date().toISOString();
    }

    await updateDoc(docRef, removerUndefined(updateData));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `restaurantes/${id}`);
    throw error;
  }
}

export async function excluirRestaurante(id: string): Promise<void> {
  const docRef = doc(db, 'restaurantes', id);
  try {
    // 1. Apagar documento do restaurante
    await deleteDoc(docRef);

    // 2. Apagar usuários associados ao restaurante na coleção 'usuarios'
    try {
      const qUsuarios = query(collection(db, 'usuarios'), where('restauranteId', '==', id));
      const snapUsuarios = await getDocs(qUsuarios);
      for (const uDoc of snapUsuarios.docs) {
        await deleteDoc(uDoc.ref);
      }
    } catch (err) {
      console.warn('Erro ao apagar usuários do restaurante:', err);
    }

    // 3. Apagar produtos, pedidos, categorias e clientes associados
    const colecoesRelacionadas = ['produtos', 'pedidos', 'categorias', 'clientes'];
    for (const colName of colecoesRelacionadas) {
      try {
        const qRel = query(collection(db, colName), where('restauranteId', '==', id));
        const snapRel = await getDocs(qRel);
        for (const docRel of snapRel.docs) {
          await deleteDoc(docRel.ref);
        }
      } catch (errRel) {
        // ignora se a coleção não existir ou faltar índice
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `restaurantes/${id}`);
    throw error;
  }
}

// ==========================================
// PRODUTOS
// ==========================================

export async function cadastrarProduto(dados: Omit<Produto, 'id'>): Promise<Produto> {
  const prodRef = doc(collection(db, 'produtos'));
  const novoProduto: Produto = {
    ...dados,
    id: prodRef.id
  };
  try {
    await setDoc(prodRef, removerUndefined(novoProduto));
    return novoProduto;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'produtos');
    throw error;
  }
}

export async function listarProdutosRestaurante(restauranteId: string): Promise<Produto[]> {
  if (!restauranteId) return [];
  try {
    const q = query(collection(db, 'produtos'), where('restauranteId', '==', restauranteId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as Produto);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'produtos');
    return [];
  }
}

export async function atualizarProduto(id: string, dados: Partial<Produto>): Promise<void> {
  const docRef = doc(db, 'produtos', id);
  try {
    await updateDoc(docRef, removerUndefined(dados));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `produtos/${id}`);
    throw error;
  }
}

export async function excluirProduto(id: string): Promise<void> {
  const docRef = doc(db, 'produtos', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `produtos/${id}`);
    throw error;
  }
}

export async function alternarDisponibilidadeProduto(id: string, disponivel: boolean): Promise<void> {
  const docRef = doc(db, 'produtos', id);
  try {
    await updateDoc(docRef, { disponivel });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `produtos/${id}`);
    throw error;
  }
}

// ==========================================
// PEDIDOS
// ==========================================

export async function criarPedido(dados: {
  restauranteId: string;
  clienteNome: string;
  telefone: string;
  endereco: string;
  bairro?: string;
  taxaEntrega?: number;
  tipoEntrega: 'entrega' | 'retirada' | 'mesa';
  numeroMesa?: string;
  statusComanda?: 'Aberta' | 'Fechada';
  status?: StatusPedido;
  formaPagamento: string;
  trocoPara?: string;
  produtos: PedidoItem[];
  valorTotal: number;
  cupomCodigo?: string;
  desconto?: number;
  observacao?: string;
}): Promise<Pedido> {
  const pedidoRef = doc(collection(db, 'pedidos'));
  const novoPedido: Pedido = {
    ...dados,
    id: pedidoRef.id,
    status: dados.status || 'Novo pedido',
    data: new Date().toISOString()
  };
  try {
    await setDoc(pedidoRef, removerUndefined(novoPedido));
    // Incrementar ou registrar o cliente no restaurante
    await buscarOuCriarCliente(dados.restauranteId, dados.clienteNome, dados.telefone, dados.endereco, dados.valorTotal);
    
    // Incrementar uso do cupom se aplicado
    if (dados.cupomCodigo) {
      const cupom = await buscarCupomPorCodigo(dados.restauranteId, dados.cupomCodigo);
      if (cupom) {
        await incrementarUsoCupom(cupom.id);
      }
    }

    return novoPedido;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'pedidos');
    throw error;
  }
}

export async function listarPedidosRestaurante(restauranteId: string): Promise<Pedido[]> {
  if (!restauranteId) return [];
  try {
    const q = query(
      collection(db, 'pedidos'), 
      where('restauranteId', '==', restauranteId)
    );
    const snap = await getDocs(q);
    const pedidos = snap.docs.map(doc => doc.data() as Pedido);
    return pedidos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'pedidos');
    return [];
  }
}

export function escutarPedidosRestaurante(restauranteId: string, callback: (pedidos: Pedido[]) => void) {
  if (!restauranteId) return () => {};
  const q = query(
    collection(db, 'pedidos'),
    where('restauranteId', '==', restauranteId)
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(doc => doc.data() as Pedido);
    list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'pedidos');
  });
}

export async function buscarPedidoPorId(id: string): Promise<Pedido | null> {
  if (!id) return null;
  const docRef = doc(db, 'pedidos', id);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Pedido;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `pedidos/${id}`);
    return null;
  }
}

export function escutarPedidoUnico(id: string, callback: (pedido: Pedido | null) => void) {
  if (!id) return () => {};
  const docRef = doc(db, 'pedidos', id);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as Pedido);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `pedidos/${id}`);
  });
}

export async function atualizarStatusPedido(id: string, status: StatusPedido): Promise<void> {
  const docRef = doc(db, 'pedidos', id);
  try {
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `pedidos/${id}`);
    throw error;
  }
}

export async function solicitarCancelamentoPedido(id: string, motivo?: string): Promise<void> {
  const docRef = doc(db, 'pedidos', id);
  try {
    const solicitacao = {
      solicitou: true,
      motivo: motivo || 'Solicitado pelo cliente',
      data: new Date().toISOString(),
      status: 'pendente'
    };
    await updateDoc(docRef, { solicitacaoCancelamento: solicitacao });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `pedidos/${id}`);
    throw error;
  }
}

export async function responderSolicitacaoCancelamento(
  id: string, 
  aceito: boolean, 
  respostaMotivo?: string
): Promise<void> {
  const docRef = doc(db, 'pedidos', id);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const pedidoData = docSnap.data() as Pedido;
    const solicitacaoAtual = pedidoData.solicitacaoCancelamento || {
      solicitou: true,
      data: new Date().toISOString(),
      status: 'pendente'
    };

    const novaSolicitacao = {
      ...solicitacaoAtual,
      status: aceito ? 'aceito' : 'recusado',
      respostaMotivo: respostaMotivo || (aceito ? 'Cancelamento aprovado pelo restaurante' : 'Cancelamento recusado pelo restaurante')
    };

    if (aceito) {
      await updateDoc(docRef, {
        status: 'Cancelado',
        solicitacaoCancelamento: novaSolicitacao
      });
    } else {
      await updateDoc(docRef, {
        solicitacaoCancelamento: novaSolicitacao
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `pedidos/${id}`);
    throw error;
  }
}

// ==========================================
// CLIENTES
// ==========================================

export async function buscarOuCriarCliente(
  restauranteId: string, 
  nome: string, 
  telefone: string, 
  endereco: string,
  valorGasto: number
): Promise<void> {
  if (!restauranteId || !telefone) return;
  try {
    const q = query(
      collection(db, 'clientes'),
      where('restauranteId', '==', restauranteId),
      where('telefone', '==', telefone)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docCliente = snap.docs[0];
      const clienteAtual = docCliente.data() as Cliente;
      await updateDoc(doc(db, 'clientes', docCliente.id), removerUndefined({
        nome,
        endereco,
        totalPedidos: (clienteAtual.totalPedidos || 0) + 1,
        totalGasto: (clienteAtual.totalGasto || 0) + valorGasto
      }));
    } else {
      const clienteRef = doc(collection(db, 'clientes'));
      const novoCliente: Cliente = {
        id: clienteRef.id,
        restauranteId,
        nome,
        telefone,
        endereco,
        totalPedidos: 1,
        totalGasto: valorGasto,
        criadoEm: new Date().toISOString()
      };
      await setDoc(clienteRef, removerUndefined(novoCliente));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'clientes');
  }
}

export async function listarClientesRestaurante(restauranteId: string): Promise<Cliente[]> {
  if (!restauranteId) return [];
  try {
    const q = query(collection(db, 'clientes'), where('restauranteId', '==', restauranteId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as Cliente);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'clientes');
    return [];
  }
}

// ==========================================
// PLANOS
// ==========================================

// Função para ordenar planos: Plano de Degustação (Gratuito/Zero) primeiro, seguido do menor valor pro maior
export function ordenarPlanos(planos: Plano[]): Plano[] {
  return [...planos].sort((a, b) => {
    const isDegustacaoA = 
      a.preco === 0 || 
      a.id.includes('degustacao') || 
      a.nome.toLowerCase().includes('degustação') || 
      a.nome.toLowerCase().includes('degustacao') || 
      a.nome.toLowerCase().includes('grátis') || 
      a.nome.toLowerCase().includes('gratis');

    const isDegustacaoB = 
      b.preco === 0 || 
      b.id.includes('degustacao') || 
      b.nome.toLowerCase().includes('degustação') || 
      b.nome.toLowerCase().includes('degustacao') || 
      b.nome.toLowerCase().includes('grátis') || 
      b.nome.toLowerCase().includes('gratis');

    if (isDegustacaoA && !isDegustacaoB) return -1;
    if (!isDegustacaoA && isDegustacaoB) return 1;

    return a.preco - b.preco;
  });
}

export async function listarPlanos(): Promise<Plano[]> {
  try {
    const snap = await getDocs(collection(db, 'planos'));
    if (snap.empty) {
      return ordenarPlanos(PLANOS_PADRAO);
    }
    const lista = snap.docs.map(doc => doc.data() as Plano);
    return ordenarPlanos(lista);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'planos');
    return ordenarPlanos(PLANOS_PADRAO);
  }
}

export async function cadastrarPlano(dados: Omit<Plano, 'id'>): Promise<Plano> {
  const planoRef = doc(collection(db, 'planos'));
  const novoPlano: Plano = {
    ...dados,
    id: planoRef.id
  };
  try {
    await setDoc(planoRef, removerUndefined(novoPlano));
    return novoPlano;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'planos');
    throw error;
  }
}

export async function atualizarPlano(id: string, dados: Partial<Plano>): Promise<void> {
  const docRef = doc(db, 'planos', id);
  try {
    await updateDoc(docRef, removerUndefined(dados));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `planos/${id}`);
    throw error;
  }
}

export async function excluirPlano(id: string): Promise<void> {
  const docRef = doc(db, 'planos', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `planos/${id}`);
    throw error;
  }
}

// Seed de planos iniciais se a coleção estiver vazia e usuário estiver autenticado
export async function inicializarPlanosIniciais(): Promise<void> {
  try {
    // Apenas tenta seed se houver usuário logado (ex: SaasAdmin ou durante cadastro autenticado)
    if (!auth.currentUser) return;
    const snap = await getDocs(collection(db, 'planos'));
    if (snap.empty) {
      for (const p of PLANOS_PADRAO) {
        const { id, ...dadosPlano } = p;
        const planoRef = doc(db, 'planos', id);
        await setDoc(planoRef, { id, ...dadosPlano });
      }
    }
  } catch (err) {
    // Ignorar silenciosamente falhas de escrita se usuário não tiver permissão
    console.warn('Não foi possível gravar planos padrão no Firestore:', err);
  }
}

// ==========================================
// CUPONS DE DESCONTO E PROMOÇÕES
// ==========================================

export async function buscarCuponsRestaurante(restauranteId: string): Promise<Cupom[]> {
  if (!restauranteId) return [];
  try {
    const q = query(collection(db, 'cupons'), where('restauranteId', '==', restauranteId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as Cupom);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'cupons');
    return [];
  }
}

export async function buscarCupomPorCodigo(restauranteId: string, codigo: string): Promise<Cupom | null> {
  if (!restauranteId || !codigo) return null;
  const codigoUpper = codigo.trim().toUpperCase();
  try {
    const q = query(
      collection(db, 'cupons'),
      where('restauranteId', '==', restauranteId),
      where('codigo', '==', codigoUpper)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as Cupom;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'cupons');
    return null;
  }
}

export async function cadastrarCupom(dados: Omit<Cupom, 'id' | 'usosAtuais'>): Promise<Cupom> {
  const cupomRef = doc(collection(db, 'cupons'));
  const novoCupom: Cupom = {
    ...dados,
    codigo: dados.codigo.trim().toUpperCase(),
    id: cupomRef.id,
    usosAtuais: 0,
    criadoEm: new Date().toISOString()
  };
  try {
    await setDoc(cupomRef, removerUndefined(novoCupom));
    return novoCupom;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'cupons');
    throw error;
  }
}

export async function atualizarCupom(id: string, dados: Partial<Cupom>): Promise<void> {
  const docRef = doc(db, 'cupons', id);
  const payload = { ...dados };
  if (payload.codigo) {
    payload.codigo = payload.codigo.trim().toUpperCase();
  }
  try {
    await updateDoc(docRef, removerUndefined(payload));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `cupons/${id}`);
    throw error;
  }
}

export async function excluirCupom(id: string): Promise<void> {
  const docRef = doc(db, 'cupons', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `cupons/${id}`);
    throw error;
  }
}

export async function incrementarUsoCupom(id: string): Promise<void> {
  const docRef = doc(db, 'cupons', id);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const c = snap.data() as Cupom;
      await updateDoc(docRef, { usosAtuais: (c.usosAtuais || 0) + 1 });
    }
  } catch (error) {
    console.error('Erro ao incrementar uso do cupom:', error);
  }
}

// ==========================================
// TAXAS DE ENTREGA POR BAIRRO
// ==========================================

export async function buscarTaxasBairrosRestaurante(restauranteId: string): Promise<TaxaBairro[]> {
  if (!restauranteId) return [];
  try {
    const q = query(collection(db, 'taxas_bairros'), where('restauranteId', '==', restauranteId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as TaxaBairro);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'taxas_bairros');
    return [];
  }
}

export async function cadastrarTaxaBairro(dados: Omit<TaxaBairro, 'id'>): Promise<TaxaBairro> {
  const ref = doc(collection(db, 'taxas_bairros'));
  const novaTaxa: TaxaBairro = {
    ...dados,
    id: ref.id,
    criadoEm: new Date().toISOString()
  };
  try {
    await setDoc(ref, removerUndefined(novaTaxa));
    return novaTaxa;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'taxas_bairros');
    throw error;
  }
}

export async function atualizarTaxaBairro(id: string, dados: Partial<TaxaBairro>): Promise<void> {
  const ref = doc(db, 'taxas_bairros', id);
  try {
    await updateDoc(ref, removerUndefined(dados));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `taxas_bairros/${id}`);
    throw error;
  }
}

export async function excluirTaxaBairro(id: string): Promise<void> {
  const ref = doc(db, 'taxas_bairros', id);
  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `taxas_bairros/${id}`);
    throw error;
  }
}

// ==========================================
// AVALIAÇÕES E FEEDBACK DE CLIENTES
// ==========================================

export async function buscarAvaliacoesRestaurante(restauranteId: string): Promise<Avaliacao[]> {
  if (!restauranteId) return [];
  try {
    const q = query(collection(db, 'avaliacoes'), where('restauranteId', '==', restauranteId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as Avaliacao);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'avaliacoes');
    return [];
  }
}

export async function enviarAvaliacaoPedido(dados: {
  restauranteId: string;
  pedidoId: string;
  clienteNome: string;
  nota: number;
  comentario?: string;
}): Promise<Avaliacao> {
  const ref = doc(collection(db, 'avaliacoes'));
  const avaliacao: Avaliacao = {
    ...dados,
    id: ref.id,
    exibirNoCardapio: false, // Dono seleciona no adm quais comentários deseja exibir
    data: new Date().toISOString()
  };
  try {
    await setDoc(ref, removerUndefined(avaliacao));
    
    // Atualizar também no documento do Pedido para facilitar exibição
    if (dados.pedidoId) {
      const pedidoRef = doc(db, 'pedidos', dados.pedidoId);
      await updateDoc(pedidoRef, removerUndefined({
        avaliacaoNota: dados.nota,
        avaliacaoComentario: dados.comentario || ''
      }));
    }

    return avaliacao;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'avaliacoes');
    throw error;
  }
}

export async function alternarExibicaoAvaliacao(id: string, exibirNoCardapio: boolean): Promise<void> {
  const ref = doc(db, 'avaliacoes', id);
  try {
    await updateDoc(ref, { exibirNoCardapio });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `avaliacoes/${id}`);
    throw error;
  }
}

// ==========================================
// CONFIGURAÇÕES GERAIS DO SAAS (CHAVE PIX, ETC)
// ==========================================

export const CONFIGURACAO_SAAS_PADRAO: ConfiguracoesSaas = {
  chavePix: '38992097063',
  titularPix: 'Élia Velozo de Oliveira',
  bancoPix: 'Nubank',
  tipoChave: 'telefone',
  whatsappSuporte: '92982391133',
  instrucoesPix: 'Realize a transferência da mensalidade do plano via Pix utilizando a chave acima e envie o comprovante diretamente para o WhatsApp do Administrador.'
};

export async function obterConfiguracoesSaas(): Promise<ConfiguracoesSaas> {
  try {
    const docRef = doc(db, 'configuracoes', 'saas');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as ConfiguracoesSaas;
    }
  } catch (error) {
    console.warn('Erro ao carregar configurações SaaS do Firestore:', error);
  }
  return CONFIGURACAO_SAAS_PADRAO;
}

export async function salvarConfiguracoesSaas(config: ConfiguracoesSaas): Promise<void> {
  try {
    const docRef = doc(db, 'configuracoes', 'saas');
    await setDoc(docRef, removerUndefined(config), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'configuracoes/saas');
    throw error;
  }
}

// ==========================================
// MESAS E GARÇOM DIGITAL
// ==========================================

export async function listarMesas(restauranteId: string): Promise<Mesa[]> {
  try {
    const q = query(
      collection(db, 'mesas'),
      where('restauranteId', '==', restauranteId)
    );
    const snap = await getDocs(q);
    const lista: Mesa[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Mesa;
      lista.push({
        ...data,
        id: docSnap.id // Garante que o ID é rigorosamente o ID do documento do Firestore
      });
    });
    // Ordenar numericamente / alfabeticamente por numero de mesa
    return lista.sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'mesas');
    return [];
  }
}

export async function salvarMesa(mesa: Partial<Mesa> & { restauranteId: string; numero: string }): Promise<Mesa> {
  const numLimpo = mesa.numero.trim();
  // Se não possuir ID explícito, cria um ID determinístico baseado no restaurante + número da mesa para EVITAR DUPLICATAS
  const docId = mesa.id || `${mesa.restauranteId}_mesa_${numLimpo.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const ref = doc(db, 'mesas', docId);

  const dadosMesa: Mesa = {
    id: ref.id,
    restauranteId: mesa.restauranteId,
    numero: numLimpo,
    nome: mesa.nome || `Mesa ${numLimpo}`,
    qrCodeUrl: mesa.qrCodeUrl || '',
    status: mesa.status || 'Livre',
    criadoEm: mesa.criadoEm || new Date().toISOString()
  };

  try {
    await setDoc(ref, removerUndefined(dadosMesa), { merge: true });
    return dadosMesa;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mesas');
    throw error;
  }
}

export async function excluirMesa(id: string): Promise<void> {
  if (!id) {
    throw new Error('ID da mesa não especificado.');
  }
  try {
    await deleteDoc(doc(db, 'mesas', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `mesas/${id}`);
    throw error;
  }
}

export async function limparMesasDuplicadas(restauranteId: string): Promise<number> {
  try {
    const mesas = await listarMesas(restauranteId);
    const mapaMesas = new Map<string, Mesa[]>();

    // Agrupar por número limpo
    for (const m of mesas) {
      const numKey = m.numero.trim().toLowerCase();
      if (!mapaMesas.has(numKey)) {
        mapaMesas.set(numKey, []);
      }
      mapaMesas.get(numKey)!.push(m);
    }

    let removidas = 0;
    const promessas: Promise<void>[] = [];

    for (const [, lista] of mapaMesas.entries()) {
      if (lista.length > 1) {
        // Mantém a mesa Ocupada se houver, ou a primeira da lista
        const principal = lista.find(m => m.status === 'Ocupada') || lista[0];
        const duplicadas = lista.filter(m => m.id !== principal.id);

        for (const dup of duplicadas) {
          if (dup.id) {
            promessas.push(deleteDoc(doc(db, 'mesas', dup.id)));
            removidas++;
          }
        }
      }
    }

    if (promessas.length > 0) {
      await Promise.all(promessas);
    }
    return removidas;
  } catch (error) {
    console.error('Erro ao limpar mesas duplicadas:', error);
    return 0;
  }
}

export async function atualizarStatusMesa(id: string, status: 'Livre' | 'Ocupada' | 'Aguardando Pagamento'): Promise<void> {
  try {
    await updateDoc(doc(db, 'mesas', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `mesas/${id}`);
    throw error;
  }
}

export async function fecharComandaMesa(restauranteId: string, numeroMesa: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'pedidos'),
      where('restauranteId', '==', restauranteId),
      where('numeroMesa', '==', numeroMesa)
    );
    const snap = await getDocs(q);
    let atualizados = 0;
    
    const promessas: Promise<void>[] = [];
    snap.forEach((d) => {
      const p = d.data() as Pedido;
      if (p.status !== 'Finalizado' && p.status !== 'Cancelado') {
        promessas.push(updateDoc(doc(db, 'pedidos', p.id), {
          status: 'Finalizado',
          statusComanda: 'Fechada'
        }));
        atualizados++;
      }
    });

    await Promise.all(promessas);

    // Liberar status da mesa
    const mesas = await listarMesas(restauranteId);
    const mesaAlvo = mesas.find(m => m.numero === numeroMesa || m.nome === numeroMesa);
    if (mesaAlvo) {
      await atualizarStatusMesa(mesaAlvo.id, 'Livre');
    }

    return atualizados;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'pedidos');
    throw error;
  }
}

export async function gerarMesasIniciais(restauranteId: string, quantidade: number = 10): Promise<Mesa[]> {
  await limparMesasDuplicadas(restauranteId);
  const existentes = await listarMesas(restauranteId);
  if (existentes.length > 0) return existentes;

  const criadas: Mesa[] = [];
  for (let i = 1; i <= quantidade; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    const m = await salvarMesa({
      restauranteId,
      numero: num,
      nome: `Mesa ${num}`,
      status: 'Livre'
    });
    criadas.push(m);
  }
  return criadas;
}

// ==========================================
// APROVAÇÃO DE ASSINATURAS PIX SAAS (SUPERADMIN)
// ==========================================

export async function enviarComprovantePixRestaurante(
  restauranteId: string, 
  comprovantePix?: string, 
  preco?: number, 
  observacoes?: string,
  planoId?: string
): Promise<void> {
  try {
    const ref = doc(db, 'restaurantes', restauranteId);
    const snap = await getDoc(ref);
    const rest = snap.exists() ? (snap.data() as Restaurante) : null;
    const diasRestantes = rest ? calcularDiasRestantesPlano(rest.expiracaoPlano, rest.criadoEm) : 0;
    
    // Se o restaurante já possui dias de acesso ativos no plano atual ou status confirmado/gratuito, ele continua ativo enquanto o Pix aguarda aprovação
    const jaTinhaPlanoAtivo = rest ? (rest.ativo && (diasRestantes > 0 || rest.statusPagamento === 'Confirmado Pix' || rest.statusPagamento === 'Gratuito')) : false;
    const manterAtivo = rest ? ((rest.ativo ?? true) && jaTinhaPlanoAtivo) : false;

    const novoPlanoNome = comprovantePix;
    const novoPlanoId = planoId;

    const updateData: any = {
      statusPagamento: 'Pendente Pix',
      ativo: manterAtivo,
      comprovanteData: new Date().toISOString(),
      motivoRejeicao: null
    };

    if (novoPlanoNome) {
      updateData.comprovantePix = novoPlanoNome;
      updateData.planoSolicitado = novoPlanoNome;
      if (typeof preco === 'number') {
        if (rest && rest.plano && rest.plano !== novoPlanoNome) {
          updateData.planoAnterior = rest.planoAnterior || rest.plano;
          updateData.planoIdAnterior = rest.planoIdAnterior || rest.planoId || null;
          updateData.statusPagamentoAnterior = rest.statusPagamentoAnterior || rest.statusPagamento || 'Confirmado Pix';
          updateData.ativoAnterior = rest.ativo;
        }
        updateData.plano = novoPlanoNome;
      }
    }

    if (novoPlanoId) {
      updateData.planoIdSolicitado = novoPlanoId;
      updateData.planoId = novoPlanoId;
    }

    if (observacoes) {
      updateData.observacoesComprovante = observacoes;
    }

    await updateDoc(ref, removerUndefined(updateData));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `restaurantes/${restauranteId}`);
    throw error;
  }
}

export async function aprovarAssinaturaSaas(
  restauranteId: string, 
  diasAdicionais: number = 30
): Promise<{ expiracaoPlano: string; diasRestantesAnteriores: number; totalDiasConcedidos: number }> {
  try {
    const ref = doc(db, 'restaurantes', restauranteId);
    const snap = await getDoc(ref);
    let diasRestantesAnteriores = 0;
    let rest: Restaurante | null = null;
    
    if (snap.exists()) {
      rest = snap.data() as Restaurante;
      if (rest.ativo && rest.statusPagamento !== 'Pendente Pix') {
        diasRestantesAnteriores = calcularDiasRestantesPlano(rest.expiracaoPlano, rest.criadoEm);
      }
    }
    
    const totalDias = diasRestantesAnteriores + diasAdicionais;
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + totalDias);

    const updateData: any = {
      statusPagamento: 'Confirmado Pix',
      ativo: true,
      expiracaoPlano: dataExpiracao.toISOString(),
      dataAprovacaoPix: new Date().toISOString(),
      motivoRejeicao: null,
      planoAnterior: null,
      planoIdAnterior: null,
      statusPagamentoAnterior: null,
      ativoAnterior: null,
      planoSolicitado: null,
      planoIdSolicitado: null
    };

    if (rest?.planoSolicitado) {
      updateData.plano = rest.planoSolicitado;
    }
    if (rest?.planoIdSolicitado) {
      updateData.planoId = rest.planoIdSolicitado;
    }

    await updateDoc(ref, removerUndefined(updateData));

    return {
      expiracaoPlano: dataExpiracao.toISOString(),
      diasRestantesAnteriores,
      totalDiasConcedidos: totalDias
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `restaurantes/${restauranteId}`);
    throw error;
  }
}

export async function rejeitarAssinaturaSaas(
  restauranteId: string, 
  motivoCustom?: string
): Promise<{ retornouPlanoAnterior: boolean; planoAnteriorNome?: string }> {
  try {
    const ref = doc(db, 'restaurantes', restauranteId);
    const snap = await getDoc(ref);
    const rest = snap.exists() ? (snap.data() as Restaurante) : null;

    if (!rest) {
      throw new Error('Restaurante não encontrado');
    }

    const tinhaPlanoAnterior = !!rest.planoAnterior;
    
    if (tinhaPlanoAnterior) {
      const planoAnteriorNome = rest.planoAnterior!;
      const motivo = motivoCustom || `Sua solicitação de mudança para o plano "${rest.planoSolicitado || rest.plano}" foi rejeitada pelo suporte. Seu restaurante foi mantido ativo no seu plano anterior ("${planoAnteriorNome}").`;

      await updateDoc(ref, removerUndefined({
        plano: rest.planoAnterior,
        planoId: rest.planoIdAnterior || rest.planoId,
        statusPagamento: rest.statusPagamentoAnterior || 'Confirmado Pix',
        ativo: rest.ativoAnterior ?? true,
        motivoRejeicao: motivo,
        planoAnterior: null,
        planoIdAnterior: null,
        statusPagamentoAnterior: null,
        ativoAnterior: null,
        planoSolicitado: null,
        planoIdSolicitado: null,
        comprovantePix: null,
        observacoesComprovante: null
      }));

      return { retornouPlanoAnterior: true, planoAnteriorNome };
    } else {
      const motivo = motivoCustom || 'Seu pagamento via Pix para ativação da conta foi rejeitado pelo suporte. Verifique seu comprovante ou entre em contato com o suporte.';

      await updateDoc(ref, removerUndefined({
        statusPagamento: 'Rejeitado Pix',
        ativo: false,
        motivoRejeicao: motivo,
        planoSolicitado: null,
        planoIdSolicitado: null,
        comprovantePix: null,
        observacoesComprovante: null
      }));

      return { retornouPlanoAnterior: false };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `restaurantes/${restauranteId}`);
    throw error;
  }
}

export async function limparMotivoRejeicao(restauranteId: string): Promise<void> {
  try {
    const ref = doc(db, 'restaurantes', restauranteId);
    await updateDoc(ref, { motivoRejeicao: null });
  } catch (error) {
    console.error('Erro ao limpar motivo de rejeição:', error);
  }
}

// ==========================================
// AVISOS E COMUNICADOS DO SISTEMA (GERAL SAAS)
// ==========================================

export async function salvarAvisoGeral(aviso: Partial<AvisoGeral> & { titulo: string; mensagem: string }): Promise<AvisoGeral> {
  try {
    const docRef = aviso.id ? doc(db, 'avisos_sistema', aviso.id) : doc(collection(db, 'avisos_sistema'));
    const novoAviso: AvisoGeral = {
      id: docRef.id,
      titulo: aviso.titulo.trim(),
      mensagem: aviso.mensagem.trim(),
      tipo: aviso.tipo || 'info',
      ativo: aviso.ativo ?? true,
      dataCriacao: aviso.dataCriacao || new Date().toISOString(),
      criadoPor: aviso.criadoPor || auth.currentUser?.email || 'Administrador',
      linkDestino: aviso.linkDestino ? aviso.linkDestino.trim() : '',
      textoBotao: aviso.textoBotao ? aviso.textoBotao.trim() : ''
    };

    await setDoc(docRef, removerUndefined(novoAviso), { merge: true });
    return novoAviso;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'avisos_sistema');
    throw error;
  }
}

export async function listarAvisosGerais(): Promise<AvisoGeral[]> {
  try {
    const snap = await getDocs(collection(db, 'avisos_sistema'));
    const lista: AvisoGeral[] = [];
    snap.forEach((docSnap) => {
      lista.push({
        ...(docSnap.data() as AvisoGeral),
        id: docSnap.id
      });
    });
    // Ordenar por data mais recente primeiro
    return lista.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'avisos_sistema');
    return [];
  }
}

export async function alternarStatusAvisoGeral(id: string, ativo: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'avisos_sistema', id), { ativo });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `avisos_sistema/${id}`);
    throw error;
  }
}

export async function excluirAvisoGeral(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'avisos_sistema', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `avisos_sistema/${id}`);
    throw error;
  }
}

export function escutarAvisosGeraisAtivos(callback: (avisos: AvisoGeral[]) => void): () => void {
  try {
    const q = query(
      collection(db, 'avisos_sistema'),
      where('ativo', '==', true)
    );
    return onSnapshot(q, (snap) => {
      const lista: AvisoGeral[] = [];
      snap.forEach((docSnap) => {
        lista.push({
          ...(docSnap.data() as AvisoGeral),
          id: docSnap.id
        });
      });
      lista.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
      callback(lista);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'avisos_sistema');
      callback([]);
    });
  } catch (error) {
    console.error('Erro ao escutar avisos gerais:', error);
    callback([]);
    return () => {};
  }
}



