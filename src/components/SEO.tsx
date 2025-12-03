import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  article?: {
    publishedTime?: string;
    author?: string;
    tags?: string[];
  };
}

export const SEO = ({ title, description, image, url, type = 'website', article }: SEOProps) => {
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const fullUrl = url ? `${siteUrl}${url}` : window.location.href;
  const ogImage = image || `${siteUrl}/og-image.png`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title} | VerifyNews</title>
      <meta name="description" content={description} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="VerifyNews" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Article specific tags */}
      {type === 'article' && article && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.author && (
            <meta property="article:author" content={article.author} />
          )}
          {article.tags && article.tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  );
};
