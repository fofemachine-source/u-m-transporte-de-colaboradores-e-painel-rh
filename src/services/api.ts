import {
  ColaboradorCadastro,
  NovoCadastroInput,
  StatusCadastro,
  RotaLinha,
  SolicitacaoEndereco,
  EscalaSabado,
  SugestaoRotaResultado,
} from '../types';
import { ROTAS_INICIAIS, sugerirRota } from '../utils/motorRotas';
import { SEED_CADASTROS, SEED_SOLICITACOES, SEED_ESCALAS } from './storageSeed';

const STORAGE_KEYS = {
  CADASTROS: 'um_cadastros_db',
  ROTAS: 'um_rotas_db',
  SOLICITACOES: 'um_solicitacoes_db',
  ESCALAS: 'um_escalas_sabado_db',
  AUTH: 'um_auth_token',
};

// Helper para ler com seed inicial
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Erro ao ler ${key} do localStorage:`, err);
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Erro ao salvar ${key} no localStorage:`, err);
  }
}

export const lerFotoArquivo = (arquivo: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!arquivo) return resolve('');
    if (!arquivo.type.startsWith('image/')) {
      return reject(new Error('Por favor, selecione um arquivo de imagem válido (JPG, PNG).'));
    }

    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      const maxDim = 800;
      const esc = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * esc);
      canvas.height = Math.round(img.height * esc);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Falha ao processar canvas da imagem.'));
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível carregar a imagem. Tente outra foto.'));
    };

    img.src = url;
  });
};

// ==========================================
// CADASTROS DE COLABORADORES
// ==========================================
export async function fetchCadastros(): Promise<ColaboradorCadastro[]> {
  try {
    const res = await fetch('/api/cadastros');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.registros)) {
        setLocal(STORAGE_KEYS.CADASTROS, data.registros);
        return data.registros;
      }
    }
  } catch {
    // Modo estático / offline fallback
  }
  return getLocal<ColaboradorCadastro[]>(STORAGE_KEYS.CADASTROS, SEED_CADASTROS);
}

export async function criarCadastro(payload: NovoCadastroInput): Promise<{ protocolo: string; registro: ColaboradorCadastro }> {
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const aleatorio = Math.floor(1000 + Math.random() * 9000);
  const protocolo = `UM${agora.getFullYear().toString().slice(-2)}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}-${aleatorio}`;
  const id = `CAD-${Date.now().toString().slice(-6)}`;

  const novo: ColaboradorCadastro = {
    ...payload,
    id,
    protocolo,
    status: (payload.status as StatusCadastro) || 'Novo',
    criadoEm: dataFormatada,
  };

  // Tenta sync com API se disponível
  try {
    const res = await fetch('/api/cadastros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      const listaAtual = getLocal<ColaboradorCadastro[]>(STORAGE_KEYS.CADASTROS, SEED_CADASTROS);
      setLocal(STORAGE_KEYS.CADASTROS, [data.registro, ...listaAtual]);
      return data;
    }
  } catch {
    // Continua com salvamento local
  }

  const lista = getLocal<ColaboradorCadastro[]>(STORAGE_KEYS.CADASTROS, SEED_CADASTROS);
  const atualizada = [novo, ...lista];
  setLocal(STORAGE_KEYS.CADASTROS, atualizada);
  return { protocolo, registro: novo };
}

