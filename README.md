# Trilha de Estudo

Aplicação web local-first que conduz uma sessão de estudo em uma sequência linear apoiada por inteligência artificial. A IA prepara materiais e devolutivas; a aplicação organiza leitura, prática, correção ativa, flashcards e registro final.

> Estado atual: **v0.1.0 em desenvolvimento**, construída sobre o último protótipo validado (`prototype-v0.4`).

## Fluxo atual

1. Definição do assunto e do objetivo.
2. Preparação e leitura da base teórica.
3. Preparação e resposta das perguntas introdutórias.
4. Preparação e resolução das questões objetivas.
5. Geração da devolutiva e correção ativa dos erros.
6. Geração e revisão dos flashcards.
7. Resumo e exportação da sessão.

## Características

- sete etapas principais distribuídas em doze telas;
- central local para iniciar, continuar e administrar estudos;
- múltiplas sessões independentes com histórico, progresso e desempenho;
- ações para renomear, duplicar e excluir sessões;
- backup completo em JSON com validação e prévia de restauração;
- prompts adaptados ao conteúdo da sessão;
- integração manual com qualquer IA por copiar e colar;
- importação estruturada de perguntas, questões e flashcards;
- correção automática de questões objetivas;
- correção ativa dos erros;
- sessão demonstrativa completa;
- temas claro e escuro;
- interface responsiva em viewport única;
- salvamento automático no navegador;
- exportação da sessão em texto.

## Executar localmente

Não há instalação nem processo de compilação.

1. Baixe ou clone o projeto.
2. Abra `index.html` em um navegador moderno.
3. Use **Carregar demonstração** para percorrer o fluxo completo.

Também é possível servir a pasta por qualquer servidor HTTP local.

## Estrutura

```text
trilha-de-estudo/
├── css/
│   └── styles.css
├── docs/
│   ├── 01-visao-do-produto.md
│   ├── 02-roadmap.md
│   ├── 03-testes.md
│   ├── 04-formato-dos-dados.md
│   ├── 05-decisoes-tecnicas.md
│   └── 06-git-e-github.md
├── js/
│   ├── app.js
│   ├── backup.js
│   ├── config.js
│   ├── demo.js
│   ├── exporter.js
│   ├── home.js
│   ├── navigation.js
│   ├── prompts.js
│   ├── selectors.js
│   ├── sessions.js
│   ├── state.js
│   ├── storage.js
│   ├── utils.js
│   ├── validators.js
│   └── views.js
├── .gitignore
├── CHANGELOG.md
├── LICENSE
├── README.md
└── index.html
```

## Dados e privacidade

O projeto não envia dados automaticamente para servidores próprios. As sessões e a preferência de tema são armazenadas no `localStorage` do navegador. O usuário escolhe manualmente qual IA utilizar e quais conteúdos enviar a ela.

## Versionamento

- `main`: versões estáveis ou marcos preservados;
- `dev`: desenvolvimento da próxima versão;
- `prototype-v0.4`: tag recomendada para registrar esta base;
- `v0.1.0`: primeira versão oficial planejada.

Consulte o [roadmap](docs/02-roadmap.md) e o [guia do primeiro commit](docs/06-git-e-github.md).

## Licença

Copyright © 2026 Vinícius Sidney. Todos os direitos reservados.
