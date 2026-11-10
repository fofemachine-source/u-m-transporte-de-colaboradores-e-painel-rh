import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Bus, Shield, AlertCircle, Save } from 'lucide-react';
import { TURMAS, STATUS_LIST, ROTAS_SUGESTOES } from '../constants';
import { ColaboradorCadastro, StatusCadastro } from '../types';
import { lerFotoArquivo } from '../services/api';

interface ModalEditProps {
  isOpen: boolean;
  cadastro: ColaboradorCadastro | null; // null se for novo cadastro
  onClose: () => void;
  onSave: (dados: Partial<ColaboradorCadastro>) => Promise<void>;
}

export const ModalEdit: React.FC<ModalEditProps> = ({
  isOpen,
  cadastro,
  onClose,
  onSave,
}) => {
  const isNovo = !cadastro;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Parauapebas');
  const [turma, setTurma] = useState('');
  const [local, setLocal] = useState('U&M');
  const [ponto, setPonto] = useState('');
  const [status, setStatus] = useState<StatusCadastro>('Novo');
  const [onibus, setOnibus] = useState('');
  const [obs, setObs] = useState('');
  const [foto, setFoto] = useState<string | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (cadastro) {
      setNome(cadastro.nome || '');
      setMatricula(cadastro.matricula || '');
      setTelefone(cadastro.telefone || '');
      setEndereco(cadastro.endereco || '');
      setBairro(cadastro.bairro || '');
      setCidade(cadastro.cidade || 'Parauapebas');
      setTurma(cadastro.turma || TURMAS[0]);
      setLocal(cadastro.local || 'U&M');
      setPonto(cadastro.ponto || '');
      setStatus(cadastro.status || 'Novo');
      setOnibus(cadastro.onibus || '');
      setObs(cadastro.obs || '');
      setFoto(cadastro.foto || null);
    } else {
      setNome('');
      setMatricula('');
      setTelefone('');
      setEndereco('');
      setBairro('');
      setCidade('Parauapebas');
      setTurma(TURMAS[0]);
      setLocal('U&M');
      setPonto('');
      setStatus('Novo');
      setOnibus('');
      setObs('');
      setFoto(null);
    }
    setErro(null);
  }, [cadastro, isOpen]);

  if (!isOpen) return null;

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await lerFotoArquivo(file);
      setFoto(dataUrl);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar imagem.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !matricula.trim() || !endereco.trim() || !bairro.trim() || !turma || !ponto.trim()) {
      setErro('Preencha os campos obrigatórios marcados com *');
      return;
    }

    setSalvando(true);
    try {
      await onSave({
        nome: nome.trim(),
        matricula: matricula.trim(),
        telefone: telefone.trim(),
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        turma,
        local: local.trim(),
        ponto: ponto.trim(),
        status,
        onibus: onibus.trim(),
        obs: obs.trim(),
        foto,
        consentimento: true,
      });
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Falha ao salvar dados.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/70">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {isNovo ? 'Cadastrar Novo Colaborador' : 'Editar Dados e Rota do Colaborador'}
            </h2>
            <p className="text-xs text-stone-500">
              {isNovo
                ? 'Inserção manual de colaborador pelo time de RH'
                : `Protocolo: ${cadastro?.protocolo || cadastro?.id} • Cadastrado em ${cadastro?.criadoEm}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {erro && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-none" />
              <span>{erro}</span>
            </div>
          )}

          {/* Foto */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Foto do Colaborador
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border border-stone-300 bg-stone-100 overflow-hidden flex items-center justify-center flex-none">
                {foto ? (
                  <img src={foto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-stone-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold"
                >
                  {foto ? 'Trocar foto' : 'Enviar foto'}
                </button>
                {foto && (
                  <button
                    type="button"
                    onClick={() => setFoto(null)}
                    className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                  >
                    Remover
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Matrícula <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Endereço <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Bairro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Cidade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Turma / Setor <span className="text-red-500">*</span>
              </label>
              <select
                value={turma}
                onChange={(e) => setTurma(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
              >
                {TURMAS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Local de Trabalho
              </label>
              <input
                type="text"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Ex.: U&M Mina N4"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Ponto de Embarque <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ponto}
                onChange={(e) => setPonto(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
              />
            </div>
          </div>

          {/* Bloco Administrativo Exclusivo do RH */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/90 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200/80 pb-2">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>Gestão de Transporte do RH (Exclusivo)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Status do Cadastro
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusCadastro)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-sm font-semibold text-stone-800 focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
                >
                  {STATUS_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Ônibus / Rota Designada
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={onibus}
                    onChange={(e) => setOnibus(e.target.value)}
                    placeholder="Ex: TA-L01 (Amazonas / Cidade Jardim)"
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-sm focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
                  />

                  {/* Sugestão do Motor Inteligente U&M */}
                  {cadastro?.rotaSugerida && (
                    <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-[10px] uppercase text-indigo-700 block">Sugerido pelo Motor:</span>
                        <span className="font-semibold truncate block">{cadastro.rotaSugerida}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOnibus(cadastro.rotaSugerida!);
                          setStatus('Rota definida');
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex-none transition-colors cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}

                  {/* Sugestões rápidas de rotas */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] text-stone-500 self-center">Linhas:</span>
                    {ROTAS_SUGESTOES.slice(0, 4).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => {
                          setOnibus(r);
                          if (status === 'Novo' || status === 'Em análise' || status === 'Rota sugerida') {
                            setStatus('Rota definida');
                          }
                        }}
                        className="text-[10px] bg-white hover:bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300 font-medium transition-colors cursor-pointer"
                      >
                        {r.split(' (')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Observações Internas (Apenas RH tem acesso)
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Ex: Colaborador com restrição de horário; ponto de embarque validado pelo fiscal de tráfego."
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-sm focus:ring-2 focus:ring-[#1b6e47] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2.5 rounded-xl bg-[#1b6e47] hover:bg-[#155a3a] text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{salvando ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
