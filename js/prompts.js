(function initializePrompts(global) {
  function studyPath(state) {
    return [state.subjectArea, state.studyTheme, state.subject].filter(Boolean).join(" → ") || state.subject || "[ASSUNTO]";
  }

  function topicList(state) {
    return state.topics.map((topic, index) => `${index + 1}. ${topic.title}${topic.objective ? ` — ${topic.objective}` : ""}`).join("\n");
  }

  function buildTopicPlanPrompt(state) {
    return `Organize o estudo abaixo em tópicos essenciais e progressivos.

MATÉRIA: ${state.subjectArea || "[MATÉRIA]"}
TEMA: ${state.studyTheme || "[TEMA]"}
ASSUNTO: ${state.subject || "[ASSUNTO]"}
OBJETIVO: ${state.objective || "compreender o assunto com clareza"}

Crie entre 3 e 7 tópicos. Cada tópico deve representar uma parte específica do mesmo assunto, sem transformar temas vizinhos em tópicos. Organize-os na melhor ordem de aprendizagem e evite sobreposição.

Responda SOMENTE com JSON válido, sem bloco de código e sem comentários, neste formato:
{"topics":[{"title":"nome curto do tópico","objective":"o que precisa ser compreendido neste tópico"}]}`;
  }

  function buildTheoryPrompt(state) {
    return `Quero obter um panorama curto para iniciar o estudo de "${studyPath(state)}".

Objetivo ou contexto do estudo: ${state.objective || "compreender o assunto com clareza e construir uma base sólida"}.

TÓPICOS QUE SERÃO ESTUDADOS SEPARADAMENTE:
${topicList(state) || "Ainda não definidos"}

Escreva um resumo geral curto, claro e didático em português do Brasil, com 250 a 400 palavras. Apresente apenas a visão panorâmica do assunto e a relação entre os tópicos. Não desenvolva profundamente cada tópico, pois eles serão estudados separadamente.

Use Markdown com esta estrutura:
1. visão geral em um ou dois parágrafos;
2. como os tópicos se conectam;
3. síntese final em até 5 itens.

Use uma tabela Markdown somente quando ela tornar uma comparação realmente mais clara. Não crie exercícios, não repita ideias e não ultrapasse 400 palavras.`;
  }

  function buildIntroPrompt(state) {
    return `Com base no panorama abaixo sobre "${studyPath(state)}", crie 4 perguntas introdutórias discursivas em ordem crescente de dificuldade. Distribua as perguntas entre os tópicos planejados e verifique compreensão, não memorização mecânica.

CONTEÚDO:
${state.theory}

Responda SOMENTE com JSON válido, sem bloco de código e sem comentários, neste formato:
[
  {"question":"pergunta clara","modelAnswer":"resposta esperada curta"}
]`;
  }

  function buildQuizPrompt(state) {
    const introContext = state.introQuestions.map((q, i) => `P${i + 1}: ${q.question}\nResposta do aluno: ${state.introAnswers[i] || "não respondida"}`).join("\n\n");
    return `Crie 5 questões objetivas integradoras sobre "${studyPath(state)}", com quatro alternativas cada e somente uma correta. Distribua a cobertura entre os tópicos planejados e inclua ao menos uma questão que relacione dois tópicos. Misture compreensão conceitual, aplicação e uma pegadinha justa.

TÓPICOS:
${topicList(state)}

BASE TEÓRICA:
${state.theory}

RESPOSTAS INTRODUTÓRIAS:
${introContext}

Responda SOMENTE com JSON válido, sem bloco de código e sem comentários, neste formato exato:
{"questions":[{"id":1,"statement":"enunciado","options":{"A":"alternativa","B":"alternativa","C":"alternativa","D":"alternativa"},"answer":"A","explanation":"justificativa curta da resposta correta"}]}`;
  }

  function buildCorrectionPrompt(state, result) {
    const details = state.quizQuestions.map((q, i) => {
      const chosen = state.quizAnswers[i] || "não respondida";
      return `Questão ${i + 1}: ${q.statement}\nResposta do aluno: ${chosen}) ${q.options?.[chosen] || "—"}\nGabarito: ${q.answer}) ${q.options?.[q.answer] || "—"}\nJustificativa original: ${q.explanation || "—"}`;
    }).join("\n\n");
    return `Atue como um tutor cuidadoso. Analise meu desempenho no estudo de "${studyPath(state)}".

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

  function buildFlashcardPrompt(state) {
    const reflections = Object.entries(state.errorReflections).map(([i, text]) => `Erro ${Number(i) + 1}: ${text}`).join("\n");
    return `Crie flashcards para revisar a sessão sobre "${studyPath(state)}".

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

  global.TrilhaApp.prompts = {
    buildTopicPlanPrompt,
    buildTheoryPrompt,
    buildIntroPrompt,
    buildQuizPrompt,
    buildCorrectionPrompt,
    buildFlashcardPrompt,
  };
})(window);
