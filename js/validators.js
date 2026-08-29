(function initializeValidators(global) {
  const { stripCodeFence } = global.TrilhaApp.utils;

  class ImportValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = "ImportValidationError";
    }
  }

  function parseJSON(raw) {
    if (!String(raw || "").trim()) throw new ImportValidationError("Cole primeiro a resposta recebida da IA.");
    try {
      return JSON.parse(stripCodeFence(raw));
    } catch {
      throw new ImportValidationError("O conteúdo não é um JSON válido. Confira vírgulas, aspas e chaves.");
    }
  }

  function requiredText(value, field) {
    if (typeof value !== "string" || !value.trim()) throw new ImportValidationError(`Há um item sem ${field}.`);
    return value.trim();
  }

  function validateItemCount(items, singular, plural, maximum) {
    if (!items.length) throw new ImportValidationError(`Envie pelo menos um ${singular}.`);
    if (items.length > maximum) throw new ImportValidationError(`O limite é de ${maximum} ${plural} por importação.`);
  }

  function parseTopics(raw) {
    const parsed = parseJSON(raw);
    const topics = Array.isArray(parsed) ? parsed : parsed?.topics;
    if (!Array.isArray(topics)) throw new ImportValidationError('O JSON precisa conter uma lista chamada "topics".');
    if (topics.length < 2 || topics.length > 10) throw new ImportValidationError("A resposta precisa conter entre 2 e 10 tópicos.");
    return topics.map((topic, index) => {
      if (!topic || typeof topic !== "object" || Array.isArray(topic)) throw new ImportValidationError(`O tópico ${index + 1} não é um objeto válido.`);
      return {
        id: `topic-${Date.now()}-${index + 1}`,
        title: requiredText(topic.title, `título no tópico ${index + 1}`).slice(0, 120),
        objective: requiredText(topic.objective, `objetivo no tópico ${index + 1}`).slice(0, 300),
      };
    });
  }

  function parseIntro(raw) {
    const parsed = parseJSON(raw);
    if (!Array.isArray(parsed)) throw new ImportValidationError("A resposta precisa ser uma lista JSON de perguntas.");
    validateItemCount(parsed, "pergunta", "perguntas", 30);
    return parsed.map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) throw new ImportValidationError(`A pergunta ${index + 1} não é um objeto válido.`);
      return {
        question: requiredText(item.question, `texto na pergunta ${index + 1}`),
        modelAnswer: requiredText(item.modelAnswer, `resposta-modelo na pergunta ${index + 1}`),
      };
    });
  }

  function parseQuiz(raw) {
    const parsed = parseJSON(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new ImportValidationError("A resposta precisa ser um objeto JSON.");
    if (!Array.isArray(parsed.questions)) throw new ImportValidationError('O JSON precisa conter uma lista chamada "questions".');
    validateItemCount(parsed.questions, "questão", "questões", 100);
    return parsed.questions.map((question, index) => {
      if (!question || typeof question !== "object" || Array.isArray(question)) throw new ImportValidationError(`A questão ${index + 1} não é um objeto válido.`);
      const options = question?.options;
      if (!options || typeof options !== "object" || Array.isArray(options)) throw new ImportValidationError(`A questão ${index + 1} não possui alternativas válidas.`);
      const normalizedOptions = {};
      ["A", "B", "C", "D"].forEach((key) => {
        normalizedOptions[key] = requiredText(options[key], `alternativa ${key} na questão ${index + 1}`);
      });
      const answer = String(question.answer || "").trim().toUpperCase();
      if (!(answer in normalizedOptions)) throw new ImportValidationError(`O gabarito da questão ${index + 1} deve ser A, B, C ou D.`);
      return {
        id: question.id ?? index + 1,
        statement: requiredText(question.statement, `enunciado na questão ${index + 1}`),
        options: normalizedOptions,
        answer,
        explanation: requiredText(question.explanation, `explicação na questão ${index + 1}`),
      };
    });
  }

  function parseFlashcards(raw) {
    const parsed = parseJSON(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new ImportValidationError("A resposta precisa ser um objeto JSON.");
    if (!Array.isArray(parsed.cards)) throw new ImportValidationError('O JSON precisa conter uma lista chamada "cards".');
    validateItemCount(parsed.cards, "flashcard", "flashcards", 100);
    return parsed.cards.map((card, index) => {
      if (!card || typeof card !== "object" || Array.isArray(card)) throw new ImportValidationError(`O flashcard ${index + 1} não é um objeto válido.`);
      if (card.tags !== undefined && (!Array.isArray(card.tags) || card.tags.some((tag) => typeof tag !== "string"))) {
        throw new ImportValidationError(`As tags do flashcard ${index + 1} precisam formar uma lista de textos.`);
      }
      return {
        front: requiredText(card.front, `frente no flashcard ${index + 1}`),
        back: requiredText(card.back, `verso no flashcard ${index + 1}`),
        tags: (card.tags || []).filter((tag) => tag.trim()).map((tag) => tag.trim()),
      };
    });
  }

  global.TrilhaApp.validators = { ImportValidationError, parseTopics, parseIntro, parseQuiz, parseFlashcards };
})(window);
