import React, { useState, useEffect } from 'react';
import {
  Menu,
  Share2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Shield,
  Users,
  LayoutDashboard,
  MapPin,
  FileText,
  Bus,
  FileEdit,
  Calendar,
} from 'lucide-react';
import { ColaboradorCadastro, AdminView, RotaLinha, SolicitacaoEndereco } from '../types';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminColaboradores } from './admin/AdminColaboradores';
import { AdminRotas } from './admin/AdminRotas';
import { AdminMapaParauapebas } from './admin/AdminMapaParauapebas';
import { AdminRelatorios } from './admin/AdminRelatorios';
import { AdminSolicitacoes } from './admin/AdminSolicitacoes';
import { EscalaSabadoView } from './EscalaSabadoView';
import { fetchRotas, fetchSolicitacoes } from '../services/api';

interface AdminPanelProps {
  cadastros: ColaboradorCadastro[];
  onRefresh: () => Promise<void>;
  carregando: boolean;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  cadastros,
  onRefresh,
  carregando,
  onLogout = () => {},
}) => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [colabSelecionadoNoMapa, setColabSelecionadoNoMapa] = useState<ColaboradorCadastro | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [rotas, setRotas] = useState<RotaLinha[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoEndereco[]>([]);

  const loadRotas = async () => {
    try {
      const data = await fetchRotas();
      setRotas(data);
    } catch (err) {
      console.error('Erro ao carregar rotas:', err);
    }
  };

  const loadSolicitacoes = async () => {
    try {
      const data = await fetchSolicitacoes();
      setSolicitacoes(data);
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
    }
  };

  const handleRefreshGeral = async () => {
    await Promise.all([onRefresh(), loadRotas(), loadSolicitacoes()]);
  };

  useEffect(() => {
    loadRotas();
    loadSolicitacoes();
  }, []);

  const [copiadoColab, setCopiadoColab] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const linkColaborador = `${origin}/colaborador`;

  const handleCopiarColab = () => {
    navigator.clipboard.writeText(linkColaborador);
    setCopiadoColab(true);
    setTimeout(() => setCopiadoColab(false), 2500);
  };

  const handleVerNoMapa = (colab: ColaboradorCadastro) => {
    setColabSelecionadoNoMapa(colab);
    setActiveView('mapa');
  };

  const solicitacoesPendentes = solicitacoes.filter((s) => s.status === 'Pendente').length;

  const mensagemWhatsApp = encodeURIComponent(
    `🚌 *U&M | Transporte de Colaboradores*\n\n` +
    `Olá! Acesse o link abaixo para *consultar sua rota de ônibus* e ponto de embarque ou fazer seu cadastro de transporte:\n\n` +
    `👉 ${linkColaborador}`
  );

  return (
    <div className="flex min-h-[calc(100vh-65px)] bg-[#f5f4f4]">
      
      {/* 1. Menu Lateral Esquerdo */}
      <AdminSidebar
        activeView={activeView}
        onChangeView={(view) => {
          setActiveView(view);
          if (view !== 'mapa') setColabSelecionadoNoMapa(null);
        }}
        cadastros={cadastros}
        solicitacoes={solicitacoes}
        onLogout={onLogout}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Área de Conteúdo Principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        
        {/* Topbar com Navegação Direta de Abas em Qualquer Resolução */}
        <div className="bg-white border-b border-stone-200 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 cursor-pointer"
              title="Abrir menu lateral"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* ABAS CLICÁVEIS DIRETAS NO TOPO */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeView === 'dashboard'
                    ? 'bg-white text-[#19502f] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('colaboradores')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeView === 'colaboradores'
                    ? 'bg-white text-[#19502f] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Colaboradores</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('rotas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeView === 'rotas'
                    ? 'bg-[#19502f] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                <span>Linhas & Rotas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('mapa')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeView === 'mapa'
                    ? 'bg-[#19502f] text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mapa de Parauapebas</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              </button>

              <button
                type="button"
                onClick={() => setActiveView('solicitacoes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeView === 'solicitacoes'
                    ? 'bg-white text-[#19502f] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5 text-amber-600" />
                <span>Solicitações</span>
                {solicitacoesPendentes > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold">
                    {solicitacoesPendentes}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveView('escala_sabado')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeView === 'escala_sabado'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-900 hover:text-amber-950 bg-amber-50/80 hover:bg-amber-100 border border-amber-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Escala de Sábado (Parvi)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('relatorios')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeView === 'relatorios'
                    ? 'bg-white text-[#19502f] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Relatórios</span>
              </button>
            </div>
          </div>

          {/* Quick link button no topo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiarColab}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#19502f] text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
              title="Copiar link para enviar ao colaborador"
            >
              {copiadoColab ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiadoColab ? 'Copiado!' : 'Copiar Link'}</span>
            </button>

            <a
              href="/colaborador"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Abrir o link do colaborador em uma nova guia secundária"
            >
              <span>Abrir Link Secundário</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
            </a>
          </div>
        </div>

        {/* Banner de Envio de Link para Colaborador */}
        <div className="p-4 sm:p-6 pb-0">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#19502f]" />
                  Link de Acesso para os Colaboradores
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                  Copie e envie este link para os funcionários consultarem suas rotas e pontos de embarque pelo WhatsApp ou e-mail.
                </p>
              </div>

              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-700" />
                <span>Link dos Funcionários</span>
              </span>
            </div>

            <div className="pt-3">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                    Link direto para o colaborador:
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={linkColaborador}
                    className="w-full bg-white px-3 py-1.5 rounded-xl border border-emerald-300 text-xs font-mono text-stone-800 select-all font-semibold shadow-2xs"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto pt-1 sm:pt-4">
                  <a
                    href={linkColaborador}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center gap-1.5 transition-all shadow-2xs flex-none"
                    title="Abrir o link do colaborador em uma nova guia secundária"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#19502f]" />
                    <span className="hidden sm:inline">Abrir Link Secundário</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopiarColab}
                    className="px-3.5 py-2 bg-[#19502f] hover:bg-[#0d2b19] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm flex-none"
                    title="Copiar link do colaborador"
                  >
                    {copiadoColab ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiadoColab ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${mensagemWhatsApp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm flex-none"
                    title="Enviar direto pelo WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exibição da Visão Selecionada no Menu */}
        <div className="p-4 sm:p-6 flex-1">
          {activeView === 'dashboard' && (
            <AdminDashboard
              cadastros={cadastros}
              rotas={rotas}
              solicitacoes={solicitacoes}
              onChangeView={setActiveView}
              onVerNoMapa={handleVerNoMapa}
            />
          )}

          {activeView === 'colaboradores' && (
            <AdminColaboradores
              cadastros={cadastros}
              rotas={rotas}
              onRefresh={handleRefreshGeral}
              carregando={carregando}
              onVerNoMapa={handleVerNoMapa}
            />
          )}

          {activeView === 'rotas' && (
            <AdminRotas
              rotas={rotas}
              cadastros={cadastros}
              onRefreshRotas={loadRotas}
            />
          )}

          {activeView === 'mapa' && (
            <AdminMapaParauapebas
              cadastros={cadastros}
              rotas={rotas}
              colaboradorInicial={colabSelecionadoNoMapa}
              onRefresh={handleRefreshGeral}
            />
          )}

          {activeView === 'solicitacoes' && (
            <AdminSolicitacoes
              solicitacoes={solicitacoes}
              cadastros={cadastros}
              rotas={rotas}
              onRefresh={handleRefreshGeral}
              onDefinirPontoNoMapa={handleVerNoMapa}
              onChangeView={setActiveView}
            />
          )}

          {activeView === 'escala_sabado' && (
            <EscalaSabadoView
              cadastros={cadastros}
              rotas={rotas}
              isSupervisorView={false}
            />
          )}

          {activeView === 'relatorios' && (
            <AdminRelatorios
              cadastros={cadastros}
              rotas={rotas}
            />
          )}
        </div>

      </div>

    </div>
  );
};
