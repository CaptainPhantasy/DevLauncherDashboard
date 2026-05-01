import { expect, test } from '@playwright/test';

const mockApps = [
  {
    id: 'alpha',
    name: 'Alpha API',
    description: 'Primary API service',
    path: '/tmp/alpha',
    type: 'nextjs',
    preferredPort: 3000,
    isRunning: false,
  },
  {
    id: 'bravo',
    name: 'Bravo Console',
    description: 'Operator dashboard',
    path: '/tmp/bravo',
    type: 'nextjs',
    preferredPort: 3001,
    isRunning: false,
  },
  {
    id: 'charlie',
    name: 'Charlie Studio',
    description: 'Design surface',
    path: '/tmp/charlie',
    type: 'nextjs',
    preferredPort: 3002,
    isRunning: false,
  },
  {
    id: 'delta',
    name: 'Delta Tools',
    description: 'Developer utilities',
    path: '/tmp/delta',
    type: 'nextjs',
    preferredPort: 3003,
    isRunning: false,
  },
];

async function installApiMock(page) {
  await page.route('http://localhost:4500/api/apps', async (route) => {
    await route.fulfill({ json: mockApps });
  });
}

async function dragElementToElement(page, source, target) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('Cannot drag without source and target boxes');
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 12 }
  );
  await page.mouse.up();
}

async function dragElementToPoint(page, source, point) {
  const sourceBox = await source.boundingBox();
  if (!sourceBox) throw new Error('Cannot drag without source box');

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(point.x, point.y, { steps: 14 });
  await page.mouse.up();
}

test.describe('kanban frame movement', () => {
  test('reorders frames by dragging and persists the custom order across refreshes', async ({ page }) => {
    await installApiMock(page);

    await page.goto('/');

    const names = page.locator('[data-testid^="kanban-frame-"] h3');
    await expect(names).toHaveText(['Alpha API', 'Bravo Console', 'Charlie Studio', 'Delta Tools']);

    await page
      .locator('[data-testid="kanban-frame-alpha"]')
      .dragTo(page.locator('[data-testid="kanban-drop-end"]'));

    await expect(names).toHaveText(['Bravo Console', 'Charlie Studio', 'Delta Tools', 'Alpha API']);

    await page.reload();
    await expect(names).toHaveText(['Bravo Console', 'Charlie Studio', 'Delta Tools', 'Alpha API']);
  });

  test('reorders frames with a real mouse drag over another card', async ({ page }) => {
    await installApiMock(page);

    await page.goto('/');
    const names = page.locator('[data-testid^="kanban-frame-"] h3');
    await expect(names).toHaveText(['Alpha API', 'Bravo Console', 'Charlie Studio', 'Delta Tools']);

    await dragElementToElement(
      page,
      page.locator('[data-testid="kanban-frame-alpha"]'),
      page.locator('[data-testid="kanban-frame-charlie"]')
    );

    await expect(names).toHaveText(['Bravo Console', 'Charlie Studio', 'Alpha API', 'Delta Tools']);
  });

  test('reorders into an empty grid spot on the board', async ({ page }) => {
    await installApiMock(page);

    await page.goto('/');
    const names = page.locator('[data-testid^="kanban-frame-"] h3');
    await expect(names).toHaveText(['Alpha API', 'Bravo Console', 'Charlie Studio', 'Delta Tools']);

    const deltaBox = await page.locator('[data-testid="kanban-frame-delta"]').boundingBox();
    if (!deltaBox) throw new Error('Delta card is missing');

    await dragElementToPoint(
      page,
      page.locator('[data-testid="kanban-frame-alpha"]'),
      { x: deltaBox.x + deltaBox.width * 1.7, y: deltaBox.y + deltaBox.height / 2 }
    );

    await expect(names).toHaveText(['Bravo Console', 'Charlie Studio', 'Delta Tools', 'Alpha API']);
  });

  test('supports keyboard reorder from the drag handle', async ({ page }) => {
    await installApiMock(page);

    await page.goto('/');
    await page.locator('[data-testid="kanban-drag-handle-charlie"]').focus();
    await page.keyboard.press('ArrowUp');

    const names = page.locator('[data-testid^="kanban-frame-"] h3');
    await expect(names).toHaveText(['Alpha API', 'Charlie Studio', 'Bravo Console', 'Delta Tools']);
  });
});
