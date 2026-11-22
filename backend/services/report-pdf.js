const PDFDocument = require("pdfkit");
async function reportPdf(report) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 42,
    bufferPages: true,
    info: {
      Title: "Relatório geral • Posto de Coleta",
      Author: "Posto de Coleta Araranguá",
    },
  });
  const chunks = [];
  const complete = new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  const text = (value, size = 10) =>
    doc
      .font("Helvetica")
      .fontSize(size)
      .fillColor("#233644")
      .text(String(value), { paragraphGap: 5 });
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#185c83")
    .text("Relatório geral");
  text("Posto de Coleta • Araranguá • Atendimento pelo SUS", 11);
  text(
    `Gerado em ${new Date(report.geradoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (horário de Araranguá)`,
  );
  for (const filter of report.filtrosDescricao) text(filter);
  text(
    "Uso administrativo. Totais completos; tabelas com limite têm o limite indicado no título.",
  );
  for (const [index, section] of report.secoes.entries()) {
    if (index > 0 || doc.y > 600) doc.addPage();
    else doc.moveDown(1);
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#185c83")
      .text(section.titulo);
    doc.moveDown(0.4);
    text(section.descricao);
    for (const m of section.metrics) text(`${m.label}: ${m.value}`, 11);
    for (const table of section.tables) {
      const width = doc.page.width - 84;
      const cellWidth = width / table.columns.length;
      const rowHeight = (values, bold = false) => {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
        return (
          Math.max(
            ...values.map((v) =>
              doc.heightOfString(String(v ?? "—"), { width: cellWidth - 12 }),
            ),
          ) + 14
        );
      };
      function drawRow(values, header = false) {
        const height = rowHeight(values, header);
        const y = doc.y;
        doc.rect(42, y, width, height).fill(header ? "#e5f1f8" : "#f8fafc");
        doc
          .font(header ? "Helvetica-Bold" : "Helvetica")
          .fontSize(9)
          .fillColor("#233644");
        values.forEach((value, i) =>
          doc.text(String(value ?? "—"), 48 + i * cellWidth, y + 7, {
            width: cellWidth - 12,
          }),
        );
        doc.x = 42;
        doc.y = y + height + 2;
      }
      function heading(continued = false) {
        doc
          .moveDown(0.7)
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor("#185c83")
          .text(table.title + (continued ? " (continuação)" : ""));
        doc.moveDown(0.3);
        if (table.rows.length) drawRow(table.columns, true);
      }
      if (doc.y > 650) doc.addPage();
      heading();
      if (!table.rows.length) {
        text("Nenhum registro para os filtros selecionados.");
        continue;
      }
      for (const row of table.rows) {
        if (doc.y + rowHeight(row) > doc.page.height - 65) {
          doc.addPage();
          heading(true);
        }
        drawRow(row);
      }
    }
  }
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#576977")
      .text(
        `Posto de Coleta • Relatório administrativo • ${i + 1} / ${range.count}`,
        42,
        810,
        { lineBreak: false },
      );
  }
  doc.end();
  return complete;
}
module.exports = reportPdf;
