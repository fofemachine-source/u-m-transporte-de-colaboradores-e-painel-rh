import React, { useState, useMemo } from 'react';
import {
  FileEdit,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Bus,
  MapPin,
  Calendar,
  MessageSquare,
  Search,
  Check,
  X,
  Filter,
} from 'lucide-react';
import { SolicitacaoEndereco, ColaboradorCadastro, RotaLinha, AdminView } from '../../types';
import { responderSolicitacaoEndereco, atualizarCadastro } from '../../services/api';

interface AdminSolicitacoesProps {
  solicitacoes: SolicitacaoEndereco[];
  cadastros: ColaboradorCadastro[];
  rotas: RotaLinha[];
  onRefresh: () => Promise<void>;
  onDefinirPontoNoMapa?: (colab: ColaboradorCadastro) => void;
  onChangeView: (view: AdminView) => void;
}

export const AdminSolicitacoes: React.FC<AdminSolicitacoesProps> = ({
  solicitacoes,
  cadastros,
  rotas,
  onRefresh,
  onDefinirPontoNoMapa,
  onChangeView,
}) => {
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | 'Pendente' | 'Aprovada' | 'Recusada'>('Pendente');
  const [busca, setBusca] = useState('');
  const [solicitacaoAtiva, setSolicitacaoAtiva] = useState<SolicitacaoEndereco | null>(null);
  
  // Modal de Resposta / Justificativa
  const [modalAcao, setModalAcao] = useState<'aprovar' | 'recusar' | null>(null);
  const [respostaRH, setRespostaRH] = useState('');
  const [processando, setProcessando] = useState(false);

  // Contagem de ocupação por linha
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

  // Contadores
  const contadores = useMemo(() => {
    const total = solicitacoes.length;
    const pendentes = solicitacoes.filter((s) => s.status === 'Pendente').length;
    const aprovadas = solicitacoes.filter((s) => s.status === 'Aprovada').length;
    const recusadas = solicitacoes.filter((s) => s.status === 'Recusada').length;
    return { total, pendentes, aprovadas, recusadas };
  }, [solicitacoes]);

  // Filtragem
  const solicitacoesFiltradas = useMemo(() => {
    return solicitacoes.filter((s) => {
      if (filtroStatus !== 'Todos' && s.status !== filtroStatus) return false;
      if (busca.trim()) {
        const q = busca.toLowerCase().trim();
        const nome = (s.nomeColaborador || '').toLowerCase();
        const mat = (s.matricula || '').toLowerCase();
        const bairro = (s.bairro || '').toLowerCase();
        const end = (s.enderecoNovo || '').toLowerCase();
        return nome.includes(q) || mat.includes(q) || bairro.includes(q) || end.includes(q);
      }
      return true;
    });
  }, [solicitacoes, filtroStatus, busca]);

  // Abre modal de confirmação de resposta
  const handleAbrirAcao = (solic: SolicitacaoEndereco, acao: 'aprovar' | 'recusar') => {
    setSolicitacaoAtiva(solic);
    setModalAcao(acao);
    setRespostaRH(
      acao === 'aprovar'
        ? 'Solicitação aprovada. Ponto de embarque será definido pelo RH.'
        : 'Infelizmente a rota de destino não possui vagas no turno atual.'
    );
  };

  // Submete Aprovação ou Recusa
  const handleConfirmarAcao = async () => {
    if (!solicitacaoAtiva || !modalAcao) return;
    setProcessando(true);
    try {
      const novoStatus = modalAcao === 'aprovar' ? 'Aprovada' : 'Recusada';
      await responderSolicitacaoEndereco(solicitacaoAtiva.id, novoStatus, respostaRH);

      // Se aprovado, atualizar também o colaborador
      if (modalAcao === 'aprovar') {
        const colab = cadastros.find((c) => c.id === solicitacaoAtiva.colaboradorId);
        if (colab) {
          const updates: Partial<ColaboradorCadastro> = {
            endereco: solicitacaoAtiva.enderecoNovo,
            bairro: solicitacaoAtiva.bairro,
            cidade: solicitacaoAtiva.cidade,
            ponto: 'Ponto em definição pelo RH',
            pontoEmbarque: null, // RH deve definir no mapa
          };
          if (solicitacaoAtiva.linhaSugeridaId) {
            updates.linhaId = solicitacaoAtiva.linhaSugeridaId;
            updates.onibus = solicitacaoAtiva.linhaSugeridaId;
          }
          await atualizarCadastro(colab.id, updates);
        }
      }

      await onRefresh();
      setModalAcao(null);

      // Se aprovado, convida o admin a marcar o ponto no mapa
      if (modalAcao === 'aprovar') {
        const colabAtualizado = cadastros.find((c) => c.id === solicitacaoAtiva.colaboradorId);
        if (colabAtualizado && onDefinirPontoNoMapa) {
          if (window.confirm('Mudança aprovada com sucesso! Deseja abrir o mapa agora para posicionar o novo ponto de embarque do colaborador?')) {
            onDefinirPontoNoMapa(colabAtualizado);
          }
        }
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao processar solicitação.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header da Seção */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-[#1b6e47]" />
              Solicitações de Mudança de Endereço
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Colaboradores que solicitaram atualização de residência. O RH avalia a nova linha sugerida, disponibilidade de vagas e define o ponto no mapa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{contadores.pendentes} Pendentes</span>
            </span>
          </div>
        </div>

        {/* Abas de Status & Busca */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
            {(['Pendente', 'Todos', 'Aprovada', 'Recusada'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFiltroStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroStatus === st
                    ? 'bg-white text-[#1b6e47] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>{st}</span>
                {st === 'Pendente' && contadores.pendentes > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono">
                    {contadores.pendentes}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por colaborador ou bairro..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Empty State */}
      {solicitacoesFiltradas.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center">
          <FileEdit className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-700">Nenhuma solicitação encontrada</h3>
          <p className="text-xs text-stone-500 mt-1">
            {filtroStatus === 'Pendente'
              ? 'Não há solicitações pendentes de análise no momento.'
              : 'Nenhum registro corresponde aos filtros selecionados.'}
          </p>
        </div>
      )}

      {/* 3. Grid de Solicitações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {solicitacoesFiltradas.map((s) => {
          const colab = cadastros.find((c) => c.id === s.colaboradorId);
          const linhaSugerida = rotas.find((r) => r.id === s.linhaSugeridaId || r.codigo === s.linhaSugeridaId);
          const capacidade = linhaSugerida?.capacidade ?? 44;
          const ocupadas = ocupacaoPorLinha[s.linhaSugeridaId || ''] || 0;
          const vagasLivres = Math.max(0, capacidade - ocupadas);
          const lotada = vagasLivres === 0;

          return (
            <div
              key={s.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 border-l-4 ${
                s.status === 'Pendente'
                  ? 'border-l-amber-500'
                  : s.status === 'Aprovada'
                  ? 'border-l-emerald-600'
                  : 'border-l-red-500'
              }`}
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#1b6e47] border border-emerald-200 flex items-center justify-center font-black text-sm flex-none">
                      {s.nomeColaborador.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-stone-900 leading-tight">
                        {s.nomeColaborador}
                      </h3>
                      <span className="text-xs text-stone-500 font-mono">
                        Matrícula: {s.matricula || colab?.matricula} • Turma: {colab?.turma || 'Geral'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      s.status === 'Pendente'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : s.status === 'Aprovada'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : 'bg-red-100 text-red-900 border border-red-200'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                {/* Comparativo: Endereço Atual vs Novo Endereço */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs">
                  {/* Endereço Atual */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Endereço Atual:
                    </span>
                    <p className="font-semibold text-stone-800 leading-snug">
                      {s.enderecoAtual}
                    </p>
                    <span className="text-stone-500 block text-[11px]">
                      Bairro: <strong>{s.bairroAtual}</strong> ({s.cidadeAtual})
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 text-[10px] font-bold mt-1">
                      Linha Atual: {s.linhaAtualId || colab?.onibus || 'Sem Linha'}
                    </span>
                  </div>

                  {/* Novo Endereço */}
                  <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-stone-200 pt-2 sm:pt-0 sm:pl-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b6e47] block flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" /> Novo Endereço Solicitado:
                    </span>
                    <p className="font-bold text-stone-900 leading-snug">
                      {s.enderecoNovo}
                    </p>
                    <span className="text-stone-700 block text-[11px]">
                      Bairro: <strong className="text-emerald-900">{s.bairro}</strong> ({s.cidade})
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold mt-1">
                      Linha Sugerida: {s.linhaSugeridaId || 'A definir'}
                    </span>
                  </div>
                </div>

                {/* Verificação de Vagas da Nova Linha */}
                <div className="mt-3 p-3 rounded-xl bg-white border border-stone-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800 flex items-center gap-1.5">
                      <Bus className="w-3.5 h-3.5 text-[#1b6e47]" />
                      Capacidade da Linha {s.linhaSugeridaId}:
                    </span>
                    {lotada ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white animate-pulse">
                        LOTADA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {vagasLivres} {vagasLivres === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Ocupação atual: <strong>{ocupadas}/{capacidade}</strong> passageiros.
                  </p>
                </div>

                {/* Detalhes extras: motivo e data */}
                <div className="mt-3 text-xs text-stone-500 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    Vigência: <strong>{s.dataVigencia}</strong>
                  </span>
                  <span>•</span>
                  <span>Motivo: <strong className="capitalize">{s.motivo}</strong></span>
                  {s.observacao && (
                    <p className="w-full text-[11px] text-stone-600 italic mt-1 bg-stone-50 p-2 rounded-lg border border-stone-100">
                      "{s.observacao}"
                    </p>
                  )}
                </div>

                {/* Resposta do RH gravada */}
                {s.respostaRH && (
                  <div className="mt-3 p-2.5 rounded-xl bg-stone-100 text-xs text-stone-700">
                    <span className="font-bold text-stone-900 block text-[10px] uppercase tracking-wider">
                      Parecer do RH:
                    </span>
                    <span>{s.respostaRH}</span>
                  </div>
                )}
              </div>

              {/* Ações para Solicitações Pendentes */}
              {s.status === 'Pendente' ? (
                <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAbrirAcao(s, 'aprovar')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#1b6e47] hover:bg-[#155a3a] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aprovar Mudança</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAbrirAcao(s, 'recusar')}
                    className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Recusar</span>
                  </button>
                </div>
              ) : s.status === 'Aprovada' && colab ? (
                <div className="pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => onDefinirPontoNoMapa?.(colab)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1b6e47] border border-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Posicionar Ponto no Mapa</span>
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Modal de Confirmação e Justificativa */}
      {modalAcao && solicitacaoAtiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-2xl flex-none ${
                modalAcao === 'aprovar' ? 'bg-emerald-100 text-[#1b6e47]' : 'bg-red-100 text-red-700'
              }`}>
                {modalAcao === 'aprovar' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900">
                  {modalAcao === 'aprovar' ? 'Aprovar Mudança de Endereço' : 'Recusar Solicitação'}
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Colaborador: <strong>{solicitacaoAtiva.nomeColaborador}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
              <p>Novo Bairro: <strong>{solicitacaoAtiva.bairro}</strong></p>
              <p>Nova Linha: <strong>{solicitacaoAtiva.linhaSugeridaId}</strong></p>
              {modalAcao === 'aprovar' && (
                <p className="text-emerald-800 font-semibold pt-1">
                  ✓ O colaborador terá o endereço atualizado e você poderá marcar o novo ponto de embarque no mapa.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Justificativa / Observação do RH:
              </label>
              <textarea
                rows={3}
                value={respostaRH}
                onChange={(e) => setRespostaRH(e.target.value)}
                placeholder="Insira a justificativa ou orientações..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setModalAcao(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processando}
                onClick={handleConfirmarAcao}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer ${
                  modalAcao === 'aprovar' ? 'bg-[#1b6e47] hover:bg-[#155a3a]' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processando ? 'Processando...' : modalAcao === 'aprovar' ? 'Confirmar Aprovação' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
