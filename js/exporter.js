(function initializeExporter(global) {
  const { getQuizResult } = global.TrilhaApp.selectors;

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
    const result = getQuizResult(state);
    const intro = state.introQuestions.map((question, index) => `PERGUNTA ${index + 1}\n${question.question}\nResposta: ${state.introAnswers[index] || "—"}\nResposta-modelo: ${question.modelAnswer || "—"}`).join("\n\n");
    const quiz = state.quizQuestions.map((question, index) => `QUESTÃO ${index + 1}\n${question.statement}\nResposta marcada: ${state.quizAnswers[index] || "—"}\nGabarito: ${question.answer}\nExplicação: ${question.explanation || "—"}\nCorreção ativa: ${state.errorReflections[index] || "Não necessária/não registrada"}`).join("\n\n");
    const cards = state.flashcards.map((card, index) => `CARTÃO ${index + 1}\nFrente: ${card.front}\nVerso: ${card.back}\nTags: ${(card.tags || []).join(", ")}`).join("\n\n");
    const divider = "=".repeat(58);
    return `TRILHA DE ESTUDO — REGISTRO DA SESSÃO\n\nAssunto: ${state.subject}\nObjetivo: ${state.objective || "Não informado"}\nInício: ${new Date(state.startedAt).toLocaleString("pt-BR")}\nResultado: ${result.correct}/${result.total} (${result.percentage}%)\n\n${divider}\nBASE TEÓRICA\n${divider}\n${state.theory}\n\n${divider}\nPERGUNTAS INTRODUTÓRIAS\n${divider}\n${intro}\n\n${divider}\nQUESTÕES E CORREÇÕES\n${divider}\n${quiz}\n\n${divider}\nCONSOLIDAÇÃO DA IA\n${divider}\n${state.consolidation}\n\n${divider}\nFLASHCARDS\n${divider}\n${cards}\n`;
  }

  function downloadSession(state) {
    const blob = new Blob([buildSessionText(state)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trilha-${slugify(state.subject)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  global.TrilhaApp.exporter = { slugify, buildSessionText, downloadSession };
})(window);
