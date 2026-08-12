// Winziger PDF-Erzeuger für die Reservierungsbestätigung.
//
// Die Website lädt ihre Bibliotheken über CDN-Tags mit festen SRI-Hashes; eine
// zusätzliche PDF-Bibliothek würde einen weiteren Fremd-Download bedeuten.
// Für den Bedarf hier — Text, Linien, Flächen auf A4 — reicht das PDF-Format
// selbst: Helvetica ist als Standardschrift in jedem Reader vorhanden, der Rest
// sind ein paar Zeichenbefehle. Erzeugt wird PDF 1.4 mit WinAnsi-Kodierung
// (deckt Umlaute, ß, €, Gedankenstrich und Anführungszeichen ab).

(function () {
  const A4 = { w: 595.28, h: 841.89 };

  // Sonderzeichen, die in WinAnsi einen anderen Code haben als in Latin-1
  const WINANSI = {
    '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
    'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91,
    '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98,
    '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
  };

  // Text in WinAnsi-Bytes umwandeln; alles Unbekannte (z. B. Emoji) entfällt.
  function toWinAnsi(text) {
    let out = '';
    for (const ch of String(text == null ? '' : text)) {
      const code = WINANSI[ch] !== undefined ? WINANSI[ch] : ch.codePointAt(0);
      if (code <= 0xff) out += String.fromCharCode(code);
    }
    return out;
  }

  function esc(text) {
    return toWinAnsi(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  // Breite einer Zeichenkette in Punkt — Helvetica-Metriken (1000er-Einheiten),
  // gekürzt auf das, was für Umbruch und Rechtsbündigkeit nötig ist.
  const W_REG = { ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 191, '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015, '[': 278, '\\': 278, ']': 278, '^': 469, '_': 556, '`': 333, '{': 334, '|': 260, '}': 334, '~': 584 };
  const DIGIT = 556;

  function charWidth(ch, bold) {
    if (ch >= '0' && ch <= '9') return DIGIT;
    if (W_REG[ch] !== undefined) return W_REG[ch];
    const upper = ch === ch.toUpperCase() && ch !== ch.toLowerCase();
    // Näherungswerte: Großbuchstaben breiter, Kleinbuchstaben schmaler
    const base = upper ? 700 : 545;
    if ('ijlItf'.includes(ch)) return bold ? 320 : 278;
    if ('mwMW'.includes(ch)) return bold ? 900 : 833;
    return bold ? base + 30 : base;
  }

  function textWidth(text, size, bold) {
    let w = 0;
    for (const ch of toWinAnsi(text)) w += charWidth(ch, bold);
    return (w / 1000) * size;
  }

  // Text auf eine Breite umbrechen
  function wrap(text, size, bold, maxWidth) {
    const words = String(text == null ? '' : text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const next = line ? line + ' ' + word : word;
      if (line && textWidth(next, size, bold) > maxWidth) { lines.push(line); line = word; }
      else line = next;
    });
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  // ---------------------------------------------------------------------------
  // Dokument
  // ---------------------------------------------------------------------------
  function createDoc(opts) {
    const o = Object.assign({ margin: 56 }, opts || {});
    const pages = [];
    let ops = [];
    const doc = {
      margin: o.margin,
      width: A4.w,
      inner: A4.w - o.margin * 2,
      y: A4.h - o.margin,     // Cursor von oben nach unten
    };

    const num = n => (Math.round(n * 100) / 100).toString();

    doc.newPage = () => {
      pages.push(ops.join('\n'));
      ops = [];
      doc.y = A4.h - o.margin;
      return doc;
    };

    // Vor dem Zeichnen prüfen, ob die Zeile noch auf die Seite passt
    doc.need = (space) => {
      if (doc.y - space < o.margin) doc.newPage();
      return doc;
    };

    doc.color = (c) => (c || [0, 0, 0]).map(v => num(v)).join(' ');

    doc.text = (str, opt) => {
      const p = Object.assign({ size: 10.5, bold: false, color: [0.09, 0.08, 0.06], x: o.margin, lead: 1.45, align: 'left', maxWidth: doc.inner }, opt);
      const lines = p.nowrap ? [String(str == null ? '' : str)] : wrap(str, p.size, p.bold, p.maxWidth);
      lines.forEach(line => {
        doc.need(p.size * p.lead);
        let x = p.x;
        if (p.align === 'right') x = p.x - textWidth(line, p.size, p.bold);
        else if (p.align === 'center') x = p.x - textWidth(line, p.size, p.bold) / 2;
        ops.push(
          'BT', `${doc.color(p.color)} rg`, `/${p.bold ? 'F2' : 'F1'} ${num(p.size)} Tf`,
          `1 0 0 1 ${num(x)} ${num(doc.y - p.size)} Tm`, `(${esc(line)}) Tj`, 'ET'
        );
        doc.y -= p.size * p.lead;
      });
      return doc;
    };

    doc.space = (h) => { doc.y -= h; return doc; };

    doc.line = (opt) => {
      const p = Object.assign({ color: [0.78, 0.13, 0.17], width: 1, x1: o.margin, x2: A4.w - o.margin }, opt);
      doc.need(p.width + 2);
      ops.push(`${doc.color(p.color)} RG`, `${num(p.width)} w`,
        `${num(p.x1)} ${num(doc.y)} m ${num(p.x2)} ${num(doc.y)} l S`);
      doc.y -= p.width + 2;
      return doc;
    };

    doc.rect = (h, opt) => {
      const p = Object.assign({ color: [0.96, 0.94, 0.90], x: o.margin, w: doc.inner }, opt);
      doc.need(h);
      ops.push(`${doc.color(p.color)} rg`, `${num(p.x)} ${num(doc.y - h)} ${num(p.w)} ${num(h)} re f`);
      return doc;   // Cursor bleibt stehen — Text wird darüber gesetzt
    };

    // Zeile „Bezeichnung ………… Wert" wie in der Reservierungsübersicht
    doc.row = (label, value, opt) => {
      const p = Object.assign({ size: 10.5 }, opt);
      const valueLines = wrap(value, p.size, true, doc.inner * 0.62);
      const h = Math.max(1, valueLines.length) * p.size * 1.45 + 6;
      doc.need(h);
      const top = doc.y;
      doc.text(label, { size: 8.5, bold: false, color: [0.49, 0.45, 0.39] });
      doc.y = top;
      valueLines.forEach((line, i) => {
        doc.text(line, { size: p.size, bold: true, x: A4.w - o.margin, align: 'right', nowrap: true });
        if (i < valueLines.length - 1) doc.y -= 0;
      });
      doc.y = top - h + 6;
      doc.line({ color: [0.86, 0.84, 0.80], width: 0.5 });
      return doc;
    };

    // ----- Ausgabe -------------------------------------------------------
    doc.bytes = () => {
      pages.push(ops.join('\n'));
      const contents = pages.filter(p => p !== undefined);
      const objects = [];
      const pageIds = contents.map((_, i) => 4 + i * 2);         // Page-Objekte
      objects.push(`<< /Type /Catalog /Pages 2 0 R >>`);         // 1
      objects.push(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${contents.length} >>`); // 2
      objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`); // 3 (F1)
      contents.forEach((stream, i) => {
        const id = pageIds[i];
        objects.push(
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(A4.w)} ${num(A4.h)}] ` +
          `/Resources << /Font << /F1 3 0 R /F2 ${3 + contents.length * 2 + 1} 0 R >> >> /Contents ${id + 1} 0 R >>`
        );
        objects.push(`<< /Length ${toWinAnsi(stream).length} >>\nstream\n${stream}\nendstream`);
      });
      objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

      let out = '%PDF-1.4\n';
      const offsets = [0];
      objects.forEach((body, i) => {
        offsets.push(out.length);
        out += `${i + 1} 0 obj\n${body}\nendobj\n`;
      });
      const xref = out.length;
      out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
      for (let i = 1; i <= objects.length; i++) {
        out += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
      }
      out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

      const bytes = new Uint8Array(out.length);
      for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
      return bytes;
    };

    doc.blob = () => new Blob([doc.bytes()], { type: 'application/pdf' });

    doc.save = (filename) => {
      const url = URL.createObjectURL(doc.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return doc;
    };

    return doc;
  }

  // ---------------------------------------------------------------------------
  // Reservierungsbestätigung
  // ---------------------------------------------------------------------------
  function reservationDoc(res, cfg) {
    const club = (typeof siteConfig === 'function' ? siteConfig() : window.SITE_CONFIG) || {};
    const t = cfg || (typeof ticketConfig === 'function' ? ticketConfig() : {});
    const doc = createDoc();
    const red = [0.78, 0.13, 0.17];
    const muted = [0.49, 0.45, 0.39];

    doc.text('Faschingsverein Nazumido', { size: 9, bold: true, color: muted });
    doc.text('Seit 1962', { size: 9, color: muted });
    doc.space(10);
    doc.line({ color: red, width: 2 });
    doc.space(24);

    doc.text('Reservierungs-', { size: 26, bold: true });
    doc.text('bestätigung', { size: 26, bold: true, color: red });
    doc.space(18);

    doc.text('Reservierungskennung', { size: 8.5, color: muted });
    doc.text(res.code || '—', { size: 18, bold: true, color: [0.12, 0.43, 0.25] });
    doc.space(20);

    doc.row('Veranstaltung', res.eventTitle || '—');
    doc.row('Termin', `${res.eventDate || '—'}${res.eventTime ? ' · ' + res.eventTime : ''}`);
    if (res.eventWhere) doc.row('Ort', res.eventWhere);
    doc.row('Plätze', String(res.count));
    doc.row('Auf den Namen', res.name || '—');
    doc.row('Kontakt', `${res.email || ''}${res.phone ? ' · ' + res.phone : ''}`);
    if (res.note) doc.row('Anmerkung', res.note);
    doc.row('Eingegangen am', new Date(res.at || Date.now()).toLocaleString('de-AT'));

    doc.space(22);
    doc.text(t.successText || 'Wir haben deine Reservierung aufgenommen.', { size: 10.5, color: [0.23, 0.21, 0.17] });
    doc.space(10);
    doc.text('Bitte bring diese Bestätigung mit — an der Abendkasse genügen Kennung und Name. '
      + 'Die Reservierung ist unverbindlich; wenn du nicht kommen kannst, sag uns bitte kurz Bescheid.',
      { size: 10.5, color: [0.23, 0.21, 0.17] });

    doc.space(26);
    doc.line({ color: [0.86, 0.84, 0.80], width: 0.5 });
    doc.space(8);
    const contact = [club.address, club.city].filter(Boolean).join(', ');
    doc.text([contact, club.email, club.phone].filter(Boolean).join('  ·  '), { size: 9, color: muted });
    if (club.websiteLabel) doc.text(club.websiteLabel, { size: 9, color: muted });

    return doc;
  }

  function saveReservationPdf(res, cfg) {
    return reservationDoc(res, cfg).save(`Reservierung-${res.code || 'Nazumido'}.pdf`);
  }

  window.NzPdf = { createDoc, reservationDoc, saveReservationPdf, textWidth, wrap };
})();
