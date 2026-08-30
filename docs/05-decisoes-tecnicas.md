# Decisões técnicas

## Aplicação estática

A base utiliza HTML, CSS e JavaScript sem framework ou processo de compilação. O KaTeX é distribuído dentro do próprio projeto exclusivamente para fórmulas, mantendo a aplicação executável offline e fácil de publicar.

## Local-first

Os dados permanecem no navegador. A primeira versão oficial deverá continuar funcionando sem conta, servidor ou banco de dados remoto.

## Integração manual com IA

O copiar e colar foi mantido porque:

- não exige chave de API;
- não cria custos de uso;
- permite escolher qualquer IA;
- facilita a validação do método antes de investir em infraestrutura.

## Viewport única

O `body` não possui rolagem geral. Cabeçalho, navegação lateral e ações permanecem visíveis; apenas o painel central pode rolar.

## Uma atividade por vez

Perguntas, questões, erros e flashcards são apresentados individualmente para reduzir distrações e preservar o foco.

## Comparação e nova tentativa

A resposta-modelo de uma pergunta introdutória permanece oculta até que o estudante escreva sua própria explicação e solicite a comparação. Editar a resposta depois disso invalida somente aquela comparação.

As respostas iniciais das questões nunca são sobrescritas durante a correção. As novas tentativas ficam em `quizRetryAnswers`, permitindo apresentar com honestidade o desempenho inicial e, separadamente, o que foi corrigido após estudo e reflexão. Alterar uma resposta inicial concluída exige confirmação e reinicia as etapas que dependem dela.

## Encerramento baseado em dados

A tela final utiliza seletores derivados do estado para calcular respostas comparadas, acertos iniciais, erros reconstruídos, novas tentativas, erros corrigidos e pendências. `finishedAt` é registrado na primeira chegada ao encerramento, impedindo que a duração continue aumentando quando uma sessão concluída é reaberta.

## Temas

Claro e escuro utilizam paletas próprias. A preferência é global, fica salva localmente e se aplica a todas as sessões.

## Central e múltiplas sessões

A central existe fora do assistente de catorze telas. Ela apresenta o histórico local e permite iniciar, continuar, revisar e administrar sessões independentes. Abrir uma sessão define `activeSessionId`; voltar à central apenas fecha a sessão ativa, sem remover seu conteúdo.

Cada sessão guarda seu próprio estado completo. Título, assunto, status e datas ficam também como metadados para que a central possa renderizar rapidamente progresso e desempenho.

## Arquitetura modular da v0.1.0

A fundação técnica separa responsabilidades sem exigir empacotador, servidor ou módulos ES. Os arquivos usam o namespace `window.TrilhaApp` e são carregados em ordem pelo `index.html`, preservando a abertura direta da aplicação pelo sistema de arquivos.

Estrutura atual:

```text
js/
├── app.js
├── backup.js
├── config.js
├── demo.js
├── exporter.js
├── home.js
├── navigation.js
├── prompts.js
├── selectors.js
├── sessions.js
├── state.js
├── storage.js
├── utils.js
├── validators.js
└── views.js
```

O `app.js` permanece como orquestrador dos elementos do DOM e dos eventos. Regras derivadas, validações, dados demonstrativos, exportação, persistência, sessões, central e geração das telas ficam isolados em módulos próprios.

## Evolução do armazenamento

O `schemaVersion: 2` representa um repositório local de sessões. O carregamento reconhece o estado plano do protótipo e o envelope `schemaVersion: 1`, cria uma primeira sessão quando há conteúdo relevante e persiste a migração imediatamente. Uma versão futura desconhecida bloqueia gravações para impedir perda silenciosa de dados.

## Restauração segura

O backup completo é separado da exportação textual de uma sessão. JSON serve para restaurar a aplicação; TXT permanece como registro humano de estudo.

