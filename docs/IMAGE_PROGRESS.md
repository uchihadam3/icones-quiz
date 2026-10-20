# Continuidade das imagens — Ícones

Atualizado em 20/10/2026 (UTC).

## Estado verificado

- Catálogo: 583 identidades.
- Imagens prontas: 200.
- Entradas ainda sem imagem: 383.
- Lote desta atualização: 45 imagens — 42 ilustrações geradas individualmente com OpenAI e 3 fotografias externas de cosplay.
- As 155 imagens anteriores e seus metadados foram preservados.
- Todas as novas imagens: WebP, 960 × 1200, proporção 4:5.
- Os prompts completos das artes geradas estão em `src/data/assets-manifest.json`, no campo `generationPrompt`.
- As fotografias de Batman, Homem-Aranha e Mulher-Maravilha são de Gage Skidmore / Wikimedia Commons, CC BY-SA 2.0. Fonte, licença e alterações estão registradas no manifesto e nos créditos do jogo. Os arquivos derivados mantêm CC BY-SA 2.0.

## Ilustrações deste lote

`kakashi-hatake`, `itachi-uchiha`, `gaara`, `roronoa-zoro`, `sailor-moon`, `aang`, `gohan`, `piccolo`, `freeza`, `trunks`, `tanjiro-kamado`, `nezuko-kamado`, `tails`, `knuckles`, `crash-bandicoot`, `pac-man`, `light-yagami`, `l-death-note`, `ryuk`, `saitama`, `ichigo-kurosaki`, `yugi-muto`, `gandalf`, `chaves`, `seiya-de-pegaso`, `shiryu-de-dragao`, `ikki-de-fenix`, `kyojuro-rengoku`, `levi-ackerman`, `edward-elric`, `sakura-haruno`, `hinata-hyuga`, `jiraiya`, `sanji`, `yusuke-urameshi`, `kenshin-himura`, `ben-10`, `finn-o-humano`, `jake-o-cao`, `popeye`, `kuririn`, `mestre-kame`.

## Gerações bloqueadas ainda pendentes

As tentativas abaixo não produziram arte utilizável. Não repetir a mesma solicitação para contornar bloqueios; procurar uma imagem externa apropriada, conferir autoria/licença, revisar o enquadramento e só então integrar. Goku, Mario, Pikachu, Shrek e Mickey já constavam como bloqueados no trabalho anterior.

`goku`, `mario`, `pikachu`, `shrek`, `mickey-mouse`, `scooby-doo`, `bob-esponja`, `homer-simpson`, `homem-de-ferro`, `hulk`, `wolverine`, `deadpool`, `link`, `kirby`, `harry-potter`, `darth-vader`, `yoda`, `jack-sparrow`, `rick-sanchez`, `morty-smith`.

A busca externa já recuperou e comparou dezenas de candidatos. Muitos mostravam outra identidade, grupos, fantasias imprecisas, nomes visíveis ou enquadramento inadequado; esses arquivos não foram usados. As demais entradas `missing` continuam disponíveis para geração/curadoria. O manifesto é a fonte do estado atual; `npm run assets:report` apresenta a contagem atualizada.

## Retomar

1. Ler `docs/IMAGE_INTEGRATION.md` e consultar as entradas `missing` do manifesto.
2. Preservar as imagens `ready`. Gerar um retrato por identidade, reconhecível e sem o nome na imagem.
3. Registrar o prompt real e a autoria; para arquivos externos, registrar a página da fonte, autor, licença, atribuição e alterações.
4. Rodar `npm run assets:sync`, `npm run assets:report`, os testes e o build antes de publicar.
5. Atualizar as contagens deste arquivo, do README e do guia de integração.
