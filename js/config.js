(function initializeConfig(global) {
  const APP_NAME = "Trilha de Estudo";
  const SCHEMA_VERSION = 2;
  const STORAGE_KEY = "trilha-estudo-prototipo-v4";

  const phases = [
    { label: "Configuração", screens: [{ label: "Definir assunto", mode: "Início" }] },
    { label: "Base teórica", screens: [{ label: "Preparar com IA", mode: "1 de 2 · Preparar" }, { label: "Ler o resultado", mode: "2 de 2 · Estudar" }] },
    { label: "Perguntas iniciais", screens: [{ label: "Preparar com IA", mode: "1 de 2 · Preparar" }, { label: "Responder", mode: "2 de 2 · Praticar" }] },
    { label: "Questões objetivas", screens: [{ label: "Preparar com IA", mode: "1 de 2 · Preparar" }, { label: "Responder", mode: "2 de 2 · Praticar" }] },
    { label: "Correção", screens: [{ label: "Preparar devolutiva", mode: "1 de 2 · Preparar" }, { label: "Corrigir os erros", mode: "2 de 2 · Consolidar" }] },
    { label: "Flashcards", screens: [{ label: "Preparar com IA", mode: "1 de 2 · Preparar" }, { label: "Revisar cartões", mode: "2 de 2 · Revisar" }] },
    { label: "Encerramento", screens: [{ label: "Resumo da sessão", mode: "Conclusão" }] },
  ];

  const steps = phases.flatMap((phase) => phase.screens.map((item) => ({ ...item, phase: phase.label })));

  function createInitialState() {
    return {
      currentStep: 0,
      maxStep: 0,
      theme: global.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light",
      startedAt: new Date().toISOString(),
      subject: "",
      objective: "",
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
  global.TrilhaApp.config = { APP_NAME, SCHEMA_VERSION, STORAGE_KEY, phases, steps, createInitialState };
})(window);
