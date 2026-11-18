# Roadmap — Blocos (depois do beta aprovado)

Estado atual: **beta aprovado em 100/100** (3 rodadas de QA, 4 checkers, 9.003 medicoes
de contraste por pixel). 29 blocos · 62 acoes · 83 variacoes de UI · tema Aurora como
padrao e uma variacao escolhida por bloco ([`ESCOLHAS-DO-DONO.md`](./ESCOLHAS-DO-DONO.md)).

Decisoes do dono ja travadas:
- tema **Aurora** em tudo;
- **as variacoes nao escolhidas foram mantidas** na biblioteca (alternativas para outros
  programas);
- densidade padrao `comfortable`.

---

## Fase 1 — Figma (wireframes e conversoes)

O que ja existe pronto para quando o link chegar:

- **Leitura do arquivo**: o conector Figma le layout, estilos, textos e referencias de asset
  (`get_figma_data`) — nao preciso de imagem para entender a tela.
- **Exportacao de assets**: PNG/SVG/GIF com URL assinada (`download_figma_images`).
- **Tokens do design system** (`packages/tokens/src/styles.css`) como fonte unica: o caminho
  inverso (Figma -> codigo) e o caminho direto (codigo -> variaveis do Figma) usam a
  **mesma** escala de nomes.

Trabalhos previstos:

1. **Wireframes das telas** a partir da variacao escolhida de cada bloco — o wireframe nao e
   um desenho novo, e a mesma tela com a estrutura de layout exposta (sem cor, sem vidro).
2. **Variaveis do Figma** espelhando os tokens (cor, tipografia, espaco, raio, sombra,
   movimento) — com os 3 temas como modos (Variables/Collection).
3. **Componentes do Figma** a partir dos primitivos do `@blocos/ui` (Button, Field, Panel,
   DataTable, Dialog, Tabs, Badge...) — o catalogo vira a referencia viva.
4. **Transicoes**: o motion ja esta definido em tokens (`--ease-apple`, `--dur-*`); no Figma
   isso vira prototipo com a mesma curva e os mesmos tempos (420ms no maximo).
5. **Volta ao codigo**: cada tela do Figma que bater com um bloco vira a variante nova
   (`variants[]` + `defaultVariant` se for a escolhida).

---

## Fase 2 — Conectar em plataformas de CRM e de agendamento

O padrao de conector ja esta estabelecido na biblioteca e **nao muda por plataforma**:

```
plataforma nova
  -> ConnectorRequirement (id, tipo, env vars por NOME, como provisionar)
  -> recipe.connectors
  -> requiresOf(recipe)  => o bloco TRAVA sem a conexao
  -> ConnectorRegistry.provision({ provisionedBy: dono })   => so o dono liga
```

Ou seja: qualquer CRM ou agendamento entra do mesmo jeito — **sem segredo no bloco**,
**sem a terceira parte pluginar nada**, e o bloco que depende da plataforma mostra o
bloqueio do dono em vez de fingir funcionar.

Para cada plataforma, preciso de:
1. nome e doc da API (ou o link do Figma com a tela);
2. quais blocos vão depender dela (`leads-board` da CRM X, `agenda-board` do agendador Y);
3. o que a plataforma precisa de volta (webhook de saida? exportacao?).

---

## Fase 3 — Plug nos repos reais

- `CRM-Nutricionista`: trocar os blocos existentes pela biblioteca (o bloco hoje e a tela +
  o servico; a tela vira o bloco, o servico vira a porta).
- `Agendador-Instagram`: o catalogo de posts, automacoes e logs ja sao blocos.
- `CRM-HOF`: e a referencia de logica mais madura; serve de origem para os blocos de
  leads, canal, agenda e financeiro.

---

## Pendencias conhecidas (nao bloqueiam nada agora)

- Publicar em URL publica: travado no limite de deploy do plano (73/50). Resolvido
  despublicando um site antigo ou subindo de plano.
- Publicacao em npm dos pacotes `@blocos/*` (hoje e workspace + git).
- Testes unitarios e Storybook: fora do escopo do beta.
