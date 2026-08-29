# Trilha de Estudo v0.1.0

A primeira versão oficial transforma o protótipo validado em uma aplicação local-first completa para conduzir estudos em uma sequência linear apoiada por inteligência artificial.

## Destaques

- percurso guiado em doze telas, da definição do assunto ao encerramento;
- preparação e resultado separados em cada etapa de IA;
- múltiplas sessões independentes com histórico, progresso e desempenho;
- perguntas introdutórias com comparação controlada à resposta-modelo;
- questões objetivas com resultado inicial preservado, correção ativa e nova tentativa;
- correção imediata visual com escolha, gabarito e justificativa;
- geração, importação e revisão de flashcards;
- exportação individual completa em TXT e JSON;
- backup e restauração de todo o histórico com validação e prévia;
- temas claro e escuro e interface responsiva em viewport única;
- modais próprios, navegação por teclado e recursos básicos de acessibilidade;
- armazenamento local versionado e migração dos formatos anteriores;
- suíte automatizada e verificações no GitHub Actions.

## Dados e privacidade

Os estudos permanecem no `localStorage` do navegador. A aplicação não utiliza conta, servidor próprio ou chave de API. O usuário escolhe a IA e copia manualmente somente o conteúdo que deseja compartilhar.

## Compatibilidade

A `v0.1.0` reconhece o estado plano do `prototype-v0.4`, o envelope `schemaVersion: 1` e o repositório atual `schemaVersion: 2`. Backups incompatíveis ou corrompidos são recusados antes de qualquer substituição.

## Validação

A candidata final foi aprovada manualmente em 29 de agosto de 2026. A suíte automatizada concluiu `9/9` verificações, incluindo migrações, backups, importações, exportações reais e renderização das doze telas.
