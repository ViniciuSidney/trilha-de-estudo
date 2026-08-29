const { steps, createInitialState } = window.TrilhaApp.config;
const { createStateManager } = window.TrilhaApp.state;
const { createSessionService } = window.TrilhaApp.sessions;
const { buildTheoryPrompt, buildIntroPrompt, buildQuizPrompt, buildCorrectionPrompt, buildFlashcardPrompt } = window.TrilhaApp.prompts;
const navigation = window.TrilhaApp.navigation;
const selectors = window.TrilhaApp.selectors;
const validators = window.TrilhaApp.validators;
const { downloadSessionText, downloadSessionJSON } = window.TrilhaApp.exporter;
const { createDemoState } = window.TrilhaApp.demo;
const { createViewRenderer } = window.TrilhaApp.views;
const { sessionName, renderHome } = window.TrilhaApp.home;
const { escapeHTML } = window.TrilhaApp.utils;
const { downloadBackup, parseBackup } = window.TrilhaApp.backup;

const sessionService = createSessionService();
const initialRuntimeState = sessionService.getActiveState() || { ...createInitialState(), theme: sessionService.getTheme() };
const stateManager = createStateManager(initialRuntimeState);
let state = stateManager.getState();
let toastTimer;
let viewRenderer;
let pendingBackup = null;
let focusBeforeModal = null;

const screen = document.querySelector("#screen");
const screenContent = document.querySelector("#screenContent");
const screenActions = document.querySelector("#screenActions");
const stepNav = document.querySelector("#stepNav");
const progressLabel = document.querySelector("#progressLabel");
const progressBar = document.querySelector("#progressBar");
const progressTrack = document.querySelector("#progressTrack");
const saveStatus = document.querySelector("#saveStatus");
const sidebarSubject = document.querySelector("#sidebarSubject");
const toast = document.querySelector("#toast");
const themeButton = document.querySelector("#themeButton");
const themeIcon = document.querySelector("#themeIcon");
const themeLabel = document.querySelector("#themeLabel");
const homeButton = document.querySelector("#homeButton");
const backupFileInput = document.querySelector("#backupFileInput");
const backupModal = document.querySelector("#backupModal");
const backupPreview = document.querySelector("#backupPreview");
const restoreBackupButton = document.querySelector("#restoreBackupButton");
const appShell = document.querySelector(".app-shell");
const menuButton = document.querySelector("#menuButton");
const menuBackdrop = document.querySelector("#menuBackdrop");
const sidebar = document.querySelector("#sidebar");
const mobileViewport = window.matchMedia("(max-width: 920px)");

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
  const result = sessionService.setTheme(state.theme);
  saveStatus.textContent = result.ok ? "Tudo salvo" : "Não foi possível salvar";
}

function saveState() {
  saveStatus.textContent = "Salvando…";
  const result = sessionService.saveActiveState(state);
  if (!result.ok) {
    saveStatus.textContent = result.reason === "no-active-session" ? "Nenhuma sessão aberta" : result.reason === "incompatible-schema" ? "Versão de dados incompatível" : "Não foi possível salvar";
    return;
  }
  window.setTimeout(() => (saveStatus.textContent = "Tudo salvo"), 220);
}

function updateState(patch, renderAfter = false) {
  state = stateManager.updateState(patch);
  saveState();
  if (renderAfter) render();
}

function createNewSession() {
  const created = sessionService.createSession({ ...createInitialState(), theme: sessionService.getTheme() });
  state = stateManager.replaceState(created.state);
  applyTheme();
  render();
  screen.scrollTo({ top: 0 });
  showToast("Nova sessão criada.");
  focusScreenHeading();
}

function openSession(id) {
  const opened = sessionService.openSession(id);
  if (!opened) return showToast("A sessão não foi encontrada.");
  state = stateManager.replaceState(opened);
  applyTheme();
  render();
  screen.scrollTo({ top: 0 });
  focusScreenHeading();
}

function leaveCurrentSession() {
  if (sessionService.getActiveSession()) saveState();
  sessionService.leaveSession();
  state = stateManager.replaceState({ ...createInitialState(), theme: sessionService.getTheme() });
  render();
  screen.scrollTo({ top: 0 });
  focusScreenHeading();
}

function showToast(message, type = "success") {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("error", type === "error");
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), type === "error" ? 5000 : 2500);
}

