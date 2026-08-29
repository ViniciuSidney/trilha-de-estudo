# Trilha de Estudo

Aplicação web local-first que conduz uma sessão de estudo em uma sequência linear apoiada por inteligência artificial. A IA prepara materiais e devolutivas; a aplicação organiza leitura, prática, correção ativa, flashcards e registro final.

Aplicação publicada: [viniciusidney.github.io/trilha-de-estudo](https://viniciusidney.github.io/trilha-de-estudo/)

> Estado atual: **v0.1.0 estável na `main` e v0.2.0 em desenvolvimento na `dev`**.

## Fluxo atual

1. Definição de matéria, tema, assunto e objetivo.
2. Geração e revisão da estrutura de tópicos.
3. Preparação e leitura de um panorama geral curto.
4. Preparação e resposta das perguntas introdutórias.
5. Preparação e resolução das questões integradoras.
6. Geração da devolutiva e correção ativa dos erros.
7. Geração e revisão dos flashcards.
8. Resumo e exportação da sessão.

## Características

- oito etapas principais distribuídas em catorze telas;
- organização Matéria → Tema → Assunto → Tópicos;
- planejamento de tópicos importável, editável e reordenável;
- panorama geral limitado a 400 palavras pelo prompt;
- exibição segura e responsiva de tabelas Markdown;
- central local para iniciar, continuar e administrar estudos;
- múltiplas sessões independentes com histórico, progresso e desempenho;
- ações para renomear, duplicar e excluir sessões;
- backup completo em JSON com validação e prévia de restauração;
- prompts adaptados ao conteúdo da sessão;
- integração manual com qualquer IA por copiar e colar;
- importação estruturada de perguntas, questões e flashcards;
- comparação das respostas introdutórias com respostas-modelo;
- correção automática de questões objetivas;
- correção ativa dos erros;
- nova tentativa das questões erradas sem sobrescrever o resultado inicial;
- resumo final com consolidação, pendências e duração registrada;
- sessão demonstrativa completa;
- temas claro e escuro;
- interface responsiva em viewport única;
- navegação por teclado, foco visível e semântica acessível;
- modais próprios para confirmações, ações destrutivas e renomeação;
- correção imediata com comparação visual entre escolha e gabarito;
- salvamento automático no navegador;
- exportação individual da sessão em TXT e JSON.

## Executar localmente

Não há instalação nem processo de compilação.

1. Baixe ou clone o projeto.
2. Abra `index.html` em um navegador moderno.
3. Use **Carregar demonstração** para percorrer o fluxo completo.

Também é possível servir a pasta por qualquer servidor HTTP local.

## Verificações automatizadas

Com Node.js instalado, execute:

```bash
npm test
```

A suíte cobre o modelo de dados, migrações, backups, validações, exportações, aprendizagem ativa, as catorze telas, tabelas Markdown e requisitos estruturais de acessibilidade. O GitHub Actions repete essas verificações em pushes e pull requests.

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
│   ├── 06-git-e-github.md
│   ├── 07-checklist-release.md
│   └── 08-release-v0.1.0.md
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
├── tests/
│   └── run-tests.js
├── .github/workflows/checks.yml
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
- `v0.1.0`: primeira versão oficial estável.

Consulte o [roadmap](docs/02-roadmap.md), o [guia de Git e GitHub](docs/06-git-e-github.md) e o [checklist da release v0.1.0](docs/07-checklist-release.md).

## Licença

Copyright © 2026 Vinícius Sidney. Todos os direitos reservados.
