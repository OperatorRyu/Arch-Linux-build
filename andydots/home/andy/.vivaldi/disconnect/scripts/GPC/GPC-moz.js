(function setDOMSignal () {
    let wrappedNavigator = navigator.wrappedJSObject;
    try {
      Object.defineProperty(wrappedNavigator, "globalPrivacyControl", {
        value: globalPrivacyControlValue || localStorage.gpcEnabled || false,
        configurable: false,
        writable: false
      });
    } catch(e) {};
  })();