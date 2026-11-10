import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { X, MapPin, Bus, Navigation, Layers, Compass, User, AlertCircle, Info } from 'lucide-react';
import { ColaboradorCadastro, RotaLinha } from '../types';
import { PORTARIA_PEBA } from '../utils/motorRotas';
import { obterCoordenadasBairro } from '../constants';

interface MapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaborador: ColaboradorCadastro | null;
  rotas: RotaLinha[];
}

export const MapaModal: React.FC<MapaModalProps> = ({
  isOpen,
  onClose,
  colaborador,
  rotas = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const linesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [filtroModo, setFiltroModo] = useState<'soMinha' | 'todas'>('soMinha');

  useEffect(() => {
    if (!isOpen || !colaborador || !mapContainerRef.current) return;

    // Destroi mapa anterior se houver
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Calcula coordenadas do ponto de embarque ou endereço
    let embarqueLat = colaborador.pontoEmbarque?.lat;
    let embarqueLng = colaborador.pontoEmbarque?.lng;
    const temPontoDefinido = Boolean(embarqueLat && embarqueLng);

    if (!embarqueLat || !embarqueLng) {
      const coordBairro = obterCoordenadasBairro(colaborador.bairro);
      embarqueLat = coordBairro.lat;
      embarqueLng = coordBairro.lng;
    }

    const map = L.map(mapContainerRef.current, {
      center: [embarqueLat, embarqueLng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap | U&M Transporte Parauapebas',
      maxZoom: 18,
    }).addTo(map);

    linesLayerGroupRef.current = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = L.layerGroup().addTo(map);

    // Identifica a linha do colaborador
    const colabLinhaCodigo = colaborador.onibus?.trim() || colaborador.linhaId?.trim() || '';
    const colabRota = rotas.find(
      (r) => r.id === colaborador.linhaId || r.codigo === colabLinhaCodigo || (colabLinhaCodigo && r.nome.includes(colabLinhaCodigo))
    );

    // Desenha as Linhas
    rotas.forEach((r) => {
      if (!r.coordenadas || r.coordenadas.length < 2) return;

      const isMinhaLinha = colabRota ? r.id === colabRota.id : false;

      // Se filtro "Só minha linha" ativo e não for a minha linha, pula
      if (filtroModo === 'soMinha' && !isMinhaLinha) return;

      // A linha do colaborador fica em VERMELHO, grossa e destacada (Item 2.2). As demais finas e cinza claro.
      const polyline = L.polyline(r.coordenadas, {
        color: isMinhaLinha ? '#dc2626' : '#9ca3af',
        weight: isMinhaLinha ? 6 : 2.5,
        opacity: isMinhaLinha ? 0.95 : 0.5,
        dashArray: isMinhaLinha ? undefined : '5, 5',
      }).addTo(linesLayerGroupRef.current!);

      // Popup ao clicar na linha
      polyline.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="background: ${isMinhaLinha ? '#dc2626' : '#19502f'}; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">
              ${r.codigo}
            </span>
            <strong style="font-size: 13px; color: #111;">${r.nome}</strong>
          </div>
          <p style="margin: 3px 0; color: #555;"><strong>Horário Início:</strong> ${r.horarioInicio} ${r.horarioRetorno ? '• Retorno: ' + r.horarioRetorno : ''}</p>
          <p style="margin: 3px 0; color: #555;"><strong>Extensão:</strong> ${r.km}</p>
          <p style="margin: 3px 0; color: #444; font-size: 11px;"><strong>Itinerário:</strong> ${r.itinerario}</p>
          ${isMinhaLinha ? '<p style="margin-top: 6px; font-weight: bold; color: #dc2626;">⭐ Sua Linha de Ônibus</p>' : ''}
        </div>
      `);
    });

    // Marcador de Destino Comum: PORTARIA PEBA (Item 2.2)
    const portariaIcon = L.divIcon({
      className: 'custom-portaria-marker',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="background: #111827; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px; white-space: nowrap; margin-bottom: 2px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
            🏁 Portaria Peba (Destino)
          </div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #111827; border: 2px solid #fff; display: flex; items-align: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin: auto;"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m14 8 3 3-3 3"/></svg>
          </div>
        </div>
      `,
      iconSize: [32, 44],
      iconAnchor: [16, 44],
    });

    L.marker(PORTARIA_PEBA, { icon: portariaIcon })
      .addTo(markersLayerGroupRef.current!)
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px;">
          <strong style="color: #111827; font-size: 13px;">Portaria Parauapebas</strong><br/>
          <span>Destino final unificado de todas as rotas operacionais da U&M.</span>
        </div>
      `);

    // Ícone de pessoa (boneco, SVG próprio) no ponto de embarque do colaborador (Item 2.3)
    const bonecoSvg = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" stroke="#19502f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="7" r="4"/>
        <path d="M5.5 21v-2a7 7 0 0 1 13 0v2"/>
      </svg>
    `;

    const bonecoHtml = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div class="animate-bounce" style="
          position: absolute;
          bottom: 42px;
          white-space: nowrap;
          background: ${temPontoDefinido ? '#19502f' : '#d97706'};
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>${temPontoDefinido ? 'Seu Ponto de Embarque' : 'Ponto em definição pelo RH'}</span>
        </div>
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${temPontoDefinido ? '#19502f' : '#d97706'};
          border: 3px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${bonecoSvg}
        </div>
        <div style="
          width: 0; 
          height: 0; 
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 9px solid ${temPontoDefinido ? '#19502f' : '#d97706'};
          margin-top: -2px;
        "></div>
      </div>
    `;

    const bonecoIcon = L.divIcon({
      className: 'custom-boneco-marker',
      html: bonecoHtml,
      iconSize: [44, 48],
      iconAnchor: [22, 48],
    });

    const popupTexto = temPontoDefinido
      ? `
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.5;">
          <strong style="color: #19502f; font-size: 13px;">Seu ponto de embarque</strong><br/>
          <strong>Linha:</strong> <span style="background: #19502f; color: #fff; padding: 1px 6px; border-radius: 4px; font-weight: bold;">${colabRota ? colabRota.codigo : (colaborador.onibus || 'Em definição')}</span><br/>
          <strong>Ponto:</strong> ${colaborador.pontoEmbarque?.descricao || colaborador.ponto}<br/>
          <span style="color: #4b5563;">Passe às ~${colabRota ? colabRota.horarioInicio : '04:30'}</span>
        </div>
      `
      : `
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.5;">
          <strong style="color: #d97706; font-size: 13px;">Ponto em definição pelo RH</strong><br/>
          <span>Endereço cadastrado: ${colaborador.endereco} - ${colaborador.bairro}</span><br/>
          <span style="color: #6b7280; font-size: 11px;">O RH definirá o ponto de embarque oficial próximo à sua residência.</span>
        </div>
      `;

    L.marker([embarqueLat, embarqueLng], { icon: bonecoIcon })
      .addTo(markersLayerGroupRef.current!)
      .bindPopup(popupTexto)
      .openPopup();

    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, colaborador, rotas, filtroModo]);

  if (!isOpen || !colaborador) return null;

  const colabLinhaCodigo = colaborador.onibus?.trim() || colaborador.linhaId?.trim() || '';
  const colabRota = rotas.find(
    (r) => r.id === colaborador.linhaId || r.codigo === colabLinhaCodigo || (colabLinhaCodigo && r.nome.includes(colabLinhaCodigo))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header do Modal */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#19502f] flex items-center justify-center font-bold flex-none">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base leading-tight flex items-center gap-2">
                <span>Mapa de Transporte de Parauapebas</span>
                {colabRota && (
                  <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md">
                    Linha {colabRota.codigo}
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-500">
                Itinerários oficiais • Destino comum: Portaria Peba
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtros e Legenda do Mapa */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Toggle de Visualização: Mostrar só minha linha / Mostrar todas */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setFiltroModo('soMinha')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filtroModo === 'soMinha'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white inline-block"></span>
              <span>Mostrar só minha linha</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroModo('todas')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filtroModo === 'todas'
                  ? 'bg-[#19502f] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mostrar todas as rotas</span>
            </button>
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-3 text-[11px] text-stone-600">
            <span className="flex items-center gap-1 font-semibold">
              <span className="w-3 h-1 bg-red-600 rounded"></span>
              <span>Sua Rota</span>
            </span>
            {filtroModo === 'todas' && (
              <span className="flex items-center gap-1">
                <span className="w-3 h-1 bg-stone-400 rounded"></span>
                <span>Demais Linhas</span>
              </span>
            )}
            <span className="flex items-center gap-1 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#19502f]"></span>
              <span>Seu Ponto</span>
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-900"></span>
              <span>Portaria Peba</span>
            </span>
          </div>
        </div>

        {/* Container do Mapa Leaflet */}
        <div className="relative flex-1 min-h-[420px] bg-stone-100">
          <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />
        </div>

        {/* Rodapé com Informações da Rota e Ponto */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-stone-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="text-stone-900 font-bold text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#19502f]" />
                <span>
                  {colaborador.pontoEmbarque?.descricao || colaborador.ponto || 'Ponto em definição pelo RH'}
                </span>
              </p>
              <p className="text-stone-500 text-xs mt-0.5">
                {colaborador.endereco} • {colaborador.bairro}, Parauapebas - PA
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${colaborador.pontoEmbarque?.descricao || colaborador.ponto || colaborador.endereco}, ${colaborador.bairro}, Parauapebas - PA`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial px-4 py-2 bg-[#19502f] hover:bg-[#0d2b19] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Navigation className="w-4 h-4" />
                <span>Abrir GPS Externo</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
