// Экспорт данных в Excel и Word

// Примечания (загружаются из notes.json)
let NOTE_TEXTS = {};

// ============================================
// ЭКСПОРТ В EXCEL
// ============================================

/**
 * Экспорт данных в Excel файл
 */
function exportToExcel() {
  const data = collectTableData();

  // Создаём workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Таблица');

  // Заголовки
  worksheet.columns = [
    { header: 'Наименование характеристики', key: 'name', width: 50 },
    { header: 'Значение характеристики', key: 'value', width: 30 },
    { header: 'Единица измерения характеристики', key: 'unit', width: 30 }
  ];

  // Данные
  data.forEach(row => {
    worksheet.addRow({ name: row[0], value: row[1], unit: row[2] });
  });

  // Добавляем примечание
  addNoteToWorksheet(worksheet);

  // Применяем стили
  applyExcelStyles(worksheet);

  // Скачиваем файл
  downloadExcelFile(workbook);
}

/**
 * Добавить примечание в worksheet
 * @param {Worksheet} worksheet - лист workbook
 */
function addNoteToWorksheet(worksheet) {
  const noteValue = getElement(CONFIG.ELEMENTS.NOTE_SELECTOR).value;
  if (noteValue && NOTE_TEXTS[noteValue]) {
    // 2 пустые строки
    worksheet.addRow({ name: '', value: '', unit: '' });
    worksheet.addRow({ name: '', value: '', unit: '' });
    // Текст примечания в первой колонке
    worksheet.addRow({ name: NOTE_TEXTS[noteValue], value: '', unit: '' });
  }
}

/**
 * Применить стили к worksheet
 * @param {Worksheet} worksheet - лист workbook
 */
function applyExcelStyles(worksheet) {
  const borderStyle = {
    style: 'thin',
    color: { rgb: '000000' }
  };

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      // Чёрная рамка со всех сторон
      cell.border = {
        top: { style: borderStyle },
        left: { style: borderStyle },
        bottom: { style: borderStyle },
        right: { style: borderStyle }
      };

      if (rowNumber === 1) {
        // Заголовок: жирный, по центру, фон
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D9E1F2' }
        };
      } else if (colNumber === 1) {
        // Первая колонка: перенос текста, по левому краю
        cell.alignment = { horizontal: 'left', vertical: 'center', wrapText: true };
      } else {
        // Остальные колонки: по центру
        cell.alignment = { horizontal: 'center', vertical: 'center' };
      }
    });
  });
}

/**
 * Скачать Excel файл
 * @param {Workbook} workbook - workbook
 */
function downloadExcelFile(workbook) {
  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'export.xlsx';
    anchor.click();
    window.URL.revokeObjectURL(url);
  });
}

// ============================================
// ЭКСПОРТ В WORD
// ============================================

/**
 * Экспорт данных в Word файл
 */
function exportToWord() {
  // Проверяем наличие библиотеки docx
  const docxLib = typeof window.docx !== 'undefined' ? window.docx : null;
  if (!docxLib) {
    alert('Библиотека docx не загружена. Проверьте подключение к интернету.');
    return;
  }

  const {
    Document, Packer, Table, TableRow, TableCell,
    WidthType, AlignmentType, BorderStyle, Paragraph, TextRun
  } = docxLib;

  const data = collectTableData();

  // Создаём таблицу
  const borderStyle = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' }
  };

  const rowsDoc = createWordTableRows(data, borderStyle);
  const noteParagraphs = createNoteParagraphs();

  // Создаём документ
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Table({ rows: rowsDoc, width: { size: 6420, type: WidthType.DXA } }),
        ...noteParagraphs
      ]
    }]
  });

  // Скачиваем файл
  downloadWordFile(doc);
}

/**
 * Создать строки таблицы для Word
 * @param {string[][]} data - данные
 * @param {Object} borderStyle - стиль границ
 * @returns {Array} массив строк
 */
function createWordTableRows(data, borderStyle) {
  const rowsDoc = [];

  // Заголовок
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Наименование характеристики', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        borders: borderStyle,
        width: { size: 4040, type: WidthType.DXA }
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Значение характеристики', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        borders: borderStyle,
        width: { size: 2890, type: WidthType.DXA }
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: 'Единица измерения характеристики', bold: true })],
          alignment: AlignmentType.CENTER
        })],
        borders: borderStyle,
        width: { size: 1490, type: WidthType.DXA }
      })
    ]
  });
  rowsDoc.push(headerRow);

  // Данные
  data.forEach(row => {
    const dataRow = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: row[0], wrap: true })],
            alignment: AlignmentType.LEFT
          })],
          borders: borderStyle,
          width: { size: 4040, type: WidthType.DXA }
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: row[1] })],
            alignment: AlignmentType.CENTER
          })],
          borders: borderStyle,
          width: { size: 2890, type: WidthType.DXA }
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: row[2] })],
            alignment: AlignmentType.CENTER
          })],
          borders: borderStyle,
          width: { size: 1490, type: WidthType.DXA }
        })
      ]
    });
    rowsDoc.push(dataRow);
  });

  return rowsDoc;
}

/**
 * Создать параграфы примечания
 * @returns {Array} массив параграфов
 */
function createNoteParagraphs() {
  const noteValue = getElement(CONFIG.ELEMENTS.NOTE_SELECTOR).value;
  const noteParagraphs = [];

  if (noteValue && NOTE_TEXTS[noteValue]) {
    // 2 пустые строки (отступ)
    noteParagraphs.push(new Paragraph({ children: [] }));
    noteParagraphs.push(new Paragraph({ children: [] }));

    // Текст примечания: разбиваем по переносам строк
    const noteLines = NOTE_TEXTS[noteValue].split('\n');
    noteLines.forEach(line => {
      noteParagraphs.push(new Paragraph({
        children: [new TextRun({ text: line.trim(), wrap: true })]
      }));
    });
  }

  return noteParagraphs;
}

/**
 * Скачать Word файл
 * @param {Document} doc - документ
 */
function downloadWordFile(doc) {
  Packer.toBlob(doc).then(blob => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'export.docx';
    anchor.click();
    window.URL.revokeObjectURL(url);
  });
}
