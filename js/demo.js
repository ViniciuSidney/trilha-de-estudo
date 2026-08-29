(function initializeDemo(global) {
  const { createInitialState } = global.TrilhaApp.config;
  const { buildQuizPrompt, buildCorrectionPrompt } = global.TrilhaApp.prompts;
  const { getQuizResult } = global.TrilhaApp.selectors;

  function createDemoState(theme) {
    const theory = `# Ondulatória: frequência, período e velocidade\n\n## Visão geral\nUma onda é uma perturbação que se propaga, transportando energia sem transportar matéria de forma permanente.\n\n## Conceitos fundamentais\n**Frequência (f)** é o número de oscilações realizadas por segundo. Sua unidade é o hertz (Hz). **Período (T)** é o tempo necessário para uma oscilação completa, medido em segundos. As grandezas são inversamente relacionadas: **T = 1/f**.\n\nA velocidade de propagação depende do meio e pode ser calculada por **v = λ · f**, em que λ é o comprimento de onda. Se a velocidade permanecer constante, aumentar a frequência diminui o comprimento de onda.\n\n## Exemplo\nUma onda de frequência 5 Hz realiza cinco oscilações por segundo e possui período de 0,2 s. Se seu comprimento de onda for 2 m, sua velocidade será 10 m/s.\n\n## Confusões comuns\n- Frequência não é velocidade.\n- Amplitude está ligada à energia, não à rapidez da onda.\n- Ao mudar de meio, a frequência é preservada pela fonte, enquanto velocidade e comprimento de onda podem mudar.`;
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
    const state = {
      ...createInitialState(),
      theme,
      subject: "Ondulatória — frequência, período e velocidade",
      objective: "Compreender as relações entre as grandezas e preparar-me para uma prova.",
      theory,
      introRaw: JSON.stringify(introQuestions, null, 2),
      introQuestions,
      introSourceTheory: theory,
      introAnswers: {
        0: "A onda transporta energia, sem levar a matéria permanentemente junto.",
        1: "São inversas: quando a frequência aumenta, o período diminui.",
        2: "O comprimento de onda diminui.",
        3: "A velocidade e o comprimento podem mudar, mas a frequência fica igual.",
      },
      introReviewed: { 0: true, 1: true, 2: true, 3: true },
      quizRaw: JSON.stringify({ questions: quizQuestions }, null, 2),
      quizQuestions,
      quizAnswers: { 0: "C", 1: "A", 2: "B", 3: "B", 4: "D" },
      quizRetryAnswers: { 2: "C" },
      consolidation: "## Diagnóstico\nVocê compreendeu bem as definições de frequência e período, mas confundiu a aplicação da fórmula da velocidade na questão 3.\n\n## Ponto de atenção\nEm v = λ · f, as unidades precisam ser lidas antes da multiplicação. Com λ = 3 m e f = 2 Hz, o resultado é 6 m/s.\n\n## Síntese\nMantenha separadas as ideias de frequência, amplitude e velocidade. Elas descrevem propriedades diferentes da onda.",
      errorReflections: { 2: "Eu somei ou escolhi um valor sem aplicar corretamente a fórmula. O correto é multiplicar 3 m por 2 Hz, chegando a 6 m/s." },
      flashcards: [
        { front: "O que a frequência de uma onda representa?", back: "O número de oscilações realizadas por segundo.", tags: ["ondulatória", "frequência"] },
        { front: "Qual é a relação entre período e frequência?", back: "T = 1/f; são grandezas inversamente proporcionais.", tags: ["ondulatória", "período"] },
        { front: "Como calcular a velocidade de propagação de uma onda?", back: "v = λ · f.", tags: ["ondulatória", "fórmula"] },
        { front: "O que ocorre com λ se f aumenta e v é constante?", back: "O comprimento de onda diminui.", tags: ["ondulatória", "relação"] },
        { front: "Ao mudar de meio, qual grandeza é preservada pela fonte?", back: "A frequência.", tags: ["ondulatória", "meios"] },
        { front: "Frequência e velocidade são a mesma coisa?", back: "Não. Frequência mede oscilações por segundo; velocidade mede propagação no meio.", tags: ["ondulatória", "pegadinha"] },
      ],
    };
    state.quizSourceSignature = buildQuizPrompt(state);
    state.correctionSourceSignature = buildCorrectionPrompt(state, getQuizResult(state));
    return state;
  }

  global.TrilhaApp.demo = { createDemoState };
})(window);
