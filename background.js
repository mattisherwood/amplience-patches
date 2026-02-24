"use strict"

const DEFAULT_SETTINGS = {
  stylesEnabled: true,
}

const TOGGLE_STYLES_MENU_ID = "toggle-styles-enabled"

function createToggleMenu(checked) {
  chrome.contextMenus.remove(TOGGLE_STYLES_MENU_ID, () => {
    chrome.contextMenus.create({
      id: TOGGLE_STYLES_MENU_ID,
      title: "Enable style patches",
      type: "checkbox",
      checked,
      contexts: ["action"],
    })
  })
}

function syncContextMenuWithSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    createToggleMenu(settings.stylesEnabled)
  })
}

chrome.runtime.onInstalled.addListener(() => {
  syncContextMenuWithSettings()
})

chrome.runtime.onStartup.addListener(() => {
  syncContextMenuWithSettings()
})

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== TOGGLE_STYLES_MENU_ID) {
    return
  }

  chrome.storage.sync.set({
    stylesEnabled: Boolean(info.checked),
  })
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes.stylesEnabled) {
    return
  }

  chrome.contextMenus.update(TOGGLE_STYLES_MENU_ID, {
    checked: Boolean(changes.stylesEnabled.newValue),
  })
})

syncContextMenuWithSettings()
