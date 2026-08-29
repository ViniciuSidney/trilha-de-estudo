const { steps, createInitialState } = window.TrilhaApp.config;
const { loadState, saveState: persistState } = window.TrilhaApp.storage;
const { createStateManager } = window.TrilhaApp.state;
const { buildTheoryPrompt, buildIntroPrompt, buildQuizPrompt, buildCorrectionPrompt, buildFlashcardPrompt } = window.TrilhaApp.prompts;
const navigation = window.TrilhaApp.navigation;
const selectors = window.TrilhaApp.selectors;
const validators = window.TrilhaApp.validators;
const { downloadSession } = window.TrilhaApp.exporter;
const { createDemoState } = window.TrilhaApp.demo;
const { createViewRenderer } = window.TrilhaApp.views;

const stateManager = createStateManager(loadState());
let state = stateManager.getState();
let toastTimer;
let viewRenderer;

const screen = document.querySelector("#screen");
const screenContent = document.querySelector("#screenContent");
const screenActions = document.querySelector("#screenActions");
const stepNav = document.querySelector("#stepNav");
const progressLabel = document.querySelector("#progressLabel");
const progressBar = document.querySelector("#progressBar");
const saveStatus = document.querySelector("#saveStatus");
const sidebarSubject = document.querySelector("#sidebarSubject");
const toast = document.querySelector("#toast");
const themeButton = document.querySelector("#themeButton");
const themeIcon = document.querySelector("#themeIcon");
const themeLabel = document.querySelector("#themeLabel");

applyTheme();

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  if (!themeButton) return;
  const dark = state.theme === "dark";
  themeIcon.textContent = dark ? "☀" : "☾";
  themeLabel.textContent = dark ? "Tema claro" : "Tema escuro";
  themeButton.setAttribute("aria-label", dark ? "Ativar tema claro" : "Ativar tema escuro");
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme();
  saveState();
}

function saveState() {
  saveStatus.textContent = "Salvando…";
  const result = persistState(state);
  if (!result.ok) {
    saveStatus.textContent = result.reason === "incompatible-schema" ? "Versão de dados incompatível" : "Não foi possível salvar";
    return;
  }
  window.setTimeout(() => (saveStatus.textContent = "Tudo salvo"), 220);
}

function updateState(patch, renderAfter = false) {
  state = stateManager.updateState(patch);
  saveState();
  if (renderAfter) render();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2500);
}

async function copyText(text, success = "Prompt copiado!") {
  try {
    await navigator.clipboard.writeText(text);
    showToast(success);
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.appendChild(fallback);
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    showToast(copied ? success : "Selecione o prompt e copie manualmente.");
  }
}

function goToStep(index) {
  const patch = navigation.goToStep(state, index, steps.length);
  if (!patch) return;
  state = stateManager.updateState(patch);
  saveState();
  render();
  screen.scrollTo({ top: 0, behavior: "smooth" });
  document.body.classList.remove("menu-open");
}

function advance() {
  const patch = navigation.advance(state, steps.length);
  if (state.currentStep === 7) patch.correctionSourceSignature = correctionPrompt();
  state = stateManager.updateState(patch);
  saveState();
  render();
  screen.scrollTo({ top: 0, behavior: "smooth" });
}

function back() {
  const patch = navigation.back(state);
  if (!patch) return;
  state = stateManager.updateState(patch);
  saveState();
  render();
  screen.scrollTo({ top: 0, behavior: "smooth" });
}


function theoryPrompt() {
  return buildTheoryPrompt(state);
}

function introPrompt() {
  return buildIntroPrompt(state);
}

function quizPrompt() {
  return buildQuizPrompt(state);
}

function correctionPrompt() {
  return buildCorrectionPrompt(state, getQuizResult());
}

function flashcardPrompt() {
  return buildFlashcardPrompt(state);
}

function getQuizResult() {
  return selectors.getQuizResult(state);
}

function wrongQuestions() {
  return selectors.getWrongQuestions(state);
}

viewRenderer = createViewRenderer({
  getState: () => state,
  theoryPrompt,
  introPrompt,
  quizPrompt,
  correctionPrompt,
  flashcardPrompt,
  getQuizResult,
  wrongQuestions,
});

