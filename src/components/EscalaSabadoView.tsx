import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  User,
  Bus,
  MapPin,
  Clock,
  Phone,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Printer,
  MessageCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  Building,
  Share2,
} from 'lucide-react';
import { EscalaSabado, EscalaSabadoItem, ColaboradorCadastro, RotaLinha } from '../types';
import { fetchEscalasSabado, salvarEscalaSabado, excluirEscalaSabado, baixarCsvEscalaSabado } from '../services/api';

interface EscalaSabadoViewProps {
  cadastros: ColaboradorCadastro[];
  rotas: RotaLinha[];
  isSupervisorView?: boolean; // Se renderizado no portal do colaborador
}

export const EscalaSabadoView: React.FC<EscalaSabadoViewProps> = ({
  cadastros,
  rotas,
  isSupervisorView = false,
}) => {
  const [escalas, setEscalas] = useState<EscalaSabado[]>([]);
  const [escalaAtivaId, setEscalaAtivaId] = useState<string>('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Modal para adicionar colaborador à escala
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [buscaColab, setBuscaColab] = useState('');
  const [colabSelecionado, setColabSelecionado] = useState<ColaboradorCadastro | null>(null);

  // Campos do novo item na escala (reduzidos e focados: Nome, Matrícula, Bairro, Rua, Ponto, Linha, OBS)
  const [novoItemNome, setNovoItemNome] = useState('');
  const [novoItemMatricula, setNovoItemMatricula] = useState('');
  const [novoItemTurma, setNovoItemTurma] = useState('Administrativo');
  const [novoItemBairro, setNovoItemBairro] = useState('');
  const [novoItemRua, setNovoItemRua] = useState('');
  const [novoItemPonto, setNovoItemPonto] = useState('');
  const [novoItemLinha, setNovoItemLinha] = useState('ADM01');
  const [novoItemTurno, setNovoItemTurno] = useState('Diurno Especial (07:00 às 17:00)');
  const [novoItemHorario, setNovoItemHorario] = useState('04:30');
  const [novoItemTelefone, setNovoItemTelefone] = useState('');
  const [novoItemObs, setNovoItemObs] = useState('');

  // Modal para alterar / editar colaborador existente na escala
  const [itemEditando, setItemEditando] = useState<EscalaSabadoItem | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editMatricula, setEditMatricula] = useState('');
  const [editBairro, setEditBairro] = useState('');
  const [editRua, setEditRua] = useState('');
  const [editPonto, setEditPonto] = useState('');
  const [editLinha, setEditLinha] = useState('ADM01');
  const [editObs, setEditObs] = useState('');

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

  // Criar nova escala
  const handleCriarNovaEscala = () => {
    const novaId = `ESC-${Date.now().toString(36).toUpperCase()}`;
    const nova: EscalaSabado = {
      id: novaId,
      dataSabado: getProximoSabado(),
      supervisorNome: 'Supervisor de Obras / Turno',
      supervisorTelefone: '(94) 99200-0000',
      status: 'Rascunho',
      observacoesGerais: 'Escala de sábado para transporte de apoio Parvi.',
      criadoEm: new Date().toLocaleDateString('pt-BR'),
      itens: [],
    };
    setEscalas((prev) => [nova, ...prev]);
    setEscalaAtivaId(novaId);
  };

  // Atualizar campos da escala ativa
  const handleAtualizarCampoEscala = (campo: keyof EscalaSabado, valor: any) => {
    if (!escalaAtiva) return;
    setEscalas((prev) =>
      prev.map((e) => (e.id === escalaAtiva.id ? { ...e, [campo]: valor } : e))
    );
  };

  // Salvar escala ativa no servidor
  const handleSalvarEscala = async () => {
    if (!escalaAtiva) return;
    setSalvando(true);
    setErro(null);
    try {
      const salva = await salvarEscalaSabado(escalaAtiva);
      setEscalas((prev) => prev.map((e) => (e.id === salva.id ? salva : e)));
      setMensagemSucesso('Escala de sábado salva com sucesso no sistema!');
      setTimeout(() => setMensagemSucesso(null), 3500);
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar escala.');
    } finally {
      setSalvando(false);
    }
  };

  // Excluir escala ativa
  const handleExcluirEscala = async () => {
    if (!escalaAtiva) return;
    if (!window.confirm(`Deseja excluir a escala do dia ${escalaAtiva.dataSabado}?`)) return;
    try {
      await excluirEscalaSabado(escalaAtiva.id);
      const restantes = escalas.filter((e) => e.id !== escalaAtiva.id);
      setEscalas(restantes);
      setEscalaAtivaId(restantes[0]?.id || '');
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir.');
    }
  };

  // Atualizar campo de observação da barra da linha
  const handleAtualizarObsLinha = (linhaCod: string, valor: string) => {
    if (!escalaAtiva) return;
    const obsLinhas = { ...(escalaAtiva.observacoesLinhas || {}), [linhaCod]: valor };
    handleAtualizarCampoEscala('observacoesLinhas', obsLinhas);
  };

  // Selecionar colaborador para pré-preencher
  const handleSelecionarColaborador = (c: ColaboradorCadastro) => {
    setColabSelecionado(c);
    setNovoItemNome(c.nome);
    setNovoItemMatricula(c.matricula);
    setNovoItemTurma(c.turma || 'Administrativo');
    setNovoItemBairro(c.bairro || '');
    setNovoItemRua(c.endereco || '');
    setNovoItemPonto(c.pontoEmbarque?.descricao || c.ponto || 'Ponto no bairro');
    setNovoItemLinha(c.linhaId || c.onibus || 'ADM01');
    setNovoItemTelefone(c.telefone || '');

    // Buscar horário padrão da linha
    const rota = rotas.find((r) => r.id === c.linhaId || r.codigo === c.onibus);
    if (rota?.horarioInicio) {
      setNovoItemHorario(rota.horarioInicio);
    }
  };

  // Adicionar item à escala (com Nome, Matrícula, Bairro, Rua, Ponto, Linha, OBS)
  const handleAdicionarItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalaAtiva || !novoItemNome.trim() || !novoItemMatricula.trim()) {
      alert('Informe ao menos o nome e a matrícula do colaborador.');
      return;
    }

    const novoItem: EscalaSabadoItem = {
      id: `ITEM-${Date.now().toString(36).toUpperCase()}`,
      colaboradorId: colabSelecionado?.id,
      nome: novoItemNome.trim(),
      matricula: novoItemMatricula.trim(),
      turma: novoItemTurma,
      bairro: novoItemBairro.trim() || 'Centro',
      rua: novoItemRua.trim() || '',
      endereco: novoItemRua.trim() || '',
      pontoEmbarque: novoItemPonto.trim() || 'A definir',
      linhaId: novoItemLinha || 'ADM01',
      turno: novoItemTurno,
      horarioEmbarque: novoItemHorario || '04:30',
      telefone: novoItemTelefone.trim(),
      observacao: novoItemObs.trim(),
    };

    const novosItens = [...(escalaAtiva.itens || []), novoItem];
    handleAtualizarCampoEscala('itens', novosItens);

    // Limpar modal
    setModalAdicionarAberto(false);
    setColabSelecionado(null);
    setBuscaColab('');
    setNovoItemNome('');
    setNovoItemMatricula('');
    setNovoItemBairro('');
    setNovoItemRua('');
    setNovoItemPonto('');
    setNovoItemObs('');
  };

  // Abrir modal de edição/alteração de colaborador
  const handleAbrirEdicao = (it: EscalaSabadoItem) => {
    setItemEditando(it);
    setEditNome(it.nome);
    setEditMatricula(it.matricula);
    setEditBairro(it.bairro);
    setEditRua(it.rua || it.endereco || '');
    setEditPonto(it.pontoEmbarque);
    setEditLinha(it.linhaId);
    setEditObs(it.observacao || '');
  };

  // Salvar alteração do colaborador na escala
  const handleSalvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalaAtiva || !itemEditando) return;
    const novosItens = (escalaAtiva.itens || []).map((it) => {
      if (it.id === itemEditando.id) {
        return {
          ...it,
          nome: editNome.trim(),
          matricula: editMatricula.trim(),
          bairro: editBairro.trim(),
          rua: editRua.trim(),
          endereco: editRua.trim(),
          pontoEmbarque: editPonto.trim(),
          linhaId: editLinha,
          observacao: editObs.trim(),
        };
      }
      return it;
    });
    handleAtualizarCampoEscala('itens', novosItens);
    setItemEditando(null);
    setMensagemSucesso('Dados do colaborador alterados com sucesso na escala!');
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  // Remover colaborador da escala
  const handleRemoverItem = (itemId: string) => {
    if (!escalaAtiva) return;
    const item = (escalaAtiva.itens || []).find((i) => i.id === itemId);
    const confirmMsg = item ? `Remover ${item.nome} (${item.matricula}) da escala de sábado?` : 'Remover colaborador da escala de sábado?';
    if (!window.confirm(confirmMsg)) return;
    const novosItens = (escalaAtiva.itens || []).filter((i) => i.id !== itemId);
    handleAtualizarCampoEscala('itens', novosItens);
  };

  // Colaboradores filtrados para busca no modal
  const colabsFiltrados = useMemo(() => {
    if (!buscaColab.trim()) return cadastros.slice(0, 6);
    const q = buscaColab.toLowerCase().trim();
    return cadastros.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.matricula.toLowerCase().includes(q) ||
        c.bairro.toLowerCase().includes(q)
    ).slice(0, 8);
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

  // Mensagem oficial formatada para o responsável da Parvi (WhatsApp)
  const mensagemParviWhatsApp = useMemo(() => {
    if (!escalaAtiva) return '';

    let texto = `*ESCALA DE TRABALHO DE SÁBADO — U&M PARAUAPEBAS*\n`;
    texto += `📅 *Data:* ${escalaAtiva.dataSabado}\n`;
    texto += `👤 *Supervisor U&M:* ${escalaAtiva.supervisorNome} (${escalaAtiva.supervisorTelefone || 'Sem contato'})\n`;
    texto += `🏢 *Operador de Frotas:* Parvi Transportes\n`;
    texto += `👥 *Total de Colaboradores:* ${escalaAtiva.itens?.length || 0}\n`;

    if (escalaAtiva.observacoesGerais) {
      texto += `📝 *OBS Geral da Escala:* ${escalaAtiva.observacoesGerais}\n`;
    }

    texto += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `🚌 *LISTA DE EMBARQUE POR LINHA:*\n`;

    Object.entries(itensPorLinha).forEach(([linhaCod, passageiros]) => {
      const rota = rotas.find((r) => r.codigo === linhaCod || r.id === linhaCod);
      const obsLinha = escalaAtiva.observacoesLinhas?.[linhaCod];
      texto += `\n📍 *LINHA ${linhaCod}* (${rota?.nome || 'Itinerário U&M'})\n`;
      if (obsLinha) {
        texto += `  ⚠️ *OBS da Linha:* ${obsLinha}\n`;
      }
      passageiros.forEach((p, idx) => {
        texto += `  ${idx + 1}. *${p.nome}* (${p.matricula})\n`;
        texto += `     • Bairro: ${p.bairro}\n`;
        if (p.rua || p.endereco) texto += `     • Rua: ${p.rua || p.endereco}\n`;
        texto += `     • Ponto: ${p.pontoEmbarque}\n`;
        if (p.observacao) texto += `     • OBS: ${p.observacao}\n`;
      });
    });

    texto += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `_Documento gerado automaticamente pelo Sistema de Transporte U&M para coordenação de frota da Parvi._`;

    return texto;
  }, [escalaAtiva, itensPorLinha, rotas]);

  const handleExportarWhatsAppParvi = () => {
    navigator.clipboard.writeText(mensagemParviWhatsApp);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemParviWhatsApp)}`;
    window.open(url, '_blank');
    setMensagemSucesso('Texto formatado copiado e WhatsApp da Parvi aberto!');
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  const handleImprimir = () => {
    window.print();
  };

  if (carregando) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-stone-200">
        <RefreshCw className="w-8 h-8 text-[#1b6e47] animate-spin mx-auto mb-2" />
        <p className="text-stone-600 text-sm font-semibold">Carregando escalas de sábado...</p>
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

      {/* Cabeçalho da Escala de Sábado */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-none border border-amber-200 shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight leading-tight">
                  Escala de Trabalho de Sábado (Supervisores & Parvi)
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Integração Parvi Frotas
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Cadastre e gerencie a lista de colaboradores que irão trabalhar no sábado e exporte diretamente para o responsável da frota da Parvi.
              </p>
            </div>
          </div>

          {/* Botões Superiores de Ação */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={handleCriarNovaEscala}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Nova Escala</span>
            </button>

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

        {/* Seletor de Escalas Salvas e Parâmetros */}
        {escalaAtiva && (
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Data do Sábado
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
                Status do Envio
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

            <div className="sm:col-span-2 lg:col-span-4 bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded border border-amber-300">
                  OBS:
                </span>
                <label className="text-xs font-bold text-amber-950 uppercase">
                  Observações Gerais da Escala de Sábado
                </label>
              </div>
              <input
                type="text"
                value={escalaAtiva.observacoesGerais || ''}
                onChange={(e) => handleAtualizarCampoEscala('observacoesGerais', e.target.value)}
                placeholder="Ex: Paradas adicionais, retorno às 17h, rota de apoio ao Retaludamento e Oficina..."
                className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-stone-800 text-xs font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1b6e47]"
              />
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE EXPORTAÇÃO DIRETA PARA A PARVI (Item 3 da reunião) */}
      {escalaAtiva && (
        <div className="bg-gradient-to-r from-emerald-800 to-[#1b6e47] text-white rounded-3xl p-5 sm:p-6 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-200 font-bold bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-600/60">
                Logística de Frota • Parvi Transportes
              </span>
              <h3 className="text-base sm:text-lg font-black mt-2 leading-tight">
                Exportar Escala de Sábado Diretamente para a Parvi
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Total de <strong>{escalaAtiva.itens?.length || 0} colaboradores</strong> escalados em <strong>{Object.keys(itensPorLinha).length} linhas</strong> de ônibus.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Botão 1: WhatsApp Parvi */}
              <button
                type="button"
                onClick={handleExportarWhatsAppParvi}
                className="px-4 py-2.5 rounded-xl bg-white text-[#1b6e47] hover:bg-emerald-50 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                title="Copiar e enviar escala formatada para o coordenador da Parvi via WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Enviar p/ WhatsApp da Parvi</span>
              </button>

              {/* Botão 2: CSV / Excel da Parvi (Download direto no navegador) */}
              <button
                type="button"
                onClick={() => baixarCsvEscalaSabado(escalaAtiva)}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-900 text-white border border-emerald-600/70 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                title="Baixar planilha CSV/Excel para envio ao departamento de tráfego"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Baixar Excel / CSV</span>
              </button>

              {/* Botão 3: Imprimir Romaneio */}
              <button
                type="button"
                onClick={handleImprimir}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 border border-emerald-700/60 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Imprimir ficha de despacho para os motoristas"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Colaboradores Escalados */}
      {escalaAtiva && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#1b6e47]" />
                Colaboradores Escalados para Sábado ({escalaAtiva.itens?.length || 0})
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Selecione os funcionários da U&M que irão trabalhar neste fim de semana.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalAdicionarAberto(true)}
              className="px-4 py-2 bg-[#1b6e47] hover:bg-[#155a3a] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Colaborador à Escala</span>
            </button>
          </div>

          {/* Lista vazia */}
          {(!escalaAtiva.itens || escalaAtiva.itens.length === 0) ? (
            <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-6">
              <Bus className="w-10 h-10 text-stone-400 mx-auto mb-2" />
              <h4 className="font-bold text-stone-700 text-sm">Nenhum colaborador na escala de sábado</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Clique no botão acima para adicionar colaboradores cadastrados ou inserir um novo membro de equipe.
              </p>
              <button
                type="button"
                onClick={() => setModalAdicionarAberto(true)}
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
                    {/* Header da Barra da Linha (com campo OBS. da Linha solicitado) */}
                    <div className="bg-stone-100 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#1b6e47] text-white font-black text-xs font-mono">
                          {linhaCod}
                        </span>
                        <span className="font-bold text-stone-800 text-xs">
                          {rota?.nome || 'Linha Operacional'}
                        </span>
                        <span className="text-[11px] text-stone-500 font-semibold">
                          • {itens.length} {itens.length === 1 ? 'passageiro' : 'passageiros'}
                        </span>
                      </div>

                      {/* Campo de Observações (OBS.) da Barra da Linha */}
                      <div className="flex items-center gap-2 flex-1 md:max-w-md">
                        <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 flex-none">
                          OBS:
                        </span>
                        <input
                          type="text"
                          placeholder={`Observação da linha ${linhaCod} (ex: parada no portão 2, retorno 17h)...`}
                          value={escalaAtiva.observacoesLinhas?.[linhaCod] || ''}
                          onChange={(e) => handleAtualizarObsLinha(linhaCod, e.target.value)}
                          className="w-full text-xs px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-stone-800 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#1b6e47]"
                        />
                      </div>

                      <div className="text-stone-600 text-[11px] font-semibold flex items-center gap-1 flex-none">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Embarques a partir de {itens[0]?.horarioEmbarque || rota?.horarioInicio || '04:30'}</span>
                      </div>
                    </div>

                    {/* Tabela de Colaboradores na Linha - CAMPOS REDUZIDOS: Nome, Bairro, Rua, Ponto de embarque, OBS, Ações */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] tracking-wider border-b border-stone-200">
                          <tr>
                            <th className="px-3.5 py-2.5 font-bold">Nome</th>
                            <th className="px-3.5 py-2.5 font-bold">Bairro</th>
                            <th className="px-3.5 py-2.5 font-bold">Rua</th>
                            <th className="px-3.5 py-2.5 font-bold">Ponto de Embarque</th>
                            <th className="px-3.5 py-2.5 font-bold">OBS.</th>
                            <th className="px-3.5 py-2.5 text-right font-bold">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-stone-700">
                          {itens.map((it) => (
                            <tr key={it.id} className="hover:bg-emerald-50/40 transition-colors">
                              <td className="px-3.5 py-2.5 font-bold text-stone-900">
                                <div>{it.nome}</div>
                                <span className="font-mono text-[10px] text-stone-500 font-semibold">{it.matricula}</span>
                                {it.telefone && (
                                  <span className="text-[10px] text-stone-400 ml-1.5">{it.telefone}</span>
                                )}
                              </td>
                              <td className="px-3.5 py-2.5 font-medium text-stone-800">{it.bairro}</td>
                              <td className="px-3.5 py-2.5 font-medium text-stone-700">
                                {it.rua || it.endereco || '—'}
                              </td>
                              <td className="px-3.5 py-2.5 font-medium text-emerald-950">
                                📍 {it.pontoEmbarque}
                              </td>
                              <td className="px-3.5 py-2.5 text-stone-600 max-w-xs">
                                {it.observacao ? (
                                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium">
                                    {it.observacao}
                                  </span>
                                ) : (
                                  <span className="text-stone-400 text-[11px]">—</span>
                                )}
                              </td>
                              <td className="px-3.5 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirEdicao(it)}
                                    className="p-1.5 rounded-lg hover:bg-emerald-100 text-stone-600 hover:text-[#1b6e47] transition-colors cursor-pointer"
                                    title="Editar informações do colaborador"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoverItem(it.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                                    title="Remover colaborador da escala"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL 1: EDITAR / ALTERAR COLABORADOR NA ESCALA */}
      {itemEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#1b6e47]" />
                Editar Informações do Colaborador na Escala
              </h3>
              <button
                type="button"
                onClick={() => setItemEditando(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    placeholder="Nome do colaborador"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Matrícula Funcional *</label>
                  <input
                    type="text"
                    required
                    value={editMatricula}
                    onChange={(e) => setEditMatricula(e.target.value)}
                    placeholder="Ex: UM-74291"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Bairro em Parauapebas *</label>
                  <input
                    type="text"
                    required
                    value={editBairro}
                    onChange={(e) => setEditBairro(e.target.value)}
                    placeholder="Ex: Cidade Nova, Guanabara"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={editRua}
                    onChange={(e) => setEditRua(e.target.value)}
                    placeholder="Ex: Rua 14, Av. dos Ipês"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Ponto de Embarque *</label>
                  <input
                    type="text"
                    required
                    value={editPonto}
                    onChange={(e) => setEditPonto(e.target.value)}
                    placeholder="Ex: Próximo à praça central"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Linha do Ônibus (Sábado) *</label>
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
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">OBS. (Observações)</label>
                <input
                  type="text"
                  value={editObs}
                  onChange={(e) => setEditObs(e.target.value)}
                  placeholder="Ex: Turno diurno, apoio mecânica, retorno antecipado"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
                />
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

      {/* MODAL 2: ADICIONAR COLABORADOR À ESCALA (Campos: Nome, Bairro, Rua, Ponto, Linha, OBS) */}
      {modalAdicionarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <User className="w-5 h-5 text-[#1b6e47]" />
                Adicionar Colaborador à Escala de Sábado
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
                🔍 Buscar e Pré-Preencher de Colaborador Já Cadastrado:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={buscaColab}
                  onChange={(e) => setBuscaColab(e.target.value)}
                  placeholder="Digite nome, matrícula ou bairro..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-emerald-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1b6e47]"
                />
              </div>

              {/* Resultados da busca */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {colabsFiltrados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelecionarColaborador(c)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-stone-800 border border-emerald-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>{c.nome.split(' ')[0]}</span>
                    <span className="font-mono text-[10px] text-emerald-700 font-bold">({c.matricula})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formulário do Item (Nome, Bairro, Rua, Ponto, Linha, OBS) */}
            <form onSubmit={handleAdicionarItem} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={novoItemNome}
                    onChange={(e) => setNovoItemNome(e.target.value)}
                    placeholder="Nome do colaborador"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Matrícula Funcional *</label>
                  <input
                    type="text"
                    required
                    value={novoItemMatricula}
                    onChange={(e) => setNovoItemMatricula(e.target.value)}
                    placeholder="Ex: UM-74291"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold text-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Bairro em Parauapebas *</label>
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
                  <label className="block text-xs font-bold text-stone-700 mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={novoItemRua}
                    onChange={(e) => setNovoItemRua(e.target.value)}
                    placeholder="Ex: Rua 14, Av. dos Ipês"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Ponto de Embarque *</label>
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
                  <label className="block text-xs font-bold text-stone-700 mb-1">Linha do Ônibus (Sábado) *</label>
                  <select
                    value={novoItemLinha}
                    onChange={(e) => {
                      setNovoItemLinha(e.target.value);
                      const r = rotas.find((rt) => rt.id === e.target.value || rt.codigo === e.target.value);
                      if (r?.horarioInicio) setNovoItemHorario(r.horarioInicio);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold bg-white text-stone-800"
                  >
                    {rotas.map((r) => (
                      <option key={r.id} value={r.codigo}>
                        {r.codigo} • {r.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">OBS. (Observações)</label>
                <input
                  type="text"
                  value={novoItemObs}
                  onChange={(e) => setNovoItemObs(e.target.value)}
                  placeholder="Ex: Apoio mecânico, apontamento, troca de plantão"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800"
                />
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
                  <span>Confirmar Inclusão na Escala</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
