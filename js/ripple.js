/**
 * Material-style pointer ripple. Skipped when prefers-reduced-motion: reduce.
 * Inserts the wave as the first child so link/card text stays above it in paint order.
 */
(function () {
  function motionOk() {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * @param {Element | null} root
   * @param {string} selector - valid selector for Element.closest()
   */
  window.attachPointerRipple = function (root, selector) {
    if (!root || !motionOk()) return;

    root.addEventListener(
      "pointerdown",
      function (e) {
        if (e.button !== 0) return;
        var el = e.target.closest(selector);
        if (!el || !root.contains(el)) return;

        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var span = document.createElement("span");
        span.className = "ui-ripple-wave";
        span.setAttribute("aria-hidden", "true");
        var d = Math.hypot(rect.width, rect.height) * 2.2;
        span.style.width = span.style.height = d + "px";
        span.style.left = x + "px";
        span.style.top = y + "px";

        if (el.firstChild) el.insertBefore(span, el.firstChild);
        else el.appendChild(span);

        requestAnimationFrame(function () {
          span.classList.add("ui-ripple-wave--show");
        });

        var finished = false;
        function cleanup() {
          if (finished) return;
          finished = true;
          window.clearTimeout(timer);
          span.removeEventListener("transitionend", onEnd);
          if (span.parentNode) span.parentNode.removeChild(span);
        }
        function onEnd() {
          cleanup();
        }
        span.addEventListener("transitionend", onEnd);
        var timer = window.setTimeout(cleanup, 650);
      },
      { passive: true }
    );
  };
})();
