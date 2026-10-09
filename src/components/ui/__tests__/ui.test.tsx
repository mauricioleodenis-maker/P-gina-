import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, Button, Card, Field, Input } from '..';

describe('ui', () => {
  it('Button es type=button por defecto y táctil >=44px', () => {
    render(<Button>Hola</Button>);
    const b = screen.getByRole('button', { name: 'Hola' });
    expect(b.getAttribute('type')).toBe('button');
    expect(b.className).toContain('min-h-11');
  });
  it('Field asocia etiqueta y error', () => {
    render(<Field id="x" label="Nombre" error="Obligatorio"><Input id="x" /></Field>);
    expect(screen.getByLabelText('Nombre')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Obligatorio');
  });
  it('Card y Badge renderizan', () => {
    render(<Card><Badge tone="ok">Ok</Badge></Card>);
    expect(screen.getByText('Ok')).toBeTruthy();
  });
});
