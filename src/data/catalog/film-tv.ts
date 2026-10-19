import { rows } from './define';

/**
 * Personagens de filmes e séries (live-action).
 * Regra: não incluir também o ATOR do papel icônico (ex.: Han Solo/Indiana Jones ⇒ sem Harrison Ford),
 * para que uma foto nunca tenha duas respostas plausíveis. Ver ACTOR_CHARACTER_CONFLICTS em catalog.test.ts.
 */
export default rows('film-tv', [
  // Star Wars
  ['darth-vader', 1, 'Darth Vader', 'Darth Vader|Anakin Skywalker', 'Star Wars', 'Vader'],
  ['yoda', 2, 'Yoda', 'Yoda|Mestre Yoda', 'Star Wars'],
  ['luke-skywalker', 1, 'Luke Skywalker', 'Luke Skywalker', 'Star Wars', 'Luke'],
  ['princesa-leia', 1, 'Princesa Leia', 'Princesa Leia|Leia Organa|Princess Leia', 'Star Wars', 'Leia'],
  ['han-solo', 2, 'Han Solo', 'Han Solo', 'Star Wars'],
  ['chewbacca', 1, 'Chewbacca', 'Chewbacca', 'Star Wars', 'Chewie'],
  ['r2-d2', 1, 'R2-D2', 'R2-D2|Artoo', 'Star Wars'],
  ['c-3po', 1, 'C-3PO', 'C-3PO|C3PO', 'Star Wars'],
  ['grogu', 2, 'Grogu', 'Grogu|Baby Yoda', 'The Mandalorian'],
  ['stormtrooper', 2, 'Stormtrooper', 'Stormtrooper', 'Star Wars'],
  ['mandaloriano', 3, 'Mandaloriano', 'Mandaloriano|The Mandalorian|Din Djarin|Mando', 'The Mandalorian'],
  // Harry Potter
  ['harry-potter', 1, 'Harry Potter', 'Harry Potter', 'Harry Potter', 'Harry'],
  ['hermione-granger', 2, 'Hermione Granger', 'Hermione Granger', 'Harry Potter', 'Hermione'],
  ['rony-weasley', 2, 'Rony Weasley', 'Rony Weasley|Ron Weasley', 'Harry Potter', 'Rony'],
  ['dumbledore', 2, 'Alvo Dumbledore', 'Alvo Dumbledore|Albus Dumbledore|Dumbledore', 'Harry Potter'],
  ['voldemort', 2, 'Voldemort', 'Voldemort|Lord Voldemort|Tom Riddle', 'Harry Potter'],
  ['hagrid', 2, 'Hagrid', 'Hagrid|Rúbeo Hagrid|Rubeus Hagrid', 'Harry Potter'],
  ['severo-snape', 2, 'Severo Snape', 'Severo Snape|Severus Snape', 'Harry Potter', 'Snape'],
  // O Senhor dos Anéis
  ['gandalf', 1, 'Gandalf', 'Gandalf|Gandalf, o Cinzento|Gandalf, o Branco', 'O Senhor dos Anéis'],
  ['frodo', 2, 'Frodo Bolseiro', 'Frodo Bolseiro|Frodo Baggins', 'O Senhor dos Anéis', 'Frodo'],
  ['gollum', 1, 'Gollum', 'Gollum|Sméagol', 'O Senhor dos Anéis'],
  ['legolas', 2, 'Legolas', 'Legolas', 'O Senhor dos Anéis'],
  ['aragorn', 3, 'Aragorn', 'Aragorn|Passolargo', 'O Senhor dos Anéis'],
  // Chaves e Chapolin (Chespirito)
  ['chaves', 1, 'Chaves', 'Chaves|El Chavo|El Chavo del Ocho', 'Chaves (Chespirito)'],
  ['chapolin', 1, 'Chapolin Colorado', 'Chapolin Colorado|Chapolin|El Chapulín Colorado', 'Chapolin (Chespirito)'],
  ['seu-madruga', 2, 'Seu Madruga', 'Seu Madruga|Don Ramón', 'Chaves (Chespirito)', 'Madruga'],
  ['quico', 1, 'Quico', 'Quico|Kiko', 'Chaves (Chespirito)'],
  ['chiquinha', 1, 'Chiquinha', 'Chiquinha|La Chilindrina', 'Chaves (Chespirito)'],
  ['dona-florinda', 2, 'Dona Florinda', 'Dona Florinda|Doña Florinda', 'Chaves (Chespirito)'],
  ['professor-girafales', 2, 'Professor Girafales', 'Professor Girafales|Profesor Jirafales', 'Chaves (Chespirito)', 'Girafales'],
  ['seu-barriga', 2, 'Seu Barriga', 'Seu Barriga|Señor Barriga|Sr. Barriga', 'Chaves (Chespirito)'],
  // Séries
  ['eleven', 3, 'Eleven (Onze)', 'Eleven|Onze|Jane Hopper', 'Stranger Things'],
  ['walter-white', 2, 'Walter White', 'Walter White', 'Breaking Bad', 'Heisenberg'],
  ['jesse-pinkman', 3, 'Jesse Pinkman', 'Jesse Pinkman', 'Breaking Bad'],
  ['wandinha-addams', 2, 'Wandinha Addams', 'Wandinha Addams|Wandinha|Wednesday Addams', 'A Família Addams / Wandinha'],
  ['daenerys', 2, 'Daenerys Targaryen', 'Daenerys Targaryen', 'Game of Thrones', 'Daenerys|Khaleesi'],
  ['jon-snow', 2, 'Jon Snow', 'Jon Snow', 'Game of Thrones'],
  ['sheldon-cooper', 2, 'Sheldon Cooper', 'Sheldon Cooper', 'The Big Bang Theory', 'Sheldon'],
  ['spock', 2, 'Spock', 'Spock|Sr. Spock|Mr. Spock', 'Star Trek'],
  ['mr-bean', 1, 'Mr. Bean', 'Mr. Bean|Mister Bean', 'Mr. Bean'],
  // Cinema
  ['jack-sparrow', 2, 'Jack Sparrow', 'Jack Sparrow|Capitão Jack Sparrow', 'Piratas do Caribe'],
  ['indiana-jones', 1, 'Indiana Jones', 'Indiana Jones', 'Indiana Jones', 'Indy'],
  ['james-bond', 1, 'James Bond', 'James Bond|007', 'James Bond'],
  ['rocky-balboa', 2, 'Rocky Balboa', 'Rocky Balboa', 'Rocky', 'Rocky'],
  ['e-t', 1, 'E.T.', 'E.T.|E.T. o Extraterrestre', 'E.T. – O Extraterrestre'],
  ['marty-mcfly', 2, 'Marty McFly', 'Marty McFly', 'De Volta para o Futuro', 'Marty'],
  ['doc-brown', 2, 'Doc Brown', 'Doc Brown|Emmett Brown|Dr. Emmett Brown', 'De Volta para o Futuro'],
  ['robocop', 2, 'RoboCop', 'RoboCop', 'RoboCop'],
  ['predador', 2, 'Predador', 'Predador|Predator', 'O Predador'],
  ['sherlock-holmes', 2, 'Sherlock Holmes', 'Sherlock Holmes', 'Sherlock Holmes', 'Sherlock'],
  ['capitao-nascimento', 2, 'Capitão Nascimento', 'Capitão Nascimento|Coronel Nascimento', 'Tropa de Elite'],
  // Monstros e terror
  ['godzilla', 1, 'Godzilla', 'Godzilla', 'Godzilla'],
  ['king-kong', 1, 'King Kong', 'King Kong', 'King Kong'],
  ['dracula', 2, 'Drácula', 'Drácula|Dracula|Conde Drácula', 'Drácula'],
  ['frankenstein', 2, 'Frankenstein', 'Frankenstein|Monstro de Frankenstein', 'Frankenstein'],
  ['freddy-krueger', 2, 'Freddy Krueger', 'Freddy Krueger', 'A Hora do Pesadelo'],
  ['jason-voorhees', 2, 'Jason Voorhees', 'Jason Voorhees', 'Sexta-Feira 13'],
  ['chucky', 2, 'Chucky', 'Chucky|Brinquedo Assassino', 'Brinquedo Assassino'],
  ['pennywise', 2, 'Pennywise', 'Pennywise', 'It: A Coisa'],
]);
