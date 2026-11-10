import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Camera,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Bus,
  Shield,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  Building,
  Sparkles,
  Info,
  Calendar,
  Layers,
  FileEdit,
} from 'lucide-react';
import { TURMAS } from '../constants';
import { NovoCadastroInput, ColaboradorCadastro, RotaLinha, SugestaoRotaResultado, SolicitacaoEndereco } from '../types';
import { lerFotoArquivo, criarCadastro, fetchCadastros, fetchRotas, fetchSolicitacoes } from '../services/api';
import { sugerirRota, linhasPorTurma } from '../utils/motorRotas';
import { MapaModal } from './MapaModal';
import { ModalSolicitarMudancaEndereco } from './ModalSolicitarMudancaEndereco';
import { EscalaSabadoView } from './EscalaSabadoView';

interface ColaboradorFormProps {
  onCadastroCriado: (novo: ColaboradorCadastro) => void;
}

export const ColaboradorForm: React.FC<ColaboradorFormProps> = ({
  onCadastroCriado,
}) => {
  // Aba ativa: consulta de rota, rotas por turma, novo cadastro ou escala de sábado
  const [tab, setTab] = useState<'consultar' | 'rotas_turma' | 'formulario' | 'escala_sabado'>('consultar');
  const [turmaSelecionadaRotas, setTurmaSelecionadaRotas] = useState<string>('Todas');
  const [buscaRotasTurma, setBuscaRotasTurma] = useState<string>('');
  const [mapaColaborador, setMapaColaborador] = useState<ColaboradorCadastro | null>(null);

  // Rotas e Cadastros para ocupação e listagem
  const [rotas, setRotas] = useState<RotaLinha[]>([]);
  const [todosCadastros, setTodosCadastros] = useState<ColaboradorCadastro[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoEndereco[]>([]);

  // Search State
  const [buscaTermo, setBuscaTermo] = useState('');
  const [buscandoStatus, setBuscandoStatus] = useState(false);
  const [resultadoConsulta, setResultadoConsulta] = useState<ColaboradorCadastro | null>(null);
  const [consultaNaoEncontrada, setConsultaNaoEncontrada] = useState(false);
  const [sugestoesExemplo, setSugestoesExemplo] = useState<ColaboradorCadastro[]>([]);
  
  // Modais
  const [mapaModalOpen, setMapaModalOpen] = useState(false);
  const [mudancaModalOpen, setMudancaModalOpen] = useState(false);

  // Form State (Item 1.1: REMOVER campo ponto de embarque desejado)
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Parauapebas');
  const [turma, setTurma] = useState('');
  const [linhaSelecionada, setLinhaSelecionada] = useState(''); // Item 1.3
  const [local, setLocal] = useState('U&M');
  const [consentimento, setConsentimento] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // Sugestão automática no formulário (Item 1.2)
  const [sugestaoForm, setSugestaoForm] = useState<SugestaoRotaResultado | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucessoProtocolo, setSucessoProtocolo] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados de rotas, cadastros e solicitações
  const carregarDados = async () => {
    try {
      const [rts, cads, sols] = await Promise.all([
        fetchRotas(),
        fetchCadastros(),
        fetchSolicitacoes(),
      ]);
      setRotas(rts);
      setTodosCadastros(cads);
      setSolicitacoes(sols);
      if (cads && cads.length > 0) {
        setSugestoesExemplo(cads.slice(0, 4));
      }
    } catch (err) {
      console.warn('Erro ao carregar dados:', err);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Calcular ocupação de cada linha em tempo real (Item 3.4)
  const ocupacaoMap = useMemo(() => {
    const map: Record<string, { ocupadas: number; capacidade: number; disponiveis: number; lotada: boolean }> = {};
    
    rotas.forEach((r) => {
      const ocupadas = todosCadastros.filter(
        (c) => c.status !== 'Inativo' && (c.linhaId === r.id || c.onibus === r.codigo)
      ).length;
      const capacidade = r.capacidade || 44;
      const disponiveis = Math.max(0, capacidade - ocupadas);
      const lotada = disponiveis === 0;
      map[r.id] = { ocupadas, capacidade, disponiveis, lotada };
      map[r.codigo] = { ocupadas, capacidade, disponiveis, lotada };
    });

    return map;
  }, [rotas, todosCadastros]);

  // Linhas disponíveis para a Turma escolhida (Item 1.3)
  const linhasDaTurma = useMemo(() => {
    if (!turma) return [];
    return linhasPorTurma(rotas, turma);
  }, [rotas, turma]);

  // Rotas filtradas para a aba "Rotas por Turma" (Item 2 da reunião)
  const rotasPorTurmaExibidas = useMemo(() => {
    return rotas.filter((r) => {
      if (turmaSelecionadaRotas !== 'Todas') {
        const matchTurma =
          (r.turmas && r.turmas.some((t) => t.includes(turmaSelecionadaRotas))) ||
          (r.turma && r.turma.includes(turmaSelecionadaRotas));
        if (!matchTurma) return false;
      }
      if (buscaRotasTurma.trim()) {
        const q = buscaRotasTurma.toLowerCase().trim();
        const cod = (r.codigo || '').toLowerCase();
        const nome = (r.nome || '').toLowerCase();
        const itin = (r.itinerario || '').toLowerCase();
        const bairros = (r.bairros?.join(' ') || '').toLowerCase();
        const ruas = (r.ruas?.join(' ') || '').toLowerCase();
        return cod.includes(q) || nome.includes(q) || itin.includes(q) || bairros.includes(q) || ruas.includes(q);
      }
      return true;
    });
  }, [rotas, turmaSelecionadaRotas, buscaRotasTurma]);

  // Abrir traçado da rota no mapa modal
  const handleAbrirMapaRota = (r: RotaLinha) => {
    const coordIni = r.coordenadas?.[0] || [-6.0682, -49.9045];
    setMapaColaborador({
      id: `ROTA-VIEW-${r.id}`,
      protocolo: `ROTA-${r.codigo}`,
      nome: `Linha ${r.codigo} • ${r.nome}`,
      matricula: r.codigo,
      telefone: '',
      endereco: r.itinerario || r.nome,
      bairro: r.bairros?.[0] || 'Parauapebas',
      cidade: 'Parauapebas',
      turma: r.turmas?.[0] || 'U&M',
      local: 'U&M Parauapebas',
      linhaId: r.id,
      onibus: r.codigo,
      status: 'Rota definida',
      ponto: r.bairros?.[0] || 'Ponto de Partida',
      pontoEmbarque: {
        lat: coordIni[0],
        lng: coordIni[1],
        descricao: `Início da Linha ${r.codigo} (${r.bairros?.[0] || 'Itinerário'})`
      },
      consentimento: true,
      criadoEm: '',
    });
    setMapaModalOpen(true);
  };

  // Item 1.2: Quando o colaborador preencher Endereço + Bairro + Turma, sugerir automaticamente
  useEffect(() => {
    if (bairro.trim() && turma) {
      const sug = sugerirRota({
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        turma,
      }, rotas);

      setSugestaoForm(sug);

      // Pré-selecionar a linha sugerida se o usuário ainda não tiver alterado manualmente
      if (sug.encontrada && sug.rotaId) {
        setLinhaSelecionada(sug.rotaId);
      }
    } else {
      setSugestaoForm(null);
    }
  }, [endereco, bairro, turma, rotas]);

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErro(null);
      const compressed = await lerFotoArquivo(file);
      setFotoPreview(compressed);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar imagem.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removerFoto = () => {
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !matricula.trim() || !endereco.trim() || !bairro.trim() || !turma || !linhaSelecionada) {
      setErro('Por favor, preencha todos os campos obrigatórios marcados com * (incluindo a Turma e Linha do Ônibus)');
      return;
    }

    if (!consentimento) {
      setErro('É necessário autorizar o uso dos dados conforme a LGPD para prosseguir.');
      return;
    }

    const rotaObj = rotas.find((r) => r.id === linhaSelecionada);
    const infoOcup = ocupacaoMap[linhaSelecionada];

    setEnviando(true);
    try {
      const payload: NovoCadastroInput = {
        nome: nome.trim(),
        matricula: matricula.trim(),
        telefone: telefone.trim(),
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        turma: turma.trim(),
        local: local.trim() || 'U&M',
        linhaId: linhaSelecionada,
        onibus: rotaObj ? rotaObj.codigo : linhaSelecionada,
        linhaSugeridaId: sugestaoForm?.rotaId || linhaSelecionada,
        obs: infoOcup?.lotada ? 'Inscrito como lista de espera (linha com 100% de ocupação).' : '',
        foto: fotoPreview,
        consentimento: true,
      };

      const res = await criarCadastro(payload);
      setSucessoProtocolo(res.protocolo);
      onCadastroCriado(res.registro);

      // Atualiza lista local
      setTodosCadastros((prev) => [res.registro, ...prev]);

      // Limpar campos
      setNome('');
      setMatricula('');
      setTelefone('');
      setEndereco('');
      setBairro('');
      setCidade('Parauapebas');
      setTurma('');
      setLinhaSelecionada('');
      setLocal('U&M');
      setConsentimento(false);
      setFotoPreview(null);
      setSugestaoForm(null);
    } catch (err: any) {
      setErro(err.message || 'Não foi possível enviar o formulário. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const realizarBusca = async (termo: string) => {
    if (!termo.trim()) return;

    setBuscandoStatus(true);
    setConsultaNaoEncontrada(false);
    setResultadoConsulta(null);

    try {
      const todos = await fetchCadastros();
      setTodosCadastros(todos);
      const q = termo.trim().toLowerCase();
      const achado = todos.find(
        (c) =>
          c.matricula.toLowerCase() === q ||
          c.protocolo.toLowerCase() === q ||
          c.nome.toLowerCase().includes(q)
      );

      if (achado) {
        setResultadoConsulta(achado);
      } else {
        setConsultaNaoEncontrada(true);
      }
    } catch {
      setConsultaNaoEncontrada(true);
    } finally {
      setBuscandoStatus(false);
    }
  };

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();
    realizarBusca(buscaTermo);
  };

  // Solicitação pendente do colaborador consultado
  const solicitacaoDoColaborador = useMemo(() => {
    if (!resultadoConsulta) return null;
    return solicitacoes.find(
      (s) => s.colaboradorId === resultadoConsulta.id || s.matricula === resultadoConsulta.matricula
    );
  }, [resultadoConsulta, solicitacoes]);

  // Se o cadastro foi enviado com sucesso, mostra tela de confirmação
  if (sucessoProtocolo) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Cadastro Enviado com Sucesso!
          </h2>
          <p className="text-stone-600 mt-2 text-sm sm:text-base">
            Seus dados foram recebidos pela equipe de Recursos Humanos e Logística de Frotas da U&M.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-800 block mb-1">
              Seu Número de Protocolo
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-900 tracking-wide select-all">
              {sucessoProtocolo}
            </div>
            <p className="text-xs text-emerald-700 mt-2">
              Guarde este código para consultar o status da sua linha e ponto de embarque.
            </p>
          </div>

          <div className="bg-stone-50 rounded-2xl p-4 text-left text-xs sm:text-sm text-stone-600 border border-stone-200/80 mb-6 space-y-2">
            <p className="font-semibold text-stone-800">Próximos passos operacionais:</p>
            <ul className="list-disc list-inside space-y-1 text-stone-600">
              <li>O RH definirá o seu ponto de embarque oficial no mapa da cidade.</li>
              <li>Sua vaga na linha selecionada já está pré-reservada no sistema.</li>
              <li>Acesse a aba <strong>Consultar Rota</strong> a qualquer momento para ver o mapa e horários.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                setSucessoProtocolo(null);
                setTab('consultar');
              }}
              className="px-6 py-2.5 rounded-xl bg-[#1b6e47] hover:bg-[#155a3a] text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
            >
              Consultar Rota / Status
            </button>
            <button
              type="button"
              onClick={() => setSucessoProtocolo(null)}
              className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              Fazer outro cadastro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      
      {/* Banner de Boas-Vindas ao Colaborador */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 mb-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1b6e47] flex items-center justify-center flex-none border border-emerald-100 shadow-inner">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight leading-tight">
                Portal do Colaborador • Transporte U&M
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Consulte o ônibus da sua rota de trabalho ou faça seu cadastro de transporte.
              </p>
            </div>
          </div>

          {/* Seletor de Abas */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200 w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setTab('consultar')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                tab === 'consultar'
                  ? 'bg-white text-[#1b6e47] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Consultar Rota</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('rotas_turma')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                tab === 'rotas_turma'
                  ? 'bg-[#1b6e47] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span>Rotas por Turma</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('formulario')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                tab === 'formulario'
                  ? 'bg-white text-[#1b6e47] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Novo Cadastro</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('escala_sabado')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                tab === 'escala_sabado'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Escala de Sábado (Parvi)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ABA 1: CONSULTA DE ROTA (Item 2) */}
      {tab === 'consultar' ? (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 sm:p-8 space-y-6">
          
          <div className="text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#1b6e47] flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-stone-900">
              Qual é a sua rota de ônibus?
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm mt-1">
              Digite sua <strong>matrícula funcional</strong> (ex.: UM-74291) ou seu <strong>nome</strong> para ver o ônibus, horário e ponto de embarque definido pelo RH.
            </p>
          </div>

          {/* Barra de Busca de Rota */}
          <form onSubmit={handleConsultar} className="max-w-lg mx-auto space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={buscaTermo}
                  onChange={(e) => setBuscaTermo(e.target.value)}
                  placeholder="Ex.: UM-74291, UM-83104 ou seu nome..."
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-stone-900 text-sm font-medium shadow-2xs"
                />
              </div>
              <button
                type="submit"
                disabled={buscandoStatus}
                className="px-6 py-3 bg-[#1b6e47] hover:bg-[#155a3a] text-white rounded-2xl text-sm font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer flex-none"
              >
                {buscandoStatus ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Consultar</span>
              </button>
            </div>

            {/* Sugestões rápidas de teste */}
            {sugestoesExemplo.length > 0 && !resultadoConsulta && (
              <div className="pt-2">
                <span className="text-[11px] text-stone-400 block mb-1.5">
                  Toque para testar uma matrícula cadastrada:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sugestoesExemplo.map((sug) => (
                    <button
                      type="button"
                      key={sug.id}
                      onClick={() => {
                        setBuscaTermo(sug.matricula);
                        realizarBusca(sug.matricula);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <User className="w-3 h-3 text-stone-400" />
                      <span>{sug.nome.split(' ')[0]}</span>
                      <span className="font-mono text-[10px] text-stone-500">({sug.matricula})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Resultado da Consulta Encontrado (Item 2.1 Card da Rota) */}
          {resultadoConsulta && (() => {
            const rotaColab = rotas.find(
              (r) => r.id === resultadoConsulta.linhaId || r.codigo === resultadoConsulta.onibus || (resultadoConsulta.onibus && r.nome.includes(resultadoConsulta.onibus))
            );

            return (
              <div className="mt-6 border-2 border-emerald-300/80 bg-gradient-to-b from-emerald-50/70 to-white rounded-3xl p-5 sm:p-7 shadow-sm animate-in fade-in duration-300 space-y-5">
                
                {/* Header do Card com Status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full border-2 border-emerald-300 bg-white text-[#1b6e47] flex items-center justify-center font-bold text-lg flex-none overflow-hidden shadow-2xs">
                      {resultadoConsulta.foto ? (
                        <img src={resultadoConsulta.foto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{resultadoConsulta.nome.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-stone-900 leading-tight">
                        {resultadoConsulta.nome}
                      </h4>
                      <p className="text-xs text-stone-600 mt-0.5">
                        Matrícula: <strong className="font-mono text-stone-800">{resultadoConsulta.matricula}</strong> • Turma: <span className="font-bold text-[#1b6e47]">{resultadoConsulta.turma}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-2xs ${
                      resultadoConsulta.status === 'Rota definida'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : resultadoConsulta.status === 'Em análise'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {resultadoConsulta.status}
                    </span>
                  </div>
                </div>

                {/* 2.1 CARD DA ROTA: Linha (tag), Turma, Horários, Km, Itinerário, Ponto */}
                <div className="p-4 rounded-2xl bg-emerald-100/70 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block flex items-center gap-1.5 mb-1">
                      <Bus className="w-4 h-4 text-emerald-700" /> Linha de Ônibus / Rota Designada:
                    </span>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="bg-[#1b6e47] text-white text-base sm:text-lg font-black px-3 py-0.5 rounded-xl shadow-2xs">
                        {rotaColab ? rotaColab.codigo : (resultadoConsulta.onibus || 'A definir')}
                      </span>
                      <span className="text-base sm:text-lg font-bold text-emerald-950">
                        {rotaColab ? rotaColab.nome : (resultadoConsulta.rotaSugerida || 'Em alocação pelo RH')}
                      </span>
                    </div>

                    {rotaColab && (
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-emerald-800 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Início: <strong>{rotaColab.horarioInicio}</strong> {rotaColab.horarioRetorno ? `• Retorno: ${rotaColab.horarioRetorno}` : ''}
                        </span>
                        <span>•</span>
                        <span>Trajeto: <strong>{rotaColab.km}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-emerald-900 bg-white/90 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs flex-none">
                    <span className="font-bold block text-[10px] uppercase text-emerald-700">Destino Final:</span>
                    <span className="font-bold">Portaria Parauapebas</span>
                  </div>
                </div>

                {/* Grid de Detalhes da Viagem */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  
                  {/* Ponto de Embarque (Definido pelo RH ou aviso) */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" /> Ponto de Embarque Definido pelo RH:
                    </span>

                    {resultadoConsulta.pontoEmbarque ? (
                      <div>
                        <p className="text-stone-900 font-black text-sm sm:text-base leading-snug">
                          📍 {resultadoConsulta.pontoEmbarque.descricao}
                        </p>
                        <p className="text-emerald-700 text-xs font-semibold mt-1">
                          ✓ Ponto validado e georreferenciado pela equipe de logística.
                        </p>
                      </div>
                    ) : resultadoConsulta.ponto && resultadoConsulta.ponto !== 'Ponto em definição pelo RH' ? (
                      <div>
                        <p className="text-stone-900 font-bold text-sm leading-snug">
                          📍 {resultadoConsulta.ponto}
                        </p>
                        <p className="text-amber-700 text-xs mt-1">
                          Aguardando confirmação definitiva do ponto exato no mapa.
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                        <span className="font-bold block">Ponto em definição pelo RH</span>
                        <span>A equipe de transporte está mapeando o melhor ponto próximo à sua residência.</span>
                      </div>
                    )}

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {/* Botão de Abrir Mapa com todas as rotas (Item 2.2 & 2.3) */}
                      <button
                        type="button"
                        onClick={() => setMapaModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-[#1b6e47] hover:bg-[#155a3a] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        title="Ver traçado no mapa e localização do ponto"
                      >
                        <MapPin className="w-4 h-4 text-emerald-200" />
                        <span>Ver no Mapa Interativo</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${resultadoConsulta.pontoEmbarque?.descricao || resultadoConsulta.ponto || resultadoConsulta.endereco}, ${resultadoConsulta.bairro}, Parauapebas - PA`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-stone-600 hover:text-emerald-800 font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>GPS Google Maps</span>
                      </a>
                    </div>
                  </div>

                  {/* Residência e Itinerário Resumido */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">
                      Endereço Residencial Atual:
                    </span>
                    <p className="text-stone-800 font-medium text-xs sm:text-sm">
                      {resultadoConsulta.endereco}
                    </p>
                    <p className="text-stone-600 text-xs">
                      Bairro: <strong>{resultadoConsulta.bairro}</strong> • {resultadoConsulta.cidade}
                    </p>

                    {rotaColab && (
                      <div className="pt-2 border-t border-stone-200/70 text-xs">
                        <span className="text-stone-500 font-bold text-[10px] uppercase block mb-1">
                          Itinerário Resumido da Linha:
                        </span>
                        <p className="text-stone-600 text-[11px] leading-relaxed line-clamp-3">
                          {rotaColab.itinerario}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status de Solicitação de Mudança de Endereço se houver (Item 2.4) */}
                {solicitacaoDoColaborador && (
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    solicitacaoDoColaborador.status === 'Aprovada'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : solicitacaoDoColaborador.status === 'Recusada'
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    <FileEdit className="w-5 h-5 flex-none mt-0.5" />
                    <div className="text-xs flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-sm">Solicitação de Mudança de Endereço</strong>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          solicitacaoDoColaborador.status === 'Aprovada'
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : solicitacaoDoColaborador.status === 'Recusada'
                            ? 'bg-red-600 text-white border-red-700'
                            : 'bg-amber-500 text-white border-amber-600'
                        }`}>
                          {solicitacaoDoColaborador.status}
                        </span>
                      </div>
                      <p className="mt-1">
                        Novo endereço solicitado: <strong>{solicitacaoDoColaborador.enderecoNovo} ({solicitacaoDoColaborador.bairro})</strong> • Válido a partir de {solicitacaoDoColaborador.dataVigencia}
                      </p>
                      {solicitacaoDoColaborador.respostaRH && (
                        <p className="mt-1 italic">
                          Resposta do RH: {solicitacaoDoColaborador.respostaRH}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Observação do RH se houver */}
                {resultadoConsulta.obs && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-700 flex-none mt-0.5" />
                    <div>
                      <span className="font-bold block">Aviso da Equipe de Logística / RH:</span>
                      <span>{resultadoConsulta.obs}</span>
                    </div>
                  </div>
                )}

                {/* Botões de Apoio & Solicitar Mudança de Endereço (Item 2.4) */}
                <div className="pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-stone-500">
                    Protocolo: <code className="font-mono">{resultadoConsulta.protocolo}</code> • Cadastrado em {resultadoConsulta.criadoEm}
                  </span>

                  <button
                    type="button"
                    onClick={() => setMudancaModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Solicitar Mudança de Endereço</span>
                  </button>
                </div>

              </div>
            );
          })()}

          {/* Consulta não encontrada */}
          {consultaNaoEncontrada && (
            <div className="text-center py-8 bg-stone-50 rounded-3xl border border-dashed border-stone-300 p-6">
              <AlertCircle className="w-9 h-9 text-amber-500 mx-auto mb-2" />
              <h4 className="font-bold text-stone-800 text-base">Nenhum cadastro encontrado para esta busca</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Não localizamos nenhum colaborador com a matrícula ou nome informado.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setTab('formulario')}
                  className="px-4 py-2 bg-[#1b6e47] hover:bg-[#155a3a] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cadastrar Meu Transporte Agora
                </button>
                <button
                  type="button"
                  onClick={() => setConsultaNaoEncontrada(false)}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Tentar Outra Matrícula
                </button>
              </div>
            </div>
          )}

        </div>
      ) : tab === 'rotas_turma' ? (
        /* ABA: ROTAS POR TURMA (Item 2 da Reunião de 07/11/2026) */
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                  <Bus className="w-5 h-5 text-[#1b6e47]" />
                  Rotas de Ônibus por Turma / Setor de Trabalho
                </h3>
                <p className="text-stone-500 text-xs sm:text-sm mt-1">
                  Selecione sua turma para visualizar todas as linhas disponíveis, itinerários, horários e pontos atendidos em Parauapebas.
                </p>
              </div>

              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <span>{rotasPorTurmaExibidas.length} {rotasPorTurmaExibidas.length === 1 ? 'linha encontrada' : 'linhas encontradas'}</span>
              </span>
            </div>

            {/* Seletor de Turma (Item 2) */}
            <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setTurmaSelecionadaRotas('Todas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  turmaSelecionadaRotas === 'Todas'
                    ? 'bg-[#1b6e47] text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Todas as Turmas
              </button>

              {TURMAS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTurmaSelecionadaRotas(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    turmaSelecionadaRotas === t
                      ? 'bg-[#1b6e47] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Barra de Busca dentro da Turma */}
            <div className="mt-3 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={buscaRotasTurma}
                onChange={(e) => setBuscaRotasTurma(e.target.value)}
                placeholder="Filtrar por bairro, rua, nome ou código (ex: Betânia, ADM02, LINHA-06)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1b6e47]"
              />
            </div>
          </div>

          {/* Lista de Cards das Linhas da Turma */}
          {rotasPorTurmaExibidas.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-6">
              <Bus className="w-9 h-9 text-stone-400 mx-auto mb-2" />
              <h4 className="font-bold text-stone-700 text-sm">Nenhuma linha encontrada para esta seleção</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Tente selecionar outra turma ou limpe o termo de busca acima.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTurmaSelecionadaRotas('Todas');
                  setBuscaRotasTurma('');
                }}
                className="mt-3 px-4 py-1.5 bg-[#1b6e47] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Ver Todas as Linhas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rotasPorTurmaExibidas.map((r) => {
                const ocup = ocupacaoMap[r.id] || ocupacaoMap[r.codigo] || { ocupadas: 0, capacidade: r.capacidade || 44, disponiveis: 44, lotada: false };
                const percentual = Math.round((ocup.ocupadas / ocup.capacidade) * 100);

                return (
                  <div
                    key={r.id}
                    className="border border-stone-200 rounded-2xl p-4 sm:p-5 hover:border-emerald-300 transition-all bg-white shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Topo do Card da Rota */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-1 rounded-xl text-white font-black text-xs font-mono shadow-2xs"
                            style={{ backgroundColor: r.cor || '#1b6e47' }}
                          >
                            {r.codigo}
                          </span>
                          <span className="font-bold text-stone-900 text-sm leading-snug">
                            {r.nome}
                          </span>
                        </div>

                        {ocup.lotada ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200 flex-none">
                            Lotada
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex-none">
                            {ocup.disponiveis} vagas
                          </span>
                        )}
                      </div>

                      {/* Horários e Extensão */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-stone-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-700" />
                          Início: <strong className="text-stone-800">{r.horarioInicio}</strong>
                          {r.horarioRetorno && <span> • Retorno: <strong className="text-stone-800">{r.horarioRetorno}</strong></span>}
                        </span>
                        <span>•</span>
                        <span>{r.km}</span>
                      </div>

                      {/* Barra de Ocupação */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                          <span>Ocupação atual:</span>
                          <span className="font-bold text-stone-700">{ocup.ocupadas} / {ocup.capacidade} assentos ({percentual}%)</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentual >= 90 ? 'bg-red-500' : percentual >= 70 ? 'bg-amber-500' : 'bg-[#1b6e47]'
                            }`}
                            style={{ width: `${Math.min(100, percentual)}%` }}
                          />
                        </div>
                      </div>

                      {/* Turmas Atendidas */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {r.turmas && r.turmas.length > 0 ? (
                          r.turmas.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium border border-stone-200">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium border border-stone-200">
                            {r.turma || 'Administrativo'}
                          </span>
                        )}
                      </div>

                      {/* Bairros Principais */}
                      {r.bairros && r.bairros.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
                            Bairros Atendidos:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {r.bairros.map((b) => (
                              <span key={b} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] border border-emerald-100">
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Itinerário Resumido */}
                      {r.itinerario && (
                        <p className="mt-2.5 text-[11px] text-stone-500 line-clamp-2 leading-relaxed bg-stone-50 p-2 rounded-xl border border-stone-100">
                          {r.itinerario}
                        </p>
                      )}
                    </div>

                    {/* Botão Ver no Mapa */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] text-stone-400">
                        Destino: Portaria PeBa
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAbrirMapaRota(r)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#1b6e47] text-emerald-800 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-200 hover:border-[#1b6e47] cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Ver Traçado no Mapa</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : tab === 'escala_sabado' ? (
        /* ABA: ESCALA DE SÁBADO (Supervisores & Parvi) (Item 3 da Reunião) */
        <EscalaSabadoView
          cadastros={todosCadastros}
          rotas={rotas}
          isSupervisorView={true}
        />
      ) : (
        /* ABA: FORMULÁRIO DE CADASTRO (Item 1) */
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8">
          <div className="border-b border-stone-100 pb-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Cadastro de Transporte de Colaborador
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Preencha seus dados residenciais e turno de trabalho. O ponto de embarque será definido pelo RH.
              Campos com <span className="text-red-500 font-bold">*</span> são obrigatórios.
            </p>
          </div>

          {erro && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-none mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Foto do Colaborador (Opcional) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Foto do Colaborador (Opcional)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-stone-200 bg-stone-100 overflow-hidden flex items-center justify-center flex-none shadow-inner">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Foto Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-7 h-7 text-stone-400" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                    <span>{fotoPreview ? 'Trocar foto' : 'Tirar / Anexar foto'}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="hidden"
                    />
                  </label>
                  {fotoPreview && (
                    <button
                      type="button"
                      onClick={removerFoto}
                      className="px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Identificação Básica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo do colaborador"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-stone-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Matrícula Funcional U&M <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder="Ex: UM-74291"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-stone-800 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Telefone / WhatsApp <span className="text-stone-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="tel"
                  maxLength={20}
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(94) 99123-4567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-stone-800 text-sm"
                />
              </div>
            </div>

            {/* Endereço Residencial em Parauapebas */}
            <div className="pt-2 border-t border-stone-100">
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Endereço Residencial
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Endereço / Rua e Número <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Ex: Rua Santa Catarina, 1420 - Apt 204"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-stone-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Bairro em Parauapebas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Ex: Liberdade, Cidade Nova, VS-10"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-stone-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-stone-800 text-sm bg-stone-50"
                  />
                </div>
              </div>
            </div>

            {/* Operação & Escolha da Linha pela Turma (Item 1.3) */}
            <div className="pt-2 border-t border-stone-100">
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5" /> Informações de Turno e Linha
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Turma / Setor de Trabalho <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={turma}
                    onChange={(e) => {
                      setTurma(e.target.value);
                      setLinhaSelecionada('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-stone-800 text-sm bg-white"
                  >
                    <option value="">Selecione sua turma...</option>
                    {TURMAS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Local de Trabalho / Contrato
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Ex: U&M Mina N4, Escritório Central"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-stone-800 text-sm"
                  />
                </div>

                {/* 1.3 ESCOLHA DA LINHA PELA TURMA (Select obrigatório com ocupação) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>
                      Linha do Ônibus <span className="text-red-500">*</span>
                    </span>
                    {turma && (
                      <span className="text-[11px] font-normal text-stone-500">
                        {linhasDaTurma.length} linhas disponíveis para {turma}
                      </span>
                    )}
                  </label>

                  <select
                    required
                    disabled={!turma}
                    value={linhaSelecionada}
                    onChange={(e) => setLinhaSelecionada(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-stone-800 text-sm bg-white disabled:bg-stone-100 disabled:text-stone-400"
                  >
                    <option value="">
                      {!turma ? 'Primeiro escolha a Turma acima...' : 'Selecione a linha de ônibus...'}
                    </option>
                    {linhasDaTurma.map((linha) => {
                      const ocup = ocupacaoMap[linha.id] || { ocupadas: 0, capacidade: linha.capacidade || 44, disponiveis: 44, lotada: false };
                      const labelStatus = ocup.lotada ? ' • [LOTADA - Lista de espera]' : ` • vagas disponíveis: ${ocup.disponiveis}`;
                      return (
                        <option key={linha.id} value={linha.id}>
                          {linha.codigo} • {linha.bairros.slice(0, 3).join(', ')} • Início {linha.horarioInicio} {linha.horarioRetorno ? '/ Retorno ' + linha.horarioRetorno : ''}{labelStatus}
                        </option>
                      );
                    })}
                  </select>

                  {/* 1.2 TAG COLORIDA COM A LINHA SUGERIDA AUTOMATICAMENTE */}
                  {turma && endereco && bairro && (
                    <div className="mt-2.5">
                      {sugestaoForm?.encontrada ? (
                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-[#1b6e47] text-white font-black text-xs">
                              Linha sugerida: {sugestaoForm.codigo}
                            </span>
                            <span className="text-xs font-bold text-emerald-900">
                              Início {sugestaoForm.horarioInicio || '04:30'}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 w-full sm:w-auto">
                            {sugestaoForm.motivo}
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-2xl bg-stone-100 border border-stone-300 text-stone-700 flex items-center gap-2 text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-stone-300 text-stone-800 font-bold text-xs">
                            Rota a definir pelo RH
                          </span>
                          <span className="text-[11px] text-stone-600">
                            Não identificamos itinerário direto para este endereço. O RH designará a linha manualmente.
                          </span>
                        </div>
                      )}

                      {/* Lista de alternativas se mais de uma linha servir (Item 1.2 d) */}
                      {sugestaoForm?.alternativas && sugestaoForm.alternativas.length > 1 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                          <span>Outras opções que atendem seu setor:</span>
                          {sugestaoForm.alternativas.slice(1).map((alt) => (
                            <button
                              type="button"
                              key={alt.rotaId}
                              onClick={() => setLinhaSelecionada(alt.rotaId)}
                              className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-emerald-50 border border-stone-200 text-stone-700 hover:text-emerald-800 font-semibold cursor-pointer"
                            >
                              {alt.codigo}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aviso de ponto definido pelo RH (Item 1.1) */}
                  <div className="mt-3 p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-700 flex-none mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-800 block">Ponto de Embarque:</span>
                      <span>O seu ponto de embarque oficial será definido diretamente pela equipe de RH e Logística no mapa após o envio do cadastro.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Consentimento LGPD */}
            <div className="pt-2 border-t border-stone-100">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={consentimento}
                  onChange={(e) => setConsentimento(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-[#1b6e47] focus:ring-[#1b6e47] border-stone-300 accent-[#1b6e47]"
                />
                <span className="text-xs text-stone-600 leading-relaxed">
                  Autorizo o uso dos meus dados estritamente para a finalidade de
                  organização, alocação e operação do transporte de colaboradores da U&M, em conformidade com a LGPD.
                </span>
              </label>
            </div>

            {/* Botão de Envio (Item 1.4) */}
            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3.5 rounded-2xl bg-[#1b6e47] hover:bg-[#155a3a] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60 cursor-pointer"
            >
              {enviando ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Enviando dados para o RH...</span>
                </>
              ) : (
                <>
                  <span>Enviar Solicitação para o RH</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Dados seguros e confidenciais da U&M
              </span>
              <span className="text-stone-400">
                Logística de Frotas Parauapebas
              </span>
            </div>
          </form>
        </div>
      )}

      {/* Modal do Mapa de Parauapebas com todas as linhas e boneco (Item 2.2 & 2.3) */}
      <MapaModal
        isOpen={mapaModalOpen}
        onClose={() => {
          setMapaModalOpen(false);
          setMapaColaborador(null);
        }}
        colaborador={mapaColaborador || resultadoConsulta}
        rotas={rotas}
      />

      {/* Modal de Solicitação de Mudança de Endereço (Item 2.4) */}
      {resultadoConsulta && (
        <ModalSolicitarMudancaEndereco
          isOpen={mudancaModalOpen}
          onClose={() => setMudancaModalOpen(false)}
          colaborador={resultadoConsulta}
          rotas={rotas}
          onSolicitacaoCriada={(novaSol) => {
            setSolicitacoes((prev) => [novaSol, ...prev]);
          }}
        />
      )}
    </div>
  );
};
