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

test('partida real usa uma imagem pronta e créditos estão acessíveis', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('play')).toBeEnabled();
  await expect(page.locator('.image-credits summary')).toContainText('Créditos das imagens');
  await page.getByTestId('play').click();
  await expect(page.getByTestId('challenge-card').locator('img[alt="Imagem do desafio"]')).toBeVisible();
});

test('preview: mecânicas reais, sem revelar o nome antes da resposta', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('preview').click();
  const card = page.getByTestId('challenge-card');
  await expect(card).toBeVisible();
  await expect(page.getByTestId('challenge-card').locator('.image-frame, .poster')).toBeVisible();
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
  await expect(page.getByTestId('round')).toHaveAttribute('aria-label', 'Rodada 2');

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
  await expect(page.getByTestId('round')).toHaveAttribute('aria-label', 'Rodada 1');
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

test('navegação por teclado: Tab alcança a Maratona', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('play')).toBeFocused();
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

test('HUD gamificado: sequência, meta do multiplicador e contador de ajudas', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('preview').click();
  await expect(page.getByTestId('streak')).toHaveAttribute('aria-label', '0 acertos seguidos');
  await expect(page.getByTestId('multiplier')).toContainText('x2 em 3');
  await expect(page.getByRole('button', { name: 'Pular, 3 restantes' })).toBeEnabled();
  await page.getByRole('button', { name: 'Pausar' }).click();
  const dialog = page.getByRole('dialog', { name: 'Pausado' });
  await expect(dialog).toContainText('Pontos');
  await expect(dialog.getByRole('button', { name: 'Continuar' })).toBeFocused();
});

test('tempo acabando: tela entra em tensão e o timeout custa 1 vida', async ({ page }) => {
  await page.clock.install();
  await page.goto('./');
  await page.getByTestId('preview').click();
  await expect(page.getByTestId('timer')).toBeVisible();
  await page.clock.runFor(33_000);
  await expect(page.locator('html')).toHaveAttribute('data-danger', 'true');
  await expect(page.getByTestId('timer')).toHaveClass(/is-warning/);
  await page.clock.runFor(8_000);
  await expect(page.getByTestId('feedback')).toContainText('Tempo!');
  await expect(page.getByRole('img', { name: '2 de 3 vidas' })).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-danger', 'true');
});

test('fim de jogo com 0 pontos não dispara celebração de recorde', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('preview').click();
  for (let i = 0; i < 3; i++) {
    await page.getByTestId('answer-input').fill('nada a ver');
    await page.getByTestId('answer-input').press('Enter');
    if (i < 2) await page.getByTestId('next').click();
  }
  await expect(page.getByTestId('gameover-screen')).toBeVisible();
  await expect(page.getByTestId('new-record')).toHaveCount(0);
  await expect(page.getByText('Aquecendo')).toBeVisible();
  await page.getByTestId('again').click();
  await expect(page.getByTestId('game-screen')).toBeVisible();
});

