;(function () {
  "use strict"

  const DEFAULT_SETTINGS = {
    stylesEnabled: true,
    flowFilter: true,
  }

  const stylesCheckbox = document.getElementById("stylesEnabled")
  const contentFlowsCheckbox = document.getElementById("flowFilter")
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
      contentFlowsCheckbox.checked = settings.flowFilter
    })
  }

  function saveSettings() {
    chrome.storage.sync.set(
      {
        stylesEnabled: stylesCheckbox.checked,
        flowFilter: contentFlowsCheckbox.checked,
      },
      () => {
        showStatus("Saved")
      },
    )
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
