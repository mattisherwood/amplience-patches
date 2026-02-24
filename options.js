;(function () {
  "use strict"

  const DEFAULT_SETTINGS = {
    stylesEnabled: true,
  }

  const stylesCheckbox = document.getElementById("stylesEnabled")
  const statusEl = document.getElementById("status")

  function showStatus(message) {
    statusEl.textContent = message

    window.setTimeout(() => {
      if (statusEl.textContent === message) {
        statusEl.textContent = ""
      }
    }, 1500)
  }

  function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      stylesCheckbox.checked = settings.stylesEnabled
    })
  }

  function saveSettings() {
    chrome.storage.sync.set(
      {
        stylesEnabled: stylesCheckbox.checked,
      },
      () => {
        showStatus("Saved")
      },
    )
  }

  function handleStorageChange(changes, area) {
    if (area !== "sync" || !changes.stylesEnabled) {
      return
    }

    stylesCheckbox.checked = Boolean(changes.stylesEnabled.newValue)
  }

  stylesCheckbox.addEventListener("change", saveSettings)
  chrome.storage.onChanged.addListener(handleStorageChange)
  document.addEventListener("DOMContentLoaded", loadSettings)
})()
