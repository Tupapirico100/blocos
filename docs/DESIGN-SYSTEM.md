# Design system "Aurora" — guia de uso

> "Design is not just what it looks like and feels like. Design is how it works."
> — Steve Jobs (2013, lancamento do iPhone 7)

O principio que guiou este sistema: **hierarquia antes de decoracao**. Cada elemento tem
uma funcao; nada e decorativo. O vidro existe para comunicar *camada* (o que esta na frente
do que esta atras), nao para enfeitar.

---

## 1. Os tres eixos

```
Tema      = aurora | daylight | graphite
Densidade = comfortable | compact
Variacao  = por bloco (ex.: board | table | timeline)
```

Escolha o tema uma vez, no shell. A variacao do bloco e escolhida **dentro do bloco**,
porque a melhor forma de mostrar um kanban de leads nao e a melhor forma de mostrar um
recibo.

### Os temas

| Tema | Quando usar | Carater |
|---|---|---|
| **aurora** | padrao. Marketing, atendimento, painel do dono. | Escuro, vidro com luz, alto impacto. |
| **daylight** | leitura longa, relatorio, area clinica. | Claro, editorial, preciso e calmo. |
| **graphite** | operacao, log, filas, monitoracao. | Escuro neutro, denso, zero distracao. |

### Densidade

- `comfortable` — mais respiro. Padrao para atendimento e consulta.
- `compact` — mais informacao por tela. Padrao para agenda, fila e log.

---

## 2. Como usar

```tsx
import { ThemeProvider } from "@blocos/ui";
import "@blocos/tokens/styles.css";

<ThemeProvider theme="aurora" density="comfortable">
  <App />
</ThemeProvider>
```

O provider aplica `bloco-theme-<tema>` + `bloco-density-<densidade>` e garante que os
tokens semanticos existam na arvore.

---

## 3. Tokens

### Cor

Use **sempre** pelas classes, nunca por hex.

| Token | Uso |
|---|---|
| `bg-surface` / `bg-surface-strong` | painel, card, campo |
| `text-fg` / `text-fg-secondary` / `text-fg-muted` / `text-fg-faint` | hierarquia de texto (4 niveis) |
| `border-border` / `border-border-strong` | borda padrao / borda de enfase |
| `bg-accent` / `text-accent` / `bg-accent-soft` | acao primaria / destaque / fundo suave |
| `bg-success-soft` `text-success` · `bg-warn-soft` `text-warn` · `bg-danger-soft` `text-danger` · `bg-info-soft` `text-info` | estados |

Regra de contraste: **um elemento focal por tela**. Se dois colorful disputam atencao,
um deles nao e importante.

### Tipografia

| Classe | Tamanho | Uso |
|---|---|---|
| `bloco-display` | 44px / -2.8% | Titulo de pagina. Um por tela. |
| `bloco-title1` | 32px | Titulo de secao grande |
| `bloco-title2` | 24px | Titulo de painel |
| `bloco-title3` | 20px | Titulo de card |
| `bloco-headline` | 17px / 600 | Titulo de item |
| `bloco-body` | 15px | Texto corrente |
| `bloco-callout` | 13px | Texto de apoio, metadado |
| `bloco-caption` | 12px | Legenda, timestamp |
| `bloco-micro` | 11px / uppercase / +6% | Rotulo de secao (eyebrow) |

Tracking negativo em titulos (a Apple usa -2% a -3% em display). Monospace com `bloco-mono`
para id, token, hash, E.164.

### Espacamento, raio, sombra

- Base 4px: `gap-1` … `gap-16`.
- Raios: `rounded-[var(--r-md)]` (14px) para cards, `--r-lg` (18px) para paineis,
  `--r-pill` para chip/botao compacto. Cantos menores = mais "denso/dados";
  maiores = mais "editorial".
- Profundidade: `shadow-[var(--shadow-2)]` em cards, `--shadow-3` em overlays,
  `--shadow-glow` no elemento focal.

