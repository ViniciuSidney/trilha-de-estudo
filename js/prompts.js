(function initializePrompts(global) {
  function buildTheoryPrompt(state) {
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

  function buildIntroPrompt(state) {
    return `Com base no conteúdo teórico abaixo sobre "${state.subject}", crie 4 perguntas introdutórias discursivas em ordem crescente de dificuldade. Elas devem verificar compreensão, não memorização mecânica.

CONTEÚDO:
${state.theory}

Responda SOMENTE com JSON válido, sem bloco de código e sem comentários, neste formato:
[
  {"question":"pergunta clara","modelAnswer":"resposta esperada curta"}
]`;
  }

  function buildQuizPrompt(state) {
    const introContext = state.introQuestions.map((q, i) => `P${i + 1}: ${q.question}\nResposta do aluno: ${state.introAnswers[i] || "não respondida"}`).join("\n\n");
    return `Crie 5 questões objetivas sobre "${state.subject}", com quatro alternativas cada e somente uma correta. Misture compreensão conceitual, aplicação e uma pegadinha justa. Use a base teórica e as respostas introdutórias do aluno como contexto.

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

  function buildFlashcardPrompt(state) {
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

  global.TrilhaApp.prompts = {
    buildTheoryPrompt,
    buildIntroPrompt,
    buildQuizPrompt,
    buildCorrectionPrompt,
    buildFlashcardPrompt,
  };
})(window);
