const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const storageData = new Map();
const window = {
  TrilhaApp: {},
  matchMedia: () => ({ matches: false }),
  crypto: { randomUUID: () => `test-${storageData.size + 1}` },
  localStorage: {
    getItem: (key) => storageData.get(key) ?? null,
    setItem: (key, value) => storageData.set(key, value),
    clear: () => storageData.clear(),
  },
  setTimeout,
  clearTimeout,
};

const context = vm.createContext({
  window,
  console,
  Date,
  Intl,
  JSON,
  Math,
  structuredClone,
  Blob,
  URL,
});

const modules = [
  "config", "storage", "state", "sessions", "utils", "prompts", "selectors",
  "navigation", "validators", "backup", "exporter", "demo", "views", "home",
];

modules.forEach((name) => {
  const filename = path.join(root, "js", `${name}.js`);
  vm.runInContext(fs.readFileSync(filename, "utf8"), context, { filename });
});

const app = window.TrilhaApp;
const tests = [];
function test(name, callback) { tests.push({ name, callback }); }

test("expande a trilha para catorze telas e schema 3", () => {
  assert.equal(app.config.steps.length, 14);
  assert.equal(app.config.SCHEMA_VERSION, 3);
  assert.equal(app.config.STEP_INDEX["topics-review"], 2);
});

test("calcula aprendizagem ativa sem alterar o resultado inicial", () => {
  const demo = app.demo.createDemoState("light");
  const summary = app.selectors.getLearningSummary(demo);
  assert.deepEqual(JSON.parse(JSON.stringify(summary.quiz)), { total: 5, correct: 4, wrong: 1, percentage: 80 });
  assert.equal(summary.retry.corrected, 1);
  assert.equal(summary.retry.remaining, 0);
  assert.equal(summary.intro.reviewed, 3);
});

test("gera exportações individuais completas", () => {
  const demo = app.demo.createDemoState("light");
  const text = app.exporter.buildSessionText(demo);
  const record = JSON.parse(app.exporter.buildSessionJSON(demo, { id: "demo", status: "completed" }));
  assert.match(text, /RESULTADO INICIAL|Resultado inicial/);
  assert.match(text, /Nova tentativa: C/);
  assert.match(text, /TÓPICOS PLANEJADOS/);
  assert.equal(record.type, "study-session");
  assert.equal(record.session.summary.retry.corrected, 1);
  assert.equal(record.session.state.quizAnswers[2], "B");
});

test("migra estados legados e schema 2 para o repositório atual", () => {
  const key = app.config.STORAGE_KEY;
  const legacy = { ...app.config.createInitialState(), subject: "Legado", maxStep: 2 };
  storageData.set(key, JSON.stringify(legacy));
  let repository = app.storage.loadRepository();
  assert.equal(repository.schemaVersion, 3);
  assert.equal(repository.sessions[0].subject, "Legado");
  assert.equal(repository.sessions[0].state.maxStep, 4);

  storageData.set(key, JSON.stringify({ app: app.config.APP_NAME, schemaVersion: 1, state: legacy }));
  repository = app.storage.loadRepository();
  assert.equal(repository.sessions.length, 1);
  assert.equal(repository.sessions[0].state.maxStep, 4);

  const v2State = { ...legacy, currentStep: 11, maxStep: 11 };
  ["subjectArea", "studyTheme", "topicsRaw", "topics", "topicPlanSourceSignature", "topicIndex"].forEach((field) => delete v2State[field]);
  const v2Session = app.storage.createSessionFromState(v2State, "light", { id: "v2", status: "completed" });
  v2Session.state = v2State;
  storageData.set(key, JSON.stringify({ app: app.config.APP_NAME, schemaVersion: 2, settings: { theme: "light" }, activeSessionId: "v2", sessions: [v2Session] }));
  repository = app.storage.loadRepository();
  assert.equal(repository.schemaVersion, 3);
  assert.equal(repository.sessions[0].state.currentStep, 13);
  assert.deepEqual(JSON.parse(JSON.stringify(repository.sessions[0].state.topics)), []);
});

