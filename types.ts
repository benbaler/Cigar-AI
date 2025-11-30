export interface DetailedRating {
  draw: number; // 1-10
  burn: number; // 1-10
  aroma: number; // 1-10
  construction: number; // 1-10
  ash: number; // 1-10 (Ash Stability)
  smoke: number; // 1-10 (Smoke Volume)
}

export interface ReviewThirds {
  firstThird: string;
  secondThird: string;
  finalThird: string;
}

export interface Cigar {
  id: string;
  brand: string;
  name: string;
  vitola: string; // Format
  wrapper: string;
  origin: string;
  strength: 'Mild' | 'Medium' | 'Full';
  
  // Technical Details
  ringGauge?: number;
  length?: number; // in inches
  
  // User Ratings
  rating: number; // Overall 1-10
  detailedRating?: DetailedRating;
  valueRating?: number; // 1-5 (Worth the price)
  
  // Session Info
  reviewThirds?: ReviewThirds;
  pairing?: string;
  physicalSensation?: string; // e.g. "Relaxing", "Strong Buzz"
  notes: string;
  dateStr: string;
  smokingDuration?: number; // minutes
  location?: string; // Where it was smoked
  
  // Purchase Info
  price?: number;
  purchaseLocation?: string;
  
  flavorProfile: string[]; // e.g., ['Wood', 'Coffee', 'Spice']
  imageUrl?: string;
  
  // Organization
  isFavorite: boolean;
  inWishlist: boolean;
}

export interface FlavorStat {
  subject: string;
  A: number; // Value
  fullMark: number;
}

export interface RecommendedCigar {
  brand: string;
  name: string;
  reason: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Only used for mock auth verification
  joinedDate: string;
}

export type ViewState = 'dashboard' | 'log' | 'add' | 'live' | 'wishlist' | 'favorites';

export interface AudioVisualizerData {
  volume: number;
}