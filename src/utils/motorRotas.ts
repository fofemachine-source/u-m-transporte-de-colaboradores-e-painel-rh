import { RotaLinha, SugestaoRotaResultado } from '../types';

export const PORTARIA_PEBA: [number, number] = [-6.0592, -49.8820];

// 12 Rotas oficiais da U&M Parauapebas com traçados reais aproximados
export const ROTAS_INICIAIS: RotaLinha[] = [
  {
    id: 'ADM01',
    codigo: 'ADM01',
    nome: 'Palmares / Tropical / Betânia',
    turmas: ['Administrativo'],
    turma: 'Administrativo',
    linha: 'ADM01',
    horarioInicio: '04:25',
    horarioRetorno: '17:00',
    horario: '04:25 / 17:00',
    km: '33,5 km',
    cor: '#10b981', // Verde esmeralda
    capacidade: 44,
    bairros: [
      'Palmares II',
      'Palmares I',
      'Vale do Sol',
      'Tropical',
      'Ipiranga',
      'Vila Rica',
      'Betânia',
      'Novo Horizonte',
      'Chácara',
      'Cidade Nova'
    ],
    ruas: [
      'Av. Tancredo Neves',
      'Av. Boa Vista',
      'Rod. Faruk Salmen',
      'Av. Dubai',
      'Av. C',
      'Av. Jatobá',
      'Av. Castanheira',
      'PA-160',
      'R. Espanha',
      'Av. Havana',
      'R. Amsterdã',
      'R. Santo Antônio',
      'Av. Nicodemos',
      'R. Novo Paraíso',
      'R. Santiago',
      'R. Nova Conquista',
      'Av. Inglaterra',
      'R. Marcos Freire',
      'R. Sapucaia',
      'R. Belém',
      'Rua 10',
      'Rua A',
      'Rua 02'
    ],
    itinerario: 'Palmares II (Praça), Palmares I, Av. Tancredo Neves, Rod. Faruk Salmen, Vale do Sol (Av. Dubai), Tropical (Av. Jatobá), Ipiranga, Betânia, Novo Horizonte, Cidade Nova, Rua A, Rua 02, Portaria Peba',
    bairrosExtras: 'Palmares II, Palmares I, Vale do Sol, Tropical, Betânia, Cidade Nova',
    coordenadas: [
      [-6.0210, -49.8450], // Palmares II
      [-6.0350, -49.8550], // Palmares I
      [-6.0580, -49.8730], // Vale do Sol
      [-6.0640, -49.8820], // Tropical
      [-6.0710, -49.8870], // Ipiranga / Vila Rica
      [-6.0820, -49.8840], // Betânia
      [-6.0590, -49.8970], // Novo Horizonte
      [-6.0682, -49.9045], // Cidade Nova
      [-6.0620, -49.8910], // Rua A / Rua 02
      [-6.0592, -49.8820]  // Portaria Peba
    ],
    ativa: true,
    atualizadoEm: '06/11/2026 08:00',
  },
  {
    id: 'ADM02',
    codigo: 'ADM02',
    nome: 'Nova Carajás / Amazonas / Linha Verde',
    turmas: ['Administrativo'],
    turma: 'Administrativo',
    linha: 'ADM02',
    horarioInicio: '04:35',
    horarioRetorno: '17:00',
    horario: '04:35 / 17:00',
    km: '20,8 km',
    cor: '#3b82f6', // Azul
    capacidade: 44,
    bairros: [
      'Nova Carajás',
      'Nova Carajás (Casinhas)',
      'Alvorá',
      'W. Torres',
      'Amazonas',
      'Linha Verde',
      'Paraíso',
      'Da Paz',
      'Rio Verde',
      'União'
    ],
    ruas: [
      'Av. Igarapé Bahia',
      'Rua C34',
      'Rua C42',
      'Rua 90',
      'Av. Nova Carajás',
      'Av. Parauapebas',
      'Av. Serra Sul',
      'Rua 55',
      'Av. Sossego',
      'Av. Carajás',
      'Av. Serra Arqueada',
      'Av. 07',
      'Av. 01',
      'Canal 5',
      'Av. Ana Karina',
      'Av. Salvador Flausino',
      'Rua A10',
      'PA-160',
      'R. Novo Progresso',
      'Av. das Flores',
      'R. Wenceslau Braz',
      'Av. Pres. Prudente',
      'Av. João Figueiredo',
      'R. Aracaju',
      'R. Marabá',
      'R. Rio de Janeiro',
      'Rua 16',
      'Rua F',
      'Rua E',
      'Rua 02'
    ],
    itinerario: 'Casinhas Nova Carajás, Av. Nova Carajás, Alvorá, W. Torres, Bairro Amazonas (Av. Ana Karina), Linha Verde (Av. das Flores), Paraíso, Da Paz, Rio Verde, União, Rua 16, Portaria Peba',
    bairrosExtras: 'Nova Carajás, Amazonas, Linha Verde, Paraíso, Rio Verde, União',
    coordenadas: [
      [-6.0890, -49.9520], // Nova Carajás
      [-6.0790, -49.9390], // Alvorá / W. Torres
      [-6.0690, -49.9280], // Amazonas
      [-6.0640, -49.9190], // Linha Verde
      [-6.0670, -49.9140], // Paraíso
      [-6.0750, -49.9130], // Rio Verde
      [-6.0610, -49.8970], // União
      [-6.0620, -49.8890], // Rua F / Rua E
      [-6.0592, -49.8820]  // Portaria Peba
    ],
    ativa: true,
    atualizadoEm: '06/11/2026 08:00',
  },
  {
    id: 'ADM03',
    codigo: 'ADM03',
    nome: 'Liberdade e Região Central',
    turmas: ['Administrativo'],
    turma: 'Administrativo',
    linha: 'ADM03',
    horarioInicio: '04:35',
    horarioRetorno: '17:00',
    horario: '04:35 / 17:00',
    km: '14,2 km',
    cor: '#8b5cf6', // Roxo
    capacidade: 44,
    bairros: [
      'Liberdade',
      'Região Central',
      'Centro',
      'Beira Rio',
      'Morumbi'
    ],
    ruas: [
      'Av. Bom Jardim',
      'R. Rui Barbosa',
      'Av. Paulo Afonso',
      'R. Daniela Perez',
      'R. Ayrton Senna',
      'Av. Morumbi',
      'Av. JK',
      'R. Minas Gerais',
      'R. Perimetral Norte',
      'R. Santa Catarina',
      'R. Olavo Bilac',
      'R. Vinícius de Morais',
      'Av. Pará',
      'R. Espírito Santo',
      'Av. Princesa Isabel',
      'Rua 11',
      'Rua E'
    ],
    itinerario: 'Av. Bom Jardim, R. Rui Barbosa, Av. Paulo Afonso, Morumbi, Av. JK, R. Perimetral Norte, Liberdade (R. Santa Catarina, R. Olavo Bilac, Av. Pará, Av. Princesa Isabel), Rua 11, Portaria Peba',
    bairrosExtras: 'Liberdade, Centro, Morumbi, Beira Rio',
    coordenadas: [
      [-6.0690, -49.9010], // Região Central / Bom Jardim
      [-6.0610, -49.8950], // Av. JK / Morumbi
      [-6.0540, -49.8910], // R. Perimetral Norte
      [-6.0520, -49.8890], // Liberdade (Santa Catarina)
      [-6.0490, -49.8860], // Av. Princesa Isabel
      [-6.0550, -49.8840], // Rua 11 / Rua E
      [-6.0592, -49.8820]  // Portaria Peba
    ],
    ativa: true,
    atualizadoEm: '06/11/2026 08:00',
  },
  {
    id: 'ADM04',
    codigo: 'ADM04',
    nome: 'Alto Bonito / Minérios / Cidade Jardim / Parque dos Carajás',
    turmas: ['Administrativo'],
    turma: 'Administrativo',
    linha: 'ADM04',
    horarioInicio: '04:40',
    horarioRetorno: '17:00',
    horario: '04:40 / 17:00',
    km: '31,3 km',
    cor: '#f59e0b', // Âmbar
    capacidade: 44,
    bairros: [
      'Residencial Alto Bonito',
      'Alto Bonito',
      'Bairro dos Minérios',
      'Minérios',
      'Cidade Jardim',
      'Parque dos Carajás',
      'Park dos Carajás'
    ],
    ruas: [
      'PA-160',
      'Av. 01',
      'Rua F26',
      'Av. J',
      'Av. F',
      'Av. Paricá',
      'Av. das Castanheiras',
      'Av. Jatobá',
      'Av. Q',
      'Av. D',
      'Av. B',
      'Av. dos Buritis',
      'PA-275',
      'Av. dos Ipês',
      'Av. A',
      'Av. G',
      'Av. C',
      'Av. Potiguar',
      'Rua E'
    ],
    itinerario: 'Alto Bonito, Minérios (Av. 01, Rua F26), Cidade Jardim (Av. dos Buritis, Av. D, Av. Q), Parque dos Carajás (Av. Potiguar, Av. A, Av. C), PA-275, Portaria Peba',
    bairrosExtras: 'Alto Bonito, Minérios, Cidade Jardim, Park dos Carajás',
    coordenadas: [
      [-6.0380, -49.9120], // Alto Bonito
      [-6.0480, -49.9190], // Minérios
      [-6.0560, -49.9240], // Cidade Jardim (Av. Buritis)
      [-6.0620, -49.9290], // Cidade Jardim (Av. D / Av. Q)
      [-6.0710, -49.9320], // Park dos Carajás (Potiguar)
      [-6.0680, -49.9160], // PA-275
      [-6.0610, -49.8970], // Acesso Central
      [-6.0592, -49.8820]  // Portaria Peba
    ],
    ativa: true,
    atualizadoEm: '06/11/2026 08:00',
  },
  {
    id: 'ADM07',
    codigo: 'ADM07',
    nome: 'VS-10 / Liberdade / Bom Jardim',
    turmas: ['Administrativo'],
    turma: 'Administrativo',
    linha: 'ADM07',
    horarioInicio: '04:45',
    horarioRetorno: '17:00',
    horario: '04:45 / 17:00',
    km: '20 km',
    cor: '#ec4899', // Rosa
    capacidade: 44,
    bairros: [
      'VS-10',
      'Complexo VS-10',
      'Liberdade',
      'Bom Jardim',
      'Guanabara'
    ],
    ruas: [
      'Av. VS-10',
      'Av. Sebastião Gonçalves Pimentel',
      'R. Raimundo Gonçalves Pimentel',
      'Rua B',
      'R. Sapucaia',
      'R. Muricí',
      'Av. dos Ipês',
      'R. Olestina Lemos',
      'R. Antônio Lemos',
      'Av. Alzira Camilo',
      'Av. Paulo Maranhão',
      'Av. Floriano Peixoto',
      'R. Jorge Amado',
      'R. Augusto Meire',
      'R. Bom Jardim',
      'R. Marabá',
      'R. Rio de Janeiro',
      'Rua 16',
      'Av. Liberdade',
      'Rua E'
    ],
    itinerario: 'Estrada VS-10 (Sebastião G. Pimentel), Bairro Guanabara, Alzira Camilo, Bom Jardim (Av. Paulo Maranhão), R. Marabá, R. Rio de Janeiro, Av. Liberdade, Rua 16, Portaria Peba',
    bairrosExtras: 'VS-10, Guanabara, Bom Jardim, Liberdade',
    coordenadas: [
      [-6.0880, -49.8720], // VS-10 Extremo
      [-6.0790, -49.8780], // VS-10 / Guanabara
      [-6.0690, -49.8840], // Bom Jardim
      [-6.0600, -49.8880], // R. Rio de Janeiro
      [-6.0520, -49.8890], // Av. Liberdade
      [-6.0570, -49.8850], // Rua 16
      [-6.0592, -49.8820]  // Portaria Peba
    ],
    ativa: true,
    atualizadoEm: '06/11/2026 08:00',
  },
  {
    id: 'LINHA-06-A',
    codigo: 'LINHA-06',
    nome: 'LINHA-06 (Turma A) • Alvorá / W. Torres / Tropical / Vale do Sol',
    turmas: ['Retaludamento — Turma A'],
    turma: 'Retaludamento — Turma A',
    linha: 'LINHA-06',
    horarioInicio: '04:00',
    horarioRetorno: '16:00',
    horario: '04:00 / 16:00',
    km: '27,6 km',
    cor: '#065f46', // Verde escuro
    capacidade: 44,
    bairros: [
      'Alvorá',
      'W. Torres',
      'Amazonas',
      'Buritis',
      'Polo Moveleiro',
      'Tropical',
      'Vale do Sol'
    ],
    ruas: [
      'Praça do Alvorá',
      'Av. Ana Karina',
      'Av. Salvador Flausino',
      'Rua A010',
      'PA-160',
      'PA-275',
      'Av. Buritis',
      'Av. C',
      'Av. Q',
      'Av. D',
      'Av. Castanheira',
      'Av. Paricá',
      'Av. F',
      'Av. 01',
      'R. Marupá',
      'Av. Mogno',
      'Av. Jatobá',
      'Av. Havana',
      'R. Amsterdã',
      'R. Santo Antônio',
      'R. Nicodemos',
      'Av. Inglaterra',
      'Rod. Faruk Salmen',
      'Rua A',
      'Rua 2'
    ],
    itinerario: 'Praça do Alvorá, W. Torres, Amazonas (Ana Karina), PA-160, Av. Buritis, Polo Moveleiro, Tropical (Av. Jatobá), Vale do Sol (Av. Havana), Faruk Salmen, Rua A, Portaria Peba',
    bairrosExtras: 'Alvorá, W. Torres, Amazonas, Tropical, Vale do Sol',
    coordenadas: [
      [-6.0820, -49.9410], // Alvorá
      [-6.0740, -49.9320], // W. Torres
      [-6.0680, -49.9270], // Amazonas
      [-6.0590, -49.9210], // Buritis / Polo Moveleiro
      [-6.0640, -49.8820], // Tropical
      [-6.0580, -49.8730], // Vale do Sol
      [-6.0620, -49.8850], // Faruk Salmen / Rua A
      [-6.0592, -49.8820]  // Portaria Peba
    ],
    ativa: true,
    atualizadoEm: '06/11/2026 08:00',
  },
  {
    id: 'LINHA-06-B',
    codigo: 'LINHA-06',
    nome: 'LINHA-06 (Turma B) • W. Torres / Parque dos Carajás',
    turmas: ['Retaludamento — Turma B'],
    turma: 'Retaludamento — Turma B',
    linha: 'LINHA-06',
    horarioInicio: '04:00',
    horarioRetorno: '16:00',
    horario: '04:00 / 16:00',
    km: '11,8 km',
    cor: '#0284c7', // Azul cerúleo
    capacidade: 44,
    bairros: [
      'W. Torres',
      'Parque dos Carajás',
      'Park dos Carajás',
      'Alvorá'
    ],
    ruas: [
      'Av. Ana Karina',
      'Av. Salvador Flausino',
      'Rua 010',
      'PA-160',
      'Av. Potiguar',
      'Av. F',
      'Av. Rio Grande',
      'PA-275',
      'Rua E',
      'Rua 2'
    ],
    itinerario: 'W. Torres (Av. Ana Karina, Salvador Flausino), PA-160, Parque dos Carajás (Av. Potiguar, Av. F, Av. Rio Grande), PA-275, Rua E, Rua 2, Portaria Peba',
    bairrosExtras: 'W. Torres, Parque dos Carajás',
    coordenadas: [
      [-6.0740, -49.9320], // W. Torres
      [-6.0680, -49.9250], // PA-160
      [-6.0710, -49.9320], // Park dos Carajás (Potiguar)
      [-6.0750, -49.9280], // Av. Rio Grande
      [-6.0680, -49.9160], // PA-275
      [-6.0610, -49.8970], // Acesso Central
      [-6.0592, -49.8820]  // Portaria Peba
    ],
    ativa: true,
    atualizadoEm: '06/11/2026 08:00',
  },
  {
    id: 'LINHA-07-B',
    codigo: 'LINHA-07',
    nome: 'LINHA-07 (Turma B) • VS-10 / Liberdade / Rio Verde',
    turmas: ['Retaludamento — Turma B'],
    turma: 'Retaludamento — Turma B',
    linha: 'LINHA-07',
    horarioInicio: '04:00',
    horarioRetorno: '16:00',
    horario: '04:00 / 16:00',
    km: '22,7 km',
    cor: '#7c3aed', // Violeta
    capacidade: 44,
    bairros: [
      'VS-10',
      'Complexo VS-10',
      'Liberdade',
      'Rio Verde',
      'Bom Jardim'
    ],
    ruas: [
      'Av. VS-10',
      'R. Jatobá',
      'R. Jequitibá',
      'Av. Ipê',
      'R. Fernando Peixoto',
      'R. Castilho França',
      'R. Rio Claro',
      'R. Paulo Afonso',
      'R. Paulo Maranhão',
      'R. Floriano Peixoto',
      'R. Jorge Amado',
      'R. Augusto Meire',
      'R. Bom Jardim',
      'R. Marabá',
      'R. Ângela Diniz',
      'R. Rui Barbosa',
      'R. Daniela Perez',
      'R. Ayrton Senna',
      'R. Morumbi',
      'R. Safira',
      'R. JK',
      'R. Rio de Janeiro',
      'Rua 16',
      'Rua F',
      'Rua E',
      'Rua 2'
    ],
    itinerario: 'Av. VS-10 (Escola Mário Lago), Castilho França, Bom Jardim, Liberdade (Rui Barbosa, Daniela Perez, Morumbi, JK), Rio Verde (Rio de Janeiro), Rua 16, Portaria Peba',
    bairrosExtras: 'VS-10, Liberdade, Rio Verde, Bom Jardim',
    coordenadas: [
      [-6.0910, -49.8680], // VS-10 Mário Lago
      [-6.0790, -49.8780], // Castilho França
      [-6.0690, -49.8840], // Bom Jardim
      [-6.0520, -49.8890], // Liberdade
      [-6.0680, -49.9020], // Rio Verde
      [-6.0610, -49.8890], // Rua 16 / Rua F
      [-6.0592, -49.8820]  // Portaria Peba
    ],
    ativa: true,
    atualizadoEm: '06/11/2026 08:00',
  },
  {
    id: 'LINHA-06-C',
    codigo: 'LINHA-06',
    nome: 'LINHA-06 (Turma C) • Vila Nova / Tropical / Alto Bonito',
    turmas: ['Retaludamento — Turma C'],
    turma: 'Retaludamento — Turma C',
    linha: 'LINHA-06',
    horarioInicio: '04:00',
    horarioRetorno: '16:00',
    horario: '04:00 / 16:00',
    km: '22,1 km',
    cor: '#ea580c', // Laranja
    capacidade: 44,
    bairros: [
      'Vila Nova',
      'Tropical',
      'Alto Bonito',
      'Minérios',
      'Cidade Jardim'
    ],
    ruas: [
      'Av. D com Av. Q',
      'PA-160',
      'Av. dos Ipês',
      'Av. F',
      'Av. dos Buritis',
      'Av. 01',
      'Av. 02',
      'Av. A',
      'Av. B',
      'Av. Castanheira',
      'R. Monarquia',
      'Policlínica',
      'Av. J',
      'Rod. Faruk Salmen',
      'Rua A',
      'Rua 2'
    ],
    itinerario: 'Vila Nova, Cidade Jardim (Av. D, Av. Q), Minérios (Av. 01, Av. 02), Alto Bonito (R. Monarquia), Tropical, Rod. Faruk Salmen, Rua A, Rua 2, Portaria Peba',
    bairrosExtras: 'Vila Nova, Tropical, Alto Bonito, Cidade Jardim',
    coordenadas: [
      [-6.0710, -49.9240], // Vila Nova
      [-6.0580, -49.9220], // Cidade Jardim
      [-6.0480, -49.9190], // Minérios
      [-6.0380, -49.9120], // Alto Bonito
      [-6.0640, -49.8820], // Tropical
      [-6.0620, -49.8850], // Faruk Salmen
      [-6.0592, -49.8820]  // Portaria Peba
    ],
    ativa: true,
    atualizadoEm: '06/11/2026 08:00',
  },
  {
    id: 'LINHA-07-C',
    codigo: 'LINHA-07',
    nome: 'LINHA-07 (Turma C) • Nova Carajás / Alvorá / Parque dos Carajás',
    turmas: ['Retaludamento — Turma C'],
    turma: 'Retaludamento — Turma C',
    linha: 'LINHA-07',
    horarioInicio: '04:00',
    horarioRetorno: '16:00',
    horario: '04:00 / 16:00',
    km: '19,5 km',
    cor: '#0d9488', // Teal
    capacidade: 44,
    bairros: [
      'Nova Carajás',
      'Nova Carajás (Casinhas)',
      'Alvorá',
      'W. Torres',
      'Parque dos Carajás',
      'Park dos Carajás'
    ],
    ruas: [
      'Rua 141',
      'Rua C38',
      'C27',
      'Rua C42',
      'Rua 90',
      'Av. Serra Norte',
      'R. Araguaia',
      'Av. Nova Carajás',
      'Av. Serra Arqueada',
      'Av. 07',
      'Av. Ana Karina',
      'Av. Salvador Flausino',
      'Av. A010',
      'PA-160',
      'Av. Potiguar',
      'Av. F',
      'Av. Rio Grande',
      'PA-275',
      'Rua E',
      'Rua 2'
    ],
    itinerario: 'Casinhas Nova Carajás (Rua 141, C38), Av. Nova Carajás, Alvorá, W. Torres, PA-160, Parque dos Carajás (Av. Potiguar, Rio Grande), PA-275, Portaria Peba',
    bairrosExtras: 'Nova Carajás, Alvorá, W. Torres, Parque dos Carajás',
    coordenadas: [
      [-6.0920, -49.9540], // Nova Carajás Sul
      [-6.0840, -49.9450], // Nova Carajás
      [-6.0790, -49.9390], // Alvorá
      [-6.0740, -49.9320], // W. Torres
      [-6.0710, -49.9320], // Park dos Carajás
      [-6.0680, -49.9160], // PA-275
      [-6.0592, -49.8820]  // Portaria Peba
    ],
    ativa: true,
    atualizadoEm: '06/11/2026 08:00',
  },
  {
    id: 'LINHA-06-D',
    codigo: 'LINHA-06',
    nome: 'LINHA-06 (Turma D) • Alvorá / W. Torres / Paraíso / Rio Verde',
    turmas: ['Retaludamento — Turma D'],
    turma: 'Retaludamento — Turma D',
    linha: 'LINHA-06',
    horarioInicio: '04:00',
    horarioRetorno: '16:00',
    horario: '04:00 / 16:00',
    km: '14,3 km',
    cor: '#4f46e5', // Índigo
    capacidade: 44,
    bairros: [
      'Alvorá',
      'W. Torres',
      'Paraíso',
      'Rio Verde',
      'União'
    ],
    ruas: [
      'Praça do Alvorá',
      'Av. Ana Karina',
      'Av. Salvador Flausino',
      'Rua A010',
      'PA-160',
      'PA-275',
      'Av. Jânio Quadros',
      'R. Delfim Moreira',
      'Av. Presidente Prudente',
      'R. Marabá',
      'R. Rio de Janeiro',
      'Rua 16',
      'Rua F',
      'Rua E',
      'Rua 2'
    ],
    itinerario: 'Praça do Alvorá, W. Torres, PA-160, Paraíso (Av. Presidente Prudente), Rio Verde (R. Marabá, R. Rio de Janeiro), Rua 16, Rua F, Portaria Peba',
    bairrosExtras: 'Alvorá, W. Torres, Paraíso, Rio Verde',
    coordenadas: [
      [-6.0820, -49.9410], // Alvorá
      [-6.0740, -49.9320], // W. Torres
      [-6.0670, -49.9140], // Paraíso
      [-6.0750, -49.9130], // Rio Verde
      [-6.0610, -49.8970], // União
      [-6.0620, -49.8890], // Rua 16 / Rua F
      [-6.0592, -49.8820]  // Portaria Peba
    ],
    ativa: true,
    atualizadoEm: '06/11/2026 08:00',
  },
  {
    id: 'LINHA-07-D',
    codigo: 'LINHA-07',
    nome: 'LINHA-07 (Turma D) • Palmares II / Vale do Sol',
    turmas: ['Retaludamento — Turma D'],
    turma: 'Retaludamento — Turma D',
    linha: 'LINHA-07',
    horarioInicio: '04:00',
    horarioRetorno: '16:00',
    horario: '04:00 / 16:00',
    km: '25 km',
    cor: '#dc2626', // Vermelho
    capacidade: 44,
    bairros: [
      'Palmares II',
      'Palmares I',
      'Vale do Sol',
      'Tropical'
    ],
    ruas: [
      'Av. Tancredo Neves',
      'Rod. Faruk Salmen',
      'Av. Dubai',
      'R. Oslo',
      'R. Jamaica',
      'Av. Havana',
      'R. Amsterdã',
      'Rua A',
      'Rua 2'
    ],
    itinerario: 'Palmares II (Praça), Av. Tancredo Neves, Rod. Faruk Salmen, Vale do Sol (Av. Dubai, R. Oslo, R. Jamaica), Tropical (Av. Havana, R. Amsterdã), Rua A, Rua 2, Portaria Peba',
    bairrosExtras: 'Palmares II, Vale do Sol, Tropical',
    coordenadas: [
      [-6.0210, -49.8450], // Palmares II
      [-6.0350, -49.8550], // Palmares I
      [-6.0580, -49.8730], // Vale do Sol
      [-6.0640, -49.8820], // Tropical
      [-6.0620, -49.8850], // Faruk Salmen / Rua A
      [-6.0592, -49.8820]  // Portaria Peba
    ],
    ativa: true,
    atualizadoEm: '06/11/2026 08:00',
  }
];

