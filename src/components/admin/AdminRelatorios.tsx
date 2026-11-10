import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Bus,
  Users,
  UserX,
  Clock,
  CheckCircle2,
  Filter,
  MapPin,
  Phone,
  BarChart2,
  AlertTriangle,
} from 'lucide-react';
import { ColaboradorCadastro, RotaLinha } from '../../types';
import { baixarCsvColaboradores, baixarCsvOcupacao, baixarCsvDemissoes } from '../../services/api';

interface AdminRelatoriosProps {
  cadastros: ColaboradorCadastro[];
  rotas?: RotaLinha[];
}

export const AdminRelatorios: React.FC<AdminRelatoriosProps> = ({
  cadastros,
  rotas = [],
}) => {
  const [relatorioAtivo, setRelatorioAtivo] = useState<'romaneio' | 'ocupacao' | 'demissoes'>('ocupacao');
  const [linhaSelecionada, setLinhaSelecionada] = useState<string>('todas');

  // Relatório 1: Agrupado por Ônibus / Linha
  const dadosPorLinha = useMemo(() => {
    const map: Record<string, ColaboradorCadastro[]> = {};
    
    cadastros.forEach((c) => {
      if (c.status !== 'Inativo') {
        const rota = c.linhaId?.trim() || c.onibus?.trim() || 'SEM ROTA DEFINIDA (PENDENTE)';
        if (!map[rota]) map[rota] = [];
        map[rota].push(c);
      }
    });

    return map;
  }, [cadastros]);

  // Lista de rotas ativas
  const listaRotas = useMemo(() => Object.keys(dadosPorLinha).sort(), [dadosPorLinha]);

  // Relatório 2: Ocupação por Linha (Item 4.6)
  const relatorioOcupacao = useMemo(() => {
    return rotas.map((r) => {
      const capacidade = r.capacidade || 44;
      const passageiros = dadosPorLinha[r.codigo] || dadosPorLinha[r.id] || [];
      const ocupadas = passageiros.length;
      const vagasRestantes = Math.max(0, capacidade - ocupadas);
      const percentual = Math.round((ocupadas / capacidade) * 100);
      const turmaLabel = r.turmas?.join(', ') || r.turma || 'Geral';

      return {
        id: r.id,
        codigo: r.codigo,
        turma: turmaLabel,
        capacidade,
        ocupadas,
        vagasRestantes,
        percentual,
        horarioInicio: r.horarioInicio || r.horario,
        km: r.km,
      };
    }).sort((a, b) => b.percentual - a.percentual);
  }, [rotas, dadosPorLinha]);

  // Relatório 3: Demitidos e Movimentações
  const demitidos = useMemo(() => {
    return cadastros.filter((c) => c.status === 'Inativo');
  }, [cadastros]);

  const pendentes = useMemo(() => {
    return cadastros.filter((c) => !c.onibus && c.status !== 'Inativo');
  }, [cadastros]);

  const handleImprimir = () => {
    window.print();
  };

  const handleExportarCsv = () => {
    if (relatorioAtivo === 'ocupacao') {
      baixarCsvOcupacao(rotas, cadastros);
    } else if (relatorioAtivo === 'demissoes') {
      baixarCsvDemissoes(cadastros);
    } else {
      baixarCsvColaboradores(cadastros);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header dos Relatórios com Seleção */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#19502f]" />
              Relatórios Operacionais e de Ocupação • U&M
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Documentos oficiais para fiscalização de frota, romaneio dos motoristas, taxa de ocupação dos ônibus e controle de demissões.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImprimir}
              className="px-4 py-2 rounded-xl bg-[#19502f] hover:bg-[#0d2b19] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Relatório</span>
            </button>

            <button
              type="button"
              onClick={handleExportarCsv}
              className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Seletor dos Relatórios */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setRelatorioAtivo('ocupacao')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              relatorioAtivo === 'ocupacao'
                ? 'bg-[#19502f] text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Relatório de Ocupação por Linha</span>
          </button>

          <button
            type="button"
            onClick={() => setRelatorioAtivo('romaneio')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              relatorioAtivo === 'romaneio'
                ? 'bg-[#19502f] text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>Romaneio & Lista de Passageiros</span>
          </button>

          <button
            type="button"
            onClick={() => setRelatorioAtivo('demissoes')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              relatorioAtivo === 'demissoes'
                ? 'bg-[#19502f] text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>Demissões & Vagas Liberadas</span>
            <span className="text-[11px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-mono font-bold">
              {demitidos.length}
            </span>
          </button>
        </div>
      </div>

      {/* ================= RELATÓRIO 1: OCUPAÇÃO POR LINHA (Item 4.6) ================= */}
      {relatorioAtivo === 'ocupacao' && (
        <div className="space-y-6">
          
          {/* Cabeçalho do Relatório */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#19502f]" />
                  Relatório de Ocupação e Lotação por Linha de Transporte
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  U&M Mineração e Construção • Parauapebas - PA • Atualizado em tempo real
                </p>
              </div>

              <button
                type="button"
                onClick={() => baixarCsvOcupacao(rotas, cadastros)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#19502f] border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer print:hidden"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV Ocupação</span>
              </button>
            </div>

            {/* Tabela de Ocupação por Linha (Item 4.6) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-100 text-stone-800 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Código da Linha</th>
                    <th className="py-3 px-4">Turma / Setor</th>
                    <th className="py-3 px-4 text-center">Capacidade</th>
                    <th className="py-3 px-4 text-center">Ocupadas</th>
                    <th className="py-3 px-4 text-center">Vagas Restantes</th>
                    <th className="py-3 px-4">Taxa de Ocupação</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {relatorioOcupacao.map((item) => {
                    const isLotada = item.percentual >= 100 || item.vagasRestantes === 0;
                    const barColor = isLotada || item.percentual > 90
                      ? 'bg-red-500'
                      : item.percentual >= 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-600';

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-stone-900 text-sm">
                          {item.codigo}
                        </td>
                        <td className="py-3 px-4">{item.turma}</td>
                        <td className="py-3 px-4 text-center font-bold text-stone-800">{item.capacidade}</td>
                        <td className="py-3 px-4 text-center font-bold text-[#19502f]">{item.ocupadas}</td>
                        <td className={`py-3 px-4 text-center font-bold ${item.vagasRestantes === 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {item.vagasRestantes}
                        </td>
                        <td className="py-3 px-4 min-w-[160px]">
                          <div className="space-y-1">
                            <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${Math.min(100, Math.max(3, item.percentual))}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-stone-600">
                              {item.percentual}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isLotada ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-red-600 text-white animate-pulse">
                              LOTADA
                            </span>
                          ) : item.percentual > 90 ? (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              QUASE CHEIA
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              DISPONÍVEL
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rodapé impresso */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-400">
              <span>Total de {relatorioOcupacao.length} linhas cadastradas</span>
              <span>U&M Logística e Frotas</span>
            </div>
          </div>

        </div>
      )}

      {/* ================= RELATÓRIO 2: ROMANEIO POR ÔNIBUS ================= */}
      {relatorioAtivo === 'romaneio' && (
        <div className="space-y-6">
          {/* Filtro de Linha */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
              <Filter className="w-4 h-4 text-emerald-700" />
              <span>Filtrar Linha de Ônibus:</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setLinhaSelecionada('todas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  linhaSelecionada === 'todas'
                    ? 'bg-[#19502f] text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Todas as Linhas
              </button>

              {listaRotas.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setLinhaSelecionada(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    linhaSelecionada === r
                      ? 'bg-[#19502f] text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {r} ({dadosPorLinha[r].length})
                </button>
              ))}
            </div>
          </div>

          {/* Listagem dos Romaneios por Ônibus */}
          {listaRotas
            .filter((r) => linhaSelecionada === 'todas' || linhaSelecionada === r)
            .map((rota) => {
              const passageiros = dadosPorLinha[rota] || [];

              return (
                <div
                  key={rota}
                  className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 sm:p-6 space-y-4 print:border-black print:shadow-none print:break-after-page"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-stone-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-emerald-100 text-[#19502f] flex items-center justify-center font-bold">
                          <Bus className="w-4 h-4" />
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                          Linha: {rota}
                        </h3>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        U&M Transporte de Colaboradores • Parauapebas - PA
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full font-bold border border-emerald-300">
                        {passageiros.length} Passageiros Alocados
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-stone-700">
                      <thead className="bg-stone-100 text-stone-800 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Colaborador</th>
                          <th className="py-2.5 px-3">Matrícula</th>
                          <th className="py-2.5 px-3">Turma</th>
                          <th className="py-2.5 px-3">Bairro</th>
                          <th className="py-2.5 px-3">Ponto de Embarque</th>
                          <th className="py-2.5 px-3">Contato</th>
                          <th className="py-2.5 px-3 text-center print:table-cell">Assinatura</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {passageiros.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-stone-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-stone-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-stone-900">{p.nome}</td>
                            <td className="py-2.5 px-3 font-mono">{p.matricula}</td>
                            <td className="py-2.5 px-3">{p.turma}</td>
                            <td className="py-2.5 px-3 font-medium">{p.bairro}</td>
                            <td className="py-2.5 px-3 font-semibold text-emerald-900">{p.ponto}</td>
                            <td className="py-2.5 px-3 text-stone-500">{p.telefone || '-'}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-block w-4 h-4 border border-stone-400 rounded-sm" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-6 border-t border-stone-200 grid grid-cols-2 gap-8 text-center text-xs text-stone-500 print:grid">
                    <div>
                      <div className="border-b border-stone-400 w-48 mx-auto mb-1" />
                      <span>Assinatura do Motorista</span>
                    </div>
                    <div>
                      <div className="border-b border-stone-400 w-48 mx-auto mb-1" />
                      <span>Fiscal de Transporte U&M</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ================= RELATÓRIO 3: DEMISSÕES & MOVIMENTAÇÕES ================= */}
      {relatorioAtivo === 'demissoes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              Controle de Demissões, Desligamentos e Vagas Liberadas
            </h3>
            <p className="text-xs text-stone-500">
              Relação de trabalhadores que foram inativados do transporte, liberando assentos nos ônibus.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <span className="text-xs font-bold text-red-900 uppercase tracking-wider block">
                  Total de Demitidos:
                </span>
                <span className="text-2xl font-black text-red-900 mt-1 block">
                  {demitidos.length}
                </span>
                <span className="text-[11px] text-red-700 mt-0.5 block">Vagas de transporte liberadas</span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                  Sem Rota Definida:
                </span>
                <span className="text-2xl font-black text-amber-900 mt-1 block">
                  {pendentes.length}
                </span>
                <span className="text-[11px] text-amber-800 mt-0.5 block">Aguardando alocação pelo RH</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                  Colaboradores em Atividade:
                </span>
                <span className="text-2xl font-black text-emerald-900 mt-1 block">
                  {cadastros.filter((c) => c.status !== 'Inativo').length}
                </span>
                <span className="text-[11px] text-emerald-700 mt-0.5 block">Utilizando frota U&M</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-6 space-y-4">
            <h4 className="font-bold text-stone-900 text-sm flex items-center justify-between">
              <span>Histórico de Colaboradores Desligados</span>
              <span className="text-xs text-stone-400 font-normal">{demitidos.length} registros</span>
            </h4>

            {demitidos.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                Nenhum colaborador registrado como demitido até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 text-stone-800 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Colaborador</th>
                      <th className="py-2.5 px-3">Matrícula</th>
                      <th className="py-2.5 px-3">Última Turma</th>
                      <th className="py-2.5 px-3">Bairro / Cidade</th>
                      <th className="py-2.5 px-3">Data de Desligamento / Obs. do RH</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {demitidos.map((d) => (
                      <tr key={d.id} className="hover:bg-stone-50">
                        <td className="py-2.5 px-3 font-bold text-stone-900">{d.nome}</td>
                        <td className="py-2.5 px-3 font-mono">{d.matricula}</td>
                        <td className="py-2.5 px-3">{d.turma}</td>
                        <td className="py-2.5 px-3">{d.bairro} ({d.cidade})</td>
                        <td className="py-2.5 px-3 text-stone-600">
                          {d.obs || (d.demitidoEm ? `Desligado em ${d.demitidoEm}` : 'Sem observação')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700 border border-stone-300">
                            Inativo / Demitido
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
