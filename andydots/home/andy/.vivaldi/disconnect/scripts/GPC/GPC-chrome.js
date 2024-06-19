(function setDOMSignal () {
    const scriptString = `
    try {
      Object.defineProperty(navigator, "globalPrivacyControl", {
        value: ${globalPrivacyControlValue || localStorage.gpcEnabled || false},
        configurable: false,
        writable: false
      });
      document.currentScript.parentElement.removeChild(document.currentScript);
    } catch(e) {};
      `;
    const scriptElement = document.createElement('script');
    scriptElement.innerHTML = scriptString;
    document.documentElement.prepend(scriptElement);
  })();