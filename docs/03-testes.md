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
- [x] confirmar persistência do tema global e da sessão ativa após recarga.

O teste visual e interativo em navegador real permanece obrigatório após alterações de interface ou integração entre módulos.

## Fluxo principal

- [ ] definir assunto e objetivo;
- [ ] copiar o prompt da base teórica;
- [ ] colar e visualizar um resumo em Markdown;
- [ ] importar perguntas introdutórias;
- [ ] responder todas as perguntas;
- [ ] importar e resolver questões objetivas;
- [ ] conferir resultado e gabarito;
- [ ] colar a devolutiva da IA;
- [ ] corrigir ativamente os erros;
- [ ] importar e revisar flashcards;
- [ ] concluir e exportar a sessão.

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

## Critério mínimo para uma versão

Uma versão só pode ser fechada quando o fluxo principal estiver completo, não houver perda de dados conhecida e todos os bloqueadores estiverem registrados ou resolvidos.
