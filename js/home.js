(function initializeHome(global) {
  const { steps } = global.TrilhaApp.config;
  const { escapeHTML } = global.TrilhaApp.utils;
  const { getLearningSummary } = global.TrilhaApp.selectors;

  function sessionName(session) {
    return session.title || session.subject || "Sessão sem título";
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Data indisponível";
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
  }

  function progressOf(session) {
    if (!session.subject && session.state.maxStep === 0) return 0;
    return Math.round(((Math.min(session.state.maxStep, steps.length - 1) + 1) / steps.length) * 100);
  }

  function performanceOf(session) {
    const summary = getLearningSummary(session.state);
    if (!summary.quiz.total) return "Ainda sem questões";
    const correction = summary.retry.total ? ` · ${summary.retry.corrected}/${summary.retry.total} corrigidos` : "";
    return `${summary.quiz.correct}/${summary.quiz.total} · ${summary.quiz.percentage}%${correction}`;
  }

  function renderSessionCard(session) {
    const progress = progressOf(session);
    const completed = session.status === "completed";
    const name = sessionName(session);
    const subject = session.subject && session.subject !== name ? session.subject : "";
    return `<article class="session-card">
      <div class="session-card-main">
        <div class="session-card-heading">
          <span class="status-pill ${completed ? "completed" : "in-progress"}">${completed ? "Concluída" : "Em andamento"}</span>
          <small>Atualizada em ${escapeHTML(formatDate(session.updatedAt))}</small>
        </div>
        <h3>${escapeHTML(name)}</h3>
        ${subject ? `<p>${escapeHTML(subject)}</p>` : ""}
        <div class="session-progress" aria-label="${progress}% concluído"><span style="width:${progress}%"></span></div>
        <div class="session-meta"><span>${progress}% da trilha</span><span>${escapeHTML(performanceOf(session))}</span></div>
      </div>
      <div class="session-card-actions">
        <button class="button compact" type="button" data-session-action="open" data-session-id="${escapeHTML(session.id)}">${completed ? "Revisar" : "Continuar"}</button>
        <button class="button secondary compact" type="button" data-session-action="rename" data-session-id="${escapeHTML(session.id)}">Renomear</button>
        <button class="button secondary compact" type="button" data-session-action="duplicate" data-session-id="${escapeHTML(session.id)}">Duplicar</button>
        <button class="button ghost compact session-delete" type="button" data-session-action="delete" data-session-id="${escapeHTML(session.id)}">Excluir</button>
      </div>
    </article>`;
  }

  function renderHome(sessions) {
    const latest = sessions[0];
    const completed = sessions.filter((session) => session.status === "completed").length;
    const inProgress = sessions.length - completed;
    return `<div class="home-view-content">
      <section class="home-intro">
        <div>
          <span class="eyebrow">Central de sessões</span>
          <h1>${sessions.length ? "Continue de onde parou." : "Comece sua primeira trilha."}</h1>
          <p class="lead">Cada estudo fica salvo separadamente neste navegador. Retome uma sessão ou comece um novo percurso quando quiser.</p>
        </div>
        <div class="home-actions">
          <button class="button home-new-button" type="button" data-home-action="new">+ Nova sessão</button>
          <button class="button secondary" type="button" data-home-action="export-backup" ${sessions.length ? "" : "disabled"}>Exportar backup</button>
          <button class="button secondary" type="button" data-home-action="import-backup">Importar backup</button>
        </div>
      </section>

      <section class="home-stats" aria-label="Resumo das sessões">
        <div class="metric"><span>Total de sessões</span><strong>${sessions.length}</strong></div>
        <div class="metric"><span>Em andamento</span><strong>${inProgress}</strong></div>
        <div class="metric"><span>Concluídas</span><strong>${completed}</strong></div>
      </section>

      ${latest ? `<section class="continue-panel card blue">
        <div>
          <span class="eyebrow">Mais recente</span>
          <h2>${escapeHTML(sessionName(latest))}</h2>
          <p class="hint">${progressOf(latest)}% da trilha · ${escapeHTML(performanceOf(latest))} · ${escapeHTML(formatDate(latest.updatedAt))}</p>
        </div>
        <button class="button" type="button" data-session-action="open" data-session-id="${escapeHTML(latest.id)}">${latest.status === "completed" ? "Revisar sessão" : "Continuar estudo"} →</button>
      </section>` : `<section class="home-empty card">
        <div class="empty-mark" aria-hidden="true">✦</div>
        <h2>Nenhuma sessão registrada</h2>
        <p class="hint">Crie uma sessão em branco ou carregue a demonstração para conhecer o percurso completo.</p>
        <div class="button-group">
          <button class="button" type="button" data-home-action="new">Criar primeira sessão</button>
          <button class="button secondary" type="button" data-home-action="demo">Carregar demonstração</button>
        </div>
      </section>`}

      ${sessions.length ? `<section class="sessions-section">
        <div class="section-heading"><div><span class="eyebrow">Histórico local</span><h2>Todas as sessões</h2></div><span class="hint">Mais recentes primeiro</span></div>
        <div class="sessions-grid">${sessions.map(renderSessionCard).join("")}</div>
      </section>` : ""}
    </div>`;
  }

  global.TrilhaApp.home = { sessionName, renderHome };
})(window);
