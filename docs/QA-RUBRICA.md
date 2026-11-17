# Rubrica de QA — biblioteca Blocos (100 pontos)

Toda revisão usa esta rubrica. **Passar = 100/100**. Cada critério vale 10 pontos e só
vence com evidência verificável (código, DOM, medição ou captura).

| # | Critério | Passa quando |
|---|---|---|
| 1 | **Botões e interação** | Toda `Button` tem `type`; botão só-ícone tem `aria-label`; `loading` mostra spinner e bloqueia clique; `disabled` opaco e não clicável; alvo mínimo 24×24 (WCAG 2.2 AA) e 32×32 para controle primário/ícone; variantes `primary/secondary/ghost/glass/danger/outline` consistentes em toda a lib |
| 2 | **Foco e ordem de tabulação** | Todo elemento interativo tem foco visível (outline 2px accent, offset 2px); ordem de tabulação segue a ordem visual; sem "focus trap" em container que não é modal |
| 3 | **Cores — tokens e contraste** | Zero cor hex em `className` (exceção: gradiente decorativo do bloco de aurora, documentado); contraste WCAG AA: texto normal ≥ 4.5:1, texto grande/UI ≥ 3:1, **nos 3 temas**; estado nunca sinalizado só por cor (badge sempre tem texto) |
| 4 | **Tipografia e hierarquia** | Só classes `bloco-*` para texto; sem `font-size` arbitrário fora da escala; hierarquia headline > body > caption mantida em todos os blocos; `bloco-micro` só como label de seção (uppercase) |
| 5 | **Espaçamento e layout** | Ritmo consistente (gap 2/3/4/6/8); sem colisão ou sobreposição em 390px, 768px, 1280px, 1440px, 1920px; grade de agenda/colunas alinhada; nada encostando nas bordas sem respiro |
| 6 | **Truncamento e overflow** | Texto importante não some: `scrollWidth <= clientWidth + 2` em todo nó de texto, exceto `truncate` explícito, células de tabela e `input/textarea` (que clipam o próprio conteúdo); nenhum nome de pessoa/propósito cortado para 3 caracteres; tabela com scroll horizontal em vez de esmagar coluna |
| 7 | **Estados completos** | Todo bloco implementa `loading / success / empty / error / forbidden` e o bloqueio `not-provisioned` (`ConnectorLock`) quando exige conector; skeleton descreve a forma do conteúdo, não é spinner solto |
| 8 | **Variantes por bloco** | Todo bloco tem ≥ 2 variantes visualmente distintas e funcionais; trocar variante não quebra layout nem estoura altura; a variante está declarada na receita com `intent` e `tradeoff` |
| 9 | **Movimento** | Transições ≤ 420ms em ação de interface; curva `ease-apple` no padrão; `prefers-reduced-motion` respeitado; sem animação que "pula" (layout shift) na troca de bloco/variante |
| 10 | **Acessibilidade e semântica** | Nome acessível em todo controle (inclusive ícone): `aria-label`, `aria-labelledby` ou `<label for>` valem; `aria-selected/aria-checked/aria-expanded` corretos; `th` com `scope`; dialog/drawer com foco preso e `Esc` fecha; `role="status"`/`role="alert"` nos avisos; html lang correto |

## Como pontuar

- 10 = atende integralmente, sem ressalva
- 8 = atende com falha rara e sem impacto no uso real
- 5 = falha comum
- 0 = ausente ou quebrado

**Rodada 1** = diagnóstico (relatar tudo). **Rodadas 2 e 3** = verificação (provar que
está 100). Na rodada 2 e 3, cada agente roda a rubrica inteira e devolve a nota por
critério. Se qualquer critério < 10, a rodada reprova.

## Nota de padrao (decidida na rodada 1)

- **Alvo de toque**: WCAG 2.2 AA (Target Size Minimum) pede 24×24 CSS px; a regra da casa e
  **32×32** para controle primario, icone e checkbox. Abaixo de 24×24 = falha; entre 24 e 32
  = nota parcial; 32+ = integral.
- **`overflow-x: clip`** no container de tema: o brilho da aurora nao pode estourar a
  largura do documento. `clip` (nao `hidden`) nao quebra `position: sticky` nem `fixed`.
- **Nome acessivel** aceito por `aria-label`, `aria-labelledby` ou `<label for>`.
- **Escala de gap**: a canonica e 2/3/4/6/8 (`gap-2/3/4/6/8`). A escala ampliada
  (`gap-0.5`, `gap-1`, `gap-1.5`, `gap-2.5`) e **permitida dentro de controles densos**
  (linha de tabela, item de lista, botao) — onde 8px de respiro desalinharia o ritmo.
  Fora de controle, usar so a canonica.
- **Camadas do CSS**: as classes do design system vivem em `@layer components`, para que
  as utilities do Tailwind (`fixed`, `relative`, `p-*`) sempre vençam em conflito. Sem
  isso, `.bloco-glass { position: relative }` vencia o `fixed` do dialog e o painel
  saia da tela.
- **Acento**: `bg-accent` e preenchimento; `text-accent-ink` e acento como texto.
  `text-accent` (o azul de preenchimento) como TEXTO reprova AA.
- **Estado vazio**: oferece a acao declarada em `recipe.emptyAction`. Se o dado chega
  sozinho (lead pelo WhatsApp, log pela fila), a receita NAO declara `emptyAction` e o
  vazio explica que o dado vai chegar.
- **Portao de conector**: derivado da receita (`requiresOf`). Bloco com conector externo
  faltando tem que TRAVAR, nunca fingir. O manifesto de conexoes e a unica excecao
  consciente (e o painel que mostra o que falta).
- **Foco**: dialog e drawer restauram o foco ao elemento que os abriu (`onCloseAutoFocus`)
  e declaram `aria-modal="true"`.

## Ferramentas

- Catálogo rodando: `http://localhost:4173` (build estatico de `apps/catalog/dist`).
- Checker automático: `python3 scripts/qa-automatic.py` (contraste por token, hex
  hardcoded, `<button>` sem `type`, botão sem nome acessível, overflow, alvo de toque,
  cobertura de estados e variantes).
- Capturas: `python3 scripts/qa-visual.py` (29 blocos, 1 por bloco).
