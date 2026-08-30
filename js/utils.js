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

  function isEscaped(value, index) {
    let slashes = 0;
    for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) slashes += 1;
    return slashes % 2 === 1;
  }

  function findClosingDelimiter(value, start, delimiter) {
    let cursor = start;
    while (cursor < value.length) {
      const found = value.indexOf(delimiter, cursor);
      if (found < 0) return -1;
      if (!isEscaped(value, found)) return found;
      cursor = found + delimiter.length;
    }
    return -1;
  }

  function tokenizeMath(value = "") {
    const tokens = [];
    let textStart = 0;
    let cursor = 0;

    const pushMath = (start, end, expression, displayMode) => {
      if (start > textStart) tokens.push({ type: "text", value: value.slice(textStart, start) });
      tokens.push({ type: "math", value: expression, displayMode });
      cursor = end;
      textStart = end;
    };

    while (cursor < value.length) {
      if (value.startsWith("\\[", cursor) && !isEscaped(value, cursor)) {
        const end = findClosingDelimiter(value, cursor + 2, "\\]");
        if (end >= 0) {
          pushMath(cursor, end + 2, value.slice(cursor + 2, end), true);
          continue;
        }
      }

      if (value.startsWith("\\(", cursor) && !isEscaped(value, cursor)) {
        const end = findClosingDelimiter(value, cursor + 2, "\\)");
        if (end >= 0) {
          pushMath(cursor, end + 2, value.slice(cursor + 2, end), false);
          continue;
        }
      }

      if (value.startsWith("$$", cursor) && !isEscaped(value, cursor)) {
        const end = findClosingDelimiter(value, cursor + 2, "$$");
        if (end >= 0) {
          pushMath(cursor, end + 2, value.slice(cursor + 2, end), true);
          continue;
        }
      }

      if (value[cursor] === "$" && !isEscaped(value, cursor)) {
        const previous = value[cursor - 1] || "";
        const next = value[cursor + 1] || "";
        const canOpen = !/[\p{L}\p{N}]/u.test(previous) && next && !/\s/.test(next) && next !== "$";
        if (canOpen) {
          const end = findClosingDelimiter(value, cursor + 1, "$");
          const expression = end >= 0 ? value.slice(cursor + 1, end) : "";
          if (end >= 0 && expression.trim() && !expression.includes("\n")) {
            pushMath(cursor, end + 1, expression, false);
            continue;
          }
        }
      }

      cursor += 1;
    }

    if (textStart < value.length) tokens.push({ type: "text", value: value.slice(textStart) });
    return tokens;
  }

  function renderMath(root) {
    if (!root || !global.document || typeof global.katex?.renderToString !== "function") return;
    const walker = global.document.createTreeWalker(root, global.NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent || parent.closest("textarea, input, script, style, pre, code, .katex, [data-no-math]")) continue;
      if (tokenizeMath(node.nodeValue).some((token) => token.type === "math")) nodes.push(node);
    }

    nodes.forEach((node) => {
      const fragment = global.document.createDocumentFragment();
      tokenizeMath(node.nodeValue).forEach((token) => {
        if (token.type === "text") return fragment.appendChild(global.document.createTextNode(token.value));
        const wrapper = global.document.createElement(token.displayMode ? "div" : "span");
        wrapper.className = token.displayMode ? "math-block" : "math-inline";
        wrapper.innerHTML = global.katex.renderToString(token.value, {
          displayMode: token.displayMode,
          throwOnError: false,
          strict: "ignore",
          trust: false,
          output: "htmlAndMathml",
        });
        fragment.appendChild(wrapper);
      });
      node.replaceWith(fragment);
    });
  }

  function stripCodeFence(raw = "") {
    return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  const latexCommandsThatMimicJSONEscapes = new Set([
    "backslash", "bar", "because", "begin", "beta", "bf", "big", "binom", "bmod", "boldsymbol", "boxed", "brace", "breve",
    "frac", "fbox", "forall", "frown", "gamma", "hat", "hbar", "href", "left", "lim",
    "ln", "mathbb", "mathbf", "mathcal", "mathit", "mathrm", "mathsf", "mathtt",
    "nabla", "neg", "neq", "newcommand", "nexists", "ngeq", "nleq", "not", "notin", "nu", "overbrace", "overline", "phantom",
    "qquad", "quad", "rangle", "rbrace", "rceil", "rfloor", "rho", "right", "rightarrow", "rm", "root", "rule", "sqrt",
    "tan", "tau", "text", "textbf", "textit", "therefore", "theta", "tilde", "times", "to", "top", "triangle",
    "underbrace", "underline", "underset", "uparrow", "vec",
  ]);

  function repairJSONLatexEscapes(raw = "") {
    const value = String(raw);
    let output = "";
    let inString = false;
    let repairs = 0;

    for (let index = 0; index < value.length; index += 1) {
      const character = value[index];
      if (character === '"') {
        inString = !inString;
        output += character;
        continue;
      }
      if (!inString || character !== "\\") {
        output += character;
        continue;
      }

      const next = value[index + 1] || "";
      if (next === "\\" || next === '"' || next === "/") {
        output += character + next;
        index += 1;
        continue;
      }

      const command = value.slice(index + 1).match(/^[A-Za-z]+/)?.[0] || "";
      const validUnicodeEscape = next === "u" && /^[0-9a-fA-F]{4}$/.test(value.slice(index + 2, index + 6));
      const validSimpleEscape = "bfnrt".includes(next);
      const looksLikeLatex = latexCommandsThatMimicJSONEscapes.has(command);

      if ((validSimpleEscape || validUnicodeEscape) && !looksLikeLatex) {
        output += character + next;
        index += 1;
        continue;
      }

      output += "\\\\";
      repairs += 1;
    }

    return { value: output, repairs };
  }

  global.TrilhaApp.utils = { escapeHTML, renderMarkdown, tokenizeMath, renderMath, stripCodeFence, repairJSONLatexEscapes };
})(window);
