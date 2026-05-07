import { Helmet } from 'react-helmet-async';

const SITE = 'https://roberttrades.com';
const SITE_NAME = 'Robert Trades';
const DEFAULT_DESC = 'Master futures trading with Robert Trades. Expert courses, unbiased prop firm reviews, and a community built for serious traders.';
const DEFAULT_IMAGE = `${SITE}/og-image.png`;

const SEO = ({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
  structuredData,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Futures Trading Education & Prop Firm Reviews`;
  const canonical = url ? `${SITE}${url}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      {canonical && <meta property="og:url" content={canonical} />}

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
