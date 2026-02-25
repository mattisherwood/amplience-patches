// Ensure styles are applied even after Angular renders
;(function () {
  "use strict"

  const DEFAULT_SETTINGS = {
    stylesEnabled: true,
    flowFilter: true,
  }

  let flowFilterEnabled = DEFAULT_SETTINGS.flowFilter

  function applyStylesSetting(enabled) {
    if (enabled) {
      document.documentElement.setAttribute("data-amplience-patches", "enabled")
      return
    }

    document.documentElement.removeAttribute("data-amplience-patches")
  }

  function removeFlowsFilter() {
    // Remove the filter wrapper if it exists
    const wrapper = document.querySelector("#flow-filter-wrapper")
    if (wrapper) {
      wrapper.remove()
    }

    // Remove all data-visibility attributes
    const hiddenElements = document.querySelectorAll(
      '[data-visibility="hidden"]',
    )
    hiddenElements.forEach((el) => el.removeAttribute("data-visibility"))
  }

  function injectFlowsFilter(enabled) {
    if (!enabled) {
      removeFlowsFilter()
      return
    }

    // Find the mantine panel div for content flows
    const flowsPanel = document.querySelector(
      '[id^="mantine-"][id$="-panel-flows"]',
    )
    if (!flowsPanel) {
      return
    }

    // Check if we already injected to avoid duplicates
    if (flowsPanel.querySelector("#flow-filter")) {
      return
    }

    // Inject CSS rule for data-visibility attribute if not already present
    if (!document.getElementById("flow-filter-css")) {
      const style = document.createElement("style")
      style.id = "flow-filter-css"
      style.textContent = `
        [data-visibility="hidden"] { display: none !important; }
        #flow-filter-wrapper {
          position: relative;
          width: 100%;
          max-width: 500px;
        }
        #flow-filter {
          width: 100%;
          padding: .5rem 2.5rem .5rem .75rem;
          border: .0625rem solid #B4C5FC;
          border-radius: .5rem;
          font-size: .875rem;
          font-weight: 400;
          color: #002c42;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          box-sizing: border-box;
          line-height: 1.5rem;
          min-height: 2.5rem;
        }
        #flow-filter::placeholder {
          color: var(--mantine-color-placeholder);
        }
        #flow-filter:focus {
          outline: none;
          border-color: #0374DD;
        }
        #flow-filter-clear {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1.5rem;
          height: 1.5rem;
          border: none;
          background: transparent;
          cursor: pointer;
          display: none;
          align-items: center;
          justify-content: center;
          color: #6c757d;
          font-size: 1.25rem;
          line-height: 1;
          padding: 0;
          border-radius: 0.25rem;
        }
        #flow-filter-clear:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: #002c42;
        }
        #flow-filter-clear.visible {
          display: flex;
        }
      `
      document.head.appendChild(style)
    }

    // Create wrapper for input and clear button
    const wrapper = document.createElement("div")
    wrapper.id = "flow-filter-wrapper"

    // Create the input field
    const input = document.createElement("input")
    input.className = "mantine-Input-input mantine-Select-input"
    input.setAttribute("data-variant", "default")
    input.setAttribute("tabindex", "0")
    input.setAttribute("placeholder", "Filter Flows")
    input.setAttribute("autocomplete", "off")
    input.setAttribute("aria-invalid", "false")
    input.id = "flow-filter"
    input.value = ""

    // Create clear button
    const clearBtn = document.createElement("button")
    clearBtn.id = "flow-filter-clear"
    clearBtn.innerHTML = "×"
    clearBtn.setAttribute("type", "button")
    clearBtn.setAttribute("aria-label", "Clear filter")

    // Assemble wrapper
    wrapper.appendChild(input)
    wrapper.appendChild(clearBtn)

    // Insert at the beginning of flowsPanel
    flowsPanel.insertAdjacentElement("afterbegin", wrapper)

    // Find the content container (sibling to wrapper, typically has class like ._5br1bg0)
    const contentContainer = wrapper.nextElementSibling
    if (!contentContainer) {
      console.warn("Could not find content container for flows filter")
      return
    }

    // Function to update clear button visibility
    function updateClearButton() {
      if (input.value.trim()) {
        clearBtn.classList.add("visible")
      } else {
        clearBtn.classList.remove("visible")
      }
    }

    // Clear button handler
    clearBtn.addEventListener("click", () => {
      input.value = ""
      updateClearButton()
      // Trigger input event to run the filter
      input.dispatchEvent(new Event("input"))
    })

    // Set up debounced filter function
    let debounceTimer
    input.addEventListener("input", (e) => {
      updateClearButton()
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const filterValue = input.value.toLowerCase().trim()

        // Get all immediate children of the content container
        const children = Array.from(contentContainer.children)

        for (const child of children) {
          const text = child.innerHTML.toLowerCase()
          if (filterValue === "") {
            // Empty input - remove data-visibility attribute
            console.log("Remove filter - show all")
            child.removeAttribute("data-visibility")
          } else if (text.includes(filterValue)) {
            // Contains the phrase - show it
            console.log(`Show item: ${child}`)
            child.removeAttribute("data-visibility")
          } else {
            // Doesn't contain - hide it
            console.log(`Hide item: ${child}`)
            child.setAttribute("data-visibility", "hidden")
          }
        }
      }, 100)
    })
  }

  function applySettings(settings) {
    applyStylesSetting(settings.stylesEnabled)
    flowFilterEnabled = settings.flowFilter
    injectFlowsFilter(settings.flowFilter)
  }

  // Watch for the flows panel to appear in the DOM and inject when it does
  function setupFlowsPanelObserver() {
    const observer = new MutationObserver(() => {
      // Check if flowFilter is enabled before attempting injection
      if (flowFilterEnabled) {
        injectFlowsFilter(true)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  console.log("Amplience Patches: Extension loaded")

  chrome.storage.sync.get(DEFAULT_SETTINGS, applySettings)

  // Set up the mutation observer to catch dynamically added panels
  setupFlowsPanelObserver()

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") {
      return
    }

    if (changes.stylesEnabled) {
      applyStylesSetting(changes.stylesEnabled.newValue)
    }

    if (changes.flowFilter) {
      flowFilterEnabled = changes.flowFilter.newValue
      injectFlowsFilter(changes.flowFilter.newValue)
    }
  })
})()