test.describe('teclado virtual aberto (viewport baixa)', () => {
  test.use({ viewport: { width: 360, height: 430 } });
  test('cartão encolhe e a resposta continua visível, sem scroll horizontal', async ({ page }) => {
    await page.goto('./');
    await page.getByTestId('preview').click();
    const input = page.getByTestId('answer-input');
    await expect(input).toBeInViewport();
    await expect(page.getByTestId('challenge-card')).toBeInViewport();
    const box = await page.getByTestId('challenge-card').boundingBox();
    expect(box!.height).toBeGreaterThan(100);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('áudio', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('icones-quiz:audio-debug', '1'));
  });

  const log = (page: Page) => page.evaluate(() => (window as Window & { __iconesAudioLog?: string[] }).__iconesAudioLog ?? []);

  test('desbloqueia no primeiro gesto e dispara cada evento uma vez', async ({ page }) => {
    await page.goto('./');
    expect(await log(page)).not.toContain('unlock:opus');
    await page.getByTestId('preview').click();
    await expect.poll(async () => (await log(page)).some((e) => e.startsWith('unlock:'))).toBe(true);
    await expect.poll(() => log(page)).toContain('sfx:game-start');
    await expect.poll(async () => (await log(page)).some((e) => e.startsWith('music:groove'))).toBe(true);
    // A camada real foi baixada, decodificada e entrou no relógio musical.
    await expect.poll(() => log(page), { timeout: 15_000 }).toContain('layer:groove');

    const input = page.getByTestId('answer-input');
    await input.fill('resposta errada');
    await input.press('Enter');
    await expect(page.getByTestId('feedback')).toBeVisible();
    await expect.poll(() => log(page)).toContain('sfx:life-lost');
    const entries = await log(page);
    expect(entries.filter((e) => e === 'sfx:wrong')).toHaveLength(1);
    expect(entries.filter((e) => e === 'sfx:life-lost')).toHaveLength(1);

    await page.getByTestId('next').click();
    await page.getByRole('button', { name: /Mostrar 3 alternativas/ }).click();
    await expect.poll(() => log(page)).toContain('sfx:hint');
    await page.getByRole('button', { name: 'Pausar' }).click();
    await expect.poll(() => log(page)).toContain('sfx:pause');
    await expect.poll(async () => (await log(page)).some((e) => /^music:\w+:\d:m$/.test(e))).toBe(true);
  });

  test('mudo e volumes persistem; jogo segue funcionando sem som', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Som ligado' }).click();
    await expect(page.getByRole('button', { name: 'Sem som' })).toBeVisible();
    await page.getByLabel('Volume da música').fill('30');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Sem som' })).toBeVisible();
    await expect(page.getByLabel('Volume da música')).toHaveValue('30');
    await page.getByTestId('preview').click();
    await expect(page.getByTestId('mute')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('answer-input')).toBeFocused();
  });

  test('arquivos reais: servidos no base path e decodificáveis pelo navegador', async ({ page }) => {
    await page.goto('./');
    const result = await page.evaluate(async () => {
      const files = ['sfx/correct-1', 'sfx/wrong', 'sfx/life-recovered', 'sfx/tier-up-5', 'sfx/stinger-record', 'music/groove', 'music/epic'];
      const ctx = new AudioContext();
      const out: Record<string, number> = {};
      for (const f of files) {
        const res = await fetch(`/icones-quiz/audio/${f}.opus`);
        if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`);
        const buf = await ctx.decodeAudioData(await res.arrayBuffer());
        out[f] = buf.duration;
      }
      await ctx.close();
      return { out };
    });
    for (const d of Object.values(result.out)) expect(d).toBeGreaterThan(0.05);
    // Camadas de música: cauda 2 s + loop 64 s + cabeça 2 s.
    expect(result.out['music/groove']).toBeCloseTo(68, 0);
    expect(result.out['music/epic']).toBeCloseTo(68, 0);
  });
});

test.describe('respostas naturais na partida real (imagens reais, build de produção)', () => {
  test('apelido curto e erro de digitação seguro são aceitos, sem perder vida', async ({ page }) => {
    const { identityForImage } = await import('./oracle');
    const { buildAnswerIndex, answerKey } = await import('../src/domain/answers');
    const { CHARACTERS } = await import('../src/data/characters');
    const index = buildAnswerIndex(CHARACTERS);

    await page.goto('./');
    await page.getByTestId('play').click();
    for (let round = 0; round < 8; round++) {
      const img = page.locator('.image-frame.is-loaded img');
      await expect(img).toBeVisible({ timeout: 15_000 });
      const identity = identityForImage((await img.getAttribute('src')) ?? '');
      expect(identity, 'imagem sem identidade conhecida').toBeTruthy();
      // Forma mais curta aceita (ex.: "Naruto" para Naruto Uzumaki) …
      const names = [...identity!.names, ...(identity!.aliases ?? [])].filter((n) => index.check(n, identity!.id).correct);
      let guess = names.sort((a, b) => answerKey(a).length - answerKey(b).length)[0]!;
      // … e, em rodadas alternadas, com um erro de digitação que o jogo deve perdoar (letra dobrada).
      if (round % 2 === 1) {
        const longest = names.sort((a, b) => answerKey(b).length - answerKey(a).length)[0]!;
        const doubled = longest.replace(/([a-z])/i, '$1$1');
        if (index.check(doubled, identity!.id).correct) guess = doubled;
      }
      await page.getByTestId('answer-input').fill(guess);
      await page.getByTestId('answer-input').press('Enter');
      const feedback = page.getByTestId('feedback');
      await expect(feedback, `"${guess}" para ${identity!.id}`).toHaveClass(/is-good/);
      await expect(feedback).not.toContainText('−1 vida');
      await page.getByTestId('next').click();
    }
  });
});
