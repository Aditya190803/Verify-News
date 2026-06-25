/** Shared DTO shapes (from @verify-news/shared). */

export type BiasLabel =
  | 'left'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'right'
  | 'unknown';

export type FactualityTier = 'high' | 'mixed' | 'low' | 'unknown';

export interface OutletDto {
  id: string;
  name: string;
  domain: string;
  biasLabel: BiasLabel;
  factuality: FactualityTier;
}

export interface ArticleDto {
  id: string;
  outletId: string;
  title: string;
  summary: string | null;
  url: string;
  publishedAt: string | null;
  fetchedAt: string;
  outlet?: OutletDto;
}

export interface BlindspotDto {
  message: string;
  storyHeavySide: 'left' | 'right' | 'balanced';
}

export interface StoryDto {
  id: string;
  canonicalTitle: string;
  slug: string;
  lastUpdatedAt: string;
  sourceCount: number;
  biasSpread: Partial<Record<BiasLabel, number>>;
  articles: ArticleDto[];
  blindspot?: BlindspotDto | null;
}