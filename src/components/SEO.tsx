import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: Record<string, any>;
}

export function SEO({
  title = 'MenuPro - Cardápio Digital QR Code e Gestão para Restaurantes',
  description = 'MenuPro é a melhor plataforma de Cardápio Digital QR Code, Pedidos Via WhatsApp, Gestão de Mesas e Impressão Térmica para Restaurantes.',
  keywords = 'cardápio digital, qr code restaurante, pedidos whatsapp, sistema para restaurante, menupro saas',
  image = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  url,
  type = 'website',
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    // Atualizar Título da Página
    document.title = title;

    // Função utilitária para atualizar ou criar tags meta
    const setMetaTag = (nameAttr: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Meta tags padrão
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);

    // Open Graph
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:type', type);
    if (url || window.location.href) {
      setMetaTag('property', 'og:url', url || window.location.href);
    }

    // Twitter
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);

    // Canonical URL
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url || window.location.href);

    // Inject JSON-LD Schema se fornecido
    let scriptTag = document.getElementById('dynamic-jsonld') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'dynamic-jsonld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    } else if (scriptTag) {
      scriptTag.remove();
    }

  }, [title, description, keywords, image, url, type, jsonLd]);

  return null;
}
