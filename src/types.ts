export interface SoundItem {
  id: string;
  title: string;
  url: string;
  mp3: string;
  duration?: number | null;
}

export interface SoundUploader {
  username: string;
  url: string;
}

export interface SoundDetail {
  id: string;
  url: string;
  title: string;
  mp3: string;
  description: string;
  tags: string[];
  favorites: string;
  views: string;
  uploader: SoundUploader;
  duration?: number | null;
}

export interface PaginationMeta {
  page: number;
  count: number;
  total_pages: number | null;
  has_next: boolean | null;
}

export interface ApiSuccessResponse<T> {
  status: string;
  author: string;
  page?: number;
  count?: number;
  total_pages?: number | null;
  has_next?: boolean | null;
  data: T;
}

export interface ApiErrorResponse {
  status: string;
  author: string;
  message: string;
}

export interface DurationFilterParams {
  withDuration: boolean;
  minDuration: number | null;
  maxDuration: number | null;
}
