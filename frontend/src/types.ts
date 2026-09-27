export interface User {
  name: string;
  email: string;
  role: string;
  meshId: string;
}

export type Tab = 'incidents' | 'resources' | 'map' | 'command';

export type StatusType = 'error' | 'success' | 'pending';