export async function atualizarCadastro(id: string, updates: Partial<ColaboradorCadastro>): Promise<ColaboradorCadastro> {
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  try {
    const res = await fetch(`/api/cadastros/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      const lista = getLocal<ColaboradorCadastro[]>(STORAGE_KEYS.CADASTROS, SEED_CADASTROS);
      const idx = lista.findIndex((c) => c.id === id);
      if (idx !== -1) {
        lista[idx] = data.registro;
        setLocal(STORAGE_KEYS.CADASTROS, lista);
      }
      return data.registro;
    }
  } catch {
    // Fallback local
  }

  const lista = getLocal<ColaboradorCadastro[]>(STORAGE_KEYS.CADASTROS, SEED_CADASTROS);
  const idx = lista.findIndex((c) => c.id === id);
  if (idx === -1) {
    throw new Error('Colaborador não encontrado.');
  }

  const atualizado: ColaboradorCadastro = {
    ...lista[idx],
    ...updates,
    id: lista[idx].id,
    protocolo: lista[idx].protocolo,
    criadoEm: lista[idx].criadoEm,
    atualizadoEm: dataFormatada,
  };

  if (updates.pontoEmbarque?.descricao) {
    atualizado.ponto = updates.pontoEmbarque.descricao;
  }

  lista[idx] = atualizado;
  setLocal(STORAGE_KEYS.CADASTROS, lista);
  return atualizado;
}

export async function alterarStatus(id: string, status: StatusCadastro): Promise<ColaboradorCadastro> {
  return atualizarCadastro(id, { status });
}

export async function excluirCadastro(id: string): Promise<void> {
  try {
    await fetch(`/api/cadastros/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch {
    // ignore
  }

  const lista = getLocal<ColaboradorCadastro[]>(STORAGE_KEYS.CADASTROS, SEED_CADASTROS);
  const filtrada = lista.filter((c) => c.id !== id);
  setLocal(STORAGE_KEYS.CADASTROS, filtrada);
}

export async function recalcularRotaColaborador(id: string): Promise<{ registro: ColaboradorCadastro; sugestao: SugestaoRotaResultado }> {
  const lista = getLocal<ColaboradorCadastro[]>(STORAGE_KEYS.CADASTROS, SEED_CADASTROS);
  const item = lista.find((c) => c.id === id);
  if (!item) throw new Error('Colaborador não encontrado.');

  const rotas = await fetchRotas();
  const sugestao = sugerirRota({ endereco: item.endereco, bairro: item.bairro, turma: item.turma }, rotas);

  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const atualizado: ColaboradorCadastro = {
    ...item,
    linhaSugeridaId: sugestao.rotaId || item.linhaSugeridaId,
    rotaSugerida: sugestao.encontrada ? sugestao.label : item.rotaSugerida,
    rotaMotivo: sugestao.motivo || '',
    onibus: sugestao.encontrada ? sugestao.codigo || item.onibus : item.onibus,
    linhaId: sugestao.rotaId || item.linhaId,
    status: item.status === 'Novo' && sugestao.encontrada ? 'Rota sugerida' : item.status,
    atualizadoEm: dataFormatada,
  };

  const idx = lista.findIndex((c) => c.id === id);
  lista[idx] = atualizado;
  setLocal(STORAGE_KEYS.CADASTROS, lista);

  try {
    await fetch(`/api/cadastros/${encodeURIComponent(id)}/recalcular-rota`, { method: 'POST' });
  } catch {
    // ignore
  }

  return { registro: atualizado, sugestao };
}

// ==========================================
// LINHAS E ROTAS
// ==========================================
export async function fetchRotas(): Promise<RotaLinha[]> {
  try {
    const res = await fetch('/api/rotas');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.rotas) && data.rotas.length > 0) {
        setLocal(STORAGE_KEYS.ROTAS, data.rotas);
        return data.rotas;
      }
    }
  } catch {
    // Fallback local
  }
  return getLocal<RotaLinha[]>(STORAGE_KEYS.ROTAS, ROTAS_INICIAIS);
}

