/**
 * 測試 Proxy 的性能開銷
 */
import { bench, describe } from 'vitest';

// 普通數組
const nativeArray = Array.from({ length: 1000 }, (_, i) => i);

// Proxy 包裝的數組
const proxyArray = new Proxy(nativeArray, {
  get(target, prop) {
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return target[Number(prop)];
    }
    if (prop === 'length') {
      return target.length;
    }
    return (target as any)[prop];
  }
});

describe('Proxy overhead', () => {
  bench('Native array - index access', () => {
    let sum = 0;
    for (let i = 0; i < 1000; i++) {
      sum += nativeArray[i]!;
    }
  });

  bench('Proxy array - index access', () => {
    let sum = 0;
    for (let i = 0; i < 1000; i++) {
      sum += proxyArray[i]!;
    }
  });

  bench('Native array - length', () => {
    for (let i = 0; i < 1000; i++) {
      const len = nativeArray.length;
    }
  });

  bench('Proxy array - length', () => {
    for (let i = 0; i < 1000; i++) {
      const len = proxyArray.length;
    }
  });
});
