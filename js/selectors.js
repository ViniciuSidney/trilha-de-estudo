(function initializeSelectors(global) {
  function getQuizResult(state) {
    const total = state.quizQuestions.length;
    const correct = state.quizQuestions.reduce((sum, question, index) => sum + (state.quizAnswers[index] === question.answer ? 1 : 0), 0);
    return { total, correct, wrong: total - correct, percentage: total ? Math.round((correct / total) * 100) : 0 };
  }

  function getWrongQuestions(state) {
    return state.quizQuestions
      .map((question, index) => ({ q: question, index }))
      .filter(({ q, index }) => state.quizAnswers[index] !== q.answer);
  }

  function getRetryResult(state) {
    const errors = getWrongQuestions(state);
    const attempted = errors.filter(({ index }) => Boolean(state.quizRetryAnswers?.[index])).length;
    const corrected = errors.filter(({ q, index }) => state.quizRetryAnswers?.[index] === q.answer).length;
    return {
      total: errors.length,
      attempted,
      corrected,
      remaining: errors.length - corrected,
      percentage: errors.length ? Math.round((corrected / errors.length) * 100) : 100,
    };
  }

  function getLearningSummary(state) {
    const quiz = getQuizResult(state);
    const retry = getRetryResult(state);
    const introReviewed = state.introQuestions.filter((_, index) => state.introReviewed?.[index]).length;
    const reflections = getWrongQuestions(state).filter(({ index }) => (state.errorReflections?.[index] || "").trim()).length;
    return {
      quiz,
      retry,
      intro: { total: state.introQuestions.length, reviewed: introReviewed },
      reflections,
      flashcards: state.flashcards.length,
    };
  }

  global.TrilhaApp.selectors = { getQuizResult, getWrongQuestions, getRetryResult, getLearningSummary };
})(window);
