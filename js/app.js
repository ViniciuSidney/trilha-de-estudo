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

const initialState = {
  currentStep: 0,
  maxStep: 0,
  theme: window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light",
  startedAt: new Date().toISOString(),
  subject: "",
  objective: "",
  theory: "",
  introRaw: "",
  introQuestions: [],
  introSourceTheory: "",
  introAnswers: {},
  introIndex: 0,
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
};

let state = loadState();
let toastTimer;

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

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...initialState, ...saved } : structuredClone(initialState);
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  saveStatus.textContent = "Salvando…";
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.setTimeout(() => (saveStatus.textContent = "Tudo salvo"), 220);
}

function updateState(patch, renderAfter = false) {
  state = { ...state, ...patch };
  saveState();
  if (renderAfter) render();
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMarkdown(value = "") {
  const safe = escapeHTML(value.trim());
  if (!safe) return '<p class="empty">Nenhum conteúdo foi adicionado.</p>';
  return safe
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^[-•] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .split(/\n{2,}/)
    .map((block) => (/^<(h\d|ul)/.test(block) ? block : `<p>${block.replaceAll("\n", "<br>")}</p>`))
    .join("");
}

function stripCodeFence(raw = "") {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
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
  if (index < 0 || index >= steps.length || index > state.maxStep) return;
  state.currentStep = index;
  saveState();
  render();
  screen.scrollTo({ top: 0, behavior: "smooth" });
  document.body.classList.remove("menu-open");
}

function advance() {
  if (state.currentStep === 7) state.correctionSourceSignature = correctionPrompt();
  const next = Math.min(state.currentStep + 1, steps.length - 1);
  state.currentStep = next;
  state.maxStep = Math.max(state.maxStep, next);
  saveState();
  render();
  screen.scrollTo({ top: 0, behavior: "smooth" });
}

function back() {
  if (state.currentStep > 0) {
    state.currentStep -= 1;
    saveState();
    render();
    screen.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function buttonRow({ nextLabel = "Continuar", nextDisabled = false, nextAction = "advance", hideBack = false, backLabel = "Voltar" } = {}) {
  return `
    <div class="button-row">
      <div>${hideBack ? "" : `<button class="button ghost" type="button" data-action="back">← ${backLabel}</button>`}</div>
      <button class="button" type="button" data-action="${nextAction}" ${nextDisabled ? "disabled" : ""}>${nextLabel} →</button>
    </div>`;
}

function theoryPrompt() {
  return `Quero estudar o assunto: "${state.subject || "[ASSUNTO]"}".

Objetivo ou contexto do estudo: ${state.objective || "compreender o assunto com clareza e construir uma base sólida"}.

Crie uma base teórica didática, correta e progressiva em português do Brasil. Considere que estou aprendendo o assunto agora. Organize a resposta em Markdown e siga esta estrutura:
1. visão geral curta;
2. conceitos fundamentais em ordem lógica;
3. relações entre os conceitos;
4. exemplos simples e concretos;
5. erros ou confusões comuns;
6. síntese final em até 6 tópicos.

Priorize compreensão real. Não crie exercícios ainda e não use linguagem desnecessariamente sofisticada.`;
}

function introPrompt() {
  return `Com base no conteúdo teórico abaixo sobre "${state.subject}", crie 4 perguntas introdutórias discursivas em ordem crescente de dificuldade. Elas devem verificar compreensão, não memorização mecânica.

CONTEÚDO:
${state.theory}

Responda SOMENTE com JSON válido, sem bloco de código e sem comentários, neste formato:
[
  {"question":"pergunta clara","modelAnswer":"resposta esperada curta"}
]`;
}

function quizPrompt() {
  const introContext = state.introQuestions.map((q, i) => `P${i + 1}: ${q.question}\nResposta do aluno: ${state.introAnswers[i] || "não respondida"}`).join("\n\n");
  return `Crie 5 questões objetivas sobre "${state.subject}", com quatro alternativas cada e somente uma correta. Misture compreensão conceitual, aplicação e uma pegadinha justa. Use a base teórica e as respostas introdutórias do aluno como contexto.

BASE TEÓRICA:
${state.theory}

RESPOSTAS INTRODUTÓRIAS:
${introContext}

Responda SOMENTE com JSON válido, sem bloco de código e sem comentários, neste formato exato:
{"questions":[{"id":1,"statement":"enunciado","options":{"A":"alternativa","B":"alternativa","C":"alternativa","D":"alternativa"},"answer":"A","explanation":"justificativa curta da resposta correta"}]}`;
}

function correctionPrompt() {
  const result = getQuizResult();
  const details = state.quizQuestions.map((q, i) => {
    const chosen = state.quizAnswers[i] || "não respondida";
    return `Questão ${i + 1}: ${q.statement}\nResposta do aluno: ${chosen}) ${q.options?.[chosen] || "—"}\nGabarito: ${q.answer}) ${q.options?.[q.answer] || "—"}\nJustificativa original: ${q.explanation || "—"}`;
  }).join("\n\n");
  return `Atue como um tutor cuidadoso. Analise meu desempenho no estudo de "${state.subject}".

RESULTADO: ${result.correct}/${result.total} acertos (${result.percentage}%).

RESPOSTAS:
${details}

Faça uma devolutiva em Markdown com:
1. diagnóstico objetivo do desempenho;
2. correção detalhada apenas das questões erradas ou não respondidas;
3. conceitos que precisam ser consolidados;
4. relações importantes que eu talvez não tenha percebido;
5. três pontos de atenção para uma próxima revisão;
6. uma conclusão curta e encorajadora.

Não invente dificuldades que os dados não demonstram e explique os erros sem tom punitivo.`;
}

function flashcardPrompt() {
  const reflections = Object.entries(state.errorReflections).map(([i, text]) => `Erro ${Number(i) + 1}: ${text}`).join("\n");
  return `Crie flashcards para revisar a sessão sobre "${state.subject}".

BASE TEÓRICA:
${state.theory}

DEVOLUTIVA DA CORREÇÃO:
${state.consolidation}

CORREÇÕES ATIVAS ESCRITAS PELO ALUNO:
${reflections || "nenhuma correção registrada"}

Crie entre 6 e 10 cartões curtos. Priorize os conceitos fundamentais e os erros demonstrados pelo aluno. Evite perguntas ambíguas e respostas longas.

Responda SOMENTE com JSON válido, sem bloco de código e sem comentários, neste formato:
{"cards":[{"front":"pergunta","back":"resposta","tags":["assunto","revisão"]}]}`;
}

function parseIntro() {
  if (state.introQuestions.length && !window.confirm("Substituir as perguntas importadas? As respostas e todas as etapas dependentes delas serão apagadas.")) return;
  try {
    const parsed = JSON.parse(stripCodeFence(state.introRaw));
    if (!Array.isArray(parsed) || !parsed.length || parsed.some((item) => !item.question)) throw new Error();
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
  } catch {
    showToast("Formato inválido. Confira o JSON solicitado no prompt.");
  }
}

function parseQuiz() {
  if (state.quizQuestions.length && !window.confirm("Substituir as questões? As respostas, o resultado e as correções posteriores serão apagados.")) return;
  try {
    const parsed = JSON.parse(stripCodeFence(state.quizRaw));
    const questions = parsed.questions;
    if (!Array.isArray(questions) || !questions.length || questions.some((q) => !q.statement || !q.options || !q.answer)) throw new Error();
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
  } catch {
    showToast("Formato inválido. Confira o JSON solicitado no prompt.");
  }
}

function parseFlashcards() {
  if (state.flashcards.length && !window.confirm("Substituir os flashcards atuais? As edições feitas neles serão perdidas.")) return;
  try {
    const parsed = JSON.parse(stripCodeFence(state.flashcardsRaw));
    const cards = parsed.cards;
    if (!Array.isArray(cards) || !cards.length || cards.some((card) => !card.front || !card.back)) throw new Error();
    updateState({ flashcards: cards, flashcardIndex: 0, maxStep: Math.min(state.maxStep, 10) }, true);
    showToast(`${cards.length} flashcards importados.`);
  } catch {
    showToast("Formato inválido. Confira o JSON solicitado no prompt.");
  }
}

function getQuizResult() {
  const total = state.quizQuestions.length;
  const correct = state.quizQuestions.reduce((sum, q, i) => sum + (state.quizAnswers[i] === q.answer ? 1 : 0), 0);
  return { total, correct, wrong: total - correct, percentage: total ? Math.round((correct / total) * 100) : 0 };
}

function wrongQuestions() {
  return state.quizQuestions.map((q, i) => ({ q, index: i })).filter(({ q, index }) => state.quizAnswers[index] !== q.answer);
}

function renderItemDots(kind, count, current, answered = () => false) {
  return `<div class="item-dots" aria-label="Navegação dos itens">${Array.from({ length: count }, (_, i) => `
    <button class="item-dot ${i === current ? "active" : ""} ${answered(i) ? "answered" : ""}" type="button" data-item-kind="${kind}" data-item-index="${i}" aria-label="Abrir item ${i + 1}">${i + 1}</button>
  `).join("")}</div>`;
}

function setItemIndex(kind, index) {
  const keys = { intro: "introIndex", quiz: "quizIndex", error: "errorIndex", flashcard: "flashcardIndex" };
  const lengths = {
    intro: state.introQuestions.length,
    quiz: state.quizQuestions.length,
    error: wrongQuestions().length,
    flashcard: state.flashcards.length,
  };
  const key = keys[kind];
  if (!key || !lengths[kind]) return;
  state[key] = Math.max(0, Math.min(index, lengths[kind] - 1));
  saveState();
  render();
  screen.scrollTo({ top: 0, behavior: "smooth" });
}

function renderSubject() {
  return `
    <span class="eyebrow">Comece por aqui</span>
    <h1>O que você quer compreender hoje?</h1>
    <p class="lead">Defina um assunto específico. A trilha usará essa escolha para preparar cada prompt e manter o estudo em uma sequência lógica.</p>
    <div class="split">
      <div class="card">
        <div class="field">
          <label for="subject">Assunto de estudo</label>
          <input id="subject" class="subject-input" data-bind="subject" value="${escapeHTML(state.subject)}" placeholder="Ex.: Ondulatória — frequência, período e velocidade" autofocus />
          <span class="hint">Quanto mais específico, mais útil será a sessão.</span>
        </div>
        <div class="field">
          <label for="objective">Objetivo ou contexto <span class="hint">(opcional)</span></label>
          <textarea id="objective" data-bind="objective" placeholder="Ex.: preparar-me para uma prova e entender como aplicar as fórmulas.">${escapeHTML(state.objective)}</textarea>
        </div>
      </div>
      <aside class="card blue">
        <h2>Como funcionará</h2>
        <p class="hint">Você continuará usando a IA de sua preferência, mas o site organizará o caminho.</p>
        <ul class="mini-list">
          <li>Prompts prontos para cada momento</li>
          <li>Leitura e respostas em um só percurso</li>
          <li>Resultado e revisão dos erros</li>
          <li>Flashcards e registro final da sessão</li>
        </ul>
      </aside>
    </div>
    ${buttonRow({ hideBack: true, nextDisabled: !state.subject.trim(), nextLabel: "Criar minha trilha" })}`;
}

function renderTheoryBuild() {
  const hasDependentContent = state.introQuestions.length && state.introSourceTheory !== state.theory;
  return `
    <span class="eyebrow">Base teórica</span>
    <h1>Construa primeiro um bom alicerce.</h1>
    <p class="lead">Copie o prompt, envie à IA de sua preferência e cole abaixo a resposta completa.</p>
    ${hasDependentContent ? '<div class="notice"><span>!</span><div><strong>A base foi alterada</strong>As perguntas já importadas podem não representar mais este conteúdo. A etapa seguinte pedirá uma nova importação.</div></div>' : ""}
    <div class="prepare-grid">
    <div class="card">
      <div class="field">
        <label for="theoryPrompt">Prompt preparado</label>
        <textarea id="theoryPrompt" class="prompt-box" readonly>${escapeHTML(theoryPrompt())}</textarea>
      </div>
      <div class="button-group copy-row">
        <button class="button secondary compact" type="button" data-copy="theory">Copiar prompt</button>
      </div>
    </div>
    <div class="card soft">
      <div class="field">
        <label for="theory">Resposta da IA</label>
        <textarea id="theory" class="paste-box" data-bind="theory" placeholder="Cole aqui a base teórica recebida…">${escapeHTML(state.theory)}</textarea>
        <span class="hint">Aceita títulos, listas e negritos simples em Markdown.</span>
      </div>
    </div></div>
    ${buttonRow({ nextDisabled: state.theory.trim().length < 80, nextLabel: "Ir para a leitura" })}`;
}

function renderReading() {
  return `
    <span class="eyebrow">Leitura guiada</span>
    <h1>Agora, apenas leia com calma.</h1>
    <p class="lead">Esta etapa separa o consumo do conteúdo das atividades. Marque o avanço somente quando sentir que entendeu a estrutura geral.</p>
    <article class="reading">${renderMarkdown(state.theory)}</article>
    ${buttonRow({ nextLabel: "Concluí a leitura", backLabel: "Voltar à preparação" })}`;
}

function renderIntroPrepare() {
  const outdated = state.introQuestions.length && state.introSourceTheory !== state.theory;
  return `
    <span class="eyebrow">Perguntas iniciais · Preparação</span>
    <h1>Prepare as perguntas, sem respondê-las ainda.</h1>
    <p class="lead">Esta tela existe somente para o copia e cola com a IA. Depois da importação, a próxima tela mostrará apenas as perguntas.</p>
    ${outdated ? '<div class="notice"><span>!</span><div><strong>Conteúdo possivelmente desatualizado</strong>A base teórica mudou depois desta importação. Gere e importe novas perguntas antes de continuar.</div></div>' : ""}
    <div class="prepare-grid">
    <div class="card">
      <div class="field"><label>Prompt das perguntas introdutórias</label><textarea class="prompt-box" readonly>${escapeHTML(introPrompt())}</textarea></div>
      <div class="button-group copy-row"><button class="button secondary compact" type="button" data-copy="intro">Copiar prompt</button></div>
    </div>
    <div class="card soft">
      <div class="field"><label for="introRaw">Resposta da IA</label><textarea id="introRaw" class="paste-box" data-bind="introRaw" placeholder='Cole aqui o JSON iniciado por [{"question":…'>${escapeHTML(state.introRaw)}</textarea></div>
      <div class="button-group"><button class="button secondary compact" type="button" data-action="parse-intro">Importar perguntas</button></div>
    </div></div>
    ${state.introQuestions.length && !outdated ? `<div class="card blue"><h2>Importação reconhecida</h2><p class="hint">${state.introQuestions.length} perguntas estão prontas para serem respondidas.</p></div>` : ""}
    ${buttonRow({ nextDisabled: !state.introQuestions.length || outdated, nextLabel: "Ir para as perguntas" })}`;
}

function renderIntroAnswer() {
  const allAnswered = state.introQuestions.length && state.introQuestions.every((_, i) => (state.introAnswers[i] || "").trim());
  const index = Math.min(state.introIndex, state.introQuestions.length - 1);
  const q = state.introQuestions[index];
  return `
    <span class="eyebrow">Perguntas iniciais · Prática</span>
    <h1>Explique com suas próprias palavras.</h1>
    <p class="lead">Uma pergunta por vez, sem prompts ou códigos dividindo sua atenção.</p>
    <div class="activity-focus">
      <div class="activity-toolbar">
        <span class="activity-counter">Pergunta ${index + 1} de ${state.introQuestions.length}</span>
        ${renderItemDots("intro", state.introQuestions.length, index, (i) => Boolean((state.introAnswers[i] || "").trim()))}
      </div>
      <div class="question-card single-activity-card">
        <span class="question-index">Pergunta ${index + 1}</span>
        <p>${escapeHTML(q.question)}</p>
        <textarea data-intro-answer="${index}" placeholder="Responda com suas próprias palavras…">${escapeHTML(state.introAnswers[index] || "")}</textarea>
        <div class="item-navigation">
          <button class="button secondary compact" type="button" data-item-kind="intro" data-item-index="${index - 1}" ${index === 0 ? "disabled" : ""}>← Anterior</button>
          <button class="button secondary compact" type="button" data-item-kind="intro" data-item-index="${index + 1}" ${index === state.introQuestions.length - 1 ? "disabled" : ""}>Próxima →</button>
        </div>
      </div>
    </div>
    ${buttonRow({ nextDisabled: !allAnswered, nextLabel: "Preparar as questões", backLabel: "Voltar à preparação" })}`;
}

function renderQuizPrepare() {
  const outdated = state.quizQuestions.length && state.quizSourceSignature !== quizPrompt();
  return `
    <span class="eyebrow">Questões objetivas · Preparação</span>
    <h1>Monte o teste antes de começar.</h1>
    <p class="lead">Copie o prompt e importe as questões. O gabarito continuará oculto durante a resolução.</p>
    ${outdated ? '<div class="notice"><span>!</span><div><strong>Questões possivelmente desatualizadas</strong>A teoria ou suas respostas introdutórias mudaram. Reimporte as questões para manter a sequência coerente.</div></div>' : ""}
    <div class="prepare-grid">
    <div class="card">
      <div class="field"><label>Prompt das questões</label><textarea class="prompt-box" readonly>${escapeHTML(quizPrompt())}</textarea></div>
      <div class="button-group copy-row"><button class="button secondary compact" type="button" data-copy="quiz">Copiar prompt</button></div>
    </div>
    <div class="card soft">
      <div class="field"><label for="quizRaw">Resposta da IA</label><textarea id="quizRaw" class="paste-box" data-bind="quizRaw" placeholder='Cole aqui o JSON iniciado por {"questions":…'>${escapeHTML(state.quizRaw)}</textarea></div>
      <div class="button-group"><button class="button secondary compact" type="button" data-action="parse-quiz">Importar questões</button></div>
    </div></div>
    ${state.quizQuestions.length && !outdated ? `<div class="card blue"><h2>Teste reconhecido</h2><p class="hint">${state.quizQuestions.length} questões estão prontas. Suas respostas anteriores serão preservadas enquanto o teste não for substituído.</p></div>` : ""}
    ${buttonRow({ nextDisabled: !state.quizQuestions.length || outdated, nextLabel: "Começar a resolver" })}`;
}

function renderQuizAnswer() {
  const allAnswered = state.quizQuestions.length && state.quizQuestions.every((_, i) => state.quizAnswers[i]);
  const index = Math.min(state.quizIndex, state.quizQuestions.length - 1);
  const q = state.quizQuestions[index];
  return `
    <span class="eyebrow">Questões objetivas · Prática</span>
    <h1>Resolva sem distrações.</h1>
    <p class="lead">O teste mostra somente uma questão por vez. Os números indicam quais já foram respondidas.</p>
    <div class="activity-focus">
      <div class="activity-toolbar">
        <span class="activity-counter">Questão ${index + 1} de ${state.quizQuestions.length}</span>
        ${renderItemDots("quiz", state.quizQuestions.length, index, (i) => Boolean(state.quizAnswers[i]))}
      </div>
      <div class="question-card single-activity-card">
        <span class="question-index">Questão ${index + 1}</span>
        <p>${escapeHTML(q.statement)}</p>
        <div class="options">${Object.entries(q.options).map(([key, value]) => `
          <label class="option">
            <input type="radio" name="quiz-${index}" value="${escapeHTML(key)}" data-quiz-answer="${index}" ${state.quizAnswers[index] === key ? "checked" : ""} />
            <span><span class="option-key">${escapeHTML(key)}.</span> ${escapeHTML(value)}</span>
          </label>`).join("")}</div>
        <div class="item-navigation">
          <button class="button secondary compact" type="button" data-item-kind="quiz" data-item-index="${index - 1}" ${index === 0 ? "disabled" : ""}>← Anterior</button>
          <button class="button secondary compact" type="button" data-item-kind="quiz" data-item-index="${index + 1}" ${index === state.quizQuestions.length - 1 ? "disabled" : ""}>Próxima →</button>
        </div>
      </div>
    </div>
    ${buttonRow({ nextDisabled: !allAnswered, nextLabel: "Finalizar e corrigir", nextAction: "finish-quiz", backLabel: "Voltar à preparação" })}`;
}

function renderCorrectionPrepare() {
  const result = getQuizResult();
  return `
    <span class="eyebrow">Correção · Preparação</span>
    <h1>${result.percentage >= 70 ? "Uma base promissora." : "Agora sabemos onde trabalhar."}</h1>
    <p class="lead">Confira o resultado, leve os dados para a IA e cole a devolutiva. A correção ativa acontecerá somente na próxima tela.</p>
    <div class="score-grid">
      <div class="metric"><span>Aproveitamento</span><strong>${result.percentage}%</strong></div>
      <div class="metric"><span>Acertos</span><strong>${result.correct}/${result.total}</strong></div>
      <div class="metric"><span>Pontos a rever</span><strong>${result.wrong}</strong></div>
    </div>
    <div class="card">
      <h2>Correção imediata</h2>
      ${state.quizQuestions.map((q, i) => {
        const chosen = state.quizAnswers[i];
        const correct = chosen === q.answer;
        return `<div class="result-item">
          <span class="result-tag ${correct ? "correct" : "wrong"}">${correct ? "Acertou" : "Rever"}</span>
          <p>${escapeHTML(q.statement)}</p>
          <small>Sua resposta: ${escapeHTML(chosen)} · Correta: ${escapeHTML(q.answer)} — ${escapeHTML(q.explanation || "Sem justificativa")}</small>
        </div>`;
      }).join("")}
    </div>
    <div class="prepare-grid">
    <div class="card yellow">
      <h2>Preparar a devolutiva</h2>
      <p class="hint">O próximo prompt contém seu resultado, respostas e gabarito para obter uma devolutiva contextualizada.</p>
      <textarea class="prompt-box" readonly>${escapeHTML(correctionPrompt())}</textarea>
      <div class="button-group copy-row"><button class="button secondary compact" type="button" data-copy="correction">Copiar prompt de correção</button></div>
    </div>
    <div class="card soft">
      <div class="field">
        <label for="consolidation">Resposta da IA</label>
        <textarea id="consolidation" class="paste-box" data-bind="consolidation" placeholder="Cole aqui o diagnóstico, as correções e os pontos de atenção…">${escapeHTML(state.consolidation)}</textarea>
      </div>
    </div></div>
    ${buttonRow({ nextDisabled: state.consolidation.trim().length < 50, nextLabel: "Estudar a correção", backLabel: "Voltar às questões" })}`;
}

function renderCorrectionResult() {
  const errors = wrongQuestions();
  const completed = !errors.length || errors.every(({ index }) => (state.errorReflections[index] || "").trim().length >= 20);
  const outdated = state.correctionSourceSignature && state.correctionSourceSignature !== correctionPrompt();
  const errorIndex = errors.length ? Math.min(state.errorIndex, errors.length - 1) : 0;
  const currentError = errors[errorIndex];
  return `
    <span class="eyebrow">Correção · Resultado</span>
    <h1>Leia, depois reconstrua os erros.</h1>
    <p class="lead">A devolutiva já está formatada. Depois da leitura, explique cada erro com suas próprias palavras.</p>
    ${outdated ? '<div class="notice"><span>!</span><div><strong>Devolutiva desatualizada</strong>As respostas das questões mudaram. Volte à preparação e gere uma nova correção.</div></div>' : ""}
    ${errors.length ? `<div class="correction-layout">
      <article class="reading bounded-panel">${renderMarkdown(state.consolidation)}</article>
      <div>
        <div class="activity-toolbar">
          <span class="activity-counter">Erro ${errorIndex + 1} de ${errors.length}</span>
          ${renderItemDots("error", errors.length, errorIndex, (i) => Boolean((state.errorReflections[errors[i].index] || "").trim()))}
        </div>
        <div class="error-card bounded-panel">
          <span class="question-index">Questão ${currentError.index + 1}</span>
          <p><strong>${escapeHTML(currentError.q.statement)}</strong></p>
          <small class="hint">Correta: ${escapeHTML(currentError.q.answer)} — ${escapeHTML(currentError.q.explanation || "")}</small>
          <div class="field correction-field">
            <label>Explique o erro e reescreva o raciocínio correto</label>
            <textarea data-error-reflection="${currentError.index}" placeholder="Eu errei porque… O raciocínio correto é…">${escapeHTML(state.errorReflections[currentError.index] || "")}</textarea>
          </div>
          <div class="item-navigation">
            <button class="button secondary compact" type="button" data-item-kind="error" data-item-index="${errorIndex - 1}" ${errorIndex === 0 ? "disabled" : ""}>← Anterior</button>
            <button class="button secondary compact" type="button" data-item-kind="error" data-item-index="${errorIndex + 1}" ${errorIndex === errors.length - 1 ? "disabled" : ""}>Próximo →</button>
          </div>
        </div>
      </div>
    </div>` : `<article class="reading">${renderMarkdown(state.consolidation)}</article><div class="card blue"><h2>Nenhum erro objetivo 🎯</h2><p class="hint">Você pode seguir diretamente para a preparação dos flashcards.</p></div>`}
    ${buttonRow({ nextDisabled: !completed || outdated, nextLabel: "Preparar flashcards", backLabel: "Voltar à preparação" })}`;
}

function renderFlashcardsPrepare() {
  return `
    <span class="eyebrow">Flashcards · Preparação</span>
    <h1>Transforme a sessão em revisão futura.</h1>
    <p class="lead">Copie o prompt e importe os cartões. A revisão e a edição ficarão concentradas na próxima tela.</p>
    <div class="prepare-grid">
    <div class="card purple">
      <h2>Prompt para flashcards</h2>
      <p class="hint">O prompt reúne a teoria, a devolutiva e suas correções ativas.</p>
      <textarea class="prompt-box" readonly>${escapeHTML(flashcardPrompt())}</textarea>
      <div class="button-group copy-row"><button class="button secondary compact" type="button" data-copy="flashcards">Copiar prompt de flashcards</button></div>
    </div>
    <div class="card soft">
      <div class="field"><label for="flashcardsRaw">Resposta da IA</label><textarea id="flashcardsRaw" class="paste-box" data-bind="flashcardsRaw" placeholder='Cole aqui o JSON iniciado por {"cards":…'>${escapeHTML(state.flashcardsRaw)}</textarea></div>
      <div class="button-group"><button class="button secondary compact" type="button" data-action="parse-flashcards">Importar flashcards</button></div>
    </div></div>
    ${state.flashcards.length ? `<div class="card blue"><h2>Importação reconhecida</h2><p class="hint">${state.flashcards.length} flashcards estão prontos para revisão.</p></div>` : ""}
    ${buttonRow({ nextDisabled: !state.flashcards.length, nextLabel: "Revisar flashcards" })}`;
}

function renderFlashcards() {
  const index = Math.min(state.flashcardIndex, state.flashcards.length - 1);
  const card = state.flashcards[index];
  const validCards = state.flashcards.length && state.flashcards.every((item) => item.front.trim() && item.back.trim());
  return `
    <span class="eyebrow">Curadoria final</span>
    <h1>Revise antes de guardar.</h1>
    <p class="lead">Revise um cartão por vez. Edite o que estiver vago, longo ou pouco útil.</p>
    <div class="notice"><span>✦</span><div><strong>Critério rápido</strong>Uma pergunta por cartão, resposta curta e sentido completo mesmo fora desta sessão.</div></div>
    <div class="flashcard-focus">
      <div class="activity-toolbar">
        <span class="activity-counter">Flashcard ${index + 1} de ${state.flashcards.length}</span>
        ${renderItemDots("flashcard", state.flashcards.length, index, (i) => Boolean(state.flashcards[i].front.trim() && state.flashcards[i].back.trim()))}
      </div>
      <article class="flashcard single-activity-card">
        <button class="remove-card" type="button" data-remove-card="${index}">Remover</button>
        <label>Frente</label>
        <textarea data-card-front="${index}">${escapeHTML(card.front)}</textarea>
        <label>Verso</label>
        <textarea data-card-back="${index}">${escapeHTML(card.back)}</textarea>
        <div class="tags">${escapeHTML((card.tags || []).join(" · "))}</div>
        <div class="item-navigation">
          <button class="button secondary compact" type="button" data-item-kind="flashcard" data-item-index="${index - 1}" ${index === 0 ? "disabled" : ""}>← Anterior</button>
          <button class="button secondary compact" type="button" data-item-kind="flashcard" data-item-index="${index + 1}" ${index === state.flashcards.length - 1 ? "disabled" : ""}>Próximo →</button>
        </div>
      </article>
    </div>
    <div class="button-row">
      <button class="button ghost" type="button" data-action="back">← Voltar à preparação</button>
      <div class="button-group">
        <button class="button secondary" type="button" data-action="add-card">+ Adicionar cartão</button>
        <button class="button" type="button" data-action="advance" ${validCards ? "" : "disabled"}>Concluir revisão →</button>
      </div>
    </div>`;
}

function renderFinal() {
  const result = getQuizResult();
  const duration = Math.max(1, Math.round((Date.now() - new Date(state.startedAt).getTime()) / 60000));
  return `
    <span class="eyebrow">Sessão concluída</span>
    <h1>O caminho ficou registrado.</h1>
    <p class="lead">A sessão reúne conteúdo, prática, erros, consolidação e material de revisão — tudo em uma sequência única.</p>
    <div class="score-grid">
      <div class="metric"><span>Desempenho</span><strong>${result.percentage}%</strong></div>
      <div class="metric"><span>Questões</span><strong>${result.total}</strong></div>
      <div class="metric"><span>Flashcards</span><strong>${state.flashcards.length}</strong></div>
    </div>
    <div class="card">
      <h2>Informações gerais</h2>
      <dl class="summary-list">
        <div class="summary-row"><dt>Assunto</dt><dd>${escapeHTML(state.subject)}</dd></div>
        <div class="summary-row"><dt>Objetivo</dt><dd>${escapeHTML(state.objective || "Não informado")}</dd></div>
        <div class="summary-row"><dt>Acertos</dt><dd>${result.correct} de ${result.total}</dd></div>
        <div class="summary-row"><dt>Erros trabalhados</dt><dd>${Object.values(state.errorReflections).filter(Boolean).length}</dd></div>
        <div class="summary-row"><dt>Duração aproximada</dt><dd>${duration} min</dd></div>
        <div class="summary-row"><dt>Armazenamento</dt><dd>Salvo neste navegador</dd></div>
      </dl>
    </div>
    <div class="card blue">
      <h2>Exportar sessão completa</h2>
      <p class="hint">O arquivo de texto inclui teoria, respostas, resultado, correções e flashcards.</p>
      <div class="button-group">
        <button class="button" type="button" data-action="export">Baixar sessão em .txt</button>
        <button class="button secondary" type="button" data-action="print">Imprimir resumo</button>
      </div>
    </div>
    <div class="button-row"><button class="button ghost" type="button" data-action="back">← Rever etapa anterior</button></div>`;
}

const renderers = [
  renderSubject,
  renderTheoryBuild,
  renderReading,
  renderIntroPrepare,
  renderIntroAnswer,
  renderQuizPrepare,
  renderQuizAnswer,
  renderCorrectionPrepare,
  renderCorrectionResult,
  renderFlashcardsPrepare,
  renderFlashcards,
  renderFinal,
];

function renderNav() {
  let screenIndex = 0;
  stepNav.innerHTML = phases.map((phase) => {
    const items = phase.screens.map((item) => {
      const i = screenIndex++;
      const accessible = i <= state.maxStep;
      const active = i === state.currentStep;
      const done = i < state.maxStep || (i === steps.length - 1 && state.maxStep === i);
      return `<button class="step-link ${active ? "active" : ""} ${done ? "done" : ""}" type="button" data-step="${i}" ${accessible ? "" : "disabled"}>
        <span class="step-number">${done && !active ? "✓" : item.mode.startsWith("2") ? "2" : "1"}</span><span class="step-name">${item.label}</span>
      </button>`;
    }).join("");
    return `<div class="phase-group"><div class="phase-label">${phase.label}</div>${items}</div>`;
  }).join("");
}

function render() {
  renderNav();
  screenActions.innerHTML = "";
  screenContent.innerHTML = renderers[state.currentStep]();
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
  const result = getQuizResult();
  const intro = state.introQuestions.map((q, i) => `PERGUNTA ${i + 1}\n${q.question}\nResposta: ${state.introAnswers[i] || "—"}\nResposta-modelo: ${q.modelAnswer || "—"}`).join("\n\n");
  const quiz = state.quizQuestions.map((q, i) => `QUESTÃO ${i + 1}\n${q.statement}\nResposta marcada: ${state.quizAnswers[i] || "—"}\nGabarito: ${q.answer}\nExplicação: ${q.explanation || "—"}\nCorreção ativa: ${state.errorReflections[i] || "Não necessária/não registrada"}`).join("\n\n");
  const cards = state.flashcards.map((card, i) => `CARTÃO ${i + 1}\nFrente: ${card.front}\nVerso: ${card.back}\nTags: ${(card.tags || []).join(", ")}`).join("\n\n");
  const content = `TRILHA DE ESTUDO — REGISTRO DA SESSÃO\n\nAssunto: ${state.subject}\nObjetivo: ${state.objective || "Não informado"}\nInício: ${new Date(state.startedAt).toLocaleString("pt-BR")}\nResultado: ${result.correct}/${result.total} (${result.percentage}%)\n\n${"=".repeat(58)}\nBASE TEÓRICA\n${"=".repeat(58)}\n${state.theory}\n\n${"=".repeat(58)}\nPERGUNTAS INTRODUTÓRIAS\n${"=".repeat(58)}\n${intro}\n\n${"=".repeat(58)}\nQUESTÕES E CORREÇÕES\n${"=".repeat(58)}\n${quiz}\n\n${"=".repeat(58)}\nCONSOLIDAÇÃO DA IA\n${"=".repeat(58)}\n${state.consolidation}\n\n${"=".repeat(58)}\nFLASHCARDS\n${"=".repeat(58)}\n${cards}\n`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = state.subject.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "sessao";
  link.href = url;
  link.download = `trilha-${safeName}.txt`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Sessão exportada.");
}

function loadDemo() {
  const currentTheme = state.theme;
  const demoTheory = `# Ondulatória: frequência, período e velocidade\n\n## Visão geral\nUma onda é uma perturbação que se propaga, transportando energia sem transportar matéria de forma permanente.\n\n## Conceitos fundamentais\n**Frequência (f)** é o número de oscilações realizadas por segundo. Sua unidade é o hertz (Hz). **Período (T)** é o tempo necessário para uma oscilação completa, medido em segundos. As grandezas são inversamente relacionadas: **T = 1/f**.\n\nA velocidade de propagação depende do meio e pode ser calculada por **v = λ · f**, em que λ é o comprimento de onda. Se a velocidade permanecer constante, aumentar a frequência diminui o comprimento de onda.\n\n## Exemplo\nUma onda de frequência 5 Hz realiza cinco oscilações por segundo e possui período de 0,2 s. Se seu comprimento de onda for 2 m, sua velocidade será 10 m/s.\n\n## Confusões comuns\n- Frequência não é velocidade.\n- Amplitude está ligada à energia, não à rapidez da onda.\n- Ao mudar de meio, a frequência é preservada pela fonte, enquanto velocidade e comprimento de onda podem mudar.`;
  const introQuestions = [
    { question: "O que uma onda transporta e o que ela não transporta permanentemente?", modelAnswer: "Transporta energia, mas não matéria de forma permanente." },
    { question: "Como frequência e período se relacionam?", modelAnswer: "São inversamente proporcionais: T = 1/f." },
    { question: "Se a velocidade for constante e a frequência aumentar, o que ocorre com o comprimento de onda?", modelAnswer: "O comprimento de onda diminui." },
    { question: "O que pode mudar quando uma onda passa de um meio para outro?", modelAnswer: "Velocidade e comprimento de onda podem mudar; a frequência da fonte permanece." },
  ];
  const quizQuestions = [
    { id: 1, statement: "Uma onda realiza 4 oscilações a cada segundo. Qual é sua frequência?", options: { A: "0,25 Hz", B: "2 Hz", C: "4 Hz", D: "8 Hz" }, answer: "C", explanation: "Frequência é o número de oscilações por segundo." },
    { id: 2, statement: "Qual é o período de uma onda de frequência 5 Hz?", options: { A: "0,2 s", B: "1 s", C: "5 s", D: "25 s" }, answer: "A", explanation: "T = 1/f = 1/5 = 0,2 s." },
    { id: 3, statement: "Uma onda tem λ = 3 m e f = 2 Hz. Sua velocidade é:", options: { A: "1,5 m/s", B: "5 m/s", C: "6 m/s", D: "9 m/s" }, answer: "C", explanation: "v = λf = 3 × 2 = 6 m/s." },
    { id: 4, statement: "Ao passar para outro meio, mantendo a frequência, a velocidade da onda diminui. O comprimento de onda:", options: { A: "aumenta", B: "diminui", C: "não muda", D: "torna-se zero" }, answer: "B", explanation: "Como λ = v/f e f permanece, a diminuição de v reduz λ." },
    { id: 5, statement: "Qual afirmação está correta?", options: { A: "Maior amplitude sempre significa maior velocidade", B: "Frequência e velocidade são a mesma grandeza", C: "Ondas transportam permanentemente a matéria do meio", D: "Frequência indica oscilações por segundo" }, answer: "D", explanation: "A definição de frequência é a quantidade de oscilações por segundo." },
  ];
  state = {
    ...structuredClone(initialState),
    currentStep: 0,
    maxStep: 0,
    theme: currentTheme,
    startedAt: new Date().toISOString(),
    subject: "Ondulatória — frequência, período e velocidade",
    objective: "Compreender as relações entre as grandezas e preparar-me para uma prova.",
    theory: demoTheory,
    introRaw: JSON.stringify(introQuestions, null, 2),
    introQuestions,
    introSourceTheory: demoTheory,
    introAnswers: {
      0: "A onda transporta energia, sem levar a matéria permanentemente junto.",
      1: "São inversas: quando a frequência aumenta, o período diminui.",
      2: "O comprimento de onda diminui.",
      3: "A velocidade e o comprimento podem mudar, mas a frequência fica igual.",
    },
    quizRaw: JSON.stringify({ questions: quizQuestions }, null, 2),
    quizQuestions,
    quizAnswers: { 0: "C", 1: "A", 2: "B", 3: "B", 4: "D" },
    consolidation: "## Diagnóstico\nVocê compreendeu bem as definições de frequência e período, mas confundiu a aplicação da fórmula da velocidade na questão 3.\n\n## Ponto de atenção\nEm v = λ · f, as unidades precisam ser lidas antes da multiplicação. Com λ = 3 m e f = 2 Hz, o resultado é 6 m/s.\n\n## Síntese\nMantenha separadas as ideias de frequência, amplitude e velocidade. Elas descrevem propriedades diferentes da onda.",
    errorReflections: { 2: "Eu somei ou escolhi um valor sem aplicar corretamente a fórmula. O correto é multiplicar 3 m por 2 Hz, chegando a 6 m/s." },
    flashcardsRaw: "",
    flashcards: [
      { front: "O que a frequência de uma onda representa?", back: "O número de oscilações realizadas por segundo.", tags: ["ondulatória", "frequência"] },
      { front: "Qual é a relação entre período e frequência?", back: "T = 1/f; são grandezas inversamente proporcionais.", tags: ["ondulatória", "período"] },
      { front: "Como calcular a velocidade de propagação de uma onda?", back: "v = λ · f.", tags: ["ondulatória", "fórmula"] },
      { front: "O que ocorre com λ se f aumenta e v é constante?", back: "O comprimento de onda diminui.", tags: ["ondulatória", "relação"] },
      { front: "Ao mudar de meio, qual grandeza é preservada pela fonte?", back: "A frequência.", tags: ["ondulatória", "meios"] },
      { front: "Frequência e velocidade são a mesma coisa?", back: "Não. Frequência mede oscilações por segundo; velocidade mede propagação no meio.", tags: ["ondulatória", "pegadinha"] },
    ],
  };
  state.quizSourceSignature = quizPrompt();
  state.correctionSourceSignature = correctionPrompt();
  saveState();
  render();
  showToast("Demonstração carregada. Percorra as etapas no seu ritmo.");
}

function resetSession() {
  if (!window.confirm("Deseja apagar a sessão salva neste navegador e recomeçar?")) return;
  const currentTheme = state.theme;
  state = { ...structuredClone(initialState), startedAt: new Date().toISOString(), theme: currentTheme };
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
