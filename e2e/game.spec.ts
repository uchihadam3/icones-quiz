import { expect, test, type Page } from '@playwright/test';

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test('carrega no base path do Pages, com assets do mesmo base', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(r.url());
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'ÍCONES' })).toBeVisible();
  const scripts = await page.locator('script[type="module"]').evaluateAll((els) => els.map((e) => e.getAttribute('src')));
  for (const src of scripts) expect(src).toMatch(/^\/icones-quiz\//);
  expect(failed).toEqual([]);
  await noHorizontalScroll(page);
});

test('sem imagens licenciadas: partida real indisponível e estado claro', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('images-pending')).toContainText('Banco de imagens em preparação');
  await expect(page.getByRole('button', { name: 'Jogar (em breve)' })).toBeDisabled();
});

test('preview: mecânicas reais, sem revelar o nome antes da resposta', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('preview').click();
  const card = page.getByTestId('challenge-card');
  await expect(card).toBeVisible();
  await expect(page.getByTestId('image-placeholder')).toContainText('Imagem a adicionar');
  await expect(page.getByText(/Preview de desenvolvimento/)).toBeVisible();
  await expect(page.getByTestId('timer')).toBeVisible();
  await expect(page.getByRole('img', { name: '3 de 3 vidas' })).toBeVisible();
  await noHorizontalScroll(page);

  // erro custa 1 vida
  const input = page.getByTestId('answer-input');
  await expect(input).toBeFocused();
  await input.fill('resposta certamente errada');
  await input.press('Enter');
  await expect(page.getByTestId('feedback')).toContainText('Era ');
  await expect(page.getByRole('img', { name: '2 de 3 vidas' })).toBeVisible();

  // duplo clique em "Próximo" avança só uma rodada
  await page.getByTestId('next').dblclick();
  await expect(page.getByTestId('round')).toHaveText('Rodada 2');

  // ajuda de alternativas mostra 3 opções; contador da próxima vida visível
  await expect(page.getByTestId('recovery')).toContainText('Próxima vida 0/3');
  await page.getByRole('button', { name: /Mostrar 3 alternativas/ }).click();
  await expect(page.getByRole('group', { name: 'Alternativas' }).getByRole('button')).toHaveCount(3);

  // pular preserva vidas
  await page.getByRole('button', { name: /Pular/ }).click();
  await expect(page.getByTestId('feedback')).toContainText('Pulou');
  await expect(page.getByRole('img', { name: '2 de 3 vidas' })).toBeVisible();
});

test('sair da aba pausa e anula a rodada sem custar vida', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('preview').click();
  await expect(page.getByTestId('challenge-card')).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('dialog', { name: 'Pausado' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByTestId('round')).toHaveText('Rodada 1');
  await expect(page.getByRole('img', { name: '3 de 3 vidas' })).toBeVisible();
});

test('três erros encerram a partida; preview não grava recorde', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('preview').click();
  for (let i = 0; i < 3; i++) {
    const input = page.getByTestId('answer-input');
    await expect(input).toBeEditable();
    await input.fill('xyz errado');
    await input.press('Enter');
    if (i < 2) await page.getByTestId('next').click();
  }
  await expect(page.getByTestId('gameover-screen')).toBeVisible();
  await expect(page.getByText('Partida de preview: não conta recorde.')).toBeVisible();
  await page.getByRole('button', { name: 'Início' }).click();
  await expect(page.getByTestId('records')).toContainText('0');
});

test.describe('movimento reduzido', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });
  test('respeita prefers-reduced-motion do sistema', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  });
  test('preferência manual "Completas" sobrepõe o sistema e persiste', async ({ page }) => {
    await page.goto('./');
    await page.getByText('Completas', { exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
  });
});

test('navegação por teclado: Tab alcança as ações principais', async ({ page }) => {
  await page.goto('./');
  // "Jogar (em breve)" está desabilitado (fora da ordem de Tab); o primeiro foco é o preview.
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('preview')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('answer-input')).toBeFocused();
});


test('PWA pronta para instalar no celular: manifesto, ícones e worker', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/icones-quiz/manifest.webmanifest');
  const app = await page.evaluate(async () => {
    const response = await fetch('/icones-quiz/manifest.webmanifest');
    if (!response.ok) throw new Error('Manifesto indisponível');
    return response.json() as Promise<{start_url:string;display:string;icons: {src:string;sizes:string}[]}>;
  });
  expect(app.start_url).toBe('/icones-quiz/');
  expect(app.display).toBe('standalone');
  expect(app.icons.map(i => i.sizes)).toEqual(expect.arrayContaining(['192x192','512x512']));
  for (const icon of app.icons) {
    const response = await page.request.get(new URL(icon.src, page.url()).toString());
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toMatch(/image\/png/);
  }
  await expect(page.getByText('Instalar no celular')).toBeVisible();
  await expect.poll(() => page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration('/icones-quiz/')))).toBe(true);
});
