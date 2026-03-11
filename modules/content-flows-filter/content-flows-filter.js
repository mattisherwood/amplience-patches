;(function () {
  "use strict"

  const DEFAULT_SETTINGS = {
    flowFilter: true,
  }

  let flowFilterEnabled = false

  function removeFlowsFilter() {
    const wrapper = document.querySelector("#flow-filter-wrapper")
    if (wrapper) {
      wrapper.remove()
    }

    const hiddenElements = document.querySelectorAll(
      '[data-visibility="hidden"]',
    )
    hiddenElements.forEach((element) =>
      element.removeAttribute("data-visibility"),
    )
  }

  function injectFlowsFilter() {
    const flowsPanel = document.querySelector(
      '[id^="mantine-"][id$="-panel-flows"]',
    )
    if (!flowsPanel) {
      return
    }

    if (flowsPanel.querySelector("#flow-filter")) {
      return
    }

    const wrapper = document.createElement("div")
    wrapper.id = "flow-filter-wrapper"

    const input = document.createElement("input")
    input.className = "mantine-Input-input mantine-Select-input"
    input.setAttribute("data-variant", "default")
    input.setAttribute("tabindex", "0")
    input.setAttribute("placeholder", "Filter Flows")
    input.setAttribute("autocomplete", "off")
    input.setAttribute("aria-invalid", "false")
    input.id = "flow-filter"
    input.value = ""

    const clearButton = document.createElement("button")
    clearButton.id = "flow-filter-clear"
    clearButton.innerHTML = "×"
    clearButton.setAttribute("type", "button")
    clearButton.setAttribute("aria-label", "Clear filter")

    wrapper.appendChild(input)
    wrapper.appendChild(clearButton)
    flowsPanel.insertAdjacentElement("afterbegin", wrapper)

    const contentContainer = wrapper.nextElementSibling
    if (!contentContainer) {
      return
    }

    function updateClearButton() {
      if (input.value.trim()) {
        clearButton.classList.add("visible")
        return
      }

      clearButton.classList.remove("visible")
    }

    clearButton.addEventListener("click", () => {
      input.value = ""
      updateClearButton()
      input.dispatchEvent(new Event("input"))
    })

    let debounceTimer
    input.addEventListener("input", () => {
      updateClearButton()
      clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(() => {
        const filterValue = input.value.toLowerCase().trim()
        const children = Array.from(contentContainer.children)

        for (const child of children) {
          const text = child.innerHTML.toLowerCase()
          if (!filterValue || text.includes(filterValue)) {
            child.removeAttribute("data-visibility")
          } else {
            child.setAttribute("data-visibility", "hidden")
          }
        }
      }, 100)
    })
  }

  function applyFlowFilterSetting(enabled) {
    if (!enabled) {
      removeFlowsFilter()
      return
    }

    injectFlowsFilter()
  }

  function setupFlowsPanelObserver() {
    const observer = new MutationObserver(() => {
      if (!flowFilterEnabled) {
        return
      }

      injectFlowsFilter()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    flowFilterEnabled = Boolean(settings.flowFilter)
    applyFlowFilterSetting(flowFilterEnabled)
  })

  setupFlowsPanelObserver()

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes.flowFilter) {
      return
    }

    flowFilterEnabled = Boolean(changes.flowFilter.newValue)
    applyFlowFilterSetting(flowFilterEnabled)
  })
})()
