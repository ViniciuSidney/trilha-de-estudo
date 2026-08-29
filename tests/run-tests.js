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

test("mantém as doze telas e o schema atual", () => {
  assert.equal(app.config.steps.length, 12);
  assert.equal(app.config.SCHEMA_VERSION, 2);
});

test("calcula aprendizagem ativa sem alterar o resultado inicial", () => {
  const demo = app.demo.createDemoState("light");
  const summary = app.selectors.getLearningSummary(demo);
  assert.deepEqual(JSON.parse(JSON.stringify(summary.quiz)), { total: 5, correct: 4, wrong: 1, percentage: 80 });
  assert.equal(summary.retry.corrected, 1);
  assert.equal(summary.retry.remaining, 0);
  assert.equal(summary.intro.reviewed, 4);
});

test("gera exportações individuais completas", () => {
  const demo = app.demo.createDemoState("light");
  const text = app.exporter.buildSessionText(demo);
  const record = JSON.parse(app.exporter.buildSessionJSON(demo, { id: "demo", status: "completed" }));
  assert.match(text, /RESULTADO INICIAL|Resultado inicial/);
  assert.match(text, /Nova tentativa: C/);
  assert.equal(record.type, "study-session");
  assert.equal(record.session.summary.retry.corrected, 1);
  assert.equal(record.session.state.quizAnswers[2], "B");
});

test("migra estado legado e schema 1 para o repositório atual", () => {
  const key = app.config.STORAGE_KEY;
  const legacy = { ...app.config.createInitialState(), subject: "Legado", maxStep: 2 };
  storageData.set(key, JSON.stringify(legacy));
  let repository = app.storage.loadRepository();
  assert.equal(repository.schemaVersion, 2);
  assert.equal(repository.sessions[0].subject, "Legado");

  storageData.set(key, JSON.stringify({ app: app.config.APP_NAME, schemaVersion: 1, state: legacy }));
  repository = app.storage.loadRepository();
  assert.equal(repository.sessions.length, 1);
  assert.equal(repository.sessions[0].state.maxStep, 2);
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
});

test("preserva dados quando uma resposta de IA é inválida", () => {
  assert.throws(() => app.validators.parseIntro("[]"));
  assert.throws(() => app.validators.parseQuiz('{"questions":[]}'));
  assert.throws(() => app.validators.parseFlashcards('{"cards":[]}'));
});

test("renderiza as doze telas com semântica de navegação", () => {
  const state = app.demo.createDemoState("light");
  const renderer = app.views.createViewRenderer({
    getState: () => state,
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
  for (let index = 0; index < 12; index += 1) {
    state.currentStep = index;
    const html = renderer.renderScreen(index);
    assert.match(html, /<h1>/, `tela ${index + 1} sem título principal`);
  }
  assert.match(renderer.renderNav(), /aria-current="step"/);
  state.currentStep = 6;
  assert.match(renderer.renderScreen(6), /<fieldset class="option-group">/);
});

test("inclui recursos essenciais de acessibilidade e reflow", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "css/styles.css"), "utf8");
  assert.match(html, /class="skip-link"/);
  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /max-width: 920px/);
  assert.match(css, /max-width: 650px/);
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
    assert.equal(record.schemaVersion, app.config.SCHEMA_VERSION);
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
