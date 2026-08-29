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

Claro e escuro utilizam paletas próprias. A preferência fica salva localmente.

## Arquitetura modular da v0.1.0

A fundação técnica separa responsabilidades sem exigir empacotador, servidor ou módulos ES. Os arquivos usam o namespace `window.TrilhaApp` e são carregados em ordem pelo `index.html`, preservando a abertura direta da aplicação pelo sistema de arquivos.

Estrutura atual:

```text
js/
├── app.js
├── config.js
├── demo.js
├── exporter.js
├── navigation.js
├── prompts.js
├── selectors.js
├── state.js
├── storage.js
├── utils.js
├── validators.js
└── views.js
```

O `app.js` permanece como orquestrador dos elementos do DOM e dos eventos. Regras derivadas, validações, dados demonstrativos, exportação, persistência e geração das telas ficam isolados em módulos próprios.
