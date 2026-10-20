# Continuidade das imagens — Ícones

Atualizado em 20/10/2026 (UTC).

## Estado verificado

- Catálogo: 583 identidades.
- Imagens prontas: 278.
- Entradas ainda sem imagem: 305.
- Continuação atual: 31 novas ilustrações integradas; geração e curadoria em andamento.
- As 247 imagens anteriores e seus metadados foram preservados, incluindo o Ikki com a armadura corrigida.
- Todas as novas imagens: WebP, 960 × 1200, proporção 4:5.
- Os prompts completos das artes geradas estão em `src/data/assets-manifest.json`, no campo `generationPrompt`.
- As fotografias de Batman, Homem-Aranha e Mulher-Maravilha são de Gage Skidmore / Wikimedia Commons, CC BY-SA 2.0. Fonte, licença e alterações estão registradas no manifesto e nos créditos do jogo. Os arquivos derivados mantêm CC BY-SA 2.0.

## Ilustrações do lote anterior

`bulma`, `majin-boo`, `cell`, `nami`, `tony-tony-chopper`, `seto-kaiba`, `zenitsu-agatsuma`, `yuji-itadori`, `eren-yeager`, `mikasa-ackerman`, `izuku-midoriya`, `doraemon`, `shin-chan`, `totoro`, `sem-rosto`, `shadow-the-hedgehog`, `dr-eggman`, `spyro`, `mega-man`, `ryu-street-fighter`, `chun-li`, `lara-croft`, `cloud-strife`, `master-chief`, `solid-snake`, `florzinha`, `lindinha`, `docinho`, `johnny-bravo`, `coragem`, `dexter-laboratorio`, `mordecai`, `monica`, `cebolinha`, `cascao`, `magali`, `chico-bento`, `scorpion`, `sub-zero`, `nathan-drake`, `ellie-tlou`, `steve-minecraft`, `creeper`, `tom-gato`, `pantera-cor-de-rosa`, `garfield`, `snoopy`.

## Ilustrações do lote anterior

`kakashi-hatake`, `itachi-uchiha`, `gaara`, `roronoa-zoro`, `sailor-moon`, `aang`, `gohan`, `piccolo`, `freeza`, `trunks`, `tanjiro-kamado`, `nezuko-kamado`, `tails`, `knuckles`, `crash-bandicoot`, `pac-man`, `light-yagami`, `l-death-note`, `ryuk`, `saitama`, `ichigo-kurosaki`, `yugi-muto`, `gandalf`, `chaves`, `seiya-de-pegaso`, `shiryu-de-dragao`, `ikki-de-fenix`, `kyojuro-rengoku`, `levi-ackerman`, `edward-elric`, `sakura-haruno`, `hinata-hyuga`, `jiraiya`, `sanji`, `yusuke-urameshi`, `kenshin-himura`, `ben-10`, `finn-o-humano`, `jake-o-cao`, `popeye`, `kuririn`, `mestre-kame`.

## Gerações bloqueadas ainda pendentes

As tentativas abaixo não produziram arte utilizável. Não repetir a mesma solicitação para contornar bloqueios; procurar uma imagem externa apropriada, conferir autoria/licença, revisar o enquadramento e só então integrar. Goku, Mario, Pikachu, Shrek e Mickey já constavam como bloqueados no trabalho anterior.

`goku`, `mario`, `pikachu`, `shrek`, `mickey-mouse`, `scooby-doo`, `bob-esponja`, `homer-simpson`, `homem-de-ferro`, `hulk`, `wolverine`, `deadpool`, `link`, `kirby`, `harry-potter`, `darth-vader`, `yoda`, `jack-sparrow`, `rick-sanchez`, `morty-smith`, `kratos`, `geralt-de-rivia`, `jerry-rato`, `pica-pau`.

A busca externa já recuperou e comparou dezenas de candidatos. Muitos mostravam outra identidade, grupos, fantasias imprecisas, nomes visíveis ou enquadramento inadequado; esses arquivos não foram usados. As demais entradas `missing` continuam disponíveis para geração/curadoria. O manifesto é a fonte do estado atual; `npm run assets:report` apresenta a contagem atualizada.

## Retomar

1. Ler `docs/IMAGE_INTEGRATION.md` e consultar as entradas `missing` do manifesto.
2. Preservar as imagens `ready`. Gerar um retrato por identidade, reconhecível e sem o nome na imagem.
3. Registrar o prompt real e a autoria; para arquivos externos, registrar a página da fonte, autor, licença, atribuição e alterações.
4. Rodar `npm run assets:sync`, `npm run assets:report`, os testes e o build antes de publicar.
5. Atualizar as contagens deste arquivo, do README e do guia de integração.

## Correção do Ikki de Fênix

A pedido do usuário, substituída a armadura inteiramente dourada pela paleta da Nova Armadura de Bronze: peitoral e ombreiras prateados, braçadeiras azul-violeta, fivela vermelha e dourado restrito à crista do capacete. Referência oficial: https://tamashiiweb.com/item/13394/?wovn=en. Pose e acabamento da ilustração preservados.
