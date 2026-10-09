import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useReducedMotion } from '../reduced';

function Probe() {
  return <p>{useReducedMotion() ? 'reduced' : 'full'}</p>;
}

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q.includes('reduce') ? matches : false,
    media: q,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  })) as unknown as typeof window.matchMedia;
  return listeners;
}

describe('useReducedMotion', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.restoreAllMocks());

  it('devuelve true con prefers-reduced-motion: reduce', () => {
    mockMatchMedia(true);
    render(<Probe />);
    expect(screen.getByText('reduced')).toBeTruthy();
  });
  it('devuelve false sin preferencia', () => {
    mockMatchMedia(false);
    render(<Probe />);
    expect(screen.getByText('full')).toBeTruthy();
    act(() => {});
  });
});
