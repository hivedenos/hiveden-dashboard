import { render, screen, fireEvent } from '@testing-library/react';
import { CronHelper, isValidCron } from './CronHelper';
import { MantineProvider } from '@mantine/core';
import { expect, test, vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

test('isValidCron validates cron strings', () => {
  expect(isValidCron('* * * * *')).toBe(true);
  expect(isValidCron('0 0 * * *')).toBe(true);
  expect(isValidCron('invalid')).toBe(false);
});

test('CronHelper renders input and presets', () => {
  const onChange = vi.fn();
  render(
    <MantineProvider>
      <CronHelper value="" onChange={onChange} />
    </MantineProvider>
  );

  const input = screen.getByPlaceholderText('e.g. 0 0 * * *');
  expect(input).toBeDefined();

  // Presets
  const dailyButton = screen.getByText('Daily (@midnight)');
  fireEvent.click(dailyButton);
  expect(onChange).toHaveBeenCalledWith('0 0 * * *');
});
