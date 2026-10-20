import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../data/characters';
import { answerKey, areAdjacentKeys, buildAnswerIndex, isAcceptableTypo, normalizeAnswer, singleEdit } from './answers';
import type { Identity } from './types';

const index = buildAnswerIndex(CHARACTERS);
const ok = (guess: string, id: string) => index.check(guess, id).correct;

describe('D) normalização', () => {
  it.each([
    ['Pelé', 'pele'],
    ['  HOMEM-ARANHA  ', 'homem aranha'],
    ['Beyoncé', 'beyonce'],
    ['Relâmpago   McQueen!', 'relampago mcqueen'],
    ['Gisele Bündchen', 'gisele bundchen'],
    ['Monkey D. Luffy', 'monkey d luffy'],
    ['Tom & Jerry', 'tom jerry'],
    ['Straße', 'strasse'],
    ['Ｇｏｋｕ', 'goku'], // largura total (teclados asiáticos)
    ['Mônica', 'monica'], // acento combinante (NFD)
  ])('%s → %s', (input, expected) => {
    expect(normalizeAnswer(input)).toBe(expected);
  });

  it('chave ignora espaços: "Spider Man" = "Spiderman"', () => {
    expect(answerKey('Spider Man')).toBe(answerKey('spiderman'));
  });
});

describe('D) aceitação de nomes, apelidos e localização', () => {
  it.each([
    ['goku', 'Goku'],
    ['goku', 'son goku'],
    ['goku', 'KAKAROTTO'],
    ['homem-aranha', 'Spider-Man'],
    ['homem-aranha', 'homem aranha'],
    ['homem-aranha', 'homemaranha'],
    ['homem-aranha', 'Peter Parker'],
    ['pele', 'pele'],
    ['pele', 'Edson Arantes do Nascimento'],
    ['bob-esponja', 'spongebob squarepants'],
    ['pernalonga', 'Bugs Bunny'],
    ['pica-pau', 'woody woodpecker'],
    ['cristiano-ronaldo', 'CR7'],
    ['ronaldo-nazario', 'fenomeno'],
    ['relampago-mcqueen', 'relampago mcqueen'],
    ['monica', 'MONICA'],
    ['beyonce', 'beyonce'],
    ['chaves', 'el chavo del ocho'],
  ])('%s aceita "%s"', (id, guess) => {
    expect(ok(guess, id)).toBe(true);
  });
});

