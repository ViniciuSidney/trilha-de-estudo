(function initializeSessions(global) {
  const { steps, createInitialState } = global.TrilhaApp.config;
  const storage = global.TrilhaApp.storage;

  function createSessionService() {
    let repository = storage.loadRepository();

    function persist() {
      const result = storage.saveRepository(repository);
      if (result.ok) repository = result.repository;
      return result;
    }

    function getRepository() {
      return repository;
    }

    function getTheme() {
      return repository.settings.theme;
    }

    function setTheme(theme) {
      if (!["light", "dark"].includes(theme)) return { ok: false, reason: "invalid-theme" };
      repository.settings.theme = theme;
      repository.sessions.forEach((session) => {
        session.state.theme = theme;
      });
      return persist();
    }

    function listSessions() {
      return [...repository.sessions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    function findSession(id) {
      return repository.sessions.find((session) => session.id === id) || null;
    }

    function getActiveSession() {
      return findSession(repository.activeSessionId);
    }

    function getActiveState() {
      const session = getActiveSession();
      return session ? storage.normalizeState(session.state, getTheme()) : null;
    }

    function createSession(candidate = createInitialState(), metadata = {}) {
      const state = storage.normalizeState(candidate, getTheme());
      const session = storage.createSessionFromState(state, getTheme(), metadata);
      repository.sessions.push(session);
      repository.activeSessionId = session.id;
      const result = persist();
      return { result, session: findSession(session.id), state: getActiveState() };
    }

    function openSession(id) {
      const session = findSession(id);
      if (!session) return null;
      repository.activeSessionId = id;
      persist();
      return getActiveState();
    }

    function leaveSession() {
      repository.activeSessionId = null;
      return persist();
    }

    function saveActiveState(candidate) {
      const session = getActiveSession();
      if (!session) return { ok: false, reason: "no-active-session" };
      const now = new Date().toISOString();
      session.state = storage.normalizeState(candidate, getTheme());
      session.subject = session.state.subject.trim();
      session.updatedAt = now;
      if (session.state.currentStep === steps.length - 1) {
        session.status = "completed";
        session.completedAt ||= now;
      }
      return persist();
    }

    function renameSession(id, title) {
      const session = findSession(id);
      const normalized = String(title || "").trim();
      if (!session || !normalized) return { ok: false, reason: "invalid-title" };
      session.title = normalized.slice(0, 90);
      session.updatedAt = new Date().toISOString();
      return persist();
    }

    function duplicateSession(id) {
      const source = findSession(id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copyState = structuredClone(source.state);
      copyState.startedAt = now;
      const title = `Cópia de ${source.title || source.subject || "sessão"}`.slice(0, 90);
      const session = storage.createSessionFromState(copyState, getTheme(), { title, createdAt: now, updatedAt: now });
      repository.sessions.push(session);
      persist();
      return findSession(session.id);
    }

    function deleteSession(id) {
      const index = repository.sessions.findIndex((session) => session.id === id);
      if (index < 0) return { ok: false, reason: "not-found" };
      const activeDeleted = repository.activeSessionId === id;
      repository.sessions.splice(index, 1);
      if (activeDeleted) repository.activeSessionId = null;
      const result = persist();
      return { ...result, activeDeleted };
    }

    function restartActiveSession() {
      const session = getActiveSession();
      if (!session) return null;
      const now = new Date().toISOString();
      session.state = { ...createInitialState(), theme: getTheme(), startedAt: now };
      session.subject = "";
      session.status = "in_progress";
      session.createdAt = now;
      session.updatedAt = now;
      session.completedAt = null;
      persist();
      return getActiveState();
    }

    return {
      getRepository,
      getTheme,
      setTheme,
      listSessions,
      findSession,
      getActiveSession,
      getActiveState,
      createSession,
      openSession,
      leaveSession,
      saveActiveState,
      renameSession,
      duplicateSession,
      deleteSession,
      restartActiveSession,
    };
  }

  global.TrilhaApp.sessions = { createSessionService };
})(window);
