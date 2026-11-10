import React, { useState, useEffect } from 'react';
import { X, MapPin, Send, AlertCircle, CheckCircle2, RefreshCw, Bus } from 'lucide-react';
import { ColaboradorCadastro, RotaLinha, SugestaoRotaResultado } from '../types';
import { sugerirRota } from '../utils/motorRotas';
import { criarSolicitacaoEndereco } from '../services/api';

interface ModalSolicitarMudancaEnderecoProps {
  isOpen: boolean;
  onClose: () => void;
  colaborador: ColaboradorCadastro;
  rotas: RotaLinha[];
  onSolicitacaoCriada: (sol: any) => void;
}

export const ModalSolicitarMudancaEndereco: React.FC<ModalSolicitarMudancaEnderecoProps> = ({
  isOpen,
  onClose,
  colaborador,
  rotas = [],
  onSolicitacaoCriada,
}) => {
  const [novoEndereco, setNovoEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState(colaborador.cidade || 'Parauapebas');
  const [motivo, setMotivo] = useState<'mudança de residência' | 'outro'>('mudança de residência');
  const [dataVigencia, setDataVigencia] = useState('');
  const [observacao, setObservacao] = useState('');

  const [sugestao, setSugestao] = useState<SugestaoRotaResultado | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNovoEndereco('');
      setBairro('');
      setCidade(colaborador.cidade || 'Parauapebas');
      setMotivo('mudança de residência');
      setDataVigencia(new Date().toLocaleDateString('pt-BR'));
      setObservacao('');
      setSugestao(null);
      setErro(null);
      setSucesso(false);
    }
  }, [isOpen, colaborador]);

  // Sugestão automática ao preencher Endereço + Bairro
  useEffect(() => {
    if (novoEndereco.trim().length >= 3 && bairro.trim().length >= 2) {
      const res = sugerirRota({
        endereco: novoEndereco.trim(),
        bairro: bairro.trim(),
        turma: colaborador.turma,
      }, rotas);
      setSugestao(res);
    } else {
      setSugestao(null);
    }
  }, [novoEndereco, bairro, colaborador.turma, rotas]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!novoEndereco.trim() || !bairro.trim() || !dataVigencia.trim()) {
      setErro('Por favor, preencha o novo endereço, bairro e a data de vigência.');
      return;
    }

    setEnviando(true);
    try {
      const res = await criarSolicitacaoEndereco({
        colaboradorId: colaborador.id,
        matricula: colaborador.matricula,
        enderecoNovo: novoEndereco.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        motivo,
        dataVigencia: dataVigencia.trim(),
        observacao: observacao.trim(),
      });

      setSucesso(true);
      onSolicitacaoCriada(res.solicitacao);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setErro(err.message || 'Erro ao enviar solicitação.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#19502f] flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base leading-tight">
                Solicitar Mudança de Endereço
              </h3>
              <p className="text-xs text-stone-500">
                {colaborador.nome} • Matrícula: {colaborador.matricula}
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

        {/* Formulário */}
        <div className="p-5 overflow-y-auto">
          {sucesso ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-stone-900">Solicitação Enviada!</h4>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                Sua solicitação de mudança de endereço foi enviada com sucesso para o RH da U&M. Ela ficará com status <strong>Pendente</strong> até a aprovação.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-none" />
                  <span>{erro}</span>
                </div>
              )}

              {/* Endereço Atual */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                <span className="text-stone-400 font-bold uppercase text-[10px] block">Endereço Atual Cadastrado:</span>
                <p className="font-medium text-stone-800">{colaborador.endereco} - {colaborador.bairro}, {colaborador.cidade}</p>
                <p className="text-stone-500 text-[11px] mt-0.5">Linha Atual: <strong>{colaborador.onibus || 'Em alocação'}</strong> ({colaborador.turma})</p>
              </div>

              {/* Novo Endereço */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Novo Endereço Residencial <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={novoEndereco}
                  onChange={(e) => setNovoEndereco(e.target.value)}
                  placeholder="Ex: Rua Santa Catarina, 450"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#19502f] text-stone-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Bairro em Parauapebas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Ex: Liberdade, Cidade Jardim, VS-10"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#19502f] text-stone-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#19502f] text-stone-800 text-sm"
                  />
                </div>
              </div>

              {/* Tag com Linha Sugerida Automaticamente (Item 1.2 & 2.4) */}
              {sugestao && (
                <div className="p-3 rounded-xl border transition-all animate-in fade-in">
                  {sugestao.encontrada ? (
                    <div className="bg-emerald-50 border-emerald-200 text-emerald-950 p-2.5 rounded-lg flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                          Nova Linha Sugerida pelo Sistema:
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="bg-[#19502f] text-white text-xs font-black px-2 py-0.5 rounded-md">
                            {sugestao.codigo}
                          </span>
                          <span className="text-xs font-bold text-emerald-900">
                            {sugestao.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 mt-1">
                          Início: {sugestao.horarioInicio || '04:30'} • {sugestao.motivo}
                        </p>
                      </div>
                      <span className="text-xs font-black px-2 py-1 rounded bg-emerald-100 text-emerald-800 flex-none">
                        Confiança {sugestao.confianca}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-stone-100 border-stone-300 text-stone-700 p-2.5 rounded-lg flex items-center gap-2 text-xs">
                      <span className="bg-stone-300 text-stone-800 text-[11px] font-bold px-2 py-0.5 rounded">
                        Rota a definir pelo RH
                      </span>
                      <span>O RH definirá a linha compatível para sua nova localização.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Motivo da Solicitação
                  </label>
                  <select
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-sm bg-white"
                  >
                    <option value="mudança de residência">Mudança de residência</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Válido a partir de <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dataVigencia}
                    onChange={(e) => setDataVigencia(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Observações adicionais (opcional)
                </label>
                <textarea
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Próximo à padaria central, rua de asfalto novo..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-sm resize-none"
                />
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="px-5 py-2.5 rounded-xl bg-[#19502f] hover:bg-[#0d2b19] text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-60"
                >
                  {enviando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Solicitação ao RH</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
