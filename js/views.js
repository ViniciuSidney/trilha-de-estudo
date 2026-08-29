(function initializeViews(global) {
  const { phases, steps } = global.TrilhaApp.config;
  const { escapeHTML, renderMarkdown } = global.TrilhaApp.utils;

  function createViewRenderer(context) {
    let state = context.getState();
    const { theoryPrompt, introPrompt, quizPrompt, correctionPrompt, flashcardPrompt, getQuizResult, wrongQuestions } = context;

    function buttonRow({ nextLabel = "Continuar", nextDisabled = false, nextAction = "advance", hideBack = false, backLabel = "Voltar" } = {}) {
      return `
        <div class="button-row">
          <div>${hideBack ? "" : `<button class="button ghost" type="button" data-action="back">← ${backLabel}</button>`}</div>
          <button class="button" type="button" data-action="${nextAction}" ${nextDisabled ? "disabled" : ""}>${nextLabel} →</button>
        </div>`;
    }

    function renderItemDots(kind, count, current, answered = () => false) {
      return `<div class="item-dots" aria-label="Navegação dos itens">${Array.from({ length: count }, (_, i) => `
        <button class="item-dot ${i === current ? "active" : ""} ${answered(i) ? "answered" : ""}" type="button" data-item-kind="${kind}" data-item-index="${i}" aria-label="Abrir item ${i + 1}">${i + 1}</button>
      `).join("")}</div>`;
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
      state = context.getState();
      let screenIndex = 0;
      return phases.map((phase) => {
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

    function renderScreen(index) {
      state = context.getState();
      const renderer = renderers[index];
      return renderer ? renderer() : "";
    }

    return { renderNav, renderScreen };
  }

  global.TrilhaApp.views = { createViewRenderer };
})(window);

