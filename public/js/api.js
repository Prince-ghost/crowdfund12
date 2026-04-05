(function () {
  const API = "/api";

  function getToken() {
    return localStorage.getItem("cc_token");
  }

  function setToken(t) {
    if (t) localStorage.setItem("cc_token", t);
    else localStorage.removeItem("cc_token");
  }

  async function request(path, options = {}) {
    const headers = { ...options.headers };
    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(API + path, { ...options, headers });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || res.statusText };
    }
    if (!res.ok) {
      let msg = data.message;
      if (!msg && Array.isArray(data.errors) && data.errors.length) {
        msg = data.errors.map((e) => e.msg || e.message || JSON.stringify(e)).join(". ");
      }
      if (!msg && data.error) msg = String(data.error);
      const err = new Error(msg || "Request failed");
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  window.CCApi = { API, getToken, setToken, request };
})();
