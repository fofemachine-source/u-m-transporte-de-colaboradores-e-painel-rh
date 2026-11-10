import React, { useMemo, useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  UserX,
  Bus,
  MapPin,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Shield,
  FileText,
  FileEdit,
  AlertCircle,
  BarChart3,
  Layers,
} from 'lucide-react';
import { ColaboradorCadastro, AdminView, RotaLinha, SolicitacaoEndereco } from '../../types';
import { TURMAS } from '../../constants';

interface AdminDashboardProps {
  cadastros: ColaboradorCadastro[];
  rotas?: RotaLinha[];
  solicitacoes?: SolicitacaoEndereco[];
  onChangeView: (view: AdminView) => void;
  onVerNoMapa?: (c: ColaboradorCadastro) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  cadastros,
  rotas = [],
  solicitacoes = [],
  onChangeView,
  onVerNoMapa,
}) => {
  const [filtroTurmaOcupacao, setFiltroTurmaOcupacao] = useState<string>('Todas');

  // Ocupação por linha calculada com colaboradores ativos
  const ocupacaoPorLinha = useMemo(() => {
    const map: Record<string, number> = {};
    cadastros.forEach((c) => {
      if (c.status !== 'Inativo') {
        const lid = c.linhaId || c.onibus;
        if (lid) {
          map[lid] = (map[lid] || 0) + 1;
        }
      }
    });
    return map;
  }, [cadastros]);

  // Estatísticas de Vagas e Contagens Gerais (8 Cards do Topo)
  const stats = useMemo(() => {
    const total = cadastros.length;
    const ativos = cadastros.filter((c) => c.status !== 'Inativo').length;
    const novos = cadastros.filter((c) => c.status === 'Novo').length;
    const emAnalise = cadastros.filter((c) => c.status === 'Em análise').length;
    const demitidos = cadastros.filter((c) => c.status === 'Inativo').length;

    // Vagas totais e ocupadas
    const totalVagas = rotas.reduce((acc, r) => acc + (r.capacidade || 44), 0);
    const vagasOcupadas = rotas.reduce((acc, r) => {
      const oc = ocupacaoPorLinha[r.id] || ocupacaoPorLinha[r.codigo] || 0;
      return acc + oc;
    }, 0);
    const vagasDisponiveis = Math.max(0, totalVagas - vagasOcupadas);

    const pendentesMudanca = solicitacoes.filter((s) => s.status === 'Pendente').length;

    return {
      total,
      ativos,
      novos,
      emAnalise,
      demitidos,
      totalVagas: totalVagas > 0 ? totalVagas : 528,
      vagasOcupadas,
      vagasDisponiveis: totalVagas > 0 ? vagasDisponiveis : 528 - ativos,
      pendentesMudanca,
    };
  }, [cadastros, rotas, ocupacaoPorLinha, solicitacoes]);

  // Lista de linhas com métricas de ocupação
  const linhasOcupacao = useMemo(() => {
    return rotas.map((r) => {
      const capacidade = r.capacidade || 44;
      const ocupadas = ocupacaoPorLinha[r.id] || ocupacaoPorLinha[r.codigo] || 0;
      const disponiveis = Math.max(0, capacidade - ocupadas);
      const percentual = Math.round((ocupadas / capacidade) * 100);
      const turmaLabel = r.turmas?.join(', ') || r.turma || 'Geral';
      return {
        ...r,
        capacidade,
        ocupadas,
        disponiveis,
        percentual,
        turmaLabel,
      };
    }).sort((a, b) => b.percentual - a.percentual); // Mais cheia primeiro
  }, [rotas, ocupacaoPorLinha]);

  // Linhas com alerta de ocupação acima de 90%
  const linhasAlerta = useMemo(() => {
    return linhasOcupacao.filter((l) => l.percentual >= 90 && l.ativa !== false);
  }, [linhasOcupacao]);

  // Filtragem das linhas de ocupação por turma
  const linhasOcupacaoFiltradas = useMemo(() => {
    if (filtroTurmaOcupacao === 'Todas') return linhasOcupacao;
    return linhasOcupacao.filter((l) => {
      if (l.turmas && l.turmas.some((t) => t.includes(filtroTurmaOcupacao))) return true;
      if (l.turma && l.turma.includes(filtroTurmaOcupacao)) return true;
      return false;
    });
  }, [linhasOcupacao, filtroTurmaOcupacao]);

  // Distribuição por Turma
  const distribuicaoTurmas = useMemo(() => {
    const counts: Record<string, number> = {};
    TURMAS.forEach((t) => (counts[t] = 0));
    cadastros.forEach((c) => {
      if (c && c.status !== 'Inativo') {
        const turmaKey = (c.turma && typeof c.turma === 'string') ? c.turma.trim() : 'Outros';
        counts[turmaKey] = (counts[turmaKey] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([turma, count]) => ({ turma, count }))
      .sort((a, b) => b.count - a.count);
  }, [cadastros]);

  // Ranking de Bairros em Parauapebas
  const rankingBairros = useMemo(() => {
    const counts: Record<string, number> = {};
    cadastros.forEach((c) => {
      if (c.status !== 'Inativo') {
        const b = (c.bairro || 'Outros').trim();
        counts[b] = (counts[b] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([bairro, count]) => ({ bairro, count }))
      .sort((a, b) => b.count - a.count);
  }, [cadastros]);

  // Movimentações recentes
  const recentes = useMemo(() => {
    return [...cadastros].slice(0, 6);
  }, [cadastros]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header do Dashboard */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#1b6e47]" />
              Painel Geral de Transporte & Recursos Humanos
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Visão consolidada da operação de transporte de colaboradores U&M em Parauapebas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeView('mapa')}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1b6e47] text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Ver no Mapa</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeView('relatorios')}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Relatórios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Linha Crítica com mais de 90% de ocupação */}
      {linhasAlerta.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 text-red-700 flex-none">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black">
                Atenção da Frota: {linhasAlerta.length} {linhasAlerta.length === 1 ? 'linha está' : 'linhas estão'} com ocupação acima de 90%!
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                {linhasAlerta.map((l) => `${l.codigo} (${l.percentual}% ocupada - ${l.disponiveis} vagas)`).join(' • ')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChangeView('rotas')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors flex-none"
          >
            Ajustar Linhas
          </button>
        </div>
      )}

      {/* 2. Top Cards (8 Métricas Solicitadas) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Total de colaboradores */}
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block truncate">
            Total Colaboradores
          </span>
          <div className="text-2xl font-black text-stone-900 mt-1">{stats.total}</div>
          <span className="text-[10px] text-stone-400 mt-0.5 block truncate">cadastrados</span>
        </div>

        {/* 2. Ativos no transporte */}
        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block truncate">
            Ativos Transporte
          </span>
          <div className="text-2xl font-black text-[#1b6e47] mt-1">{stats.ativos}</div>
          <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block truncate">em operação</span>
        </div>

        {/* 3. Novos cadastros */}
        <div className="bg-white p-3.5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block truncate">
            Novos Cadastros
          </span>
          <div className="text-2xl font-black text-blue-900 mt-1">{stats.novos}</div>
          <span className="text-[10px] text-blue-600 mt-0.5 block truncate">aguardando RH</span>
        </div>

        {/* 4. Em análise */}
        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block truncate">
            Em Análise
          </span>
          <div className="text-2xl font-black text-amber-900 mt-1">{stats.emAnalise}</div>
          <span className="text-[10px] text-amber-600 mt-0.5 block truncate">conferindo rota</span>
        </div>

        {/* 5. Total de vagas */}
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block truncate">
            Total de Vagas
          </span>
          <div className="text-2xl font-black text-stone-800 mt-1">{stats.totalVagas}</div>
          <span className="text-[10px] text-stone-400 mt-0.5 block truncate">{rotas.length} ônibus</span>
        </div>

        {/* 6. Vagas ocupadas */}
        <div className="bg-white p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block truncate">
            Vagas Ocupadas
          </span>
          <div className="text-2xl font-black text-indigo-900 mt-1">{stats.vagasOcupadas}</div>
          <span className="text-[10px] text-indigo-600 mt-0.5 block truncate">assentos em uso</span>
        </div>

        {/* 7. Vagas disponíveis */}
        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block truncate">
            Vagas Disponíveis
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.vagasDisponiveis}</div>
          <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block truncate">assentos livres</span>
        </div>

        {/* 8. Solicitações de mudança pendentes */}
        <div
          onClick={() => onChangeView('solicitacoes')}
          className="bg-white p-3.5 rounded-2xl border border-amber-300 bg-amber-50/40 shadow-2xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block truncate flex items-center justify-between">
            <span>Mudanças Pend.</span>
            {stats.pendentesMudanca > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </span>
          <div className="text-2xl font-black text-amber-900 mt-1">{stats.pendentesMudanca}</div>
          <span className="text-[10px] text-amber-800 font-bold mt-0.5 block truncate">analisar ↗</span>
        </div>
      </div>

      {/* 3. Seção "OCUPAÇÃO DOS ÔNIBUS" (Item 4.1) */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-black text-stone-900 text-base flex items-center gap-2">
              <Bus className="w-5 h-5 text-[#1b6e47]" />
              Ocupação dos Ônibus • Capacidade & Assentos Livres
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Ordenadas por taxa de ocupação (mais cheias primeiro). Verde (&lt;70%), Amarelo (70-90%), Vermelho (&gt;90%) e LOTADA (100%).
            </p>
          </div>

          {/* Filtro por Turma */}
          <div className="flex flex-wrap items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setFiltroTurmaOcupacao('Todas')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filtroTurmaOcupacao === 'Todas' ? 'bg-white text-[#1b6e47] shadow-xs' : 'text-stone-600'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFiltroTurmaOcupacao('Administrativo')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filtroTurmaOcupacao === 'Administrativo' ? 'bg-white text-[#1b6e47] shadow-xs' : 'text-stone-600'
              }`}
            >
              Administrativo
            </button>
            <button
              type="button"
              onClick={() => setFiltroTurmaOcupacao('Turma A')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filtroTurmaOcupacao === 'Turma A' ? 'bg-white text-[#1b6e47] shadow-xs' : 'text-stone-600'
              }`}
            >
              Turma A
            </button>
            <button
              type="button"
              onClick={() => setFiltroTurmaOcupacao('Turma B')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filtroTurmaOcupacao === 'Turma B' ? 'bg-white text-[#1b6e47] shadow-xs' : 'text-stone-600'
              }`}
            >
              Turma B
            </button>
            <button
              type="button"
              onClick={() => setFiltroTurmaOcupacao('Turma C')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filtroTurmaOcupacao === 'Turma C' ? 'bg-white text-[#1b6e47] shadow-xs' : 'text-stone-600'
              }`}
            >
              Turma C
            </button>
            <button
              type="button"
              onClick={() => setFiltroTurmaOcupacao('Turma D')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filtroTurmaOcupacao === 'Turma D' ? 'bg-white text-[#1b6e47] shadow-xs' : 'text-stone-600'
              }`}
            >
              Turma D
            </button>
          </div>
        </div>

        {/* Cards de Ocupação por Linha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {linhasOcupacaoFiltradas.map((l) => {
            const isLotada = l.percentual >= 100 || l.disponiveis === 0;
            const barColor = isLotada || l.percentual > 90
              ? 'bg-red-500'
              : l.percentual >= 70
              ? 'bg-amber-500'
              : 'bg-emerald-600';

            return (
              <div
                key={l.id}
                className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:shadow-2xs transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-black text-sm text-stone-900 block leading-tight">
                      {l.codigo}
                    </span>
                    <span className="text-[11px] text-stone-500 block truncate mt-0.5">
                      {l.turmaLabel}
                    </span>
                  </div>

                  {isLotada ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600 text-white animate-pulse">
                      LOTADA
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-stone-200 text-stone-700">
                      {l.percentual}%
                    </span>
                  )}
                </div>

                {/* Barra de Progresso */}
                <div className="space-y-1">
                  <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, Math.max(3, l.percentual))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600">
                    <span>{l.ocupadas}/{l.capacidade}</span>
                    <span className={l.disponiveis === 0 ? 'text-red-600 font-bold' : 'text-emerald-700'}>
                      {l.disponiveis === 0 ? '0 vagas' : `${l.disponiveis} vagas`}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-100 flex items-center justify-between">
                  <span>Saída: {l.horarioInicio || l.horario}</span>
                  <span className="truncate max-w-[110px]">{l.km}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Gráficos de Distribuição (Por Linha e Por Turma) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Colaboradores por Linha */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1b6e47]" />
              Colaboradores por Linha de Transporte
            </h3>
            <span className="text-[11px] text-stone-400">Total: {stats.vagasOcupadas} alocados</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {linhasOcupacao.map((item) => {
              const porcentagem = stats.ativos > 0 ? Math.round((item.ocupadas / stats.ativos) * 100) : 0;
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800 truncate">
                      {item.codigo} <span className="text-[11px] text-stone-400 font-normal">({item.turmaLabel})</span>
                    </span>
                    <span className="text-stone-600 font-mono font-bold">
                      {item.ocupadas} passageiros ({item.percentual}% do bus)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#1b6e47] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(2, item.percentual))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico de Colaboradores por Turma */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1b6e47]" />
              Colaboradores por Turma / Turno
            </h3>
            <span className="text-[11px] text-stone-400">Total: {stats.ativos} ativos</span>
          </div>

          <div className="space-y-3">
            {distribuicaoTurmas.slice(0, 6).map((item) => {
              const porcentagem = stats.ativos > 0 ? Math.round((item.count / stats.ativos) * 100) : 0;
              return (
                <div key={item.turma} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800 truncate">{item.turma}</span>
                    <span className="text-stone-500 font-mono font-bold">
                      {item.count} ({porcentagem}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, porcentagem)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 5. Principais Bairros & Cadastros Recentes com Tag da Linha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Principais Bairros */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Principais Bairros de Parauapebas
            </h3>
            <button
              type="button"
              onClick={() => onChangeView('mapa')}
              className="text-[11px] text-[#1b6e47] font-bold hover:underline"
            >
              Abrir Mapa Completo ↗
            </button>
          </div>

          <div className="space-y-3">
            {rankingBairros.slice(0, 6).map((item, idx) => {
              const porcentagem = stats.ativos > 0 ? Math.round((item.count / stats.ativos) * 100) : 0;
              return (
                <div key={item.bairro} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800 flex items-center gap-1.5 truncate">
                      <span className="text-[10px] font-mono text-stone-400 font-bold">#{idx + 1}</span>
                      <span>{item.bairro}</span>
                    </span>
                    <span className="text-stone-500 font-mono font-bold">
                      {item.count} {item.count === 1 ? 'colaborador' : 'colaboradores'}
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(6, porcentagem)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cadastros Recentes com Tag da Linha */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-stone-900 text-sm">Cadastros Recentes Recebidos</h3>
            <button
              type="button"
              onClick={() => onChangeView('colaboradores')}
              className="text-xs font-bold text-[#1b6e47] hover:underline flex items-center gap-1"
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {recentes.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#1b6e47] border border-stone-200 flex items-center justify-center font-bold text-xs flex-none">
                    {c.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-stone-900 block truncate">{c.nome}</span>
                    <span className="text-stone-400 text-[11px] block truncate">
                      {c.matricula} • {c.turma} • {c.bairro}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-none">
                  {/* Tag da Linha */}
                  {c.linhaId || c.onibus ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {c.linhaId || c.onibus}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-500">
                      A definir
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onVerNoMapa ? onVerNoMapa(c) : onChangeView('mapa')}
                    className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1b6e47] border border-emerald-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    title="Ver no mapa"
                  >
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>Mapa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
