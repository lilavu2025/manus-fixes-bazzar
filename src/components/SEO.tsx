import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/utils/languageContextUtils';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  price?: string;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
}

const SEO = ({
  title,
  description,
  keywords,
  image = '/og-image.png',
  url = window.location.href,
  type = 'website',
  noIndex = false,
  price,
  currency = 'USD',
  availability = 'InStock'
}: SEOProps) => {
  const { t, language } = useLanguage();
  
  const siteTitle = t('storeName');
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = t('storeDescription');
  const finalDescription = description || defaultDescription;
  const defaultKeywords = t('defaultKeywords') || 'متجر إلكتروني, تسوق أونلاين, منتجات عربية, online store, shopping, arabic products';
  const finalKeywords = keywords || defaultKeywords;
  const siteImage = image.startsWith('http') ? image : `${window.location.origin}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={language} dir={language === 'ar' || language === 'he' ? 'rtl' : 'ltr'} />
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content={siteTitle} />
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      <meta name="googlebot" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      <meta name="language" content={language} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={siteImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content={language === 'ar' ? 'ar_SA' : language === 'he' ? 'he_IL' : 'en_US'} />
      {price && (
        <>
          <meta property="product:price:amount" content={price} />
          <meta property="product:price:currency" content={currency} />
          <meta property="product:availability" content={availability} />
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={siteImage} />
      <meta name="twitter:image:alt" content={fullTitle} />
      <meta name="twitter:site" content="@modernbazaar" />
      <meta name="twitter:creator" content="@modernbazaar" />
      
      {/* Mobile and PWA Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="theme-color" content="#f97316" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteTitle} />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-TileColor" content="#f97316" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      
      {/* Canonical and Preconnect */}
      <link rel="canonical" href={url} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* PWA Icons */}
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#f97316" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': type === 'product' ? 'Product' : 'WebSite',
          name: fullTitle,
          description: finalDescription,
          url: url,
          image: siteImage,
          ...(type === 'website' && {
            potentialAction: {
              '@type': 'SearchAction',
              target: `${window.location.origin}/products?search={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
          ...(type === 'product' && price && {
            offers: {
              '@type': 'Offer',
              price: price,
              priceCurrency: currency,
              availability: `https://schema.org/${availability}`,
              seller: {
                '@type': 'Organization',
                name: siteTitle
              }
            }
          })
        })}
      </script>
      
      {/* Organization Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteTitle,
          url: window.location.origin,
          logo: `${window.location.origin}/logo.png`,
          sameAs: [
            'https://facebook.com/modernbazaar',
            'https://twitter.com/modernbazaar',
            'https://instagram.com/modernbazaar'
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEO;