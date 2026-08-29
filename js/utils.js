(function initializeUtils(global) {
  function escapeHTML(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderMarkdown(value = "") {
    const safe = escapeHTML(value.trim());
    if (!safe) return '<p class="empty">Nenhum conteúdo foi adicionado.</p>';
    return safe
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/^[-•] (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
      .split(/\n{2,}/)
      .map((block) => (/^<(h\d|ul)/.test(block) ? block : `<p>${block.replaceAll("\n", "<br>")}</p>`))
      .join("");
  }

  function stripCodeFence(raw = "") {
    return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  global.TrilhaApp.utils = { escapeHTML, renderMarkdown, stripCodeFence };
})(window);
