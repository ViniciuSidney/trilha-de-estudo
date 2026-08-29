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

  function parseIntro(raw) {
    const parsed = parseJSON(raw);
    if (!Array.isArray(parsed) || !parsed.length) throw new ImportValidationError("Envie uma lista JSON com pelo menos uma pergunta.");
    return parsed.map((item) => ({
      question: requiredText(item?.question, "pergunta"),
      modelAnswer: typeof item?.modelAnswer === "string" ? item.modelAnswer.trim() : "",
    }));
  }

  function parseQuiz(raw) {
    const parsed = parseJSON(raw);
    if (!Array.isArray(parsed?.questions) || !parsed.questions.length) throw new ImportValidationError('O JSON precisa conter uma lista chamada "questions".');
    return parsed.questions.map((question, index) => {
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
        explanation: typeof question.explanation === "string" ? question.explanation.trim() : "",
      };
    });
  }

  function parseFlashcards(raw) {
    const parsed = parseJSON(raw);
    if (!Array.isArray(parsed?.cards) || !parsed.cards.length) throw new ImportValidationError('O JSON precisa conter uma lista chamada "cards".');
    return parsed.cards.map((card, index) => ({
      front: requiredText(card?.front, `frente no flashcard ${index + 1}`),
      back: requiredText(card?.back, `verso no flashcard ${index + 1}`),
      tags: Array.isArray(card?.tags) ? card.tags.filter((tag) => typeof tag === "string" && tag.trim()).map((tag) => tag.trim()) : [],
    }));
  }

  global.TrilhaApp.validators = { ImportValidationError, parseIntro, parseQuiz, parseFlashcards };
})(window);
