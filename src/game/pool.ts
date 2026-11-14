export class ObjectPool<T> {
  private pool: T[] = [];
  private readonly factory: () => T;
  private readonly resetFn: (item: T) => void;
  private readonly maxSize: number;

  constructor(factory: () => T, resetFn: (item: T) => void, initialSize = 64, maxSize = 1500) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(item: T): void {
    this.resetFn(item);
    if (this.pool.length < this.maxSize) {
      this.pool.push(item);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }
}
