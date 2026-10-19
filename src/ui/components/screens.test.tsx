import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { GAME_CONFIG } from '../../config/gameConfig';
import { CHARACTERS } from '../../data/characters';
import { createEngine, type GameState } from '../../domain/engine';
import { GameOverScreen } from './GameOverScreen';
import { HomeScreen } from './HomeScreen';

beforeAll(() => {
  // jsdom não implementa matchMedia (usado pelo bloco de instalação).
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  document.documentElement.dataset.motion = 'reduced';
});

const engine = createEngine({ catalog: CHARACTERS, isImageReady: () => true, config: GAME_CONFIG });

function finishedRun(mode: 'competitive' | 'preview', score: number, correct: number): GameState {
  const s = engine.start(mode, 7, 0);
  return { ...s, phase: 'gameover', score, stats: { ...s.stats, correct, bestCombo: correct } };
}

describe('tela de fim de jogo', () => {
  it('novo recorde oficial: celebração, diferença e pontuação final', () => {
    render(<GameOverScreen state={finishedRun('competitive', 2500, 13)} newBest previousBest={1800} onAgain={() => {}} onHome={() => {}} />);
    expect(screen.getByTestId('new-record')).toHaveTextContent('Novo recorde!');
    expect(screen.getByTestId('new-record')).toHaveTextContent('+700 acima da sua melhor marca');
    expect(screen.getByTestId('final-score')).toHaveTextContent('2.500');
    expect(screen.getByText('Expert em ícones')).toBeInTheDocument();
    expect(screen.queryByText(/não conta recorde/)).not.toBeInTheDocument();
  });

  it('treino: celebração própria e aviso de que não vale recorde oficial', () => {
    render(<GameOverScreen state={finishedRun('preview', 900, 5)} newBest previousBest={0} onAgain={() => {}} onHome={() => {}} />);
    expect(screen.getByTestId('new-record')).toHaveTextContent('Recorde de treino!');
    expect(screen.getByText('Partida de preview: não conta recorde.')).toBeInTheDocument();
  });

  it('sem recorde: nada de celebração, mostra o recorde a bater', () => {
    render(<GameOverScreen state={finishedRun('competitive', 300, 2)} newBest={false} previousBest={1800} onAgain={() => {}} onHome={() => {}} />);
    expect(screen.queryByTestId('new-record')).not.toBeInTheDocument();
    expect(screen.getByText(/recorde 1\.800/)).toBeInTheDocument();
    expect(screen.getByText('Mais 3 acertos para "Fã de carteirinha"')).toBeInTheDocument();
  });

  it('botões levam a jogar de novo e ao início', async () => {
    const again = vi.fn();
    const home = vi.fn();
    render(<GameOverScreen state={finishedRun('preview', 0, 0)} newBest={false} previousBest={0} onAgain={again} onHome={home} />);
    await userEvent.click(screen.getByRole('button', { name: /Jogar de novo/ }));
    await userEvent.click(screen.getByRole('button', { name: /Início/ }));
    expect(again).toHaveBeenCalledOnce();
    expect(home).toHaveBeenCalledOnce();
  });
});

describe('home', () => {
  it('sem imagens: treino é o CTA principal e a Maratona aparece bloqueada com progresso', () => {
    const onPreview = vi.fn();
    render(
      <HomeScreen
        records={{ best: 1234, history: [{ score: 1234, rounds: 9, correct: 8, bestCombo: 7, endedAt: '' }], practiceBest: 50 }}
        motion="system"
        onMotionChange={() => {}}
        onPlay={() => {}}
        onPreview={onPreview}
      />,
    );
    expect(screen.getByTestId('images-pending')).toHaveTextContent('0/30 imagens');
    expect(screen.getByTestId('images-pending')).toHaveTextContent('583 ícones curados');
    expect(screen.getByRole('button', { name: /Jogar \(em breve\)/ })).toBeDisabled();
    expect(screen.getByTestId('records')).toHaveTextContent('1.234');
    expect(screen.getByTestId('records')).toHaveTextContent('7');
    screen.getByTestId('preview').click();
    expect(onPreview).toHaveBeenCalledOnce();
  });
});
