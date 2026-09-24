(() => {
  const KEY = "posto.session.v2";
  // Dados locais legados são preservados, mas nunca usados para autenticar ou gravar na API.
  let session;
  try {
    session = JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch {
    session = null;
    sessionStorage.removeItem(KEY);
  }
  const API = {
    get user() {
      return session?.usuario || null;
    },
    get admin() {
      return ["admin", "super_admin"].includes(this.user?.role);
    },
    save(value) {
      session = value;
      sessionStorage.setItem(KEY, JSON.stringify(value));
    },
    logout() {
      session = null;
      sessionStorage.removeItem(KEY);
      location.href = "/login/login.html";
    },
    async request(path, options = {}) {
      await window.appReady;
      const headers = { ...options.headers };
      if (options.body) headers["Content-Type"] = "application/json";
      if (session?.token) headers.Authorization = `Bearer ${session.token}`;
      const response = await fetch(`/api${path}`, {
        ...options,
        headers,
        cache: "no-store",
      });
      const data = await response
        .json()
        .catch(() => ({ error: "Resposta inválida do servidor." }));
      if (!response.ok) {
        if (response.status === 401 && path !== "/auth/login") {
          session = null;
          sessionStorage.removeItem(KEY);
        }
        const error = new Error(data.error || "Falha na requisição.");
        error.status = response.status;
        throw error;
      }
      return data;
    },
    async require(roles) {
      try {
        if (!session?.token) {
          location.replace("/login/login.html");
          return null;
        }
        const data = await this.request("/auth/me");
        this.save({ ...session, ...data });
        if (roles && !roles.includes(data.usuario.role))
          throw new Error("Seu perfil não tem acesso a esta página.");
        return data.usuario;
      } catch (error) {
        if (error.status === 401) location.replace("/login/login.html");
        throw error;
      }
    },
    async all(path, key) {
      const items = [];
      for (let page = 1; page <= 100; page++) {
        const data = await this.request(
          `${path}${path.includes("?") ? "&" : "?"}limit=100&page=${page}`,
        );
        const rows = key ? data[key] : data;
        items.push(...rows);
        if (rows.length < 100) return items;
      }
      throw new Error("Muitos registros. Refine a consulta.");
    },
  };
  const UI = {
    escape(value) {
      return String(value ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
    },
    page(title, body) {
      document.getElementById("app").innerHTML =
        `<h1 class="h3 mb-4">${this.escape(title)}</h1><div id="feedback" role="status" aria-live="polite"></div>${body}`;
    },
    message(message, kind = "danger") {
      const target = document.getElementById("feedback");
      if (target) {
        target.className = `alert alert-${kind}`;
        target.textContent = message;
        target.scrollIntoView({ block: "nearest" });
      }
    },
    async submit(form, action) {
      const button = form.querySelector("[type=submit]");
      if (button) button.disabled = true;
      const feedback = document.getElementById("feedback");
      if (feedback) {
        feedback.textContent = "";
        feedback.className = "";
      }
      try {
        await action();
      } catch (error) {
        this.message(error.message);
      } finally {
        if (button) button.disabled = false;
      }
    },
    date(value) {
      const key = String(value || "").slice(0, 10);
      return /^\d{4}-\d{2}-\d{2}$/.test(key)
        ? key.split("-").reverse().join("/")
        : "—";
    },
    input(name, label, type = "text", extra = "") {
      return `<div class="col-md-6"><label class="form-label" for="${name}">${label}</label><input class="form-control" id="${name}" name="${name}" type="${type}" ${extra}></div>`;
    },
    option(id, label) {
      return `<option value="${this.escape(id)}">${this.escape(label)}</option>`;
    },
    async start(action) {
      try {
        await action();
      } catch (error) {
        this.page(
          "Não foi possível carregar",
          '<a href="/login/login.html" class="btn btn-outline-primary">Voltar ao login</a>',
        );
        this.message(error.message);
      }
    },
  };
  window.API = API;
  window.UI = UI;
})();
