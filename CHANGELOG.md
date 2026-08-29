# Changelog

Todas as mudanças relevantes do projeto serão registradas neste arquivo.

O formato segue os princípios do Keep a Changelog e o projeto adotará versionamento semântico a partir da v0.1.0.

## [Não publicado]

### Planejado

- conclusão da experiência de aprendizagem;
- revisão de acessibilidade e responsividade para a `v0.1.0`.

### Adicionado

- módulo de configuração compartilhada;
- módulos independentes de utilidades e geração de prompts;
- módulos de estado, navegação, seletores, validação, exportação, demonstração e interface;
- central de sessões com histórico local;
- criação, retomada, renomeação, duplicação e exclusão de sessões;
- indicadores de progresso e desempenho por sessão;
- exportação de backup completo em JSON;
- importação com validação estrutural, limite de tamanho e prévia;
- restauração confirmada de configurações e sessões;
- armazenamento interno com `schemaVersion: 2`;
- migração automática do estado plano do protótipo;
- migração automática do envelope `schemaVersion: 1`;
- normalização de campos essenciais antes de carregar ou salvar.

### Alterado

- persistência isolada no módulo `storage.js`;
- tema visual tratado como configuração global;
- sessão ativa separada do histórico local;
- proteção contra sobrescrita de versões de dados incompatíveis;
- `app.js` reduzido ao papel de orquestrador do DOM e dos eventos;
- mensagens de importação agora identificam estruturas e campos inválidos;
- respostas da IA são validadas integralmente antes da confirmação de substituição;
- erros de importação permanecem visíveis por mais tempo e não alteram o conteúdo atual.

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
