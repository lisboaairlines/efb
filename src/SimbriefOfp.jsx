import React, { useState, useEffect, useCallback } from 'react';
import { FileText, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';

// ------------------------------------------------------------------
// Página que mostra o PDF do último OFP gerado no SimBrief para o
// username guardado em Settings (mesma fonte de dados que a
// Performance.jsx já usa).
// ------------------------------------------------------------------
export default function SimbriefOfp() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOfp = useCallback(() => {
    const username = localStorage.getItem('simbrief_username');
    if (!username) {
      setLoading(false);
      setError('Nenhum username do SimBrief definido. Vai a Settings e adiciona o teu.');
      setPdfUrl(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`https://www.simbrief.com/api/xml.fetcher.php?username=${username}&json=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.fetch && data.fetch.status && data.fetch.status !== 'Success') {
          setError(`SimBrief: ${data.fetch.status}`);
          setPdfUrl(null);
          setLoading(false);
          return;
        }

        // A localização exata do link do PDF pode variar consoante a versão
        // da API do SimBrief, por isso tentamos os caminhos mais comuns.
        const link =
          data?.fms_downloads?.pdf?.link ||
          data?.text?.pdf?.link ||
          (data?.fms_downloads?.directory
            ? `${data.fms_downloads.directory}${data.fms_downloads.pdf?.link_only || ''}`
            : null);

        if (!link) {
          setError('Não foi encontrado nenhum PDF no último OFP. Gera um plano de voo no SimBrief primeiro.');
          setPdfUrl(null);
        } else {
          setPdfUrl(link);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Erro ao contactar o SimBrief.');
        setPdfUrl(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchOfp();
    window.addEventListener('settingsChanged', fetchOfp);
    return () => window.removeEventListener('settingsChanged', fetchOfp);
  }, [fetchOfp]);

  return (
    <div className="view-container" style={{ padding: '20px' }}>
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div
          style={{
            padding: '15px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="var(--vivid-cyan)" /> SimBrief OFP
          </h2>
          <button
            onClick={fetchOfp}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'inherit',
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          {loading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-secondary)',
                gap: 12,
              }}
            >
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
              <span>A carregar o último OFP do SimBrief...</span>
            </div>
          )}

          {!loading && error && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#ff4d4d',
                gap: 12,
                padding: 20,
                textAlign: 'center',
              }}
            >
              <AlertCircle size={28} />
              <span>{error}</span>
              <a
                href="https://www.simbrief.com/system/dispatch.php"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--vivid-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Abrir SimBrief <ExternalLink size={14} />
              </a>
            </div>
          )}

          {!loading && !error && pdfUrl && (
            <>
              <iframe
                src={pdfUrl}
                title="SimBrief OFP"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', background: '#fff' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                }}
              >
                <a href={pdfUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--vivid-cyan)' }}>
                  Abrir noutra aba
                </a>{' '}
                se não carregar.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
