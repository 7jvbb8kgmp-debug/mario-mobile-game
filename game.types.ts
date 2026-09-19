/**
 * Shared game types for the mobile platform game.
 *
 * The browser game currently runs from index.html. These types are kept
 * separately so the game can be migrated to TypeScript later without
 * changing the shape of its game data.
 */

export type Direction = -1 | 1;

export type ControlName = "left" | "right" | "jump";

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LevelBlock extends Rectangle {}

export interface Goal extends Rectangle {}

export interface Coin {
  x: number;
  y: number;
  r: number;
  collected: boolean;
}

export interface Enemy extends Rectangle {
  minX: number;
  maxX: number;
  dir: Direction;
  speed: number;
  alive: boolean;
}

export interface Player extends Rectangle {
  vx: number;
  vy: number;
  speed: number;
  jumpPower: number;
  onGround: boolean;
  facing: Direction;
  coins: number;
  lives: number;
}

export interface TouchState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface GameState {
  cameraX: number;
  gameWon: boolean;
  message: string;
  player: Player;
  blocks: LevelBlock[];
  coins: Coin[];
  enemies: Enemy[];
  goal: Goal;
}
