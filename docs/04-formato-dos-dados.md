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

## Armazenamento atual — schemaVersion 2

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
