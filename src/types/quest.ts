export type QuestStatus = 'pending' | 'planning' | 'in_progress' | 'reviewing' | 'completed';

export type SubtaskStatus = 'queued' | 'assigned' | 'working' | 'completed';

export interface Subtask {
  id: string;
  title: string;
  assignedAgentId: string;
  assignedAgentName: string;
  assignedRoleLabel: string;
  status: SubtaskStatus;
  progress: number; // 0 to 100
  output: string | null;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  createdAt: string;
  completedAt: string | null;
  subtasks: Subtask[];
  finalOutput: string | null;
}
