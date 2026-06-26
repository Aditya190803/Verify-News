export type OutletSeedRow = {
  id: string;
  name: string;
  domain: string;
  biasLabel: string;
  factuality: string;
  ratingSource: string;
  feedUrl: string;
  ownershipCategory?: string;
};

/** India-focused outlets (national RSS; bias labels are manual seed). */
export const OUTLET_SEED: OutletSeedRow[] = [
  {
    id: 'the-hindu',
    name: 'The Hindu',
    domain: 'thehindu.com',
    biasLabel: 'center-left',
    factuality: 'high',
    ratingSource: 'manual-seed',
    feedUrl: 'https://www.thehindu.com/news/national/feeder/default.rss',
  },
  {
    id: 'indian-express',
    name: 'The Indian Express',
    domain: 'indianexpress.com',
    biasLabel: 'center-left',
    factuality: 'high',
    ratingSource: 'manual-seed',
    feedUrl: 'https://indianexpress.com/section/india/feed/',
  },
  {
    id: 'ndtv',
    name: 'NDTV',
    domain: 'ndtv.com',
    biasLabel: 'center-left',
    factuality: 'high',
    ratingSource: 'manual-seed',
    feedUrl: 'https://feeds.feedburner.com/ndtvnews-india-news',
  },
  {
    id: 'toi',
    name: 'Times of India',
    domain: 'timesofindia.com',
    biasLabel: 'center',
    factuality: 'mixed',
    ratingSource: 'manual-seed',
    feedUrl: 'https://timesofindia.indiatimes.com/rssfeeds/1226516.cms',
  },
  {
    id: 'ht',
    name: 'Hindustan Times',
    domain: 'hindustantimes.com',
    biasLabel: 'center-left',
    factuality: 'high',
    ratingSource: 'manual-seed',
    feedUrl: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
  },
  {
    id: 'india-today',
    name: 'India Today',
    domain: 'indiatoday.in',
    biasLabel: 'center',
    factuality: 'mixed',
    ratingSource: 'manual-seed',
    feedUrl: 'https://www.indiatoday.in/rss/1206578',
  },
  {
    id: 'wire',
    name: 'The Wire',
    domain: 'thewire.in',
    biasLabel: 'left',
    factuality: 'high',
    ratingSource: 'manual-seed',
    feedUrl: 'https://thewire.in/rss',
  },
  {
    id: 'scroll',
    name: 'Scroll.in',
    domain: 'scroll.in',
    biasLabel: 'left',
    factuality: 'high',
    ratingSource: 'manual-seed',
    feedUrl: 'https://scroll.in/rss/all',
  },
  {
    id: 'wion',
    name: 'WION',
    domain: 'wionews.com',
    biasLabel: 'center',
    factuality: 'mixed',
    ratingSource: 'manual-seed',
    feedUrl: 'https://www.wionews.com/feeds/india',
  },
  {
    id: 'republic',
    name: 'Republic World',
    domain: 'republicworld.com',
    biasLabel: 'right',
    factuality: 'mixed',
    ratingSource: 'manual-seed',
    feedUrl: 'https://www.republicworld.com/india.rss',
    ownershipCategory: 'corporation',
  },
  { id: 'news18', name: 'News18', domain: 'news18.com', biasLabel: 'center', factuality: 'mixed', ratingSource: 'manual-seed', feedUrl: 'https://www.news18.com/rss/india.xml', ownershipCategory: 'media_conglomerate' },
  { id: 'firstpost', name: 'Firstpost', domain: 'firstpost.com', biasLabel: 'center-left', factuality: 'mixed', ratingSource: 'manual-seed', feedUrl: 'https://www.firstpost.com/rss/india.xml', ownershipCategory: 'media_conglomerate' },
  { id: 'livemint', name: 'Mint', domain: 'livemint.com', biasLabel: 'center-left', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://www.livemint.com/rss/news', ownershipCategory: 'media_conglomerate' },
  { id: 'deccan-herald', name: 'Deccan Herald', domain: 'deccanherald.com', biasLabel: 'center-left', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://www.deccanherald.com/rss-feed', ownershipCategory: 'independent' },
  { id: 'tribune', name: 'The Tribune', domain: 'tribuneindia.com', biasLabel: 'center', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://www.tribuneindia.com/rss/feed', ownershipCategory: 'independent' },
  { id: 'zee-news', name: 'Zee News', domain: 'zeenews.india.com', biasLabel: 'right', factuality: 'mixed', ratingSource: 'manual-seed', feedUrl: 'https://zeenews.india.com/rss/india-national.xml', ownershipCategory: 'media_conglomerate' },
  { id: 'abp-live', name: 'ABP Live', domain: 'abplive.com', biasLabel: 'center-right', factuality: 'mixed', ratingSource: 'manual-seed', feedUrl: 'https://news.abplive.com/rss/india.xml', ownershipCategory: 'media_conglomerate' },
  { id: 'economic-times', name: 'Economic Times', domain: 'economictimes.indiatimes.com', biasLabel: 'center', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://economictimes.indiatimes.com/rssfeeds/1715249553.cms', ownershipCategory: 'media_conglomerate' },
  { id: 'business-standard', name: 'Business Standard', domain: 'business-standard.com', biasLabel: 'center', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://www.business-standard.com/rss/home_page_top_stories.rss', ownershipCategory: 'independent' },
  { id: 'outlook', name: 'Outlook India', domain: 'outlookindia.com', biasLabel: 'center-left', factuality: 'mixed', ratingSource: 'manual-seed', feedUrl: 'https://www.outlookindia.com/rss/main/feed', ownershipCategory: 'independent' },
  { id: 'the-quint', name: 'The Quint', domain: 'thequint.com', biasLabel: 'center-left', factuality: 'mixed', ratingSource: 'manual-seed', feedUrl: 'https://www.thequint.com/feed', ownershipCategory: 'independent' },
  { id: 'newslaundry', name: 'Newslaundry', domain: 'newslaundry.com', biasLabel: 'left', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://www.newslaundry.com/feed', ownershipCategory: 'independent' },
  { id: 'dnaindia', name: 'DNA India', domain: 'dnaindia.com', biasLabel: 'center', factuality: 'mixed', ratingSource: 'manual-seed', feedUrl: 'https://www.dnaindia.com/feeds/india.xml', ownershipCategory: 'media_conglomerate' },
  { id: 'fpj', name: 'Free Press Journal', domain: 'freepressjournal.in', biasLabel: 'center', factuality: 'mixed', ratingSource: 'manual-seed', feedUrl: 'https://www.freepressjournal.in/rss/feed', ownershipCategory: 'independent' },
  { id: 'bbc-news', name: 'BBC News', domain: 'bbc.com', biasLabel: 'center-left', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml', ownershipCategory: 'government' },
  { id: 'reuters', name: 'Reuters', domain: 'reuters.com', biasLabel: 'center', factuality: 'very-high', ratingSource: 'manual-seed', feedUrl: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best', ownershipCategory: 'corporation' },
  { id: 'al-jazeera', name: 'Al Jazeera', domain: 'aljazeera.com', biasLabel: 'center-left', factuality: 'mixed', ratingSource: 'manual-seed', feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml', ownershipCategory: 'government' },
  { id: 'opindia', name: 'OpIndia', domain: 'opindia.com', biasLabel: 'right', factuality: 'low', ratingSource: 'manual-seed', feedUrl: 'https://www.opindia.com/feed/', ownershipCategory: 'independent' },
  { id: 'swarajya', name: 'Swarajya', domain: 'swarajyamag.com', biasLabel: 'right', factuality: 'mixed', ratingSource: 'manual-seed', feedUrl: 'https://swarajyamag.com/feed', ownershipCategory: 'independent' },
  { id: 'print', name: 'The Print', domain: 'theprint.in', biasLabel: 'center-left', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://theprint.in/feed/', ownershipCategory: 'independent' },
];

export const OUTLET_IDS = new Set<string>(OUTLET_SEED.map((o) => o.id));