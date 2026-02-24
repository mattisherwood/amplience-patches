;(function () {
  "use strict"

  const DEFAULT_SETTINGS = {
    stylesEnabled: true,
    flowFilter: true,
  }

  const stylesCheckbox = document.getElementById("stylesEnabled")
  const contentFlowsCheckbox = document.getElementById("flowFilter")

  function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      stylesCheckbox.checked = settings.stylesEnabled
      contentFlowsCheckbox.checked = settings.flowFilter
    })
  }

  function saveSettings() {
    chrome.storage.sync.set({
      stylesEnabled: stylesCheckbox.checked,
      flowFilter: contentFlowsCheckbox.checked,
    })
  }

  function handleStorageChange(changes, area) {
    if (area !== "sync") {
      return
    }

    if (changes.stylesEnabled) {
      stylesCheckbox.checked = Boolean(changes.stylesEnabled.newValue)
    }

    if (changes.flowFilter) {
      contentFlowsCheckbox.checked = Boolean(changes.flowFilter.newValue)
    }
  }

  stylesCheckbox.addEventListener("change", saveSettings)
  contentFlowsCheckbox.addEventListener("change", saveSettings)
  chrome.storage.onChanged.addListener(handleStorageChange)
  document.addEventListener("DOMContentLoaded", loadSettings)
})()
