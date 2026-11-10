import React, { useState } from 'react';
import { Bus, Shield, LogOut, Copy, Check, Lock } from 'lucide-react';

interface HeaderProps {
  activePanel: 'funcionario' | 'admin';
  onSelectPanel: (panel: 'funcionario' | 'admin') => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
  onOpenShareModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePanel,
  onSelectPanel,
  isAdminLoggedIn,
  onLogoutAdmin,
}) => {
  const [copiadoColab, setCopiadoColab] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const linkColaborador = `${origin}/colaborador`;

  const handleCopiarColab = () => {
    navigator.clipboard.writeText(linkColaborador);
    setCopiadoColab(true);
    setTimeout(() => setCopiadoColab(false), 2500);
  };

  const isTelaLogin = activePanel === 'admin' && !isAdminLoggedIn;

  return (
    <header className="bg-[#14673f] text-white shadow-sm sticky top-0 z-30 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white text-[#1b6e47] font-black text-lg flex items-center justify-center shadow-xs tracking-tight flex-none select-none">
                U&M
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                    Transporte de Colaboradores
                  </h1>
                  <span className="inline-flex items-center text-[11px] font-medium bg-white/15 text-white px-2.5 py-0.5 rounded-full border border-white/20">
                    U&M Parauapebas
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  {isTelaLogin
                    ? 'Painel Administrativo do RH'
                    : activePanel === 'admin'
                    ? 'Painel Administrativo do RH & Frotas'
                    : 'Portal do Colaborador • Consulta de Rota e Itinerário'}
                </p>
              </div>
            </div>

            {/* Mobile Logout if admin logged in */}
            {activePanel === 'admin' && isAdminLoggedIn && (
              <button
                onClick={onLogoutAdmin}
                className="sm:hidden p-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-900 text-white text-xs flex items-center gap-1 border border-emerald-600/60"
                title="Sair do painel"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            {isTelaLogin ? (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-900/70 border border-emerald-700/60 text-emerald-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Acesso Restrito ao RH</span>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectPanel('funcionario')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-900 text-emerald-100 hover:text-white text-xs font-semibold border border-emerald-600/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Voltar para o Portal do Colaborador"
                >
                  <Bus className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Portal do Colaborador</span>
                </button>
              </div>
            ) : activePanel === 'admin' && isAdminLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopiarColab}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-[#1b6e47] hover:bg-emerald-50 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Copiar link para enviar aos colaboradores"
                >
                  {copiadoColab ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiadoColab ? 'Link Copiado!' : 'Copiar link do colaborador'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectPanel('funcionario')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 hover:text-white text-xs font-semibold border border-emerald-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Ver Portal do Colaborador"
                >
                  <Bus className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Ver Portal do Colaborador</span>
                </button>

                <button
                  onClick={onLogoutAdmin}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-900 text-emerald-100 hover:text-white text-xs font-medium border border-emerald-700/70 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            ) : (
              /* NO PORTAL DO COLABORADOR: Botão branco com ícone de escudo */
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onSelectPanel('admin')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-[#1b6e47] hover:bg-gray-50 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  title="Abrir o Painel de Administração do RH"
                >
                  <Shield className="w-4 h-4 text-[#1b6e47] flex-none" />
                  <span>Painel de Administração (RH) / Painel de Controle</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
