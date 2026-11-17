export type AgentRole = 'manager' | 'researcher' | 'coder' | 'writer' | 'reviewer' | 'custom';

export type AgentStatus =
  | 'idle'
  | 'walking'
  | 'thinking'
  | 'working'
  | 'reporting'
  | 'done';

export interface Vector2 {
  x: number;
  y: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'action' | 'success' | 'system';
  message: string;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  roleLabel: string;
  specialty: string;
  color: string;
  hairColor: string;
  level: number;
  xp: number;
  xpToNext: number;
  tasksDone: number;
  status: AgentStatus;
  position: Vector2;
  targetPosition: Vector2 | null;
  deskPosition: Vector2;
  facing: 'down' | 'up' | 'left' | 'right';
  speechBubble: string | null;
  speechTimer: number;
  currentSubtaskId: string | null;
  logs: LogEntry[];
}

export interface HireAgentInput {
  name: string;
  roleLabel: string;
  specialty: string;
  color: string;
}
