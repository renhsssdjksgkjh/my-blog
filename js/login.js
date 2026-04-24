(function () {
  if (typeof window.AdminAuth !== "undefined" && window.AdminAuth.isLoggedIn()) {
    window.location.replace("dashboard.html");
    return;
  }

  var form = document.getElementById("login-form");
  var err = document.getElementById("login-error");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (err) {
      err.textContent = "";
      err.classList.add("hidden");
    }
    var u = form.username.value.trim();
    var p = form.password.value;
    if (window.AdminAuth && window.AdminAuth.login(u, p)) {
      window.location.replace("dashboard.html");
      return;
    }
    if (err) {
      err.textContent = "账号或密码错误";
      err.classList.remove("hidden");
    }
  });
})();