export async function salvarRota(rota: Partial<RotaLinha>): Promise<RotaLinha> {
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const codigo = (rota.codigo || rota.linha || 'NOVA').trim().toUpperCase();
  const nome = (rota.nome || `Linha ${codigo}`).trim();
  const turmas = Array.isArray(rota.turmas) && rota.turmas.length > 0 ? rota.turmas : [rota.turma || 'Administrativo'];

  try {
    const url = rota.id ? `/api/rotas/${encodeURIComponent(rota.id)}` : '/api/rotas';
    const res = await fetch(url, {
      method: rota.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rota),
    });
    if (res.ok) {
      const data = await res.json();
      const lista = getLocal<RotaLinha[]>(STORAGE_KEYS.ROTAS, ROTAS_INICIAIS);
      const idx = lista.findIndex((r) => r.id === data.rota.id);
      if (idx !== -1) lista[idx] = data.rota;
      else lista.unshift(data.rota);
      setLocal(STORAGE_KEYS.ROTAS, lista);
      return data.rota;
    }
  } catch {
    // Fallback local
  }

  const lista = getLocal<RotaLinha[]>(STORAGE_KEYS.ROTAS, ROTAS_INICIAIS);
  if (rota.id) {
    const idx = lista.findIndex((r) => r.id === rota.id);
    if (idx !== -1) {
      const atualizada: RotaLinha = {
        ...lista[idx],
        ...rota,
        codigo,
        nome,
        turmas,
        turma: turmas[0] || 'Administrativo',
        capacidade: Number(rota.capacidade) || lista[idx].capacidade || 44,
        atualizadoEm: dataFormatada,
      };
      lista[idx] = atualizada;
      setLocal(STORAGE_KEYS.ROTAS, lista);
      return atualizada;
    }
  }

  const id = rota.id || codigo;
  const novaRota: RotaLinha = {
    id,
    codigo,
    nome,
    turmas,
    turma: turmas[0] || 'Administrativo',
    linha: codigo,
    horarioInicio: rota.horarioInicio || '04:30',
    horarioRetorno: rota.horarioRetorno || '17:00',
    km: rota.km || '20 km',
    bairros: rota.bairros || [],
    ruas: rota.ruas || [],
    itinerario: rota.itinerario || '',
    cor: rota.cor || '#10b981',
    capacidade: Number(rota.capacidade) || 44,
    coordenadas: rota.coordenadas || [[-6.0674, -49.9044]],
    ativa: rota.ativa !== undefined ? rota.ativa : true,
    atualizadoEm: dataFormatada,
  };

  lista.unshift(novaRota);
  setLocal(STORAGE_KEYS.ROTAS, lista);
  return novaRota;
}

