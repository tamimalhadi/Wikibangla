import { Timestamp } from './firebase';

export interface Article {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  categories: string[];
  language: 'bn' | 'en';
  views: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
  createdAt: Timestamp;
}

export const CATEGORIES = [
  'ইতিহাস', 'বিজ্ঞান', 'ভূগোল', 'সাহিত্য', 'সংস্কৃতি', 'প্রযুক্তি', 'খেলাধুলা', 'জীবনী', 'অন্যান্য'
];

export const CATEGORY_MAP: Record<string, string> = {
  'ইতিহাস': 'History',
  'বিজ্ঞান': 'Science',
  'ভূগোল': 'Geography',
  'সাহিত্য': 'Literature',
  'সংস্কৃতি': 'Culture',
  'প্রযুক্তি': 'Technology',
  'খেলাধুলা': 'Sports',
  'জীবনী': 'Biography',
  'অন্যান্য': 'Others'
};
