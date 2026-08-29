(function initializeStorage(global) {
  const { APP_NAME, SCHEMA_VERSION, STORAGE_KEY, createInitialState } = global.TrilhaApp.config;
  let writeBlocked = false;

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeState(candidate) {
    const initial = createInitialState();
    if (!isObject(candidate)) return initial;

    const normalized = { ...initial, ...candidate };
    const arrayFields = ["introQuestions", "quizQuestions", "flashcards"];
    const objectFields = ["introAnswers", "quizAnswers", "errorReflections"];

    arrayFields.forEach((field) => {
      if (!Array.isArray(normalized[field])) normalized[field] = initial[field];
    });
    objectFields.forEach((field) => {
      if (!isObject(normalized[field])) normalized[field] = initial[field];
    });

    if (!Number.isInteger(normalized.currentStep)) normalized.currentStep = initial.currentStep;
    if (!Number.isInteger(normalized.maxStep)) normalized.maxStep = initial.maxStep;
    if (!Number.isInteger(normalized.introIndex)) normalized.introIndex = initial.introIndex;
    if (!Number.isInteger(normalized.quizIndex)) normalized.quizIndex = initial.quizIndex;
    if (!Number.isInteger(normalized.errorIndex)) normalized.errorIndex = initial.errorIndex;
    if (!Number.isInteger(normalized.flashcardIndex)) normalized.flashcardIndex = initial.flashcardIndex;
    if (!["light", "dark"].includes(normalized.theme)) normalized.theme = initial.theme;

    return normalized;
  }

  function migrateRecord(parsed) {
    if (!isObject(parsed)) return { state: createInitialState(), source: "empty" };

    if (!("schemaVersion" in parsed)) {
      return { state: normalizeState(parsed), source: "legacy" };
    }

    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      writeBlocked = true;
      return { state: createInitialState(), source: "incompatible" };
    }

    return { state: normalizeState(parsed.state), source: "current" };
  }

  function loadState() {
    writeBlocked = false;
    const raw = global.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();

    try {
      return migrateRecord(JSON.parse(raw)).state;
    } catch {
      return createInitialState();
    }
  }

  function saveState(state) {
    if (writeBlocked) return { ok: false, reason: "incompatible-schema" };

    const record = {
      app: APP_NAME,
      schemaVersion: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      state: normalizeState(state),
    };

    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      return { ok: true };
    } catch {
      return { ok: false, reason: "storage-unavailable" };
    }
  }

  global.TrilhaApp.storage = { loadState, saveState };
})(window);
