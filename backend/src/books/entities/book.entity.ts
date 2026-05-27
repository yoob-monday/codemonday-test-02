export enum BookCategory {
  TEXTBOOK = 'textbook',
  GENERAL = 'general',
  NOVEL = 'novel',
}

export enum BookStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  shelfCode: string;
  summary: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  status: BookStatus;
  createdAt: Date;
  updatedAt: Date;
}