function parseIntro() {
  if (state.introQuestions.length && !window.confirm("Substituir as perguntas importadas? As respostas e todas as etapas dependentes delas serão apagadas.")) return;
  try {
    const parsed = validators.parseIntro(state.introRaw);
    updateState({
      introQuestions: parsed,
      introAnswers: {},
      introIndex: 0,
      introSourceTheory: state.theory,
      quizRaw: "",
      quizQuestions: [],
      quizSourceSignature: "",
      quizAnswers: {},
      quizIndex: 0,
      quizFinished: false,
      consolidation: "",
      correctionSourceSignature: "",
      errorReflections: {},
      errorIndex: 0,
      flashcardsRaw: "",
      flashcards: [],
      flashcardIndex: 0,
      maxStep: Math.min(state.maxStep, 4),
    }, true);
    showToast(`${parsed.length} perguntas importadas.`);
  } catch (error) {
    showToast(error.message || "Não foi possível importar as perguntas.");
  }
}

function parseQuiz() {
  if (state.quizQuestions.length && !window.confirm("Substituir as questões? As respostas, o resultado e as correções posteriores serão apagados.")) return;
  try {
    const questions = validators.parseQuiz(state.quizRaw);
    updateState({
      quizQuestions: questions,
      quizAnswers: {},
      quizIndex: 0,
      quizFinished: false,
      quizSourceSignature: quizPrompt(),
      consolidation: "",
      correctionSourceSignature: "",
      errorReflections: {},
      errorIndex: 0,
      flashcardsRaw: "",
      flashcards: [],
      flashcardIndex: 0,
      maxStep: Math.min(state.maxStep, 6),
    }, true);
    showToast(`${questions.length} questões importadas.`);
  } catch (error) {
    showToast(error.message || "Não foi possível importar as questões.");
  }
}

function parseFlashcards() {
  if (state.flashcards.length && !window.confirm("Substituir os flashcards atuais? As edições feitas neles serão perdidas.")) return;
  try {
    const cards = validators.parseFlashcards(state.flashcardsRaw);
    updateState({ flashcards: cards, flashcardIndex: 0, maxStep: Math.min(state.maxStep, 10) }, true);
    showToast(`${cards.length} flashcards importados.`);
  } catch (error) {
    showToast(error.message || "Não foi possível importar os flashcards.");
  }
}

function setItemIndex(kind, index) {
  const patch = navigation.setItemIndex(state, kind, index, wrongQuestions().length);
  if (!patch) return;
  state = stateManager.updateState(patch);
  saveState();
  render();
  screen.scrollTo({ top: 0, behavior: "smooth" });
}


function render() {
  stepNav.innerHTML = viewRenderer.renderNav();
  screenActions.innerHTML = "";
  screenContent.innerHTML = viewRenderer.renderScreen(state.currentStep);
  const actionRows = screenContent.querySelectorAll(".button-row");
  const primaryActions = actionRows[actionRows.length - 1];
  if (primaryActions) screenActions.appendChild(primaryActions);
  const activeStep = steps[state.currentStep];
  progressLabel.textContent = `${activeStep.phase} · ${activeStep.mode}`;
  progressBar.style.width = `${((state.currentStep + 1) / steps.length) * 100}%`;
  sidebarSubject.textContent = state.subject || "Ainda sem assunto";
  bindDynamicEvents();
}

function bindDynamicEvents() {
  screen.querySelectorAll("[data-bind]").forEach((el) => {
    el.addEventListener("input", () => {
      state[el.dataset.bind] = el.value;
      if (el.dataset.bind === "subject") sidebarSubject.textContent = el.value || "Ainda sem assunto";
      saveState();
      if (el.dataset.bind === "subject") {
        const next = screenActions.querySelector('[data-action="advance"]');
        if (next) next.disabled = !el.value.trim();
      }
      updateContinueAvailability();
    });
  });

  screen.querySelectorAll("[data-intro-answer]").forEach((el) => el.addEventListener("input", () => {
    state.introAnswers[el.dataset.introAnswer] = el.value;
    saveState();
    updateContinueAvailability();
  }));
  screen.querySelectorAll("[data-quiz-answer]").forEach((el) => el.addEventListener("change", () => {
    state.quizAnswers[el.dataset.quizAnswer] = el.value;
    saveState();
    updateContinueAvailability();
  }));
  screen.querySelectorAll("[data-error-reflection]").forEach((el) => el.addEventListener("input", () => {
    state.errorReflections[el.dataset.errorReflection] = el.value;
    saveState();
    updateContinueAvailability();
  }));
  screen.querySelectorAll("[data-card-front]").forEach((el) => el.addEventListener("input", () => {
    state.flashcards[el.dataset.cardFront].front = el.value;
    saveState();
    updateContinueAvailability();
  }));
  screen.querySelectorAll("[data-card-back]").forEach((el) => el.addEventListener("input", () => {
    state.flashcards[el.dataset.cardBack].back = el.value;
    saveState();
    updateContinueAvailability();
  }));
}

