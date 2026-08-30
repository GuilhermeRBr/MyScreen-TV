---
title: Sem Emoji — Sempre SVG
inclusion: always
---

# Sem Emoji — Sempre SVG

Regra única e sem exceção para todo o projeto (código, UI, commits, documentação gerada, comentários, respostas de API).

## Proibido

- Nunca usar caracteres de emoji (✅ ❌ 🎬 📺 ⭐ 🔥 etc.) em:
  - Código-fonte (comentários, nomes de variável, strings)
  - Componentes React / JSX / templates
  - Textos de UI, labels, botões, toasts, notificações
  - Mensagens de commit, PR, changelog, README, steering, docs
  - Respostas de erro ou mensagens de log
  - Ícones em `EpisodeListItem`, badges (`NOVO`, `PREMIERE`), status de watch, plataformas (Disney+, Apple TV, AT-X), estrelas de rating, checkmarks de assistido, etc.

## Obrigatório no lugar

- Todo indicador visual (checkmark de assistido, estrela de rating, ícone de play, seta/chevron, ícone de plataforma, badge de status) deve ser um **SVG** próprio do projeto — inline (`<svg>` no componente) ou como componente dedicado em `/components/icons/`.
- Um SVG por ícone, com nome de componente claro: `IconCheck`, `IconStar`, `IconPlay`, `IconChevronDown`, `IconClock`, `IconClapperboard`, `IconPlatformDisney`, etc.
- SVGs herdam cor via `currentColor` (ou variável CSS), nunca cor hardcoded, pra funcionar com o tema escuro/amarelo do app.
- Se precisar de um ícone que ainda não existe no projeto, criar o SVG (ou usar um set de ícones do projeto já definido) em vez de "resolver rápido" com emoji.

## Em respostas do agente (Kiro)

- Nunca incluir emoji em respostas de chat, commits gerados, PRs abertos automaticamente ou textos de qualquer steering/hook criado para este projeto.
- Ao sugerir UI nova (ex: um novo badge ou item de lista), sempre propor o SVG correspondente, não um emoji como placeholder "temporário".