export async function excluirRota(id: string): Promise<void> {
  try {
    await fetch(`/api/rotas/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch {
    // ignore
  }

  const lista = getLocal<RotaLinha[]>(STORAGE_KEYS.ROTAS, ROTAS_INICIAIS);
  const filtrada = lista.filter((r) => r.id !== id && r.codigo !== id);
  setLocal(STORAGE_KEYS.ROTAS, filtrada);
}

// ==========================================
// SOLICITAÇÕES DE MUDANÇA DE ENDEREÇO
// ==========================================
export async function fetchSolicitacoes(): Promise<SolicitacaoEndereco[]> {
  try {
    const res = await fetch('/api/solicitacoes');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.solicitacoes)) {
        setLocal(STORAGE_KEYS.SOLICITACOES, data.solicitacoes);
        return data.solicitacoes;
      }
    }
  } catch {
    // Fallback local
  }
  return getLocal<SolicitacaoEndereco[]>(STORAGE_KEYS.SOLICITACOES, SEED_SOLICITACOES);
}

export async function criarSolicitacaoEndereco(payload: {
  colaboradorId: string;
  matricula?: string;
  enderecoNovo: string;
  bairro: string;
  cidade: string;
  motivo: 'mudança de residência' | 'outro';
  dataVigencia: string;
  observacao?: string;
}): Promise<{ solicitacao: SolicitacaoEndereco; sugestao: SugestaoRotaResultado }> {
  const cadastros = await fetchCadastros();
  const colab = cadastros.find((c) => c.id === payload.colaboradorId || c.matricula === payload.matricula);
  if (!colab) throw new Error('Colaborador não localizado.');

  const rotas = await fetchRotas();
  const sugestao = sugerirRota({ endereco: payload.enderecoNovo, bairro: payload.bairro, turma: colab.turma }, rotas);

  const agora = new Date();
  const dataStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const id = `SOL-${Date.now().toString().slice(-6)}`;

  const nova: SolicitacaoEndereco = {
    id,
    colaboradorId: colab.id,
    matricula: colab.matricula,
    nomeColaborador: colab.nome,
    enderecoAtual: colab.endereco,
    bairroAtual: colab.bairro,
    cidadeAtual: colab.cidade,
    linhaAtualId: colab.linhaId || colab.onibus || '',
    enderecoNovo: String(payload.enderecoNovo).trim(),
    bairro: String(payload.bairro).trim(),
    cidade: String(payload.cidade || 'Parauapebas').trim(),
    motivo: payload.motivo || 'mudança de residência',
    dataVigencia: payload.dataVigencia || agora.toLocaleDateString('pt-BR'),
    linhaSugeridaId: sugestao.rotaId || '',
    observacao: payload.observacao || '',
    status: 'Pendente',
    dataCriacao: dataStr,
  };

  try {
    const res = await fetch('/api/solicitacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      const lista = getLocal<SolicitacaoEndereco[]>(STORAGE_KEYS.SOLICITACOES, SEED_SOLICITACOES);
      setLocal(STORAGE_KEYS.SOLICITACOES, [data.solicitacao, ...lista]);
      return data;
    }
  } catch {
    // Fallback local
  }

  const lista = getLocal<SolicitacaoEndereco[]>(STORAGE_KEYS.SOLICITACOES, SEED_SOLICITACOES);
  setLocal(STORAGE_KEYS.SOLICITACOES, [nova, ...lista]);
  return { solicitacao: nova, sugestao };
}

export async function responderSolicitacaoEndereco(
  id: string,
  status: 'Aprovada' | 'Recusada',
  respostaRH?: string
): Promise<SolicitacaoEndereco> {
  const lista = getLocal<SolicitacaoEndereco[]>(STORAGE_KEYS.SOLICITACOES, SEED_SOLICITACOES);
  const idx = lista.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Solicitação não encontrada.');

  const sol = { ...lista[idx], status, respostaRH: respostaRH || '' };
  lista[idx] = sol;
  setLocal(STORAGE_KEYS.SOLICITACOES, lista);

  // Se aprovou, atualiza o cadastro do colaborador automaticamente!
  if (status === 'Aprovada') {
    const cadastros = getLocal<ColaboradorCadastro[]>(STORAGE_KEYS.CADASTROS, SEED_CADASTROS);
    const colabIdx = cadastros.findIndex((c) => c.id === sol.colaboradorId);
    if (colabIdx !== -1) {
      const rotas = await fetchRotas();
      const novaLinha = rotas.find((r) => r.id === sol.linhaSugeridaId);
      cadastros[colabIdx] = {
        ...cadastros[colabIdx],
        endereco: sol.enderecoNovo,
        bairro: sol.bairro,
        cidade: sol.cidade,
        linhaId: sol.linhaSugeridaId || cadastros[colabIdx].linhaId,
        onibus: novaLinha ? novaLinha.codigo : cadastros[colabIdx].onibus,
        status: 'Em análise',
        ponto: 'Ponto em redefinição pelo RH',
        pontoEmbarque: null,
        obs: `${cadastros[colabIdx].obs ? cadastros[colabIdx].obs + ' | ' : ''}Mudança de endereço aprovada em ${new Date().toLocaleDateString('pt-BR')}`,
        atualizadoEm: new Date().toLocaleDateString('pt-BR'),
      };
      setLocal(STORAGE_KEYS.CADASTROS, cadastros);
    }
  }

  try {
    await fetch(`/api/solicitacoes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, respostaRH }),
    });
  } catch {
    // ignore
  }

  return sol;
}

// ==========================================
// ESCALA DE SÁBADO (Supervisores & Parvi)
// ==========================================
export async function fetchEscalasSabado(): Promise<EscalaSabado[]> {
  try {
    const res = await fetch('/api/escala-sabado');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.escalas)) {
        setLocal(STORAGE_KEYS.ESCALAS, data.escalas);
        return data.escalas;
      }
    }
  } catch {
    // Fallback local
  }
  return getLocal<EscalaSabado[]>(STORAGE_KEYS.ESCALAS, SEED_ESCALAS);
}

