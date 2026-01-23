// src/types/index.ts

// Öncelik seviyeleri
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

// HATEOAS Link yapısı
export interface HateoasLink {
  href: string;
  templated?: boolean;
}

export interface HateoasLinks {
  self?: HateoasLink;
  update?: HateoasLink;
  delete?: HateoasLink;
  [key: string]: HateoasLink | undefined;
}

// HATEOAS base model
export interface HateoasModel {
  _links?: HateoasLinks;
}

// Sayfalanmış HATEOAS yanıt yapısı
export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PagedResponse<T> {
  _embedded?: {
    [key: string]: T[];
  };
  _links?: HateoasLinks & {
    first?: HateoasLink;
    prev?: HateoasLink;
    next?: HateoasLink;
    last?: HateoasLink;
  };
  page?: PageMetadata;
}

// Etiket
export interface Label extends HateoasModel {
  id: number;
  name: string;
  color: string; // Hex color code (e.g., "#ff5733")
}

// Alt Görev
export interface Subtask extends HateoasModel {
  id: number;
  title: string;
  description?: string;
  link?: string;
  isCompleted: boolean;
  position: number;
  dueDate?: string | null;
  priority?: Priority;
  labels?: Label[];
}

// Görev Kartı
export interface Task extends HateoasModel {
  id: number;
  title: string;
  description: string;
  position: number;
  link?: string;
  isCompleted?: boolean;
  createdAt?: string;
  dueDate?: string | null; // Son tarih (YYYY-MM-DD formatında)
  priority?: Priority; // Öncelik seviyesi
  labels?: Label[]; // Görevin etiketleri
  subtasks?: Subtask[]; // Alt görevler
}

// Sütun (Liste)
export interface TaskList extends HateoasModel {
  id: number;
  name: string;
  description?: string;
  link?: string;
  isCompleted?: boolean;
  createdAt?: string;
  dueDate?: string | null;
  priority?: Priority;
  labels?: Label[];
  tasks: Task[]; // İçinde görevler dizisi var
}

// Pano (Dashboard)
export interface Board extends HateoasModel {
  id: number;
  name: string;
  slug: string; // YENİ
  status?: string; // Status (PLANLANDI, DEVAM_EDIYOR, etc.)
  link?: string;
  description?: string; // Opsiyonel açıklama (max 50 karakter)
  deadline?: string;
  ownerName: string;
  taskLists: TaskList[]; // İçinde listeler dizisi var
  labels?: Label[]; // Panoya ait etiketler
}

// Kullanıcı (Login olunca dönen veri)
export interface User extends HateoasModel {
  id: number;
  username: string;
  email: string;
}
