import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink, MessageCircle, Shield, Users, Bus } from 'lucide-react';

interface ShareLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ isOpen, onClose }) => {
  const [copiadoColab, setCopiadoColab] = useState(false);
  const [copiadoAdmin, setCopiadoAdmin] = useState(false);

  if (!isOpen) return null;

  const FIXED_LINK = 'https://ais-dev-pzejj4vazewhfves4dby4h-345977153072.us-west2.run.app/';
  const linkColaborador = FIXED_LINK;
  const linkAdmin = `${FIXED_LINK}?painel=admin`;

  const handleCopiarColab = () => {
    navigator.clipboard.writeText(linkColaborador);
    setCopiadoColab(true);
    setTimeout(() => setCopiadoColab(false), 2500);
  };

  const handleCopiarAdmin = () => {
    navigator.clipboard.writeText(linkAdmin);
    setCopiadoAdmin(true);
    setTimeout(() => setCopiadoAdmin(false), 2500);
  };

  const mensagemWhatsApp = encodeURIComponent(
    `🚌 *U&M | Transporte de Colaboradores*\n\n` +
    `Olá! Acesse o link abaixo para *consultar sua rota de ônibus* e ponto de embarque ou fazer seu cadastro de transporte:\n\n` +
    `👉 ${linkColaborador}`
  );

  const whatsAppUrl = `https://api.whatsapp.com/send?text=${mensagemWhatsApp}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#19502f] flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                Links Separados & Interligados
              </h2>
              <p className="text-xs text-stone-500">
                Copie os links dedicados para o Colaborador e para a Administração.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Link 1: Colaborador */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              1. Link do Colaborador (Consultar Rota & Cadastro)
            </span>
            <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-semibold">
              Para enviar aos funcionários
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={linkColaborador}
              className="flex-1 bg-white px-3 py-2 rounded-xl border border-emerald-300 text-xs font-mono text-stone-800 select-all"
            />
            <button
              type="button"
              onClick={handleCopiarColab}
              className="px-3 py-2 bg-[#19502f] hover:bg-[#0d2b19] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer flex-none shadow-2xs"
            >
              {copiadoColab ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiadoColab ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-emerald-800">
              O colaborador abre direto na tela de <strong>consulta de rota</strong> e itinerário.
            </span>
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enviar via WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Link 2: Painel Admin (RH) */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-stone-700" />
              2. Link do Painel Administrativo (RH)
            </span>
            <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-semibold">
              Uso restrito da equipe RH
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={linkAdmin}
              className="flex-1 bg-white px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono text-stone-800 select-all"
            />
            <button
              type="button"
              onClick={handleCopiarAdmin}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer flex-none shadow-2xs"
            >
              {copiadoAdmin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiadoAdmin ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>


        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs sm:text-sm transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
