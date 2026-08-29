(function initializeBackup(global) {
  const { APP_NAME, SCHEMA_VERSION } = global.TrilhaApp.config;

  class BackupValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = "BackupValidationError";
    }
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function validDate(value) {
    return typeof value === "string" && !Number.isNaN(Date.parse(value));
  }

  function requireString(value, label, { allowEmpty = true } = {}) {
    if (typeof value !== "string" || (!allowEmpty && !value.trim())) {
      throw new BackupValidationError(`${label} está ausente ou possui formato inválido.`);
    }
  }

  function requireStringRecord(value, label) {
    if (!isObject(value) || Object.values(value).some((item) => typeof item !== "string")) {
      throw new BackupValidationError(`${label} possui respostas em formato inválido.`);
    }
  }

  function validateIntroQuestions(items, sessionNumber) {
    items.forEach((item, index) => {
      if (!isObject(item)) throw new BackupValidationError(`A pergunta ${index + 1} da sessão ${sessionNumber} é inválida.`);
      requireString(item.question, `A pergunta ${index + 1} da sessão ${sessionNumber}`, { allowEmpty: false });
      requireString(item.modelAnswer, `A resposta-modelo da pergunta ${index + 1} da sessão ${sessionNumber}`);
    });
  }

  function validateQuizQuestions(items, sessionNumber) {
    items.forEach((item, index) => {
      const label = `questão ${index + 1} da sessão ${sessionNumber}`;
      if (!isObject(item)) throw new BackupValidationError(`A ${label} é inválida.`);
      requireString(item.statement, `O enunciado da ${label}`, { allowEmpty: false });
      if (!isObject(item.options)) throw new BackupValidationError(`As alternativas da ${label} são inválidas.`);
      ["A", "B", "C", "D"].forEach((key) => requireString(item.options[key], `A alternativa ${key} da ${label}`, { allowEmpty: false }));
      if (!["A", "B", "C", "D"].includes(item.answer)) throw new BackupValidationError(`O gabarito da ${label} é inválido.`);
      requireString(item.explanation, `A explicação da ${label}`);
    });
  }

  function validateFlashcards(items, sessionNumber) {
    items.forEach((item, index) => {
      const label = `flashcard ${index + 1} da sessão ${sessionNumber}`;
      if (!isObject(item)) throw new BackupValidationError(`O ${label} é inválido.`);
      requireString(item.front, `A frente do ${label}`);
      requireString(item.back, `O verso do ${label}`);
      if (!Array.isArray(item.tags) || item.tags.some((tag) => typeof tag !== "string")) {
        throw new BackupValidationError(`As tags do ${label} são inválidas.`);
      }
    });
  }

  function validateState(state, sessionNumber) {
    if (!isObject(state)) throw new BackupValidationError(`O estado da sessão ${sessionNumber} é inválido.`);

    const stringFields = [
      "theme", "startedAt", "subject", "objective", "theory", "introRaw", "introSourceTheory",
      "quizRaw", "quizSourceSignature", "consolidation", "correctionSourceSignature", "flashcardsRaw",
    ];
    stringFields.forEach((field) => requireString(state[field], `O campo "${field}" da sessão ${sessionNumber}`));
    if (!["light", "dark"].includes(state.theme)) throw new BackupValidationError(`O tema da sessão ${sessionNumber} é inválido.`);
    if (!validDate(state.startedAt)) throw new BackupValidationError(`A data inicial da sessão ${sessionNumber} é inválida.`);

    ["currentStep", "maxStep", "introIndex", "quizIndex", "errorIndex", "flashcardIndex"].forEach((field) => {
      if (!Number.isInteger(state[field]) || state[field] < 0) {
        throw new BackupValidationError(`O campo "${field}" da sessão ${sessionNumber} é inválido.`);
      }
    });
    if (typeof state.quizFinished !== "boolean") throw new BackupValidationError(`O resultado da sessão ${sessionNumber} é inválido.`);

    if (!Array.isArray(state.introQuestions)) throw new BackupValidationError(`As perguntas da sessão ${sessionNumber} são inválidas.`);
    if (!Array.isArray(state.quizQuestions)) throw new BackupValidationError(`As questões da sessão ${sessionNumber} são inválidas.`);
    if (!Array.isArray(state.flashcards)) throw new BackupValidationError(`Os flashcards da sessão ${sessionNumber} são inválidos.`);
    requireStringRecord(state.introAnswers, `As respostas introdutórias da sessão ${sessionNumber}`);
    requireStringRecord(state.quizAnswers, `As respostas objetivas da sessão ${sessionNumber}`);
    requireStringRecord(state.errorReflections, `As correções da sessão ${sessionNumber}`);

    validateIntroQuestions(state.introQuestions, sessionNumber);
    validateQuizQuestions(state.quizQuestions, sessionNumber);
    validateFlashcards(state.flashcards, sessionNumber);
  }

  function validateSession(session, index, ids) {
    const number = index + 1;
    if (!isObject(session)) throw new BackupValidationError(`A sessão ${number} possui formato inválido.`);
    requireString(session.id, `O identificador da sessão ${number}`, { allowEmpty: false });
    if (ids.has(session.id)) throw new BackupValidationError(`O backup contém identificadores de sessão duplicados.`);
    ids.add(session.id);
    requireString(session.title, `O título da sessão ${number}`);
    requireString(session.subject, `O assunto da sessão ${number}`);
    if (!["in_progress", "completed"].includes(session.status)) throw new BackupValidationError(`O status da sessão ${number} é inválido.`);
    if (!validDate(session.createdAt) || !validDate(session.updatedAt)) throw new BackupValidationError(`As datas da sessão ${number} são inválidas.`);
    if (session.completedAt !== null && !validDate(session.completedAt)) throw new BackupValidationError(`A data de conclusão da sessão ${number} é inválida.`);
    validateState(session.state, number);
  }

  function buildBackup(repository) {
    return {
      app: APP_NAME,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      settings: { theme: repository.settings.theme },
      sessions: structuredClone(repository.sessions),
    };
  }

  function stringifyBackup(repository) {
    return JSON.stringify(buildBackup(repository), null, 2);
  }

  function parseBackup(raw) {
    let parsed;
    if (!String(raw || "").trim()) throw new BackupValidationError("O arquivo de backup está vazio.");
    try {
      parsed = JSON.parse(String(raw).replace(/^\uFEFF/, ""));
    } catch {
      throw new BackupValidationError("O arquivo não contém um JSON válido.");
    }

    if (!isObject(parsed)) throw new BackupValidationError("A raiz do backup precisa ser um objeto JSON.");
    if (parsed.app !== APP_NAME) throw new BackupValidationError(`Este arquivo não pertence ao aplicativo ${APP_NAME}.`);
    if (!Number.isInteger(parsed.schemaVersion)) throw new BackupValidationError("O backup não informa uma versão válida.");
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      const direction = parsed.schemaVersion > SCHEMA_VERSION ? "mais recente" : "mais antiga";
      throw new BackupValidationError(`O backup usa uma versão ${direction} e incompatível (versão ${parsed.schemaVersion}).`);
    }
    if (!validDate(parsed.exportedAt)) throw new BackupValidationError("A data de exportação do backup é inválida.");
    if (!isObject(parsed.settings) || !["light", "dark"].includes(parsed.settings.theme)) {
      throw new BackupValidationError("A configuração de tema do backup é inválida.");
    }
    if (!Array.isArray(parsed.sessions)) throw new BackupValidationError('O backup precisa conter uma lista chamada "sessions".');
    if (parsed.sessions.length > 500) throw new BackupValidationError("O backup excede o limite de 500 sessões.");

    const ids = new Set();
    parsed.sessions.forEach((session, index) => validateSession(session, index, ids));
    const repository = {
      app: APP_NAME,
      schemaVersion: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      settings: { theme: parsed.settings.theme },
      activeSessionId: null,
      sessions: structuredClone(parsed.sessions),
    };
    return { backup: parsed, repository, summary: summarizeBackup(parsed) };
  }

  function summarizeBackup(backup) {
    const completed = backup.sessions.filter((session) => session.status === "completed").length;
    return {
      total: backup.sessions.length,
      completed,
      inProgress: backup.sessions.length - completed,
      theme: backup.settings.theme,
      exportedAt: backup.exportedAt,
    };
  }

  function downloadBackup(repository) {
    const content = stringifyBackup(repository);
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `trilha-de-estudo-backup-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  global.TrilhaApp.backup = {
    BackupValidationError,
    buildBackup,
    stringifyBackup,
    parseBackup,
    summarizeBackup,
    downloadBackup,
  };
})(window);
