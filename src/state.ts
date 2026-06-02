/**
 * Run state shared across scenes (menu → game → game-over → …).
 *
 * A plain module singleton keeps this simple and fully typed, versus stuffing
 * everything through Phaser's registry. Hi-score persists in localStorage.
 */
import { PLAYER } from './config';
import { getShip, ShipId } from './ships';

const HISCORE_KEY = 'starfall.hiscore';
const MUTE_KEY = 'starfall.muted';
const SHIP_KEY = 'starfall.ship';

export interface RunState {
  /** Current level index, 0..2. */
  level: number;
  /** Level the run started at (for practice mode / scoring context). */
  startLevel: number;
  score: number;
  hiScore: number;
  lives: number;
  bombs: number;
  continues: number;
  powerLevel: number;
  /** Practice mode = pick any level, unlimited continues, no leaderboard pride. */
  practice: boolean;
  /** Whether any continue has been spent this run (kills the 1CC accolade & clean bonus). */
  usedContinueThisRun: boolean;
  muted: boolean;
  /** The fighter the player picked (drives stats, art, lives/bombs). */
  shipId: ShipId;
  /** Total enemies destroyed this run (stats / results screen). */
  kills: number;
  /** Best combo reached this run. */
  bestCombo: number;
}

function loadHiScore(): number {
  const raw = localStorage.getItem(HISCORE_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function loadMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === '1';
}

function loadShip(): ShipId {
  const raw = localStorage.getItem(SHIP_KEY) as ShipId | null;
  return raw === 'bifang' || raw === 'qiongqi' ? raw : 'qingluan';
}

export const run: RunState = {
  level: 0,
  startLevel: 0,
  score: 0,
  hiScore: loadHiScore(),
  lives: PLAYER.startLives,
  bombs: PLAYER.startBombs,
  continues: PLAYER.startContinues,
  powerLevel: PLAYER.minPowerLevel,
  practice: false,
  usedContinueThisRun: false,
  muted: loadMuted(),
  shipId: loadShip(),
  kills: 0,
  bestCombo: 0,
};

/** Choose the active fighter (persists so it sticks across sessions). */
export function setShip(id: ShipId): void {
  run.shipId = id;
  localStorage.setItem(SHIP_KEY, id);
}

/** Begin a fresh run (Normal or Practice). Lives/bombs come from the ship. */
export function startRun(practice: boolean, startLevel: number): void {
  const ship = getShip(run.shipId);
  run.practice = practice;
  run.startLevel = startLevel;
  run.level = startLevel;
  run.score = 0;
  run.lives = ship.lives;
  run.bombs = ship.bombs;
  run.continues = practice ? 99 : PLAYER.startContinues;
  run.powerLevel = PLAYER.minPowerLevel;
  run.usedContinueThisRun = false;
  run.kills = 0;
  run.bestCombo = 0;
}

/** Spend a continue: refill lives/bombs, keep score, flag the run as continued. */
export function useContinue(): void {
  const ship = getShip(run.shipId);
  run.continues = Math.max(0, run.continues - 1);
  run.lives = ship.lives;
  run.bombs = ship.bombs;
  run.powerLevel = PLAYER.minPowerLevel;
  run.usedContinueThisRun = true;
}

export function commitHiScore(): boolean {
  if (run.score > run.hiScore) {
    run.hiScore = run.score;
    localStorage.setItem(HISCORE_KEY, String(run.hiScore));
    return true;
  }
  return false;
}

export function setMuted(m: boolean): void {
  run.muted = m;
  localStorage.setItem(MUTE_KEY, m ? '1' : '0');
}
