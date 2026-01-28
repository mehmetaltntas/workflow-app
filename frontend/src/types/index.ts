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
  isDefault?: boolean; // Varsayılan etiketler silinemez
}

// Alt Görev
export interface Subtask extends HateoasModel {
  id: number;
  title: string;
  description?: string;
  link?: string;
  isCompleted: boolean;
  position: number;
  createdAt?: string;
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

// Pano üye atama
export interface BoardMemberAssignment {
  id: number;
  targetType: 'LIST' | 'TASK' | 'SUBTASK';
  targetId: number;
  targetName?: string;
  createdAt: string;
}

// Pano üyesi (sorumlu kişi)
export interface BoardMember extends HateoasModel {
  id: number;
  userId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string | null;
  status?: 'PENDING' | 'ACCEPTED';
  createdAt: string;
  assignments?: BoardMemberAssignment[];
}

// Pano (Dashboard)
export interface Board extends HateoasModel {
  id: number;
  name: string;
  slug: string; // YENİ
  status?: string; // Status (PLANLANDI, DEVAM_EDIYOR, etc.)
  category?: string; // Pano kategorisi
  link?: string;
  description?: string; // Opsiyonel açıklama (max 500 karakter)
  deadline?: string;
  createdAt?: string; // Oluşturulma tarihi
  ownerName: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  isOwner?: boolean; // Mevcut kullanıcı pano sahibi mi
  currentUserId?: number; // Mevcut kullanıcının ID'si
  taskLists: TaskList[]; // İçinde listeler dizisi var
  labels?: Label[]; // Panoya ait etiketler
  members?: BoardMember[]; // Pano üyeleri (sorumlu kişiler)
  boardType?: 'INDIVIDUAL' | 'TEAM';
}

// Kullanıcı (Login olunca dönen veri)
export interface User extends HateoasModel {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  deletionScheduledAt?: string | null;
}

// Baglanti durumu
export type ConnectionStatus = 'PENDING' | 'PENDING_RECEIVED' | 'ACCEPTED' | 'REJECTED' | 'SELF' | null;

// Bildirim tipi
export type NotificationType = 'CONNECTION_REQUEST' | 'CONNECTION_ACCEPTED' | 'BOARD_MEMBER_INVITATION' | 'BOARD_MEMBER_ACCEPTED';

// Kullanici arama sonucu
export interface UserSearchResult extends HateoasModel {
  id: number;
  username: string;
  profilePicture?: string | null;
}

// Kullanici profil bilgileri
export interface UserProfile extends HateoasModel {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string | null;
  isProfilePublic: boolean;
  connectionCount: number | null;
  connectionStatus: ConnectionStatus;
  connectionId: number | null;
}

// Baglanti
export interface Connection extends HateoasModel {
  id: number;
  senderId: number;
  senderUsername: string;
  senderFirstName?: string | null;
  senderLastName?: string | null;
  senderProfilePicture?: string | null;
  receiverId: number;
  receiverUsername: string;
  receiverFirstName?: string | null;
  receiverLastName?: string | null;
  receiverProfilePicture?: string | null;
  status: string;
  createdAt: string;
}

// Kullanici profil istatistikleri
export interface UserProfileStats {
  totalBoards: number;
  boardsByStatus: {
    PLANLANDI: number;
    DEVAM_EDIYOR: number;
    TAMAMLANDI: number;
    DURDURULDU: number;
    BIRAKILDI: number;
  };
  totalLists: number;
  completedLists: number;
  totalTasks: number;
  completedTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
  overallProgress: number;
  topCategories: { category: string; count: number }[];
  teamBoardCount: number;
}

// Bildirim
export interface Notification extends HateoasModel {
  id: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  actorId: number;
  actorUsername: string;
  actorProfilePicture?: string | null;
  referenceId: number | null;
  createdAt: string;
}