---

## 4. A receita do vidro

Tres camadas, nesta ordem. Se voce remover qualquer uma, o vidro deixa de parecer vidro:

1. **Fundo translucido** — `rgba(255,255,255,0.055)` no aurora.
2. **Desfoque + saturacao** — `backdrop-filter: blur(24px) saturate(180%)`.
3. **Reflexo especular** — gradiente de 1px na borda superior, com mascara
   (`mask-composite: exclude`) para nao pintar o interior.

```tsx
<div className="bloco-glass p-5">...</div>
```

Use `bloco-glass` para o que esta **acima** do conteudo (popover, drawer, card de destaque).
Use `Panel tone="solid"` para o que esta **no mesmo plano** (tabela, formulario).
Use `Panel tone="outline"` para o que e terciario.

> Cuidado: vidro sobre vidro multiply a opacidade e suja a leitura. No maximo 2 camadas.

---

## 5. Movimento

| Curva | Uso |
|---|---|
| `ease-apple` `(0.32, 0.72, 0, 1)` | padrao de entrada/saida |
| `ease-out` `(0.22, 1, 0.36, 1)` | fade, aparecimento |
| `ease-spring` `(0.34, 1.56, 0.64, 1)` | apenas toggle/confirmacao pequena |

Duracoes: `120ms` (micro), `180ms` (hover), `260ms` (painel), `420ms` (transicao de tela),
`700ms` (hero/ambient).

Regras:
1. Movimento **explica** mudanca de estado. Nunca decora.
2. Nada dura mais que 420ms numa acao de interface.
3. `prefers-reduced-motion` e respeitado automaticamente.
4. Lista que carrega: escalone 40ms por item, no maximo 8 itens.

```tsx
import { motion } from "motion/react";

<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
/>
```

---

## 6. Estados (obrigatorio em todo bloco)

Todo bloco declara e implementa:

`loading` · `success` · `empty` · `error` · `forbidden` · `not-provisioned`

- `loading` — skeleton que descreve a forma do conteudo (nao um spinner solto).
- `empty` — explica o que vai aparecer ali e **oferece a proxima acao**.
- `forbidden` — diz qual papel falta (nao "acesso negado" generico).
- `not-provisioned` — mostra o conector que falta e quem pode resolver (dono da plataforma).

No catalogo, o seletor **Estado** acima do palco alterna entre esses cinco para voce
conferir o bloco inteiro sem mexer em codigo.

---

## 7. Como adicionar uma variacao nova

1. No arquivo `.tsx` do bloco, trate `variant` como discriminador:

```tsx
export function LeadBoard(props: BlockProps<LeadBoardData, "board" | "table">) {
  return props.variant === "table" ? <LeadTable {...props} /> : <LeadKanban {...props} />;
}
```

2. Registre a variacao na receita (`variants: [{ id, label, intent, tradeoff }]`).
   O `intent` diz **quando usar**; o `tradeoff` diz **o que voce perde** — o catalogo mostra
   os dois no tooltip.
3. Nao crie arquivos novos por variacao se a variacao for so uma disposicao. Variacao
   = disposicao/modo de ver o MESMO dado. Se os dados mudam, isso e outro bloco.

---

## 8. Checklist antes de dar um bloco por pronto

- [ ] Funciona nos 3 temas (nada de hex fixo).
- [ ] Funciona em `comfortable` e `compact`.
- [ ] Tem `loading`, `empty`, `error`, `forbidden` e o bloqueio de conector.
- [ ] Nao busca dado; so recebe `data` e devolve `onAction`.
- [ ] Nao expoe segredo — so nome de env var.
- [ ] Teclado funciona; `aria-label` em botao so-icone; foco visivel.
- [ ] Nao loga dado de saude nem coloca dado de saude em URL.
- [ ] Roda no React 19 e no Next.js App Router (`"use client"` onde usar estado).
