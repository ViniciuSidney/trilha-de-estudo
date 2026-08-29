# Checklist de release — v0.1.0

## Estado atual

A base de código está preparada como candidata à `v0.1.0`. A tag e a release devem ser criadas somente depois da validação manual abaixo na branch `dev`.

## Atualização e teste automatizado

```powershell
git switch dev
git pull --ff-only
npm test
```

Resultado esperado: `9/9 verificações aprovadas`.

## Teste manual essencial

### Desktop — 1366 × 768 ou superior

- abrir a central e carregar a demonstração;
- percorrer as doze telas usando apenas `Tab`, `Shift+Tab`, `Enter` e `Espaço`;
- confirmar foco visível e ordem de navegação lógica;
- testar renomeação, exclusão, reinício e substituição de conteúdo nos modais próprios;
- conferir os cartões da correção imediata para respostas certas e erradas;
- alternar os temas claro e escuro;
- confirmar que apenas o conteúdo central rola e que as ações permanecem visíveis;
- exportar TXT e JSON na tela final.

### Tablet — aproximadamente 768 × 1024

- abrir e fechar o menu de etapas pelo botão e pela tecla `Esc`;
- confirmar que o foco entra no menu e retorna ao botão ao fechá-lo;
- verificar os painéis empilhados e a ausência de rolagem horizontal;
- responder uma pergunta e uma questão usando toque ou teclado.

### Celular — 320 × 640 e 390 × 844

- verificar reflow dos títulos, botões, métricas e cartões;
- confirmar que nenhum texto ou controle fica fora da tela;
- testar o menu lateral, o rodapé de ações e a rolagem interna;
- testar zoom de 200% no navegador.

### Dados e recuperação

- criar duas sessões diferentes e recarregar a página;
- exportar um backup completo, cancelar sua prévia e confirmar que nada mudou;
- restaurar o backup e conferir as duas sessões;
- importar um JSON inválido e confirmar que o histórico foi preservado;
- abrir uma sessão migrada de versão anterior, quando disponível.

## Fechamento

Depois da aprovação manual:

1. abrir um pull request de `dev` para `main`;
2. confirmar a execução verde das verificações no GitHub;
3. mesclar a branch aprovada;
4. criar a tag anotada `v0.1.0` no commit de `main`;
5. publicar a release com o resumo do `CHANGELOG.md`.
