/**
 * 實驗：Proxy 包裝的持久化數據結構
 *
 * 目標：結合兩者優點
 * - 外部：原生數組 API (Craft 的優勢)
 * - 內部：持久化結構 (Pura 的優勢)
 */

// 簡化的持久化列表（實際應該用 Pura IList）
class PersistentList<T> {
  constructor(private readonly items: readonly T[]) {}

  get(index: number): T | undefined {
    return this.items[index];
  }

  get length(): number {
    return this.items.length;
  }

  push(...values: T[]): PersistentList<T> {
    // O(n) for demo, 實際用 IList 是 O(log n)
    return new PersistentList([...this.items, ...values]);
  }

  set(index: number, value: T): PersistentList<T> {
    const newItems = [...this.items];
    newItems[index] = value;
    return new PersistentList(newItems);
  }

  toArray(): T[] {
    return [...this.items];
  }

  *[Symbol.iterator](): Iterator<T> {
    yield* this.items;
  }
}

/**
 * 創建一個看起來像數組的 Proxy
 */
function createArrayProxy<T>(list: PersistentList<T>): T[] {
  const handler: ProxyHandler<PersistentList<T>> = {
    get(target, prop) {
      // 數組長度
      if (prop === 'length') {
        return target.length;
      }

      // 數組索引訪問
      if (typeof prop === 'string' && !isNaN(Number(prop))) {
        return target.get(Number(prop));
      }

      // Symbol.iterator
      if (prop === Symbol.iterator) {
        return target[Symbol.iterator].bind(target);
      }

      // 數組方法
      if (prop === 'push') {
        return (...values: T[]) => {
          const newList = target.push(...values);
          return createArrayProxy(newList); // 返回新 Proxy
        };
      }

      if (prop === 'map') {
        return (fn: (item: T, index: number) => any) => {
          return target.toArray().map(fn);
        };
      }

      if (prop === 'filter') {
        return (fn: (item: T) => boolean) => {
          return target.toArray().filter(fn);
        };
      }

      // toArray() - 轉換為真正的數組
      if (prop === 'toArray') {
        return () => target.toArray();
      }

      // 其他方法...
      return undefined;
    },

    set(target, prop, value) {
      if (typeof prop === 'string' && !isNaN(Number(prop))) {
        const newList = target.set(Number(prop), value);
        // 問題：無法返回新的 Proxy，因為 set trap 必須返回 boolean
        // 這是一個限制！
        return true;
      }
      return false;
    },

    // 讓 Array.isArray() 返回 true（技巧）
    getPrototypeOf() {
      return Array.prototype;
    },
  };

  return new Proxy(list, handler) as any;
}

// 示範用法
const list1 = new PersistentList([1, 2, 3]);
const proxy1 = createArrayProxy(list1);

console.log('=== 基本操作 ===');
console.log(proxy1[0]);           // 1
console.log(proxy1.length);       // 3
console.log(Array.isArray(proxy1)); // true (通過 getPrototypeOf)

console.log('\n=== Push 操作（返回新 Proxy）===');
const proxy2 = proxy1.push(4);
console.log(proxy1.length);       // 3 (原 proxy 未變)
console.log(proxy2.length);       // 4 (新 proxy)
console.log(proxy2[3]);           // 4

console.log('\n=== 迭代 ===');
for (const item of proxy2) {
  console.log(item);  // 1, 2, 3, 4
}

console.log('\n=== Map ===');
const doubled = proxy2.map(x => x * 2);
console.log(doubled);  // [2, 4, 6, 8]
