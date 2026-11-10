import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  User,
  Bus,
  Clock,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Printer,
  MessageCircle,
  Save,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { EscalaSabado, EscalaSabadoItem, ColaboradorCadastro, RotaLinha } from '../types';
import { fetchEscalasSabado, salvarEscalaSabado, excluirEscalaSabado, baixarCsvEscalaSabado } from '../services/api';

interface EscalaSabadoViewProps {
  cadastros: ColaboradorCadastro[];
  rotas: RotaLinha[];
  isSupervisorView?: boolean;
}

export const EscalaSabadoView: React.FC<EscalaSabadoViewProps> = ({
  cadastros,
  rotas,
}) => {
  const [escalas, setEscalas] = useState<EscalaSabado[]>([]);
  const [escalaAtivaId, setEscalaAtivaId] = useState<string>('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExclusaoEscala, setConfirmandoExclusaoEscala] = useState(false);

  // Modal para adicionar colaborador à escala
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [buscaColab, setBuscaColab] = useState('');
  const [colabSelecionado, setColabSelecionado] = useState<ColaboradorCadastro | null>(null);

  // Campos reduzidos para Adicionar: Nome, Bairro, Rua, Ponto de embarque (+ Linha)
  const [novoItemNome, setNovoItemNome] = useState('');
  const [novoItemBairro, setNovoItemBairro] = useState('');
  const [novoItemRua, setNovoItemRua] = useState('');
  const [novoItemPonto, setNovoItemPonto] = useState('');
  const [novoItemLinha, setNovoItemLinha] = useState('ADM01');

  // Modal para alterar / editar colaborador existente na escala
  const [itemEditando, setItemEditando] = useState<EscalaSabadoItem | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editBairro, setEditBairro] = useState('');
  const [editRua, setEditRua] = useState('');
  const [editPonto, setEditPonto] = useState('');
  const [editLinha, setEditLinha] = useState('ADM01');

  const mostrarFeedback = (msg: string) => {
    setMensagemSucesso(msg);
    setTimeout(() => {
      setMensagemSucesso((atual) => (atual === msg ? null : atual));
    }, 3500);
  };

  // Carregar dados de escalas
  const carregarEscalas = async () => {
    setCarregando(true);
    try {
      const data = await fetchEscalasSabado();
      setEscalas(data);
      if (data.length > 0 && !escalaAtivaId) {
        setEscalaAtivaId(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao buscar escalas:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarEscalas();
  }, []);

  // Escala atualmente em exibição
  const escalaAtiva = useMemo(() => {
    return escalas.find((e) => e.id === escalaAtivaId) || escalas[0] || null;
  }, [escalas, escalaAtivaId]);

  // Próximo sábado padrão (formato DD/MM/YYYY)
  const getProximoSabado = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('pt-BR');
  };

  // Persistir escala automaticamente após alterações
  const persistirEscala = async (escalaAtualizada: EscalaSabado, msgFeedback?: string) => {
    setEscalas((prev) => {
      const existe = prev.some((e) => e.id === escalaAtualizada.id);
      if (existe) {
        return prev.map((e) => (e.id === escalaAtualizada.id ? escalaAtualizada : e));
      }
      return [escalaAtualizada, ...prev];
    });

    try {
      const salva = await salvarEscalaSabado(escalaAtualizada);
      setEscalas((prev) => prev.map((e) => (e.id === salva.id ? salva : e)));
      if (msgFeedback) mostrarFeedback(msgFeedback);
    } catch (err: any) {
      console.error('Erro ao persistir escala:', err);
    }
  };

  // Criar nova escala
  const handleCriarNovaEscala = async () => {
    const novaId = `ESC-${Date.now().toString(36).toUpperCase()}`;
    const nova: EscalaSabado = {
      id: novaId,
      dataSabado: getProximoSabado(),
      supervisorNome: 'Supervisor U&M',
      supervisorTelefone: '(94) 99200-0000',
      status: 'Rascunho',
      observacoesGerais: '',
      observacoesLinhas: {},
      criadoEm: new Date().toLocaleDateString('pt-BR'),
      itens: [],
    };
    setEscalas((prev) => [nova, ...prev]);
    setEscalaAtivaId(novaId);
    await persistirEscala(nova, 'Nova escala criada! Adicione os colaboradores abaixo.');
  };

  // Atualizar campos da escala ativa
  const handleAtualizarCampoEscala = (campo: keyof EscalaSabado, valor: any) => {
    if (!escalaAtiva) return;
    const atualizada: EscalaSabado = { ...escalaAtiva, [campo]: valor };
    setEscalas((prev) =>
      prev.map((e) => (e.id === escalaAtiva.id ? atualizada : e))
    );
    salvarEscalaSabado(atualizada).catch(() => {});
  };

  // Salvar escala ativa no servidor (botão explícito)
  const handleSalvarEscala = async () => {
    if (!escalaAtiva) return;
    setSalvando(true);
    setErro(null);
    try {
      const salva = await salvarEscalaSabado(escalaAtiva);
      setEscalas((prev) => prev.map((e) => (e.id === salva.id ? salva : e)));
      mostrarFeedback(' Alterações da Escala Parvi salvas com sucesso!');
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar escala.');
    } finally {
      setSalvando(false);
    }
  };

  // Excluir escala ativa
  const handleExcluirEscala = async () => {
    if (!escalaAtiva) return;
    try {
      await excluirEscalaSabado(escalaAtiva.id);
      const restantes = escalas.filter((e) => e.id !== escalaAtiva.id);
      setEscalas(restantes);
      setEscalaAtivaId(restantes[0]?.id || '');
      setConfirmandoExclusaoEscala(false);
      mostrarFeedback('Escala excluída com sucesso.');
    } catch (err: any) {
      setErro(err.message || 'Erro ao excluir escala.');
    }
  };

  // Atualizar campo de observação (OBS.) da barra da linha
  const handleAtualizarObsLinha = (linhaCod: string, valor: string) => {
    if (!escalaAtiva) return;
    const obsLinhas = { ...(escalaAtiva.observacoesLinhas || {}), [linhaCod]: valor };
    handleAtualizarCampoEscala('observacoesLinhas', obsLinhas);
  };

  // Abrir modal de adicionar colaborador (opcionalmente pré-selecionando a linha)
  const handleAbrirModalAdicionar = (linhaPreSelecionada?: string) => {
    setColabSelecionado(null);
    setBuscaColab('');
    setNovoItemNome('');
    setNovoItemBairro('');
    setNovoItemRua('');
    setNovoItemPonto('');
    setNovoItemLinha(linhaPreSelecionada || rotas[0]?.codigo || 'ADM01');
    setModalAdicionarAberto(true);
  };

  // Selecionar colaborador cadastrado para pré-preencher os 4 campos
  const handleSelecionarColaborador = (c: ColaboradorCadastro) => {
    setColabSelecionado(c);
    setNovoItemNome(c.nome || '');
    setNovoItemBairro(c.bairro || '');
    setNovoItemRua(c.endereco || '');
    setNovoItemPonto(c.pontoEmbarque?.descricao || c.ponto || 'Ponto no bairro');
    setNovoItemLinha(c.linhaId || c.onibus || 'ADM01');
  };

  // Adicionar item à escala (apenas Nome, Bairro, Rua, Ponto de embarque + Linha)
  const handleAdicionarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalaAtiva || !novoItemNome.trim()) {
      return;
    }

    const rota = rotas.find((r) => r.id === novoItemLinha || r.codigo === novoItemLinha);

    const novoItem: EscalaSabadoItem = {
      id: `ITEM-${Date.now().toString(36).toUpperCase()}`,
      colaboradorId: colabSelecionado?.id,
      nome: novoItemNome.trim(),
      matricula: colabSelecionado?.matricula || '',
      turma: colabSelecionado?.turma || 'Administrativo',
      bairro: novoItemBairro.trim() || 'Centro',
      rua: novoItemRua.trim() || '',
      endereco: novoItemRua.trim() || '',
      pontoEmbarque: novoItemPonto.trim() || 'A definir',
      linhaId: novoItemLinha || 'ADM01',
      horarioEmbarque: rota?.horarioInicio || '04:30',
    };

    const novosItens = [...(escalaAtiva.itens || []), novoItem];
    const escalaAtualizada: EscalaSabado = {
      ...escalaAtiva,
      itens: novosItens,
    };

    setModalAdicionarAberto(false);
    setColabSelecionado(null);
    setBuscaColab('');
    setNovoItemNome('');
    setNovoItemBairro('');
    setNovoItemRua('');
    setNovoItemPonto('');

    await persistirEscala(escalaAtualizada, `Colaborador "${novoItem.nome}" adicionado à Escala Parvi!`);
  };

  // Abrir modal de edição/alteração de colaborador
  const handleAbrirEdicao = (it: EscalaSabadoItem) => {
    setItemEditando(it);
    setEditNome(it.nome || '');
    setEditBairro(it.bairro || '');
    setEditRua(it.rua || it.endereco || '');
    setEditPonto(it.pontoEmbarque || '');
    setEditLinha(it.linhaId || 'ADM01');
  };

  // Salvar alteração do colaborador na escala
  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalaAtiva || !itemEditando || !editNome.trim()) return;

    const novosItens = (escalaAtiva.itens || []).map((it) => {
      if (it.id === itemEditando.id) {
        return {
          ...it,
          nome: editNome.trim(),
          bairro: editBairro.trim(),
          rua: editRua.trim(),
          endereco: editRua.trim(),
          pontoEmbarque: editPonto.trim(),
          linhaId: editLinha,
        };
      }
      return it;
    });

    const escalaAtualizada: EscalaSabado = {
      ...escalaAtiva,
      itens: novosItens,
    };

    setItemEditando(null);
    await persistirEscala(escalaAtualizada, 'Dados do colaborador atualizados na Escala Parvi!');
  };

  // Excluir colaborador da escala imediatamente e persistir
  const handleRemoverItem = async (itemId: string) => {
    if (!escalaAtiva) return;
    const item = (escalaAtiva.itens || []).find((i) => i.id === itemId);
    const novosItens = (escalaAtiva.itens || []).filter((i) => i.id !== itemId);
    const escalaAtualizada: EscalaSabado = {
      ...escalaAtiva,
      itens: novosItens,
    };
    await persistirEscala(
      escalaAtualizada,
      item ? `"${item.nome}" removido da escala.` : 'Colaborador removido da escala.'
    );
  };

  // Excluir todos os itens de uma linha específica na escala
  const handleRemoverLinhaDaEscala = async (linhaCod: string) => {
    if (!escalaAtiva) return;
    const novosItens = (escalaAtiva.itens || []).filter((i) => (i.linhaId || 'OUTRAS') !== linhaCod);
    const obsLinhas = { ...(escalaAtiva.observacoesLinhas || {}) };
    delete obsLinhas[linhaCod];
    const escalaAtualizada: EscalaSabado = {
      ...escalaAtiva,
      itens: novosItens,
      observacoesLinhas: obsLinhas,
    };
    await persistirEscala(escalaAtualizada, `Linha ${linhaCod} removida da escala.`);
  };

  // Colaboradores filtrados para busca rápida no modal
  const colabsFiltrados = useMemo(() => {
    if (!buscaColab.trim()) return cadastros.slice(0, 6);
    const q = buscaColab.toLowerCase().trim();
    return cadastros
      .filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.matricula.toLowerCase().includes(q) ||
          c.bairro.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [cadastros, buscaColab]);

  // Agrupamento dos itens por linha de ônibus para relatório e exportação Parvi
  const itensPorLinha = useMemo(() => {
    if (!escalaAtiva?.itens) return {};
    const map: Record<string, EscalaSabadoItem[]> = {};
    escalaAtiva.itens.forEach((it) => {
      const linha = it.linhaId || 'OUTRAS';
      if (!map[linha]) map[linha] = [];
      map[linha].push(it);
    });
    return map;
  }, [escalaAtiva]);

  // Mensagem oficial formatada para o responsável da Parvi (WhatsApp) com os 4 campos + OBS da barra
  const mensagemParviWhatsApp = useMemo(() => {
    if (!escalaAtiva) return '';

    let texto = `*ESCALA DE SÁBADO — PAINEL PARVI (U&M)*\n`;
    texto += `📅 *Data:* ${escalaAtiva.dataSabado}\n`;
    texto += `👤 *Supervisor U&M:* ${escalaAtiva.supervisorNome}${escalaAtiva.supervisorTelefone ? ` (${escalaAtiva.supervisorTelefone})` : ''}\n`;
    texto += `👥 *Total de Colaboradores:* ${escalaAtiva.itens?.length || 0}\n`;

    if (escalaAtiva.observacoesGerais) {
      texto += `📝 *OBS. da Escala:* ${escalaAtiva.observacoesGerais}\n`;
    }

    texto += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `🚌 *LISTA DE EMBARQUE POR LINHA:*\n`;

    Object.entries(itensPorLinha).forEach(([linhaCod, passageiros]) => {
      const rota = rotas.find((r) => r.codigo === linhaCod || r.id === linhaCod);
      const obsLinha = escalaAtiva.observacoesLinhas?.[linhaCod];
      texto += `\n📍 *LINHA ${linhaCod}* (${rota?.nome || 'Itinerário U&M'})\n`;
      if (obsLinha) {
        texto += `  ⚠️ *OBS.:* ${obsLinha}\n`;
      }
      passageiros.forEach((p, idx) => {
        texto += `  ${idx + 1}. *Nome:* ${p.nome}\n`;
        texto += `     • *Bairro:* ${p.bairro}\n`;
        texto += `     • *Rua:* ${p.rua || p.endereco || '—'}\n`;
        texto += `     • *Ponto de embarque:* ${p.pontoEmbarque}\n`;
      });
    });

    texto += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `_Sistema de Transporte U&M • Coordenação Parvi_`;

    return texto;
  }, [escalaAtiva, itensPorLinha, rotas]);

  const handleExportarWhatsAppParvi = () => {
    navigator.clipboard.writeText(mensagemParviWhatsApp);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemParviWhatsApp)}`;
    window.open(url, '_blank');
    mostrarFeedback('Texto formatado copiado e WhatsApp da Parvi aberto!');
  };

  const handleImprimir = () => {
    window.print();
  };

  if (carregando) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-stone-200">
        <RefreshCw className="w-8 h-8 text-[#1b6e47] animate-spin mx-auto mb-2" />
        <p className="text-stone-600 text-sm font-semibold">Carregando Painel Escala Parvi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast de Sucesso */}
      {mensagemSucesso && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-none" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {erro && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs sm:text-sm font-bold">
          {erro}
        </div>
      )}

      {/* PAINEL ESCALA PARVI — CABEÇALHO E BARRA DA ESCALA EDITÁVEL */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-none border border-amber-200 shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight leading-tight">
                  Painel Escala Parvi
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Edição Completa • Alterar, Adicionar e Excluir
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Gerencie os dados da escala, inclua observações (OBS.) na barra da escala e edite, adicione ou exclua colaboradores.
              </p>
            </div>
          </div>

          {/* Botões Superiores de Gestão da Escala */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {escalas.length > 1 && (
              <select
                value={escalaAtiva?.id || ''}
                onChange={(e) => setEscalaAtivaId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white text-stone-800"
                title="Alternar entre escalas salvas"
              >
                {escalas.map((esc) => (
                  <option key={esc.id} value={esc.id}>
                    Escala {esc.dataSabado} ({esc.itens?.length || 0} colab.)
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleCriarNovaEscala}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Nova Escala</span>
            </button>

            {escalaAtiva && (
              <>
                {!confirmandoExclusaoEscala ? (
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusaoEscala(true)}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Excluir esta escala"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Escala</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-red-50 border border-red-300 px-2.5 py-1 rounded-xl">
                    <span className="text-[11px] font-bold text-red-800">Confirmar exclusão?</span>
                    <button
                      type="button"
                      onClick={handleExcluirEscala}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      Sim, Excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoExclusaoEscala(false)}
                      className="px-2 py-1 bg-white text-stone-700 text-[11px] font-semibold rounded-lg border border-stone-300 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleSalvarEscala}
              disabled={salvando || !escalaAtiva}
              className="px-4 py-2 bg-[#1b6e47] hover:bg-[#155a3a] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {salvando ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{salvando ? 'Salvando...' : 'Salvar Escala'}</span>
            </button>
          </div>
        </div>

        {/* Campos Editáveis do Painel da Escala */}
        {escalaAtiva && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Data da Escala
              </label>
              <input
                type="text"
                value={escalaAtiva.dataSabado}
                onChange={(e) => handleAtualizarCampoEscala('dataSabado', e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Supervisor Responsável
              </label>
              <input
                type="text"
                value={escalaAtiva.supervisorNome}
                onChange={(e) => handleAtualizarCampoEscala('supervisorNome', e.target.value)}
                placeholder="Ex: Rodrigo Fontes"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium text-stone-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                WhatsApp do Supervisor
              </label>
              <input
                type="text"
                value={escalaAtiva.supervisorTelefone || ''}
                onChange={(e) => handleAtualizarCampoEscala('supervisorTelefone', e.target.value)}
                placeholder="(94) 99123-4567"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium text-stone-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Status da Escala Parvi
              </label>
              <select
                value={escalaAtiva.status}
                onChange={(e) => handleAtualizarCampoEscala('status', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold bg-white text-stone-800"
              >
                <option value="Rascunho">Rascunho (Em elaboração)</option>
                <option value="Enviada à Parvi">Enviada à Parvi (Aguardando ônibus)</option>
                <option value="Confirmada">Confirmada pela Parvi</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* BARRA DA ESCALA PARVI (COM CAMPO DE OBSERVAÇÕES - OBS. INCLUÍDO NA BARRA) */}
      {escalaAtiva && (
        <div className="bg-gradient-to-r from-emerald-800 to-[#1b6e47] text-white rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-200 font-bold bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-600/60">
                Barra da Escala • Parvi Transportes
              </span>
              <h3 className="text-base sm:text-lg font-black mt-2 leading-tight">
                Escala Parvi — {escalaAtiva.dataSabado}
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Total de <strong>{escalaAtiva.itens?.length || 0} colaboradores</strong> em{' '}
                <strong>{Object.keys(itensPorLinha).length} linhas</strong> de ônibus.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportarWhatsAppParvi}
                className="px-4 py-2.5 rounded-xl bg-white text-[#1b6e47] hover:bg-emerald-50 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                title="Copiar e enviar escala formatada para a Parvi via WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Enviar p/ WhatsApp da Parvi</span>
              </button>

              <button
                type="button"
                onClick={() => baixarCsvEscalaSabado(escalaAtiva)}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-900 text-white border border-emerald-600/70 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                title="Baixar planilha CSV/Excel para envio ao departamento de tráfego"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Baixar Excel / CSV</span>
              </button>

              <button
                type="button"
                onClick={handleImprimir}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 border border-emerald-700/60 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Imprimir escala"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          {/* Campo OBS. integrado diretamente na Barra da Escala */}
          <div className="bg-emerald-950/45 border border-emerald-500/40 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center gap-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 rounded-lg flex-none">
              OBS.:
            </label>
            <input
              type="text"
              value={escalaAtiva.observacoesGerais || ''}
              onChange={(e) => handleAtualizarCampoEscala('observacoesGerais', e.target.value)}
              placeholder="Digite aqui as observações (OBS.) da barra da escala (ex: horários especiais, pontos extras, instruções para a Parvi)..."
              className="w-full px-3.5 py-2 rounded-xl bg-white text-stone-900 text-xs sm:text-sm font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>
      )}

      {/* LISTA DE COLABORADORES NO PAINEL ESCALA PARVI (Campos: Nome, Bairro, Rua, Ponto de embarque) */}
      {escalaAtiva && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#1b6e47]" />
                Colaboradores na Escala Parvi ({escalaAtiva.itens?.length || 0})
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Campos exibidos: <strong>Nome</strong>, <strong>Bairro</strong>, <strong>Rua</strong> e <strong>Ponto de embarque</strong>. Clique em Editar ou Excluir em qualquer linha para alterar.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleAbrirModalAdicionar()}
              className="px-4 py-2.5 bg-[#1b6e47] hover:bg-[#155a3a] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Colaborador</span>
            </button>
          </div>

          {/* Lista vazia */}
          {!escalaAtiva.itens || escalaAtiva.itens.length === 0 ? (
            <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-6">
              <Bus className="w-10 h-10 text-stone-400 mx-auto mb-2" />
              <h4 className="font-bold text-stone-700 text-sm">Nenhum colaborador cadastrado nesta escala</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Clique no botão abaixo para adicionar colaboradores informando Nome, Bairro, Rua e Ponto de embarque.
              </p>
              <button
                type="button"
                onClick={() => handleAbrirModalAdicionar()}
                className="mt-3 px-4 py-2 bg-[#1b6e47] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                + Adicionar Primeiro Colaborador
              </button>
            </div>
          ) : (
            /* Agrupado por Linha de Ônibus */
            <div className="space-y-4">
              {Object.entries(itensPorLinha).map(([linhaCod, itens]) => {
                const rota = rotas.find((r) => r.codigo === linhaCod || r.id === linhaCod);

                return (
                  <div key={linhaCod} className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                    {/* Barra da Linha da Escala (com campo OBS. incluso na barra) */}
                    <div className="bg-stone-100 px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-stone-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-[#1b6e47] text-white font-black text-xs font-mono">
                          {linhaCod}
                        </span>
                        <span className="font-bold text-stone-800 text-xs sm:text-sm">
                          {rota?.nome || 'Linha Operacional'}
                        </span>
                        <span className="text-[11px] text-stone-500 font-semibold">
                          • {itens.length} {itens.length === 1 ? 'colaborador' : 'colaboradores'}
                        </span>
                      </div>

                      {/* Campo de Observações (OBS.) na Barra da Escala/Linha */}
                      <div className="flex items-center gap-2 flex-1 lg:max-w-md">
                        <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-1 rounded border border-amber-300 flex-none">
                          OBS.:
                        </span>
                        <input
                          type="text"
                          placeholder={`OBS. da linha ${linhaCod} (ex: parada extra, horário especial)...`}
                          value={escalaAtiva.observacoesLinhas?.[linhaCod] || ''}
                          onChange={(e) => handleAtualizarObsLinha(linhaCod, e.target.value)}
                          className="w-full text-xs px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-800 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1b6e47]"
                        />
                      </div>

                      {/* Ações rápidas da Barra da Linha */}
                      <div className="flex items-center gap-2 flex-none">
                        <span className="text-stone-600 text-[11px] font-semibold hidden sm:flex items-center gap-1 mr-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{itens[0]?.horarioEmbarque || rota?.horarioInicio || '04:30'}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAbrirModalAdicionar(linhaCod)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1b6e47] border border-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title={`Adicionar colaborador na linha ${linhaCod}`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Adicionar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoverLinhaDaEscala(linhaCod)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                          title={`Remover todos da linha ${linhaCod}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Tabela Reduzida: apenas Nome, Bairro, Rua, Ponto de embarque + Ações (Editar / Excluir) */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-200">
                          <tr>
                            <th className="px-4 py-2.5 font-bold">Nome</th>
                            <th className="px-4 py-2.5 font-bold">Bairro</th>
                            <th className="px-4 py-2.5 font-bold">Rua</th>
                            <th className="px-4 py-2.5 font-bold">Ponto de embarque</th>
                            <th className="px-4 py-2.5 text-right font-bold">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-stone-700">
                          {itens.map((it) => (
                            <tr key={it.id} className="hover:bg-emerald-50/40 transition-colors">
                              <td className="px-4 py-3 font-bold text-stone-900">
                                {it.nome}
                              </td>
                              <td className="px-4 py-3 font-medium text-stone-800">
                                {it.bairro}
                              </td>
                              <td className="px-4 py-3 font-medium text-stone-700">
                                {it.rua || it.endereco || '—'}
                              </td>
                              <td className="px-4 py-3 font-medium text-emerald-950">
                                📍 {it.pontoEmbarque}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirEdicao(it)}
                                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-[#1b6e47] font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Alterar dados do colaborador"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoverItem(it.id)}
                                    className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Excluir colaborador da escala"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Excluir</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: EDITAR / ALTERAR COLABORADOR NA ESCALA PARVI (Campos: Nome, Bairro, Rua, Ponto de embarque) */}
      {itemEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#1b6e47]" />
                Alterar Dados no Painel Escala Parvi
              </h3>
              <button
                type="button"
                onClick={() => setItemEditando(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Nome do colaborador"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Bairro *</label>
                  <input
                    type="text"
                    required
                    value={editBairro}
                    onChange={(e) => setEditBairro(e.target.value)}
                    placeholder="Ex: Cidade Nova, Liberdade"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Rua *</label>
                  <input
                    type="text"
                    required
                    value={editRua}
                    onChange={(e) => setEditRua(e.target.value)}
                    placeholder="Ex: Rua A, 210"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Ponto de embarque *</label>
                <input
                  type="text"
                  required
                  value={editPonto}
                  onChange={(e) => setEditPonto(e.target.value)}
                  placeholder="Ex: Supermercado Líder - Cidade Nova"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Linha do Ônibus</label>
                <select
                  value={editLinha}
                  onChange={(e) => setEditLinha(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold bg-white text-stone-800"
                >
                  {rotas.map((r) => (
                    <option key={r.id} value={r.codigo}>
                      {r.codigo} • {r.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setItemEditando(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1b6e47] hover:bg-[#155a3a] text-white font-bold text-xs shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADICIONAR COLABORADOR À ESCALA PARVI (Campos: Nome, Bairro, Rua, Ponto de embarque) */}
      {modalAdicionarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <User className="w-5 h-5 text-[#1b6e47]" />
                Adicionar ao Painel Escala Parvi
              </h3>
              <button
                type="button"
                onClick={() => setModalAdicionarAberto(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Busca Rápida na Base Cadastrada */}
            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 space-y-2">
              <label className="block text-xs font-bold text-emerald-950 uppercase">
                🔍 Buscar Colaborador Cadastrado (Opcional):
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={buscaColab}
                  onChange={(e) => setBuscaColab(e.target.value)}
                  placeholder="Digite o nome ou bairro para preencher automático..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-emerald-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1b6e47]"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {colabsFiltrados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelecionarColaborador(c)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-stone-800 border border-emerald-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>{c.nome}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formulário Reduzido: Nome, Bairro, Rua, Ponto de embarque (+ Linha) */}
            <form onSubmit={handleAdicionarItem} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={novoItemNome}
                  onChange={(e) => setNovoItemNome(e.target.value)}
                  placeholder="Nome do colaborador"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Bairro *</label>
                  <input
                    type="text"
                    required
                    value={novoItemBairro}
                    onChange={(e) => setNovoItemBairro(e.target.value)}
                    placeholder="Ex: Cidade Nova, Liberdade"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Rua *</label>
                  <input
                    type="text"
                    required
                    value={novoItemRua}
                    onChange={(e) => setNovoItemRua(e.target.value)}
                    placeholder="Ex: Rua A, 210"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Ponto de embarque *</label>
                <input
                  type="text"
                  required
                  value={novoItemPonto}
                  onChange={(e) => setNovoItemPonto(e.target.value)}
                  placeholder="Ex: Supermercado Líder - Cidade Nova"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Linha do Ônibus</label>
                <select
                  value={novoItemLinha}
                  onChange={(e) => setNovoItemLinha(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold bg-white text-stone-800"
                >
                  {rotas.map((r) => (
                    <option key={r.id} value={r.codigo}>
                      {r.codigo} • {r.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalAdicionarAberto(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1b6e47] hover:bg-[#155a3a] text-white font-bold text-xs shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar à Escala</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
