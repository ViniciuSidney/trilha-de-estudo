# Plano de testes

## Objetivo

Confirmar que o fluxo principal permanece utilizável, que os dados são preservados e que cada etapa reage corretamente a entradas válidas e inválidas.

## Verificações automatizadas da fundação técnica

- [x] verificar a sintaxe de todos os arquivos JavaScript;
- [x] testar estado, navegação, seletores e exportação;
- [x] testar importações válidas e inválidas;
- [x] renderizar programaticamente as doze telas;
- [x] conferir o balanceamento estrutural dos painéis das doze telas;
- [x] carregar a aplicação e a demonstração com um DOM simulado;
- [x] confirmar o repositório local com `schemaVersion: 2`;
- [x] migrar automaticamente dados planos e o envelope `schemaVersion: 1`;
- [x] testar criação, abertura, renomeação, duplicação, reinício e exclusão de sessões;
- [x] testar o percurso central → sessão → central → retomada;
- [x] confirmar persistência do tema global e da sessão ativa após recarga;
- [x] testar ida e volta de um backup completo em JSON;
- [x] rejeitar JSON inválido, aplicativo incorreto, versão incompatível, IDs duplicados e estado corrompido;
- [x] confirmar que a prévia não altera o histórico;
- [x] confirmar que somente a restauração aprovada substitui as sessões;
- [x] confirmar que falhas de backup e respostas inválidas da IA preservam os dados atuais.
- [x] testar revelação das respostas-modelo somente após a resposta do aluno;
- [x] separar respostas iniciais e novas tentativas das questões;
- [x] calcular erros corrigidos, pendências e comparações realizadas;
- [x] congelar a duração ao concluir a sessão;
- [x] gerar exportações individuais completas em TXT e JSON;
- [x] manter compatibilidade com backups anteriores sem os novos campos opcionais.
- [x] executar uma suíte reproduzível com Node.js e GitHub Actions;
- [x] validar uma exportação individual real em TXT e JSON;
- [x] verificar marcação semântica de progresso, etapas, grupos de alternativas e diálogo;
- [x] verificar breakpoints, foco visível e preferência por movimento reduzido no CSS.
- [x] confirmar a ausência de `confirm()` e `prompt()` nativos no código;
- [x] renderizar a correção imediata com escolha, gabarito e justificativa separados;
- [x] verificar a estrutura do modal reutilizável de confirmação e entrada.

O teste visual e interativo em navegador real permanece obrigatório após alterações de interface ou integração entre módulos.

## Fluxo principal

- [ ] definir assunto e objetivo;
- [ ] copiar o prompt da base teórica;
- [ ] colar e visualizar um resumo em Markdown;
- [ ] importar perguntas introdutórias;
- [ ] responder todas as perguntas;
- [ ] comparar cada resposta com a resposta-modelo;
- [ ] importar e resolver questões objetivas;
- [ ] conferir resultado e gabarito;
- [ ] colar a devolutiva da IA;
- [ ] corrigir ativamente os erros;
- [ ] refazer cada questão errada e conferir o novo resultado;
- [ ] importar e revisar flashcards;
- [ ] concluir e exportar a sessão.

## Aprendizagem ativa e encerramento

- [ ] confirmar que a resposta-modelo permanece oculta antes da comparação;
- [ ] editar uma resposta já comparada e confirmar que a revisão é solicitada novamente;
- [ ] conferir que a nova tentativa não altera o resultado inicial;
- [ ] tentar novamente com alternativa errada e depois correta;
- [ ] verificar erros corrigidos e pontos pendentes na tela final;
- [ ] conferir se a duração permanece igual após recarregar a sessão concluída;
- [ ] abrir as exportações TXT e JSON e conferir respostas, refações, correções e flashcards.

## Persistência

- [ ] recarregar a página em cada etapa;
- [ ] confirmar a restauração dos campos preenchidos;
- [ ] confirmar a restauração do tema visual;
- [ ] recomeçar a sessão e verificar a limpeza dos dados;
- [ ] carregar a demonstração sobre uma sessão existente.

## Múltiplas sessões

- [ ] criar duas sessões e preencher conteúdos diferentes;
- [ ] sair para a central e retomar cada sessão;
- [ ] renomear e duplicar uma sessão;
- [ ] excluir uma sessão após a confirmação;
- [ ] conferir assunto, progresso, desempenho e ordenação por atualização;
- [ ] recarregar a central e confirmar o histórico salvo.

## Backup e restauração

- [ ] exportar um backup com sessões em diferentes etapas;
- [ ] abrir o JSON e conferir aplicativo, versão, data, tema e sessões;
- [ ] importar o arquivo e revisar seus indicadores antes de confirmar;
- [ ] cancelar a prévia e confirmar que nada foi alterado;
- [ ] restaurar o backup e conferir todas as sessões;
- [ ] tentar importar arquivo vazio, JSON inválido e backup de versão incompatível;
- [ ] confirmar que um erro nunca apaga o histórico atual.

## Validações

- [ ] tentar continuar sem preencher campos obrigatórios;
- [ ] importar JSON inválido;
- [ ] importar arrays vazios;
- [ ] substituir perguntas já respondidas;
- [ ] substituir questões já corrigidas;
- [ ] alterar a teoria após importar perguntas;
- [ ] alterar respostas após gerar a devolutiva;
- [ ] remover todos os flashcards.

## Interface

- [ ] verificar tema claro e escuro;
- [ ] testar larguras de 320, 768, 1024, 1366 e 1920 px;
- [ ] testar diferentes alturas de viewport;
- [ ] confirmar ausência de rolagem geral;
- [ ] confirmar rolagem interna do conteúdo;
- [ ] confirmar que o rodapé de navegação permanece visível;
- [ ] verificar ausência de sobreposição entre painéis;
- [ ] testar navegação lateral recolhível.

## Acessibilidade

- [ ] navegar usando somente teclado;
- [ ] verificar foco visível;
- [ ] confirmar associação entre labels e campos;
- [ ] conferir contraste nos dois temas;
- [ ] testar zoom de 200%;

### Modais próprios

- [ ] abrir cada confirmação destrutiva e cancelar pelo botão;
- [ ] fechar os modais com `Esc` e pelo backdrop;
- [ ] confirmar que `Tab` e `Shift+Tab` permanecem dentro do modal;
- [ ] renomear uma sessão e confirmar que nomes vazios não podem ser salvos;
- [ ] conferir o retorno do foco ao botão que abriu o modal.

O roteiro final por tamanho de tela está em [`07-checklist-release.md`](07-checklist-release.md). As verificações marcadas nesta seção continuam manuais porque dependem de navegador, sistema operacional e tecnologias assistivas reais.

## Execução automatizada

Com Node.js 22 ou versão LTS compatível:

```bash
npm test
```

Para validar também arquivos de exportação individuais:

```bash
node tests/run-tests.js --session-json caminho/sessao.json --session-text caminho/sessao.txt
```

O workflow `Verificações` executa `npm run check` automaticamente em pushes para `dev` e `main` e em pull requests destinados a `main`.

## Critério mínimo para uma versão

Uma versão só pode ser fechada quando o fluxo principal estiver completo, não houver perda de dados conhecida e todos os bloqueadores estiverem registrados ou resolvidos.

## Aprovação da v0.1.0

A candidata final, incluindo os refinamentos da Fase 5.1, foi aprovada manualmente em 29 de agosto de 2026. As verificações automatizadas permaneceram em `9/9`, e não foram relatados bloqueadores de fluxo, dados, responsividade ou interface.
