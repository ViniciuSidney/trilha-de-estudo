(function initializeState(global) {
  function createStateManager(initialState) {
    let currentState = initialState;

    function getState() {
      return currentState;
    }

    function replaceState(nextState) {
      currentState = nextState;
      return currentState;
    }

    function updateState(patch) {
      currentState = { ...currentState, ...patch };
      return currentState;
    }

    return { getState, replaceState, updateState };
  }

  global.TrilhaApp.state = { createStateManager };
})(window);