function focusScreenHeading() {
  const heading = screenContent.querySelector("h1");
  if (!heading) return screen.focus({ preventScroll: true });
  heading.id = "screenTitle";
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

function setMobileMenu(open, { returnFocus = false } = {}) {
  const expanded = Boolean(open && mobileViewport.matches);
  document.body.classList.toggle("menu-open", expanded);
  menuButton.setAttribute("aria-expanded", String(expanded));
  menuButton.setAttribute("aria-label", expanded ? "Fechar etapas" : "Abrir etapas");
  menuBackdrop.hidden = !expanded;
  sidebar.inert = mobileViewport.matches && !expanded;
  sidebar.setAttribute("aria-hidden", String(mobileViewport.matches && !expanded));
  if (expanded) sidebar.querySelector('.step-link[aria-current="step"], .text-button')?.focus();
  else if (returnFocus) menuButton.focus();
}

function syncResponsiveNavigation() {
  if (!mobileViewport.matches) {
    document.body.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir etapas");
    menuBackdrop.hidden = true;
    sidebar.inert = false;
    sidebar.removeAttribute("aria-hidden");
  } else {
    setMobileMenu(document.body.classList.contains("menu-open"));
  }
}

function trapModalFocus(event) {
  if (backupModal.hidden || event.key !== "Tab") return;
  const focusable = [...backupModal.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function closeBackupPreview() {
  pendingBackup = null;
  backupModal.hidden = true;
  document.body.classList.remove("modal-open");
  appShell.inert = false;
  backupFileInput.value = "";
  if (focusBeforeModal?.isConnected) focusBeforeModal.focus();
  focusBeforeModal = null;
}

function openBackupPreview(parsed, fileName) {
  focusBeforeModal = document.activeElement;
  pendingBackup = parsed.repository;
  const { summary } = parsed;
  const exportedAt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(summary.exportedAt));
  backupPreview.innerHTML = `<div class="backup-file"><strong>${escapeHTML(fileName)}</strong><span>Exportado em ${escapeHTML(exportedAt)}</span></div>
    <div class="backup-metrics">
      <div class="metric"><span>Total</span><strong>${summary.total}</strong></div>
      <div class="metric"><span>Em andamento</span><strong>${summary.inProgress}</strong></div>
      <div class="metric"><span>Concluídas</span><strong>${summary.completed}</strong></div>
    </div>
    <div class="notice"><span aria-hidden="true">!</span><div><strong>O histórico atual será substituído</strong>As ${summary.total} sessões validadas deste arquivo substituirão todas as sessões salvas neste navegador. Esta ação não altera o arquivo de backup.</div></div>`;
  backupModal.hidden = false;
  document.body.classList.add("modal-open");
  appShell.inert = true;
  restoreBackupButton.focus();
}

async function inspectBackupFile(file) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    backupFileInput.value = "";
    return showToast("O arquivo excede o limite de 10 MB.", "error");
  }
  try {
    const parsed = parseBackup(await file.text());
    openBackupPreview(parsed, file.name);
  } catch (error) {
    backupFileInput.value = "";
    showToast(error.message || "Não foi possível validar o backup.", "error");
  }
}

function exportCompleteBackup() {
  downloadBackup(sessionService.getRepository());
  showToast("Backup completo exportado.");
}

function restoreCompleteBackup() {
  if (!pendingBackup) return;
  const result = sessionService.restoreRepository(pendingBackup);
  if (!result.ok) return showToast("Não foi possível salvar o backup neste navegador.", "error");
  state = stateManager.replaceState({ ...createInitialState(), theme: sessionService.getTheme() });
  applyTheme();
  closeBackupPreview();
  render();
  screen.scrollTo({ top: 0 });
  showToast("Backup restaurado com segurança.");
  focusScreenHeading();
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
  setMobileMenu(false);
  focusScreenHeading();
}

function advance() {
  const patch = navigation.advance(state, steps.length);
  if (state.currentStep === 7) patch.correctionSourceSignature = correctionPrompt();
  if (state.currentStep === steps.length - 2) patch.finishedAt = state.finishedAt || new Date().toISOString();
  state = stateManager.updateState(patch);
  saveState();
  render();
  screen.scrollTo({ top: 0, behavior: "smooth" });
  focusScreenHeading();
}

