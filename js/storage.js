(function initializeStorage(global) {
  const { APP_NAME, SCHEMA_VERSION, STORAGE_KEY, steps, createInitialState } = global.TrilhaApp.config;
  let writeBlocked = false;

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function createId() {
    if (global.crypto?.randomUUID) return global.crypto.randomUUID();
    return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function validDate(value, fallback = new Date().toISOString()) {
    return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;
  }

  function normalizeState(candidate, theme) {
    const initial = createInitialState();
    if (!isObject(candidate)) return { ...initial, theme };

    const normalized = { ...initial, ...candidate, theme };
    const arrayFields = ["topics", "introQuestions", "quizQuestions", "flashcards"];
    const objectFields = ["introAnswers", "introReviewed", "quizAnswers", "quizRetryAnswers", "errorReflections"];

    arrayFields.forEach((field) => {
      if (!Array.isArray(normalized[field])) normalized[field] = initial[field];
    });
    normalized.topics = normalized.topics
      .filter((topic) => isObject(topic) && typeof topic.title === "string")
      .map((topic, index) => ({
        id: typeof topic.id === "string" && topic.id ? topic.id : `topic-${index + 1}`,
        title: topic.title.trim(),
        objective: typeof topic.objective === "string" ? topic.objective.trim() : "",
      }))
      .filter((topic) => topic.title);
    objectFields.forEach((field) => {
      if (!isObject(normalized[field])) normalized[field] = initial[field];
    });

    const lastStep = steps.length - 1;
    normalized.currentStep = Number.isInteger(normalized.currentStep) ? Math.max(0, Math.min(normalized.currentStep, lastStep)) : 0;
    normalized.maxStep = Number.isInteger(normalized.maxStep) ? Math.max(normalized.currentStep, Math.min(normalized.maxStep, lastStep)) : normalized.currentStep;
    ["topicIndex", "introIndex", "quizIndex", "errorIndex", "flashcardIndex"].forEach((field) => {
      if (!Number.isInteger(normalized[field]) || normalized[field] < 0) normalized[field] = 0;
    });
    if (typeof normalized.finishedAt !== "string") normalized.finishedAt = "";
    return normalized;
  }

  function hasMeaningfulContent(state) {
    return Boolean(
      state.subject?.trim()
      || state.objective?.trim()
      || state.theory?.trim()
      || state.introQuestions?.length
      || state.quizQuestions?.length
      || state.consolidation?.trim()
      || state.flashcards?.length
      || state.maxStep > 0
    );
  }

  function createSessionFromState(candidate, theme, metadata = {}) {
    const state = normalizeState(candidate, theme);
    const now = new Date().toISOString();
    const createdAt = validDate(metadata.createdAt || state.startedAt, now);
    const completed = metadata.status === "completed" || state.currentStep === steps.length - 1;
    return {
      id: typeof metadata.id === "string" && metadata.id ? metadata.id : createId(),
      title: typeof metadata.title === "string" ? metadata.title.trim() : "",
      subject: typeof state.subject === "string" ? state.subject.trim() : "",
      status: completed ? "completed" : "in_progress",
      createdAt,
      updatedAt: validDate(metadata.updatedAt, createdAt),
      completedAt: completed ? validDate(metadata.completedAt, now) : null,
      state,
    };
  }

  function createEmptyRepository(theme = createInitialState().theme) {
    return {
      app: APP_NAME,
      schemaVersion: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      settings: { theme: ["light", "dark"].includes(theme) ? theme : "light" },
      activeSessionId: null,
      sessions: [],
    };
  }

  function migrateLegacyState(candidate) {
    const theme = ["light", "dark"].includes(candidate?.theme) ? candidate.theme : createInitialState().theme;
    const repository = createEmptyRepository(theme);
    const legacy = isObject(candidate) ? structuredClone(candidate) : candidate;
    if (isObject(legacy)) {
      const mapStep = (value) => Number.isInteger(value) && value > 0 ? value + 2 : 0;
      legacy.currentStep = mapStep(legacy.currentStep);
      legacy.maxStep = mapStep(legacy.maxStep);
    }
    const normalized = normalizeState(legacy, theme);
    if (hasMeaningfulContent(normalized)) {
      const session = createSessionFromState(normalized, theme);
      repository.sessions.push(session);
      repository.activeSessionId = session.id;
    }
    return repository;
  }

  function normalizeRepository(candidate) {
    const fallbackTheme = createInitialState().theme;
    const theme = ["light", "dark"].includes(candidate?.settings?.theme) ? candidate.settings.theme : fallbackTheme;
    const repository = createEmptyRepository(theme);
    const ids = new Set();
    repository.sessions = (Array.isArray(candidate?.sessions) ? candidate.sessions : []).map((session) => {
      const normalized = createSessionFromState(session?.state, theme, session);
      while (ids.has(normalized.id)) normalized.id = createId();
      ids.add(normalized.id);
      return normalized;
    });
    repository.activeSessionId = ids.has(candidate?.activeSessionId) ? candidate.activeSessionId : null;
    repository.savedAt = validDate(candidate?.savedAt);
    return repository;
  }

  function migrateV2Repository(candidate) {
    const migrated = structuredClone(candidate);
    (Array.isArray(migrated.sessions) ? migrated.sessions : []).forEach((session) => {
      if (!isObject(session?.state)) return;
      const mapStep = (value) => Number.isInteger(value) && value > 0 ? value + 2 : 0;
      session.state.currentStep = mapStep(session.state.currentStep);
      session.state.maxStep = mapStep(session.state.maxStep);
    });
    migrated.schemaVersion = SCHEMA_VERSION;
    return normalizeRepository(migrated);
  }

  function migrateRecord(parsed) {
    if (!isObject(parsed)) return createEmptyRepository();
    if (!("schemaVersion" in parsed)) return migrateLegacyState(parsed);
    if (parsed.schemaVersion === 1) return migrateLegacyState(parsed.state);
    if (parsed.schemaVersion === 2) return migrateV2Repository(parsed);
    if (parsed.schemaVersion === SCHEMA_VERSION) return normalizeRepository(parsed);
    writeBlocked = true;
    return createEmptyRepository();
  }

  function loadRepository() {
    writeBlocked = false;
    const raw = global.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyRepository();
    try {
      const parsed = JSON.parse(raw);
      const repository = migrateRecord(parsed);
      if (parsed.schemaVersion !== SCHEMA_VERSION) {
        const result = saveRepository(repository);
        if (result.ok) return result.repository;
      }
      return repository;
    } catch {
      return createEmptyRepository();
    }
  }

  function saveRepository(repository) {
    if (writeBlocked) return { ok: false, reason: "incompatible-schema" };
    const normalized = normalizeRepository(repository);
    normalized.savedAt = new Date().toISOString();
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return { ok: true, repository: normalized };
    } catch {
      return { ok: false, reason: "storage-unavailable" };
    }
  }

  global.TrilhaApp.storage = {
    createId,
    normalizeState,
    createSessionFromState,
    createEmptyRepository,
    migrateV2Repository,
    loadRepository,
    saveRepository,
  };
})(window);
