import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Bus,
  Users,
  Navigation,
  Sparkles,
  Phone,
  Search,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  ZoomIn,
  RefreshCw,
  Crosshair,
  Save,
  X,
  AlertCircle,
  Flag,
} from 'lucide-react';
import { ColaboradorCadastro, RotaLinha } from '../../types';
import { BAIRROS_PARAUAPEBAS, obterCoordenadasBairro } from '../../constants';
import { atualizarCadastro } from '../../services/api';

interface AdminMapaParauapebasProps {
  cadastros: ColaboradorCadastro[];
  rotas?: RotaLinha[];
  colaboradorInicial?: ColaboradorCadastro | null;
  onSelecionarColaborador?: (c: ColaboradorCadastro) => void;
  onRefresh?: () => Promise<void>;
}

// Coordenadas da Portaria Peba (Destino comum de todas as rotas)
const PORTARIA_PEBA: [number, number] = [-6.0592, -49.8820];

export const AdminMapaParauapebas: React.FC<AdminMapaParauapebasProps> = ({
  cadastros = [],
  rotas = [],
  colaboradorInicial = null,
  onSelecionarColaborador,
  onRefresh,
}) => {
  const [tipoMapa, setTipoMapa] = useState<'real' | 'esquematico'>('real');
  const [rotaFiltro, setRotaFiltro] = useState<string>('');
  const [bairroFiltro, setBairroFiltro] = useState<string>('');
  const [colabSelecionado, setColabSelecionado] = useState<ColaboradorCadastro | null>(colaboradorInicial);
  const [animacaoSaltando, setAnimacaoSaltando] = useState<boolean>(true);
  const [buscaTexto, setBuscaTexto] = useState<string>('');

  // Modo Interativo de Definição de Ponto de Embarque
  const [modoDefinirPonto, setModoDefinirPonto] = useState<boolean>(false);
  const [pontoTemp, setPontoTemp] = useState<{ lat: number; lng: number } | null>(null);
  const [descricaoPonto, setDescricaoPonto] = useState<string>('');
  const [salvandoPonto, setSalvandoPonto] = useState<boolean>(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  // Sincroniza seleção inicial externa
  useEffect(() => {
    if (colaboradorInicial) {
      setColabSelecionado(colaboradorInicial);
    }
  }, [colaboradorInicial]);

  // Filtragem dos colaboradores ativos
  const colaboradoresMapeados = useMemo(() => {
    return cadastros.filter((c) => {
      if (!c) return false;
      if (c.status === 'Inativo') return false;
      if (rotaFiltro && (c.linhaId !== rotaFiltro && c.onibus !== rotaFiltro)) return false;
      
      const bStr = (c.bairro || '').toLowerCase();
      if (bairroFiltro && !bStr.includes(bairroFiltro.toLowerCase())) return false;
      
      if (buscaTexto.trim()) {
        const q = buscaTexto.trim().toLowerCase();
        const nome = (c.nome || '').toLowerCase();
        const mat = (c.matricula || '').toLowerCase();
        const ponto = (c.ponto || '').toLowerCase();
        return nome.includes(q) || mat.includes(q) || bStr.includes(q) || ponto.includes(q);
      }
      return true;
    });
  }, [cadastros, rotaFiltro, bairroFiltro, buscaTexto]);

  // Lista de códigos de linhas para filtro
  const linhasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    rotas.forEach((r) => set.add(r.codigo || r.id));
    cadastros.forEach((c) => {
      if (c && (c.linhaId || c.onibus)) set.add(c.linhaId || c.onibus || '');
    });
    return Array.from(set).filter(Boolean).sort();
  }, [rotas, cadastros]);

  // Contagem por Bairro
  const contagemPorBairro = useMemo(() => {
    const map: Record<string, number> = {};
    cadastros.forEach((c) => {
      if (c && c.status !== 'Inativo') {
        const b = (c.bairro || 'Outros').trim();
        map[b] = (map[b] || 0) + 1;
      }
    });
    return map;
  }, [cadastros]);

  // Calcula coordenadas reais e de dispersão para colaboradores
  const colaboradoresComPosicao = useMemo(() => {
    const contadoresBairro: Record<string, number> = {};

    return colaboradoresMapeados.map((c) => {
      // Prioridade 1: Coordenadas reais salvas pelo RH no ponto de embarque
      if (c.pontoEmbarque && c.pontoEmbarque.lat && c.pontoEmbarque.lng) {
        return {
          ...c,
          lat: c.pontoEmbarque.lat,
          lng: c.pontoEmbarque.lng,
          isPontoReal: true,
          posX: 50,
          posY: 50,
        };
      }

      // Prioridade 2: Bairro estimado com leve dispersão
      const coord = obterCoordenadasBairro(c.bairro);
      const chaveBairro = coord.nome;
      const idx = contadoresBairro[chaveBairro] || 0;
      contadoresBairro[chaveBairro] = idx + 1;

      const angulo = idx * 1.35;
      const raioGeo = idx === 0 ? 0 : 0.0015 + idx * 0.001;
      const latOffset = Math.sin(angulo) * raioGeo;
      const lngOffset = Math.cos(angulo) * raioGeo;

      const raioEsquematico = idx === 0 ? 0 : 3.5 + idx * 1.5;
      const posX = Math.max(10, Math.min(90, coord.x + Math.cos(angulo) * raioEsquematico));
      const posY = Math.max(15, Math.min(85, coord.y + Math.sin(angulo) * raioEsquematico));

      return {
        ...c,
        lat: coord.lat + latOffset,
        lng: coord.lng + lngOffset,
        isPontoReal: false,
        posX,
        posY,
      };
    });
  }, [colaboradoresMapeados]);

  // Salvar Ponto de Embarque Interativo (Item 4.4)
  const handleSalvarPontoEmbarque = async () => {
    if (!colabSelecionado || !pontoTemp || !descricaoPonto.trim()) {
      alert('Informe a descrição do ponto de embarque antes de salvar.');
      return;
    }

    setSalvandoPonto(true);
    try {
      await atualizarCadastro(colabSelecionado.id, {
        pontoEmbarque: {
          lat: pontoTemp.lat,
          lng: pontoTemp.lng,
          descricao: descricaoPonto.trim(),
        },
        ponto: descricaoPonto.trim(),
        status: 'Rota definida',
      });

      setSucessoMsg(`Ponto de embarque de ${colabSelecionado.nome} salvo com sucesso!`);
      setTimeout(() => setSucessoMsg(null), 4000);
      setModoDefinirPonto(false);
      setPontoTemp(null);
      setDescricaoPonto('');
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar ponto de embarque.');
    } finally {
      setSalvandoPonto(false);
    }
  };

  // Inicialização do Mapa Leaflet
  useEffect(() => {
    if (tipoMapa !== 'real' || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-6.0674, -49.9044],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | U&M Transporte',
        maxZoom: 18,
      }).addTo(map);

      // Camadas
      const routesLayer = L.layerGroup().addTo(map);
      const markersLayer = L.layerGroup().addTo(map);
      routesLayerRef.current = routesLayer;
      markersLayerRef.current = markersLayer;
      leafletMapRef.current = map;

      // Evento de clique para posicionar ponto interativo
      map.on('click', (e: L.LeafletMouseEvent) => {
        // Se estiver no modo de definir ponto, captura as coordenadas
        setPontoTemp({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }
  }, [tipoMapa]);

  // Atualização das Linhas (Polylines) e Marcadores de Colaboradores
  useEffect(() => {
    const map = leafletMapRef.current;
    const routesLayer = routesLayerRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !routesLayer || !markersLayer || tipoMapa !== 'real') return;

    // 1. Limpa camadas
    routesLayer.clearLayers();
    markersLayer.clearLayers();

    // 2. Desenha TODAS AS LINHAS com suas cores oficiais (Item 4.4)
    rotas.forEach((r) => {
      if (r.coordenadas && r.coordenadas.length > 1) {
        const poly = L.polyline(r.coordenadas, {
          color: r.cor || '#1b6e47',
          weight: 4,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(routesLayer);

        const itinerarioResumido = r.itinerario
          ? r.itinerario.split(',').slice(0, 4).join(', ')
          : '';

        poly.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-weight: 900; font-size: 13px; color: ${r.cor || '#1b6e47'};">${r.codigo}</span>
              <span style="font-size: 10px; background: #ecfdf5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${r.turmas?.join('/') || r.turma || ''}</span>
            </div>
            <div style="font-size: 11px; color: #374151; margin-top: 4px;">
              <strong>Horário:</strong> ${r.horarioInicio || r.horario} ${r.horarioRetorno ? `• Retorno: ${r.horarioRetorno}` : ''}<br/>
              <strong>Distância:</strong> ${r.km}<br/>
              <strong>Capacidade:</strong> ${r.capacidade || 44} passageiros
            </div>
            <div style="font-size: 10px; color: #6b7280; margin-top: 4px; border-top: 1px solid #e5e7eb; padding-top: 4px;">
              ${itinerarioResumido}...
            </div>
          </div>
        `);
      }
    });

    // 3. Marcador Destino Comum: Portaria Peba
    const portariaHtml = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="background: #1b6e47; color: #ffffff; font-weight: 900; font-size: 10px; padding: 2px 6px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap; margin-bottom: 2px;">
          ★ Portaria Peba (Destino)
        </div>
        <div style="width: 26px; height: 26px; border-radius: 50%; background: #047857; border: 3px solid #ffffff; display: flex; items-center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
          <span style="font-size: 13px; color: #fff;">🏭</span>
        </div>
      </div>
    `;
    const portariaIcon = L.divIcon({
      className: 'portaria-marker',
      html: portariaHtml,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
    L.marker(PORTARIA_PEBA, { icon: portariaIcon })
      .addTo(routesLayer)
      .bindPopup('<b>Portaria Peba U&M</b><br/>Destino operacional de todas as linhas de transporte.');

    // 4. Marcadores dos Colaboradores com BONECO (Item 4.4)
    colaboradoresComPosicao.forEach((colab) => {
      const isSelected = colabSelecionado?.id === colab.id;
      const primeiroNome = (colab.nome || 'Colaborador').split(' ')[0];
      const linhaCurta = colab.linhaId || colab.onibus || 'Sem rota';
      const bounceClass = animacaoSaltando ? 'animate-bounce' : '';

      // Ícone BONECO SVG (Pessoa) com balão de nome
      const bonecoSvg = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <!-- Balão com Nome Saltando -->
          <div class="${bounceClass}" style="
            position: absolute;
            bottom: 38px;
            white-space: nowrap;
            background: ${isSelected ? '#fbbf24' : '#ffffff'};
            color: ${isSelected ? '#000000' : '#1f2937'};
            font-size: 11px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            border: 2px solid ${isSelected ? '#d97706' : '#10b981'};
            display: flex;
            align-items: center;
            gap: 4px;
            z-index: 100;
          ">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #059669;"></span>
            <span>${primeiroNome}</span>
            <span style="font-size: 9px; background: #065f46; color: #ffffff; padding: 1px 4px; border-radius: 4px;">${linhaCurta}</span>
          </div>

          <!-- Boneco de Pessoa SVG (Item 4.4) -->
          <div style="
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: ${isSelected ? '#fde047' : colab.isPontoReal ? '#10b981' : '#64748b'};
            border: 3px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#78350f' : '#ffffff'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div style="
            width: 0; 
            height: 0; 
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid ${isSelected ? '#d97706' : colab.isPontoReal ? '#10b981' : '#64748b'};
            margin-top: -2px;
          "></div>
        </div>
      `;

      const bonecoIcon = L.divIcon({
        className: 'custom-boneco-marker',
        html: bonecoSvg,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const marker = L.marker([colab.lat, colab.lng], { icon: bonecoIcon }).addTo(markersLayer);

      const statusDesc = colab.isPontoReal
        ? `📍 Ponto Definido: <strong>${colab.pontoEmbarque?.descricao || colab.ponto}</strong>`
        : `⚠️ <em>Ponto em definição pelo RH</em> (Bairro: ${colab.bairro})`;

      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; min-width: 200px;">
          <h4 style="font-weight: 800; font-size: 13px; color: #111827; margin: 0;">${colab.nome}</h4>
          <p style="font-size: 11px; color: #4b5563; margin: 2px 0 6px 0;">Matrícula: ${colab.matricula} • ${colab.turma}</p>
          <div style="font-size: 11px; color: #1f2937; background: #f3f4f6; padding: 6px; border-radius: 6px;">
            ${statusDesc}<br/>
            <strong>Linha:</strong> ${colab.linhaId || colab.onibus || 'A definir'}
          </div>
        </div>
      `);

      marker.on('click', () => {
        setColabSelecionado(colab);
        onSelecionarColaborador?.(colab);
        map.flyTo([colab.lat, colab.lng], 15, { duration: 1 });
      });
    });

    // 5. Marcador Temporário de posicionamento se modo interativo ativo
    if (pontoTemp) {
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
      }

      const tempHtml = `
        <div style="display: flex; flex-direction: column; align-items: center;" class="animate-bounce">
          <div style="background: #dc2626; color: #ffffff; font-weight: 900; font-size: 10px; padding: 2px 6px; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.4); white-space: nowrap;">
            📍 Novo Ponto Escolhido
          </div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #dc2626; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: #fff;">
            ✓
          </div>
        </div>
      `;
      const tempIcon = L.divIcon({
        className: 'temp-pin',
        html: tempHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      tempMarkerRef.current = L.marker([pontoTemp.lat, pontoTemp.lng], { icon: tempIcon }).addTo(markersLayer);
    } else if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }
  }, [tipoMapa, rotas, colaboradoresComPosicao, animacaoSaltando, colabSelecionado, pontoTemp, onSelecionarColaborador]);

  // Função para centralizar em Parauapebas
  const handleResetView = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([-6.0674, -49.9044], 13, { duration: 1 });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header do Mapa com Controles */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping inline-block" />
              <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#1b6e47]" />
                Mapa de Parauapebas • Rotas e Pontos de Embarque
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Todas as 12 linhas traçadas com suas respectivas cores, ícones de boneco para os colaboradores e ferramenta interativa para o RH definir pontos exatos de embarque.
            </p>
          </div>

          {/* Seletor de Tipo de Mapa e Animação */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setTipoMapa('real')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  tipoMapa === 'real'
                    ? 'bg-white text-[#1b6e47] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Mapa Geográfico Real</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoMapa('esquematico')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  tipoMapa === 'esquematico'
                    ? 'bg-white text-[#1b6e47] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Mapa Esquemático</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAnimacaoSaltando(!animacaoSaltando)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                animacaoSaltando
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{animacaoSaltando ? 'Nomes Saltando' : 'Nomes Estáticos'}</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              placeholder="Buscar colaborador, matrícula ou ponto..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
            />
          </div>

          <div>
            <select
              value={rotaFiltro}
              onChange={(e) => setRotaFiltro(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white"
            >
              <option value="">Todas as Linhas ({linhasDisponiveis.length})</option>
              {linhasDisponiveis.map((r) => (
                <option key={r} value={r}>Linha {r}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={bairroFiltro}
              onChange={(e) => setBairroFiltro(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white"
            >
              <option value="">Todos os Bairros de Parauapebas</option>
              {Object.keys(BAIRROS_PARAUAPEBAS).map((b) => (
                <option key={b} value={b}>
                  {b} ({contagemPorBairro[b] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Banner de Aviso de Modo Interativo de Posicionamento */}
        {modoDefinirPonto && colabSelecionado && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500 text-white shadow-lg animate-in fade-in duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Crosshair className="w-5 h-5 text-white animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-black">
                  Clique no mapa no local exato do ponto de embarque de {colabSelecionado.nome}
                </h4>
                <p className="text-xs text-amber-100">
                  {pontoTemp
                    ? `Coordenadas capturadas: [${pontoTemp.lat.toFixed(4)}, ${pontoTemp.lng.toFixed(4)}]. Preencha a descrição no painel lateral.`
                    : 'Toque em qualquer rua ou esquina do mapa para fixar o ponto de embarque.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setModoDefinirPonto(false);
                setPontoTemp(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        {sucessoMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-none" />
            <span>{sucessoMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Container do Mapa + Painel de Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Container do Mapa */}
        <div className="lg:col-span-2 bg-stone-900 rounded-3xl border-2 border-stone-300 shadow-xl overflow-hidden relative min-h-[600px] flex flex-col justify-between">
          
          {/* Badge Top Left: Parauapebas PA */}
          <div className="absolute top-4 left-4 z-[500] bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-white text-xs space-y-0.5 shadow-lg">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Parauapebas (PA) • Frota U&M</span>
            </div>
            <div className="text-[10px] text-stone-300 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Portaria Peba
              </span>
              <span>•</span>
              <span className="text-emerald-300 font-semibold">{colaboradoresMapeados.length} colaboradores</span>
            </div>
          </div>

          {/* Botão de Centralizar Parauapebas */}
          {tipoMapa === 'real' && (
            <button
              type="button"
              onClick={handleResetView}
              className="absolute top-4 right-4 z-[500] bg-white/95 hover:bg-white text-stone-800 px-3 py-2 rounded-xl text-xs font-bold shadow-lg border border-stone-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Centralizar mapa em Parauapebas"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#1b6e47]" />
              <span>Recentrar</span>
            </button>
          )}

          {/* MODO 1: MAPA GEOGRÁFICO REAL VIA LEAFLET */}
          <div
            ref={mapContainerRef}
            className={`w-full h-full min-h-[600px] ${tipoMapa === 'real' ? 'block' : 'hidden'}`}
            style={{ zIndex: 1 }}
          />

          {/* MODO 2: MAPA ESQUEMÁTICO */}
          {tipoMapa === 'esquematico' && (
            <div className="relative w-full h-full min-h-[600px] bg-[#1b2b22] select-none flex flex-col justify-between">
              {/* SVG Elements */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                <path d="M 50,0 Q 65,150 55,300 T 70,580" fill="none" stroke="#38bdf8" strokeWidth="12" />
                <path d="M 0,280 Q 250,260 500,280 T 800,320" fill="none" stroke="#64748b" strokeWidth="6" strokeDasharray="8 6" />
              </svg>

              {/* Rótulos dos Bairros */}
              <div className="absolute inset-0 pointer-events-none">
                {Object.entries(BAIRROS_PARAUAPEBAS).map(([chave, b]) => {
                  const qtd = contagemPorBairro[chave] || 0;
                  return (
                    <div
                      key={chave}
                      style={{ left: `${b.x}%`, top: `${b.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                    >
                      <span className="text-[11px] font-black uppercase tracking-wider text-white/70 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs whitespace-nowrap shadow-xs">
                        {b.nome}
                        {qtd > 0 && <span className="ml-1 text-emerald-400 font-bold">({qtd})</span>}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Marcadores dos Colaboradores no Mapa Esquemático */}
              <div className="absolute inset-0">
                {colaboradoresComPosicao.map((c) => {
                  const isSelected = colabSelecionado?.id === c.id;
                  const primeiroNome = (c.nome || '').split(' ')[0];

                  return (
                    <div
                      key={c.id}
                      style={{ left: `${c.posX}%`, top: `${c.posY}%` }}
                      onClick={() => {
                        setColabSelecionado(c);
                        onSelecionarColaborador?.(c);
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-300 ${
                        isSelected ? 'scale-125 z-40' : 'hover:scale-115'
                      }`}
                    >
                      <div
                        className={`absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-lg text-[10px] font-black shadow-lg flex items-center gap-1 border ${
                          animacaoSaltando ? 'animate-bounce' : ''
                        } ${
                          isSelected ? 'bg-amber-400 text-black border-white' : 'bg-white text-stone-900 border-stone-200'
                        }`}
                      >
                        <span>{primeiroNome}</span>
                      </div>

                      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-md ${
                        isSelected ? 'border-amber-400 bg-amber-100 ring-4 ring-amber-400/50' : 'border-white bg-[#1b6e47] text-white'
                      }`}>
                        {c.nome.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* 3. Painel Lateral: Inspeção & Definição do Ponto de Embarque */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <div className="p-2 rounded-xl bg-emerald-100 text-[#1b6e47]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Ponto de Embarque no Mapa</h3>
                <p className="text-[11px] text-stone-500">Definição interativa e inspeção da frota</p>
              </div>
            </div>

            {colabSelecionado ? (
              <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                {/* Colaborador Card */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <div className="w-12 h-12 rounded-full border border-stone-200 bg-[#1b6e47] text-white flex items-center justify-center font-bold text-sm overflow-hidden flex-none">
                    {colabSelecionado.foto ? (
                      <img src={colabSelecionado.foto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(colabSelecionado.nome || 'UM').slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-stone-900 text-sm truncate">{colabSelecionado.nome}</h4>
                    <p className="text-xs text-stone-500 font-mono">Matrícula: {colabSelecionado.matricula}</p>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      {colabSelecionado.turma}
                    </span>
                  </div>
                </div>

                {/* Detalhes de Endereço */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">
                      Bairro em Parauapebas:
                    </span>
                    <span className="text-stone-800 font-bold text-sm">
                      📍 {colabSelecionado.bairro || 'Parauapebas'}
                    </span>
                    <span className="text-stone-600 block text-[11px]">
                      {colabSelecionado.endereco}
                    </span>
                  </div>

                  {/* Ponto de Embarque Atual */}
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] block">
                      Ponto de Embarque Definido pelo RH:
                    </span>
                    {colabSelecionado.pontoEmbarque ? (
                      <div className="mt-1">
                        <span className="font-bold text-emerald-950 block text-xs">
                          {colabSelecionado.pontoEmbarque.descricao}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono block mt-0.5">
                          Coord: [{colabSelecionado.pontoEmbarque.lat.toFixed(4)}, {colabSelecionado.pontoEmbarque.lng.toFixed(4)}]
                        </span>
                      </div>
                    ) : colabSelecionado.ponto ? (
                      <span className="font-semibold text-stone-800 block text-xs mt-1">
                        {colabSelecionado.ponto}
                      </span>
                    ) : (
                      <span className="text-amber-700 italic block text-xs mt-1">
                        ⚠️ Ponto ainda não definido pelo RH no mapa
                      </span>
                    )}
                  </div>

                  {/* Linha de Transporte */}
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5 text-emerald-700" /> Linha Designada:
                    </span>
                    <span className="font-black text-sm text-emerald-950 block mt-0.5">
                      {colabSelecionado.linhaId || colabSelecionado.onibus || 'Aguardando designação'}
                    </span>
                  </div>
                </div>

                {/* FORMULÁRIO DE DEFINIÇÃO INTERATIVA DO PONTO (Item 4.4) */}
                {modoDefinirPonto ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                        <Crosshair className="w-4 h-4 text-amber-700 animate-pulse" />
                        Definir Ponto no Mapa
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setModoDefinirPonto(false);
                          setPontoTemp(null);
                        }}
                        className="text-stone-400 hover:text-stone-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[11px] text-amber-800">
                      {pontoTemp
                        ? `✓ Ponto clicado no mapa [${pontoTemp.lat.toFixed(4)}, ${pontoTemp.lng.toFixed(4)}].`
                        : '1. Clique no mapa de Parauapebas no local desejado.'}
                    </p>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-700 uppercase mb-1">
                        2. Descrição do Ponto de Embarque *
                      </label>
                      <input
                        type="text"
                        value={descricaoPonto}
                        onChange={(e) => setDescricaoPonto(e.target.value)}
                        placeholder="Ex: Em frente ao Mercadinho Silva, esquina com Av. D"
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={salvandoPonto || !pontoTemp || !descricaoPonto.trim()}
                        onClick={handleSalvarPontoEmbarque}
                        className="w-full py-2 rounded-xl bg-[#1b6e47] hover:bg-[#155a3a] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{salvandoPonto ? 'Salvando...' : 'Salvar Ponto de Embarque'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModoDefinirPonto(true);
                        setDescricaoPonto(colabSelecionado.pontoEmbarque?.descricao || colabSelecionado.ponto || '');
                        if (colabSelecionado.pontoEmbarque) {
                          setPontoTemp({ lat: colabSelecionado.pontoEmbarque.lat, lng: colabSelecionado.pontoEmbarque.lng });
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#1b6e47] hover:bg-[#155a3a] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Crosshair className="w-4 h-4" />
                      <span>Definir / Ajustar Ponto no Mapa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (tipoMapa === 'real' && leafletMapRef.current) {
                          const lat = colabSelecionado.pontoEmbarque?.lat || obterCoordenadasBairro(colabSelecionado.bairro).lat;
                          const lng = colabSelecionado.pontoEmbarque?.lng || obterCoordenadasBairro(colabSelecionado.bairro).lng;
                          leafletMapRef.current.flyTo([lat, lng], 16, { duration: 1 });
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Aproximar no Mapa</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-stone-400 space-y-2">
                <MapPin className="w-10 h-10 mx-auto text-stone-300 animate-bounce" />
                <p className="text-xs font-medium text-stone-600">
                  Nenhum colaborador selecionado.
                </p>
                <p className="text-[11px] text-stone-400">
                  Clique sobre qualquer boneco no mapa ou pesquise acima para inspecionar ou posicionar seu ponto de embarque.
                </p>
              </div>
            )}
          </div>

          {/* Legenda de Cores das Linhas */}
          <div className="pt-3 border-t border-stone-100 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Legenda das Linhas U&M
            </span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {rotas.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ backgroundColor: r.cor || '#1b6e47' }} />
                  <span className="font-bold text-stone-700 truncate">{r.codigo}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
