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

## Próxima refatoração

O arquivo `js/app.js` ainda concentra estado, regras, renderização e eventos. A primeira fase da v0.1.0 deverá separá-lo sem alterar o comportamento validado.

Estrutura sugerida:

```text
js/
├── app.js
├── core/
│   ├── state.js
│   ├── storage.js
│   └── navigation.js
├── services/
│   ├── prompts.js
│   ├── parsers.js
│   └── exporters.js
└── ui/
    ├── render.js
    ├── screens.js
    └── events.js
```

Essa divisão deve ser feita gradualmente, com testes após cada extração.
