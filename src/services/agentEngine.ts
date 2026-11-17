import {
  LOUNGE_POINTS,
  MANAGER_DESK,
  MEETING_POINTS,
  QUEST_BOARD_POS,
  WORKER_DESKS,
} from '../canvas/officeMap';
import { Agent, AgentRole, HireAgentInput, LogEntry } from '../types/agent';
import { DEFAULT_LLM_CONFIG, LLMConfig } from '../types/llm';
import { Quest, Subtask } from '../types/quest';
import { callLLM, parseJsonFromLLM } from './llmClient';

export interface EngineSnapshot {
  agents: Agent[];
  quests: Quest[];
  llmConfig: LLMConfig;
}

export interface IAgentEngine {
  getSnapshot(): EngineSnapshot;
  subscribe(listener: (snapshot: EngineSnapshot) => void): () => void;
  setLLMConfig(config: LLMConfig): void;
  submitQuest(title: string, description: string): Quest;
  reviseQuest(questId: string, feedback: string): boolean;
  hireAgent(input: HireAgentInput): Agent | null;
  tick(dtSeconds: number): void;
}

function nowTime(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

let uidCounter = 1;
function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${uidCounter}`;
}

function makeLog(level: LogEntry['level'], message: string): LogEntry {
  return {
    id: uid('log'),
    timestamp: nowTime(),
    level,
    message,
  };
}

function cloneSnapshot(agents: Agent[], quests: Quest[], llmConfig: LLMConfig): EngineSnapshot {
  return {
    agents: agents.map((a) => ({
      ...a,
      position: { ...a.position },
      targetPosition: a.targetPosition ? { ...a.targetPosition } : null,
      deskPosition: { ...a.deskPosition },
      logs: [...a.logs],
    })),
    quests: quests.map((q) => ({
      ...q,
      subtasks: q.subtasks.map((s) => ({ ...s })),
    })),
    llmConfig: { ...llmConfig },
  };
}

interface ActiveQuestRuntime {
  questId: string;
  phase: 'manager_to_board' | 'planning' | 'executing' | 'synthesizing';
  timer: number;
  llmStarted: boolean;
  llmDone: boolean;
  subtaskTimers: Record<
    string,
    { elapsed: number; duration: number; lastLogStep: number; llmStarted?: boolean }
  >;
}

const ROLE_WORK_PHRASES: Record<AgentRole, string[]> = {
  manager: ['Đang điều phối tiến độ...', 'Kiểm tra kết quả team...', 'Tổng hợp báo cáo cuối...'],
  researcher: ['Đang tìm kiếm dữ liệu...', 'Phân tích yêu cầu cốt lõi...', 'Đối chiếu tài liệu tham khảo...'],
  coder: ['Đang thiết kế kiến trúc...', 'Viết code & xử lý logic...', 'Tối ưu hiệu năng module...'],
  writer: ['Đang phác thảo nội dung...', 'Biên tập câu chữ mượt mà...', 'Hoàn thiện tài liệu hướng dẫn...'],
  reviewer: ['Đang chạy kiểm thử...', 'Rà soát lỗi & edge-cases...', 'Đánh giá chất lượng đầu ra...'],
  custom: ['Đang xử lý chuyên môn...', 'Thực thi tác vụ được giao...', 'Hoàn thiện phần việc...'],
};

export class SimulationEngine implements IAgentEngine {
  private agents: Agent[] = [];
  private quests: Quest[] = [];
  private llmConfig: LLMConfig = { ...DEFAULT_LLM_CONFIG };
  private listeners = new Set<(snapshot: EngineSnapshot) => void>();
  private activeRuntime: ActiveQuestRuntime | null = null;
  private idleWalkCooldown: Record<string, number> = {};

  constructor(initialConfig?: LLMConfig) {
    if (initialConfig) {
      this.llmConfig = { ...initialConfig };
    }
    this.initDefaultTeam();
  }

  private initDefaultTeam(): void {
    const manager: Agent = {
      id: 'agent-manager',
      name: 'Alex',
      role: 'manager',
      roleLabel: 'Manager',
      specialty: 'Phân tích Quest, chia nhỏ công việc & tổng hợp kết quả',
      color: '#f59e0b',
      hairColor: '#1e293b',
      level: 3,
      xp: 40,
      xpToNext: 150,
      tasksDone: 4,
      status: 'idle',
      position: { ...MANAGER_DESK.seatPosition },
      targetPosition: null,
      deskPosition: { ...MANAGER_DESK.seatPosition },
      facing: 'down',
      speechBubble: 'Sẵn sàng nhận Quest mới!',
      speechTimer: 4,
      currentSubtaskId: null,
      logs: [
        makeLog('system', 'Manager Alex đã vào ca làm việc.'),
        makeLog('info', 'Đang chờ nhiệm vụ từ Quest Board...'),
      ],
    };

    const workersSeed: Array<{
      id: string;
      name: string;
      role: AgentRole;
      roleLabel: string;
      specialty: string;
      color: string;
      hairColor: string;
      deskIndex: number;
    }> = [
      {
        id: 'agent-researcher',
        name: 'Nova',
        role: 'researcher',
        roleLabel: 'Researcher',
        specialty: 'Nghiên cứu, thu thập thông tin & phân tích yêu cầu',
        color: '#06b6d4',
        hairColor: '#312e81',
        deskIndex: 0,
      },
      {
        id: 'agent-coder',
        name: 'Kai',
        role: 'coder',
        roleLabel: 'Coder',
        specialty: 'Thiết kế hệ thống, lập trình & tối ưu code',
        color: '#3b82f6',
        hairColor: '#0f172a',
        deskIndex: 1,
      },
      {
        id: 'agent-writer',
        name: 'Lyra',
        role: 'writer',
        roleLabel: 'Writer',
        specialty: 'Soạn thảo nội dung, tài liệu & UX copywriting',
        color: '#a855f7',
        hairColor: '#701a75',
        deskIndex: 2,
      },
      {
        id: 'agent-reviewer',
        name: 'Vex',
        role: 'reviewer',
        roleLabel: 'Reviewer',
        specialty: 'Kiểm thử, review chất lượng & phát hiện lỗi',
        color: '#10b981',
        hairColor: '#14532d',
        deskIndex: 3,
      },
    ];

    const workers: Agent[] = workersSeed.map((w) => {
      const desk = WORKER_DESKS[w.deskIndex];
      return {
        id: w.id,
        name: w.name,
        role: w.role,
        roleLabel: w.roleLabel,
        specialty: w.specialty,
        color: w.color,
        hairColor: w.hairColor,
        level: 1,
        xp: 20,
        xpToNext: 100,
        tasksDone: 1,
        status: 'idle',
        position: { ...desk.seatPosition },
        targetPosition: null,
        deskPosition: { ...desk.seatPosition },
        facing: 'up',
        speechBubble: null,
        speechTimer: 0,
        currentSubtaskId: null,
        logs: [makeLog('system', `${w.roleLabel} ${w.name} đã kết nối tới bàn làm việc.`)],
      };
    });

    this.agents = [manager, ...workers];
  }

  private isRealAIMode(): boolean {
    if (this.llmConfig.provider === 'simulation') return false;
    if (this.llmConfig.provider === 'custom') return true;
    return Boolean(this.llmConfig.apiKey.trim());
  }

  public setLLMConfig(config: LLMConfig): void {
    this.llmConfig = { ...config };
    const manager = this.agents.find((a) => a.role === 'manager');
    if (manager) {
      const modeLabel =
        config.provider === 'simulation'
          ? 'Simulation (Giả lập)'
          : `Real AI (${config.provider.toUpperCase()} - ${config.model})`;
      this.pushLog(manager, 'system', `Đã chuyển chế độ sang: ${modeLabel}`);
    }
    this.emit();
  }

  public getSnapshot(): EngineSnapshot {
    return cloneSnapshot(this.agents, this.quests, this.llmConfig);
  }

  public subscribe(listener: (snapshot: EngineSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  private pushLog(agent: Agent, level: LogEntry['level'], message: string): void {
    agent.logs = [...agent.logs.slice(-49), makeLog(level, message)];
  }

  private setSpeech(agent: Agent, text: string, duration = 3.5): void {
    agent.speechBubble = text;
    agent.speechTimer = duration;
  }

  private awardXp(agent: Agent, amount: number): void {
    agent.xp += amount;
    agent.tasksDone += 1;
    while (agent.xp >= agent.xpToNext) {
      agent.xp -= agent.xpToNext;
      agent.level += 1;
      agent.xpToNext = Math.round(agent.xpToNext * 1.4);
      this.pushLog(agent, 'success', `🎉 LEVEL UP! Đạt cấp độ Lv.${agent.level}`);
      this.setSpeech(agent, `LEVEL UP! Lv.${agent.level} 🎉`, 4);
    }
  }

  public hireAgent(input: HireAgentInput): Agent | null {
    const usedDesksCount = this.agents.filter((a) => a.role !== 'manager').length;
    if (usedDesksCount >= WORKER_DESKS.length) {
      return null;
    }
    const desk = WORKER_DESKS[usedDesksCount];
    const newAgent: Agent = {
      id: uid('agent'),
      name: input.name.trim() || `Agent ${usedDesksCount + 1}`,
      role: 'custom',
      roleLabel: input.roleLabel.trim() || 'Specialist',
      specialty: input.specialty.trim() || 'Hỗ trợ xử lý nhiệm vụ đa năng',
      color: input.color || '#ec4899',
      hairColor: '#1e293b',
      level: 1,
      xp: 0,
      xpToNext: 100,
      tasksDone: 0,
      status: 'idle',
      position: { x: QUEST_BOARD_POS.x, y: QUEST_BOARD_POS.y + 20 },
      targetPosition: { ...desk.seatPosition },
      deskPosition: { ...desk.seatPosition },
      facing: 'down',
      speechBubble: 'Xin chào mọi người!',
      speechTimer: 4,
      currentSubtaskId: null,
      logs: [
        makeLog('system', `Đã tuyển ${input.roleLabel} ${input.name} vào đội hình.`),
        makeLog('action', 'Đang di chuyển tới bàn làm việc mới...'),
      ],
    };
    this.agents.push(newAgent);
    this.emit();
    return newAgent;
  }

  public submitQuest(title: string, description: string): Quest {
    const quest: Quest = {
      id: uid('quest'),
      title: title.trim(),
      description: description.trim(),
      status: 'pending',
      revision: 1,
      feedbackHistory: [],
      createdAt: nowTime(),
      completedAt: null,
      subtasks: [],
      finalOutput: null,
    };

    this.quests = [quest, ...this.quests];

    if (!this.activeRuntime) {
      this.startQuest(quest);
    } else {
      const manager = this.agents.find((a) => a.role === 'manager');
      if (manager) {
        this.pushLog(manager, 'info', `Đã xếp hàng Quest "${quest.title}" (đang xử lý Quest khác).`);
      }
    }

    this.emit();
    return quest;
  }

  public reviseQuest(questId: string, feedback: string): boolean {
    const clean = feedback.trim();
    if (!clean) return false;
    const quest = this.quests.find((q) => q.id === questId);
    if (!quest || quest.status !== 'completed') return false;

    quest.revision += 1;
    quest.feedbackHistory = [...quest.feedbackHistory, clean];
    quest.status = 'pending';
    quest.completedAt = null;

    const manager = this.agents.find((a) => a.role === 'manager');
    if (!this.activeRuntime) {
      this.startQuest(quest);
    } else if (manager) {
      this.pushLog(
        manager,
        'info',
        `Đã xếp hàng chỉnh sửa v${quest.revision} cho "${quest.title}": "${clean}"`
      );
    }

    this.emit();
    return true;
  }

  private startQuest(quest: Quest): void {
    quest.status = 'planning';
    const isRevision = quest.revision > 1;
    const latestFeedback = quest.feedbackHistory[quest.feedbackHistory.length - 1];
    const manager = this.agents.find((a) => a.role === 'manager');
    if (manager) {
      manager.status = 'walking';
      manager.targetPosition = { x: QUEST_BOARD_POS.x, y: QUEST_BOARD_POS.y + 18 };
      this.setSpeech(
        manager,
        isRevision ? `Sếp góp ý (v${quest.revision})! Sửa lại nào...` : 'Có Quest mới! Để xem nào...',
        3.5
      );
      this.pushLog(
        manager,
        'action',
        isRevision
          ? `Nhận yêu cầu chỉnh sửa v${quest.revision} cho "${quest.title}": "${latestFeedback}"`
          : `Nhận Quest mới: "${quest.title}"`
      );
      this.pushLog(manager, 'info', 'Đang di chuyển tới Quest Board để phân tích...');
    }

    this.activeRuntime = {
      questId: quest.id,
      phase: 'manager_to_board',
      timer: 0,
      llmStarted: false,
      llmDone: false,
      subtaskTimers: {},
    };
  }

  private buildFallbackSubtasks(quest: Quest): Subtask[] {
    const workers = this.agents.filter((a) => a.role !== 'manager');
    const revPrefix = quest.revision > 1 ? `[Sửa v${quest.revision}] ` : '';
    return workers.map((worker) => {
      let taskTitle = '';
      switch (worker.role) {
        case 'researcher':
          taskTitle = `${revPrefix}Nghiên cứu & bổ sung dữ liệu cho "${quest.title}"`;
          break;
        case 'coder':
          taskTitle = `${revPrefix}Cập nhật giải pháp kỹ thuật / prototype cho "${quest.title}"`;
          break;
        case 'writer':
          taskTitle = `${revPrefix}Biên tập lại tài liệu & nội dung trình bày`;
          break;
        case 'reviewer':
          taskTitle = `${revPrefix}Kiểm thử & rà soát lại chất lượng`;
          break;
        default:
          taskTitle = `${revPrefix}${worker.roleLabel}: Xử lý phần "${worker.specialty}"`;
          break;
      }

      return {
        id: uid('sub'),
        title: taskTitle,
        assignedAgentId: worker.id,
        assignedAgentName: worker.name,
        assignedRoleLabel: worker.roleLabel,
        status: 'assigned',
        progress: 0,
        output: null,
      };
    });
  }

  private async runManagerPlanLLM(quest: Quest, rt: ActiveQuestRuntime, manager: Agent): Promise<void> {
    const workers = this.agents.filter((a) => a.role !== 'manager');
    const rosterJson = JSON.stringify(
      workers.map((w) => ({
        id: w.id,
        name: w.name,
        role: w.roleLabel,
        specialty: w.specialty,
      }))
    );

    const feedbackNote =
      quest.feedbackHistory.length > 0
        ? `\n\nĐÂY LÀ BẢN CHỈNH SỬA (v${quest.revision}).\nGóp ý từ người dùng cần khắc phục: "${
            quest.feedbackHistory[quest.feedbackHistory.length - 1]
          }"\nKết quả trước đó (tóm tắt): ${(quest.finalOutput || '').slice(0, 600)}`
        : '';

    const systemPrompt =
      'Bạn là Manager điều phối đội ngũ AI Agent. Hãy phân tích nhiệm vụ (và góp ý chỉnh sửa nếu có) để chia thành các subtask cụ thể cho các thành viên phù hợp. Trả lời CHỈ BẰNG JSON array theo định dạng: [{"assignedAgentId":"...","title":"..."}] (bằng tiếng Việt, ngắn gọn rõ ràng).';
    const userPrompt = `Nhiệm vụ: ${quest.title}\nMô tả: ${quest.description}${feedbackNote}\n\nDanh sách Agent hiện có:\n${rosterJson}`;

    try {
      this.pushLog(manager, 'info', `Đang gọi ${this.llmConfig.provider.toUpperCase()} để lập kế hoạch...`);
      const raw = await callLLM(this.llmConfig, systemPrompt, userPrompt);
      const parsed = parseJsonFromLLM<Array<{ assignedAgentId: string; title: string }>>(raw);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const validSubtasks: Subtask[] = [];
        for (const item of parsed) {
          const worker = workers.find((w) => w.id === item.assignedAgentId) ?? workers[validSubtasks.length % workers.length];
          if (worker && item.title) {
            validSubtasks.push({
              id: uid('sub'),
              title: item.title,
              assignedAgentId: worker.id,
              assignedAgentName: worker.name,
              assignedRoleLabel: worker.roleLabel,
              status: 'assigned',
              progress: 0,
              output: null,
            });
          }
        }
        if (validSubtasks.length > 0) {
          quest.subtasks = validSubtasks;
          rt.llmDone = true;
          this.emit();
          return;
        }
      }
      throw new Error('JSON phản hồi không hợp lệ.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.pushLog(manager, 'system', `⚠️ Lỗi AI Planning (${msg}). Dùng kế hoạch mặc định.`);
      quest.subtasks = this.buildFallbackSubtasks(quest);
      rt.llmDone = true;
      this.emit();
    }
  }

  private async runWorkerSubtaskLLM(
    quest: Quest,
    sub: Subtask,
    worker: Agent,
    manager: Agent
  ): Promise<void> {
    const feedbackCtx =
      quest.feedbackHistory.length > 0
        ? `\n\nYêu cầu chỉnh sửa của sếp (v${quest.revision}): "${
            quest.feedbackHistory[quest.feedbackHistory.length - 1]
          }". Hãy cải thiện triệt để theo góp ý này.`
        : '';

    const systemPrompt = `Bạn là ${worker.name}, giữ vai trò ${worker.roleLabel}. Chuyên môn: ${worker.specialty}. Hãy thực hiện phần việc được giao một cách chuyên nghiệp, súc tích và hữu ích bằng tiếng Việt.`;
    const userPrompt = `Quest tổng thể: "${quest.title}"\nMô tả Quest: ${quest.description}${feedbackCtx}\n\nNhiệm vụ riêng của bạn: ${sub.title}`;

    try {
      this.pushLog(worker, 'info', `Đang gọi AI (${this.llmConfig.model}) xử lý subtask...`);
      const result = await callLLM(this.llmConfig, systemPrompt, userPrompt);
      sub.output = result.trim();
      sub.progress = 100;
      sub.status = 'completed';
      this.pushLog(worker, 'success', `AI trả về kết quả (${sub.output.length} ký tự).`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      sub.output = `[Lỗi gọi API: ${msg}]`;
      sub.progress = 100;
      sub.status = 'completed';
      this.pushLog(worker, 'system', `⚠️ Lỗi AI: ${msg}`);
      this.setSpeech(worker, 'Lỗi API rồi!', 3);
    }

    worker.currentSubtaskId = null;
    worker.status = 'reporting';
    const meetPt = MEETING_POINTS[Math.floor(Math.random() * MEETING_POINTS.length)];
    worker.targetPosition = { ...meetPt };
    this.setSpeech(worker, 'Xong việc rồi sếp ơi!', 3);
    this.awardXp(worker, 45);
    this.pushLog(manager, 'info', `${worker.name} đã báo cáo hoàn thành subtask.`);
    this.emit();
  }

  private async runManagerSynthesizeLLM(
    quest: Quest,
    rt: ActiveQuestRuntime,
    manager: Agent
  ): Promise<void> {
    const reports = quest.subtasks
      .map((s, i) => `### ${i + 1}. ${s.assignedAgentName} (${s.assignedRoleLabel}) — ${s.title}\n${s.output || ''}`)
      .join('\n\n');

    const feedbackNote =
      quest.feedbackHistory.length > 0
        ? `\nLưu ý chỉnh sửa từ người dùng (v${quest.revision}): "${
            quest.feedbackHistory[quest.feedbackHistory.length - 1]
          }"`
        : '';

    const systemPrompt =
      'Bạn là Manager tổng hợp báo cáo từ các AI Agent chuyên môn. Hãy tổng hợp các phần việc thành một kết quả hoàn chỉnh, mạch lạc, rõ ràng bằng tiếng Việt.';
    const userPrompt = `Quest: "${quest.title}"\nMô tả: ${quest.description}${feedbackNote}\n\nBáo cáo từ team:\n${reports}`;

    try {
      this.pushLog(manager, 'info', 'Đang gọi AI tổng hợp kết quả cuối cùng...');
      const finalText = await callLLM(this.llmConfig, systemPrompt, userPrompt);
      quest.finalOutput = finalText.trim();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.pushLog(manager, 'system', `⚠️ Lỗi tổng hợp AI (${msg}). Hiển thị báo cáo ghép.`);
      quest.finalOutput = reports;
    }

    rt.llmDone = true;
    this.emit();
  }

  private dispatchWorkers(quest: Quest, rt: ActiveQuestRuntime, manager: Agent): void {
    quest.status = 'in_progress';
    rt.phase = 'executing';
    rt.timer = 0;

    manager.targetPosition = { ...manager.deskPosition };
    manager.status = 'walking';
    this.setSpeech(manager, `Đã giao ${quest.subtasks.length} subtask cho team!`, 3.5);
    this.pushLog(
      manager,
      'success',
      `Đã phân công ${quest.subtasks.length} subtask cho các Agent chuyên môn.`
    );

    quest.subtasks.forEach((sub, idx) => {
      const worker = this.agents.find((a) => a.id === sub.assignedAgentId);
      if (worker) {
        worker.currentSubtaskId = sub.id;
        worker.targetPosition = { ...worker.deskPosition };
        worker.status = 'walking';
        sub.status = 'working';
        this.setSpeech(worker, 'Nhận lệnh! Về bàn làm ngay.', 3);
        this.pushLog(worker, 'action', `Nhận subtask từ Manager: "${sub.title}"`);
        rt.subtaskTimers[sub.id] = {
          elapsed: 0,
          duration: 4.5 + idx * 1.1 + Math.random() * 1.5,
          lastLogStep: 0,
          llmStarted: false,
        };
      }
    });
  }

  public tick(dtSeconds: number): void {
    let changed = false;

    // 1. Update movement & speech bubble timers for all agents
    for (const agent of this.agents) {
      if (agent.speechTimer > 0) {
        agent.speechTimer = Math.max(0, agent.speechTimer - dtSeconds);
        if (agent.speechTimer === 0 && agent.speechBubble !== null) {
          agent.speechBubble = null;
          changed = true;
        }
      }

      if (agent.targetPosition) {
        const dx = agent.targetPosition.x - agent.position.x;
        const dy = agent.targetPosition.y - agent.position.y;
        const dist = Math.hypot(dx, dy);
        const speed = 78;

        if (dist <= speed * dtSeconds || dist < 1.5) {
          agent.position.x = agent.targetPosition.x;
          agent.position.y = agent.targetPosition.y;
          agent.targetPosition = null;
          if (agent.status === 'walking') {
            agent.status = agent.currentSubtaskId ? 'working' : 'idle';
          }
          changed = true;
        } else {
          const step = speed * dtSeconds;
          agent.position.x += (dx / dist) * step;
          agent.position.y += (dy / dist) * step;
          if (Math.abs(dx) > Math.abs(dy)) {
            agent.facing = dx > 0 ? 'right' : 'left';
          } else {
            agent.facing = dy > 0 ? 'down' : 'up';
          }
          if (agent.status !== 'walking') {
            agent.status = 'walking';
          }
          changed = true;
        }
      } else if (agent.status === 'idle' && !this.activeRuntime) {
        this.idleWalkCooldown[agent.id] =
          (this.idleWalkCooldown[agent.id] ?? 4 + Math.random() * 6) - dtSeconds;
        if (this.idleWalkCooldown[agent.id] <= 0) {
          this.idleWalkCooldown[agent.id] = 6 + Math.random() * 8;
          const goLounge = Math.random() < 0.45;
          if (goLounge) {
            const pt = LOUNGE_POINTS[Math.floor(Math.random() * LOUNGE_POINTS.length)];
            agent.targetPosition = { ...pt };
            agent.status = 'walking';
          } else {
            agent.targetPosition = { ...agent.deskPosition };
            agent.status = 'walking';
          }
          changed = true;
        }
      }
    }

    // 2. Update active quest state machine
    if (this.activeRuntime) {
      const rt = this.activeRuntime;
      const quest = this.quests.find((q) => q.id === rt.questId);
      const manager = this.agents.find((a) => a.role === 'manager');
      const useRealAI = this.isRealAIMode();

      if (quest && manager) {
        rt.timer += dtSeconds;

        if (rt.phase === 'manager_to_board') {
          if (!manager.targetPosition) {
            rt.phase = 'planning';
            rt.timer = 0;
            rt.llmStarted = false;
            rt.llmDone = false;
            manager.status = 'thinking';
            this.setSpeech(manager, 'Đang chia nhỏ công việc...', 3);
            this.pushLog(manager, 'action', 'Phân tích phạm vi nhiệm vụ & năng lực từng Agent...');
            changed = true;
          }
        } else if (rt.phase === 'planning') {
          if (useRealAI) {
            if (!rt.llmStarted) {
              rt.llmStarted = true;
              void this.runManagerPlanLLM(quest, rt, manager);
            }
            if (rt.llmDone) {
              this.dispatchWorkers(quest, rt, manager);
              changed = true;
            }
          } else if (rt.timer >= 2.2) {
            quest.subtasks = this.buildFallbackSubtasks(quest);
            this.dispatchWorkers(quest, rt, manager);
            changed = true;
          }
        } else if (rt.phase === 'executing') {
          let allDone = true;

          for (const sub of quest.subtasks) {
            if (sub.status === 'completed') continue;
            allDone = false;

            const worker = this.agents.find((a) => a.id === sub.assignedAgentId);
            const timerInfo = rt.subtaskTimers[sub.id];
            if (!worker || !timerInfo) continue;

            if (!worker.targetPosition) {
              worker.status = 'working';
              timerInfo.elapsed += dtSeconds;

              if (useRealAI) {
                if (!timerInfo.llmStarted) {
                  timerInfo.llmStarted = true;
                  this.setSpeech(worker, 'Đang gọi AI xử lý...', 4);
                  void this.runWorkerSubtaskLLM(quest, sub, worker, manager);
                }
                const creepingPct = Math.min(92, Math.round((timerInfo.elapsed / 8) * 92));
                if (creepingPct > sub.progress) {
                  sub.progress = creepingPct;
                  changed = true;
                }
              } else {
                const pct = Math.min(100, Math.round((timerInfo.elapsed / timerInfo.duration) * 100));
                if (pct !== sub.progress) {
                  sub.progress = pct;
                  changed = true;
                }

                const phrases = ROLE_WORK_PHRASES[worker.role] || ROLE_WORK_PHRASES.custom;
                const step = Math.floor((pct / 100) * 3);
                if (step > timerInfo.lastLogStep && step <= 2) {
                  timerInfo.lastLogStep = step;
                  const phrase = phrases[step % phrases.length];
                  this.setSpeech(worker, phrase, 2.5);
                  this.pushLog(worker, 'info', `[${pct}%] ${phrase}`);
                  changed = true;
                }

                if (timerInfo.elapsed >= timerInfo.duration) {
                  sub.status = 'completed';
                  sub.progress = 100;
                  sub.output = `Hoàn thành "${sub.title}" bởi ${worker.name} (${worker.roleLabel}).`;
                  worker.currentSubtaskId = null;
                  worker.status = 'reporting';
                  const meetPt = MEETING_POINTS[Math.floor(Math.random() * MEETING_POINTS.length)];
                  worker.targetPosition = { ...meetPt };
                  this.setSpeech(worker, 'Xong việc rồi sếp ơi!', 3);
                  this.pushLog(worker, 'success', `Hoàn thành subtask (+45 XP). Đang báo cáo Manager.`);
                  this.awardXp(worker, 45);
                  this.pushLog(manager, 'info', `${worker.name} đã báo cáo hoàn thành subtask.`);
                  changed = true;
                }
              }
            }
          }

          if (allDone) {
            quest.status = 'reviewing';
            rt.phase = 'synthesizing';
            rt.timer = 0;
            rt.llmStarted = false;
            rt.llmDone = false;
            manager.status = 'thinking';
            this.setSpeech(manager, 'Team làm tốt lắm! Đang tổng hợp...', 3);
            this.pushLog(manager, 'action', 'Tất cả subtask đã xong. Đang tổng hợp kết quả cuối...');
            changed = true;
          }
        } else if (rt.phase === 'synthesizing') {
          let readyToComplete = false;
          if (useRealAI) {
            if (!rt.llmStarted) {
              rt.llmStarted = true;
              void this.runManagerSynthesizeLLM(quest, rt, manager);
            }
            readyToComplete = rt.llmDone;
          } else if (rt.timer >= 2.2) {
            const revLine =
              quest.revision > 1
                ? `Phiên bản chỉnh sửa: v${quest.revision} (Theo góp ý: "${
                    quest.feedbackHistory[quest.feedbackHistory.length - 1]
                  }")`
                : 'Phiên bản: v1';
            quest.finalOutput = [
              `✅ KẾT QUẢ TỔNG HỢP QUEST: "${quest.title}"`,
              `Quản lý điều phối: ${manager.name} (Lv.${manager.level}) · ${revLine}`,
              `----------------------------------------`,
              ...quest.subtasks.map(
                (s, i) => `${i + 1}. [${s.assignedRoleLabel} - ${s.assignedAgentName}]: ${s.output}`
              ),
              `----------------------------------------`,
              `Tất cả đầu mục đã được kiểm duyệt và sẵn sàng bàn giao!`,
            ].join('\n');
            readyToComplete = true;
          }

          if (readyToComplete) {
            quest.status = 'completed';
            quest.completedAt = nowTime();
            manager.status = 'done';
            this.setSpeech(manager, 'Quest hoàn thành 100%! 🏆', 4);
            this.pushLog(manager, 'success', `Đã bàn giao Quest "${quest.title}" (+60 XP).`);
            this.awardXp(manager, 60);

            for (const agent of this.agents) {
              if (agent.role !== 'manager') {
                agent.status = 'walking';
                agent.targetPosition = { ...agent.deskPosition };
              }
            }

            this.activeRuntime = null;
            changed = true;

            const nextPending = this.quests.find((q) => q.status === 'pending');
            if (nextPending) {
              this.startQuest(nextPending);
            }
          }
        }
      }
    }

    if (changed) {
      this.emit();
    }
  }
}