describe('D) tolerância a 1 erro de teclado', () => {
  it('nomes longos (8+) aceitam 1 edição', () => {
    expect(ok('Homer Simpsom', 'homer-simpson')).toBe(true); // n→m vizinhas
    expect(ok('Buzz Ligthyear', 'buzz-lightyear')).toBe(true); // inversão
    expect(ok('Darth Vaderr', 'darth-vader')).toBe(true); // letra extra
    expect(ok('Ayrton Sena', 'ayrton-senna')).toBe(true); // letra faltando no meio
    expect(ok('Lionel Mesi', 'lionel-messi')).toBe(true);
  });

  it('nomes de 5–7 letras aceitam tecla vizinha, inversão ou letra dobrada', () => {
    expect(ok('Pikachi', 'pikachu')).toBe(true); // u→i vizinhas
    expect(ok('Pikahcu', 'pikachu')).toBe(true); // inversão
    expect(ok('Pikachz', 'pikachu')).toBe(false); // z não é vizinha de u
    expect(ok('Pikchu', 'pikachu')).toBe(false); // letra faltando (não dobrada): não vale em nome médio
    expect(ok('Pikachuu', 'pikachu')).toBe(true); // letra dobrada a mais
    expect(ok('Pikachux', 'pikachu')).toBe(false); // letra extra qualquer: não vale em nome médio
    expect(ok('Naruuto', 'naruto-uzumaki')).toBe(true);
    expect(ok('Shrel', 'shrek')).toBe(true); // k→l vizinhas
  });

  it('letra repetida no fim pode faltar ("Snoop Dog"), sem virar licença para prefixos', () => {
    expect(ok('Snoop Dog', 'snoop-dogg')).toBe(true);
    expect(ok('snoop dog', 'snoop-dogg')).toBe(true);
    expect(ok('Snoopy Dogg', 'snoop-dogg')).toBe(true); // 1 letra extra em nome longo
    expect(ok('Snoopy Dog', 'snoop-dogg')).toBe(true); // 2 edições em nome longo, sem ambiguidade
    expect(ok('Snoopy', 'snoop-dogg')).toBe(false); // é outra identidade
    expect(ok('Snoopy', 'snoopy')).toBe(true);
    expect(ok('Snoop D', 'snoop-dogg')).toBe(false);
    expect(ok('Darth Vade', 'darth-vader')).toBe(false); // cortar o final continua proibido
  });

  it('2 edições só em nomes longos, nunca como começo do nome', () => {
    expect(ok('Lionel Mesy', 'lionel-messi')).toBe(true); // 1 edição
    expect(ok('Leonel Mesi', 'lionel-messi')).toBe(true); // 2 edições, 10+ letras
    expect(ok('Michael Jacks', 'michael-jackson')).toBe(false); // prefixo
    expect(ok('Michael Jackso', 'michael-jackson')).toBe(false); // corte do final
    expect(ok('Jim Carey', 'jim-carrey')).toBe(true); // letra dobrada a menos
    expect(ok('Jennifer Lawrance', 'jennifer-lawrence')).toBe(true);
  });

  it('nome próprio comum sozinho não completa a resposta', () => {
    expect(ok('Jim', 'jim-carrey')).toBe(false);
    expect(ok('Jennifer', 'jennifer-lawrence')).toBe(false);
    expect(ok('Michael', 'michael-jackson')).toBe(false);
    expect(ok('Michael', 'michael-jordan')).toBe(false);
    expect(ok('Darth', 'darth-vader')).toBe(false);
    expect(ok('Homem', 'homem-aranha')).toBe(false);
  });

  it('apelidos naturais de anime valem (forma pela qual todo mundo chama)', () => {
    const cases: [string, string][] = [
      ['Naruto', 'naruto-uzumaki'], ['Sasuke', 'sasuke-uchiha'], ['Kakashi', 'kakashi-hatake'], ['Itachi', 'itachi-uchiha'],
      ['Tanjiro', 'tanjiro-kamado'], ['Eren', 'eren-yeager'], ['Luffy', 'monkey-d-luffy'], ['Zoro', 'roronoa-zoro'],
      ['Ichigo', 'ichigo-kurosaki'], ['Gojo', 'satoru-gojo'], ['Levi', 'levi-ackerman'], ['Mikasa', 'mikasa-ackerman'],
      ['Rengoku', 'kyojuro-rengoku'], ['Chopper', 'tony-tony-chopper'],
    ];
    for (const [guess, id] of cases) expect(ok(guess, id), `${guess} → ${id}`).toBe(true);
    expect(ok('Naruto Uzumaki', 'naruto-uzumaki')).toBe(true);
    expect(ok('Sasuke Uchiha', 'sasuke-uchiha')).toBe(true);
  });

  it('nomes curtos (<5) exigem resposta exata', () => {
    expect(ok('Gokuu', 'goku')).toBe(false);
    expect(ok('Gpku', 'goku')).toBe(false);
    expect(ok('Hulj', 'hulk')).toBe(false);
    expect(ok('Ash', 'ash-ketchum')).toBe(true);
    expect(ok('Asj', 'ash-ketchum')).toBe(false);
    expect(ok('Nemi', 'nemo')).toBe(false);
  });

  it('não aceita prefixos arbitrários nem cortar o final', () => {
    expect(ok('Darth Vade', 'darth-vader')).toBe(false);
    expect(ok('Darth', 'darth-vader')).toBe(false);
    expect(ok('Homem', 'homem-aranha')).toBe(false);
    expect(ok('Homem-Aranh', 'homem-aranha')).toBe(false);
    expect(ok('Pik', 'pikachu')).toBe(false);
    expect(ok('Super', 'superman')).toBe(false);
    expect(ok('Michael', 'michael-jackson')).toBe(false);
    expect(ok('Taylor S', 'taylor-swift')).toBe(false);
  });

  it('palpite vazio ou só pontuação não é tratado como resposta', () => {
    expect(index.check('', 'goku')).toEqual({ correct: false, reason: 'empty' });
    expect(index.check(' -- !! ', 'goku')).toEqual({ correct: false, reason: 'empty' });
  });
});

