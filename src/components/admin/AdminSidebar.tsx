import React from 'react';
import {
  LayoutDashboard,
  Users,
  MapPin,
  FileText,
  FileEdit,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Bus,
  Shield,
  UserX,
  X,
  Share2,
  Calendar,
} from 'lucide-react';
import { AdminView, ColaboradorCadastro, SolicitacaoEndereco } from '../../types';

interface AdminSidebarProps {
  activeView: AdminView;
  onChangeView: (view: AdminView) => void;
  cadastros: ColaboradorCadastro[];
  solicitacoes?: SolicitacaoEndereco[];
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeView,
  onChangeView,
  cadastros,
  solicitacoes = [],
  onLogout,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [copiado, setCopiado] = React.useState(false);
  const solicitacoesPendentes = solicitacoes.filter((s) => s.status === 'Pendente').length;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const linkColaborador = `${origin}/colaborador`;

  const handleCopiarLink = () => {
    navigator.clipboard.writeText(linkColaborador);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const totalAtivos = cadastros.filter((c) => c.status !== 'Inativo').length;
  const totalDemitidos = cadastros.filter((c) => c.status === 'Inativo').length;
  const totalNovos = cadastros.filter((c) => c.status === 'Novo').length;

  const menuItems = [
    {
      id: 'dashboard' as AdminView,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: totalNovos > 0 ? `${totalNovos} novos` : null,
      badgeColor: 'bg-blue-500 text-white',
    },
    {
      id: 'colaboradores' as AdminView,
      label: 'Colaboradores',
      icon: Users,
      badge: `${totalAtivos}`,
      badgeColor: 'bg-emerald-100 text-emerald-800',
      sublabel: totalDemitidos > 0 ? `${totalDemitidos} demitidos` : undefined,
    },
    {
      id: 'rotas' as AdminView,
      label: 'Linhas & Rotas',
      icon: Bus,
      badge: 'Motor U&M',
      badgeColor: 'bg-emerald-700 text-white',
      sublabel: 'Itinerários dos turnos',
    },
    {
      id: 'mapa' as AdminView,
      label: 'Mapa de Parauapebas',
      icon: MapPin,
      badge: 'Ao Vivo',
      badgeColor: 'bg-emerald-600 text-white animate-pulse',
      sublabel: 'Colaboradores no mapa',
    },
    {
      id: 'solicitacoes' as AdminView,
      label: 'Solicitações de Mudança',
      icon: FileEdit,
      badge: solicitacoesPendentes > 0 ? `${solicitacoesPendentes} pendentes` : null,
      badgeColor: 'bg-amber-500 text-white animate-pulse',
      sublabel: 'Troca de residência',
    },
    {
      id: 'escala_sabado' as AdminView,
      label: 'Escala de Sábado',
      icon: Calendar,
      badge: 'Parvi',
      badgeColor: 'bg-amber-500 text-white',
      sublabel: 'Supervisores & Frota Parvi',
    },
    {
      id: 'relatorios' as AdminView,
      label: 'Relatórios do RH',
      icon: FileText,
      badge: 'Romaneio & Ocupação',
      badgeColor: 'bg-stone-200 text-stone-700',
      sublabel: 'Romaneio & Demissões',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#17261d] text-stone-200 select-none border-r border-[#263b2f]">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-[#263b2f] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-[#1b6e47] font-black text-xl flex items-center justify-center shadow-md flex-none">
            U&M
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-tight leading-tight">
              Transporte & RH
            </h2>
            <span className="text-[11px] text-emerald-400 font-semibold block flex items-center gap-1">
              <Bus className="w-3 h-3 inline text-emerald-400" /> Parauapebas - PA
            </span>
          </div>
        </div>

        {/* Botão fechar no mobile */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 block pt-2 pb-1">
          Menu Principal
        </span>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onChangeView(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1b6e47] text-white shadow-md'
                  : 'text-stone-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-5 h-5 flex-none ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                <div className="truncate">
                  <span className="block truncate">{item.label}</span>
                  {item.sublabel && (
                    <span className="text-[10px] font-normal text-stone-400 block -mt-0.5">
                      {item.sublabel}
                    </span>
                  )}
                </div>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-none ml-2 ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Links de Acesso Secundário / Compartilhamento */}
      <div className="p-3 border-t border-[#263b2f] bg-black/15 space-y-2">
        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
          Link do Colaborador
        </span>

        <button
          type="button"
          onClick={handleCopiarLink}
          className="w-full py-2.5 px-3 rounded-xl bg-[#1b6e47]/40 hover:bg-[#1b6e47] text-white text-xs font-bold flex items-center justify-between border border-emerald-600/40 transition-colors cursor-pointer"
          title="Copiar link para enviar aos colaboradores"
        >
          <div className="flex items-center gap-2 truncate">
            {copiado ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-emerald-300" />}
            <span className="truncate">{copiado ? 'Link Copiado!' : 'Copiar Link'}</span>
          </div>
          <span className="text-[10px] bg-emerald-900 text-emerald-200 px-1.5 py-0.5 rounded font-mono">
            /colaborador
          </span>
        </button>

        <a
          href="/colaborador"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-between transition-colors"
          title="Abrir tela do colaborador em uma nova guia secundária"
        >
          <span className="truncate">Abrir Link Secundário</span>
          <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
        </a>
      </div>

      {/* Admin User Profile & Logout */}
      <div className="p-3.5 border-t border-[#263b2f] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs flex-none shadow-inner">
            <Shield className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="block text-xs font-bold text-white truncate">Administrador RH</span>
            <span className="block text-[10px] text-emerald-400">Sessão Segura</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          title="Sair do painel administrativo"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixo à esquerda) */}
      <aside className="hidden lg:block w-64 flex-none sticky top-0 h-screen z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
