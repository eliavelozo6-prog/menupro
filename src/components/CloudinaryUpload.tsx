import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw, Link as LinkIcon, Sparkles, Grid, Cloud } from 'lucide-react';

interface CloudinaryUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  cloudName?: string;
}

const DEFAULT_CLOUDINARY_CLOUD_NAME = 'bxp7jdny';
const IMGBB_API_KEY = 'c19d453dd08f1b1c3c97ea0fbdf3bb9f';

// Galeria de Fotos Prontas para Cardápio (Links CDN externos leves e profissionais)
const GALERIA_GASTRONOMICA = [
  { nome: 'Hambúrguer Gourmet', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop' },
  { nome: 'Pizza Artesanal', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop' },
  { nome: 'Refrigerante Lata', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop' },
  { nome: 'Suco Natural', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop' },
  { nome: 'Porção Fritas', url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop' },
  { nome: 'Prato Executivo', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop' },
  { nome: 'Comida Japonesa / Sushi', url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop' },
  { nome: 'Sobremesa / Pudim', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop' },
  { nome: 'Açaí na Tigela', url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop' },
  { nome: 'Cerveja Gelada', url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&auto=format&fit=crop' },
  { nome: 'Café Expresso', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop' },
  { nome: 'Coxinha / Salgado', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop' },
];

export const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  imageUrl,
  onImageChange,
  cloudName = DEFAULT_CLOUDINARY_CLOUD_NAME,
}) => {
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'upload' | 'galeria' | 'url'>('upload');
  const [urlManual, setUrlManual] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    await processarEEnviarArquivo(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processarEEnviarArquivo(file);
    }
  };

  const comprimirImagemCliente = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Tempo limite para processamento da imagem excedido'));
      }, 5000);

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          clearTimeout(timeout);
          try {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 800;
            let width = img.width || 800;
            let height = img.height || 800;

            if (width > height) {
              if (width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
            }
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Erro ao carregar a imagem selecionada.'));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Erro ao ler arquivo do dispositivo.'));
      };
      reader.readAsDataURL(file);
    });
  };

  const processarEEnviarArquivo = async (file: File) => {
    setErro('');
    setSucesso('');

    if (!file.type.startsWith('image/')) {
      setErro('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErro('A imagem deve ter no máximo 15MB.');
      return;
    }

    setUploading(true);

    try {
      let enviado = false;

      // 1. Tenta ImgBB primeiro com timeout de 3 segundos
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const formDataImgBB = new FormData();
        formDataImgBB.append('image', file);

        const resImgBB = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formDataImgBB,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (resImgBB.ok) {
          const dataImgBB = await resImgBB.json();
          if (dataImgBB?.data?.url) {
            onImageChange(dataImgBB.data.url);
            setSucesso('Foto enviada e salva com sucesso!');
            enviado = true;
          }
        }
      } catch (e) {
        console.warn('Tentativa ImgBB rápida ignorada/fallback...', e);
      }

      // 2. Se ImgBB não enviou, tenta Cloudinary com timeout de 2.5 segundos
      if (!enviado) {
        const presetsValidos = ['ml_default', 'unsigned', 'menupro', 'bxp7jdny'];
        for (const preset of presetsValidos) {
          if (enviado) break;
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const formDataCloudinary = new FormData();
            formDataCloudinary.append('file', file);
            formDataCloudinary.append('upload_preset', preset);

            const resCloudinary = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
              method: 'POST',
              body: formDataCloudinary,
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (resCloudinary.ok) {
              const data = await resCloudinary.json();
              if (data && (data.secure_url || data.url)) {
                onImageChange(data.secure_url || data.url);
                setSucesso('Foto enviada e salva com sucesso!');
                enviado = true;
                break;
              }
            }
          } catch (e) {
            console.warn(`Preset ${preset} falhou ou deu timeout:`, e);
          }
        }
      }

      // 3. Fallback Instantâneo: Processamento e Otimização Local no Navegador
      if (!enviado) {
        const compressedUrl = await comprimirImagemCliente(file);
        onImageChange(compressedUrl);
        setSucesso('Foto otimizada e salva com sucesso!');
      }

    } catch (err: any) {
      console.error('Erro ao enviar imagem:', err);
      setErro('Erro ao processar imagem. Escolha uma foto da galeria ou insira um link.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAplicarUrlManual = () => {
    if (!urlManual.trim()) return;
    onImageChange(urlManual.trim());
    setUrlManual('');
    setSucesso('URL de imagem aplicada com sucesso!');
  };

  const handleRemoverImagem = () => {
    onImageChange('');
    setSucesso('');
    setErro('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Label e Indicador de Upload */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Cloud className="w-4 h-4 text-emerald-600" />
          <span>Foto do Produto / Restaurante</span>
          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" /> Servidor de Imagens
          </span>
        </label>
        
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          {imageUrl ? '1 / 1 foto' : '0 / 1 foto'} (Máx: 1)
        </span>
      </div>

      {erro && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      {/* CASO 1: Imagem Atribuída */}
      {imageUrl ? (
        <div className="bg-slate-50 border-2 border-emerald-500/30 rounded-2xl p-3 relative flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300 shadow-xs">
            <img 
              src={imageUrl} 
              alt="Preview da Imagem" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Foto Adicionada com Sucesso</span>
            </div>

            {/* Status do Arquivo */}
            <div className="p-2 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Status da Foto:</span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                  Pronta no Cardápio
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <a 
                  href={imageUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-emerald-600 hover:underline font-bold text-[10px] flex items-center gap-1"
                >
                  <LinkIcon className="w-3 h-3" /> Visualizar Imagem Original
                </a>
              </div>
            </div>

            <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-block font-medium">
              ⚠️ Limite de 1 foto por item. Para trocar, remova a foto atual.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleRemoverImagem}
                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3 text-rose-600" /> Remover / Trocar Foto
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* CASO 2: Nenhuma Imagem Cadastrada - Abas de Seleção */
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3 space-y-3">
          {/* Seletor de Abas */}
          <div className="flex items-center p-1 bg-slate-200/70 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setAbaAtiva('upload')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                abaAtiva === 'upload' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Enviar do Dispositivo
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva('galeria')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                abaAtiva === 'galeria' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Galeria de Fotos
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva('url')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                abaAtiva === 'url' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" /> Link da Imagem
            </button>
          </div>

          {/* ABA 1: Upload de Arquivo */}
          {abaAtiva === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 bg-white hover:bg-emerald-50/40 hover:border-emerald-400 ${
                uploading ? 'opacity-60 pointer-events-none border-slate-300' : 'border-slate-300'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-700">Processando e enviando imagem...</span>
                </div>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">
                      Clique para escolher a foto do produto
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Aceita PNG, JPG ou WEBP até 10MB
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ABA 2: Galeria Pronta Gastronômica */}
          {abaAtiva === 'galeria' && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-600">Escolha uma foto de alta qualidade para seu cardápio:</p>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                {GALERIA_GASTRONOMICA.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onImageChange(item.url);
                      setSucesso(`Foto de ${item.nome} selecionada com sucesso!`);
                    }}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-sky-500 transition-all text-left bg-white shadow-2xs hover:scale-105 cursor-pointer"
                  >
                    <img 
                      src={item.url} 
                      alt={item.nome} 
                      className="w-full h-16 object-cover group-hover:opacity-90"
                      referrerPolicy="no-referrer"
                    />
                    <div className="p-1 bg-slate-900/80 text-white text-[9px] font-bold truncate text-center">
                      {item.nome}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ABA 3: URL Manual */}
          {abaAtiva === 'url' && (
            <div className="p-2 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">Cole a URL direta da foto na internet:</label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlManual}
                  onChange={(e) => setUrlManual(e.target.value)}
                  placeholder="https://sua-imagem.com/foto.jpg"
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={handleAplicarUrlManual}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  Usar Link
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
