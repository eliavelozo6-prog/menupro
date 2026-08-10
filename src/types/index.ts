export type TipoUsuario = 'admin' | 'restaurante' | 'cliente';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  restauranteId?: string;
  criadoEm?: string;
}

export interface Restaurante {
  id: string;
  nome: string;
  slug: string;
  logo?: string;
  logoUrl?: string;
  banner?: string;
  bannerUrl?: string;
  descricao?: string;
  categoria?: string;
  telefone?: string;
  whatsapp?: string;
  endereco?: string;
  horarioFuncionamento?: string;
  plano?: string;
  planoId?: string;
  planoAnterior?: string;
  planoIdAnterior?: string;
  planoSolicitado?: string;
  planoIdSolicitado?: string;
  statusPagamentoAnterior?: string;
  ativoAnterior?: boolean;
  motivoRejeicao?: string;
  expiracaoPlano?: string;
  statusPagamento?: 'Pendente Pix' | 'Confirmado Pix' | 'Gratuito' | 'Rejeitado Pix';
  comprovantePix?: string;
  comprovanteData?: string;
  dataAprovacaoPix?: string;
  chavePix?: string;
  titularPix?: string;
  email?: string;
  ativo: boolean;
  criadoEm?: string;
}

export interface VariacaoOpcao {
  id: string;
  nome: string;
  precoAdicional?: number;
}

export interface GrupoVariacao {
  id: string;
  titulo: string; // Ex: "Escolha o Sabor", "Tamanho", "Adicionais"
  obrigatorio?: boolean;
  minimo?: number; // Padrão 1 se obrigatório, 0 se opcional
  maximo?: number; // Padrão 1
  opcoes: VariacaoOpcao[];
}

export interface Produto {
  id: string;
  restauranteId: string;
  nome: string;
  descricao?: string;
  categoria: string;
  preco: number;
  imagem?: string;
  disponivel: boolean;
  destaque?: boolean;
  maisVendido?: boolean;
  badge?: 'mais_vendido' | 'promocao' | 'vegano' | 'chef' | string;
  ingredientes?: string;
  alergicos?: string;
  tempoPreparo?: string;
  variacoes?: GrupoVariacao[];
}

export interface VariacaoEscolhida {
  grupoId: string;
  grupoTitulo: string;
  opcaoId: string;
  opcaoNome: string;
  precoAdicional: number;
}

export interface PedidoItem {
  id: string;
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
  variacoesEscolhidas?: VariacaoEscolhida[];
}

export type StatusPedido = 
  | 'Novo pedido' 
  | 'Aceito' 
  | 'Preparando' 
  | 'Saiu para entrega' 
  | 'Finalizado' 
  | 'Cancelado';

export interface SolicitacaoCancelamento {
  solicitou: boolean;
  motivo?: string;
  data: string;
  status: 'pendente' | 'aceito' | 'recusado';
  respostaMotivo?: string;
}

export interface Pedido {
  id: string;
  restauranteId: string;
  clienteNome: string;
  telefone: string;
  endereco: string;
  bairro?: string;
  taxaEntrega?: number;
  tipoEntrega: 'entrega' | 'retirada' | 'mesa';
  numeroMesa?: string;
  statusComanda?: 'Aberta' | 'Fechada';
  formaPagamento: string;
  trocoPara?: string;
  produtos: PedidoItem[];
  valorTotal: number;
  cupomCodigo?: string;
  desconto?: number;
  avaliacaoNota?: number;
  avaliacaoComentario?: string;
  status: StatusPedido;
  solicitacaoCancelamento?: SolicitacaoCancelamento;
  observacao?: string;
  data: string;
}

export interface Mesa {
  id: string;
  restauranteId: string;
  numero: string; // ex: "01", "02", "Varanda 1"
  nome?: string;
  qrCodeUrl?: string;
  status: 'Livre' | 'Ocupada' | 'Aguardando Pagamento';
  criadoEm?: string;
}

export interface TaxaBairro {
  id: string;
  restauranteId: string;
  nomeBairro: string;
  taxa: number; // R$
  tempoEstimadoMinutos?: string; // ex: "30 - 40 min"
  ativo: boolean;
  criadoEm?: string;
}

export interface Avaliacao {
  id: string;
  restauranteId: string;
  pedidoId: string;
  clienteNome: string;
  nota: number; // 1 a 5
  comentario?: string;
  exibirNoCardapio?: boolean;
  data: string;
}

export interface Cupom {
  id: string;
  restauranteId: string;
  codigo: string; // ex: PRIMEIRACOMPRA10 (sempre caixa alta)
  tipo: 'porcentagem' | 'fixo';
  valor: number; // ex: 10 (%) ou 15.00 (R$)
  valorMinimo?: number; // valor minimo do pedido
  limiteUsos?: number;
  usosAtuais: number;
  validade?: string; // ISO String
  ativo: boolean;
  criadoEm?: string;
}

export interface Cliente {
  id: string;
  restauranteId: string;
  nome: string;
  telefone: string;
  endereco: string;
  totalPedidos: number;
  totalGasto: number;
  criadoEm?: string;
}

export interface Plano {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  limiteProdutos: number;
  diasDegustacao?: number;
  recursos: string[];
  ativo: boolean;
}

export interface ConfiguracoesSaas {
  chavePix: string;
  titularPix: string;
  bancoPix: string;
  tipoChave: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  whatsappSuporte?: string;
  instrucoesPix?: string;
  qrCodeUrl?: string;
}

export interface AvisoGeral {
  id: string;
  titulo: string;
  mensagem: string;
  tipo?: 'info' | 'novidade' | 'alerta' | 'manutencao';
  ativo: boolean;
  dataCriacao: string;
  criadoPor?: string;
  linkDestino?: string;
  textoBotao?: string;
}

