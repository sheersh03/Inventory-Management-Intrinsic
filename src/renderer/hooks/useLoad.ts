import { useEffect, useState, type DependencyList } from 'react';

export function useLoad<T>(fn: () => Promise<T>, deps: DependencyList = []): [T | undefined, () => Promise<void>] {
  const [data, setData] = useState<T | undefined>(undefined);
  const reload = async () => { try{ setData(await fn()); } catch(e){ console.error('Load error', e); } };
  useEffect(() => { void reload(); }, deps);
  return [data, reload];
}