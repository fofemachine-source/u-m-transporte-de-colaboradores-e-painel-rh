import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Camera,
  CheckCircle2,
  User,
  MapPin,
  Bus,
  Shield,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  Info,
} from 'lucide-react';
import { TURMAS } from '../constants';
import { NovoCadastroInput, ColaboradorCadastro, RotaLinha, SugestaoRotaResultado } from '../types';
import { lerFotoArquivo, criarCadastro, fetchCadastros, fetchRotas } from '../services/api';
import { sugerirRota, linhasPorTurma } from '../utils/motorRotas';
import { MapaModal } from './MapaModal';

interface ColaboradorFormProps {
  onCadastroCriado: (novo: ColaboradorCadastro) => void;
}

export const ColaboradorForm: React.FC<ColaboradorFormProps> = ({
  onCadastroCriado,
}) => {
  // Abas: 1. Consultar minha rota (ativa por padrão), 2. Rotas por Turma, 3. Buscar por endereço, 4. Novo Cadastro
  const [tab, setTab] = useState<'consultar' | 'rotas_turma' | 'buscar_endereco' | 'formulario'>('consultar');
  const [turmaSelecionadaRotas, setTurmaSelecionadaRotas] = useState<string>('Todas');
  const [mapaColaborador, setMapaColaborador] = useState<ColaboradorCadastro | null>(null);

  // Rotas e Cadastros para ocupação e listagem
  const [rotas, setRotas] = useState<RotaLinha[]>([]);
  const [todosCadastros, setTodosCadastros] = useState<ColaboradorCadastro[]>([]);

  // Aba 1: Consultar minha rota
  const [buscaTermo, setBuscaTermo] = useState('');
  const [buscandoStatus, setBuscandoStatus] = useState(false);
  const [resultadoConsulta, setResultadoConsulta] = useState<ColaboradorCadastro | null>(null);
  const [consultaNaoEncontrada, setConsultaNaoEncontrada] = useState(false);

  // Aba 3: Buscar por endereço
  const [buscaEndTurma, setBuscaEndTurma] = useState<string>('');
  const [buscaEndRua, setBuscaEndRua] = useState<string>('');
  const [buscaEndBairro, setBuscaEndBairro] = useState<string>('');
  const [resultadoBuscaEndereco, setResultadoBuscaEndereco] = useState<SugestaoRotaResultado | null>(null);
  const [buscaEnderecoRealizada, setBuscaEnderecoRealizada] = useState<boolean>(false);

  // Modal de Mapa
  const [mapaModalOpen, setMapaModalOpen] = useState(false);

  // Aba 4: Novo Cadastro (o mesmo formulário que já existe hoje, sem mudanças)
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Parauapebas');
  const [turma, setTurma] = useState('');
  const [linhaSelecionada, setLinhaSelecionada] = useState('');
  const [local, setLocal] = useState('U&M');
  const [consentimento, setConsentimento] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [sugestaoForm, setSugestaoForm] = useState<SugestaoRotaResultado | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucessoProtocolo, setSucessoProtocolo] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados de rotas e cadastros
  const carregarDados = async () => {
    try {
      const [rts, cads] = await Promise.all([
        fetchRotas(),
        fetchCadastros(),
      ]);
      setRotas(rts);
      setTodosCadastros(cads);
    } catch (err) {
      console.warn('Erro ao carregar dados:', err);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Calcular ocupação de cada linha em tempo real
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

  // Linhas disponíveis para a Turma escolhida no formulário
  const linhasDaTurma = useMemo(() => {
    if (!turma) return [];
    return linhasPorTurma(rotas, turma);
  }, [rotas, turma]);

  // Rotas filtradas para a aba "Rotas por Turma"
  const rotasPorTurmaExibidas = useMemo(() => {
    return rotas.filter((r) => {
      if (turmaSelecionadaRotas !== 'Todas') {
        const matchTurma =
          (r.turmas && r.turmas.some((t) => t.includes(turmaSelecionadaRotas))) ||
          (r.turma && r.turma.includes(turmaSelecionadaRotas));
        if (!matchTurma) return false;
      }
      return true;
    });
  }, [rotas, turmaSelecionadaRotas]);

  // Quando o colaborador preencher Endereço + Bairro + Turma no Novo Cadastro, sugerir automaticamente
  useEffect(() => {
    if (bairro.trim() && turma) {
      const sug = sugerirRota({
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        turma,
      }, rotas);

      setSugestaoForm(sug);

      if (sug.encontrada && sug.rotaId) {
        setLinhaSelecionada(sug.rotaId);
      }
    } else {
      setSugestaoForm(null);
    }
  }, [endereco, bairro, turma, rotas]);

  // Busca por endereço na aba "Buscar por endereço"
  const handleBuscarPorEndereco = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buscaEndBairro.trim()) return;
    const sug = sugerirRota(
      {
        endereco: buscaEndRua.trim(),
        bairro: buscaEndBairro.trim(),
        turma: buscaEndTurma || undefined,
      },
      rotas
    );
    setResultadoBuscaEndereco(sug);
    setBuscaEnderecoRealizada(true);
  };

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

      setTodosCadastros((prev) => [res.registro, ...prev]);

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

  const buildGoogleMapsUrl = (query: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // Se o cadastro foi enviado com sucesso, mostra tela de confirmação
  if (sucessoProtocolo) {
    return (
      <div className="max-w-[800px] mx-auto py-8 px-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#e8f3ee] text-[#1b6e47] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Cadastro Enviado com Sucesso!
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Seus dados foram recebidos pela equipe de Recursos Humanos e Logística de Frotas da U&M.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-[#e8f3ee] border border-[#1b6e47]/20">
            <span className="text-xs uppercase font-bold tracking-wider text-[#1b6e47] block mb-1">
              Seu Número de Protocolo
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#14673f] tracking-wide select-all">
              {sucessoProtocolo}
            </div>
            <p className="text-xs text-[#1b6e47] mt-2">
              Guarde este código para consultar o status da sua linha e ponto de embarque.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 text-left text-xs sm:text-sm text-gray-600 border border-gray-200 mb-6 space-y-2">
            <p className="font-semibold text-gray-800">Próximos passos operacionais:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>O RH definirá o seu ponto de embarque oficial no mapa da cidade.</li>
              <li>Sua vaga na linha selecionada já está pré-reservada no sistema.</li>
              <li>Acesse a aba <strong>Consultar minha rota</strong> a qualquer momento para ver o horário e ponto de embarque.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                setSucessoProtocolo(null);
                setTab('consultar');
              }}
              className="px-6 py-2.5 rounded-xl bg-[#1b6e47] hover:bg-[#14673f] text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              Consultar minha rota
            </button>
            <button
              type="button"
              onClick={() => setSucessoProtocolo(null)}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              Fazer outro cadastro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto py-6 px-4">
      
      {/* CARTÃO DE APRESENTAÇÃO */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 mb-6 shadow-2xs">
        <div className="flex flex-col gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f3ee] text-[#1b6e47] flex items-center justify-center flex-none">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                Portal do Colaborador • Transporte U&M
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Consulte o ônibus da sua rota de trabalho ou faça seu cadastro de transporte.
              </p>
            </div>
          </div>

          {/* Barra de Abas rolável na horizontal no celular */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl border border-gray-200/80 w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setTab('consultar')}
              className={`flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                tab === 'consultar'
                  ? 'bg-white text-[#1b6e47] font-bold shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Search className="w-4 h-4 flex-none" />
              <span>Consultar minha rota</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('rotas_turma')}
              className={`flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                tab === 'rotas_turma'
                  ? 'bg-white text-[#1b6e47] font-bold shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Bus className="w-4 h-4 flex-none" />
              <span>Rotas por Turma</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('buscar_endereco')}
              className={`flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                tab === 'buscar_endereco'
                  ? 'bg-white text-[#1b6e47] font-bold shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <MapPin className="w-4 h-4 flex-none" />
              <span>Buscar por endereço</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('formulario')}
              className={`flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                tab === 'formulario'
                  ? 'bg-white text-[#1b6e47] font-bold shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <User className="w-4 h-4 flex-none" />
              <span>Novo Cadastro</span>
            </button>
          </div>
        </div>
      </div>

      {/* ABA 1: CONSULTAR MINHA ROTA (CARTÃO PRINCIPAL) */}
      {tab === 'consultar' ? (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-6 sm:p-8 space-y-6">
          
          <div className="text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#e8f3ee] text-[#1b6e47] flex items-center justify-center mx-auto mb-3.5">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Qual é a sua rota de ônibus?
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Digite sua matrícula funcional (ex.: UM-74291) ou seu nome para ver o ônibus, horário e ponto de embarque definidos pelo RH.
            </p>
          </div>

          {/* Campo de texto + botão Consultar (um embaixo do outro no celular, lado a lado no computador) */}
          <form onSubmit={handleConsultar} className="max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={buscaTermo}
                onChange={(e) => setBuscaTermo(e.target.value)}
                placeholder="Ex.: UM-74291, UM-83104 ou seu nome..."
                required
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-gray-900 text-sm"
              />
              <button
                type="submit"
                disabled={buscandoStatus}
                className="px-6 py-3 bg-[#1b6e47] hover:bg-[#14673f] text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer flex-none"
              >
                {buscandoStatus ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Consultar</span>
              </button>
            </div>
          </form>

          {/* Resultado da Consulta Encontrado (sem exibir endereço nem telefone por privacidade) */}
          {resultadoConsulta && (() => {
            const primeiroNome = resultadoConsulta.nome.trim().split(/\s+/)[0] || resultadoConsulta.nome;
            const rotaColab = rotas.find(
              (r) =>
                r.id === resultadoConsulta.linhaId ||
                r.codigo === resultadoConsulta.onibus ||
                (resultadoConsulta.onibus && r.nome.includes(resultadoConsulta.onibus))
            );
            const confirmadaPeloRH = resultadoConsulta.status === 'Rota definida';
            const textoOnibus = rotaColab
              ? `${rotaColab.codigo} - ${rotaColab.nome}`
              : resultadoConsulta.onibus || resultadoConsulta.rotaSugerida || 'Em definição pelo RH';
            const textoHorario = rotaColab?.horarioInicio || 'Em definição pelo RH';
            const textoPonto =
              resultadoConsulta.pontoEmbarque?.descricao ||
              (resultadoConsulta.ponto && resultadoConsulta.ponto !== 'Ponto em definição pelo RH'
                ? resultadoConsulta.ponto
                : 'Em definição pelo RH');

            const queryMaps =
              resultadoConsulta.pontoEmbarque?.descricao ||
              resultadoConsulta.ponto ||
              (rotaColab ? `${rotaColab.bairros?.[0] || ''}, Parauapebas - PA` : 'Parauapebas - PA');

            return (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50/70 p-5 sm:p-6 space-y-5 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      Olá, {primeiroNome}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Matrícula: <span className="font-mono font-medium text-gray-700">{resultadoConsulta.matricula}</span>
                    </p>
                  </div>

                  {confirmadaPeloRH ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#e8f3ee] text-[#1b6e47] border border-[#1b6e47]/30">
                      Rota confirmada pelo RH
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                      Aguardando confirmação do RH
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 block mb-1">Turma</span>
                    <span className="font-bold text-gray-900">{resultadoConsulta.turma || 'Não informada'}</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 block mb-1">Ônibus / Linha</span>
                    <span className="font-bold text-[#1b6e47]">{textoOnibus}</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 block mb-1">Horário de saída</span>
                    <span className="font-bold text-gray-900">{textoHorario}</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 block mb-1">Ponto de embarque</span>
                    <span className="font-bold text-gray-900">{textoPonto}</span>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <a
                    href={buildGoogleMapsUrl(`${queryMaps}, Parauapebas - PA`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1b6e47] hover:bg-[#14673f] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Ver rota no Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Se não encontrar: aviso amarelo + botão Fazer meu cadastro */}
          {consultaNaoEncontrada && (
            <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-5 sm:p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-base">
                  Não encontramos seu cadastro
                </h4>
                <p className="text-xs sm:text-sm text-amber-800 mt-1 max-w-md mx-auto">
                  Verifique a matrícula ou nome digitado, ou realize seu cadastro de transporte abaixo.
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setConsultaNaoEncontrada(false);
                    setTab('formulario');
                  }}
                  className="px-5 py-2.5 bg-[#1b6e47] hover:bg-[#14673f] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Fazer meu cadastro
                </button>
              </div>
            </div>
          )}

        </div>
      ) : tab === 'rotas_turma' ? (
        /* ABA 2: ROTAS POR TURMA */
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Rotas por Turma
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Selecione a turma para ver os horários e itinerários de cada linha.
            </p>

            {/* Botões com as turmas */}
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setTurmaSelecionadaRotas('Todas')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  turmaSelecionadaRotas === 'Todas'
                    ? 'bg-[#1b6e47] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>

              {TURMAS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTurmaSelecionadaRotas(t)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    turmaSelecionadaRotas === t
                      ? 'bg-[#1b6e47] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Cartões de cada linha com horário, itinerário e botão Ver no Google Maps */}
          <div className="space-y-3.5">
            {rotasPorTurmaExibidas.map((r) => {
              const queryRotaMaps = `${r.bairros?.join(', ') || r.nome}, Parauapebas - PA`;
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-gray-200 p-4 sm:p-5 bg-white flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#1b6e47] text-white font-bold text-xs">
                          {r.codigo}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                          {r.nome}
                        </h4>
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-[#1b6e47]" />
                        <span>Saída: <strong>{r.horarioInicio}</strong>{r.horarioRetorno ? ` • Retorno: ${r.horarioRetorno}` : ''}</span>
                      </span>
                    </div>

                    {r.itinerario && (
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        <strong className="text-gray-700">Itinerário:</strong> {r.itinerario}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">
                      {r.turmas?.join(', ') || r.turma || 'Todas as turmas'}
                    </span>
                    <a
                      href={buildGoogleMapsUrl(queryRotaMaps)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-[#e8f3ee] hover:bg-[#1b6e47] text-[#1b6e47] hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Ver no Google Maps</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : tab === 'buscar_endereco' ? (
        /* ABA 3: BUSCAR POR ENDEREÇO */
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Buscar linha por endereço
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Escolha sua turma e informe seu endereço e bairro para encontrar a linha que passa mais perto de você.
            </p>
          </div>

          <form onSubmit={handleBuscarPorEndereco} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Turma
                </label>
                <select
                  value={buscaEndTurma}
                  onChange={(e) => setBuscaEndTurma(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-gray-800 text-sm bg-white"
                >
                  <option value="">Todas as turmas</option>
                  {TURMAS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Endereço / Rua
                </label>
                <input
                  type="text"
                  value={buscaEndRua}
                  onChange={(e) => setBuscaEndRua(e.target.value)}
                  placeholder="Ex.: Rua E, Av. Liberdade..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-gray-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Bairro <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={buscaEndBairro}
                  onChange={(e) => setBuscaEndBairro(e.target.value)}
                  placeholder="Ex.: Cidade Nova, Liberdade..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1b6e47] text-gray-800 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1b6e47] hover:bg-[#14673f] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Buscar linha mais próxima</span>
            </button>
          </form>

          {buscaEnderecoRealizada && resultadoBuscaEndereco && (
            <div className="pt-2">
              {resultadoBuscaEndereco.encontrada ? (() => {
                const rotaSug = rotas.find((r) => r.id === resultadoBuscaEndereco.rotaId || r.codigo === resultadoBuscaEndereco.codigo);
                return (
                  <div className="p-5 rounded-2xl bg-[#e8f3ee] border border-[#1b6e47]/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#1b6e47] text-white font-bold text-xs">
                          {resultadoBuscaEndereco.codigo}
                        </span>
                        <h4 className="font-bold text-gray-900 text-base">
                          {resultadoBuscaEndereco.nome}
                        </h4>
                      </div>
                      {resultadoBuscaEndereco.horarioInicio && (
                        <span className="text-xs font-bold text-[#1b6e47] bg-white px-2.5 py-1 rounded-lg border border-[#1b6e47]/20">
                          Saída: {resultadoBuscaEndereco.horarioInicio}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-gray-700">
                      {resultadoBuscaEndereco.motivo}
                    </p>

                    {rotaSug?.itinerario && (
                      <p className="text-xs text-gray-600 bg-white/80 p-3 rounded-xl border border-gray-200">
                        <strong>Itinerário:</strong> {rotaSug.itinerario}
                      </p>
                    )}

                    <div className="pt-1 flex justify-end">
                      <a
                        href={buildGoogleMapsUrl(`${buscaEndRua ? buscaEndRua + ', ' : ''}${buscaEndBairro}, Parauapebas - PA`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-[#1b6e47] hover:bg-[#14673f] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Ver no Google Maps</span>
                      </a>
                    </div>
                  </div>
                );
              })() : (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm space-y-2">
                  <p className="font-bold">Nenhuma linha direta localizada para este endereço.</p>
                  <p className="text-xs text-amber-800">{resultadoBuscaEndereco.motivo}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ABA 4: NOVO CADASTRO (O MESMO FORMULÁRIO QUE JÁ EXISTE HOJE, SEM MUDANÇAS) */
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
              <h3 className="text-xs font-bold text-[#1b6e47] uppercase tracking-wider mb-3 flex items-center gap-1.5">
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

            {/* Operação & Escolha da Linha pela Turma */}
            <div className="pt-2 border-t border-stone-100">
              <h3 className="text-xs font-bold text-[#1b6e47] uppercase tracking-wider mb-3 flex items-center gap-1.5">
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

                  {turma && endereco && bairro && (
                    <div className="mt-2.5">
                      {sugestaoForm?.encontrada ? (
                        <div className="p-3 rounded-2xl bg-[#e8f3ee] border border-[#1b6e47]/30 text-stone-900 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-[#1b6e47] text-white font-black text-xs">
                              Linha sugerida: {sugestaoForm.codigo}
                            </span>
                            <span className="text-xs font-bold text-[#14673f]">
                              Início {sugestaoForm.horarioInicio || '04:30'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#1b6e47] w-full sm:w-auto">
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

                      {sugestaoForm?.alternativas && sugestaoForm.alternativas.length > 1 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                          <span>Outras opções que atendem seu setor:</span>
                          {sugestaoForm.alternativas.slice(1).map((alt) => (
                            <button
                              type="button"
                              key={alt.rotaId}
                              onClick={() => setLinhaSelecionada(alt.rotaId)}
                              className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-[#e8f3ee] border border-stone-200 text-stone-700 hover:text-[#1b6e47] font-semibold cursor-pointer"
                            >
                              {alt.codigo}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#1b6e47] flex-none mt-0.5" />
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

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3.5 rounded-2xl bg-[#1b6e47] hover:bg-[#14673f] active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60 cursor-pointer"
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
                <Shield className="w-3.5 h-3.5 text-[#1b6e47]" />
                Dados seguros e confidenciais da U&M
              </span>
              <span className="text-stone-400">
                Logística de Frotas Parauapebas
              </span>
            </div>
          </form>
        </div>
      )}

      {/* Modal do Mapa */}
      <MapaModal
        isOpen={mapaModalOpen}
        onClose={() => {
          setMapaModalOpen(false);
          setMapaColaborador(null);
        }}
        colaborador={mapaColaborador || resultadoConsulta}
        rotas={rotas}
      />
    </div>
  );
};
