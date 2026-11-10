import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { ROTAS_INICIAIS, sugerirRota, PORTARIA_PEBA } from './src/utils/motorRotas.js';
import { RotaLinha, StatusCadastro, ColaboradorCadastro, SolicitacaoEndereco } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = Number(process.argv[portArgIndex + 1]);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // In Cloud Run containers PORT is set to 8080 for NGINX. Dev server MUST listen on 3000.
  if (process.env.PORT && process.env.PORT !== '8080') {
    const parsed = Number(process.env.PORT);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}

function getHost(): string {
  const hostArgIndex = process.argv.indexOf('--host');
  if (hostArgIndex !== -1 && process.argv[hostArgIndex + 1]) {
    return process.argv[hostArgIndex + 1];
  }
  return process.env.HOST || '0.0.0.0';
}

const PORT = getPort();
const HOST = getHost();
const DEFAULT_DATA_DIR = path.join(__dirname, 'data');
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'um-data') : DEFAULT_DATA_DIR;
const DATA_FILE = path.join(DATA_DIR, 'cadastros.json');
const ROTAS_FILE = path.join(DATA_DIR, 'rotas.json');
const SOLICITACOES_FILE = path.join(DATA_DIR, 'solicitacoes.json');
const ESCALAS_SABADO_FILE = path.join(DATA_DIR, 'escalas_sabado.json');

import { EscalaSabado, EscalaSabadoItem } from './src/types.js';

const SEED_ESCALAS_SABADO: EscalaSabado[] = [
  {
    id: 'ESC-20261108',
    dataSabado: '08/11/2026',
    supervisorNome: 'Rodrigo Fontes (Supervisor de Campo)',
    supervisorTelefone: '(94) 99201-4455',
    status: 'Enviada à Parvi',
    observacoesGerais: 'Escala de reforço operacional para sábado. Frota Parvi autorizada para embarque dos colaboradores listados.',
    observacoesLinhas: {
      ADM01: 'Desembarque no Portão 02 PeBa às 05:40',
      ADM02: 'Aguardar liberação de crachá na portaria',
      'LINHA-06': 'Apoio direto à frente de lavra Mina N4',
    },
    criadoEm: '06/11/2026 15:30',
    itens: [
      {
        id: 'ESC-ITEM-1',
        colaboradorId: 'CAD-1001',
        nome: 'Carlos Eduardo Oliveira Silva',
        matricula: 'UM-74291',
        turma: 'Administrativo',
        bairro: 'Cidade Nova',
        rua: 'Rua A, 210',
        endereco: 'Rua A, 210',
        pontoEmbarque: 'Supermercado Líder - Cidade Nova',
        linhaId: 'ADM01',
        turno: 'Diurno Especial (07:00 às 17:00)',
        horarioEmbarque: '04:35',
        telefone: '(94) 99182-3401',
        observacao: 'Equipe de apoio e apontamento de produção',
      },
      {
        id: 'ESC-ITEM-2',
        colaboradorId: 'CAD-1002',
        nome: 'Juliana Mendes Santos',
        matricula: 'UM-83104',
        turma: 'Administrativo',
        bairro: 'Liberdade',
        rua: 'Rua Santa Catarina, 1420',
        endereco: 'Rua Santa Catarina, 1420',
        pontoEmbarque: 'Farmácia Pague Menos - Rua Santa Catarina',
        linhaId: 'ADM03',
        turno: 'Diurno Especial (07:00 às 17:00)',
        horarioEmbarque: '04:40',
        telefone: '(94) 98411-9022',
        observacao: 'Atendimento do plantão operacional',
      },
      {
        id: 'ESC-ITEM-3',
        colaboradorId: 'CAD-1003',
        nome: 'Marcos Vinicius de Souza',
        matricula: 'UM-61902',
        turma: 'Administrativo',
        bairro: 'Nova Carajás',
        rua: 'Rua C42, Casinhas',
        endereco: 'Rua C42, Casinhas',
        pontoEmbarque: 'Entrada das Casinhas Nova Carajás',
        linhaId: 'ADM02',
        turno: 'Diurno Especial (07:00 às 17:00)',
        horarioEmbarque: '04:45',
        telefone: '(94) 99233-1189',
        observacao: 'Oficina Central de Frotas / Mecânica pesada',
      },
      {
        id: 'ESC-ITEM-4',
        colaboradorId: 'CAD-1004',
        nome: 'Fabiana Rocha Lima',
        matricula: 'UM-91203',
        turma: 'Retaludamento — Turma A',
        bairro: 'Tropical',
        rua: 'Av. Jatobá, 450',
        endereco: 'Av. Jatobá, 450',
        pontoEmbarque: 'Panificadora Pão Dourado - Av. Jatobá',
        linhaId: 'LINHA-06',
        turno: 'Operação Mina N4 (06:00 às 16:00)',
        horarioEmbarque: '04:20',
        telefone: '(94) 99312-7788',
        observacao: 'Operação de escavadeira na frente de lavra',
      },
      {
        id: 'ESC-ITEM-5',
        colaboradorId: 'CAD-1006',
        nome: 'Leandro Pereira Gomes',
        matricula: 'UM-44021',
        turma: 'Retaludamento — Turma D',
        bairro: 'Palmares II',
        rua: 'Av. Tancredo Neves, 12',
        endereco: 'Av. Tancredo Neves, 12',
        pontoEmbarque: 'Praça Principal Palmares II',
        linhaId: 'LINHA-07',
        turno: 'Operação Mina N4 (06:00 às 16:00)',
        horarioEmbarque: '04:15',
        telefone: '(94) 98111-2233',
        observacao: 'Operação de caminhão fora-de-estrada',
      }
    ]
  }
];

