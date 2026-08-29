# Decisões técnicas

## Aplicação estática

A base utiliza HTML, CSS e JavaScript sem bibliotecas externas. Isso mantém o projeto simples, executável offline e fácil de estudar ou publicar.

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

## Temas

Claro e escuro utilizam paletas próprias. A preferência é global, fica salva localmente e se aplica a todas as sessões.

## Central e múltiplas sessões

A central existe fora do assistente de doze telas. Ela apresenta o histórico local e permite iniciar, continuar, revisar e administrar sessões independentes. Abrir uma sessão define `activeSessionId`; voltar à central apenas fecha a sessão ativa, sem remover seu conteúdo.

Cada sessão guarda seu próprio estado completo. Título, assunto, status e datas ficam também como metadados para que a central possa renderizar rapidamente progresso e desempenho.

## Arquitetura modular da v0.1.0

A fundação técnica separa responsabilidades sem exigir empacotador, servidor ou módulos ES. Os arquivos usam o namespace `window.TrilhaApp` e são carregados em ordem pelo `index.html`, preservando a abertura direta da aplicação pelo sistema de arquivos.

Estrutura atual:

```text
js/
├── app.js
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