test("faz ida e volta de backup e rejeita corrupção", () => {
  const demo = app.demo.createDemoState("dark");
  const session = app.storage.createSessionFromState(demo, "dark", { id: "session-1", status: "completed" });
  const repository = app.storage.createEmptyRepository("dark");
  repository.sessions = [session];
  const parsed = app.backup.parseBackup(app.backup.stringifyBackup(repository));
  assert.equal(parsed.summary.completed, 1);
  assert.equal(parsed.repository.sessions[0].state.quizRetryAnswers[2], "C");
  assert.throws(() => app.backup.parseBackup("{ inválido"), /JSON válido/);
  const duplicate = app.backup.buildBackup(repository);
  duplicate.sessions.push(structuredClone(duplicate.sessions[0]));
  assert.throws(() => app.backup.parseBackup(JSON.stringify(duplicate)), /duplicados/);

  const previous = app.backup.buildBackup(repository);
  previous.schemaVersion = 2;
  previous.sessions[0].state.currentStep = 11;
  previous.sessions[0].state.maxStep = 11;
  ["subjectArea", "studyTheme", "topicsRaw", "topics", "topicPlanSourceSignature", "topicIndex"].forEach((field) => delete previous.sessions[0].state[field]);
  const migrated = app.backup.parseBackup(JSON.stringify(previous));
  assert.equal(migrated.repository.schemaVersion, 3);
  assert.equal(migrated.repository.sessions[0].state.currentStep, 13);
});

test("preserva dados quando uma resposta de IA é inválida", () => {
  const topics = app.validators.parseTopics('{"topics":[{"title":"Conceito","objective":"Compreender o conceito"},{"title":"Aplicação","objective":"Aplicar o conceito"}]}');
  assert.equal(topics.length, 2);
  const promptState = { ...app.config.createInitialState(), subjectArea: "Física", studyTheme: "Ondulatória", subject: "Ondas", topics };
  assert.match(app.prompts.buildTheoryPrompt(promptState), /250 a 400 palavras/);
  assert.match(app.prompts.buildTheoryPrompt(promptState), /Conceito/);
  assert.throws(() => app.validators.parseTopics('{"topics":[]}'));
  assert.throws(() => app.validators.parseIntro("[]"));
  assert.throws(() => app.validators.parseQuiz('{"questions":[]}'));
  assert.throws(() => app.validators.parseFlashcards('{"cards":[]}'));
});

