(function () {
  const root = document.documentElement;
  const stored = (function () {
    try {
      return localStorage.getItem("theme");
    } catch {
      return null;
    }
  })();

  function applyTheme(mode) {
    if (mode === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }

  if (stored === "dark" || stored === "light") {
    applyTheme(stored);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    applyTheme("dark");
  }

  window.setTheme = function (mode) {
    try {
      localStorage.setItem("theme", mode);
    } catch {
      /* ignore */
    }
    applyTheme(mode);
  };

  window.toggleTheme = function () {
    window.setTheme(root.classList.contains("dark") ? "light" : "dark");
  };
})();
