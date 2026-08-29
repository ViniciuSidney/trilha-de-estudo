# Formato dos dados

## Formato legado — prototype-v0.4

A base `prototype-v0.4` mantém uma única sessão no `localStorage`, usando a chave:

```text
trilha-estudo-prototipo-v4
```

O objeto contém:

- posição atual e maior etapa liberada;
- tema visual e data de início;
- assunto e objetivo;
- base teórica;
- perguntas introdutórias e respostas;
- questões, alternativas, gabarito e respostas;
- devolutiva da IA;
- correções ativas;
- flashcards;
- índices de navegação dos itens.

Ao encontrar esse formato plano, a aplicação o normaliza e o converte imediatamente para o modelo atual.

## Formato intermediário — schemaVersion 1

A primeira fundação modular utilizou temporariamente um envelope com uma única sessão:

```json
{
  "app": "Trilha de Estudo",
  "schemaVersion": 1,
  "savedAt": "2026-08-29T00:00:00.000Z",
  "state": {}
}
```

- `state` preserva todos os campos utilizados pelo protótipo;
- campos ausentes recebem valores iniciais seguros;
- coleções com tipos inválidos são normalizadas;
- dados legados sem `schemaVersion` são reconhecidos automaticamente;
- versões incompatíveis não são sobrescritas silenciosamente.

Esse formato também é migrado automaticamente para o modelo atual.

## Armazenamento da v0.1.0 — schemaVersion 2

```json
{
  "app": "Trilha de Estudo",
  "schemaVersion": 2,
  "savedAt": "2026-08-29T00:00:00.000Z",
  "settings": {
    "theme": "light"
  },
  "activeSessionId": "uuid-da-sessao",
  "sessions": [
    {
      "id": "uuid-da-sessao",
      "title": "Revisão de ondulatória",
      "subject": "Ondulatória",
      "status": "in_progress",
      "createdAt": "2026-08-29T00:00:00.000Z",
      "updatedAt": "2026-08-29T00:15:00.000Z",
      "completedAt": null,
      "state": {}
    }
  ]
}
```

- `settings.theme` é uma configuração global aplicada a todas as sessões;
- `activeSessionId` indica qual sessão está aberta no assistente e fica `null` na central;
- `title` é um nome opcional independente do assunto estudado;
- `subject`, `status` e datas são metadados usados na central;
- `state` preserva todo o estado do fluxo, incluindo etapa, conteúdos, respostas, desempenho e flashcards;
- `introReviewed` registra quais respostas introdutórias foram comparadas com o modelo;
- `quizRetryAnswers` mantém as novas tentativas separadas das respostas iniciais;
- `finishedAt` congela o instante de conclusão usado no cálculo da duração;
- IDs duplicados ou campos ausentes são normalizados antes do uso;
- chegar à tela final marca a sessão como concluída.

## Regras

- IDs devem permanecer estáveis;
- migrações não podem apagar dados silenciosamente;
- versões futuras incompatíveis não podem ser sobrescritas;
- todo backup exportado deve informar `schemaVersion`;
- backups incompatíveis deverão ser recusados com mensagem clara;
- conteúdos originais importados da IA devem poder ser preservados;
- configurações gerais não devem ser duplicadas em cada sessão.

## Backup completo

O arquivo exportado utiliza JSON legível e preserva configurações e sessões completas:

```json
{
  "app": "Trilha de Estudo",
  "schemaVersion": 2,
  "exportedAt": "2026-08-29T00:30:00.000Z",
  "settings": {
    "theme": "dark"
  },
  "sessions": []
}
```

O backup não mantém uma sessão ativa. Depois da restauração, a aplicação retorna à central para que o usuário escolha qual estudo abrir.

Antes da restauração, a aplicação verifica:

- identificação e versão do aplicativo;
- data de exportação e tema;
- lista de sessões e limite máximo de 500 registros;
- IDs únicos, metadados, datas e status;
- estrutura completa do estado de cada sessão;
- perguntas, questões, respostas, correções e flashcards.

Arquivos de até 10 MB podem ser selecionados. Após a validação, uma prévia informa quantas sessões estão em andamento e concluídas. Os dados locais somente são substituídos quando o usuário confirma a restauração.

Os campos de aprendizagem adicionados durante o desenvolvimento da `v0.1.0` são opcionais na leitura de backups `schemaVersion: 2`. Quando ausentes, recebem valores iniciais seguros, preservando a compatibilidade com backups anteriores.

## Exportação individual da sessão

Além do backup completo, cada sessão pode ser exportada isoladamente em TXT ou JSON. O JSON individual utiliza este envelope:

```json
{
  "app": "Trilha de Estudo",
  "type": "study-session",
  "schemaVersion": 2,
  "exportedAt": "2026-08-29T01:00:00.000Z",
  "session": {
    "id": "uuid-da-sessao",
    "title": "Revisão de ondulatória",
    "subject": "Ondulatória",
    "summary": {},
    "state": {}
  }
}
```

O TXT prioriza leitura humana. O JSON preserva metadados, resumo calculado e o estado completo para integrações futuras, mas não funciona como substituto do backup geral.

## Armazenamento da v0.2.0 — schemaVersion 3

O `schemaVersion: 3` preserva o repositório de múltiplas sessões e adiciona ao estado:

```json
{
  "subjectArea": "Física",
  "studyTheme": "Ondulatória",
  "subject": "Frequência, período e velocidade",
  "topicsRaw": "{...}",
  "topics": [
    {
      "id": "topic-1",
      "title": "Frequência e período",
      "objective": "Relacionar oscilações por segundo ao tempo de cada oscilação."
    }
  ],
  "topicPlanSourceSignature": "prompt usado na geração",
  "topicIndex": 0
}
```

- `subjectArea` representa a matéria;
- `studyTheme` representa o tema, sem conflitar com o campo visual `theme`;
- `subject` permanece como o assunto específico;
- `topicsRaw` preserva a resposta original da IA;
- `topics` contém a estrutura revisada pelo estudante;
- `topicPlanSourceSignature` detecta alterações na configuração;
- `topicIndex` será usado pela trilha individual da próxima fase.

Ao carregar `schemaVersion: 2`, as posições posteriores à configuração são deslocadas em duas telas para preservar a etapa equivalente. Os novos campos recebem valores iniciais seguros e o repositório migrado é salvo imediatamente.
