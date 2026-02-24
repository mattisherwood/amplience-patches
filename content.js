// Ensure styles are applied even after Angular renders
;(function () {
  "use strict"

  const DEFAULT_SETTINGS = {
    stylesEnabled: true,
  }

  function applyStylesSetting(enabled) {
    if (enabled) {
      document.documentElement.setAttribute("data-amplience-patches", "enabled")
      return
    }

    document.documentElement.removeAttribute("data-amplience-patches")
  }

  console.log("Amplience Patches: Extension loaded")

  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    applyStylesSetting(settings.stylesEnabled)
  })

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes.stylesEnabled) {
      return
    }

    applyStylesSetting(changes.stylesEnabled.newValue)
  })
})()
