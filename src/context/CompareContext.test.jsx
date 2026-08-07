import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompareProvider, CompareContext } from '../context/CompareContext';
import { useContext } from 'react';

function Consumer() {
  const { compareList, addToCompare, removeFromCompare, clearCompare, isInCompare } = useContext(CompareContext);
  return (
    <div>
      <span data-testid="count">{compareList.length}</span>
      <button onClick={() => addToCompare({ id: 1, name: 'A' })}>add1</button>
      <button onClick={() => addToCompare({ id: 2, name: 'B' })}>add2</button>
      <button onClick={() => addToCompare({ id: 3, name: 'C' })}>add3</button>
      <button onClick={() => addToCompare({ id: 4, name: 'D' })}>add4</button>
      <button onClick={() => addToCompare({ id: 5, name: 'E' })}>add5</button>
      <button onClick={() => removeFromCompare(1)}>remove1</button>
      <button onClick={clearCompare}>clear</button>
      <span data-testid="has1">{String(isInCompare(1))}</span>
    </div>
  );
}

describe('CompareContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds properties to the compare list', async () => {
    render(<CompareProvider><Consumer /></CompareProvider>);
    const user = userEvent.setup();
    await user.click(screen.getByText('add1'));
    await user.click(screen.getByText('add2'));
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('has1').textContent).toBe('true');
  });

  it('caps the compare list at 4 properties', async () => {
    render(<CompareProvider><Consumer /></CompareProvider>);
    const user = userEvent.setup();
    await user.click(screen.getByText('add1'));
    await user.click(screen.getByText('add2'));
    await user.click(screen.getByText('add3'));
    await user.click(screen.getByText('add4'));
    await user.click(screen.getByText('add5'));
    expect(screen.getByTestId('count').textContent).toBe('4');
  });

  it('ignores duplicate adds', async () => {
    render(<CompareProvider><Consumer /></CompareProvider>);
    const user = userEvent.setup();
    await user.click(screen.getByText('add1'));
    await user.click(screen.getByText('add1'));
    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  it('removes and clears', async () => {
    render(<CompareProvider><Consumer /></CompareProvider>);
    const user = userEvent.setup();
    await user.click(screen.getByText('add1'));
    await user.click(screen.getByText('add2'));
    await user.click(screen.getByText('remove1'));
    expect(screen.getByTestId('count').textContent).toBe('1');
    await user.click(screen.getByText('clear'));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('hydrates from localStorage', () => {
    localStorage.setItem('compareList', JSON.stringify([{ id: 99, name: 'Saved' }]));
    render(<CompareProvider><Consumer /></CompareProvider>);
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('has1').textContent).toBe('false');
  });
});
