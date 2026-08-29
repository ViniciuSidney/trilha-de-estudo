# Roadmap

## Marco atual — base oficial

- [x] validar o conceito do fluxo linear;
- [x] separar preparação e uso do conteúdo;
- [x] implementar temas claro e escuro;
- [x] fixar a aplicação em uma única viewport;
- [x] apresentar atividades uma por vez;
- [x] revisar largura, alinhamento e espaçamentos;
- [x] preparar a estrutura inicial do repositório.

## Escopo aprovado da v0.1.0

A primeira versão oficial deverá transformar o protótipo validado em uma aplicação local confiável, preservando seu fluxo de estudo e evitando mudanças visuais de grande porte.

### Fase 1 — fundação técnica

- [ ] dividir o JavaScript em módulos;
- [ ] separar estado, armazenamento, navegação, prompts, validações e interface;
- [x] criar um modelo de dados versionado;
- [x] centralizar persistência e migrações;
- [ ] manter compatibilidade com o fluxo atual e com a sessão demonstrativa.

### Fase 2 — múltiplas sessões

- [ ] criar tela inicial para começar ou continuar estudos;
- [ ] criar histórico local de sessões;
- [ ] permitir criar, continuar, renomear, duplicar e excluir sessões;
- [ ] salvar cada sessão de maneira independente;
- [ ] registrar assunto, data, progresso e desempenho.

### Fase 3 — dados confiáveis

- [ ] exportar e importar backup completo em JSON;
- [ ] validar a versão e a estrutura dos backups;
- [ ] validar estruturas recebidas da IA antes de substituir conteúdo;
- [ ] apresentar mensagens de erro claras;
- [ ] preservar o conteúdo preenchido quando uma importação falhar.

### Fase 4 — conclusão da experiência

- [ ] usar as respostas-modelo nas perguntas introdutórias;
- [ ] permitir refazer questões erradas;
- [ ] registrar erros corrigidos;
- [ ] gerar um resumo final com resultados reais;
- [ ] exportar a sessão completa em TXT e JSON.

### Fase 5 — qualidade e lançamento

- [ ] revisar acessibilidade básica e navegação por teclado;
- [ ] executar testes em desktop, tablet e celular;
- [ ] testar recuperação, importação e migração de dados;
- [ ] atualizar a documentação e o changelog;
- [ ] fechar a tag e a release `v0.1.0`.

## Critérios de conclusão

- o fluxo completo do protótipo continua funcional;
- múltiplas sessões podem ser administradas sem conflito de dados;
- backups válidos são restaurados e entradas inválidas são rejeitadas com segurança;
- recarregar ou fechar o navegador não perde o progresso salvo;
- a aplicação permanece utilizável nos temas claro e escuro e nos tamanhos de tela testados;
- a versão publicada possui documentação, changelog, tag e release.

## Fora do escopo da v0.1.0

- integração direta com APIs de IA;
- contas e sincronização em nuvem;
- PWA e instalação no dispositivo;
- integração direta com Concept Compass, Study Stack, FlashCore ou outros projetos;
- sistema próprio de repetição espaçada;
- grandes mudanças na identidade visual ou no fluxo principal;
- métricas históricas avançadas de aprendizagem.
