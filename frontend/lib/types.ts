export type SentimentLabel = 'positive' | 'negative' | 'neutral';
export type InputType = 'text' | 'url' | 'image';

export interface ReviewItem {
  id: string;
  source: string;
  text: string;
  rating?: number | null;
  likes: number;
  sentiment: SentimentLabel;
  created_at?: string | null;
  product: string;
  author?: string;
  subreddit?: string;
  permalink?: string;
}

export interface ProductInsights {
  product: string;
  total_posts: number;
  positive_percent: number;
  negative_percent: number;
  neutral_percent: number;
  top_positive_reviews: ReviewItem[];
  top_negative_reviews: ReviewItem[];
  summary: string;
  input_type: InputType;
  extracted_value?: string;
}
