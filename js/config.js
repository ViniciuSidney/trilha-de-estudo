(function initializeConfig(global) {
  const APP_NAME = "Trilha de Estudo";
  const SCHEMA_VERSION = 3;
  const STORAGE_KEY = "trilha-estudo-prototipo-v4";

  const phases = [
    { label: "Configuração", screens: [{ id: "subject", label: "Definir estudo", mode: "Início" }] },
    { label: "Planejamento", screens: [{ id: "topics-build", label: "Sugerir tópicos", mode: "1 de 2 · Preparar" }, { id: "topics-review", label: "Revisar estrutura", mode: "2 de 2 · Organizar" }] },
    { label: "Panorama geral", screens: [{ id: "theory-build", label: "Preparar com IA", mode: "1 de 2 · Preparar" }, { id: "theory-read", label: "Ler o panorama", mode: "2 de 2 · Estudar" }] },
    { label: "Perguntas iniciais", screens: [{ id: "intro-build", label: "Preparar com IA", mode: "1 de 2 · Preparar" }, { id: "intro-answer", label: "Responder", mode: "2 de 2 · Praticar" }] },
    { label: "Questões integradoras", screens: [{ id: "quiz-build", label: "Preparar com IA", mode: "1 de 2 · Preparar" }, { id: "quiz-answer", label: "Responder", mode: "2 de 2 · Praticar" }] },
    { label: "Correção", screens: [{ id: "correction-build", label: "Preparar devolutiva", mode: "1 de 2 · Preparar" }, { id: "correction-result", label: "Corrigir os erros", mode: "2 de 2 · Consolidar" }] },
    { label: "Flashcards", screens: [{ id: "flashcards-build", label: "Preparar com IA", mode: "1 de 2 · Preparar" }, { id: "flashcards-review", label: "Revisar cartões", mode: "2 de 2 · Revisar" }] },
    { label: "Encerramento", screens: [{ id: "final", label: "Resumo da sessão", mode: "Conclusão" }] },
  ];

  const steps = phases.flatMap((phase) => phase.screens.map((item) => ({ ...item, phase: phase.label })));
  const STEP_INDEX = Object.fromEntries(steps.map((step, index) => [step.id, index]));

  function createInitialState() {
    return {
      currentStep: 0,
      maxStep: 0,
      theme: global.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light",
      startedAt: new Date().toISOString(),
      subjectArea: "",
      studyTheme: "",
      subject: "",
      objective: "",
      topicsRaw: "",
      topics: [],
      topicPlanSourceSignature: "",
      topicIndex: 0,
      theory: "",
      introRaw: "",
      introQuestions: [],
      introSourceTheory: "",
      introAnswers: {},
      introReviewed: {},
      introIndex: 0,
      quizRaw: "",
      quizQuestions: [],
      quizSourceSignature: "",
      quizAnswers: {},
      quizRetryAnswers: {},
      quizIndex: 0,
      quizFinished: false,
      consolidation: "",
      correctionSourceSignature: "",
      errorReflections: {},
      errorIndex: 0,
      flashcardsRaw: "",
      flashcards: [],
      flashcardIndex: 0,
      finishedAt: "",
    };
  }

  global.TrilhaApp = global.TrilhaApp || {};
  global.TrilhaApp.config = { APP_NAME, SCHEMA_VERSION, STORAGE_KEY, phases, steps, STEP_INDEX, createInitialState };
})(window);