const SEED_DATA: ColaboradorCadastro[] = [
  {
    id: 'CAD-1001',
    protocolo: 'UM261102-8841',
    nome: 'Carlos Eduardo Oliveira Silva',
    matricula: 'UM-74291',
    telefone: '(94) 99182-3401',
    endereco: 'Rua A, 210',
    bairro: 'Cidade Nova',
    cidade: 'Parauapebas',
    turma: 'Administrativo',
    local: 'Mina N4E - Operações',
    ponto: 'Supermercado Líder - Cidade Nova',
    pontoEmbarque: { lat: -6.0682, lng: -49.9045, descricao: 'Supermercado Líder - Cidade Nova' },
    foto: null,
    status: 'Rota definida',
    onibus: 'ADM01',
    linhaId: 'ADM01',
    linhaSugeridaId: 'ADM01',
    rotaSugerida: 'ADM01 • Palmares / Tropical / Betânia',
    rotaMotivo: 'Atende o bairro Cidade Nova',
    obs: 'Embarque confirmado no turno matutino das 04:25.',
    consentimento: true,
    criadoEm: '02/11/2026 08:30',
  },
  {
    id: 'CAD-1002',
    protocolo: 'UM261103-8854',
    nome: 'Juliana Mendes Santos',
    matricula: 'UM-83104',
    telefone: '(94) 98411-9022',
    endereco: 'Rua Santa Catarina, 1420',
    bairro: 'Liberdade',
    cidade: 'Parauapebas',
    turma: 'Administrativo',
    local: 'Escritório Central U&M',
    ponto: 'Farmácia Pague Menos - Rua Santa Catarina',
    pontoEmbarque: { lat: -6.0520, lng: -49.8890, descricao: 'Farmácia Pague Menos - Rua Santa Catarina' },
    foto: null,
    status: 'Rota definida',
    onibus: 'ADM03',
    linhaId: 'ADM03',
    linhaSugeridaId: 'ADM03',
    rotaSugerida: 'ADM03 • Liberdade e Região Central',
    rotaMotivo: 'Atende o bairro Liberdade e passa na R. Santa Catarina',
    obs: 'Linha definida. Ponto na esquina da farmácia.',
    consentimento: true,
    criadoEm: '03/11/2026 07:15',
  },
  {
    id: 'CAD-1003',
    protocolo: 'UM261103-8877',
    nome: 'Marcos Vinicius de Souza',
    matricula: 'UM-61902',
    telefone: '(94) 99233-1189',
    endereco: 'Rua C42, Casinhas',
    bairro: 'Nova Carajás',
    cidade: 'Parauapebas',
    turma: 'Administrativo',
    local: 'Oficina Central de Frotas',
    ponto: 'Entrada das Casinhas Nova Carajás',
    pontoEmbarque: { lat: -6.0890, lng: -49.9520, descricao: 'Entrada das Casinhas Nova Carajás' },
    foto: null,
    status: 'Rota definida',
    onibus: 'ADM02',
    linhaId: 'ADM02',
    linhaSugeridaId: 'ADM02',
    rotaSugerida: 'ADM02 • Nova Carajás / Amazonas / Linha Verde',
    rotaMotivo: 'Atende o bairro Nova Carajás e passa na Rua C42',
    obs: 'Ponto ajustado.',
    consentimento: true,
    criadoEm: '03/11/2026 09:40',
  },
  {
    id: 'CAD-1004',
    protocolo: 'UM261103-8890',
    nome: 'Fabiana Rocha Lima',
    matricula: 'UM-91203',
    telefone: '(94) 99312-7788',
    endereco: 'Av. Jatobá, 450',
    bairro: 'Tropical',
    cidade: 'Parauapebas',
    turma: 'Retaludamento — Turma A',
    local: 'Terraplenagem Mina N4',
    ponto: 'Panificadora Pão Dourado',
    pontoEmbarque: { lat: -6.0640, lng: -49.8820, descricao: 'Panificadora Pão Dourado - Av. Jatobá' },
    foto: null,
    status: 'Rota definida',
    onibus: 'LINHA-06',
    linhaId: 'LINHA-06-A',
    linhaSugeridaId: 'LINHA-06-A',
    rotaSugerida: 'LINHA-06 • LINHA-06 (Turma A)',
    rotaMotivo: 'Atende o bairro Tropical e passa na Av. Jatobá',
    obs: 'Rota ativa no Retaludamento A.',
    consentimento: true,
    criadoEm: '03/11/2026 10:20',
  },
  {
    id: 'CAD-1005',
    protocolo: 'UM261101-8898',
    nome: 'Roberto Alves de Almeida',
    matricula: 'UM-55120',
    telefone: '(94) 99190-7711',
    endereco: 'Av. Potiguar, 30',
    bairro: 'Parque dos Carajás',
    cidade: 'Parauapebas',
    turma: 'Retaludamento — Turma B',
    local: 'Terraplenagem N5',
    ponto: '',
    pontoEmbarque: null,
    foto: null,
    status: 'Em análise',
    onibus: 'LINHA-06',
    linhaId: 'LINHA-06-B',
    linhaSugeridaId: 'LINHA-06-B',
    rotaSugerida: 'LINHA-06 • LINHA-06 (Turma B)',
    rotaMotivo: 'Atende o bairro Parque dos Carajás e passa na Av. Potiguar',
    obs: 'Aguardando definição exata do ponto de embarque pelo RH no mapa.',
    consentimento: true,
    criadoEm: '01/11/2026 16:50',
  },
  {
    id: 'CAD-1006',
    protocolo: 'UM261104-1234',
    nome: 'Leandro Pereira Gomes',
    matricula: 'UM-44021',
    telefone: '(94) 98111-2233',
    endereco: 'Av. Tancredo Neves, 12',
    bairro: 'Palmares II',
    cidade: 'Parauapebas',
    turma: 'Retaludamento — Turma D',
    local: 'Frente de Mina',
    ponto: 'Praça Principal Palmares II',
    pontoEmbarque: { lat: -6.0210, lng: -49.8450, descricao: 'Praça Principal Palmares II' },
    foto: null,
    status: 'Rota definida',
    onibus: 'LINHA-07',
    linhaId: 'LINHA-07-D',
    linhaSugeridaId: 'LINHA-07-D',
    rotaSugerida: 'LINHA-07 • LINHA-07 (Turma D)',
    rotaMotivo: 'Atende o bairro Palmares II e passa na Av. Tancredo Neves',
    obs: 'Linha direta Palmares II.',
    consentimento: true,
    criadoEm: '04/11/2026 11:10',
  }
];

