import { Vector2 } from '../types/agent';

export const TILE_SIZE = 32;
export const MAP_COLS = 24;
export const MAP_ROWS = 15;
export const CANVAS_WIDTH = MAP_COLS * TILE_SIZE; // 768
export const CANVAS_HEIGHT = MAP_ROWS * TILE_SIZE; // 480

export interface DeskSlot {
  id: string;
  label: string;
  tileX: number;
  tileY: number;
  seatPosition: Vector2; // pixel center where agent sits/stands
}

export const MANAGER_DESK: DeskSlot = {
  id: 'desk-manager',
  label: 'Manager Desk',
  tileX: 4,
  tileY: 3,
  seatPosition: { x: 4.5 * TILE_SIZE, y: 4.3 * TILE_SIZE },
};

export const QUEST_BOARD_POS: Vector2 = {
  x: 12 * TILE_SIZE,
  y: 3.1 * TILE_SIZE,
};

export const MEETING_POINTS: Vector2[] = [
  { x: 11.5 * TILE_SIZE, y: 4.5 * TILE_SIZE },
  { x: 13.5 * TILE_SIZE, y: 4.5 * TILE_SIZE },
  { x: 12.5 * TILE_SIZE, y: 3.6 * TILE_SIZE },
];

export const LOUNGE_POINTS: Vector2[] = [
  { x: 19 * TILE_SIZE, y: 4 * TILE_SIZE },
  { x: 20.5 * TILE_SIZE, y: 4.2 * TILE_SIZE },
  { x: 18 * TILE_SIZE, y: 3.2 * TILE_SIZE },
];

export const WORKER_DESKS: DeskSlot[] = [
  {
    id: 'desk-1',
    label: 'Research Desk',
    tileX: 4,
    tileY: 8,
    seatPosition: { x: 4.5 * TILE_SIZE, y: 9.2 * TILE_SIZE },
  },
  {
    id: 'desk-2',
    label: 'Dev Desk',
    tileX: 9,
    tileY: 8,
    seatPosition: { x: 9.5 * TILE_SIZE, y: 9.2 * TILE_SIZE },
  },
  {
    id: 'desk-3',
    label: 'Writer Desk',
    tileX: 14,
    tileY: 8,
    seatPosition: { x: 14.5 * TILE_SIZE, y: 9.2 * TILE_SIZE },
  },
  {
    id: 'desk-4',
    label: 'QA Desk',
    tileX: 19,
    tileY: 8,
    seatPosition: { x: 19.5 * TILE_SIZE, y: 9.2 * TILE_SIZE },
  },
  // Extra slots for hired custom agents
  {
    id: 'desk-5',
    label: 'Custom Desk 1',
    tileX: 4,
    tileY: 12,
    seatPosition: { x: 4.5 * TILE_SIZE, y: 13.2 * TILE_SIZE },
  },
  {
    id: 'desk-6',
    label: 'Custom Desk 2',
    tileX: 9,
    tileY: 12,
    seatPosition: { x: 9.5 * TILE_SIZE, y: 13.2 * TILE_SIZE },
  },
  {
    id: 'desk-7',
    label: 'Custom Desk 3',
    tileX: 14,
    tileY: 12,
    seatPosition: { x: 14.5 * TILE_SIZE, y: 13.2 * TILE_SIZE },
  },
  {
    id: 'desk-8',
    label: 'Custom Desk 4',
    tileX: 19,
    tileY: 12,
    seatPosition: { x: 19.5 * TILE_SIZE, y: 13.2 * TILE_SIZE },
  },
];
