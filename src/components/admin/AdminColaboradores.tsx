import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Download,
  Filter,
  MapPin,
  Bus,
  Phone,
  AlertTriangle,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Table as TableIcon,
  UserX,
  UserCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ColaboradorCadastro, StatusCadastro, FiltrosState, RotaLinha } from '../../types';
import { STATUS_LIST, STATUS_CONFIG, TURMAS } from '../../constants';
import { ModalEdit } from '../ModalEdit';
import { ConfirmModal } from '../ConfirmModal';
import {
  alterarStatus,
  atualizarCadastro,
  criarCadastro,
  excluirCadastro,
  recalcularRotaColaborador,
} from '../../services/api';

interface AdminColaboradoresProps {
  cadastros: ColaboradorCadastro[];
  rotas?: RotaLinha[];
  onRefresh: () => Promise<void>;
  carregando: boolean;
  onVerNoMapa?: (c: ColaboradorCadastro) => void;
}

export const AdminColaboradores: React.FC<AdminColaboradoresProps> = ({
  cadastros,
  rotas = [],
  onRefresh,
  carregando,
  onVerNoMapa,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [abaFiltro, setAbaFiltro] = useState<'todos' | 'ativos' | 'demitidos' | 'sem_rota'>('todos');

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosState>({
    busca: '',
    turma: '',
    linha: '',
    status: '',
    bairro: '',
    ordem: 'recentes',
  });

  // Modal de Trocar Linha
  const [colabTrocarLinha, setColabTrocarLinha] = useState<ColaboradorCadastro | null>(null);
  const [linhaSelecionadaParaTroca, setLinhaSelecionadaParaTroca] = useState<string>('');
  const [salvandoTroca, setSalvandoTroca] = useState(false);

  // Modais
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [cadastroSelecionado, setCadastroSelecionado] = useState<ColaboradorCadastro | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [demitirColaborador, setDemitirColaborador] = useState<ColaboradorCadastro | null>(null);
  const [motivoDemitir, setMotivoDemitir] = useState('');
  const [recalculandoId, setRecalculandoId] = useState<string | null>(null);

  const handleRecalcular = async (colab: ColaboradorCadastro) => {
    setRecalculandoId(colab.id);
    try {
      const res = await recalcularRotaColaborador(colab.id);
      await onRefresh();
      if (res.sugestao.encontrada) {
        alert(`Rota sugerida para ${colab.nome}:\n🚌 ${res.sugestao.label}\n\nMotivo: ${res.sugestao.motivo}`);
      } else {
        alert(`Não foi encontrada rota direta para ${colab.nome}. O RH pode definir manualmente.`);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao recalcular rota.');
    } finally {
      setRecalculandoId(null);
    }
  };

  const handleAprovarRota = async (colab: ColaboradorCadastro) => {
    try {
      await alterarStatus(colab.id, 'Rota definida');
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar rota.');
    }
  };

  // Turmas presentes
  const turmasList = useMemo(() => {
    const set = new Set<string>(TURMAS);
    cadastros.forEach((c) => {
      if (c.turma) set.add(c.turma);
    });
    return Array.from(set);
  }, [cadastros]);

  // Bairros presentes
  const bairrosList = useMemo(() => {
    const set = new Set<string>();
    cadastros.forEach((c) => {
      if (c.bairro) set.add(c.bairro.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [cadastros]);

  // Linhas presentes
  const linhasList = useMemo(() => {
    const set = new Set<string>();
    rotas.forEach((r) => set.add(r.codigo || r.id));
    cadastros.forEach((c) => {
      if (c.linhaId) set.add(c.linhaId);
      if (c.onibus) set.add(c.onibus);
    });
    return Array.from(set).sort();
  }, [rotas, cadastros]);

  const handleConfirmarTrocaLinha = async () => {
    if (!colabTrocarLinha || !linhaSelecionadaParaTroca) return;
    setSalvandoTroca(true);
    try {
      await atualizarCadastro(colabTrocarLinha.id, {
        linhaId: linhaSelecionadaParaTroca,
        onibus: linhaSelecionadaParaTroca,
        status: 'Rota definida',
      });
      await onRefresh();
      setColabTrocarLinha(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao trocar linha.');
    } finally {
      setSalvandoTroca(false);
    }
  };

  // Detector de Matrícula Duplicada
  const matriculasRepetidas = useMemo(() => {
    const map = new Map<string, number>();
    cadastros.forEach((c) => {
      const m = c.matricula.trim().toLowerCase();
      if (m) map.set(m, (map.get(m) || 0) + 1);
    });
    const repetidas = new Set<string>();
    map.forEach((qtd, m) => {
      if (qtd > 1) repetidas.add(m);
    });
    return repetidas;
  }, [cadastros]);

  // Contagens para abas
  const contagensAbas = useMemo(() => {
    const total = cadastros.length;
    const ativos = cadastros.filter((c) => c.status !== 'Inativo').length;
    const demitidos = cadastros.filter((c) => c.status === 'Inativo').length;
    const semRota = cadastros.filter((c) => !c.onibus && c.status !== 'Inativo').length;
    return { total, ativos, demitidos, semRota };
  }, [cadastros]);

  // Filtragem
  const cadastrosFiltrados = useMemo(() => {
    let result = [...cadastros];

    // Filtro por Aba Superior
    if (abaFiltro === 'ativos') {
      result = result.filter((c) => c.status !== 'Inativo');
    } else if (abaFiltro === 'demitidos') {
      result = result.filter((c) => c.status === 'Inativo');
    } else if (abaFiltro === 'sem_rota') {
      result = result.filter((c) => !c.onibus && c.status !== 'Inativo');
    }

    // Busca textual
    if (filtros.busca.trim()) {
      const q = filtros.busca.trim().toLowerCase();
      result = result.filter((c) => {
        const fullString = [
          c.nome,
          c.matricula,
          c.endereco,
          c.bairro,
          c.cidade,
          c.turma,
          c.local,
          c.ponto,
          c.onibus,
          c.telefone,
          c.id,
          c.protocolo,
          c.obs,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return fullString.includes(q);
      });
    }

    // Filtro por Turma
    if (filtros.turma) {
      result = result.filter((c) => c.turma === filtros.turma);
    }

    // Filtro por Linha
    if (filtros.linha) {
      result = result.filter((c) => c.linhaId === filtros.linha || c.onibus === filtros.linha);
    }

    // Filtro por Status
    if (filtros.status) {
      result = result.filter((c) => c.status === filtros.status);
    }

    // Filtro por Bairro
    if (filtros.bairro) {
      result = result.filter((c) => c.bairro.toLowerCase() === filtros.bairro.toLowerCase());
    }

    // Ordenação
    if (filtros.ordem === 'nome') {
      result.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    } else if (filtros.ordem === 'bairro') {
      result.sort((a, b) => a.bairro.localeCompare(b.bairro, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'));
    } else if (filtros.ordem === 'antigos') {
      result.reverse();
    }

    return result;
  }, [cadastros, abaFiltro, filtros]);

  // Ações
  const handleMudarStatusInline = async (id: string, novoStatus: StatusCadastro) => {
    try {
      await alterarStatus(id, novoStatus);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status.');
    }
  };

  const handleSalvarModal = async (dados: Partial<ColaboradorCadastro>) => {
    if (cadastroSelecionado) {
      await atualizarCadastro(cadastroSelecionado.id, dados);
    } else {
      await criarCadastro(dados as any);
    }
    await onRefresh();
  };

  const handleConfirmarExclusao = async () => {
    if (!confirmDeleteId) return;
    try {
      await excluirCadastro(confirmDeleteId);
      setConfirmDeleteId(null);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir cadastro.');
    }
  };

  const handleConfirmarDemissao = async () => {
    if (!demitirColaborador) return;
    try {
      const agora = new Date().toLocaleDateString('pt-BR');
      const obsAtual = demitirColaborador.obs || '';
      const novaObs = `${obsAtual ? obsAtual + ' | ' : ''}Desligado em ${agora}${motivoDemitir ? ` (Motivo: ${motivoDemitir})` : ''}`;

      await atualizarCadastro(demitirColaborador.id, {
        status: 'Inativo',
        onibus: '', // Libera a vaga no ônibus
        obs: novaObs,
        demitidoEm: agora,
        motivoInativacao: motivoDemitir,
      });

      setDemitirColaborador(null);
      setMotivoDemitir('');
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar demissão.');
    }
  };

  const handleReativar = async (c: ColaboradorCadastro) => {
    try {
      await atualizarCadastro(c.id, {
        status: 'Em análise',
        obs: `${c.obs ? c.obs + ' | ' : ''}Reativado em ${new Date().toLocaleDateString('pt-BR')}`,
      });
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao reativar colaborador.');
    }
  };

  const getIniciais = (nome: string) => {
    return (
      nome
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase() || '?'
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Abas Superiores de Gestão de Colaboradores */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#19502f]" />
              Gestão de Colaboradores & Demissões
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Edite rotas, consulte pontos de embarque ou marque colaboradores desligados para liberar vagas nos ônibus.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCadastroSelecionado(null);
                setModalEditOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#19502f] hover:bg-[#0d2b19] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Colaborador</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={carregando}
              className="p-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Abas de Status: Todos, Ativos, Demitidos, Sem Rota */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setAbaFiltro('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              abaFiltro === 'todos'
                ? 'bg-[#19502f] text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>Todos os Cadastros</span>
            <span className="text-[11px] opacity-80 font-mono">({contagensAbas.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaFiltro('ativos')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              abaFiltro === 'ativos'
                ? 'bg-[#19502f] text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Colaboradores Ativos</span>
            <span className="text-[11px] opacity-80 font-mono">({contagensAbas.ativos})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaFiltro('demitidos')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              abaFiltro === 'demitidos'
                ? 'bg-stone-800 text-white shadow-2xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Demitidos / Desligados</span>
            <span className="text-[11px] opacity-80 font-mono font-bold">({contagensAbas.demitidos})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaFiltro('sem_rota')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              abaFiltro === 'sem_rota'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Sem Rota Definida</span>
            <span className="text-[11px] opacity-80 font-mono">({contagensAbas.semRota})</span>
          </button>
        </div>

      </div>

      {/* 2. Barra de Busca e Filtros Secundários */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="search"
              value={filtros.busca}
              onChange={(e) => setFiltros((prev) => ({ ...prev, busca: e.target.value }))}
              placeholder="Buscar por colaborador, matrícula, bairro, ponto de embarque ou ônibus..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#19502f] focus:outline-none"
            />
          </div>

          {/* Toggle View */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Cartões</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden md:inline">Tabela</span>
            </button>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={filtros.turma}
            onChange={(e) => setFiltros((prev) => ({ ...prev, turma: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white"
          >
            <option value="">Todas as Turmas / Setores</option>
            {turmasList.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={filtros.linha}
            onChange={(e) => setFiltros((prev) => ({ ...prev, linha: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white font-semibold text-emerald-950"
          >
            <option value="">Todas as Linhas de Ônibus</option>
            {linhasList.map((l) => (
              <option key={l} value={l}>Linha: {l}</option>
            ))}
          </select>

          <select
            value={filtros.bairro}
            onChange={(e) => setFiltros((prev) => ({ ...prev, bairro: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white"
          >
            <option value="">Todos os Bairros de Parauapebas</option>
            {bairrosList.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={filtros.ordem}
            onChange={(e) => setFiltros((prev) => ({ ...prev, ordem: e.target.value as any }))}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white"
          >
            <option value="recentes">Mais recentes primeiro</option>
            <option value="antigos">Mais antigos primeiro</option>
            <option value="nome">Nome do Colaborador (A–Z)</option>
            <option value="bairro">Bairro (A–Z)</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs text-stone-500">
          <span>Mostrando <strong>{cadastrosFiltrados.length}</strong> colaboradores</span>
          {(filtros.busca || filtros.turma || filtros.linha || filtros.bairro) && (
            <button
              type="button"
              onClick={() => setFiltros({ busca: '', turma: '', linha: '', status: '', bairro: '', ordem: 'recentes' })}
              className="text-[#19502f] font-semibold hover:underline cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* 3. Empty State */}
      {cadastrosFiltrados.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center">
          <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-700">Nenhum colaborador nesta categoria</h3>
          <p className="text-xs text-stone-500 mt-1">
            Nenhum registro corresponde aos filtros selecionados.
          </p>
        </div>
      )}

      {/* 4. Lista em Cartões */}
      {viewMode === 'cards' && cadastrosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cadastrosFiltrados.map((item) => {
            const config = STATUS_CONFIG[item.status] || STATUS_CONFIG['Novo'];
            const isRepetida = matriculasRepetidas.has(item.matricula.trim().toLowerCase());
            const isDemitido = item.status === 'Inativo';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between border-l-4 ${
                  isDemitido ? 'border-l-stone-400 bg-stone-50/50 opacity-90' : config.borderLeft
                }`}
              >
                <div>
                  {/* Top */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full border border-stone-200 bg-emerald-50 text-[#19502f] flex items-center justify-center font-bold text-base flex-none overflow-hidden shadow-2xs">
                      {item.foto ? (
                        <img src={item.foto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{getIniciais(item.nome)}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-stone-900 truncate leading-snug" title={item.nome}>
                        {item.nome}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-stone-500">
                        <span className="font-mono font-semibold text-stone-700">{item.matricula}</span>
                        <span>•</span>
                        <span className="truncate">{item.turma}</span>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.badgeBg}`}>
                          {isDemitido ? 'Demitido / Inativo' : item.status}
                        </span>

                        {isRepetida && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Repetida
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600">
                    <div>
                      <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">
                        Ponto de Embarque
                      </span>
                      <span className="font-semibold text-stone-800 leading-tight block">
                        {item.ponto}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">
                        Bairro em Parauapebas
                      </span>
                      <span className="text-stone-700 block">
                        <strong>{item.bairro}</strong> • {item.endereco}
                      </span>
                    </div>

                    {/* Ônibus / Linha Alocada */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block flex items-center gap-1">
                          <Bus className="w-3.5 h-3.5 text-emerald-700" /> Linha Alocada:
                        </span>
                        {item.linhaId || item.onibus ? (
                          <span className="inline-block px-2 py-0.5 mt-0.5 rounded-md font-mono font-black text-xs bg-emerald-700 text-white shadow-2xs">
                            {item.linhaId || item.onibus}
                          </span>
                        ) : (
                          <span className="text-xs italic text-amber-700 block mt-0.5">
                            Pendente de alocação de rota
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setColabTrocarLinha(item);
                          setLinhaSelecionadaParaTroca(item.linhaId || item.onibus || '');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-[#19502f] border border-emerald-300 text-xs font-bold transition-colors cursor-pointer flex-none shadow-2xs"
                        title="Trocar linha de transporte do colaborador"
                      >
                        Trocar Linha
                      </button>
                    </div>

                    {item.rotaMotivo && (
                      <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 leading-snug">
                        <span className="font-bold flex items-center gap-1 text-indigo-800 mb-0.5">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          Cálculo da Rota Automática:
                        </span>
                        <span>{item.rotaMotivo}</span>
                      </div>
                    )}

                    {item.obs && (
                      <div className="p-2 rounded-lg bg-stone-100 text-[11px] text-stone-600">
                        <strong className="text-stone-800">Obs:</strong> {item.obs}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações Específicas: Ver no Mapa, Aprovar Rota, Recalcular, Editar, Demitir, Reativar, Excluir */}
                <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                  {item.status === 'Rota sugerida' && (
                    <button
                      type="button"
                      onClick={() => handleAprovarRota(item)}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Confirmar rota sugerida automaticamente"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmar Rota Sugerida</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onVerNoMapa?.(item)}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#19502f] border border-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Localizar e abrir colaborador no mapa de Parauapebas"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ver no Mapa de Parauapebas</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={recalculandoId === item.id}
                      onClick={() => handleRecalcular(item)}
                      className="py-1.5 px-2.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Recalcular linha ideal com o motor de rotas"
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-indigo-600 ${recalculandoId === item.id ? 'animate-spin' : ''}`} />
                      <span>{recalculandoId === item.id ? 'Calculando...' : 'Recalcular'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCadastroSelecionado(item);
                        setModalEditOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    {isDemitido ? (
                      <button
                        type="button"
                        onClick={() => handleReativar(item)}
                        className="py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Reativar colaborador na empresa"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Reativar</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDemitirColaborador(item)}
                        className="py-1.5 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Marcar como demitido e liberar vaga de ônibus"
                      >
                        <UserX className="w-3.5 h-3.5 text-amber-700" />
                        <span>Demitir</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                      title="Excluir permanentemente do banco de dados"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Tabela */}
      {viewMode === 'table' && cadastrosFiltrados.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 text-stone-700 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Matrícula</th>
                  <th className="py-3 px-4">Turma</th>
                  <th className="py-3 px-4">Bairro / Embarque</th>
                  <th className="py-3 px-4">Linha Ônibus</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {cadastrosFiltrados.map((item) => {
                  const isDemitido = item.status === 'Inativo';
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {item.nome}
                        {item.obs && <span className="block text-[10px] text-stone-400 font-normal">{item.obs}</span>}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">{item.matricula}</td>
                      <td className="py-3 px-4">{item.turma}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold block text-stone-800">{item.bairro}</span>
                        <span className="text-[11px] text-stone-500">{item.ponto}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {item.linhaId || item.onibus ? (
                            <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-emerald-100 text-emerald-950 border border-emerald-300">
                              {item.linhaId || item.onibus}
                            </span>
                          ) : item.rotaSugerida ? (
                            <div>
                              <span className="font-bold text-stone-800 block text-xs">{item.rotaSugerida}</span>
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                Sugerida
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-700 italic font-normal">Pendente</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setColabTrocarLinha(item);
                              setLinhaSelecionadaParaTroca(item.linhaId || item.onibus || '');
                            }}
                            className="p-1 rounded text-stone-400 hover:text-[#19502f] hover:bg-emerald-50 cursor-pointer"
                            title="Trocar linha de transporte"
                          >
                            <Bus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[item.status]?.badgeBg}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'Rota sugerida' && (
                            <button
                              type="button"
                              onClick={() => handleAprovarRota(item)}
                              className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                              title="Confirmar rota sugerida"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={recalculandoId === item.id}
                            onClick={() => handleRecalcular(item)}
                            className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 cursor-pointer"
                            title="Recalcular linha ideal"
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${recalculandoId === item.id ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCadastroSelecionado(item);
                              setModalEditOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {isDemitido ? (
                            <button
                              type="button"
                              onClick={() => handleReativar(item)}
                              className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                              title="Reativar colaborador"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDemitirColaborador(item)}
                              className="p-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer"
                              title="Marcar como demitido / desligado"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 cursor-pointer"
                            title="Excluir definitivamente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Demissão / Desligamento */}
      {demitirColaborador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 flex-none">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Registrar Desligamento / Demissão</h3>
                <p className="text-xs text-stone-600 mt-1">
                  Confirma a demissão de <strong>{demitirColaborador.nome}</strong> (Matrícula: {demitirColaborador.matricula})?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">⚠️ Consequências da inativação:</p>
              <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                <li>O colaborador é movido para a lista de <strong>Demitidos/Inativos</strong>.</li>
                <li>A vaga na rota <strong>{demitirColaborador.onibus || 'atual'}</strong> será liberada para outro trabalhador.</li>
                <li>Você poderá reativá-lo a qualquer momento se necessário.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Motivo / Observação do RH (Opcional):
              </label>
              <input
                type="text"
                value={motivoDemitir}
                onChange={(e) => setMotivoDemitir(e.target.value)}
                placeholder="Ex.: Término de contrato, pedido de demissão..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#19502f] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setDemitirColaborador(null);
                  setMotivoDemitir('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarDemissao}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-2xs"
              >
                Confirmar Desligamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição / Novo */}
      <ModalEdit
        isOpen={modalEditOpen}
        cadastro={cadastroSelecionado}
        onClose={() => {
          setModalEditOpen(false);
          setCadastroSelecionado(null);
        }}
        onSave={handleSalvarModal}
      />

      {/* Modal de Exclusão Definitiva */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteId)}
        title="Excluir Definitivamente"
        message="Tem certeza que deseja apagar permanentemente este cadastro? Esta ação remove todo o histórico."
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmarExclusao}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Modal de Trocar Linha de Transporte */}
      {colabTrocarLinha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-[#19502f] flex-none">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900">Trocar Linha de Transporte</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Colaborador: <strong>{colabTrocarLinha.nome}</strong> ({colabTrocarLinha.turma})
                </p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
              <p>Bairro: <strong>{colabTrocarLinha.bairro}</strong></p>
              <p>Linha Atual: <strong>{colabTrocarLinha.linhaId || colabTrocarLinha.onibus || 'Nenhuma'}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Selecione a Nova Linha:
              </label>
              <select
                value={linhaSelecionadaParaTroca}
                onChange={(e) => setLinhaSelecionadaParaTroca(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white font-semibold"
              >
                <option value="">Selecione uma linha...</option>
                {rotas.map((r) => {
                  const ocupados = cadastros.filter(c => c.status !== 'Inativo' && (c.linhaId === r.codigo || c.onibus === r.codigo || c.linhaId === r.id)).length;
                  const livres = Math.max(0, (r.capacidade || 44) - ocupados);
                  return (
                    <option key={r.id} value={r.codigo || r.id}>
                      {r.codigo} • {r.turmas?.join('/') || r.turma} ({ocupados}/{r.capacidade || 44} ocupados • {livres} livres)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setColabTrocarLinha(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvandoTroca || !linhaSelecionadaParaTroca}
                onClick={handleConfirmarTrocaLinha}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#19502f] hover:bg-[#0d2b19] transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {salvandoTroca ? 'Salvando...' : 'Salvar Nova Linha'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
