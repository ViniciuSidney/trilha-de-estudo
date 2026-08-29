const { steps, STEP_INDEX, createInitialState } = window.TrilhaApp.config;
const { createStateManager } = window.TrilhaApp.state;
const { createSessionService } = window.TrilhaApp.sessions;
const { buildTopicPlanPrompt, buildTheoryPrompt, buildIntroPrompt, buildQuizPrompt, buildCorrectionPrompt, buildFlashcardPrompt } = window.TrilhaApp.prompts;
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
let actionDialogState = null;

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
const actionModal = document.querySelector("#actionModal");
const actionModalPanel = actionModal.querySelector(".action-modal-panel");
const actionModalEyebrow = document.querySelector("#actionModalEyebrow");
const actionModalTitle = document.querySelector("#actionModalTitle");
const actionModalMessage = document.querySelector("#actionModalMessage");
const actionModalIcon = document.querySelector("#actionModalIcon");
const actionModalField = document.querySelector("#actionModalField");
const actionModalInputLabel = document.querySelector("#actionModalInputLabel");
const actionModalInput = document.querySelector("#actionModalInput");
const actionModalHint = document.querySelector("#actionModalHint");
const actionModalCancel = document.querySelector("#actionModalCancel");
const actionModalConfirm = document.querySelector("#actionModalConfirm");
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
  const activeModal = [backupModal, actionModal].find((modal) => !modal.hidden);
  if (!activeModal || event.key !== "Tab") return;
  const focusable = [...activeModal.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')]
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

function openActionDialog({
  eyebrow = "Confirmação",
  title = "Confirmar ação",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "warning",
  icon = "!",
  input = null,
}) {
  if (actionDialogState) return Promise.resolve(input ? null : false);
  focusBeforeModal = document.activeElement;
  actionModalEyebrow.textContent = eyebrow;
  actionModalTitle.textContent = title;
  actionModalMessage.textContent = message;
  actionModalIcon.textContent = icon;
  actionModalConfirm.textContent = confirmLabel;
  actionModalCancel.textContent = cancelLabel;
  actionModalPanel.dataset.tone = tone;
  actionModalField.hidden = !input;
  actionModalInput.value = input?.value || "";
  actionModalInputLabel.textContent = input?.label || "Novo valor";
  actionModalHint.textContent = input?.hint || "";
  actionModalConfirm.disabled = Boolean(input && !actionModalInput.value.trim());
  actionModal.hidden = false;
  document.body.classList.add("modal-open");
  appShell.inert = true;

  return new Promise((resolve) => {
    actionDialogState = { resolve, hasInput: Boolean(input) };
    (input ? actionModalInput : actionModalConfirm).focus();
    if (input) actionModalInput.select();
  });
}

function closeActionDialog(confirmed = false) {
  if (!actionDialogState) return;
  const { resolve, hasInput } = actionDialogState;
  const value = confirmed ? (hasInput ? actionModalInput.value.trim() : true) : (hasInput ? null : false);
  actionDialogState = null;
  actionModal.hidden = true;
  document.body.classList.remove("modal-open");
  appShell.inert = false;
  resolve(value);
  if (focusBeforeModal?.isConnected) focusBeforeModal.focus();
  focusBeforeModal = null;
}

function confirmAction(options) {
  return openActionDialog(options);
}

function requestText(options) {
  return openActionDialog({ ...options, input: options.input || {} });
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
  if (state.currentStep === STEP_INDEX["correction-build"]) patch.correctionSourceSignature = correctionPrompt();
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

function topicPlanPrompt() {
  return buildTopicPlanPrompt(state);
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
  topicPlanPrompt,
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

function resetAfterTopics() {
  return {
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

function invalidateTopicDependents() {
  Object.assign(state, resetAfterTopics());
  state.maxStep = Math.min(state.maxStep, STEP_INDEX["topics-review"]);
}

async function parseTopics() {
  try {
    const topics = validators.parseTopics(state.topicsRaw);
    if (state.topics.length && !await confirmAction({
      eyebrow: "Planejamento",
      title: "Substituir os tópicos atuais?",
      message: "O panorama, as respostas, as questões, as correções e os flashcards dependentes serão reiniciados.",
      confirmLabel: "Substituir tópicos",
      tone: "warning",
    })) return;
    updateState({
      topics,
      topicIndex: 0,
      topicPlanSourceSignature: topicPlanPrompt(),
      ...resetAfterTopics(),
      maxStep: Math.min(state.maxStep, STEP_INDEX["topics-review"]),
    }, true);
    showToast(`${topics.length} tópicos importados.`);
  } catch (error) {
    showToast(error.message || "Não foi possível importar os tópicos.", "error");
  }
}

async function parseIntro() {
  try {
    const parsed = validators.parseIntro(state.introRaw);
    if (state.introQuestions.length && !await confirmAction({
      eyebrow: "Perguntas iniciais",
      title: "Substituir perguntas importadas?",
      message: "As respostas, comparações e todas as etapas que dependem destas perguntas serão reiniciadas.",
      confirmLabel: "Substituir perguntas",
      tone: "warning",
    })) return;
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
      maxStep: Math.min(state.maxStep, STEP_INDEX["intro-answer"]),
    }, true);
    showToast(`${parsed.length} perguntas importadas.`);
  } catch (error) {
    showToast(error.message || "Não foi possível importar as perguntas.", "error");
  }
}

async function parseQuiz() {
  try {
    const questions = validators.parseQuiz(state.quizRaw);
    if (state.quizQuestions.length && !await confirmAction({
      eyebrow: "Questões objetivas",
      title: "Substituir questões atuais?",
      message: "As respostas, o resultado inicial, a devolutiva, as correções e os flashcards dependentes serão reiniciados.",
      confirmLabel: "Substituir questões",
      tone: "warning",
    })) return;
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
      maxStep: Math.min(state.maxStep, STEP_INDEX["quiz-answer"]),
    }, true);
    showToast(`${questions.length} questões importadas.`);
  } catch (error) {
    showToast(error.message || "Não foi possível importar as questões.", "error");
  }
}

async function parseFlashcards() {
  try {
    const cards = validators.parseFlashcards(state.flashcardsRaw);
    if (state.flashcards.length && !await confirmAction({
      eyebrow: "Flashcards",
      title: "Substituir flashcards atuais?",
      message: "As edições realizadas nos cartões atuais serão descartadas e substituídas pelo novo conjunto importado.",
      confirmLabel: "Substituir cartões",
      tone: "warning",
    })) return;
    updateState({ flashcards: cards, flashcardIndex: 0, finishedAt: "", maxStep: Math.min(state.maxStep, STEP_INDEX["flashcards-review"]) }, true);
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
      if (previousValue !== el.value && el.dataset.bind === "theory" && state.maxStep > STEP_INDEX["theory-read"]) {
        state.maxStep = STEP_INDEX["theory-read"];
        state.finishedAt = "";
      }
      if (previousValue !== el.value && ["subjectArea", "studyTheme", "subject", "objective"].includes(el.dataset.bind) && state.maxStep > 0) {
        state.maxStep = 0;
        state.finishedAt = "";
      }
      if (previousValue !== el.value && el.dataset.bind === "consolidation" && state.maxStep > STEP_INDEX["correction-build"]) {
        state.maxStep = STEP_INDEX["correction-build"];
        state.flashcardsRaw = "";
        state.flashcards = [];
        state.flashcardIndex = 0;
        state.finishedAt = "";
      }
      if (el.dataset.bind === "subject") sidebarSubject.textContent = el.value || "Ainda sem assunto";
      saveState();
      if (["subjectArea", "studyTheme", "subject"].includes(el.dataset.bind)) {
        const next = screenActions.querySelector('[data-action="advance"]');
        if (next) next.disabled = !state.subjectArea.trim() || !state.studyTheme.trim() || !state.subject.trim();
      }
      updateContinueAvailability();
    });
  });

  screen.querySelectorAll("[data-topic-title]").forEach((el) => el.addEventListener("input", () => {
    const topic = state.topics[Number(el.dataset.topicTitle)];
    if (!topic) return;
    if (topic.title !== el.value) invalidateTopicDependents();
    topic.title = el.value;
    saveState();
    updateContinueAvailability();
  }));
  screen.querySelectorAll("[data-topic-objective]").forEach((el) => el.addEventListener("input", () => {
    const topic = state.topics[Number(el.dataset.topicObjective)];
    if (!topic) return;
    if (topic.objective !== el.value) invalidateTopicDependents();
    topic.objective = el.value;
    saveState();
    updateContinueAvailability();
  }));

  screen.querySelectorAll("[data-intro-answer]").forEach((el) => el.addEventListener("input", () => {
    const index = el.dataset.introAnswer;
    if (state.introAnswers[index] !== el.value) {
      state.introReviewed[index] = false;
      if (state.maxStep > STEP_INDEX["intro-answer"]) state.maxStep = STEP_INDEX["intro-answer"];
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
  screen.querySelectorAll("[data-quiz-answer]").forEach((el) => el.addEventListener("change", async () => {
    const index = el.dataset.quizAnswer;
    const changingFinishedQuiz = state.quizFinished && state.quizAnswers[index] !== el.value;
    if (changingFinishedQuiz && !await confirmAction({
      eyebrow: "Resultado já calculado",
      title: "Alterar a resposta inicial?",
      message: "Para manter o resultado consistente, a devolutiva, as correções, as novas tentativas e os flashcards desta sessão serão reiniciados.",
      confirmLabel: "Alterar e reiniciar",
      tone: "warning",
    })) {
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
      state.maxStep = Math.min(state.maxStep, STEP_INDEX["quiz-answer"]);
      showToast("Etapas dependentes foram reiniciadas.");
    }
    saveState();
    updateContinueAvailability();
  }));
  screen.querySelectorAll("[data-retry-answer]").forEach((el) => el.addEventListener("change", () => {
    state.quizRetryAnswers[el.dataset.retryAnswer] = el.value;
    if (state.maxStep > STEP_INDEX["correction-result"]) {
      state.maxStep = STEP_INDEX["correction-result"];
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
    if (state.maxStep > STEP_INDEX["correction-result"]) {
      state.maxStep = STEP_INDEX["correction-result"];
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
  if (state.currentStep === STEP_INDEX.subject) button.disabled = !state.subjectArea.trim() || !state.studyTheme.trim() || !state.subject.trim();
  if (state.currentStep === STEP_INDEX["topics-review"]) button.disabled = !state.topics.length || state.topics.some((topic) => !topic.title.trim() || !topic.objective.trim());
  if (state.currentStep === STEP_INDEX["theory-build"]) button.disabled = state.theory.trim().length < 80;
  if (state.currentStep === STEP_INDEX["intro-answer"]) button.disabled = !state.introQuestions.length || !state.introQuestions.every((_, i) => (state.introAnswers[i] || "").trim() && state.introReviewed?.[i]);
  if (state.currentStep === STEP_INDEX["quiz-answer"]) button.disabled = !state.quizQuestions.length || !state.quizQuestions.every((_, i) => state.quizAnswers[i]);
  if (state.currentStep === STEP_INDEX["correction-build"]) button.disabled = state.consolidation.trim().length < 50;
  if (state.currentStep === STEP_INDEX["correction-result"]) button.disabled = wrongQuestions().some(({ index }) => (state.errorReflections[index] || "").trim().length < 20 || !state.quizRetryAnswers?.[index]);
  if (state.currentStep === STEP_INDEX["flashcards-review"]) button.disabled = !state.flashcards.length || state.flashcards.some((card) => !card.front.trim() || !card.back.trim());
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

async function resetSession() {
  if (!sessionService.getActiveSession()) return createNewSession();
  if (!await confirmAction({
    eyebrow: "Recomeçar sessão",
    title: "Apagar o progresso desta sessão?",
    message: "Todo o conteúdo desta sessão será removido e ela voltará à definição do assunto. Esta ação não afeta as outras sessões.",
    confirmLabel: "Apagar e recomeçar",
    tone: "danger",
    icon: "×",
  })) return;
  state = stateManager.replaceState(sessionService.restartActiveSession());
  applyTheme();
  render();
  showToast("Nova sessão iniciada.");
  focusScreenHeading();
}

async function handleSessionAction(action, id) {
  const session = sessionService.findSession(id);
  if (!session) return showToast("A sessão não foi encontrada.");

  if (action === "open") return openSession(id);
  if (action === "rename") {
    const title = await requestText({
      eyebrow: "Organização",
      title: "Renomear sessão",
      message: "Escolha um nome curto que facilite encontrar este estudo no histórico.",
      confirmLabel: "Salvar nome",
      tone: "default",
      icon: "✎",
      input: {
        label: "Nome da sessão",
        value: sessionName(session),
        hint: "Até 90 caracteres.",
      },
    });
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
    if (!await confirmAction({
      eyebrow: "Excluir sessão",
      title: "Excluir esta sessão permanentemente?",
      message: `“${name}” e todo o seu conteúdo serão removidos deste navegador. Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir sessão",
      tone: "danger",
      icon: "×",
    })) return;
    sessionService.deleteSession(id);
    showToast("Sessão excluída.");
  }
  render();
}

document.addEventListener("click", (event) => {
  const dialogCancel = event.target.closest("[data-dialog-cancel]");
  if (dialogCancel) return closeActionDialog(false);

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

  const topicMove = event.target.closest("[data-topic-move]");
  if (topicMove && !topicMove.disabled) {
    const from = Number(topicMove.dataset.topicIndex);
    const to = topicMove.dataset.topicMove === "up" ? from - 1 : from + 1;
    if (to >= 0 && to < state.topics.length) {
      [state.topics[from], state.topics[to]] = [state.topics[to], state.topics[from]];
      invalidateTopicDependents();
      saveState();
      render();
      screen.querySelector(`[data-topic-index="${to}"][data-topic-move="${topicMove.dataset.topicMove}"]`)?.focus();
    }
    return;
  }

  const topicRemove = event.target.closest("[data-remove-topic]");
  if (topicRemove) {
    if (state.topics.length <= 2) return showToast("A trilha precisa manter pelo menos dois tópicos.", "error");
    state.topics.splice(Number(topicRemove.dataset.removeTopic), 1);
    invalidateTopicDependents();
    saveState();
    render();
    return showToast("Tópico removido.");
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    const action = actionButton.dataset.action;
    if (action === "advance") advance();
    if (action === "back") back();
    if (action === "parse-topics") parseTopics();
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
    if (action === "add-topic") {
      if (state.topics.length >= 10) return showToast("O limite é de 10 tópicos.", "error");
      state.topics.push({ id: `topic-${Date.now()}`, title: "", objective: "" });
      invalidateTopicDependents();
      saveState();
      render();
      screen.querySelector(`[data-topic-title="${state.topics.length - 1}"]`)?.focus();
    }
    if (action === "export" || action === "export-text") exportSession("text");
    if (action === "export-json") exportSession("json");
    if (action === "print") window.print();
  }

  const copyButton = event.target.closest("[data-copy]");
  if (copyButton) {
    const prompts = { topics: topicPlanPrompt, theory: theoryPrompt, intro: introPrompt, quiz: quizPrompt, correction: correctionPrompt, flashcards: flashcardPrompt };
    copyText(prompts[copyButton.dataset.copy]());
  }

  const removeButton = event.target.closest("[data-remove-card]");
  if (removeButton) {
    state.flashcards.splice(Number(removeButton.dataset.removeCard), 1);
    if (!state.flashcards.length) {
      state.flashcardIndex = 0;
      state.currentStep = STEP_INDEX["flashcards-build"];
      state.maxStep = Math.min(state.maxStep, STEP_INDEX["flashcards-build"]);
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
actionModalConfirm.addEventListener("click", () => closeActionDialog(true));
actionModalInput.addEventListener("input", () => {
  actionModalConfirm.disabled = !actionModalInput.value.trim();
});
actionModalInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !actionModalConfirm.disabled) {
    event.preventDefault();
    closeActionDialog(true);
  }
});
document.addEventListener("keydown", (event) => {
  trapModalFocus(event);
  if (event.key !== "Escape") return;
  if (!actionModal.hidden) return closeActionDialog(false);
  if (!backupModal.hidden) return closeBackupPreview();
  if (document.body.classList.contains("menu-open")) setMobileMenu(false, { returnFocus: true });
});
document.querySelector("#demoButton").addEventListener("click", async () => {
  if (!sessionService.getActiveSession() || !state.subject || await confirmAction({
    eyebrow: "Demonstração",
    title: "Carregar a sessão demonstrativa?",
    message: "O conteúdo da sessão atual será substituído pelo exemplo completo de Ondulatória. Suas outras sessões permanecerão intactas.",
    confirmLabel: "Carregar demonstração",
    tone: "warning",
  })) loadDemo();
});
document.querySelector("#resetButton").addEventListener("click", resetSession);

render();
