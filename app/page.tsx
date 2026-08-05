'use client';
import { useState, useRef, DragEvent } from 'react';

const ACCEPTED_EXTENSIONS = ['.pdf', '.xlsx', '.xls', '.csv'];

function getFileMeta(file: File) {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const label = ext.replace('.', '').toUpperCase();
  const sizeKb = file.size / 1024;
  const size = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.round(sizeKb)} KB`;
  return { label, size };
}

export default function Home() {
  const [mode, setMode] = useState<'document' | 'trivia'>('document');
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleModeChange = (newMode: 'document' | 'trivia') => {
    setMode(newMode);
    setError('');
    if (newMode === 'trivia') {
      setFile(null); // Limpia el archivo al pasar a modo trivia
    }
  };

  const applyFile = (f: File | undefined | null) => {
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(`Formato no soportado (${ext}). Usá PDF, XLSX, XLS o CSV.`);
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    applyFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || (mode === 'document' && !file)) return;

    setLoading(true);
    setAnswer('');
    setError('');

    const formData = new FormData();
    formData.append('mode', mode);
    formData.append('question', question);
    if (file && mode === 'document') {
      formData.append('file', file);
    }

    try {
      const res = await fetch('/api/chat', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setAnswer(data.answer);
      }
    } catch {
      setError('No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.');
    }
    setLoading(false);
  };

  const isSubmitDisabled = loading || !question || (mode === 'document' && !file);

  return (
    <main className="min-h-screen bg-[#F6F7F8] flex flex-col items-center px-4 sm:px-6 py-10 sm:py-16 md:py-24">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }

        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .scan-line::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 40%; height: 2px;
          background: linear-gradient(90deg, transparent, #A9793C, transparent);
          animation: scan 1.4s ease-in-out infinite;
        }

        @keyframes rise {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rise { animation: rise 0.35s ease-out; }
      `}</style>

      <div className="w-full max-w-xl font-body">

        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A9793C]" />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.25em] text-[#5B6270] uppercase">
              {mode === 'document' ? 'Document Intelligence' : 'Conversational Intelligence'}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-[#12151C] tracking-tight">
            Omnimind
          </h1>
          <p className="mt-3 text-[#5B6270] text-sm sm:text-[15px] px-2">
            {mode === 'document'
              ? 'Análisis de documentos y datos.'
              : 'Explorá datos curiosos, historia y ciencia fascinante.'}
          </p>
        </div>

        {/* Selector de Modo */}
        <div className="mb-4 grid grid-cols-2 p-1 bg-[#E8EAEF] rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => handleModeChange('document')}
            className={`py-2 px-3 rounded-md transition-all ${
              mode === 'document'
                ? 'bg-white text-[#12151C] shadow-sm font-semibold'
                : 'text-[#5B6270] hover:text-[#12151C]'
            }`}
          >
            Documentos
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('trivia')}
            className={`py-2 px-3 rounded-md transition-all ${
              mode === 'trivia'
                ? 'bg-white text-[#12151C] shadow-sm font-semibold'
                : 'text-[#5B6270] hover:text-[#12151C]'
            }`}
          >
            Curiosidades
          </button>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E2E4E9] rounded-lg shadow-[0_1px_2px_rgba(18,21,28,0.04),0_8px_24px_-12px_rgba(18,21,28,0.08)]"
        >
          {/* Step 01 - Archivo (Únicamente visible en Modo Documentos) */}
          {mode === 'document' && (
            <div className="p-5 sm:p-7 border-b border-[#E2E4E9]">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 mb-4">
                <span className="font-mono text-xs text-[#A9793C]">01</span>
                <label className="text-[13px] font-medium text-[#12151C]">
                  Documento
                </label>
                <span className="flex flex-wrap gap-1.5 sm:ml-auto">
                  {ACCEPTED_EXTENSIONS.map((ext) => (
                    <span
                      key={ext}
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[#E2E4E9] text-[#5B6270] uppercase"
                    >
                      {ext.replace('.', '')}
                    </span>
                  ))}
                </span>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative rounded-md border border-dashed px-4 sm:px-5 py-5 sm:py-6 cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-[#1F3A5F] bg-[#1F3A5F0A]'
                    : 'border-[#D5D8DE] hover:border-[#B8BCC4]'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS.join(',')}
                  onChange={(e) => applyFile(e.target.files?.[0])}
                  className="hidden"
                />

                {file ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#1F3A5F] flex items-center justify-center shrink-0">
                      <span className="font-mono text-[9px] text-white font-medium">
                        {getFileMeta(file).label}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#12151C] truncate">{file.name}</p>
                      <p className="font-mono text-[11px] text-[#5B6270]">
                        {getFileMeta(file).size}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="shrink-0 w-8 h-8 flex items-center justify-center text-[#5B6270] hover:text-[#12151C] text-lg leading-none"
                      aria-label="Quitar archivo"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-[#12151C]">
                      <span className="sm:hidden">Tocá para elegir un archivo</span>
                      <span className="hidden sm:inline">
                        Arrastrá tu archivo o <span className="text-[#1F3A5F] underline underline-offset-2">elige uno</span>
                      </span>
                    </p>
                    <p className="mt-1 text-[12px] text-[#5B6270]">PDF, Excel o CSV</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pregunta/Consulta */}
          <div className="p-5 sm:p-7 border-b border-[#E2E4E9]">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-mono text-xs text-[#A9793C]">
                {mode === 'document' ? '02' : '01'}
              </span>
              <label className="text-[13px] font-medium text-[#12151C]">
                {mode === 'document' ? 'Consulta' : 'Pregunta o Tema'}
              </label>
            </div>
            <input
              type="text"
              inputMode="text"
              placeholder={
                mode === 'document'
                  ? '¿De qué trata este documento?'
                  : '¿Por qué el cielo es azul o cuál es el ser vivo más antiguo?'
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full border border-[#E2E4E9] rounded-md px-4 py-3 text-[16px] sm:text-sm text-[#12151C] placeholder:text-[#9BA0AB] focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/20 focus:border-[#1F3A5F] transition-colors"
            />
          </div>

          {/* Submit Button */}
          <div className="p-5 sm:p-7">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`relative overflow-hidden w-full py-3.5 sm:py-3 rounded-md text-sm font-medium tracking-wide transition-colors ${
                isSubmitDisabled
                  ? 'bg-[#E2E4E9] text-[#9BA0AB] cursor-not-allowed'
                  : 'bg-[#12151C] text-white hover:bg-[#1F3A5F] active:bg-[#1F3A5F]'
              } ${loading ? 'scan-line' : ''}`}
            >
              {loading
                ? mode === 'document'
                  ? 'Analizando documento…'
                  : 'Buscando respuesta…'
                : mode === 'document'
                ? 'Consultar a Omnimind'
                : 'Preguntar a Omnimind Curioso'}
            </button>
          </div>
        </form>

        {/* Answer Output */}
        {answer && (
          <div className="rise mt-6 bg-white border border-[#E2E4E9] rounded-lg pl-5 sm:pl-6 pr-5 sm:pr-7 py-5 sm:py-6 border-l-[3px] border-l-[#1F3A5F]">
            <p className="font-mono text-[11px] tracking-[0.2em] text-[#1F3A5F] uppercase mb-3">
              Respuesta ({mode === 'document' ? 'Documentos' : 'Curiosidades'})
            </p>
            <p className="text-[#12151C] text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {answer}
            </p>
          </div>
        )}

        {/* Error Output */}
        {error && (
          <div className="rise mt-6 bg-white border border-[#E2E4E9] rounded-lg pl-5 sm:pl-6 pr-5 sm:pr-7 py-5 sm:py-6 border-l-[3px] border-l-[#A9793C]">
            <p className="font-mono text-[11px] tracking-[0.2em] text-[#A9793C] uppercase mb-3">
              No se pudo procesar
            </p>
            <p className="text-[#12151C] text-[15px] leading-relaxed break-words">
              {error}
            </p>
          </div>
        )}

        <p className="mt-8 sm:mt-10 text-center font-mono text-[11px] text-[#9BA0AB]">
          Impulsado por Gemini 2.5 Flash - Desarrollado por Kennedy - Todos los derechos reservados © 2026
        </p>
      </div>
    </main>
  );
}