test("renderiza as catorze telas com planejamento e navegação", () => {
  const state = app.demo.createDemoState("light");
  const renderer = app.views.createViewRenderer({
    getState: () => state,
    topicPlanPrompt: () => "tópicos",
    theoryPrompt: () => "teoria",
    introPrompt: () => "introdução",
    quizPrompt: () => "questões",
    correctionPrompt: () => "correção",
    flashcardPrompt: () => "flashcards",
    getQuizResult: () => app.selectors.getQuizResult(state),
    getRetryResult: () => app.selectors.getRetryResult(state),
    getLearningSummary: () => app.selectors.getLearningSummary(state),
    wrongQuestions: () => app.selectors.getWrongQuestions(state),
  });
  for (let index = 0; index < 14; index += 1) {
    state.currentStep = index;
    const html = renderer.renderScreen(index);
    assert.match(html, /<h1>/, `tela ${index + 1} sem título principal`);
  }
  assert.match(renderer.renderNav(), /aria-current="step"/);
  state.currentStep = app.config.STEP_INDEX["topics-review"];
  assert.match(renderer.renderScreen(state.currentStep), /class="topic-review-list"/);
  state.currentStep = app.config.STEP_INDEX["quiz-answer"];
  assert.match(renderer.renderScreen(state.currentStep), /<fieldset class="option-group">/);
  state.currentStep = app.config.STEP_INDEX["correction-build"];
  const correction = renderer.renderScreen(state.currentStep);
  assert.match(correction, /class="results-list"/);
  assert.match(correction, /class="answer-choice/);
});

test("renderiza tabelas Markdown com segurança e reflow interno", () => {
  const rendered = app.utils.renderMarkdown("| Conceito | Valor |\n|---|---|\n| Frequência | **5 Hz** |");
  assert.match(rendered, /class="table-wrap"/);
  assert.match(rendered, /<th scope="col">Conceito<\/th>/);
  assert.match(rendered, /<strong>5 Hz<\/strong>/);
  assert.doesNotMatch(app.utils.renderMarkdown("<script>alert(1)</script>"), /<script>/);
});

test("reconhece LaTeX sem confundir valores monetários", () => {
  const tokens = app.utils.tokenizeMath("A taxa é $20\\%$ e o total é R$ 150. Também: \\(v = \\lambda f\\) e \\[T = 1/f\\].");
  const formulas = tokens.filter((token) => token.type === "math");
  assert.equal(formulas.length, 3);
  assert.equal(formulas[0].value, "20\\%");
  assert.equal(formulas[1].value, "v = \\lambda f");
  assert.equal(formulas[2].displayMode, true);
  assert.ok(tokens.some((token) => token.type === "text" && token.value.includes("R$ 150")));
  const katex = require(path.join(root, "vendor", "katex.min.js"));
  assert.match(katex.renderToString("\\frac{20}{100}", { throwOnError: false }), /class="katex"/);
});

test("gera uma pergunta introdutória para cada tópico", () => {
  const state = app.demo.createDemoState("light");
  const prompt = app.prompts.buildIntroPrompt(state);
  assert.match(prompt, new RegExp(`exatamente ${state.topics.length} perguntas`));
  assert.match(prompt, /uma para cada tópico planejado/);
  state.topics.forEach((topic) => assert.match(prompt, new RegExp(topic.title)));
  assert.match(prompt, /LaTeX/);
  const valid = state.topics.map((topic) => ({ question: `Explique ${topic.title}`, modelAnswer: topic.objective }));
  assert.equal(app.validators.parseIntro(JSON.stringify(valid), state.topics.length).length, state.topics.length);
  assert.throws(() => app.validators.parseIntro(JSON.stringify(valid.slice(1)), state.topics.length), /uma para cada tópico/);
});

test("inclui recursos essenciais de acessibilidade e reflow", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "css/styles.css"), "utf8");
  const appSource = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
  assert.match(html, /class="skip-link"/);
  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /id="actionModal"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /max-width: 920px/);
  assert.match(css, /max-width: 650px/);
  assert.doesNotMatch(appSource, /window\.(confirm|prompt)/);
});

function optionValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

test("valida exportações reais quando informadas", () => {
  const jsonPath = optionValue("--session-json");
  const textPath = optionValue("--session-text");
  if (!jsonPath && !textPath) return;
  if (jsonPath) {
    const record = JSON.parse(fs.readFileSync(path.resolve(jsonPath), "utf8").replace(/^\uFEFF/, ""));
    assert.equal(record.app, app.config.APP_NAME);
    assert.equal(record.type, "study-session");
    assert.ok(record.schemaVersion >= 2 && record.schemaVersion <= app.config.SCHEMA_VERSION);
    assert.ok(record.session?.state?.subject);
    assert.ok(record.session?.summary?.quiz);
  }
  if (textPath) {
    const text = fs.readFileSync(path.resolve(textPath), "utf8");
    ["BASE TEÓRICA", "PERGUNTAS INTRODUTÓRIAS", "QUESTÕES", "CONSOLIDAÇÃO DA IA", "FLASHCARDS"]
      .forEach((section) => assert.match(text, new RegExp(section)));
  }
});

let passed = 0;
for (const { name, callback } of tests) {
  try {
    callback();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (!process.exitCode) console.log(`\n${passed}/${tests.length} verificações aprovadas.`);
