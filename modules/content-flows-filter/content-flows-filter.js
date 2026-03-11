;(function () {
  "use strict"

  const DEFAULT_SETTINGS = {
    flowFilter: true,
  }

  let flowFilterEnabled = false

  function hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

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

  function applyFlowTextareaPlaceholder() {
    const textarea = document.querySelector(
      '[data-testid="content-form:textarea"]',
    )
    if (!textarea) {
      return false
    }

    textarea.setAttribute(
      "placeholder",
      "Enter flow details here, e.g. [Author] Flow title #tag1 #tag2",
    )
    return true
  }

  function watchForFlowTextarea() {
    if (applyFlowTextareaPlaceholder()) {
      return
    }

    const modalObserver = new MutationObserver((_, observer) => {
      if (!applyFlowTextareaPlaceholder()) {
        return
      }

      observer.disconnect()
    })

    modalObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  function bindCreateFlowButton() {
    const createNewButton = document.querySelector(
      '[data-testid="add-content-flow"]',
    )
    if (!createNewButton || createNewButton.dataset.flowPlaceholderBound) {
      return
    }

    createNewButton.dataset.flowPlaceholderBound = "true"
    createNewButton.addEventListener("click", watchForFlowTextarea)
  }

  function injectFlowsFilter() {
    const flowsPanel = document.querySelector(
      '[id^="mantine-"][id$="-panel-flows"]',
    )
    if (!flowsPanel) {
      return
    }

    bindCreateFlowButton()

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

    function parseFlowData(flowElement) {
      const p = flowElement.querySelector("p")
      if (!p) return

      const text = p.textContent.trim()
      const authorMatch = text.match(/^\[([^\]]+)\]/)
      const author = authorMatch ? authorMatch[1] : ""
      const tags = [...text.matchAll(/#(\w+)/g)].map((m) => m[1])
      const title = text
        .replace(/^\[[^\]]+\]\s*/, "")
        .replace(/#\w+/g, "")
        .trim()

      flowElement.dataset.flowAuthor = author
      flowElement.dataset.flowTitle = title
      flowElement.dataset.flowTags = tags.join(" ")

      return { author, title, tags }
    }

    const MAX_PARSE_ATTEMPTS = 20
    const PARSE_RETRY_INTERVAL = 250

    function decorateFlow(flow) {
      const { author, title, tags } = parseFlowData(flow)

      flow.classList.add("flow-card")
      flow.dataset.flowParsed = "true"

      const stage = flow.children[0].children[0].children[0]

      // Add a little circle badge within the flow div with the author name
      if (author) {
        // Calculate a consistent colour based on the author name so that the same author always has the same colour
        // The colours should always be light so dark text can be easily read on them - you can achieve this by limiting the random values to the upper half of the spectrum (i.e. 128-255)
        const authorHash = hashString(author)
        const color = `#${[0, 1, 2]
          .map((i) =>
            (Math.floor((authorHash >> (i * 8)) % 200) + 200)
              .toString(16)
              .padStart(2, "0"),
          )
          .join("")}`
        const authorBadge = document.createElement("div")
        authorBadge.className = "author-badge"
        authorBadge.textContent = author
        authorBadge.style.backgroundColor = color
        stage.appendChild(authorBadge)
      }

      // Append the tags in the flow div in the following way:
      // ...<div className="tags"><div class="tag">{tag1}</div><div class="tag">{tag2}</div></div></div>
      if (tags.length) {
        const tagsContainer = document.createElement("div")
        tagsContainer.className = "tags"
        tags.forEach((tag) => {
          // Calculate a consistent colour based on the tag name so that the same tag always has the same colour
          // The colours should always be dark so white text can be easily read on them - you can achieve this by limiting the values to the lower half of the spectrum (i.e. 0-127)
          const tagHash = hashString(tag)
          const color = `#${[0, 1, 2]
            .map((i) =>
              Math.floor((tagHash >> (i * 8)) % 128)
                .toString(16)
                .padStart(2, "0"),
            )
            .join("")}`
          const tagEl = document.createElement("div")
          tagEl.className = "tag"
          tagEl.textContent = `#${tag}`
          tagEl.style.backgroundColor = color
          tagsContainer.appendChild(tagEl)
        })
        stage.appendChild(tagsContainer)
      }

      // Replace the content of the first p element with the title only (essentially removing the author and tags)
      const p = flow.querySelector("p")
      if (p && title) {
        p.textContent = title
      }
    }

    function parseAndDecorateFlows(attempt = 0) {
      const unparsed = Array.from(contentContainer.children).filter(
        (child) => !child.dataset.flowParsed,
      )
      const ready = unparsed.filter((flow) => flow.querySelector("p"))

      if (ready.length === 0) {
        if (attempt < MAX_PARSE_ATTEMPTS) {
          setTimeout(
            () => parseAndDecorateFlows(attempt + 1),
            PARSE_RETRY_INTERVAL,
          )
        }
        return
      }

      ready.forEach(decorateFlow)
    }

    parseAndDecorateFlows()

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
