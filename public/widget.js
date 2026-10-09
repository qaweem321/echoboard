/*
 * Feedback widget. Add it to any website with one line:
 *
 *   <script src="https://YOUR-APP/widget.js" data-workspace="acme" async></script>
 *
 * Options (all optional):
 *   data-label="Feedback"   text on the button
 *   data-position="right"   "right" or "left" corner
 *   data-color="#2563eb"    button color
 *   data-button="false"     no floating button; open it from your own link instead with
 *                           window.FeedbackWidget.open()
 *
 * The panel is an iframe served by the feedback app, so the website's styles can't break it
 * and it can't read anything on the website.
 */
(() => {
  const script = document.currentScript;
  if (!script || window.FeedbackWidget) {
    return;
  }
  const workspace = script.getAttribute("data-workspace");
  if (!workspace) {
    console.error('Feedback widget: add data-workspace="your-workspace" to the script tag.');
    return;
  }

  const appOrigin = new URL(script.src).origin;
  const side = script.getAttribute("data-position") === "left" ? "left" : "right";
  const color = script.getAttribute("data-color") || "#2563eb";
  const label = script.getAttribute("data-label") || "Feedback";
  const showButton = script.getAttribute("data-button") !== "false";
  const panelUrl = `${appOrigin}/embed/${encodeURIComponent(workspace)}`;

  let panel = null;
  let button = null;
  let isOpen = false;

  function setStyles(element, styles) {
    for (var key in styles) {
      element.style.setProperty(key, styles[key]);
    }
  }

  function createPanel() {
    panel = document.createElement("iframe");
    panel.src = panelUrl;
    panel.title = label;
    panel.setAttribute("allow", "clipboard-write");
    const small = window.matchMedia("(max-width: 480px)").matches;
    setStyles(panel, {
      position: "fixed",
      bottom: small ? "0" : "84px",
      [side]: small ? "0" : "20px",
      width: small ? "100%" : "380px",
      height: small ? "100%" : "min(600px, calc(100vh - 110px))",
      border: "0",
      "border-radius": small ? "0" : "12px",
      "box-shadow": "0 12px 40px rgba(0, 0, 0, 0.25)",
      "z-index": "2147483647",
      background: "transparent",
      "color-scheme": "normal",
    });
    document.body.appendChild(panel);
  }

  function open() {
    if (!panel) {
      createPanel();
    }
    panel.style.display = "block";
    isOpen = true;
    if (button) {
      button.setAttribute("aria-expanded", "true");
    }
  }

  function close() {
    if (panel) {
      panel.style.display = "none";
    }
    isOpen = false;
    if (button) {
      button.setAttribute("aria-expanded", "false");
      button.focus();
    }
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  // The panel's close button sends this message. Only trust messages from the app itself.
  window.addEventListener("message", (event) => {
    if (event.origin === appOrigin && event.data && event.data.type === "feedback-widget:close") {
      close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) {
      close();
    }
  });

  function addButton() {
    button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-expanded", "false");
    setStyles(button, {
      all: "initial",
      position: "fixed",
      bottom: "20px",
      [side]: "20px",
      "z-index": "2147483646",
      padding: "12px 18px",
      "border-radius": "999px",
      background: color,
      color: "#fff",
      font: "600 14px/1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      cursor: "pointer",
      "box-shadow": "0 6px 20px rgba(0, 0, 0, 0.2)",
    });
    button.addEventListener("click", toggle);
    document.body.appendChild(button);
  }

  window.FeedbackWidget = { open: open, close: close, toggle: toggle };

  if (showButton) {
    if (document.body) {
      addButton();
    } else {
      document.addEventListener("DOMContentLoaded", addButton);
    }
  }
})();
