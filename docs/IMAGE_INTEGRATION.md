# Integração de imagens (instruções para o Codex / curadoria)

Estado atual: **464 imagens prontas** entre as **1.492** entradas do manifesto (fila priorizada em
`reports/catalog-report.md`, gerada por `npm run catalog:report -- --write`). O modo competitivo
está liberado; o treino usa o pôster neutro "Imagem a adicionar" nas entradas ainda sem arte.

## Resumo do fluxo para o Codex

1. Salvar a imagem aprovada em `art/characters/<id>.webp` (o `id` está em `src/data/catalog/*.ts`).
2. No `src/data/assets-manifest.json`, trocar a entrada do id para `status: "ready"` e preencher fonte,
   autor, licença e atribuição (formato abaixo).
3. Rodar `npm run assets:sync` (atualiza o resumo da home) e `npm run assets:report` (confere tudo).
4. `npm test` valida arquivo, dimensões, proporção 4:5 e metadados. Pronto: o build publica a imagem como
   `img/<hash>.webp` e o modo competitivo **libera sozinho** ao atingir o limiar.

## Regras inegociáveis

1. **Só imagens com permissão de uso comprovada.** Busca no Google Imagens não é permissão. Sem
   scraping, sem hotlink, sem URLs frágeis de terceiros. O arquivo é baixado, revisado e versionado
   aqui.
2. Artes geradas para o jogo devem ser reconhecíveis, revisadas individualmente e registradas como
   `origin: "generated"`, com prompt, autor e nota de direitos. Não inventar uma licença nem atribuir
   uma imagem gerada a uma fonte externa. Para retratos de pessoas reais, priorizar fotografias
   verificáveis com permissão de uso.
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
- Personagens protegidos geralmente **não** têm imagem oficial livre; se não houver uma imagem adequada
  com permissão verificável ou geração bem-sucedida, a entrada continua `missing`.

## Especificação do arquivo

| Item | Valor |
|---|---|
| Caminho | `art/characters/<id>.webp` (o `id` vem de `src/data/catalog/*.ts`) — **nunca em `public/`** |
| Formato | WebP (qualidade ~80, sem metadados EXIF de localização) |
| Proporção | **4:5** exata (validada com tolerância 0.01) |
| Tamanho mínimo | 640 × 800; recomendado 960 × 1200 |
| Peso | alvo ≤ 150 KB |
| Enquadramento | sujeito centralizado, rosto/silhueta inteiros, fundo neutro se possível |

Exemplo de conversão (FFmpeg/cwebp/Pillow, qualquer um):

```bash
# recorte central 4:5 e redimensiona para 960x1200
ffmpeg -i original.jpg -vf "crop='min(iw,ih*4/5)':'min(ih,iw*5/4)',scale=960:1200" -q:v 80 art/characters/goku.webp
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
- Para arte original gerada, use `origin: "generated"`, `generationPrompt`, `author`, `rightsNote`
  e `attribution`; `sourceUrl` e `license` são obrigatórios somente para arquivo externo.
- Novas identidades: adicione uma linha no arquivo da categoria em `src/data/catalog/` e rode
  `npm run assets:sync` (só acrescenta entradas `missing`, nunca altera as existentes; ids não podem
  sumir — use `active: false`).

## Validação automática (CI)

`npm run validate:assets` (também roda em `npm test`) falha se:

- uma identidade ativa não tiver entrada no manifesto, ou houver entrada órfã;
- uma entrada `ready` não tiver arquivo, não for WebP válido, for menor que 640×800, sair de 4:5, ou
  estiver sem `license`, `sourceUrl` (https) ou `attribution`;
- existir `.webp` em `art/characters/` sem status `ready` (imagem não revisada);
- existir a pasta `public/characters/` (seria publicada com o id no nome);
- o resumo da home (`src/data/catalog-summary.json`) estiver desatualizado (rode `npm run assets:sync`).

`npm run assets:report` mostra: total, missing/ready/rejected, distribuição por categoria e nível,
situação do modo competitivo e arquivos quebrados (ready sem arquivo, arquivo vazio).

## Publicação sem o id na URL

O plugin `vite/characterImages.ts` publica cada imagem `ready` como `img/<sha256-16>.webp` (nome = hash do
conteúdo). A aba de rede não mostra mais `goku.webp`. **Não é anti-fraude**: o mapa id → URL está no
JavaScript do cliente. Ranking online exigirá servir as imagens pelo servidor (ver ROADMAP).

## Liberação automática do modo competitivo

`src/data/unlock.json`: **30 imagens prontas, sendo 12 de nível 1**. Justificativa: as 5 primeiras
rodadas sorteiam 80% nível 1 e uma partida típica dura 15–30 rodadas; com esse conjunto não há repetição
e a curva de dificuldade se mantém. Ao atingir o limiar, a home troca "Jogar (em breve)" por "Jogar"
sem mudar código.

## Checklist por imagem

- [ ] Licença permite uso público em jogo (e modificação: recorte/conversão)
- [ ] Atribuição registrada exatamente como a licença exige
- [ ] Sem nome/logo/legenda visível
- [ ] Identidade reconhecível de imediato, imagem inteira
- [ ] 4:5, ≥ 640×800, WebP, ≤ ~150 KB
- [ ] `npm test` verde

## Pendências conhecidas

- Créditos das imagens `ready` ficam no rodapé da página inicial.
- Ranking online: servir imagens pelo servidor com URLs efêmeras (o hash atual só esconde o nome).
