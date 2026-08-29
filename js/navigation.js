(function initializeNavigation(global) {
  function goToStep(state, index, totalSteps) {
    if (!Number.isInteger(index) || index < 0 || index >= totalSteps || index > state.maxStep) return null;
    return { currentStep: index };
  }

  function advance(state, totalSteps) {
    const currentStep = Math.min(state.currentStep + 1, totalSteps - 1);
    return { currentStep, maxStep: Math.max(state.maxStep, currentStep) };
  }

  function back(state) {
    if (state.currentStep <= 0) return null;
    return { currentStep: state.currentStep - 1 };
  }

  function setItemIndex(state, kind, index, wrongCount) {
    const keys = { intro: "introIndex", quiz: "quizIndex", error: "errorIndex", flashcard: "flashcardIndex" };
    const lengths = {
      intro: state.introQuestions.length,
      quiz: state.quizQuestions.length,
      error: wrongCount,
      flashcard: state.flashcards.length,
    };
    const key = keys[kind];
    if (!key || !lengths[kind] || !Number.isInteger(index)) return null;
    return { [key]: Math.max(0, Math.min(index, lengths[kind] - 1)) };
  }

  global.TrilhaApp.navigation = { goToStep, advance, back, setItemIndex };
})(window);