const SEED_SOLICITACOES: SolicitacaoEndereco[] = [
  {
    id: 'SOL-101',
    colaboradorId: 'CAD-1005',
    matricula: 'UM-55120',
    nomeColaborador: 'Roberto Alves de Almeida',
    enderecoAtual: 'Av. Potiguar, 30',
    bairroAtual: 'Parque dos Carajás',
    cidadeAtual: 'Parauapebas',
    linhaAtualId: 'LINHA-06-B',
    enderecoNovo: 'Rua Castilho França, 80',
    bairro: 'VS-10',
    cidade: 'Parauapebas',
    motivo: 'mudança de residência',
    dataVigencia: '10/11/2026',
    linhaSugeridaId: 'LINHA-07-B',
    observacao: 'Mudei para casa própria no início do mês.',
    status: 'Pendente',
    dataCriacao: '05/11/2026 14:20',
  }
];

function initStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Sempre sincroniza o banco de rotas caso não tenha as 12 oficiais
  let rotasExistentes: any[] = [];
  try {
    if (fs.existsSync(ROTAS_FILE)) {
      rotasExistentes = JSON.parse(fs.readFileSync(ROTAS_FILE, 'utf-8'));
    }
  } catch {}

  const temNovasRotas = rotasExistentes.some((r) => r.id === 'ADM01' || r.codigo === 'ADM01');
  if (!fs.existsSync(ROTAS_FILE) || !temNovasRotas || rotasExistentes.length < 12) {
    fs.writeFileSync(ROTAS_FILE, JSON.stringify(ROTAS_INICIAIS, null, 2), 'utf-8');
  }

  // Cadastros
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_DATA, null, 2), 'utf-8');
  }

  // Solicitações de Mudança de Endereço
  if (!fs.existsSync(SOLICITACOES_FILE)) {
    fs.writeFileSync(SOLICITACOES_FILE, JSON.stringify(SEED_SOLICITACOES, null, 2), 'utf-8');
  }

  // Escalas de Sábado (Parvi)
  if (!fs.existsSync(ESCALAS_SABADO_FILE)) {
    fs.writeFileSync(ESCALAS_SABADO_FILE, JSON.stringify(SEED_ESCALAS_SABADO, null, 2), 'utf-8');
  }
}

