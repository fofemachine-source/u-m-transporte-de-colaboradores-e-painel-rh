export type StatusCadastro = 'Novo' | 'Rota sugerida' | 'Em análise' | 'Rota definida' | 'Inativo';

export interface PontoEmbarque {
  lat: number;
  lng: number;
  descricao: string;
}

export interface ColaboradorCadastro {
  id: string;
  protocolo: string;
  nome: string;
  matricula: string;
  telefone: string;
  endereco: string;
  bairro: string;
  cidade: string;
  turma: string;
  local: string;
  ponto?: string;
  pontoEmbarque?: PontoEmbarque | null;
  foto?: string | null;
  status: StatusCadastro;
  onibus?: string; // Linha selecionada / definida (ex: "ADM02", "LINHA-06")
  linhaId?: string; // ID da linha (ex: "ADM02")
  linhaSugeridaId?: string; // ID da linha sugerida
  obs?: string;
  consentimento: boolean;
  criadoEm: string;
  atualizadoEm?: string;
  demitidoEm?: string;
  motivoInativacao?: string;
  rotaSugerida?: string;
  rotaMotivo?: string;
  coord?: string;
}

export type AdminView = 'dashboard' | 'colaboradores' | 'rotas' | 'mapa' | 'solicitacoes' | 'escala_sabado' | 'relatorios';

export interface RotaLinha {
  id: string; // Ex: "ADM01", "LINHA-06-A"
  codigo: string; // Ex: "ADM01", "LINHA-06"
  nome: string; // Ex: "Palmares / Tropical / Betânia"
  turmas: string[]; // Ex: ["Administrativo"] ou ["Retaludamento — Turma A"]
  turma?: string; // Compatibilidade com código legado
  linha?: string; // Compatibilidade com código legado
  horarioInicio: string; // Ex: "04:25"
  horarioRetorno?: string; // Ex: "17:00"
  horario?: string; // Compatibilidade
  km: string; // Ex: "33,5 km"
  bairros: string[];
  ruas: string[];
  itinerario: string;
  bairrosExtras?: string;
  cor: string; // Ex: "#10b981", "#3b82f6"
  capacidade: number; // Padrão 44, editável
  coordenadas: [number, number][]; // [[lat, lng], ...]
  ativa: boolean;
  atualizadoEm?: string;
}

export interface SolicitacaoEndereco {
  id: string;
  colaboradorId: string;
  matricula: string;
  nomeColaborador: string;
  enderecoAtual: string;
  bairroAtual: string;
  cidadeAtual: string;
  linhaAtualId?: string;
  enderecoNovo: string;
  bairro: string;
  cidade: string;
  motivo: 'mudança de residência' | 'outro';
  dataVigencia: string;
  linhaSugeridaId?: string;
  observacao?: string;
  status: 'Pendente' | 'Aprovada' | 'Recusada';
  dataCriacao: string;
  respostaRH?: string;
}

export interface EscalaSabadoItem {
  id: string;
  colaboradorId?: string;
  nome: string;
  matricula: string;
  turma: string;
  bairro: string;
  rua?: string;
  endereco?: string;
  pontoEmbarque: string;
  linhaId: string; // Ex: "ADM01", "LINHA-06", etc.
  turno?: string;
  horarioEmbarque?: string;
  telefone?: string;
  observacao?: string; // OBS. do colaborador / ponto
}

export interface EscalaSabado {
  id: string;
  dataSabado: string; // Formato DD/MM/YYYY ou YYYY-MM-DD
  supervisorNome: string;
  supervisorTelefone?: string;
  status: 'Rascunho' | 'Enviada à Parvi' | 'Confirmada';
  observacoesGerais?: string;
  observacoesLinhas?: Record<string, string>; // OBS da barra da linha da escala
  criadoEm: string;
  atualizadoEm?: string;
  itens: EscalaSabadoItem[];
}

export interface SugestaoRotaResultado {
  encontrada: boolean;
  motivo: string;
  rotaId?: string;
  label?: string;
  codigo?: string;
  linha?: string;
  turma?: string;
  horario?: string;
  horarioInicio?: string;
  horarioRetorno?: string;
  km?: string;
  inicio?: string;
  itinerario?: string[];
  confianca?: 'alta' | 'média' | 'baixa';
  distanciaM?: number | null;
  alternativas?: Array<{ rotaId: string; label: string; codigo: string; pontos: number }>;
}

export interface NovoCadastroInput {
  nome: string;
  matricula: string;
  telefone: string;
  endereco: string;
  bairro: string;
  cidade: string;
  turma: string;
  local: string;
  ponto?: string;
  pontoEmbarque?: PontoEmbarque | null;
  foto?: string | null;
  status?: StatusCadastro;
  onibus?: string;
  linhaId?: string;
  linhaSugeridaId?: string;
  obs?: string;
  consentimento: boolean;
  rotaSugerida?: string;
  rotaMotivo?: string;
  coord?: string;
}

export interface FiltrosState {
  busca: string;
  turma: string;
  linha: string;
  status: string;
  bairro: string;
  ordem: 'recentes' | 'antigos' | 'nome' | 'bairro';
}
