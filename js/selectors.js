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

  global.TrilhaApp.selectors = { getQuizResult, getWrongQuestions };
})(window);