A importação segue uma sequência conservadora: leitura do arquivo, validação profunda, prévia, confirmação e somente então gravação no `localStorage`. A sessão ativa não é restaurada automaticamente, evitando que o usuário entre em um estudo diferente sem perceber. Qualquer falha encerra o processo antes da escrita e preserva integralmente os dados atuais.

## Acessibilidade e teclado

A aplicação preserva controles HTML nativos e acrescenta semântica para progresso, etapa atual, grupos de alternativas, mensagens de estado e diálogo. O conteúdo principal pode ser alcançado por um link de salto, todos os controles interativos possuem foco visível e movimentos são reduzidos quando essa preferência estiver ativa no sistema.

Em telas menores, o menu lateral controla foco, estado expandido e fechamento por `Esc`. O diálogo de restauração mantém o foco dentro do painel enquanto está aberto e o devolve ao controle de origem no fechamento.

## Qualidade automatizada

A suíte em `tests/run-tests.js` usa apenas recursos nativos do Node.js. Ela cobre seletores, exportação, migrações, backup, validações, renderização das catorze telas e requisitos estruturais da interface. O GitHub Actions executa a mesma verificação em `dev`, `main` e pull requests para reduzir regressões antes de uma release.

## Diálogos próprios

Confirmações destrutivas, substituições de conteúdo e renomeação utilizam um único modal reutilizável. Essa escolha mantém vocabulário, cores e hierarquia visual consistentes, permite explicar a consequência antes da ação e evita diferenças entre os diálogos nativos de cada navegador.

O componente oferece variações neutra, de atenção e destrutiva; aceita entrada de texto; bloqueia confirmação vazia; fecha por `Esc`; contém o foco enquanto aberto; e devolve o foco ao controle de origem.

## Correção imediata

O gabarito não é apresentado como uma linha compacta. Cada questão possui um cartão próprio com estado, enunciado, alternativa escolhida, resposta correta quando houver erro e justificativa. Em acertos, a alternativa não é duplicada desnecessariamente. Assim, o estudante consegue comparar antes de solicitar a devolutiva aprofundada da IA.

## Hierarquia do estudo

Matéria, tema e assunto são campos distintos. Os tópicos pertencem ao assunto e não devem incluir conteúdos vizinhos apenas para ampliar artificialmente a trilha. Antes do panorama geral, a IA sugere uma estrutura em JSON e o estudante conserva a decisão final sobre nomes, objetivos e ordem.

A primeira fase da v0.2.0 mantém as etapas de aprendizagem da versão anterior depois do planejamento. As trilhas repetíveis por tópico serão adicionadas sobre esse modelo em uma fase separada, reduzindo o risco de misturar migração, navegação dinâmica e novos exercícios em uma única alteração.

## Markdown e tabelas

O renderizador permanece local e sem dependências externas. O conteúdo é escapado antes da interpretação de títulos, negrito, listas e tabelas no padrão Markdown. Tabelas ficam em um contêiner próprio com rolagem horizontal interna, preservando a regra de não criar rolagem horizontal geral na aplicação.

## Fórmulas LaTeX

O KaTeX e suas fontes são versionados em `vendor/`, sem carregamento por CDN. A camada de utilidades reconhece `\\( ... \\)`, `\\[ ... \\]`, `$...$` e `$$...$$`, ignora campos editáveis e preserva valores monetários como `R$ 100`. A renderização mantém MathML para tecnologias assistivas e desabilita comandos confiáveis para não permitir HTML arbitrário vindo do conteúdo da IA.

Antes da validação de uma resposta JSON, o importador examina somente barras invertidas localizadas dentro de campos textuais. Delimitadores e comandos LaTeX sem escape são duplicados automaticamente, enquanto escapes legítimos do JSON, como quebra de linha, aspas e Unicode, permanecem intactos. A correção não tenta reconstruir vírgulas, aspas ou estruturas ausentes; esses erros continuam bloqueando a importação.
