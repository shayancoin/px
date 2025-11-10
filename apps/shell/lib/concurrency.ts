export class Semaphore {
  #capacity: number;
  #inFlight = 0;
  #queue: Array<() => void> = [];

  constructor(capacity: number) {
    if (capacity <= 0 || !Number.isFinite(capacity)) {
      throw new Error("Semaphore capacity must be a positive finite number.");
    }
    this.#capacity = capacity;
  }

  async acquire(): Promise<() => void> {
    if (this.#inFlight < this.#capacity) {
      this.#inFlight += 1;
      return () => this.#release();
    }

    return new Promise((resolve) => {
      this.#queue.push(() => {
        this.#inFlight += 1;
        resolve(() => this.#release());
      });
    });
  }

  #release() {
    this.#inFlight = Math.max(this.#inFlight - 1, 0);
    const next = this.#queue.shift();
    if (next) {
      next();
    }
  }
}

export async function runWithSemaphore<T>(
  semaphore: Semaphore,
  task: () => Promise<T>,
): Promise<T> {
  const release = await semaphore.acquire();
  try {
    return await task();
  } finally {
    release();
  }
}



