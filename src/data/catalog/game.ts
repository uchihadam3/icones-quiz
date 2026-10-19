import { rows } from './define';

// Personagens de videogame muito conhecidos.
export default rows('game', [
  // Nintendo
  ['mario', 1, 'Mario', 'Mario|Super Mario', 'Super Mario'],
  ['luigi', 2, 'Luigi', 'Luigi', 'Super Mario'],
  ['princesa-peach', 1, 'Princesa Peach', 'Princesa Peach|Princess Peach', 'Super Mario', 'Peach'],
  ['bowser', 1, 'Bowser', 'Bowser|Rei Koopa', 'Super Mario'],
  ['yoshi', 1, 'Yoshi', 'Yoshi', 'Super Mario'],
  ['toad', 2, 'Toad', 'Toad', 'Super Mario'],
  ['wario', 2, 'Wario', 'Wario', 'Super Mario'],
  ['donkey-kong', 1, 'Donkey Kong', 'Donkey Kong', 'Donkey Kong'],
  ['link', 2, 'Link', 'Link', 'The Legend of Zelda', undefined, 'Zelda'],
  ['princesa-zelda', 2, 'Princesa Zelda', 'Princesa Zelda|Princess Zelda', 'The Legend of Zelda'],
  ['kirby', 3, 'Kirby', 'Kirby', 'Kirby'],
  ['samus-aran', 3, 'Samus Aran', 'Samus Aran', 'Metroid', 'Samus'],
  // Sega
  ['sonic', 1, 'Sonic', 'Sonic|Sonic the Hedgehog|Sonic o Ouriço', 'Sonic'],
  ['tails', 2, 'Tails', 'Tails|Miles Prower', 'Sonic'],
  ['knuckles', 2, 'Knuckles', 'Knuckles', 'Sonic'],
  ['shadow-the-hedgehog', 3, 'Shadow', 'Shadow|Shadow the Hedgehog', 'Sonic'],
  ['dr-eggman', 2, 'Dr. Eggman', 'Dr. Eggman|Doutor Eggman|Eggman|Dr. Robotnik|Robotnik', 'Sonic'],
  // Clássicos e PlayStation
  ['pac-man', 1, 'Pac-Man', 'Pac-Man', 'Pac-Man'],
  ['crash-bandicoot', 2, 'Crash Bandicoot', 'Crash Bandicoot', 'Crash Bandicoot', 'Crash'],
  ['spyro', 3, 'Spyro', 'Spyro|Spyro the Dragon', 'Spyro'],
  ['mega-man', 2, 'Mega Man', 'Mega Man|Megaman|Rockman', 'Mega Man'],
  ['lara-croft', 2, 'Lara Croft', 'Lara Croft', 'Tomb Raider'],
  ['kratos', 3, 'Kratos', 'Kratos', 'God of War'],
  ['nathan-drake', 3, 'Nathan Drake', 'Nathan Drake', 'Uncharted'],
  ['ellie-tlou', 3, 'Ellie', 'Ellie|Ellie Williams', 'The Last of Us'],
  ['cloud-strife', 3, 'Cloud Strife', 'Cloud Strife', 'Final Fantasy VII', 'Cloud'],
  ['master-chief', 3, 'Master Chief', 'Master Chief|John-117', 'Halo'],
  ['solid-snake', 3, 'Solid Snake', 'Solid Snake', 'Metal Gear Solid'],
  ['geralt-de-rivia', 3, 'Geralt de Rívia', 'Geralt de Rívia|Geralt of Rivia', 'The Witcher', 'Geralt'],
  ['cj-gta', 3, 'CJ', 'CJ|Carl Johnson', 'GTA San Andreas'],
  // Luta
  ['ryu-street-fighter', 2, 'Ryu', 'Ryu', 'Street Fighter'],
  ['chun-li', 2, 'Chun-Li', 'Chun-Li', 'Street Fighter'],
  ['scorpion', 2, 'Scorpion', 'Scorpion', 'Mortal Kombat'],
  ['sub-zero', 2, 'Sub-Zero', 'Sub-Zero', 'Mortal Kombat'],
  // Fenômenos recentes
  ['steve-minecraft', 1, 'Steve', 'Steve|Steve do Minecraft', 'Minecraft'],
  ['creeper', 1, 'Creeper', 'Creeper', 'Minecraft'],
  ['bomberman', 3, 'Bomberman', 'Bomberman', 'Bomberman'],
  ['rayman', 3, 'Rayman', 'Rayman', 'Rayman'],
]);
