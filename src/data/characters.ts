import type { Identity } from '../domain/types';

/**
 * Catálogo curado de identidades.
 *
 * Critério de entrada: SOMENTE ícones extremamente famosos, famosos ou claramente reconhecíveis
 * para o público brasileiro e global. Nada de preencher volume com obscuridades.
 *
 * - `id` é estável e vira o nome do arquivo: public/characters/<id>.webp
 * - `names`/`aliases` são aceitos; `rejected` documenta nomes ambíguos que NÃO valem.
 * - Uma chave normalizada nunca pode pertencer a duas identidades (ver catalog.test.ts).
 * - Imagens são controladas em src/data/assets-manifest.json (status 'missing' até haver arquivo licenciado).
 */
export const CHARACTERS: readonly Identity[] = [
  // ── Anime ────────────────────────────────────────────────────────────
  { id: 'goku', kind: 'character', category: 'anime', level: 1, displayName: 'Goku', names: ['Son Goku', 'Goku', 'Kakarotto', 'Kakarot'], origin: 'Dragon Ball' },
  { id: 'vegeta', kind: 'character', category: 'anime', level: 2, displayName: 'Vegeta', names: ['Vegeta', 'Príncipe Vegeta'], origin: 'Dragon Ball' },
  { id: 'naruto-uzumaki', kind: 'character', category: 'anime', level: 1, displayName: 'Naruto Uzumaki', names: ['Naruto Uzumaki', 'Uzumaki Naruto'], aliases: ['Naruto'], origin: 'Naruto' },
  { id: 'pikachu', kind: 'character', category: 'anime', level: 1, displayName: 'Pikachu', names: ['Pikachu'], origin: 'Pokémon' },
  { id: 'ash-ketchum', kind: 'character', category: 'anime', level: 2, displayName: 'Ash Ketchum', names: ['Ash Ketchum', 'Satoshi'], aliases: ['Ash'], origin: 'Pokémon' },
  { id: 'monkey-d-luffy', kind: 'character', category: 'anime', level: 2, displayName: 'Monkey D. Luffy', names: ['Monkey D. Luffy'], aliases: ['Luffy', 'Ruffy'], origin: 'One Piece' },
  { id: 'sailor-moon', kind: 'character', category: 'anime', level: 2, displayName: 'Sailor Moon', names: ['Sailor Moon', 'Serena Tsukino', 'Usagi Tsukino'], aliases: ['Usagi'], rejected: ['Serena'], origin: 'Sailor Moon' },
  { id: 'seiya-de-pegaso', kind: 'character', category: 'anime', level: 2, displayName: 'Seiya de Pégaso', names: ['Seiya de Pégaso', 'Pegasus Seiya', 'Seiya'], origin: 'Os Cavaleiros do Zodíaco' },
  { id: 'totoro', kind: 'character', category: 'anime', level: 3, displayName: 'Totoro', names: ['Totoro'], origin: 'Meu Amigo Totoro (Studio Ghibli)' },
  { id: 'tanjiro-kamado', kind: 'character', category: 'anime', level: 3, displayName: 'Tanjiro Kamado', names: ['Tanjiro Kamado', 'Kamado Tanjiro'], aliases: ['Tanjiro'], origin: 'Demon Slayer' },

  // ── Desenhos / cartoons ──────────────────────────────────────────────
  { id: 'mickey-mouse', kind: 'character', category: 'cartoon', level: 1, displayName: 'Mickey Mouse', names: ['Mickey Mouse'], aliases: ['Mickey'], origin: 'Disney' },
  { id: 'pato-donald', kind: 'character', category: 'cartoon', level: 1, displayName: 'Pato Donald', names: ['Pato Donald', 'Donald Duck'], aliases: ['Donald'], origin: 'Disney' },
  { id: 'bob-esponja', kind: 'character', category: 'cartoon', level: 1, displayName: 'Bob Esponja', names: ['Bob Esponja', 'Bob Esponja Calça Quadrada', 'SpongeBob', 'SpongeBob SquarePants'], origin: 'Bob Esponja' },
  { id: 'patrick-estrela', kind: 'character', category: 'cartoon', level: 2, displayName: 'Patrick Estrela', names: ['Patrick Estrela', 'Patrick Star'], aliases: ['Patrick'], origin: 'Bob Esponja' },
  { id: 'homer-simpson', kind: 'character', category: 'cartoon', level: 1, displayName: 'Homer Simpson', names: ['Homer Simpson', 'Homer J. Simpson'], aliases: ['Homer'], origin: 'Os Simpsons' },
  { id: 'bart-simpson', kind: 'character', category: 'cartoon', level: 2, displayName: 'Bart Simpson', names: ['Bart Simpson'], aliases: ['Bart'], origin: 'Os Simpsons' },
  { id: 'pernalonga', kind: 'character', category: 'cartoon', level: 1, displayName: 'Pernalonga', names: ['Pernalonga', 'Bugs Bunny'], origin: 'Looney Tunes' },
  { id: 'pica-pau', kind: 'character', category: 'cartoon', level: 1, displayName: 'Pica-Pau', names: ['Pica-Pau', 'Woody Woodpecker'], rejected: ['Woody'], origin: 'Pica-Pau (Walter Lantz)' },
  { id: 'scooby-doo', kind: 'character', category: 'cartoon', level: 1, displayName: 'Scooby-Doo', names: ['Scooby-Doo'], aliases: ['Scooby'], origin: 'Scooby-Doo' },
  { id: 'tom-gato', kind: 'character', category: 'cartoon', level: 2, displayName: 'Tom', names: ['Tom', 'Gato Tom', 'Tom Cat'], origin: 'Tom & Jerry' },
  { id: 'jerry-rato', kind: 'character', category: 'cartoon', level: 2, displayName: 'Jerry', names: ['Jerry', 'Rato Jerry', 'Jerry Mouse'], origin: 'Tom & Jerry' },
  { id: 'monica', kind: 'character', category: 'cartoon', level: 1, displayName: 'Mônica', names: ['Mônica'], origin: 'Turma da Mônica' },
  { id: 'cebolinha', kind: 'character', category: 'cartoon', level: 2, displayName: 'Cebolinha', names: ['Cebolinha'], origin: 'Turma da Mônica' },
  { id: 'pantera-cor-de-rosa', kind: 'character', category: 'cartoon', level: 2, displayName: 'Pantera Cor-de-Rosa', names: ['Pantera Cor-de-Rosa', 'Pink Panther'], aliases: ['Pantera Rosa'], origin: 'A Pantera Cor-de-Rosa' },

  // ── Animação (Disney, Pixar, DreamWorks) ────────────────────────────
  { id: 'elsa', kind: 'character', category: 'animation', level: 1, displayName: 'Elsa', names: ['Elsa', 'Rainha Elsa'], origin: 'Frozen' },
  { id: 'woody', kind: 'character', category: 'animation', level: 1, displayName: 'Woody', names: ['Woody', 'Xerife Woody', 'Sheriff Woody'], origin: 'Toy Story' },
  { id: 'buzz-lightyear', kind: 'character', category: 'animation', level: 1, displayName: 'Buzz Lightyear', names: ['Buzz Lightyear'], aliases: ['Buzz'], origin: 'Toy Story' },
  { id: 'simba', kind: 'character', category: 'animation', level: 1, displayName: 'Simba', names: ['Simba'], origin: 'O Rei Leão' },
  { id: 'stitch', kind: 'character', category: 'animation', level: 2, displayName: 'Stitch', names: ['Stitch', 'Experimento 626'], origin: 'Lilo & Stitch' },
  { id: 'shrek', kind: 'character', category: 'animation', level: 1, displayName: 'Shrek', names: ['Shrek'], origin: 'Shrek' },
  { id: 'moana', kind: 'character', category: 'animation', level: 2, displayName: 'Moana', names: ['Moana', 'Vaiana'], origin: 'Moana' },
  { id: 'nemo', kind: 'character', category: 'animation', level: 2, displayName: 'Nemo', names: ['Nemo'], origin: 'Procurando Nemo' },
  { id: 'relampago-mcqueen', kind: 'character', category: 'animation', level: 2, displayName: 'Relâmpago McQueen', names: ['Relâmpago McQueen', 'Lightning McQueen'], aliases: ['McQueen'], origin: 'Carros' },

  // ── Games ────────────────────────────────────────────────────────────
  { id: 'mario', kind: 'character', category: 'game', level: 1, displayName: 'Mario', names: ['Mario', 'Super Mario'], origin: 'Super Mario' },
  { id: 'luigi', kind: 'character', category: 'game', level: 2, displayName: 'Luigi', names: ['Luigi'], origin: 'Super Mario' },
  { id: 'sonic', kind: 'character', category: 'game', level: 1, displayName: 'Sonic', names: ['Sonic', 'Sonic the Hedgehog', 'Sonic o Ouriço'], origin: 'Sonic' },
  { id: 'pac-man', kind: 'character', category: 'game', level: 1, displayName: 'Pac-Man', names: ['Pac-Man'], origin: 'Pac-Man' },
  { id: 'link', kind: 'character', category: 'game', level: 2, displayName: 'Link', names: ['Link'], rejected: ['Zelda'], origin: 'The Legend of Zelda' },
  { id: 'lara-croft', kind: 'character', category: 'game', level: 2, displayName: 'Lara Croft', names: ['Lara Croft'], origin: 'Tomb Raider' },
  { id: 'kratos', kind: 'character', category: 'game', level: 3, displayName: 'Kratos', names: ['Kratos'], origin: 'God of War' },
  { id: 'kirby', kind: 'character', category: 'game', level: 3, displayName: 'Kirby', names: ['Kirby'], origin: 'Kirby' },
  { id: 'master-chief', kind: 'character', category: 'game', level: 3, displayName: 'Master Chief', names: ['Master Chief', 'John-117'], origin: 'Halo' },

  // ── Filmes e séries (personagens) ───────────────────────────────────
  { id: 'darth-vader', kind: 'character', category: 'film-tv', level: 1, displayName: 'Darth Vader', names: ['Darth Vader', 'Anakin Skywalker'], aliases: ['Vader'], origin: 'Star Wars' },
  { id: 'yoda', kind: 'character', category: 'film-tv', level: 2, displayName: 'Yoda', names: ['Yoda', 'Mestre Yoda'], origin: 'Star Wars' },
  { id: 'harry-potter', kind: 'character', category: 'film-tv', level: 1, displayName: 'Harry Potter', names: ['Harry Potter'], aliases: ['Harry'], origin: 'Harry Potter' },
  { id: 'chaves', kind: 'character', category: 'film-tv', level: 1, displayName: 'Chaves', names: ['Chaves', 'El Chavo', 'El Chavo del Ocho'], origin: 'Chaves (Chespirito)' },
  { id: 'seu-madruga', kind: 'character', category: 'film-tv', level: 2, displayName: 'Seu Madruga', names: ['Seu Madruga', 'Don Ramón'], aliases: ['Madruga'], origin: 'Chaves (Chespirito)' },
  { id: 'jack-sparrow', kind: 'character', category: 'film-tv', level: 2, displayName: 'Jack Sparrow', names: ['Jack Sparrow', 'Capitão Jack Sparrow'], origin: 'Piratas do Caribe' },
  { id: 'eleven', kind: 'character', category: 'film-tv', level: 3, displayName: 'Eleven (Onze)', names: ['Eleven', 'Onze', 'Jane Hopper'], origin: 'Stranger Things' },

  // ── Quadrinhos / super-heróis ───────────────────────────────────────
  { id: 'homem-aranha', kind: 'character', category: 'comics', level: 1, displayName: 'Homem-Aranha', names: ['Homem-Aranha', 'Spider-Man', 'Peter Parker'], origin: 'Marvel' },
  { id: 'batman', kind: 'character', category: 'comics', level: 1, displayName: 'Batman', names: ['Batman', 'Bruce Wayne'], origin: 'DC' },
  { id: 'superman', kind: 'character', category: 'comics', level: 1, displayName: 'Superman', names: ['Superman', 'Super-Homem', 'Clark Kent'], origin: 'DC' },
  { id: 'mulher-maravilha', kind: 'character', category: 'comics', level: 2, displayName: 'Mulher-Maravilha', names: ['Mulher-Maravilha', 'Wonder Woman', 'Diana Prince'], origin: 'DC' },
  { id: 'homem-de-ferro', kind: 'character', category: 'comics', level: 1, displayName: 'Homem de Ferro', names: ['Homem de Ferro', 'Iron Man', 'Tony Stark'], origin: 'Marvel' },
  { id: 'hulk', kind: 'character', category: 'comics', level: 1, displayName: 'Hulk', names: ['Hulk', 'Incrível Hulk', 'Bruce Banner'], origin: 'Marvel' },
  { id: 'capitao-america', kind: 'character', category: 'comics', level: 2, displayName: 'Capitão América', names: ['Capitão América', 'Captain America', 'Steve Rogers'], origin: 'Marvel' },
  { id: 'coringa', kind: 'character', category: 'comics', level: 2, displayName: 'Coringa', names: ['Coringa', 'Joker'], origin: 'DC' },

  // ── Música ───────────────────────────────────────────────────────────
  { id: 'michael-jackson', kind: 'person', category: 'music', level: 1, displayName: 'Michael Jackson', names: ['Michael Jackson'], aliases: ['Rei do Pop'], rejected: ['MJ', 'Michael'], origin: 'Cantor (EUA)' },
  { id: 'beyonce', kind: 'person', category: 'music', level: 1, displayName: 'Beyoncé', names: ['Beyoncé', 'Beyoncé Knowles'], aliases: ['Queen B'], origin: 'Cantora (EUA)' },
  { id: 'taylor-swift', kind: 'person', category: 'music', level: 1, displayName: 'Taylor Swift', names: ['Taylor Swift'], aliases: ['Taylor'], origin: 'Cantora (EUA)' },
  { id: 'madonna', kind: 'person', category: 'music', level: 2, displayName: 'Madonna', names: ['Madonna'], origin: 'Cantora (EUA)' },
  { id: 'freddie-mercury', kind: 'person', category: 'music', level: 1, displayName: 'Freddie Mercury', names: ['Freddie Mercury'], aliases: ['Freddie'], origin: 'Cantor (Queen)' },
  { id: 'elvis-presley', kind: 'person', category: 'music', level: 1, displayName: 'Elvis Presley', names: ['Elvis Presley'], aliases: ['Elvis', 'Rei do Rock'], origin: 'Cantor (EUA)' },
  { id: 'anitta', kind: 'person', category: 'music', level: 1, displayName: 'Anitta', names: ['Anitta', 'Larissa de Macedo Machado'], aliases: ['Anita'], origin: 'Cantora (Brasil)' },
  { id: 'shakira', kind: 'person', category: 'music', level: 2, displayName: 'Shakira', names: ['Shakira'], origin: 'Cantora (Colômbia)' },
  { id: 'rihanna', kind: 'person', category: 'music', level: 2, displayName: 'Rihanna', names: ['Rihanna'], aliases: ['Rihana', 'Riri'], origin: 'Cantora (Barbados)' },
  { id: 'xuxa', kind: 'person', category: 'music', level: 2, displayName: 'Xuxa', names: ['Xuxa', 'Xuxa Meneghel'], aliases: ['Rainha dos Baixinhos'], origin: 'Apresentadora e cantora (Brasil)' },
  { id: 'roberto-carlos-cantor', kind: 'person', category: 'music', level: 1, displayName: 'Roberto Carlos', names: ['Roberto Carlos'], aliases: ['O Rei'], origin: 'Cantor (Brasil)' },

  // ── Esporte ─────────────────────────────────────────────────────────
  { id: 'pele', kind: 'person', category: 'sport', level: 1, displayName: 'Pelé', names: ['Pelé', 'Edson Arantes do Nascimento'], aliases: ['Rei Pelé', 'Rei do Futebol'], origin: 'Futebol (Brasil)' },
  { id: 'neymar', kind: 'person', category: 'sport', level: 1, displayName: 'Neymar', names: ['Neymar', 'Neymar Jr', 'Neymar Júnior'], aliases: ['Ney'], origin: 'Futebol (Brasil)' },
  { id: 'cristiano-ronaldo', kind: 'person', category: 'sport', level: 1, displayName: 'Cristiano Ronaldo', names: ['Cristiano Ronaldo'], aliases: ['CR7', 'Cristiano'], rejected: ['Ronaldo'], origin: 'Futebol (Portugal)' },
  { id: 'ronaldo-nazario', kind: 'person', category: 'sport', level: 2, displayName: 'Ronaldo Fenômeno', names: ['Ronaldo Nazário', 'Ronaldo Fenômeno', 'Ronaldo Luís Nazário de Lima'], aliases: ['Fenômeno', 'R9'], rejected: ['Ronaldo'], origin: 'Futebol (Brasil)' },
  { id: 'lionel-messi', kind: 'person', category: 'sport', level: 1, displayName: 'Lionel Messi', names: ['Lionel Messi', 'Leo Messi'], aliases: ['Messi'], origin: 'Futebol (Argentina)' },
  { id: 'ayrton-senna', kind: 'person', category: 'sport', level: 1, displayName: 'Ayrton Senna', names: ['Ayrton Senna'], aliases: ['Senna'], origin: 'Fórmula 1 (Brasil)' },
  { id: 'michael-jordan', kind: 'person', category: 'sport', level: 1, displayName: 'Michael Jordan', names: ['Michael Jordan'], aliases: ['Air Jordan', 'Jordan'], rejected: ['MJ', 'Michael'], origin: 'Basquete (EUA)' },
  { id: 'usain-bolt', kind: 'person', category: 'sport', level: 2, displayName: 'Usain Bolt', names: ['Usain Bolt'], aliases: ['Bolt'], origin: 'Atletismo (Jamaica)' },
  { id: 'serena-williams', kind: 'person', category: 'sport', level: 2, displayName: 'Serena Williams', names: ['Serena Williams'], rejected: ['Serena'], origin: 'Tênis (EUA)' },
  { id: 'lebron-james', kind: 'person', category: 'sport', level: 2, displayName: 'LeBron James', names: ['LeBron James'], aliases: ['LeBron', 'King James'], origin: 'Basquete (EUA)' },
  { id: 'marta', kind: 'person', category: 'sport', level: 2, displayName: 'Marta', names: ['Marta', 'Marta Vieira da Silva'], aliases: ['Rainha Marta'], origin: 'Futebol (Brasil)' },

  // ── Celebridades (atores, apresentadores) ───────────────────────────
  { id: 'silvio-santos', kind: 'person', category: 'celebrity', level: 1, displayName: 'Silvio Santos', names: ['Silvio Santos', 'Senor Abravanel'], origin: 'Apresentador (Brasil)' },
  { id: 'dwayne-johnson', kind: 'person', category: 'celebrity', level: 2, displayName: 'Dwayne Johnson', names: ['Dwayne Johnson', 'The Rock'], origin: 'Ator (EUA)' },
  { id: 'leonardo-dicaprio', kind: 'person', category: 'celebrity', level: 2, displayName: 'Leonardo DiCaprio', names: ['Leonardo DiCaprio', 'Leo DiCaprio'], aliases: ['DiCaprio'], origin: 'Ator (EUA)' },
  { id: 'tom-cruise', kind: 'person', category: 'celebrity', level: 2, displayName: 'Tom Cruise', names: ['Tom Cruise'], origin: 'Ator (EUA)' },
  { id: 'will-smith', kind: 'person', category: 'celebrity', level: 2, displayName: 'Will Smith', names: ['Will Smith'], origin: 'Ator (EUA)' },
  { id: 'marilyn-monroe', kind: 'person', category: 'celebrity', level: 2, displayName: 'Marilyn Monroe', names: ['Marilyn Monroe'], aliases: ['Marilyn', 'Marylin Monroe'], origin: 'Atriz (EUA)' },
  { id: 'charlie-chaplin', kind: 'person', category: 'celebrity', level: 2, displayName: 'Charlie Chaplin', names: ['Charlie Chaplin', 'Carlitos'], aliases: ['Chaplin'], origin: 'Ator e diretor (Reino Unido)' },
  { id: 'gisele-bundchen', kind: 'person', category: 'celebrity', level: 2, displayName: 'Gisele Bündchen', names: ['Gisele Bündchen'], aliases: ['Gisele'], origin: 'Modelo (Brasil)' },
  { id: 'keanu-reeves', kind: 'person', category: 'celebrity', level: 3, displayName: 'Keanu Reeves', names: ['Keanu Reeves'], aliases: ['Keanu'], origin: 'Ator (Canadá/EUA)' },
  { id: 'zendaya', kind: 'person', category: 'celebrity', level: 3, displayName: 'Zendaya', names: ['Zendaya'], origin: 'Atriz (EUA)' },
];

export const CATEGORY_LABELS: Record<Identity['category'], string> = {
  anime: 'Anime',
  cartoon: 'Desenho',
  animation: 'Animação',
  game: 'Game',
  'film-tv': 'Filme / Série',
  comics: 'Quadrinhos',
  music: 'Música',
  sport: 'Esporte',
  celebrity: 'Celebridade',
};

export function activeCharacters(catalog: readonly Identity[] = CHARACTERS): Identity[] {
  return catalog.filter((c) => c.active !== false);
}
