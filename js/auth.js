/**
 * 后台登录态（localStorage）。演示用固定账号，非安全场景请勿用于公网。
 */
(function () {
  var TOKEN_KEY = "moji_admin_session_v1";
  var SESSION_MS = 7 * 24 * 60 * 60 * 1000;

  function b64Encode(obj) {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    } catch (e) {
      return "";
    }
  }

  function b64Decode(s) {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(s))));
    } catch (e) {
      return null;
    }
  }

  function createToken() {
    return b64Encode({
      sub: "admin",
      iat: Date.now(),
      exp: Date.now() + SESSION_MS,
    });
  }

  function parseAndValidate(raw) {
    if (!raw || typeof raw !== "string") return false;
    var p = b64Decode(raw);
    if (!p || p.sub !== "admin" || typeof p.exp !== "number") return false;
    if (Date.now() > p.exp) return false;
    return true;
  }

  window.AdminAuth = {
    TOKEN_KEY: TOKEN_KEY,
    isLoggedIn: function () {
      return parseAndValidate(localStorage.getItem(TOKEN_KEY));
    },
    getToken: function () {
      return localStorage.getItem(TOKEN_KEY);
    },
    setToken: function (t) {
      localStorage.setItem(TOKEN_KEY, t);
    },
    login: function (username, password) {
      if (username === "admin" && password === "123456") {
        this.setToken(createToken());
        return true;
      }
      return false;
    },
    logout: function () {
      localStorage.removeItem(TOKEN_KEY);
    },
  };
})();
