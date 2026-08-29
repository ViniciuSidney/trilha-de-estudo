# Changelog

Todas as mudanças relevantes do projeto serão registradas neste arquivo.

O formato segue os princípios do Keep a Changelog e o projeto adotará versionamento semântico a partir da v0.1.0.

## [Não publicado]

### Planejado

- modularização do código JavaScript;
- sistema de múltiplas sessões;
- backup e restauração em JSON;
- validações mais robustas das respostas da IA.

### Adicionado

- módulo de configuração compartilhada;
- armazenamento interno com `schemaVersion: 1`;
- migração automática do estado plano do protótipo;
- normalização de campos essenciais antes de carregar ou salvar.

### Alterado

- persistência isolada no módulo `storage.js`;
- proteção contra sobrescrita de versões de dados incompatíveis.

## [prototype-v0.4] — 2026-08-29

### Adicionado

- fluxo linear com sete etapas principais e doze telas;
- prompts para base teórica, perguntas, questões, correção e flashcards;
- sessão demonstrativa sobre Ondulatória;
- temas claro e escuro;
- salvamento automático no navegador;
- exportação da sessão em texto;
- navegação individual por perguntas, questões, erros e flashcards.

### Alterado

- interface fixada em uma única viewport;
- rolagem restrita ao painel central;
- área útil ampliada;
- espaçamentos estruturais normalizados;
- preparação e uso do conteúdo separados em subetapas.

### Observação

Este marco encerra a fase de prototipação e passa a ser a base oficial do repositório.
