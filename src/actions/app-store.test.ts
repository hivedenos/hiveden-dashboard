import { expect, test } from 'vitest';
import { getComposePreview } from './app-store';

test('falls back to a deduplicated raw GitHub compose URL', async () => {
  const preview = await getComposePreview(
    'https://raw.githubusercontent.com/hivedenos/hivedenos-apps/main/apps/incubator/awesome-docker-compose/13ft/awesome-docker-compose/13ft/docker-compose.yml',
  );

  expect(preview.truncated).toBe(false);
  expect(preview.content).toContain('services:');
});
