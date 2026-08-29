(function initializeExporter(global) {
  const { APP_NAME, SCHEMA_VERSION, steps } = global.TrilhaApp.config;
  const { getLearningSummary } = global.TrilhaApp.selectors;

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "sessao";
  }

  function buildSessionText(state) {
    const summary = getLearningSummary(state);
    const intro = state.introQuestions.map((question, index) => `PERGUNTA ${index + 1}\n${question.question}\nResposta: ${state.introAnswers[index] || "—"}\nResposta-modelo: ${question.modelAnswer || "—"}\nComparação realizada: ${state.introReviewed?.[index] ? "Sim" : "Não"}`).join("\n\n");
    const quiz = state.quizQuestions.map((question, index) => `QUESTÃO ${index + 1}\n${question.statement}\nResposta inicial: ${state.quizAnswers[index] || "—"}\nGabarito: ${question.answer}\nExplicação: ${question.explanation || "—"}\nNova tentativa: ${state.quizRetryAnswers?.[index] || "Não necessária/não realizada"}\nCorreção ativa: ${state.errorReflections[index] || "Não necessária/não registrada"}`).join("\n\n");
    const cards = state.flashcards.map((card, index) => `CARTÃO ${index + 1}\nFrente: ${card.front}\nVerso: ${card.back}\nTags: ${(card.tags || []).join(", ")}`).join("\n\n");
    const divider = "=".repeat(58);
    return `TRILHA DE ESTUDO — REGISTRO DA SESSÃO\n\nAssunto: ${state.subject}\nObjetivo: ${state.objective || "Não informado"}\nInício: ${new Date(state.startedAt).toLocaleString("pt-BR")}\nConclusão: ${state.finishedAt ? new Date(state.finishedAt).toLocaleString("pt-BR") : "Não registrada"}\nResultado inicial: ${summary.quiz.correct}/${summary.quiz.total} (${summary.quiz.percentage}%)\nErros corrigidos na nova tentativa: ${summary.retry.corrected}/${summary.retry.total}\n\n${divider}\nBASE TEÓRICA\n${divider}\n${state.theory}\n\n${divider}\nPERGUNTAS INTRODUTÓRIAS\n${divider}\n${intro}\n\n${divider}\nQUESTÕES, NOVAS TENTATIVAS E CORREÇÕES\n${divider}\n${quiz}\n\n${divider}\nCONSOLIDAÇÃO DA IA\n${divider}\n${state.consolidation}\n\n${divider}\nFLASHCARDS\n${divider}\n${cards}\n`;
  }

  function buildSessionRecord(state, session = {}) {
    const metadata = {
      id: typeof session.id === "string" ? session.id : null,
      title: typeof session.title === "string" ? session.title : "",
      status: typeof session.status === "string" ? session.status : (state.currentStep === steps.length - 1 ? "completed" : "in_progress"),
      createdAt: session.createdAt || state.startedAt,
      updatedAt: session.updatedAt || state.finishedAt || state.startedAt,
      completedAt: session.completedAt || state.finishedAt || null,
    };
    return {
      app: APP_NAME,
      type: "study-session",
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      session: {
        ...metadata,
        subject: state.subject,
        objective: state.objective,
        summary: getLearningSummary(state),
        state: structuredClone(state),
      },
    };
  }

  function buildSessionJSON(state, session) {
    return JSON.stringify(buildSessionRecord(state, session), null, 2);
  }

  function downloadFile(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadSessionText(state) {
    downloadFile(buildSessionText(state), "text/plain;charset=utf-8", `trilha-${slugify(state.subject)}.txt`);
  }

  function downloadSessionJSON(state, session) {
    downloadFile(buildSessionJSON(state, session), "application/json;charset=utf-8", `trilha-${slugify(state.subject)}.json`);
  }

  global.TrilhaApp.exporter = {
    slugify,
    buildSessionText,
    buildSessionRecord,
    buildSessionJSON,
    downloadSession: downloadSessionText,
    downloadSessionText,
    downloadSessionJSON,
  };
})(window);
