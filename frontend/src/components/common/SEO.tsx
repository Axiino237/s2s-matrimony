import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const DEFAULT_TITLE = 'S2S Matrimony — Trusted Tamil & South Indian Community Matrimony';
const DEFAULT_DESCRIPTION =
  'S2S Matrimony is a trusted South Indian and Tamil community matrimony platform. Find verified bride and groom profiles, 10-Porutham horoscope matching, and strict contact privacy.';
const DEFAULT_KEYWORDS =
  'matrimony, Tamil matrimony, community matrimony, bride, groom, Indian marriage bureau, 10 porutham matching, verified matrimonial profiles';
const DEFAULT_OG_IMAGE = 'https://s2smatrimony.com/images/couple_happy.png';
const BASE_URL = 'https://s2smatrimony.com';

function setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string | null) {
  let element = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!content) {
    if (element) element.remove();
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalTag(url: string | null) {
  let element = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!url) {
    if (element) element.remove();
    return;
  }
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

function setJsonLdScript(data: Record<string, any> | Record<string, any>[] | null) {
  const SCRIPT_ID = 'seo-structured-data';
  let element = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (!data) {
    if (element) element.remove();
    return;
  }
  if (!element) {
    element = document.createElement('script');
    element.id = SCRIPT_ID;
    element.type = 'application/ld+json';
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}

export const SEO = ({
  title,
  description,
  keywords,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd,
}: SEOProps) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Title
    const finalTitle = title ? (title.includes('S2S Matrimony') ? title : `${title} | S2S Matrimony`) : DEFAULT_TITLE;
    document.title = finalTitle;

    // 2. Standard Meta
    const finalDescription = description || DEFAULT_DESCRIPTION;
    setMetaTag('name', 'description', finalDescription);
    setMetaTag('name', 'keywords', keywords || DEFAULT_KEYWORDS);

    // 3. Robots Indexing Control
    if (noindex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
      setMetaTag('name', 'googlebot', 'noindex, nofollow');
    } else {
      setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      setMetaTag('name', 'googlebot', 'index, follow');
    }

    // 4. Canonical URL
    const canonicalUrl = canonical
      ? canonical.startsWith('http')
        ? canonical
        : `${BASE_URL}${canonical.startsWith('/') ? '' : '/'}${canonical}`
      : `${BASE_URL}${location.pathname}`;
    setCanonicalTag(canonicalUrl);

    // 5. Open Graph
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', finalDescription);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`);
    setMetaTag('property', 'og:site_name', 'S2S Matrimony');
    setMetaTag('property', 'og:locale', 'en_IN');

    // 6. Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', finalDescription);
    setMetaTag('name', 'twitter:image', ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`);

    // 7. Structured Data JSON-LD
    if (jsonLd) {
      setJsonLdScript(jsonLd);
    } else {
      setJsonLdScript(null);
    }

    return () => {
      // Optional cleanup if component unmounts without replacement
    };
  }, [title, description, keywords, canonical, ogType, ogImage, noindex, jsonLd, location.pathname]);

  return null;
};

export default SEO;

