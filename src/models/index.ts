export interface Region {
  id: string;
  name: string;
}

export interface Greenhouse {
  id: string;
  name: string;
  region_id: string;
}
export interface Measurement {
  measurement_id: string;
  greenhouse_id: string;
  created_at: string;
  value: number;
}
export interface State {
  state_id: string;
  greenhouse_id: string;
  created_at: string;
  state: 0 | 1 | 2; // 0: Норма, 1: Предупреждение, 2: Авария
  comment: string;
}

export type UserRole = 'specialist' | 'senior-specialist';

export interface User {
  role: UserRole;
}
export interface ChartPoint {
  x: Date;
  y: number;
  measurement_id: string;
}
