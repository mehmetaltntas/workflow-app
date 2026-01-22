// src/types/index.ts

// Öncelik seviyeleri
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

// Etiket
export interface Label {
  id: number;
  name: string;
  color: string; // Hex color code (e.g., "#ff5733")
}

// Alt Görev
export interface Subtask {
  id: number;
  title: string;
  isCompleted: boolean;
  position: number;
}

// Görev Kartı
export interface Task {
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
export interface TaskList {
  id: number;
  name: string;
  link?: string;
  isCompleted?: boolean;
  createdAt?: string;
  tasks: Task[]; // İçinde görevler dizisi var
}

// Pano (Dashboard)
export interface Board {
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
export interface User {
  id: number;
  username: string;
  email: string;
}
