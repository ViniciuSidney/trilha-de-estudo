# Formato dos dados

## Estado atual

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

## Modelo planejado para a v0.1.0

```json
{
  "app": "Trilha de Estudo",
  "schemaVersion": 1,
  "exportedAt": "2026-08-29T00:00:00.000Z",
  "settings": {
    "theme": "light"
  },
  "sessions": []
}
```

Cada sessão deverá possuir, no mínimo:

```json
{
  "id": "uuid",
  "subject": "Assunto estudado",
  "objective": "Objetivo da sessão",
  "status": "in_progress",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "completedAt": null,
  "currentStep": 0,
  "maxStep": 0,
  "content": {},
  "performance": {},
  "flashcards": []
}
```

## Regras futuras

- toda exportação deve informar `schemaVersion`;
- IDs devem permanecer estáveis;
- migrações não podem apagar dados silenciosamente;
- backups incompatíveis devem ser recusados com mensagem clara;
- conteúdos originais importados da IA devem poder ser preservados;
- configurações gerais não devem ser duplicadas em cada sessão.