export async function salvarEscalaSabado(escala: Partial<EscalaSabado>): Promise<EscalaSabado> {
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const id = escala.id || `ESC-${Date.now().toString(36).toUpperCase()}`;

  const lista = getLocal<EscalaSabado[]>(STORAGE_KEYS.ESCALAS, SEED_ESCALAS);
  const idx = lista.findIndex((e) => e.id === id);

  const novaOuAtualizada: EscalaSabado = {
    ...(idx !== -1 ? lista[idx] : {}),
    ...escala,
    id,
    dataSabado: String(escala.dataSabado || '08/11/2026').trim(),
    supervisorNome: String(escala.supervisorNome || 'Supervisor U&M').trim(),
    status: escala.status || 'Enviada à Parvi',
    itens: Array.isArray(escala.itens) ? escala.itens : [],
    atualizadoEm: dataFormatada,
    criadoEm: idx !== -1 ? lista[idx].criadoEm : dataFormatada,
  };

  if (idx !== -1) {
    lista[idx] = novaOuAtualizada;
  } else {
    lista.unshift(novaOuAtualizada);
  }
  setLocal(STORAGE_KEYS.ESCALAS, lista);

  try {
    const url = escala.id ? `/api/escala-sabado/${encodeURIComponent(escala.id)}` : '/api/escala-sabado';
    await fetch(url, {
      method: escala.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaOuAtualizada),
    });
  } catch {
    // ignore
  }

  return novaOuAtualizada;
}

export async function excluirEscalaSabado(id: string): Promise<void> {
  try {
    await fetch(`/api/escala-sabado/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch {
    // ignore
  }

  const lista = getLocal<EscalaSabado[]>(STORAGE_KEYS.ESCALAS, SEED_ESCALAS);
  const filtrada = lista.filter((e) => e.id !== id);
  setLocal(STORAGE_KEYS.ESCALAS, filtrada);
}

// ==========================================
// AUTENTICAÇÃO ADMIN
// ==========================================
export async function loginAdmin(senha: string, usuario: string = 'admin'): Promise<{ token: string; usuario: { nome: string; role: string } }> {
  const userValido = !usuario || String(usuario).trim().toLowerCase() === 'admin' || String(usuario).trim().toLowerCase() === 'rh';
  const senhaValida = senha === '123' || senha === 'admin123' || senha === 'admin' || senha === 'rh2026';

  if (userValido && senhaValida) {
    const token = `token_rh_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    setLocal(STORAGE_KEYS.AUTH, token);
    return {
      token,
      usuario: { nome: 'Administrador (RH)', role: 'admin' },
    };
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha }),
    });
    if (res.ok) {
      return res.json();
    }
  } catch {
    // ignore
  }

  throw new Error('Usuário ou senha incorretos. Use usuário: admin e senha: 123');
}