describe('D) homônimos e colisões com outras identidades', () => {
  it('"Ronaldo" sozinho não vale nem para Cristiano nem para o Fenômeno', () => {
    expect(ok('Ronaldo', 'cristiano-ronaldo')).toBe(false);
    expect(ok('Ronaldo', 'ronaldo-nazario')).toBe(false);
    expect(ok('Ronaldo Fenômeno', 'cristiano-ronaldo')).toBe(false);
    expect(ok('Cristiano Ronaldo', 'ronaldo-nazario')).toBe(false);
  });

  it('"MJ" é ambíguo entre Michael Jackson e Michael Jordan', () => {
    expect(ok('MJ', 'michael-jackson')).toBe(false);
    expect(ok('MJ', 'michael-jordan')).toBe(false);
    expect(ok('Michael Jordan', 'michael-jackson')).toBe(false);
    expect(ok('Michael Jackson', 'michael-jordan')).toBe(false);
  });

  it('"Woody" é o de Toy Story, nunca o Pica-Pau', () => {
    expect(ok('Woody', 'woody')).toBe(true);
    expect(ok('Woody', 'pica-pau')).toBe(false);
    expect(ok('Woody Woodpecker', 'woody')).toBe(false);
  });

  it('"Serena" é ambíguo entre Sailor Moon e Serena Williams', () => {
    expect(ok('Serena', 'sailor-moon')).toBe(false);
    expect(ok('Serena', 'serena-williams')).toBe(false);
    expect(ok('Serena Tsukino', 'sailor-moon')).toBe(true);
  });

  it('nome de outra identidade nunca vale, mesmo parecido', () => {
    expect(ok('Luigi', 'mario')).toBe(false);
    expect(ok('Mario', 'luigi')).toBe(false);
    expect(ok('Batman', 'superman')).toBe(false);
    expect(ok('Vegeta', 'goku')).toBe(false);
    expect(ok('Bart Simpson', 'homer-simpson')).toBe(false);
    expect(ok('Tom', 'jerry-rato')).toBe(false);
    expect(ok('Jerry', 'tom-gato')).toBe(false);
    expect(ok('Tom Cruise', 'tom-gato')).toBe(false);
    expect(ok('Bruce Wayne', 'hulk')).toBe(false);
    expect(ok('Bruce Banner', 'batman')).toBe(false);
    expect(ok('Homer', 'bart-simpson')).toBe(false);
  });

  it('erro de digitação que fica a 1 edição de OUTRA identidade é rejeitado', () => {
    const fixture: Identity[] = [
      { id: 'a', kind: 'person', category: 'celebrity', level: 1, displayName: 'Johnson Silva', names: ['Johnson Silva'], origin: 'x' },
      { id: 'b', kind: 'person', category: 'celebrity', level: 1, displayName: 'Johnson Silvo', names: ['Johnson Silvo'], origin: 'x' },
      { id: 'c', kind: 'character', category: 'game', level: 1, displayName: 'Marcos', names: ['Marcos'], origin: 'x' },
      { id: 'd', kind: 'character', category: 'game', level: 1, displayName: 'Marcus', names: ['Marcus'], origin: 'x' },
    ];
    const idx = buildAnswerIndex(fixture);
    // "Johnson Silvp" está a 1 edição das duas → ambíguo
    expect(idx.check('Johnson Silvp', 'a')).toEqual({ correct: false, reason: 'ambiguous' });
    expect(idx.check('Johnson Silvo', 'a')).toEqual({ correct: false, reason: 'other-identity' });
    // "Marcis" (i vizinha de u e o) fica perto de Marcus e Marcos
    expect(idx.check('Marcis', 'c').correct).toBe(false);
    expect(idx.check('Marcus', 'c').correct).toBe(false);
    expect(idx.check('Marcos', 'c').correct).toBe(true);
  });

  it('nenhum palpite exato de identidade X é aceito para Y no catálogo inteiro', () => {
    const active = CHARACTERS.filter((c) => c.active !== false);
    const allKeys = active.flatMap((c) => index.keysOf(c.id).map((key) => ({ key, id: c.id })));
    for (const other of active) {
      for (const name of [...other.names, ...(other.aliases ?? [])]) {
        const key = answerKey(name);
        // Alvos plausíveis: quem tem alguma chave a ≤ 1 edição desse nome (os demais nunca aceitam).
        const targets = new Set(allKeys.filter((e) => e.id !== other.id && singleEdit(e.key, key) !== null).map((e) => e.id));
        for (const targetId of targets) {
          if (index.keysOf(targetId).includes(key)) continue; // catalog.test.ts garante que não existem chaves compartilhadas
          expect(ok(name, targetId), `"${name}" (de ${other.id}) aceito para ${targetId}`).toBe(false);
        }
      }
    }
  });

  it('nenhum erro de 1 tecla sobre o nome de X é aceito para Y', () => {
    const active = CHARACTERS.filter((c) => c.active !== false);
    // Índice de chaves por comprimento: só alvos com alguma chave a ≤ 1 edição podem aceitar o palpite.
    const byLength = new Map<number, { key: string; id: string }[]>();
    for (const c of active) {
      for (const key of index.keysOf(c.id)) byLength.set(key.length, [...(byLength.get(key.length) ?? []), { key, id: c.id }]);
    }
    let checked = 0;
    for (const other of active) {
      for (const key of index.keysOf(other.id)) {
        for (const v of typoVariants(key)) {
          const candidates = new Set<string>();
          for (const len of [v.length - 1, v.length, v.length + 1]) {
            for (const entry of byLength.get(len) ?? []) {
              if (entry.id !== other.id && singleEdit(entry.key, v) !== null) candidates.add(entry.id);
            }
          }
          for (const targetId of candidates) {
            checked++;
            if (index.check(v, targetId).correct) {
              // Só pode ser aceito se o palpite for de fato um nome do alvo (ex.: variante coincide com a chave do alvo).
              expect(index.keysOf(targetId), `"${v}" (perto de ${other.id}) aceito para ${targetId}`).toContain(v);
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  }, 60_000);
});

describe('D) utilitários de edição', () => {
  it('classifica a única edição', () => {
    expect(singleEdit('abc', 'abc')).toEqual({ type: 'equal' });
    expect(singleEdit('abcd', 'abdc')).toEqual({ type: 'transpose' });
    expect(singleEdit('abcd', 'abxd')).toEqual({ type: 'substitute', from: 'c', to: 'x' });
    expect(singleEdit('abcd', 'abcde')).toEqual({ type: 'insert' });
    expect(singleEdit('abcd', 'abc')).toEqual({ type: 'delete', truncation: true });
    expect(singleEdit('abcd', 'acd')).toEqual({ type: 'delete', truncation: false });
    expect(singleEdit('abcd', 'badc')).toBeNull();
    expect(singleEdit('abcd', 'ab')).toBeNull();
  });

  it('vizinhança QWERTY', () => {
    expect(areAdjacentKeys('a', 's')).toBe(true);
    expect(areAdjacentKeys('a', 'q')).toBe(true);
    expect(areAdjacentKeys('n', 'm')).toBe(true);
    expect(areAdjacentKeys('a', 'l')).toBe(false);
    expect(areAdjacentKeys('o', 'u')).toBe(false);
  });

  it('isAcceptableTypo nunca aceita a própria igualdade como erro', () => {
    expect(isAcceptableTypo('pikachu', 'pikachu')).toBe(false);
  });
});

/** Gera variantes a 1 edição: trocas por vizinhas, inversões, remoções e inserções de vizinhas. */
function typoVariants(key: string): string[] {
  const out = new Set<string>();
  const letters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < key.length; i++) {
    out.add(key.slice(0, i) + key.slice(i + 1));
    if (i < key.length - 1) out.add(key.slice(0, i) + key[i + 1] + key[i] + key.slice(i + 2));
    for (const ch of letters) {
      if (areAdjacentKeys(key[i] as string, ch)) {
        out.add(key.slice(0, i) + ch + key.slice(i + 1));
        out.add(key.slice(0, i) + ch + key.slice(i));
      }
    }
  }
  out.delete(key);
  return [...out];
}

describe('D) sugestão "Você quis dizer" sem spoiler', () => {
  const suggest = (g: string) => index.suggest(g);
  it('corrige erros pequenos para a grafia exata do catálogo', () => {
    expect(suggest('Snoop Dog')).toBe('Snoop Dogg');
    expect(suggest('snoopy dogg')).toBe('Snoop Dogg');
    expect(suggest('Naruuto')).toBe('Naruto');
    expect(suggest('Homer Simpsom')).toBe('Homer Simpson');
    expect(suggest('Jim Carey')).toBe('Jim Carrey');
  });

  it('nunca completa prefixos, palpites curtos ou nomes próprios comuns', () => {
    for (const g of ['', 'N', 'Na', 'Nar', 'Naru', 'Sno', 'Snoop D', 'Jim', 'Jennifer', 'Michael', 'Darth', 'Homem', 'Michael Jacks', 'Darth Vade']) {
      expect(suggest(g), g).toBeNull();
    }
  });

  it('não sugere quando o palpite já é um nome exato (de qualquer identidade)', () => {
    expect(suggest('Naruto')).toBeNull();
    expect(suggest('Snoopy')).toBeNull();
    expect(suggest('Snoop Dogg')).toBeNull();
  });

  it('não sugere quando há mais de um candidato plausível', () => {
    const fixture: Identity[] = [
      { id: 'a', kind: 'person', category: 'celebrity', level: 1, displayName: 'Johnson Silva', names: ['Johnson Silva'], origin: 'x' },
      { id: 'b', kind: 'person', category: 'celebrity', level: 1, displayName: 'Johnson Silvo', names: ['Johnson Silvo'], origin: 'x' },
    ];
    expect(buildAnswerIndex(fixture).suggest('Johnson Silvp')).toBeNull();
  });

  it('toda sugestão é aceita como resposta da identidade sugerida (coerência com o validador)', () => {
    const samples = ['Snoop Dog', 'Naruuto', 'Homer Simpsom', 'Lionel Mesy', 'Pikachuu', 'Ayrton Sena'];
    for (const g of samples) {
      const s = suggest(g);
      expect(s, g).not.toBeNull();
      const owner = index.ownersOf(answerKey(s!))[0]!;
      expect(index.check(g, owner).correct, `${g} → ${s}`).toBe(true);
    }
  });
});
