import { Agent } from '../types/agent';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MANAGER_DESK,
  MAP_COLS,
  MAP_ROWS,
  TILE_SIZE,
  WORKER_DESKS,
} from './officeMap';

export function drawOfficeBackground(ctx: CanvasRenderingContext2D, timeSec: number): void {
  // Base wooden floor
  ctx.fillStyle = '#2a211b';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      const isAlt = (row + col) % 2 === 0;

      // Top wall (row 0..1)
      if (row < 2) {
        ctx.fillStyle = row === 0 ? '#1e293b' : '#334155';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        if (row === 1) {
          ctx.fillStyle = '#475569';
          ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);
        }
        continue;
      }

      // Floor plank checkerboard
      ctx.fillStyle = isAlt ? '#3b2e25' : '#352921';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x, y + TILE_SIZE - 1, TILE_SIZE, 1);
    }
  }

  // Windows on top wall
  [3, 7, 16, 20].forEach((col) => {
    const wx = col * TILE_SIZE + 4;
    const wy = 10;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(wx - 2, wy - 2, TILE_SIZE * 2 - 4, 28);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(wx, wy, TILE_SIZE * 2 - 8, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(wx + 4, wy + 3, 10, 18);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(wx + TILE_SIZE - 5, wy, 2, 24);
  });

  // Manager's Office Rug (top-left)
  drawRug(ctx, 2, 2.3, 6, 3.5, '#4c1d95', '#7c3aed', 'MANAGER ZONE');

  // Quest & Briefing Rug (top-center)
  drawRug(ctx, 10, 2.3, 6, 3.5, '#1e3a8a', '#3b82f6', 'QUEST BOARD');

  // Lounge Rug (top-right)
  drawRug(ctx, 17.5, 2.3, 5.5, 3.5, '#064e3b', '#10b981', 'LOUNGE');

  // Zone label for Team Workspace
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = 'bold 9px "Press Start 2P", monospace';
  ctx.fillText('TEAM WORKSPACE', 24, 6.9 * TILE_SIZE);

  // Draw Quest Board on wall at (11.5, 1.2)
  const qx = 11.2 * TILE_SIZE;
  const qy = 14;
  ctx.fillStyle = '#78350f';
  ctx.fillRect(qx - 3, qy - 3, 58, 38);
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(qx, qy, 52, 32);
  // Pinned quest notes
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(qx + 5, qy + 5, 12, 10);
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(qx + 21, qy + 6, 14, 10);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(qx + 38, qy + 5, 10, 12);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(qx + 10, qy + 18, 16, 10);

  // Draw Meeting Table in Quest zone
  drawTable(ctx, 12.1 * TILE_SIZE, 4.1 * TILE_SIZE, 54, 24, '#7c5338');

  // Draw Lounge Sofa & Coffee Machine
  // Coffee machine
  ctx.fillStyle = '#334155';
  ctx.fillRect(21.4 * TILE_SIZE, 2.1 * TILE_SIZE, 22, 26);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(21.4 * TILE_SIZE + 6, 2.1 * TILE_SIZE + 6, 4, 4);
  // Sofa
  ctx.fillStyle = '#be123c';
  ctx.fillRect(18.3 * TILE_SIZE, 2.4 * TILE_SIZE, 64, 22);
  ctx.fillStyle = '#fb7185';
  ctx.fillRect(18.3 * TILE_SIZE + 4, 2.4 * TILE_SIZE + 4, 26, 14);
  ctx.fillRect(18.3 * TILE_SIZE + 34, 2.4 * TILE_SIZE + 4, 26, 14);

  // Decorative Potted Plants
  drawPlant(ctx, 1.3 * TILE_SIZE, 2.4 * TILE_SIZE);
  drawPlant(ctx, 22.3 * TILE_SIZE, 5.1 * TILE_SIZE);
  drawPlant(ctx, 1.3 * TILE_SIZE, 13.3 * TILE_SIZE);
  drawPlant(ctx, 22.3 * TILE_SIZE, 13.3 * TILE_SIZE);

  // Manager Desk
  drawDesk(ctx, MANAGER_DESK.tileX * TILE_SIZE, MANAGER_DESK.tileY * TILE_SIZE, true, timeSec, true);

  // Worker Desks
  WORKER_DESKS.forEach((desk, idx) => {
    const isDefaultOccupied = idx < 4;
    drawDesk(ctx, desk.tileX * TILE_SIZE, desk.tileY * TILE_SIZE, isDefaultOccupied, timeSec, false);
  });
}

function drawRug(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  tw: number,
  th: number,
  fill: string,
  border: string,
  label: string
): void {
  const x = tx * TILE_SIZE;
  const y = ty * TILE_SIZE;
  const w = tw * TILE_SIZE;
  const h = th * TILE_SIZE;

  ctx.fillStyle = fill;
  ctx.globalAlpha = 0.45;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = 'bold 8px "Press Start 2P", monospace';
  ctx.fillText(label, x + 8, y + h - 8);
}

function drawTable(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 2, y + 4, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x + 2, y + 2, w - 4, 4);
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // Pot
  ctx.fillStyle = '#9a3412';
  ctx.fillRect(x + 6, y + 14, 14, 12);
  ctx.fillStyle = '#c2410c';
  ctx.fillRect(x + 4, y + 12, 18, 4);
  // Leaves
  ctx.fillStyle = '#15803d';
  ctx.fillRect(x + 4, y + 2, 18, 12);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x + 7, y, 12, 8);
}

