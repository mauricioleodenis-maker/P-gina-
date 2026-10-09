'use client';
import { useSyncExternalStore } from 'react';
import { FINE_POINTER_QUERY, REDUCED_QUERY } from './tokens';

function subscribeTo(query: string) {
  return (cb: () => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mq = window.matchMedia(query);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  };
}
function snapshotOf(query: string, fallback: boolean) {
  return () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : fallback);
}

const subReduced = subscribeTo(REDUCED_QUERY);
const snapReduced = snapshotOf(REDUCED_QUERY, false);
const subFine = subscribeTo(FINE_POINTER_QUERY);
const snapFine = snapshotOf(FINE_POINTER_QUERY, false);

/** true si la persona pidió menos movimiento. En servidor: false (el CSS cubre el resto). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subReduced, snapReduced, () => false);
}
/** true solo con puntero fino y hover (ratón, trackpad). En servidor: false. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(subFine, snapFine, () => false);
}