function updateContinueAvailability() {
  const button = screenActions.querySelector('[data-action="advance"], [data-action="finish-quiz"]');
  if (!button) return;
  if (state.currentStep === 1) button.disabled = state.theory.trim().length < 80;
  if (state.currentStep === 4) button.disabled = !state.introQuestions.length || !state.introQuestions.every((_, i) => (state.introAnswers[i] || "").trim());
  if (state.currentStep === 6) button.disabled = !state.quizQuestions.length || !state.quizQuestions.every((_, i) => state.quizAnswers[i]);
  if (state.currentStep === 7) button.disabled = state.consolidation.trim().length < 50;
  if (state.currentStep === 8) button.disabled = wrongQuestions().some(({ index }) => (state.errorReflections[index] || "").trim().length < 20);
  if (state.currentStep === 10) button.disabled = !state.flashcards.length || state.flashcards.some((card) => !card.front.trim() || !card.back.trim());
}

function finishQuiz() {
  if (!state.quizQuestions.every((_, i) => state.quizAnswers[i])) return;
  state.quizFinished = true;
  advance();
}

function exportSession() {
  downloadSession(state);
  showToast("Sessão exportada.");
}

function loadDemo() {
  state = stateManager.replaceState(createDemoState(state.theme));
  saveState();
  render();
  showToast("Demonstração carregada. Percorra as etapas no seu ritmo.");
}

function resetSession() {
  if (!window.confirm("Deseja apagar a sessão salva neste navegador e recomeçar?")) return;
  const currentTheme = state.theme;
  state = stateManager.replaceState({ ...createInitialState(), theme: currentTheme });
  saveState();
  applyTheme();
  render();
  showToast("Nova sessão iniciada.");
}

document.addEventListener("click", (event) => {
  const stepButton = event.target.closest("[data-step]");
  if (stepButton) return goToStep(Number(stepButton.dataset.step));

  const itemButton = event.target.closest("[data-item-kind]");
  if (itemButton && !itemButton.disabled) {
    return setItemIndex(itemButton.dataset.itemKind, Number(itemButton.dataset.itemIndex));
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    const action = actionButton.dataset.action;
    if (action === "advance") advance();
    if (action === "back") back();
    if (action === "parse-intro") parseIntro();
    if (action === "parse-quiz") parseQuiz();
    if (action === "finish-quiz") finishQuiz();
    if (action === "parse-flashcards") parseFlashcards();
    if (action === "add-card") {
      state.flashcards.push({ front: "", back: "", tags: [] });
      state.flashcardIndex = state.flashcards.length - 1;
      saveState();
      render();
    }
    if (action === "export") exportSession();
    if (action === "print") window.print();
  }

  const copyButton = event.target.closest("[data-copy]");
  if (copyButton) {
    const prompts = { theory: theoryPrompt, intro: introPrompt, quiz: quizPrompt, correction: correctionPrompt, flashcards: flashcardPrompt };
    copyText(prompts[copyButton.dataset.copy]());
  }

  const removeButton = event.target.closest("[data-remove-card]");
  if (removeButton) {
    state.flashcards.splice(Number(removeButton.dataset.removeCard), 1);
    if (!state.flashcards.length) {
      state.flashcardIndex = 0;
      state.currentStep = 9;
      state.maxStep = Math.min(state.maxStep, 9);
      showToast("Todos os cartões foram removidos. Importe ou crie um novo conjunto.");
    } else {
      state.flashcardIndex = Math.min(state.flashcardIndex, state.flashcards.length - 1);
    }
    saveState();
    render();
  }
});

document.querySelector("#menuButton").addEventListener("click", () => document.body.classList.toggle("menu-open"));
themeButton.addEventListener("click", toggleTheme);
document.querySelector("#demoButton").addEventListener("click", () => {
  if (!state.subject || window.confirm("A demonstração substituirá a sessão atual. Continuar?")) loadDemo();
});
document.querySelector("#resetButton").addEventListener("click", resetSession);

render();
