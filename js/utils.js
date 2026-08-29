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
    const source = escapeHTML(value.trim());
    if (!source) return '<p class="empty">Nenhum conteúdo foi adicionado.</p>';

    const inline = (text) => text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    const tableCells = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => inline(cell.trim()));
    const tableDivider = (line) => {
      const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|");
      return cells.length > 1 && cells.every((cell) => /^\s*:?-{3,}:?\s*$/.test(cell));
    };
    const lines = source.split(/\r?\n/);
    const output = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) { index += 1; continue; }

      if (line.includes("|") && index + 1 < lines.length && tableDivider(lines[index + 1])) {
        const headers = tableCells(line);
        const rows = [];
        index += 2;
        while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
          rows.push(tableCells(lines[index]));
          index += 1;
        }
        output.push(`<div class="table-wrap" role="region" aria-label="Tabela do conteúdo" tabindex="0"><table><thead><tr>${headers.map((cell) => `<th scope="col">${cell}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${row[cellIndex] || ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
        continue;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        output.push(`<h${level}>${inline(heading[2])}</h${level}>`);
        index += 1;
        continue;
      }

      if (/^[-•]\s+/.test(line)) {
        const items = [];
        while (index < lines.length && /^[-•]\s+/.test(lines[index])) {
          items.push(`<li>${inline(lines[index].replace(/^[-•]\s+/, ""))}</li>`);
          index += 1;
        }
        output.push(`<ul>${items.join("")}</ul>`);
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
          items.push(`<li>${inline(lines[index].replace(/^\d+\.\s+/, ""))}</li>`);
          index += 1;
        }
        output.push(`<ol>${items.join("")}</ol>`);
        continue;
      }

      const paragraph = [];
      while (index < lines.length && lines[index].trim()) {
        if (paragraph.length && (lines[index].match(/^(#{1,3})\s+/) || /^[-•]\s+/.test(lines[index]) || /^\d+\.\s+/.test(lines[index]))) break;
        paragraph.push(inline(lines[index]));
        index += 1;
      }
      output.push(`<p>${paragraph.join("<br>")}</p>`);
    }

    return output.join("");
  }

  function stripCodeFence(raw = "") {
    return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  global.TrilhaApp.utils = { escapeHTML, renderMarkdown, stripCodeFence };
})(window);
