import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Bus,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Navigation,
  Compass,
  Sparkles,
  MapPin,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Sliders,
  Palette,
  Crosshair,
  Save,
  RotateCcw,
} from 'lucide-react';
import { RotaLinha, ColaboradorCadastro } from '../../types';
import { salvarRota, excluirRota } from '../../services/api';
import { sugerirRota, listaItinerario } from '../../utils/motorRotas';
import { TURMAS } from '../../constants';

interface AdminRotasProps {
  rotas: RotaLinha[];
  cadastros: ColaboradorCadastro[];
  onRefreshRotas: () => Promise<void>;
}

export const AdminRotas: React.FC<AdminRotasProps> = ({
  rotas,
  cadastros,
  onRefreshRotas,
}) => {
  const [turmaAtiva, setTurmaAtiva] = useState<string>('Todas');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [linhaExpandida, setLinhaExpandida] = useState<string | null>(null);

  // Modal de edição / criação de rota
  const [modalAberto, setModalAberto] = useState(false);
  const [rotaEditando, setRotaEditando] = useState<Partial<RotaLinha> | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // Modal de Passageiros da Linha
  const [modalPassageirosRota, setModalPassageirosRota] = useState<RotaLinha | null>(null);

  // Modal de Editor de Traçado no Mapa
  const [editorMapaRota, setEditorMapaRota] = useState<RotaLinha | null>(null);
  const [coordsEditadas, setCoordsEditadas] = useState<[number, number][]>([]);
  const mapEditorRef = useRef<HTMLDivElement>(null);
  const leafletEditorRef = useRef<L.Map | null>(null);
  const editorLayerRef = useRef<L.LayerGroup | null>(null);

  // Simulador de motor de rotas
  const [simuladorAberto, setSimuladorAberto] = useState(false);
  const [simEndereco, setSimEndereco] = useState('');
  const [simBairro, setSimBairro] = useState('');
  const [simTurma, setSimTurma] = useState('Administrativo');
  const [simResultado, setSimResultado] = useState<any>(null);

  // Lista de turmas disponíveis
  const [turmasOpcoes, setTurmasOpcoes] = useState<string[]>(() => {
    const set = new Set<string>(TURMAS);
    rotas.forEach((r) => {
      if (r.turmas) r.turmas.forEach((t) => set.add(t));
      else if (r.turma) set.add(r.turma);
    });
    return Array.from(set);
  });
  const [mostraCriarNovaTurma, setMostraCriarNovaTurma] = useState(false);
  const [novaTurmaNome, setNovaTurmaNome] = useState('');

  const handleCriarNovaTurmaOuLinha = () => {
    const nomeLimpo = novaTurmaNome.trim();
    if (!nomeLimpo) return;
    if (!turmasOpcoes.includes(nomeLimpo)) {
      setTurmasOpcoes((prev) => [...prev, nomeLimpo]);
    }
    const turmasAtuais = rotaEditando?.turmas || (rotaEditando?.turma ? [rotaEditando.turma] : ['Administrativo']);
    if (!turmasAtuais.includes(nomeLimpo)) {
      setRotaEditando((prev) => ({
        ...prev,
        turmas: [...turmasAtuais, nomeLimpo],
        turma: nomeLimpo,
      }));
    }
    setNovaTurmaNome('');
    setMostraCriarNovaTurma(false);
  };

  const turmasList = useMemo(() => {
    const set = new Set<string>();
    rotas.forEach((r) => {
      if (r.turmas) r.turmas.forEach((t) => set.add(t));
      else if (r.turma) set.add(r.turma);
    });
    turmasOpcoes.forEach((t) => set.add(t));
    return Array.from(set).sort();
  }, [rotas, turmasOpcoes]);

  // Contagem e lista de colaboradores por linha
  const passageirosPorLinha = useMemo(() => {
    const map: Record<string, ColaboradorCadastro[]> = {};
    cadastros.forEach((c) => {
      if (c.status !== 'Inativo') {
        const lid = c.linhaId || c.onibus;
        if (lid) {
          if (!map[lid]) map[lid] = [];
          map[lid].push(c);
        }
      }
    });
    return map;
  }, [cadastros]);

  // Filtro de rotas
  const rotasFiltradas = useMemo(() => {
    return rotas.filter((r) => {
      if (turmaAtiva !== 'Todas') {
        const matchTurma = (r.turmas && r.turmas.some((t) => t.includes(turmaAtiva))) || (r.turma && r.turma.includes(turmaAtiva));
        if (!matchTurma) return false;
      }
      if (termoBusca.trim()) {
        const q = termoBusca.toLowerCase().trim();
        const cod = (r.codigo || r.linha || '').toLowerCase();
        const itin = (r.itinerario || '').toLowerCase();
        const bairros = (r.bairros?.join(' ') || r.bairrosExtras || '').toLowerCase();
        const ruas = (r.ruas?.join(' ') || '').toLowerCase();
        return cod.includes(q) || itin.includes(q) || bairros.includes(q) || ruas.includes(q);
      }
      return true;
    });
  }, [rotas, turmaAtiva, termoBusca]);

  const handleSalvarRota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rotaEditando?.codigo && !rotaEditando?.linha) {
      setErroModal('Informe o código da linha (ex: ADM02, LINHA-06).');
      return;
    }

    setSalvando(true);
    setErroModal(null);
    try {
      const codigo = (rotaEditando.codigo || rotaEditando.linha || 'NOVA').trim().toUpperCase();
      const nome = (rotaEditando.nome || `Linha ${codigo}`).trim();
      const turmas = Array.isArray(rotaEditando.turmas) && rotaEditando.turmas.length > 0
        ? rotaEditando.turmas
        : [rotaEditando.turma || 'Administrativo'];

      const payload: Partial<RotaLinha> = {
        ...rotaEditando,
        codigo,
        nome,
        linha: codigo,
        turmas,
        turma: turmas[0] || 'Administrativo',
        capacidade: Number(rotaEditando.capacidade) || 44,
      };

      await salvarRota(payload);
      setModalAberto(false);
      setRotaEditando(null);
      await onRefreshRotas();
    } catch (err: any) {
      setErroModal(err.message || 'Erro ao salvar linha de ônibus.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja desativar ou excluir esta linha de transporte?')) return;
    try {
      await excluirRota(id);
      await onRefreshRotas();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir rota.');
    }
  };

  // Abre Editor de Traçado no Mapa (Item 4.2)
  const handleAbrirEditorMapa = (rota: RotaLinha) => {
    setEditorMapaRota(rota);
    setCoordsEditadas(rota.coordenadas && rota.coordenadas.length > 0 ? [...rota.coordenadas] : [[-6.0674, -49.9044]]);
  };

  // Inicializa o Leaflet no Editor de Traçado
  useEffect(() => {
    if (!editorMapaRota || !mapEditorRef.current) return;

    if (!leafletEditorRef.current) {
      const initialCenter: [number, number] = coordsEditadas.length > 0
        ? [coordsEditadas[0][0], coordsEditadas[0][1]]
        : [-6.0674, -49.9044];
      const map = L.map(mapEditorRef.current, {
        center: initialCenter,
        zoom: 14,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | U&M Traçado',
        maxZoom: 18,
      }).addTo(map);

      const layer = L.layerGroup().addTo(map);
      editorLayerRef.current = layer;
      leafletEditorRef.current = map;

      // Clique no mapa adiciona ponto da rota (Item 4.2)
      map.on('click', (e: L.LeafletMouseEvent) => {
        setCoordsEditadas((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
      });

      setTimeout(() => map.invalidateSize(), 200);
    }
  }, [editorMapaRota]);

  // Redesenha a linha e marcadores arrastáveis no editor
  useEffect(() => {
    const map = leafletEditorRef.current;
    const layer = editorLayerRef.current;
    if (!map || !layer || !editorMapaRota) return;

    layer.clearLayers();

    // 1. Desenha Polyline
    if (coordsEditadas.length > 1) {
      L.polyline(coordsEditadas, {
        color: editorMapaRota.cor || '#19502f',
        weight: 5,
        opacity: 0.9,
      }).addTo(layer);
    }

    // 2. Marcadores nos pontos para permitir arraste e ajuste (Item 4.2)
    coordsEditadas.forEach((pt, index) => {
      const isFirst = index === 0;
      const isLast = index === coordsEditadas.length - 1;

      const markerHtml = `
        <div style="
          width: ${isFirst || isLast ? '24px' : '16px'};
          height: ${isFirst || isLast ? '24px' : '16px'};
          background: ${isFirst ? '#059669' : isLast ? '#dc2626' : editorMapaRota.cor || '#19502f'};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
          cursor: grab;
        ">
          ${isFirst ? 'S' : isLast ? 'F' : index + 1}
        </div>
      `;

      const icon = L.divIcon({
        className: 'route-coord-pin',
        html: markerHtml,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker(pt, { icon, draggable: true }).addTo(layer);

      // Evento de arrastar ponto (Item 4.2)
      marker.on('dragend', (e: any) => {
        const newPos = e.target.getLatLng();
        setCoordsEditadas((prev) => {
          const updated = [...prev];
          updated[index] = [newPos.lat, newPos.lng];
          return updated;
        });
      });
    });
  }, [coordsEditadas, editorMapaRota]);

  const handleSalvarTraçado = async () => {
    if (!editorMapaRota) return;
    try {
      await salvarRota({
        id: editorMapaRota.id,
        coordenadas: coordsEditadas,
      });
      alert('Traçado salvo com sucesso no mapa!');
      setEditorMapaRota(null);
      if (leafletEditorRef.current) {
        leafletEditorRef.current.remove();
        leafletEditorRef.current = null;
      }
      await onRefreshRotas();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar traçado.');
    }
  };

  const testarMotor = () => {
    if (!simTurma) return;
    const res = sugerirRota(
      {
        endereco: simEndereco,
        bairro: simBairro,
        turma: simTurma,
      },
      rotas
    );
    setSimResultado(res);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header de Rotas & Linhas */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <Bus className="w-5 h-5 text-[#19502f]" />
              Gestão de Linhas & Traçados de Rotas • U&M Parauapebas
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Configure capacidade de passageiros, horários de início/retorno, bairros e ruas atendidas, e edite o traçado de coordenadas no mapa interativo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSimuladorAberto(!simuladorAberto)}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#19502f] border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{simuladorAberto ? 'Fechar Teste' : 'Testar Sugestão de Linha'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRotaEditando({
                  codigo: `ADM0${rotas.length + 1}`,
                  nome: 'Nova Linha de Transporte',
                  turmas: ['Administrativo'],
                  horarioInicio: '04:30',
                  horarioRetorno: '17:00',
                  km: '20 km',
                  capacidade: 44,
                  cor: '#10b981',
                  ativa: true,
                  itinerario: '',
                  bairros: [],
                  ruas: [],
                });
                setModalAberto(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#19502f] hover:bg-[#0d2b19] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Linha</span>
            </button>
          </div>
        </div>

        {/* Simulador Interativo do Algoritmo */}
        {simuladorAberto && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60 mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Simulador do Motor de Correspondência U&M
              </span>
              <button
                type="button"
                onClick={() => setSimuladorAberto(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Turma / Setor</label>
                <select
                  value={simTurma}
                  onChange={(e) => setSimTurma(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white"
                >
                  <option value="Administrativo">Administrativo</option>
                  <option value="Retaludamento — Turma A">Retaludamento — Turma A</option>
                  <option value="Retaludamento — Turma B">Retaludamento — Turma B</option>
                  <option value="Retaludamento — Turma C">Retaludamento — Turma C</option>
                  <option value="Retaludamento — Turma D">Retaludamento — Turma D</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Bairro em Parauapebas</label>
                <input
                  type="text"
                  value={simBairro}
                  onChange={(e) => setSimBairro(e.target.value)}
                  placeholder="Ex: Betânia, Tropical, Cidade Jardim"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Endereço / Rua</label>
                <input
                  type="text"
                  value={simEndereco}
                  onChange={(e) => setSimEndereco(e.target.value)}
                  placeholder="Ex: Av. B, Rua Santa Catarina"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={testarMotor}
                  className="w-full py-2 rounded-xl bg-[#19502f] hover:bg-[#0d2b19] text-white font-bold transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Calcular Linha</span>
                </button>
              </div>
            </div>

            {simResultado && (
              <div className="mt-3 p-3 rounded-xl bg-white border border-emerald-300 text-xs">
                {simResultado.encontrada ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Linha Sugerida: <strong className="text-emerald-800">{simResultado.codigo || simResultado.label}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        Confiança {simResultado.confianca}
                      </span>
                    </div>
                    <p className="text-stone-600"><strong>Motivo:</strong> {simResultado.motivo}</p>
                    <p className="text-stone-500 text-[11px]">
                      Horário: <strong>{simResultado.horarioInicio || simResultado.horario}</strong> • Trajeto: <strong>{simResultado.km}</strong>
                    </p>
                  </div>
                ) : (
                  <p className="text-amber-800 font-medium">⚠️ {simResultado.motivo}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Abas de Turmas & Busca */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-stone-100 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setTurmaAtiva('Todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                turmaAtiva === 'Todas' ? 'bg-white text-[#19502f] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todas as Linhas ({rotas.length})
            </button>
            <button
              type="button"
              onClick={() => setTurmaAtiva('Administrativo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                turmaAtiva === 'Administrativo' ? 'bg-white text-[#19502f] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Administrativo
            </button>
            <button
              type="button"
              onClick={() => setTurmaAtiva('Turma A')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                turmaAtiva === 'Turma A' ? 'bg-white text-[#19502f] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Turma A
            </button>
            <button
              type="button"
              onClick={() => setTurmaAtiva('Turma B')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                turmaAtiva === 'Turma B' ? 'bg-white text-[#19502f] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Turma B
            </button>
            <button
              type="button"
              onClick={() => setTurmaAtiva('Turma C')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                turmaAtiva === 'Turma C' ? 'bg-white text-[#19502f] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Turma C
            </button>
            <button
              type="button"
              onClick={() => setTurmaAtiva('Turma D')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                turmaAtiva === 'Turma D' ? 'bg-white text-[#19502f] shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Turma D
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar por código, bairro ou rua..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#19502f] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Grid de Linhas Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rotasFiltradas.map((r) => {
          const paradas = listaItinerario(r.itinerario);
          const isExpandida = linhaExpandida === r.id;
          const passageiros = passageirosPorLinha[r.codigo] || passageirosPorLinha[r.id] || [];
          const capacidade = r.capacidade || 44;
          const vagasLivres = Math.max(0, capacidade - passageiros.length);
          const percentual = Math.round((passageiros.length / capacidade) * 100);

          return (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4 border-l-4"
              style={{ borderLeftColor: r.cor || '#19502f' }}
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm flex-none text-white shadow-xs"
                      style={{ backgroundColor: r.cor || '#19502f' }}
                    >
                      <Bus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-stone-900 leading-tight">
                        {r.codigo}
                      </h3>
                      <span className="text-xs font-semibold text-emerald-800">
                        {r.turmas?.join(', ') || r.turma || 'Geral'}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    r.ativa !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {r.ativa !== false ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                {/* Horários & Capacidade */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-100 text-xs">
                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/70">
                    <span className="text-stone-400 font-bold uppercase text-[9px] block">Horários</span>
                    <span className="font-bold text-stone-800 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      {r.horarioInicio || r.horario} {r.horarioRetorno ? `• ${r.horarioRetorno}` : ''}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/70">
                    <span className="text-stone-400 font-bold uppercase text-[9px] block">Ocupação / Vagas</span>
                    <span className="font-bold text-stone-800 flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3 text-emerald-600" />
                      {passageiros.length}/{capacidade} ({vagasLivres} livres)
                    </span>
                  </div>
                </div>

                {/* Bairros Atendidos */}
                {r.bairros && r.bairros.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                      Bairros:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {r.bairros.map((b, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md text-[10px] font-semibold">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Itinerário Resumido */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Itinerário:
                    </span>
                    <button
                      type="button"
                      onClick={() => setLinhaExpandida(isExpandida ? null : r.id)}
                      className="text-[#19502f] hover:underline font-bold text-[11px] flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{isExpandida ? 'Recolher' : 'Ver tudo'}</span>
                      {isExpandida ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className={`space-y-1 text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 ${
                    !isExpandida ? 'max-h-20 overflow-hidden' : 'max-h-60 overflow-y-auto'
                  }`}>
                    {paradas.slice(0, isExpandida ? undefined : 3).map((p, idx) => (
                      <div key={idx} className="flex items-start gap-1 text-[11px]">
                        <span className="text-[10px] font-mono text-emerald-700 font-bold flex-none">•</span>
                        <span className="leading-tight">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ações: Passageiros, Editar Traçado no Mapa, Editar, Excluir */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setModalPassageirosRota(r)}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#19502f] border border-emerald-200 font-bold flex items-center gap-1 cursor-pointer"
                  title="Ver lista de colaboradores alocados"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{passageiros.length} Passageiros</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAbrirEditorMapa(r)}
                    className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold flex items-center gap-1 cursor-pointer"
                    title="Editar traçado de coordenadas no mapa"
                  >
                    <Compass className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden sm:inline text-[11px]">Traçado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRotaEditando(r);
                      setModalAberto(true);
                    }}
                    className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-stone-900 cursor-pointer"
                    title="Editar dados da linha"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExcluir(r.id)}
                    className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 cursor-pointer"
                    title="Excluir ou desativar linha"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* 3. Modal de Criação / Edição de Linha (Item 4.2) */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Bus className="w-5 h-5 text-[#19502f]" />
                {rotaEditando?.id ? `Editar ${rotaEditando.codigo}` : 'Cadastrar Nova Linha'}
              </h3>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroModal && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-none" />
                <span>{erroModal}</span>
              </div>
            )}

            <form onSubmit={handleSalvarRota} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Código da Linha *</label>
                  <input
                    type="text"
                    required
                    value={rotaEditando?.codigo || ''}
                    onChange={(e) => setRotaEditando((prev) => ({ ...prev, codigo: e.target.value }))}
                    placeholder="Ex: ADM02, LINHA-06"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nome da Linha / Região *</label>
                  <input
                    type="text"
                    required
                    value={rotaEditando?.nome || ''}
                    onChange={(e) => setRotaEditando((prev) => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Palmares / Tropical / Betânia"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium"
                  />
                </div>
              </div>

              {/* Seleção de Turmas da Linha (com opção de criar nova linha/turma conforme foto) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Turmas que Utilizam Esta Linha:
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostraCriarNovaTurma((prev) => !prev)}
                    className="text-[11px] font-bold text-[#19502f] hover:text-[#124d31] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar Nova Linha / Turma</span>
                  </button>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {turmasOpcoes.map((t) => {
                      const turmasAtuais = rotaEditando?.turmas || (rotaEditando?.turma ? [rotaEditando.turma] : ['Administrativo']);
                      const isChecked = turmasAtuais.includes(t);

                      return (
                        <label key={t} className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-700 hover:text-stone-900">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const novasTurmas = e.target.checked
                                ? [...turmasAtuais, t]
                                : turmasAtuais.filter((item) => item !== t);
                              setRotaEditando((prev) => ({
                                ...prev,
                                turmas: novasTurmas.length > 0 ? novasTurmas : [t],
                                turma: novasTurmas[0] || t,
                              }));
                            }}
                            className="w-3.5 h-3.5 rounded text-[#19502f] accent-[#19502f]"
                          />
                          <span>{t}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Opção para criar nova linha / turma na caixa (conforme foto) */}
                  <div className="pt-2 border-t border-stone-200">
                    {!mostraCriarNovaTurma ? (
                      <button
                        type="button"
                        onClick={() => setMostraCriarNovaTurma(true)}
                        className="w-full py-2 px-3 rounded-lg border border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100/80 text-[#19502f] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Criar / Adicionar Nova Linha ou Turma nesta lista</span>
                      </button>
                    ) : (
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-300 space-y-2">
                        <label className="block text-[11px] font-bold text-emerald-900">
                          Nome da Nova Linha ou Turma:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            autoFocus
                            value={novaTurmaNome}
                            onChange={(e) => setNovaTurmaNome(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCriarNovaTurmaOuLinha();
                              }
                            }}
                            placeholder="Ex: Turno Noturno, LINHA-08, Turma E..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-400 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#19502f]"
                          />
                          <button
                            type="button"
                            onClick={handleCriarNovaTurmaOuLinha}
                            className="px-3.5 py-1.5 bg-[#19502f] hover:bg-[#0d2b19] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMostraCriarNovaTurma(false);
                              setNovaTurmaNome('');
                            }}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Horário de Início (Saída)</label>
                  <input
                    type="text"
                    value={rotaEditando?.horarioInicio || ''}
                    onChange={(e) => setRotaEditando((prev) => ({ ...prev, horarioInicio: e.target.value }))}
                    placeholder="Ex: 04:35"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Horário de Retorno</label>
                  <input
                    type="text"
                    value={rotaEditando?.horarioRetorno || ''}
                    onChange={(e) => setRotaEditando((prev) => ({ ...prev, horarioRetorno: e.target.value }))}
                    placeholder="Ex: 17:00"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Capacidade (Assentos) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={rotaEditando?.capacidade ?? 44}
                    onChange={(e) => setRotaEditando((prev) => ({ ...prev, capacidade: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Distância / KM</label>
                  <input
                    type="text"
                    value={rotaEditando?.km || ''}
                    onChange={(e) => setRotaEditando((prev) => ({ ...prev, km: e.target.value }))}
                    placeholder="Ex: 20.8 km"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Cor no Mapa</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={rotaEditando?.cor || '#19502f'}
                      onChange={(e) => setRotaEditando((prev) => ({ ...prev, cor: e.target.value }))}
                      className="w-10 h-9 p-0 rounded-lg cursor-pointer border border-stone-300"
                    />
                    <input
                      type="text"
                      value={rotaEditando?.cor || '#19502f'}
                      onChange={(e) => setRotaEditando((prev) => ({ ...prev, cor: e.target.value }))}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Bairros Atendidos (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={rotaEditando?.bairros?.join(', ') || ''}
                  onChange={(e) => setRotaEditando((prev) => ({
                    ...prev,
                    bairros: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  }))}
                  placeholder="Ex: Betânia, Tropical, Da Paz"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Ruas e Vias Atendidas (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={rotaEditando?.ruas?.join(', ') || ''}
                  onChange={(e) => setRotaEditando((prev) => ({
                    ...prev,
                    ruas: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  }))}
                  placeholder="Ex: Rua A, Av. B, Rua Santos Dumont"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Itinerário Completo
                </label>
                <textarea
                  rows={4}
                  value={rotaEditando?.itinerario || ''}
                  onChange={(e) => setRotaEditando((prev) => ({ ...prev, itinerario: e.target.value }))}
                  placeholder="ROTA INÍCIO NO BAIRRO..., PORTARIA PEBA"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rotaAtivaCheck"
                  checked={rotaEditando?.ativa !== false}
                  onChange={(e) => setRotaEditando((prev) => ({ ...prev, ativa: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#19502f] accent-[#19502f]"
                />
                <label htmlFor="rotaAtivaCheck" className="text-xs font-bold text-stone-700 cursor-pointer">
                  Linha operacional ativa (participa da sugestão automática e do mapa)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 rounded-xl bg-[#19502f] hover:bg-[#0d2b19] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {salvando ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{salvando ? 'Salvando...' : 'Salvar Linha'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal de Passageiros da Linha */}
      {modalPassageirosRota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#19502f]" />
                  Passageiros Alocados: {modalPassageirosRota.codigo}
                </h3>
                <p className="text-xs text-stone-500">
                  Capacidade: {modalPassageirosRota.capacidade || 44} vagas • Turmas: {modalPassageirosRota.turmas?.join(', ') || modalPassageirosRota.turma}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalPassageirosRota(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const passageiros = passageirosPorLinha[modalPassageirosRota.codigo] || passageirosPorLinha[modalPassageirosRota.id] || [];
              if (passageiros.length === 0) {
                return (
                  <div className="py-8 text-center text-stone-400 text-xs">
                    Nenhum colaborador alocado nesta linha até o momento.
                  </div>
                );
              }
              return (
                <div className="divide-y divide-stone-100">
                  {passageiros.map((p, idx) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-stone-400 font-bold text-[10px] w-4">{idx + 1}.</span>
                        <div className="min-w-0">
                          <span className="font-bold text-stone-900 block truncate">{p.nome}</span>
                          <span className="text-[11px] text-stone-500 block truncate">
                            Matrícula: {p.matricula} • {p.bairro}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-none">
                        <span className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 block truncate max-w-[180px]">
                          {p.ponto || 'Ponto RH'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModalPassageirosRota(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal de Editor de Traçado no Mapa (Item 4.2) */}
      {editorMapaRota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 shadow-2xl border border-stone-200 flex flex-col h-[85vh] justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#19502f]" />
                  Editor de Traçado no Mapa • Linha {editorMapaRota.codigo}
                </h3>
                <p className="text-xs text-stone-500">
                  Clique no mapa para adicionar pontos da rota. Arraste os pinos para ajustar as ruas. ({coordsEditadas.length} pontos no traçado)
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditorMapaRota(null);
                  if (leafletEditorRef.current) {
                    leafletEditorRef.current.remove();
                    leafletEditorRef.current = null;
                  }
                }}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Container do Mapa Leaflet */}
            <div
              ref={mapEditorRef}
              className="w-full flex-1 rounded-2xl border border-stone-300 overflow-hidden relative shadow-inner"
            />

            {/* Ações do Traçado */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (coordsEditadas.length > 1) {
                      setCoordsEditadas((prev) => prev.slice(0, -1));
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Desfazer Último Ponto
                </button>

                <button
                  type="button"
                  onClick={() => setCoordsEditadas(editorMapaRota.coordenadas || [])}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Restaurar Original
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditorMapaRota(null);
                    if (leafletEditorRef.current) {
                      leafletEditorRef.current.remove();
                      leafletEditorRef.current = null;
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSalvarTraçado}
                  className="px-5 py-2 rounded-xl bg-[#19502f] hover:bg-[#0d2b19] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Traçado ({coordsEditadas.length} pontos)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
