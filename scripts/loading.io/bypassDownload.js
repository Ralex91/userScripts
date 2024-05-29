// ==UserScript==
// @name         Bypass Download SVG on loading.io
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  UserScript add bypass download button for SVG file without account or payment on loading.io
// @author       Doge
// @match        https://loading.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=loading.io
// @grant        none
// ==/UserScript==

;(function () {
  "use strict"
  const originalRemoveChild = Node.prototype.removeChild
  const originalRemove = Element.prototype.remove
  const protectedTags = ["animate", "animateTransform", "animateMotion"]

  function containsProtectedElements(node) {
    if (protectedTags.includes(node.tagName)) {
      return true
    }

    for (const tag of protectedTags) {
      if (node.querySelector(tag)) {
        return true
      }
    }

    return false
  }

  Node.prototype.removeChild = function (child) {
    if (containsProtectedElements(child)) {
      return child
    }

    return originalRemoveChild.call(this, child)
  }

  Element.prototype.remove = function () {
    if (containsProtectedElements(this)) {
      return
    }

    originalRemove.call(this)
  }

  const onElementAvailable = (selector, callback) => {
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector)
      if (element) {
        observer.disconnect()
        callback(element)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  const downloadSVG = (rawSvg) => {
    const svg = rawSvg.cloneNode(true)
    const watermark = svg.querySelector("text[data-watermark]")
    if (watermark) {
      svg.removeChild(watermark)
    }

    svg.removeAttribute("height")
    svg.removeAttribute("width")

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const url = URL.createObjectURL(
      new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    )

    const a = document.createElement("a")
    a.href = url
    a.download = a.download = `image-${new Date().getTime()}.svg`

    document.body.appendChild(a)
    a.click()

    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  function init(svg) {
    const buttonReplace = document.querySelector(".lde-downloads")

    const customButton = document.createElement("button")
    customButton.innerHTML = "Bypass Download ⚙️"
    customButton.id = "bypassed"
    customButton.className = "btn btn-sm btn-warning"

    buttonReplace.appendChild(customButton)

    onElementAvailable("#bypassed", (button) => {
      button.addEventListener("click", () => {
        downloadSVG(svg)
      })
    })
  }

  onElementAvailable(".lde-viewer svg", init)
})()