// Utilitários de normalização e comparação de strings
export function semAcento(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function canon(s: string): string {
  return semAcento(s)
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function listaItinerario(itinerarioStr?: string): string[] {
  if (!itinerarioStr) return [];
  return itinerarioStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function labelRota(r: RotaLinha): string {
  return `${r.codigo} • ${r.nome}`;
}

export function linhasPorTurma(rotas: RotaLinha[], turma?: string): RotaLinha[] {
  if (!turma) return rotas.filter((r) => r.ativa);
  const tNorm = semAcento(turma);
  return rotas.filter((r) => {
    if (!r.ativa) return false;
    // Checa array turmas
    if (r.turmas && r.turmas.some((t) => semAcento(t) === tNorm || semAcento(t).includes(tNorm) || tNorm.includes(semAcento(t)))) {
      return true;
    }
    // Checa campo turma legado
    if (r.turma && (semAcento(r.turma) === tNorm || semAcento(r.turma).includes(tNorm) || tNorm.includes(semAcento(r.turma)))) {
      return true;
    }
    return false;
  });
}

/**
 * LÓGICA DE CORRESPONDÊNCIA AUTOMÁTICA (Seção 1.2):
 * (a) Tente primeiro a correspondência exata do bairro com a lista "bairros" da linha.
 * (b) Se não achar, procure o nome da rua no campo "ruas" da linha.
 * (c) Compare ignorando acentos e maiúsculas/minúsculas.
 * (d) Se mais de uma linha servir, mostre todas e marque a primeira como sugerida.
 * (e) Se nenhuma servir, mostre a tag cinza "Rota a definir pelo RH".
 */
export function sugerirRota(
  dados: { endereco?: string; bairro?: string; turma?: string },
  todasRotas: RotaLinha[] = ROTAS_INICIAIS
): SugestaoRotaResultado {
  const bairroC = canon(dados.bairro || '');
  const endC = canon(dados.endereco || '');
  const turma = (dados.turma || '').trim();

  // Filtrar apenas linhas ativas da turma selecionada (se informada)
  const rotasElegiveis = turma ? linhasPorTurma(todasRotas, turma) : todasRotas.filter((r) => r.ativa);

  if (rotasElegiveis.length === 0) {
    return {
      encontrada: false,
      motivo: 'Rota a definir pelo RH',
    };
  }

  interface MatchInfo {
    rota: RotaLinha;
    matchBairroExato: boolean;
    matchBairroParcial: boolean;
    matchRua: boolean;
    motivo: string;
    prioridade: number; // 1 = Bairro Exato, 2 = Bairro Parcial, 3 = Rua, 4 = Nenhuma
  }

  const matches: MatchInfo[] = [];

  for (const r of rotasElegiveis) {
    let matchBairroExato = false;
    let matchBairroParcial = false;
    let matchRua = false;
    let motivo = '';
    let prioridade = 99;

    // (a) Correspondência com bairros
    if (bairroC) {
      for (const b of r.bairros) {
        const bC = canon(b);
        if (bC === bairroC) {
          matchBairroExato = true;
          motivo = `Atende o bairro ${b}`;
          prioridade = 1;
          break;
        } else if (bC.includes(bairroC) || bairroC.includes(bC)) {
          matchBairroParcial = true;
          motivo = `Atende a região do bairro ${b}`;
          if (prioridade > 2) prioridade = 2;
        }
      }
    }

    // (b) Se não achou exato, procura nome da rua nas ruas da linha
    if (!matchBairroExato && endC) {
      for (const rua of r.ruas) {
        const ruaC = canon(rua);
        // Remove termos genéricos para match mais inteligente (ex: "rua", "av", "avenida")
        const ruaTermos = ruaC.split(' ').filter((t) => !['rua', 'r', 'av', 'avenida', 'rodovia', 'rod', 'estrada', 'est', 'de', 'do', 'da', 'dos', 'das'].includes(t) && t.length > 2);
        
        if (ruaTermos.length > 0 && ruaTermos.every((t) => endC.includes(t))) {
          matchRua = true;
          motivo = motivo ? `${motivo} e passa na ${rua}` : `O itinerário passa na ${rua}`;
          if (prioridade > 3) prioridade = 3;
          break;
        } else if (endC.includes(ruaC) || ruaC.includes(endC)) {
          matchRua = true;
          motivo = motivo ? `${motivo} e passa na ${rua}` : `O itinerário passa na ${rua}`;
          if (prioridade > 3) prioridade = 3;
          break;
        }
      }
    }

    if (matchBairroExato || matchBairroParcial || matchRua) {
      matches.push({
        rota: r,
        matchBairroExato,
        matchBairroParcial,
        matchRua,
        motivo: motivo || `Atende o setor de ${r.bairros.slice(0, 3).join(', ')}`,
        prioridade,
      });
    }
  }

  // Ordena pelas melhores correspondências (bairro exato primeiro, depois parcial, depois rua)
  matches.sort((a, b) => a.prioridade - b.prioridade);

  // (e) Se nenhuma servir
  if (matches.length === 0) {
    return {
      encontrada: false,
      motivo: 'Rota a definir pelo RH',
    };
  }

  // (d) Se mais de uma linha servir, pega a primeira como sugerida e lista todas
  const principal = matches[0];
  const confianca = principal.prioridade === 1 ? 'alta' : principal.prioridade === 2 ? 'média' : 'baixa';

  return {
    encontrada: true,
    rotaId: principal.rota.id,
    codigo: principal.rota.codigo,
    label: `${principal.rota.codigo} • ${principal.rota.nome}`,
    linha: principal.rota.codigo,
    turma: principal.rota.turmas[0] || principal.rota.turma || '',
    horarioInicio: principal.rota.horarioInicio,
    horarioRetorno: principal.rota.horarioRetorno,
    horario: `${principal.rota.horarioInicio}${principal.rota.horarioRetorno ? ' / ' + principal.rota.horarioRetorno : ''}`,
    km: principal.rota.km,
    inicio: principal.rota.ruas[0] || principal.rota.bairros[0] || '',
    itinerario: principal.rota.bairros,
    confianca,
    motivo: principal.motivo,
    alternativas: matches.map((m) => ({
      rotaId: m.rota.id,
      codigo: m.rota.codigo,
      label: `${m.rota.codigo} • ${m.rota.nome}`,
      pontos: m.prioridade === 1 ? 100 : m.prioridade === 2 ? 60 : 30,
    })),
  };
}
