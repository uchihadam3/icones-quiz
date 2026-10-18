# Integração de imagens (instruções para o Codex / curadoria)

Estado atual (Etapa 01): **nenhuma imagem incluída**. Todas as 89 entradas do manifesto estão com
`status: "missing"`. O jogo competitivo fica bloqueado com "Banco de imagens em preparação" e o preview
de desenvolvimento usa um espaço neutro "Imagem a adicionar".

## Regras inegociáveis

1. **Só imagens com permissão de uso comprovada.** Busca no Google Imagens não é permissão. Sem
   scraping, sem hotlink, sem URLs frágeis de terceiros. O arquivo é baixado, revisado e versionado
   aqui.
2. **Nunca** gerar/desenhar uma ilustração "parecida" com um personagem ou pessoa e apresentá-la como
   retrato. Também não usar IA generativa para imitar personagens protegidos ou pessoas reais.
3. Imagem **inteira e nítida**; nada de recortes que escondam a identidade ou deixem só um detalhe.
4. Sem texto que entregue a resposta (nome, logo da franquia, legenda, marca d'água com o nome).
5. Personagem ≠ ator: a foto de um ator como ele mesmo é uma entrada `person`; o personagem em
   figurino/animação é uma entrada `character`. Não usar foto de ator para uma entrada de personagem.

## Fontes candidatas (verificar licença de CADA arquivo)

- **Wikimedia Commons** — fotos de pessoas reais com CC BY / CC BY-SA / domínio público. Exige
  atribuição (autor + licença + link). CC BY-SA: o próprio arquivo derivado (recorte/conversão) segue
  CC BY-SA.
- **Licenciamento oficial** (estúdios, editoras, agências de imagem como Getty/AP/Alamy) — necessário
  para a maioria dos personagens de Disney, Nintendo, Toei, Warner, Marvel/DC etc. Registrar o contrato
  ou a licença no campo `license`.
- **Kits de imprensa** oficiais só se os termos permitirem uso em jogo público.
- Personagens protegidos geralmente **não** têm imagem livre; se não houver licença, a entrada continua
  `missing` (ou fica `active: false`).

## Especificação do arquivo

| Item | Valor |
|---|---|
| Caminho | `public/characters/<id>.webp` (o `id` vem de `src/data/characters.ts`) |
| Formato | WebP (qualidade ~80, sem metadados EXIF de localização) |
| Proporção | **4:5** exata (validada com tolerância 0.01) |
| Tamanho mínimo | 640 × 800; recomendado 960 × 1200 |
| Peso | alvo ≤ 150 KB |
| Enquadramento | sujeito centralizado, rosto/silhueta inteiros, fundo neutro se possível |

Exemplo de conversão (FFmpeg/cwebp/Pillow, qualquer um):

```bash
# recorte central 4:5 e redimensiona para 960x1200
ffmpeg -i original.jpg -vf "crop='min(iw,ih*4/5)':'min(ih,iw*5/4)',scale=960:1200" -q:v 80 public/characters/goku.webp
```

## Atualizar o manifesto

Para cada imagem aprovada, edite `src/data/assets-manifest.json`:

```json
"pele": {
  "status": "ready",
  "file": "characters/pele.webp",
  "width": 960,
  "height": 1200,
  "sourceUrl": "https://commons.wikimedia.org/wiki/File:....jpg",
  "author": "Nome do autor",
  "license": "CC-BY-SA-4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
  "attribution": "Foto: Nome do autor / Wikimedia Commons, CC BY-SA 4.0"
}
```

- `status`: `missing` → `ready` (ou `rejected` se reprovar na curadoria; tratado como ausente).
- Novas identidades: adicione em `src/data/characters.ts` e rode `node scripts/sync-manifest.mjs`
  (só acrescenta entradas `missing`, nunca altera as existentes).

## Validação automática (CI)

`npm run validate:assets` (também roda em `npm test`) falha se:

- uma identidade ativa não tiver entrada no manifesto, ou houver entrada órfã;
- uma entrada `ready` não tiver arquivo, não for WebP válido, for menor que 640×800, sair de 4:5, ou
  estiver sem `license`, `sourceUrl` (https) ou `attribution`;
- existir `.webp` em `public/characters/` sem status `ready` (imagem não revisada).

## Checklist por imagem

- [ ] Licença permite uso público em jogo (e modificação: recorte/conversão)
- [ ] Atribuição registrada exatamente como a licença exige
- [ ] Sem nome/logo/legenda visível
- [ ] Identidade reconhecível de imediato, imagem inteira
- [ ] 4:5, ≥ 640×800, WebP, ≤ ~150 KB
- [ ] `npm test` verde

## Pendências conhecidas

- Página de créditos exibindo `attribution` de todas as imagens `ready` (obrigatória antes da 1ª
  imagem CC BY/BY-SA ir ao ar) — ver ROADMAP.
- Os arquivos usam o `id` no nome (`goku.webp`), visível nas ferramentas do navegador. Antes de ranking
  online, o build deve publicar nomes com hash (o manifesto já desacopla `id` de `file`).
