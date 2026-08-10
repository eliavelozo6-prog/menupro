import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Restaurante } from '../types';
import { Button } from './Button';
import { 
  QrCode as QrIcon, 
  Download, 
  Printer, 
  Layers, 
  Store, 
  Sparkles, 
  ExternalLink, 
  Check, 
  Copy,
  LayoutGrid,
  Info
} from 'lucide-react';

interface QrCodeGeneratorProps {
  restaurante: Restaurante | null;
}

const TEMAS_CORES = [
  { id: 'emerald', nome: 'Verde Esmeralda', bg: 'bg-emerald-600', text: 'text-emerald-600', hex: '#059669', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800' },
  { id: 'slate', nome: 'Preto / Grafite', bg: 'bg-slate-900', text: 'text-slate-900', hex: '#0f172a', badgeBg: 'bg-slate-200', badgeText: 'text-slate-900' },
  { id: 'indigo', nome: 'Azul Índigo', bg: 'bg-indigo-600', text: 'text-indigo-600', hex: '#4f46e5', badgeBg: 'bg-indigo-100', badgeText: 'text-indigo-800' },
  { id: 'amber', nome: 'Laranja Gourmet', bg: 'bg-amber-600', text: 'text-amber-600', hex: '#d97706', badgeBg: 'bg-amber-100', badgeText: 'text-amber-800' },
  { id: 'rose', nome: 'Vermelho Bossa', bg: 'bg-rose-600', text: 'text-rose-600', hex: '#e11d48', badgeBg: 'bg-rose-100', badgeText: 'text-rose-800' },
];

export const QrCodeGenerator: React.FC<QrCodeGeneratorProps> = ({ restaurante }) => {
  const [modo, setModo] = useState<'geral' | 'mesa' | 'lote'>('mesa');
  const [numeroMesa, setNumeroMesa] = useState('01');
  const [qtdMesasLote, setQtdMesasLote] = useState(10);
  const [titulo, setTitulo] = useState('Peça pelo Celular!');
  const [subtitulo, setSubtitulo] = useState('Abra a câmera do seu celular e aponte para o QR Code abaixo');
  const [corTema, setCorTema] = useState(TEMAS_CORES[0]);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loteQrCodes, setLoteQrCodes] = useState<{ mesaNum: string; url: string; qrDataUrl: string }[]>([]);
  const [copiado, setCopiado] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const slug = restaurante?.slug || 'meu-restaurante';
  const baseUrl = `${window.location.origin}/cardapio/${slug}`;

  // URL atual dependendo do modo
  const currentTargetUrl = modo === 'mesa' && numeroMesa.trim()
    ? `${baseUrl}?mesa=${encodeURIComponent(numeroMesa.trim())}`
    : baseUrl;

  // Gerar QR Code Data URL individual
  useEffect(() => {
    async function gerar() {
      try {
        const url = await QRCode.toDataURL(currentTargetUrl, {
          width: 400,
          margin: 1.5,
          color: {
            dark: corTema.hex,
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
      }
    }
    gerar();
  }, [currentTargetUrl, corTema]);

  // Gerar Lote de QR Codes para Mesas (ex: 1 até N)
  useEffect(() => {
    if (modo !== 'lote') return;
    async function gerarLote() {
      const lista = [];
      for (let i = 1; i <= qtdMesasLote; i++) {
        const numStr = i < 10 ? `0${i}` : `${i}`;
        const mesaUrl = `${baseUrl}?mesa=${numStr}`;
        try {
          const qrData = await QRCode.toDataURL(mesaUrl, {
            width: 300,
            margin: 1,
            color: {
              dark: corTema.hex,
              light: '#ffffff',
            },
          });
          lista.push({ mesaNum: numStr, url: mesaUrl, qrDataUrl: qrData });
        } catch (err) {
          console.error('Erro lote:', err);
        }
      }
      setLoteQrCodes(lista);
    }
    gerarLote();
  }, [modo, qtdMesasLote, baseUrl, corTema]);

  // Função para baixar como PNG de alta resolução
  const handleBaixarPNG = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensões do cartão de mesa (largura 600px x altura 800px)
    canvas.width = 600;
    canvas.height = 840;

    // 1. Fundo Branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Banner Superior na cor do tema
    ctx.fillStyle = corTema.hex;
    ctx.fillRect(0, 0, canvas.width, 160);

    // 3. Nome do Restaurante no Banner
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((restaurante?.nome || 'MenuPro').toUpperCase(), canvas.width / 2, 85);

    ctx.font = '500 16px sans-serif';
    ctx.fillText('CARDÁPIO DIGITAL', canvas.width / 2, 120);

    // 4. Badge da Mesa (se for modo mesa)
    if (modo === 'mesa' && numeroMesa.trim()) {
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 110, 190, 220, 50, 25);
      ctx.fill();

      ctx.fillStyle = corTema.hex;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`MESA ${numeroMesa.trim()}`, canvas.width / 2, 223);
    }

    // 5. Desenhar Título e Subtítulo
    const startY = modo === 'mesa' ? 280 : 220;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(titulo, canvas.width / 2, startY);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText(subtitulo, canvas.width / 2, startY + 35);

    // 6. Desenhar Imagem do QR Code
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = 320;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = startY + 70;

      // Moldura do QR Code
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 15;
      ctx.fillRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
      ctx.shadowColor = 'transparent';

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 7. Instruções do Rodapé
      const footerY = qrY + qrSize + 50;
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('1. Abra a câmera do celular  •  2. Aponte no QR Code  •  3. Faça seu pedido', canvas.width / 2, footerY);

      // 8. Borda decorativa externa
      ctx.strokeStyle = corTema.hex;
      ctx.lineWidth = 12;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Trigger Download
      const link = document.createElement('a');
      link.download = `qrcode-mesa-${numeroMesa || 'balcao'}-${slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    qrImg.src = qrCodeDataUrl;
  };

  // Imprimir Display de Mesa em PDF / Folha A4
  const handleImprimirDisplay = () => {
    const itemsToPrint = modo === 'lote' 
      ? loteQrCodes 
      : [{ mesaNum: numeroMesa, url: currentTargetUrl, qrDataUrl: qrCodeDataUrl }];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR_Codes_Mesa_${restaurante?.nome || 'MenuPro'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: #ffffff;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15mm;
            }
            .card {
              border: 3px solid ${corTema.hex};
              border-radius: 16px;
              padding: 20px;
              text-align: center;
              box-sizing: border-box;
              page-break-inside: avoid;
              background: #ffffff;
            }
            .card-header {
              background-color: ${corTema.hex};
              color: #ffffff;
              padding: 12px;
              border-radius: 10px;
              margin-bottom: 15px;
            }
            .card-header h2 {
              margin: 0;
              font-size: 20px;
              text-transform: uppercase;
            }
            .card-header p {
              margin: 3px 0 0 0;
              font-size: 12px;
              opacity: 0.9;
            }
            .mesa-badge {
              display: inline-block;
              background: #f1f5f9;
              color: ${corTema.hex};
              font-weight: bold;
              font-size: 18px;
              padding: 6px 18px;
              border-radius: 20px;
              margin-bottom: 10px;
            }
            .qr-img {
              width: 180px;
              height: 180px;
              margin: 10px auto;
              display: block;
            }
            .card-title {
              font-size: 16px;
              font-weight: bold;
              color: #0f172a;
              margin: 5px 0;
            }
            .card-sub {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 10px;
            }
            .footer-steps {
              font-size: 10px;
              color: #334155;
              border-top: 1px border-dashed #cbd5e1;
              padding-top: 10px;
              margin-top: 10px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${itemsToPrint.map(item => `
              <div class="card">
                <div class="card-header">
                  <h2>${restaurante?.nome || 'MenuPro'}</h2>
                  <p>CARDÁPIO DIGITAL</p>
                </div>
                ${modo !== 'geral' ? `<div class="mesa-badge">MESA ${item.mesaNum}</div>` : ''}
                <div class="card-title">${titulo}</div>
                <div class="card-sub">${subtitulo}</div>
                <img src="${item.qrDataUrl}" class="qr-img" />
                <div class="footer-steps">
                  1. Abra a câmera  •  2. Aponte no QR Code  •  3. Faça seu pedido
                </div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      let iframe = document.getElementById('iframe-print-qrcode-gen') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'iframe-print-qrcode-gen';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
      }
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 500);
      }
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(currentTargetUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <QrIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Gerador de QR Code de Mesa & Balcão</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gere placas, adesivos e displays para mesas ou balcão prontos para impressão em PNG e PDF
          </p>
        </div>

        {/* Selector Mode */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
          <button
            onClick={() => setModo('mesa')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              modo === 'mesa' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mesa Única</span>
          </button>

          <button
            onClick={() => setModo('lote')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              modo === 'lote' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lote de Mesas</span>
          </button>

          <button
            onClick={() => setModo('geral')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              modo === 'geral' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cardápio Geral</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Controls Form Side */}
        <div className="lg:col-span-6 space-y-4">
          {/* Options depending on mode */}
          {modo === 'mesa' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Número / Identificação da Mesa *
              </label>
              <input
                type="text"
                value={numeroMesa}
                onChange={(e) => setNumeroMesa(e.target.value)}
                placeholder="Ex: 01, 02, Balcão 1, VIP..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}

          {modo === 'lote' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Quantidade de Mesas para Gerar no Lote
              </label>
              <select
                value={qtdMesasLote}
                onChange={(e) => setQtdMesasLote(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value={5}>5 Mesas (Mesa 01 a 05)</option>
                <option value={10}>10 Mesas (Mesa 01 a 10)</option>
                <option value={15}>15 Mesas (Mesa 01 a 15)</option>
                <option value={20}>20 Mesas (Mesa 01 a 20)</option>
                <option value={30}>30 Mesas (Mesa 01 a 30)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título da Placa</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subtítulo / Instrução</label>
            <input
              type="text"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Theme Colors Palette */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Cor Principal da Placa / Display
            </label>
            <div className="flex flex-wrap gap-2">
              {TEMAS_CORES.map((tema) => (
                <button
                  key={tema.id}
                  onClick={() => setCorTema(tema)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    corTema.id === tema.id
                      ? 'border-slate-900 ring-2 ring-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${tema.bg}`} />
                  <span>{tema.nome}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Link Box & Copy */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              URL Direta do QR Code
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentTargetUrl}
                className="w-full bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 select-all"
              />
              <button
                onClick={copiarLink}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1"
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleBaixarPNG}
              disabled={modo === 'lote'}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Placa (PNG High-Res)</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleImprimirDisplay}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF (A4)</span>
            </Button>
          </div>
        </div>

        {/* Live Display Card Preview Side */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-100 p-6 rounded-2xl border border-slate-200">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Pré-visualização do Display de Mesa
          </span>

          {modo === 'lote' ? (
            <div className="w-full space-y-3">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Gerando lote com <strong>{qtdMesasLote} QR Codes</strong> (Mesa 01 até Mesa {qtdMesasLote < 10 ? `0${qtdMesasLote}` : qtdMesasLote}). Clique em "Imprimir / PDF" para imprimir a folha completa.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto p-2">
                {loteQrCodes.map((item) => (
                  <div key={item.mesaNum} className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                    <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full ${corTema.badgeBg} ${corTema.badgeText} mb-1`}>
                      MESA {item.mesaNum}
                    </span>
                    <img src={item.qrDataUrl} alt={`Mesa ${item.mesaNum}`} className="w-24 h-24 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[320px] bg-white rounded-2xl shadow-xl border-4 border-slate-900 overflow-hidden text-center transition-all">
              {/* Card Header Banner */}
              <div className={`${corTema.bg} text-white p-4`}>
                <h3 className="font-extrabold text-lg uppercase tracking-tight">
                  {restaurante?.nome || 'MenuPro'}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 block">
                  Cardápio Digital
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3">
                {modo === 'mesa' && numeroMesa.trim() && (
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wider ${corTema.badgeBg} ${corTema.badgeText}`}>
                    MESA {numeroMesa.trim()}
                  </span>
                )}

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{titulo}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{subtitulo}</p>
                </div>

                {/* QR Code Image */}
                <div className="p-3 bg-white rounded-xl border-2 border-slate-100 shadow-inner inline-block">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code"
                      className="w-44 h-44 mx-auto object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-300">
                      Gerando...
                    </div>
                  )}
                </div>

                {/* Steps */}
                <div className="text-[10px] text-slate-600 font-bold pt-2 border-t border-dashed border-slate-200">
                  1. Abra a câmera  •  2. Aponte no QR Code  •  3. Peça!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
