mergeInto(LibraryManager.library, {
  SlegnuceWeb_Emit: function (eventTypePtr, payloadPtr) {
    var type = UTF8ToString(eventTypePtr);
    var payload = UTF8ToString(payloadPtr);
    if (window.SLEGNUCE_SHELL && typeof window.SLEGNUCE_SHELL.onUnityEvent === 'function') {
      window.SLEGNUCE_SHELL.onUnityEvent(type, payload);
    }
  },

  SlegnuceWeb_SaveRun: function (payloadPtr) {
    var payload = UTF8ToString(payloadPtr);
    try {
      localStorage.setItem('slegnuce:last-unity-run', payload);
    } catch (e) {
      console.warn('[Slegnuce] Could not persist Unity run', e);
    }
  },

  SlegnuceWeb_SetCursor: function (statePtr) {
    var state = UTF8ToString(statePtr);
    document.documentElement.dataset.gameCursor = state;
  }
});
