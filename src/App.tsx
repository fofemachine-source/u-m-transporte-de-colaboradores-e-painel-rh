import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ColaboradorForm } from './components/ColaboradorForm';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { ShareLinksModal } from './components/ShareLinksModal';
import { ColaboradorCadastro } from './types';
import { fetchCadastros } from './services/api';
import { Bus, CheckCircle2, Shield, Users, Share2, Link as LinkIcon } from 'lucide-react';

export default function App() {
  // Determina o painel pela rota (/admin vs /colaborador) ou pelo query param (?painel=admin)
  const getPanelFromUrl = (): 'funcionario' | 'admin' => {
    const pathname = window.location.pathname.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const painelParam = urlParams.get('painel');

    if (pathname.includes('/admin') || painelParam === 'admin') {
      return 'admin';
    }
    return 'funcionario';
  };

  const [activePanel, setActivePanel] = useState<'funcionario' | 'admin'>(getPanelFromUrl());
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem('um_admin_token'));
  });

  const [cadastros, setCadastros] = useState<ColaboradorCadastro[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<{ texto: string; tipo: 'sucesso' | 'info' } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const showToast = (texto: string, tipo: 'sucesso' | 'info' = 'sucesso') => {
    setToastMsg({ texto, tipo });
    setTimeout(() => {
      setToastMsg((current) => (current?.texto === texto ? null : current));
    }, 4000);
  };

  const loadData = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await fetchCadastros();
      setCadastros(data);
    } catch (err) {
      console.error('Erro ao carregar cadastros:', err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Sincronização em tempo real contínua: tudo que for cadastrado pelo colaborador é enviado e atualizado no painel admin imediatamente
    const interval = setInterval(async () => {
      try {
        const data = await fetchCadastros();
        setCadastros((prev) => {
          if (data.length > prev.length) {
            const maisRecente = data[0];
            if (maisRecente && isAdminLoggedIn) {
              showToast(`Novo cadastro recebido do colaborador: ${maisRecente.nome} (${maisRecente.turma})`, 'sucesso');
            }
            return data;
          }
          return data;
        });
      } catch {
        // Silencioso em caso de instabilidade de rede
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [loadData, isAdminLoggedIn]);

  // Sincronizar rota ao navegar pelo histórico (Voltar / Avançar do navegador)
  useEffect(() => {
    const handlePopState = () => {
      setActivePanel(getPanelFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Mantém sempre o mesmo link fixo sem alterar a URL ao trocar de painel
  const FIXED_SYSTEM_URL = 'https://ais-dev-pzejj4vazewhfves4dby4h-345977153072.us-west2.run.app/';
  const handleSelectPanel = (panel: 'funcionario' | 'admin') => {
    setActivePanel(panel);
  };

  const handleCadastroCriado = (novo: ColaboradorCadastro) => {
    setCadastros((prev) => [novo, ...prev.filter(c => c.id !== novo.id)]);
    showToast(`Cadastro de ${novo.nome} recebido pelo sistema com sucesso!`, 'sucesso');
  };

  const handleLoginSuccess = (_token: string) => {
    setIsAdminLoggedIn(true);
    showToast('Acesso administrativo autenticado. Bem-vindo ao painel do RH!', 'sucesso');
    loadData();
  };

  const handleLogoutAdmin = () => {
    sessionStorage.removeItem('um_admin_token');
    setIsAdminLoggedIn(false);
    showToast('Você saiu da sessão administrativa.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#f3f6f4] text-[#16251d] flex flex-col font-sans selection:bg-[#1b6e47] selection:text-white">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium border border-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-none" />
            <span>{toastMsg.texto}</span>
          </div>
        </div>
      )}

      {/* Main Header with Panel Switcher and Share Links Modal trigger */}
      <Header
        activePanel={activePanel}
        onSelectPanel={handleSelectPanel}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogoutAdmin={handleLogoutAdmin}
        onOpenShareModal={() => setShareModalOpen(true)}
      />

      {/* Content Area */}
      <main className="flex-1 pb-16">
        {activePanel === 'funcionario' ? (
          <ColaboradorForm
            onCadastroCriado={handleCadastroCriado}
          />
        ) : (
          /* Painel Admin */
          !isAdminLoggedIn ? (
            <AdminLogin
              onLoginSuccess={handleLoginSuccess}
            />
          ) : (
            <AdminPanel
              cadastros={cadastros}
              onRefresh={loadData}
              carregando={carregando}
              onLogout={handleLogoutAdmin}
            />
          )
        )}
      </main>

      {/* Modal para Compartilhar os 2 Links Separados e Interligados */}
      <ShareLinksModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-5 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1b6e47]">U&M</span>
            <span>•</span>
            <span>Sistema Integrado de Transporte & Recursos Humanos</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-stone-500">
            {isAdminLoggedIn ? (
              <a
                href={FIXED_SYSTEM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1b6e47] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                title="Abrir o Portal do Colaborador em uma guia secundária"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Abrir Portal do Colaborador (Guia Secundária) ↗</span>
              </a>
            ) : activePanel === 'funcionario' ? (
              <span className="text-stone-400">Portal Oficial do Colaborador • Transporte U&M</span>
            ) : (
              <span className="text-stone-400">Ambiente Seguro RH</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
