/**
 * Drives a level's spawn timeline. Holds an internal clock and fires each cue
 * once its timestamp is reached. Pure scheduling — it knows nothing about how
 * enemies are spawned; the LevelApi passed to update() does the work.
 */
import { Cue, LevelApi } from '../levels/types';

export class WaveDirector {
  private cues: Cue[];
  private clock = 0;
  private idx = 0;

  constructor(cues: Cue[]) {
    this.cues = [...cues].sort((a, b) => a.t - b.t);
  }

  update(dtMs: number, api: LevelApi): void {
    this.clock += dtMs;
    while (this.idx < this.cues.length && this.cues[this.idx].t <= this.clock) {
      this.cues[this.idx].fn(api);
      this.idx++;
    }
  }

  /** True once every cue has fired (the boss can then be cued in). */
  get finished(): boolean {
    return this.idx >= this.cues.length;
  }

  get clockMs(): number {
    return this.clock;
  }

  /** Timestamp of the final cue — handy for progress display. */
  get lastCueAt(): number {
    return this.cues.length ? this.cues[this.cues.length - 1].t : 0;
  }
}