function drawDesk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hasComputer: boolean,
  timeSec: number,
  isManager: boolean
): void {
  const w = 44;
  const h = 24;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fillRect(x - 4, y + 4, w, h);

  // Desk top
  ctx.fillStyle = isManager ? '#78350f' : '#854d0e';
  ctx.fillRect(x - 6, y, w, h);
  ctx.fillStyle = isManager ? '#b45309' : '#a16207';
  ctx.fillRect(x - 4, y + 2, w - 4, h - 6);

  if (hasComputer) {
    // Monitor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 6, y - 6, 20, 14);
    const glow = Math.sin(timeSec * 4) * 0.15 + 0.85;
    ctx.fillStyle = isManager
      ? `rgba(251, 191, 36, ${glow})`
      : `rgba(56, 189, 248, ${glow})`;
    ctx.fillRect(x + 8, y - 4, 16, 10);
    // Stand
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 14, y + 8, 4, 4);
    // Keyboard
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 8, y + 14, 16, 5);
  }
}

export function drawAgentSprite(
  ctx: CanvasRenderingContext2D,
  agent: Agent,
  isSelected: boolean,
  isHovered: boolean,
  timeSec: number
): void {
  const x = Math.round(agent.position.x);
  const y = Math.round(agent.position.y);
  const isWalking = agent.status === 'walking';
  const isWorking = agent.status === 'working' || agent.status === 'thinking';

  const walkBob = isWalking ? Math.sin(timeSec * 14) * 2 : 0;
  const workBob = isWorking ? Math.sin(timeSec * 10) * 1 : 0;
  const bodyY = y + walkBob + workBob;

  // Selection or hover ring
  if (isSelected || isHovered) {
    ctx.strokeStyle = isSelected ? '#fbbf24' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 13, y - 22, 26, 32);
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (animated when walking)
  const legOffset = isWalking ? Math.sin(timeSec * 14) * 2.5 : 0;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 5, y + 2 + legOffset, 4, 6);
  ctx.fillRect(x + 1, y + 2 - legOffset, 4, 6);

  // Body / Shirt
  ctx.fillStyle = agent.color;
  ctx.fillRect(x - 7, bodyY - 8, 14, 11);
  // Shirt shading
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x - 7, bodyY, 14, 3);

  // Arms
  const armWave = isWorking ? Math.sin(timeSec * 16) * 1.5 : 0;
  ctx.fillStyle = agent.color;
  ctx.fillRect(x - 10, bodyY - 7 + armWave, 3, 8);
  ctx.fillRect(x + 7, bodyY - 7 - armWave, 3, 8);

  // Head
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(x - 6, bodyY - 19, 12, 11);

  // Hair
  ctx.fillStyle = agent.hairColor;
  ctx.fillRect(x - 7, bodyY - 21, 14, 5);
  ctx.fillRect(x - 7, bodyY - 18, 2, 4);
  ctx.fillRect(x + 5, bodyY - 18, 2, 4);

  // Eyes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 3, bodyY - 14, 2, 2);
  ctx.fillRect(x + 2, bodyY - 14, 2, 2);

  // Role Accessory
  if (agent.role === 'manager') {
    // Gold crown/star indicator
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x - 4, bodyY - 24, 8, 3);
    ctx.fillRect(x - 2, bodyY - 26, 4, 2);
  } else if (agent.role === 'coder') {
    // Headphones
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x - 8, bodyY - 17, 2, 6);
    ctx.fillRect(x + 6, bodyY - 17, 2, 6);
  }

  // Name & Level Tag below character
  const tagText = `${agent.name} Lv.${agent.level}`;
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  const textW = ctx.measureText(tagText).width;
  ctx.fillStyle = 'rgba(13, 17, 23, 0.82)';
  ctx.fillRect(x - textW / 2 - 4, y + 12, textW + 8, 14);
  ctx.fillStyle = agent.role === 'manager' ? '#fbbf24' : '#e2e8f0';
  ctx.fillText(tagText, x - textW / 2, y + 22);

  // Status dot next to name
  const statusColor =
    agent.status === 'working'
      ? '#38bdf8'
      : agent.status === 'thinking'
        ? '#f59e0b'
        : agent.status === 'reporting'
          ? '#a855f7'
          : agent.status === 'done'
            ? '#22c55e'
            : '#64748b';
  ctx.fillStyle = statusColor;
  ctx.fillRect(x - textW / 2 - 10, y + 16, 5, 5);
}

export function drawSpeechBubble(ctx: CanvasRenderingContext2D, agent: Agent): void {
  if (!agent.speechBubble) return;

  const x = Math.round(agent.position.x);
  const y = Math.round(agent.position.y) - 34;

  ctx.font = '600 10px "Inter", sans-serif';
  const maxW = 170;
  let text = agent.speechBubble;
  if (ctx.measureText(text).width > maxW) {
    while (text.length > 4 && ctx.measureText(text + '…').width > maxW) {
      text = text.slice(0, -1);
    }
    text += '…';
  }

  const textW = ctx.measureText(text).width;
  const padX = 8;
  const boxW = textW + padX * 2;
  const boxH = 20;
  const boxX = Math.max(6, Math.min(CANVAS_WIDTH - boxW - 6, x - boxW / 2));
  const boxY = Math.max(4, y - boxH);

  // Bubble background
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Pointer triangle
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 3, boxY + boxH - 1, 6, 4);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 1, boxY + boxH + 3, 2, 2);

  // Text
  ctx.fillStyle = '#0f172a';
  ctx.fillText(text, boxX + padX, boxY + 13);
}