function back() {
  const patch = navigation.back(state);
  if (!patch) return;
  state = stateManager.updateState(patch);
  saveState();
  render();
  screen.scrollTo({ top: 0, behavior: "smooth" });
  focusScreenHeading();
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

function getRetryResult() {
  return selectors.getRetryResult(state);
}

function getLearningSummary() {
  return selectors.getLearningSummary(state);
}

viewRenderer = createViewRenderer({
  getState: () => state,
  theoryPrompt,
  introPrompt,
  quizPrompt,
  correctionPrompt,
  flashcardPrompt,
  getQuizResult,
  getRetryResult,
  getLearningSummary,
  wrongQuestions,
});

function parseIntro() {
  try {
    const parsed = validators.parseIntro(state.introRaw);
    if (state.introQuestions.length && !window.confirm("Substituir as perguntas importadas? As respostas e todas as etapas dependentes delas serão apagadas.")) return;
    updateState({
      introQuestions: parsed,
      introAnswers: {},
      introReviewed: {},
      introIndex: 0,
      introSourceTheory: state.theory,
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
      maxStep: Math.min(state.maxStep, 4),
    }, true);
    showToast(`${parsed.length} perguntas importadas.`);
  } catch (error) {
    showToast(error.message || "Não foi possível importar as perguntas.", "error");
  }
}

function parseQuiz() {
  try {
    const questions = validators.parseQuiz(state.quizRaw);
    if (state.quizQuestions.length && !window.confirm("Substituir as questões? As respostas, o resultado e as correções posteriores serão apagados.")) return;
    updateState({
      quizQuestions: questions,
      quizAnswers: {},
      quizRetryAnswers: {},
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
      finishedAt: "",
      maxStep: Math.min(state.maxStep, 6),
    }, true);
    showToast(`${questions.length} questões importadas.`);
  } catch (error) {
    showToast(error.message || "Não foi possível importar as questões.", "error");
  }
}

function parseFlashcards() {
  try {
    const cards = validators.parseFlashcards(state.flashcardsRaw);
    if (state.flashcards.length && !window.confirm("Substituir os flashcards atuais? As edições feitas neles serão perdidas.")) return;
    updateState({ flashcards: cards, flashcardIndex: 0, finishedAt: "", maxStep: Math.min(state.maxStep, 10) }, true);
    showToast(`${cards.length} flashcards importados.`);
  } catch (error) {
    showToast(error.message || "Não foi possível importar os flashcards.", "error");
  }
}

function setItemIndex(kind, index) {
  const patch = navigation.setItemIndex(state, kind, index, wrongQuestions().length);
  if (!patch) return;
  state = stateManager.updateState(patch);
  saveState();
  render();
  screen.scrollTo({ top: 0, behavior: "smooth" });
  screenContent.querySelector(`[data-item-kind="${kind}"][aria-current="true"]`)?.focus({ preventScroll: true });
}


function render() {
  const activeSession = sessionService.getActiveSession();
  const homeView = !activeSession;
  document.body.classList.toggle("home-view", homeView);
  screenActions.innerHTML = "";

  if (homeView) {
    document.body.classList.remove("menu-open");
    stepNav.innerHTML = "";
    screenContent.innerHTML = renderHome(sessionService.listSessions());
    progressLabel.textContent = "Suas sessões de estudo";
    progressBar.style.width = "0%";
    saveStatus.textContent = "Salvo neste navegador";
    sidebarSubject.textContent = "Nenhuma sessão aberta";
    progressTrack.setAttribute("aria-valuenow", "0");
    document.title = "Sessões · Trilha de Estudo";
    const heading = screenContent.querySelector("h1");
    if (heading) heading.id = "screenTitle";
    syncResponsiveNavigation();
    return;
  }

  stepNav.innerHTML = viewRenderer.renderNav();
  screenContent.innerHTML = viewRenderer.renderScreen(state.currentStep);
  const actionRows = screenContent.querySelectorAll(".button-row");
  const primaryActions = actionRows[actionRows.length - 1];
  if (primaryActions) screenActions.appendChild(primaryActions);
  const activeStep = steps[state.currentStep];
  progressLabel.textContent = `${activeStep.phase} · ${activeStep.mode}`;
  const progress = Math.round(((state.currentStep + 1) / steps.length) * 100);
  progressBar.style.width = `${progress}%`;
  progressTrack.setAttribute("aria-valuenow", String(progress));
  progressTrack.setAttribute("aria-valuetext", `${activeStep.phase}, ${activeStep.mode}: ${progress}%`);
  sidebarSubject.textContent = state.subject || "Ainda sem assunto";
  const heading = screenContent.querySelector("h1");
  if (heading) heading.id = "screenTitle";
  document.title = `${activeStep.label} · Trilha de Estudo`;
  syncResponsiveNavigation();
  bindDynamicEvents();
}

function bindDynamicEvents() {
  screen.querySelectorAll("[data-bind]").forEach((el) => {
    el.addEventListener("input", () => {
      const previousValue = state[el.dataset.bind];
      state[el.dataset.bind] = el.value;
      if (previousValue !== el.value && el.dataset.bind === "theory" && state.maxStep > 2) {
        state.maxStep = 2;
        state.finishedAt = "";
      }
      if (previousValue !== el.value && ["subject", "objective"].includes(el.dataset.bind) && state.maxStep > 0) {
        state.maxStep = 0;
        state.finishedAt = "";
      }
      if (previousValue !== el.value && el.dataset.bind === "consolidation" && state.maxStep > 7) {
        state.maxStep = 7;
        state.flashcardsRaw = "";
        state.flashcards = [];
        state.flashcardIndex = 0;
        state.finishedAt = "";
      }
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
    const index = el.dataset.introAnswer;
    if (state.introAnswers[index] !== el.value) {
      state.introReviewed[index] = false;
      if (state.maxStep > 4) state.maxStep = 4;
      state.finishedAt = "";
      const reviewButton = screen.querySelector("[data-review-intro-button]");
      if (reviewButton) {
        reviewButton.textContent = "Comparar com a resposta-modelo";
        reviewButton.disabled = !el.value.trim();
      }
      screen.querySelector("[data-model-answer]")?.remove();
    }
    state.introAnswers[index] = el.value;
    saveState();
    updateContinueAvailability();
  }));
  screen.querySelectorAll("[data-quiz-answer]").forEach((el) => el.addEventListener("change", () => {
    const index = el.dataset.quizAnswer;
    const changingFinishedQuiz = state.quizFinished && state.quizAnswers[index] !== el.value;
    if (changingFinishedQuiz && !window.confirm("Alterar uma resposta inicial apagará a devolutiva, as correções, as novas tentativas e os flashcards desta sessão. Continuar?")) {
      render();
      return;
    }
    state.quizAnswers[index] = el.value;
    if (changingFinishedQuiz) {
      state.quizFinished = false;
      state.quizRetryAnswers = {};
      state.consolidation = "";
      state.correctionSourceSignature = "";
      state.errorReflections = {};
      state.errorIndex = 0;
      state.flashcardsRaw = "";
      state.flashcards = [];
      state.flashcardIndex = 0;
      state.finishedAt = "";
      state.maxStep = Math.min(state.maxStep, 6);
      showToast("Etapas dependentes foram reiniciadas.");
    }
    saveState();
    updateContinueAvailability();
  }));
  screen.querySelectorAll("[data-retry-answer]").forEach((el) => el.addEventListener("change", () => {
    state.quizRetryAnswers[el.dataset.retryAnswer] = el.value;
    if (state.maxStep > 8) {
      state.maxStep = 8;
      state.flashcardsRaw = "";
      state.flashcards = [];
      state.flashcardIndex = 0;
      state.finishedAt = "";
    }
    saveState();
    render();
    screen.querySelector(`[data-retry-answer="${el.dataset.retryAnswer}"][value="${el.value}"]`)?.focus({ preventScroll: true });
  }));
  screen.querySelectorAll("[data-error-reflection]").forEach((el) => el.addEventListener("input", () => {
    state.errorReflections[el.dataset.errorReflection] = el.value;
    if (state.maxStep > 8) {
      state.maxStep = 8;
      state.flashcardsRaw = "";
      state.flashcards = [];
      state.flashcardIndex = 0;
      state.finishedAt = "";
    }
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
  if (state.currentStep === 4) button.disabled = !state.introQuestions.length || !state.introQuestions.every((_, i) => (state.introAnswers[i] || "").trim() && state.introReviewed?.[i]);
  if (state.currentStep === 6) button.disabled = !state.quizQuestions.length || !state.quizQuestions.every((_, i) => state.quizAnswers[i]);
  if (state.currentStep === 7) button.disabled = state.consolidation.trim().length < 50;
  if (state.currentStep === 8) button.disabled = wrongQuestions().some(({ index }) => (state.errorReflections[index] || "").trim().length < 20 || !state.quizRetryAnswers?.[index]);
  if (state.currentStep === 10) button.disabled = !state.flashcards.length || state.flashcards.some((card) => !card.front.trim() || !card.back.trim());
}

function finishQuiz() {
  if (!state.quizQuestions.every((_, i) => state.quizAnswers[i])) return;
  state.quizFinished = true;
  state.quizRetryAnswers = {};
  advance();
}

function reviewIntroAnswer() {
  const index = state.introIndex;
  if (!(state.introAnswers[index] || "").trim()) return;
  state.introReviewed[index] = true;
  saveState();
  render();
}

function exportSession(format) {
  const session = sessionService.getActiveSession();
  if (format === "json") downloadSessionJSON(state, session);
  else downloadSessionText(state);
  showToast(`Sessão exportada em ${format === "json" ? "JSON" : "TXT"}.`);
}

function loadDemo() {
  const demoState = createDemoState(sessionService.getTheme());
  if (sessionService.getActiveSession()) {
    state = stateManager.replaceState(demoState);
    saveState();
  } else {
    const created = sessionService.createSession(demoState, { title: "Demonstração · Ondulatória" });
    state = stateManager.replaceState(created.state);
  }
  applyTheme();
  render();
  showToast("Demonstração carregada. Percorra as etapas no seu ritmo.");
  focusScreenHeading();
}

function resetSession() {
  if (!sessionService.getActiveSession()) return createNewSession();
  if (!window.confirm("Deseja apagar a sessão salva neste navegador e recomeçar?")) return;
  state = stateManager.replaceState(sessionService.restartActiveSession());
  applyTheme();
  render();
  showToast("Nova sessão iniciada.");
  focusScreenHeading();
}

function handleSessionAction(action, id) {
  const session = sessionService.findSession(id);
  if (!session) return showToast("A sessão não foi encontrada.");

  if (action === "open") return openSession(id);
  if (action === "rename") {
    const title = window.prompt("Novo nome para a sessão:", sessionName(session));
    if (title === null) return;
    const result = sessionService.renameSession(id, title);
    showToast(result.ok ? "Sessão renomeada." : "Digite um nome válido.");
  }
  if (action === "duplicate") {
    sessionService.duplicateSession(id);
    showToast("Sessão duplicada.");
  }
  if (action === "delete") {
    const name = sessionName(session);
    if (!window.confirm(`Excluir permanentemente a sessão "${name}"?`)) return;
    sessionService.deleteSession(id);
    showToast("Sessão excluída.");
  }
  render();
}

document.addEventListener("click", (event) => {
  const backupClose = event.target.closest("[data-backup-close]");
  if (backupClose) return closeBackupPreview();

  const homeAction = event.target.closest("[data-home-action]");
  if (homeAction) {
    if (homeAction.dataset.homeAction === "new") return createNewSession();
    if (homeAction.dataset.homeAction === "demo") return loadDemo();
    if (homeAction.dataset.homeAction === "export-backup") return exportCompleteBackup();
    if (homeAction.dataset.homeAction === "import-backup") return backupFileInput.click();
  }

  const sessionAction = event.target.closest("[data-session-action]");
  if (sessionAction) return handleSessionAction(sessionAction.dataset.sessionAction, sessionAction.dataset.sessionId);

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
    if (action === "review-intro") reviewIntroAnswer();
    if (action === "parse-quiz") parseQuiz();
    if (action === "finish-quiz") finishQuiz();
    if (action === "parse-flashcards") parseFlashcards();
    if (action === "add-card") {
      state.flashcards.push({ front: "", back: "", tags: [] });
      state.flashcardIndex = state.flashcards.length - 1;
      saveState();
      render();
    }
    if (action === "export" || action === "export-text") exportSession("text");
    if (action === "export-json") exportSession("json");
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

menuButton.addEventListener("click", () => setMobileMenu(!document.body.classList.contains("menu-open"), { returnFocus: document.body.classList.contains("menu-open") }));
menuBackdrop.addEventListener("click", () => setMobileMenu(false, { returnFocus: true }));
mobileViewport.addEventListener?.("change", syncResponsiveNavigation);
homeButton.addEventListener("click", leaveCurrentSession);
themeButton.addEventListener("click", toggleTheme);
backupFileInput.addEventListener("change", () => inspectBackupFile(backupFileInput.files[0]));
restoreBackupButton.addEventListener("click", restoreCompleteBackup);
document.addEventListener("keydown", (event) => {
  trapModalFocus(event);
  if (event.key !== "Escape") return;
  if (!backupModal.hidden) return closeBackupPreview();
  if (document.body.classList.contains("menu-open")) setMobileMenu(false, { returnFocus: true });
});
document.querySelector("#demoButton").addEventListener("click", () => {
  if (!sessionService.getActiveSession() || !state.subject || window.confirm("A demonstração substituirá somente a sessão atual. Continuar?")) loadDemo();
});
document.querySelector("#resetButton").addEventListener("click", resetSession);

render();
