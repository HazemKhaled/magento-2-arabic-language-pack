import { GenericObject } from 'moleculer';

const FRAME_RATE = 1000 / 60;

/**
 * Timer class
 */
export default class Timer {
  interval: ReturnType<typeof setTimeout>;
  initTime: number;
  remainingTime: number;
  events: GenericObject;
  /**
   *
   * @param {*} time // time in ms
   */
  constructor(time: number) {
    this.initTime = time;
    this.remainingTime = time;
    this.events = {
      play: [],
      pause: [],
      stop: [],
      interval: [],
    };
    this.intervalFunction = this.intervalFunction.bind(this);
  }

  /**
   * Interval Function
   */
  intervalFunction(): void {
    if (this.remainingTime <= 0) {
      this.stop();
      return;
    }
    this.remainingTime -= FRAME_RATE;
    this.events.interval.forEach((cb: (time: number) => unknown) =>
      cb(this.remainingTime)
    );
  }

  /**
   * Start Timer
   */
  play(): void {
    this.interval = setInterval(this.intervalFunction, FRAME_RATE);
    this.events.play.forEach((cb: () => unknown) => cb());
  }

  /**
   * pause Timer
   */
  pause(): void {
    clearInterval(this.interval);
    this.events.pause.forEach((cb: () => unknown) => cb());
  }

  /**
   * Stop Timer
   */
  stop(): void {
    this.remainingTime = 0;
    clearInterval(this.interval);
    this.events.stop.forEach((cb: () => unknown) => cb());
  }

  /**
   * Destroy Timer
   */
  destroy(): void {
    this.remainingTime = 0;
    clearInterval(this.interval);
  }

  /**
   * Events
   */
  on(eventName: string, callback: () => unknown): void {
    if (eventName in this.events) {
      this.events[eventName].push(callback);
    }
  }
}
