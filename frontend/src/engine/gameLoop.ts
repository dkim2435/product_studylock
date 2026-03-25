// Frame-based game loop with delta time
// Reference: pixel-agents gameLoop.ts

export class GameLoop {
  private callback: (deltaTime: number) => void;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  constructor(callback: (deltaTime: number) => void) {
    this.callback = callback;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Cap delta time to prevent huge jumps (e.g., after tab switch)
    const cappedDelta = Math.min(deltaTime, 0.1);
    this.callback(cappedDelta);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