// ==========================================
// DOWNLOADS DE PLANILHAS CSV NO CLIENTE (Compatível com Deploy Estático)
// ==========================================
const triggerDownload = (conteudoCsv: string, nomeArquivo: string) => {
  const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export function baixarCsvEscalaSabado(escala: EscalaSabado) {
  const headers = [
    'Data do Sábado',
    'Supervisor U&M',
    'Contato Supervisor',
    'Linha do Ônibus',
    'OBS da Linha',
    'Nome do Colaborador',
    'Matrícula',
    'Bairro',
    'Rua',
    'Ponto de Embarque',
    'OBS. (Observações)',
  ];

  const escapeCsv = (val: unknown) => `"${String(val == null ? '' : val).replace(/"/g, '""')}"`;
  const rows = (escala.itens || []).map((item) =>
    [
      escala.dataSabado,
      escala.supervisorNome,
      escala.supervisorTelefone || '',
      item.linhaId,
      escala.observacoesLinhas?.[item.linhaId] || '',
      item.nome,
      item.matricula,
      item.bairro,
      item.rua || item.endereco || '',
      item.pontoEmbarque,
      item.observacao || '',
    ]
      .map(escapeCsv)
      .join(';')
  );

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
  triggerDownload(csvContent, `escala_sabado_parvi_${escala.dataSabado.replace(/[\/\\]/g, '-')}.csv`);
}

export function baixarCsvColaboradores(cadastros: ColaboradorCadastro[]) {
  const headers = [
    'ID',
    'Protocolo',
    'Nome',
    'Matrícula',
    'Telefone',
    'Endereço',
    'Bairro',
    'Cidade',
    'Turma/Setor',
    'Local Trabalho',
    'Ponto Embarque (Definido RH)',
    'Status',
    'Linha Código',
    'Linha Sugerida (Auto)',
    'Por Que Essa Rota',
    'Observações',
    'Data Cadastro',
  ];

  const escapeCsv = (val: unknown) => `"${String(val == null ? '' : val).replace(/"/g, '""')}"`;
  const rows = cadastros.map((c) =>
    [
      c.id,
      c.protocolo,
      c.nome,
      c.matricula,
      c.telefone,
      c.endereco,
      c.bairro,
      c.cidade,
      c.turma,
      c.local,
      c.pontoEmbarque?.descricao || c.ponto || 'Pendente RH',
      c.status,
      c.onibus || '',
      c.rotaSugerida || '',
      c.rotaMotivo || '',
      c.obs || '',
      c.criadoEm,
    ]
      .map(escapeCsv)
      .join(';')
  );

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
  triggerDownload(csvContent, `transporte_colaboradores_u_m_${Date.now()}.csv`);
}

export function baixarCsvOcupacao(rotas: RotaLinha[], cadastros: ColaboradorCadastro[]) {
  const headers = ['Código Linha', 'Nome da Linha', 'Turma', 'Horário Início', 'Km', 'Capacidade', 'Colaboradores Ativos', 'Vagas Disponíveis', 'Percentual Ocupação (%)', 'Status'];
  const escapeCsv = (val: unknown) => `"${String(val == null ? '' : val).replace(/"/g, '""')}"`;
  const rows = rotas.map((r) => {
    const ocupadas = cadastros.filter((c) => c.status !== 'Inativo' && (c.linhaId === r.id || c.onibus === r.codigo)).length;
    const disponiveis = Math.max(0, r.capacidade - ocupadas);
    const percent = Math.round((ocupadas / r.capacidade) * 100);
    const status = ocupadas >= r.capacidade ? 'LOTADA' : `${percent}% ocupado`;
    return [
      r.codigo,
      r.nome,
      (r.turmas || [r.turma || 'Administrativo']).join(' / '),
      r.horarioInicio,
      r.km,
      r.capacidade,
      ocupadas,
      disponiveis,
      `${percent}%`,
      status,
    ]
      .map(escapeCsv)
      .join(';');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
  triggerDownload(csvContent, `ocupacao_rotas_u_m_${Date.now()}.csv`);
}

export function baixarCsvDemissoes(cadastros: ColaboradorCadastro[]) {
  const demitidos = cadastros.filter((c) => c.status === 'Inativo');
  const headers = ['Matrícula', 'Nome', 'Linha Cancelada', 'Ponto Desativado', 'Data Demissão', 'Motivo', 'Cidade/Bairro'];
  const escapeCsv = (val: unknown) => `"${String(val == null ? '' : val).replace(/"/g, '""')}"`;
  const rows = demitidos.map((c) =>
    [
      c.matricula,
      c.nome,
      c.linhaId || c.onibus || '',
      c.pontoEmbarque?.descricao || c.ponto || '',
      c.demitidoEm || c.atualizadoEm || '',
      c.motivoInativacao || 'Desligamento',
      `${c.cidade} - ${c.bairro}`,
    ]
      .map(escapeCsv)
      .join(';')
  );

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
  triggerDownload(csvContent, `inativacoes_transporte_u_m_${Date.now()}.csv`);
}
