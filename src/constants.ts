import { StatusCadastro } from './types';

export const TURMAS: string[] = [
  'Administrativo',
  'Retaludamento — Turma A',
  'Retaludamento — Turma B',
  'Retaludamento — Turma C',
  'Retaludamento — Turma D'
];

export const STATUS_LIST: StatusCadastro[] = [
  'Novo',
  'Rota sugerida',
  'Em análise',
  'Rota definida',
  'Inativo'
];

export const STATUS_CONFIG: Record<StatusCadastro, {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderLeft: string;
  dotColor: string;
}> = {
  'Novo': {
    label: 'Novo',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeText: 'text-blue-700',
    borderLeft: 'border-l-blue-600',
    dotColor: 'bg-blue-500'
  },
  'Rota sugerida': {
    label: 'Rota sugerida',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badgeText: 'text-indigo-700',
    borderLeft: 'border-l-indigo-600',
    dotColor: 'bg-indigo-500'
  },
  'Em análise': {
    label: 'Em análise',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeText: 'text-amber-700',
    borderLeft: 'border-l-amber-500',
    dotColor: 'bg-amber-500'
  },
  'Rota definida': {
    label: 'Rota definida',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-800',
    borderLeft: 'border-l-emerald-600',
    dotColor: 'bg-emerald-600'
  },
  'Inativo': {
    label: 'Inativo / Demitido',
    badgeBg: 'bg-stone-100 text-stone-600 border-stone-200',
    badgeText: 'text-stone-600',
    borderLeft: 'border-l-stone-400',
    dotColor: 'bg-stone-400'
  }
};

export const ROTAS_SUGESTOES: string[] = [
  'TA-L01 (Amazonas / Cidade Jardim) — Turno A',
  'TA-L02 (Vila Nova / Liberdade) — Turno A',
  'TA-L03 (VS-10 / Bom Jardim) — Turno A',
  'TB-L01 (Park dos Carajás / Minérios / Primavera) — Turno B',
  'TB-L02 (VS-10 / Liberdade) — Turno B',
  'TB-L03 (Planalto / Cidade Nova) — Turno B',
  'TC-L01 (Nova Carajás / Linha Verde) — Turno C',
  'TC-L02 (Cidade Jardim / Liberdade) — Turno C',
  'TC-L03 (Minérios / Tropical / Vale do Sol) — Turno C',
  'TD-L01 (Amazônia / Linha Verde / Beira Rio) — Turno D',
  'TD-L02 (Palmares I e II / Vale do Sol) — Turno D',
  'TD-L03 (Park dos Carajás / Alto Bonito) — Turno D',
  'ADM 01 — Administrativo Matutino (07:00 / 17:00)',
  'ADM 02 — Administrativo Operacional (08:00 / 18:00)'
];

export interface BairroParauapebasInfo {
  nome: string;
  lat: number;
  lng: number;
  x: number; // Porcentagem de 0 a 100 na coordenada X do mapa
  y: number; // Porcentagem de 0 a 100 na coordenada Y do mapa
  descricao: string;
  corZona: string;
}

export const BAIRROS_PARAUAPEBAS: Record<string, BairroParauapebasInfo> = {
  'Cidade Nova': {
    nome: 'Cidade Nova',
    lat: -6.0682,
    lng: -49.9045,
    x: 52,
    y: 46,
    descricao: 'Região central comercial e de alta concentração residencial',
    corZona: '#10b981'
  },
  'União': {
    nome: 'União',
    lat: -6.0610,
    lng: -49.8970,
    x: 64,
    y: 40,
    descricao: 'Bairro nobre e comercial próximo à Av. Liberdade',
    corZona: '#059669'
  },
  'Rio Verde': {
    nome: 'Rio Verde',
    lat: -6.0750,
    lng: -49.9130,
    x: 36,
    y: 56,
    descricao: 'Tradicional bairro residencial com vários pontos de embarque',
    corZona: '#3b82f6'
  },
  'Beira Rio': {
    nome: 'Beira Rio',
    lat: -6.0715,
    lng: -49.8920,
    x: 58,
    y: 62,
    descricao: 'Próximo ao Rio Parauapebas e rodovia de acesso operacional',
    corZona: '#6366f1'
  },
  'Altamira': {
    nome: 'Altamira',
    lat: -6.0880,
    lng: -49.9080,
    x: 44,
    y: 76,
    descricao: 'Região sul com grande número de operadores de máquinas',
    corZona: '#f59e0b'
  },
  'Liberdade': {
    nome: 'Liberdade',
    lat: -6.0520,
    lng: -49.8890,
    x: 68,
    y: 28,
    descricao: 'Setor norte com rotas expressas para a Mina',
    corZona: '#8b5cf6'
  },
  'Primavera': {
    nome: 'Primavera',
    lat: -6.0730,
    lng: -49.9240,
    x: 24,
    y: 46,
    descricao: 'Zona oeste de Parauapebas, rota N4',
    corZona: '#ec4899'
  },
  'Novo Horizonte': {
    nome: 'Novo Horizonte',
    lat: -6.0490,
    lng: -49.9010,
    x: 48,
    y: 26,
    descricao: 'Bairro residencial com fácil acesso à saída de Carajás',
    corZona: '#14b8a6'
  },
  'Betânia': {
    nome: 'Betânia',
    lat: -6.0820,
    lng: -49.8840,
    x: 76,
    y: 66,
    descricao: 'Zona sudeste de Parauapebas com ponto central de ônibus',
    corZona: '#f97316'
  },
  'Mina N4 / N5 (Carajás)': {
    nome: 'Mina N4 / N5 (Carajás)',
    lat: -6.0350,
    lng: -50.1500,
    x: 16,
    y: 18,
    descricao: 'Frente de Lavra e Operações de Terraplenagem U&M',
    corZona: '#047857'
  },
  'Escritório Central U&M': {
    nome: 'Escritório Central U&M',
    lat: -6.0645,
    lng: -49.9015,
    x: 54,
    y: 36,
    descricao: 'Base Administrativa, Recursos Humanos e Logística de Frotas',
    corZona: '#065f46'
  }
};

export function obterCoordenadasBairro(bairroStr?: string): { lat: number; lng: number; nome: string; corZona: string; x: number; y: number } {
  const b = (bairroStr || '').trim().toLowerCase();
  for (const [chave, info] of Object.entries(BAIRROS_PARAUAPEBAS)) {
    if (b.includes(chave.toLowerCase()) || chave.toLowerCase().includes(b)) {
      return info;
    }
  }
  // Padrão no centro de Parauapebas
  return {
    nome: bairroStr || 'Parauapebas',
    lat: -6.0682,
    lng: -49.9045,
    x: 50,
    y: 50,
    corZona: '#10b981'
  };
}
