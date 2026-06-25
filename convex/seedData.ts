/** Outlet seed rows (from apps/api/data/outlets.seed.json). */
export const OUTLET_SEED = [
  { id: 'bbc', name: 'BBC News', domain: 'bbc.com', biasLabel: 'center-left', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'http://feeds.bbci.co.uk/news/rss.xml' },
  { id: 'reuters', name: 'Reuters', domain: 'reuters.com', biasLabel: 'center', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://www.reutersagency.com/feed/' },
  { id: 'npr', name: 'NPR', domain: 'npr.org', biasLabel: 'center-left', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://feeds.npr.org/1001/rss.xml' },
  { id: 'ap', name: 'AP Top News', domain: 'apnews.com', biasLabel: 'center', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://rsshub.app/apnews/topics/apf-topnews' },
  { id: 'guardian', name: 'The Guardian', domain: 'theguardian.com', biasLabel: 'left', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://www.theguardian.com/world/rss' },
  { id: 'wsj', name: 'Wall Street Journal', domain: 'wsj.com', biasLabel: 'center-right', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml' },
  { id: 'fox', name: 'Fox News', domain: 'foxnews.com', biasLabel: 'right', factuality: 'mixed', ratingSource: 'manual-seed', feedUrl: 'https://moxie.foxnews.com/google-publisher/latest.xml' },
  { id: 'cnn', name: 'CNN', domain: 'cnn.com', biasLabel: 'left', factuality: 'mixed', ratingSource: 'manual-seed', feedUrl: 'http://rss.cnn.com/rss/cnn_topstories.rss' },
  { id: 'nbc', name: 'NBC News', domain: 'nbcnews.com', biasLabel: 'center-left', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://feeds.nbcnews.com/nbcnews/public/news' },
  { id: 'aljazeera', name: 'Al Jazeera English', domain: 'aljazeera.com', biasLabel: 'center-left', factuality: 'high', ratingSource: 'manual-seed', feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml' },
] as const;