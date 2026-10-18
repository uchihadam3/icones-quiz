/** 1 = extremamente famoso, 2 = famoso, 3 = reconhecível. Nunca obscuro. */
export type RecognitionLevel = 1 | 2 | 3;

/** "character" = personagem fictício; "person" = pessoa real. Nunca misturar no mesmo prompt. */
export type IdentityKind = 'character' | 'person';

export type Category =
  | 'anime'
  | 'cartoon'
  | 'animation'
  | 'game'
  | 'film-tv'
  | 'comics'
  | 'music'
  | 'sport'
  | 'celebrity';

export interface Identity {
  /** Id estável, kebab-case, nunca reutilizado. Também é o nome do arquivo de imagem. */
  id: string;
  kind: IdentityKind;
  category: Category;
  level: RecognitionLevel;
  /** Nome exibido (pt-BR) após a rodada e nas alternativas. */
  displayName: string;
  /** Nomes completos aceitos (pt-BR, original, inglês…). */
  names: readonly string[];
  /** Apelidos aceitos. */
  aliases?: readonly string[];
  /** Nomes que NÃO devem ser aceitos para esta identidade (ex.: ambíguos com outra). */
  rejected?: readonly string[];
  /** Origem/contexto: franquia, obra, esporte, país… */
  origin: string;
  /** false = fora de rotação (mantém o id reservado). */
  active?: boolean;
}

export type Rng = () => number;