function readCadastros(): ColaboradorCadastro[] {
  try {
    initStorage();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler cadastros:', err);
    return SEED_DATA;
  }
}

function writeCadastros(data: ColaboradorCadastro[]): void {
  try {
    initStorage();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar cadastros:', err);
  }
}

function readRotas(): RotaLinha[] {
  try {
    initStorage();
    const raw = fs.readFileSync(ROTAS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler rotas:', err);
    return ROTAS_INICIAIS;
  }
}

function writeRotas(data: RotaLinha[]): void {
  try {
    initStorage();
    fs.writeFileSync(ROTAS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar rotas:', err);
  }
}

function readSolicitacoes(): SolicitacaoEndereco[] {
  try {
    initStorage();
    const raw = fs.readFileSync(SOLICITACOES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler solicitacoes:', err);
    return SEED_SOLICITACOES;
  }
}

function writeSolicitacoes(data: SolicitacaoEndereco[]): void {
  try {
    initStorage();
    fs.writeFileSync(SOLICITACOES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar solicitacoes:', err);
  }
}

function readEscalasSabado(): EscalaSabado[] {
  try {
    initStorage();
    const raw = fs.readFileSync(ESCALAS_SABADO_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler escalas de sábado:', err);
    return SEED_ESCALAS_SABADO;
  }
}

function writeEscalasSabado(data: EscalaSabado[]): void {
  try {
    initStorage();
    fs.writeFileSync(ESCALAS_SABADO_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar escalas de sábado:', err);
  }
}

export function createApiApp() {
  try {
    initStorage();
  } catch (err) {
    console.error('Aviso ao inicializar storage:', err);
  }

  const app = express();
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // ==========================================
  // ROTAS / LINHAS DE ÔNIBUS (Item 1 & Item 2 da reunião)
  // ==========================================
  app.get('/api/rotas', (_req: Request, res: Response) => {
    const rotas = readRotas();
    res.json({
      success: true,
      rotas,
      total: rotas.length,
      portaria: PORTARIA_PEBA,
    });
  });

  app.post('/api/rotas', (req: Request, res: Response) => {
    const body = req.body;
    const codigo = String(body.codigo || body.linha || '').trim().toUpperCase();
    if (!codigo) {
      return res.status(400).json({ error: 'Preencha o código da linha de ônibus (ex: ADM05, LINHA-08).' });
    }

    const nome = String(body.nome || body.itinerario || `Linha ${codigo}`).trim();
    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const id = body.id || `ROTA-${codigo.replace(/[^A-Z0-9]/g, '')}-${Date.now().toString(36).toUpperCase()}`;

    const turmasArray = Array.isArray(body.turmas) && body.turmas.length > 0
      ? body.turmas
      : [String(body.turma || 'Administrativo')];

    const novaRota: RotaLinha = {
      id,
      codigo,
      nome,
      turmas: turmasArray,
      turma: turmasArray[0] || 'Administrativo',
      linha: codigo,
      horarioInicio: String(body.horarioInicio || body.horario || '04:30').trim(),
      horarioRetorno: String(body.horarioRetorno || '17:00').trim(),
      horario: `${body.horarioInicio || '04:30'}${body.horarioRetorno ? ' / ' + body.horarioRetorno : ''}`,
      km: String(body.km || '22 km').trim(),
      bairros: Array.isArray(body.bairros)
        ? body.bairros
        : String(body.bairros || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      ruas: Array.isArray(body.ruas)
        ? body.ruas
        : String(body.ruas || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      itinerario: String(body.itinerario || '').trim(),
      bairrosExtras: String(body.bairrosExtras || '').trim(),
      cor: body.cor || '#10b981',
      capacidade: Number(body.capacidade) || 44,
      coordenadas: Array.isArray(body.coordenadas) && body.coordenadas.length > 0
        ? body.coordenadas
        : [PORTARIA_PEBA],
      ativa: body.ativa !== false,
      atualizadoEm: dataStr,
    };

    const lista = readRotas();
    lista.push(novaRota);
    writeRotas(lista);

    return res.status(201).json({ success: true, rota: novaRota });
  });

  app.put('/api/rotas/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body;
    const lista = readRotas();
    const index = lista.findIndex(r => r.id === id || r.codigo === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Linha não encontrada.' });
    }

    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const turmasArray = Array.isArray(body.turmas) && body.turmas.length > 0
      ? body.turmas
      : (lista[index].turmas || [lista[index].turma || 'Administrativo']);

    const atualizada: RotaLinha = {
      ...lista[index],
      ...body,
      id: lista[index].id,
      codigo: body.codigo ? String(body.codigo).trim().toUpperCase() : lista[index].codigo,
      nome: body.nome ? String(body.nome).trim() : lista[index].nome,
      turmas: turmasArray,
      turma: turmasArray[0] || lista[index].turma,
      capacidade: Number(body.capacidade) || lista[index].capacidade || 44,
      atualizadoEm: dataStr,
    };

    lista[index] = atualizada;
    writeRotas(lista);

    return res.json({ success: true, rota: atualizada });
  });

  app.delete('/api/rotas/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const lista = readRotas();
    const novaLista = lista.filter(r => r.id !== id && r.codigo !== id);

    if (lista.length === novaLista.length) {
      return res.status(404).json({ error: 'Linha não encontrada.' });
    }

    writeRotas(novaLista);
    return res.json({ success: true, message: 'Linha excluída com sucesso.' });
  });

  // ==========================================
  // ESCALAS DE SÁBADO (Supervisores & Parvi)
  // ==========================================
  app.get('/api/escala-sabado', (_req: Request, res: Response) => {
    const escalas = readEscalasSabado();
    res.json({
      success: true,
      escalas,
      total: escalas.length,
    });
  });

  app.post('/api/escala-sabado', (req: Request, res: Response) => {
    const body = req.body;
    if (!body.dataSabado || !body.supervisorNome) {
      return res.status(400).json({ error: 'Informe a data do sábado e o nome do supervisor.' });
    }

    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const id = body.id || `ESC-${Date.now().toString(36).toUpperCase()}`;

    const novaEscala: EscalaSabado = {
      id,
      dataSabado: String(body.dataSabado).trim(),
      supervisorNome: String(body.supervisorNome).trim(),
      supervisorTelefone: String(body.supervisorTelefone || '').trim(),
      status: body.status || 'Enviada à Parvi',
      observacoesGerais: String(body.observacoesGerais || '').trim(),
      observacoesLinhas: body.observacoesLinhas || {},
      criadoEm: dataStr,
      itens: Array.isArray(body.itens) ? body.itens : [],
    };

    const lista = readEscalasSabado();
    lista.unshift(novaEscala);
    writeEscalasSabado(lista);

    return res.status(201).json({ success: true, escala: novaEscala });
  });

  app.put('/api/escala-sabado/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body;
    const lista = readEscalasSabado();
    const index = lista.findIndex(e => e.id === id);

    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (index === -1) {
      const novaEscala: EscalaSabado = {
        id,
        dataSabado: String(body.dataSabado || '08/11/2026').trim(),
        supervisorNome: String(body.supervisorNome || 'Supervisor U&M').trim(),
        supervisorTelefone: String(body.supervisorTelefone || '').trim(),
        status: body.status || 'Enviada à Parvi',
        observacoesGerais: String(body.observacoesGerais || '').trim(),
        observacoesLinhas: body.observacoesLinhas || {},
        criadoEm: body.criadoEm || dataStr,
        atualizadoEm: dataStr,
        itens: Array.isArray(body.itens) ? body.itens : [],
      };
      lista.unshift(novaEscala);
      writeEscalasSabado(lista);
      return res.json({ success: true, escala: novaEscala });
    }

    const atualizada: EscalaSabado = {
      ...lista[index],
      ...body,
      id: lista[index].id,
      atualizadoEm: dataStr,
    };

    lista[index] = atualizada;
    writeEscalasSabado(lista);

    return res.json({ success: true, escala: atualizada });
  });

  app.delete('/api/escala-sabado/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const lista = readEscalasSabado();
    const novaLista = lista.filter(e => e.id !== id);

    if (lista.length === novaLista.length) {
      return res.status(404).json({ error: 'Escala não encontrada.' });
    }

    writeEscalasSabado(novaLista);
    return res.json({ success: true, message: 'Escala excluída com sucesso.' });
  });

  // Exportar Escala de Sábado em CSV para a Parvi
  app.get('/api/export/escala-sabado-csv', (req: Request, res: Response) => {
    const id = req.query.id as string;
    const escalas = readEscalasSabado();
    const escala = id ? escalas.find(e => e.id === id) : escalas[0];

    if (!escala) {
      return res.status(404).json({ error: 'Nenhuma escala de sábado encontrada para exportação.' });
    }

    const headers = [
      'Data do Sábado',
      'Linha do Ônibus',
      'OBS. da Escala',
      'OBS. da Linha',
      'Nome',
      'Bairro',
      'Rua',
      'Ponto de Embarque'
    ];

    const escapeCsv = (val: unknown) => `"${String(val == null ? '' : val).replace(/"/g, '""')}"`;
    const rows = (escala.itens || []).map(item => [
      escala.dataSabado,
      item.linhaId,
      escala.observacoesGerais || '',
      escala.observacoesLinhas?.[item.linhaId] || '',
      item.nome,
      item.bairro,
      item.rua || item.endereco || '',
      item.pontoEmbarque
    ].map(escapeCsv).join(';'));

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=escala_sabado_parvi_${escala.dataSabado.replace(/[\/\\]/g, '-')}.csv`);
    return res.send(csvContent);
  });

  // ==========================================
  // CADASTROS DE COLABORADORES
  // ==========================================
  app.get('/api/cadastros', (_req: Request, res: Response) => {
    const data = readCadastros();
    res.json({
      success: true,
      registros: data,
      total: data.length
    });
  });

  app.post('/api/cadastros', (req: Request, res: Response) => {
    const body = req.body;
    if (!body.nome || !body.matricula || !body.endereco || !body.bairro || !body.turma) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios (Nome, Matrícula, Endereço, Bairro e Turma).' });
    }

    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const ano = agora.getFullYear().toString().slice(-2);
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const protocolo = `UM${ano}${mes}${dia}-${randCode}`;
    const id = `CAD-${Date.now().toString().slice(-6)}`;

    // Motor de rotas com regra de correspondência do item 1.2
    const rotas = readRotas();
    const sugestao = sugerirRota(body, rotas);

    // Linha selecionada pelo colaborador no formulário (item 1.3) ou sugerida
    const linhaEscolhidaId = body.linhaId || sugestao.rotaId || '';
    const rotaEncontrada = rotas.find(r => r.id === linhaEscolhidaId || r.codigo === linhaEscolhidaId);
    const onibusFinal = body.onibus || (rotaEncontrada ? rotaEncontrada.codigo : (sugestao.codigo || ''));

    const statusFinal: StatusCadastro = body.status || 'Novo';

    const novoCadastro: ColaboradorCadastro = {
      id,
      protocolo,
      nome: String(body.nome).trim(),
      matricula: String(body.matricula).trim(),
      telefone: String(body.telefone || '').trim(),
      endereco: String(body.endereco).trim(),
      bairro: String(body.bairro).trim(),
      cidade: String(body.cidade || 'Parauapebas').trim(),
      turma: String(body.turma).trim(),
      local: String(body.local || 'U&M').trim(),
      ponto: body.ponto ? String(body.ponto).trim() : 'Ponto em definição pelo RH',
      pontoEmbarque: body.pontoEmbarque || null,
      foto: body.foto || null,
      status: statusFinal,
      onibus: onibusFinal,
      linhaId: linhaEscolhidaId,
      linhaSugeridaId: sugestao.rotaId || '',
      obs: body.obs || '',
      consentimento: Boolean(body.consentimento),
      criadoEm: dataStr,
      rotaSugerida: sugestao.encontrada ? sugestao.label : '',
      rotaMotivo: sugestao.motivo || '',
    };

    const lista = readCadastros();
    lista.unshift(novoCadastro);
    writeCadastros(lista);

    return res.status(201).json({
      success: true,
      protocolo,
      registro: novoCadastro,
      sugestao,
    });
  });

  // Recalcular rota
  app.post('/api/cadastros/:id/recalcular-rota', (req: Request, res: Response) => {
    const { id } = req.params;
    const lista = readCadastros();
    const index = lista.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Cadastro não encontrado.' });
    }

    const item = lista[index];
    const rotas = readRotas();
    const sugestao = sugerirRota(item, rotas);

    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const atualizado: ColaboradorCadastro = {
      ...item,
      linhaSugeridaId: sugestao.rotaId || item.linhaSugeridaId,
      rotaSugerida: sugestao.encontrada ? sugestao.label : item.rotaSugerida,
      rotaMotivo: sugestao.motivo || '',
      onibus: sugestao.encontrada ? (sugestao.codigo || item.onibus) : item.onibus,
      linhaId: sugestao.rotaId || item.linhaId,
      status: item.status === 'Novo' && sugestao.encontrada ? 'Rota sugerida' : item.status,
      atualizadoEm: dataStr,
    };

    lista[index] = atualizado;
    writeCadastros(lista);

    return res.json({ success: true, registro: atualizado, sugestao });
  });

  app.put('/api/cadastros/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body;
    const lista = readCadastros();
    const index = lista.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Cadastro não encontrado.' });
    }

    const item = lista[index];
    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const atualizado: ColaboradorCadastro = {
      ...item,
      ...body,
      id: item.id,
      protocolo: item.protocolo,
      criadoEm: item.criadoEm,
      atualizadoEm: dataStr,
    };

    // Se definiu pontoEmbarque com descricao, sincroniza campo string ponto
    if (body.pontoEmbarque && body.pontoEmbarque.descricao) {
      atualizado.ponto = body.pontoEmbarque.descricao;
    }

    lista[index] = atualizado;
    writeCadastros(lista);

    return res.json({ success: true, registro: atualizado });
  });

  app.delete('/api/cadastros/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const lista = readCadastros();
    const novaLista = lista.filter(c => c.id !== id);

    if (lista.length === novaLista.length) {
      return res.status(404).json({ error: 'Cadastro não encontrado.' });
    }

    writeCadastros(novaLista);
    return res.json({ success: true, message: 'Cadastro excluído com sucesso.' });
  });

  // ==========================================
  // SOLICITAÇÕES DE MUDANÇA DE ENDEREÇO (Item 2.4 & 4.5)
  // ==========================================
  app.get('/api/solicitacoes', (_req: Request, res: Response) => {
    const solicitacoes = readSolicitacoes();
    res.json({
      success: true,
      solicitacoes,
      total: solicitacoes.length,
    });
  });

  app.post('/api/solicitacoes', (req: Request, res: Response) => {
    const body = req.body;
    if (!body.colaboradorId || !body.enderecoNovo || !body.bairro) {
      return res.status(400).json({ error: 'Preencha o novo endereço e bairro.' });
    }

    const cadastros = readCadastros();
    const colab = cadastros.find(c => c.id === body.colaboradorId || c.matricula === body.matricula);

    if (!colab) {
      return res.status(404).json({ error: 'Colaborador não localizado.' });
    }

    const rotas = readRotas();
    const sugestao = sugerirRota({
      endereco: body.enderecoNovo,
      bairro: body.bairro,
      turma: colab.turma,
    }, rotas);

    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const id = `SOL-${Date.now().toString().slice(-6)}`;

    const novaSolicitacao: SolicitacaoEndereco = {
      id,
      colaboradorId: colab.id,
      matricula: colab.matricula,
      nomeColaborador: colab.nome,
      enderecoAtual: colab.endereco,
      bairroAtual: colab.bairro,
      cidadeAtual: colab.cidade,
      linhaAtualId: colab.linhaId || colab.onibus || '',
      enderecoNovo: String(body.enderecoNovo).trim(),
      bairro: String(body.bairro).trim(),
      cidade: String(body.cidade || 'Parauapebas').trim(),
      motivo: body.motivo || 'mudança de residência',
      dataVigencia: body.dataVigencia || agora.toLocaleDateString('pt-BR'),
      linhaSugeridaId: sugestao.rotaId || '',
      observacao: body.observacao || '',
      status: 'Pendente',
      dataCriacao: dataStr,
    };

    const lista = readSolicitacoes();
    lista.unshift(novaSolicitacao);
    writeSolicitacoes(lista);

    return res.status(201).json({
      success: true,
      solicitacao: novaSolicitacao,
      sugestao,
    });
  });

  // Aprovar ou Recusar solicitação (Item 4.5)
  app.put('/api/solicitacoes/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, respostaRH } = req.body; // status: 'Aprovada' | 'Recusada'

    if (!['Aprovada', 'Recusada'].includes(status)) {
      return res.status(400).json({ error: 'Status deve ser Aprovada ou Recusada.' });
    }

    const solicitacoes = readSolicitacoes();
    const index = solicitacoes.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    const sol = solicitacoes[index];
    sol.status = status;
    sol.respostaRH = respostaRH || '';
    writeSolicitacoes(solicitacoes);

    // Se aprovou, atualiza o cadastro do colaborador automaticamente!
    if (status === 'Aprovada') {
      const cadastros = readCadastros();
      const colabIdx = cadastros.findIndex(c => c.id === sol.colaboradorId);
      if (colabIdx !== -1) {
        const colab = cadastros[colabIdx];
        const rotas = readRotas();
        const novaLinha = rotas.find(r => r.id === sol.linhaSugeridaId);

        cadastros[colabIdx] = {
          ...colab,
          endereco: sol.enderecoNovo,
          bairro: sol.bairro,
          cidade: sol.cidade,
          linhaId: sol.linhaSugeridaId || colab.linhaId,
          onibus: novaLinha ? novaLinha.codigo : colab.onibus,
          status: 'Em análise', // Pede para o admin redefinir ponto de embarque
          ponto: 'Ponto em redefinição pelo RH',
          pontoEmbarque: null,
          obs: `${colab.obs ? colab.obs + ' | ' : ''}Mudança de endereço aprovada em ${new Date().toLocaleDateString('pt-BR')}`,
          atualizadoEm: new Date().toLocaleDateString('pt-BR'),
        };
        writeCadastros(cadastros);
      }
    }

    return res.json({ success: true, solicitacao: sol });
  });

  // Autenticação Admin
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { usuario, senha } = req.body;
    const userValido = !usuario || String(usuario).trim().toLowerCase() === 'admin' || String(usuario).trim().toLowerCase() === 'rh';
    const senhaValida = senha === '123' || senha === 'admin123' || senha === 'admin' || senha === 'rh2026';

    if (userValido && senhaValida) {
      const token = `token_rh_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      return res.json({
        success: true,
        token,
        usuario: { nome: 'Administrador (RH)', role: 'admin', login: 'admin' }
      });
    }
    return res.status(401).json({ error: 'Usuário ou senha incorretos. Use usuário: admin e senha: 123' });
  });

  // Exportar dados para CSV
  app.get('/api/export/csv', (req: Request, res: Response) => {
    const tipo = req.query.tipo;
    const lista = readCadastros();
    const rotas = readRotas();

    if (tipo === 'ocupacao') {
      const headers = ['Código Linha', 'Nome da Linha', 'Turma', 'Horário Início', 'Km', 'Capacidade', 'Colaboradores Ativos', 'Vagas Disponíveis', 'Percentual Ocupação (%)', 'Status'];
      const rows = rotas.map(r => {
        const ocupadas = lista.filter(c => c.status !== 'Inativo' && (c.linhaId === r.id || c.onibus === r.codigo)).length;
        const disponiveis = Math.max(0, r.capacidade - ocupadas);
        const percent = Math.round((ocupadas / r.capacidade) * 100);
        const status = ocupadas >= r.capacidade ? 'LOTADA' : `${percent}% ocupado`;
        return [
          r.codigo,
          r.nome,
          r.turmas.join(' / '),
          r.horarioInicio,
          r.km,
          r.capacidade,
          ocupadas,
          disponiveis,
          `${percent}%`,
          status
        ];
      });

      const escapeCsv = (val: unknown) => `"${String(val == null ? '' : val).replace(/"/g, '""')}"`;
      const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows.map(r => r.map(escapeCsv).join(';'))].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=ocupacao_rotas_u_m_${Date.now()}.csv`);
      return res.send(csvContent);
    }

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
      'Data Cadastro'
    ];

    const escapeCsv = (val: unknown) => `"${String(val == null ? '' : val).replace(/"/g, '""')}"`;
    const rows = lista.map(c => [
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
      c.criadoEm
    ].map(escapeCsv).join(';'));

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=transporte_colaboradores_${Date.now()}.csv`);
    return res.send(csvContent);
  });

  return app;
}

export const app = createApiApp();
export default app;

async function startServer() {
  // Vite integration
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`\n  VITE v8.3.0  ready in 250 ms\n`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://${HOST}:${PORT}/\n`);
    console.log(`🚀 Servidor U&M rodando em http://${HOST}:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
  });
}
