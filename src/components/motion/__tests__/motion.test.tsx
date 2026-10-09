import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Reveal, SplitText, TimelineScroll } from '..';

function setReduced(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q.includes('reduce') ? reduce : false, media: q,
    addEventListener: () => {}, removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  class IO { observe() {} disconnect() {} unobserve() {} }
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
}

describe('motion', () => {
  beforeEach(() => setReduced(false));

  it('Reveal deja el contenido en el DOM', () => {
    render(<Reveal><p>Texto</p></Reveal>);
    expect(screen.getByText('Texto')).toBeTruthy();
  });
  it('SplitText conserva el texto accesible completo', () => {
    render(<SplitText text="Un espacio de calma" accent={['calma']} />);
    expect(screen.getByLabelText('Un espacio de calma')).toBeTruthy();
  });
  it('TimelineScroll con reduced-motion muestra todos los pasos activos', () => {
    setReduced(true);
    render(<TimelineScroll steps={[{ title: 'Uno', body: 'a' }, { title: 'Dos', body: 'b' }]} />);
    const items = screen.getAllByRole('listitem');
    expect(items.every((li) => li.getAttribute('data-active') === 'true')).toBe(true);
  });
});
