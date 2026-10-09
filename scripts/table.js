// Проверка строк, подсветка и сбор данных

// ============================================
// ПРОВЕРКА И ПОДСВЕТКА СТРОК
// ============================================

/**
 * Проверка и подсветка строк таблицы
 */
function checkRows() {
  // Скрываем/показываем контейнер drive-строк
  const driveCount = getNumberValue(CONFIG.ELEMENTS.DRIVE_COUNT);
  const driveContainer = getElement(CONFIG.ELEMENTS.DRIVE_CONTAINER);
  if (driveContainer) {
    driveContainer.style.display = driveCount === 0 ? 'none' : '';
  }

  // Скрываем/показываем контейнер hba-строк
  const hbaCount = getNumberValue(CONFIG.ELEMENTS.HBA_COUNT);
  const hbaContainer = getElement(CONFIG.ELEMENTS.HBA_CONTAINER);
  if (hbaContainer) {
    hbaContainer.style.display = hbaCount === 0 ? 'none' : '';
  }

  const table = getElement(CONFIG.ELEMENTS.DATA_TABLE);
  if (!table) return;

  const rows = table.querySelectorAll('tbody tr');

  rows.forEach(row => {
    const select = row.querySelector('select');
    if (!select) {
      // Если select заменён на span (длинный текст), подсвечиваем зелёным
      if (row.classList.contains('single-option-row')) {
        row.style.display = '';
        row.style.backgroundColor = CONFIG.STYLES.DISABLED_ROW;
      }
      return;
    }

    // Скрываем drive-6-N при drive-3-N не SATA/SAS ИЛИ drive-5-N не HDD
    if (/^drive-6/.test(select.id)) {
      hideDrive6Row(row, select.id);
      return;
    }

    // Скрываем network-6-N при блокировке (Ethernet)
    if (/^network-6/.test(select.id) && select.disabled) {
      row.style.display = 'none';
      row.style.removeProperty('background-color');
      return;
    }

    // Проверка значения селекта
    applyRowStyle(row, select);
  });
}

/**
 * Скрыть строку drive-6-N если условия не выполнены
 * @param {HTMLTableRowElement} row - строка таблицы
 * @param {string} selectId - ID селекта
 */
function hideDrive6Row(row, selectId) {
  const type = extractType(selectId);

  // Для базового drive-6 (type=1) проверяем drive-3, для клонов — drive-3-N
  const drive3Id = type === 1 ? 'drive-3' : `drive-3-${type}`;
  const drive5Id = type === 1 ? 'drive-5' : `drive-5-${type}`;
  const drive3Clone = getElement(drive3Id);
  const drive5Clone = getElement(drive5Id);

  if (drive3Clone && drive5Clone) {
    const drive3Text = getSelectedText(drive3Clone);
    const drive5Text = getSelectedText(drive5Clone);
    const isSataOrSas = drive3Text === 'SATA' || drive3Text === 'SAS';
    const isHdd = drive5Text === 'HDD';

    if (!isSataOrSas || !isHdd) {
      row.style.display = 'none';
      row.style.removeProperty('background-color');
      return;
    }
  }
}

/**
 * Применить стиль к строке в зависимости от значения
 * @param {HTMLTableRowElement} row - строка таблицы
 * @param {HTMLElement} select - элемент select
 */
function applyRowStyle(row, select) {
  const selectedValue = getSelectedText(select);

  if (!selectedValue || selectedValue.trim() === '') {
    // Пустой селект — скрываем
    row.style.display = 'none';
    row.style.removeProperty('background-color');
  } else if (selectedValue.includes('Удалить')) {
    // Строка "Удалить" — красный фон
    row.style.display = '';
    row.style.backgroundColor = CONFIG.STYLES.DELETE_ROW;
  } else if (select.disabled) {
    // Заблокированный селект — зелёный фон
    row.style.display = '';
    row.style.backgroundColor = CONFIG.STYLES.DISABLED_ROW;
  } else {
    // Обычная строка — без фона
    row.style.display = '';
    row.style.removeProperty('background-color');
  }
}

// ============================================
// СБОР ДАННЫХ ИЗ ТАБЛИЦЫ
// ============================================

/**
 * Сбор данных из таблицы с учётом исключений
 * @returns {string[][]} массив данных [name, value, unit]
 */
function collectTableData() {
  const table = getElement(CONFIG.ELEMENTS.DATA_TABLE);
  if (!table) return [];

  const rows = table.querySelectorAll('tbody tr');
  const allRows = collectAllRows(rows);

  const exclusions = calculateExclusions(allRows);
  const driveValues = collectDriveValues(allRows);

  return filterRows(allRows, exclusions, driveValues);
}

/**
 * Собрать все строки из таблицы
 * @param {NodeList} rows - строки таблицы
 * @returns {Array} массив объектов строк
 */
function collectAllRows(rows) {
  const allRows = [];

  rows.forEach(row => {
    const select = row.querySelector('select');
    let selectId = select ? select.id : null;
    let selectedValue = select && select.selectedOptions.length > 0 ? getSelectedText(select) : '';

    // Если select заменён на span (длинный текст), берём текст из span
    if (!select) {
      const span = row.querySelector('span');
      if (span) {
        // Извлекаем ID из класса span (например, single-option-row не содержит ID)
        // Берём ID из первого select в строке (если был) или из data-атрибута
        selectId = row.dataset.selectId || null;
        selectedValue = span.textContent.trim();
      }
    }

    const fixedValue1 = row.cells[0].textContent.trim();
    const fixedValue2 = row.cells[2].textContent.trim();
    allRows.push({ selectId, fixedValue1, selectedValue, fixedValue2 });
  });

  return allRows;
}

/**
 * Рассчитать исключения по правилам "Удалить" и количеству типов
 * @param {Array} allRows - все строки
 * @returns {Object} объект с правилами исключения
 */
function calculateExclusions(allRows) {
  return {
    gpu: calculateExcludeRule(allRows, CONFIG.EXCLUSION_RULES.GPU),
    controller: calculateExcludeRule(allRows, CONFIG.EXCLUSION_RULES.CONTROLLER),
    controller3: calculateExcludeRule(allRows, CONFIG.EXCLUSION_RULES.CONTROLLER_3),
    hba: calculateExcludeRule(allRows, CONFIG.EXCLUSION_RULES.HBA),
    drives: getNumberValue(CONFIG.ELEMENTS.DRIVE_COUNT) === 0,
    hbaRows: getNumberValue(CONFIG.ELEMENTS.HBA_COUNT) === 0
  };
}

/**
 * Рассчитать правило исключения по триггеру
 * @param {Array} allRows - все строки
 * @param {Object} rule - правило исключения
 * @returns {Object} { trigger: bool, exclude: string[] }
 */
function calculateExcludeRule(allRows, rule) {
  const triggerRow = allRows.find(r => r.selectId === rule.trigger);
  const excludeTrigger = triggerRow && triggerRow.selectedValue.includes('Удалить');
  return {
    trigger: excludeTrigger,
    exclude: rule.exclude
  };
}

/**
 * Собрать значения drive-3 и drive-5 для каждого типа
 * @param {Array} allRows - все строки
 * @returns {Object} объекты drive3Values и drive5Values
 */
function collectDriveValues(allRows) {
  const drive3Values = {};
  const drive5Values = {};

  // drive-3-N
  allRows.filter(r => r.selectId && /^drive-3/.test(r.selectId)).forEach(row => {
    const type = extractType(row.selectId);
    if (!drive3Values[type]) drive3Values[type] = {};
    drive3Values[type][3] = row.selectedValue;
  });

  // drive-5-N
  allRows.filter(r => r.selectId && /^drive-5/.test(r.selectId)).forEach(row => {
    const type = extractType(row.selectId);
    if (!drive5Values[type]) drive5Values[type] = {};
    drive5Values[type][5] = row.selectedValue;
  });

  return { drive3Values, drive5Values };
}

/**
 * Отфильтровать строки по правилам исключения
 * @param {Array} allRows - все строки
 * @param {Object} exclusions - правила исключения
 * @param {Object} driveValues - значения drive
 * @returns {string[][]} отфильтрованные данные
 */
function filterRows(allRows, exclusions, driveValues) {
  const data = [];

  allRows.forEach(item => {
    // Исключаем строки "Удалить"
    if (item.selectedValue.includes('Удалить')) return;

    // Исключаем drive-строки если driveCount = 0
    if (exclusions.drives && item.selectId && item.selectId.startsWith('drive-')) return;

    // Исключаем hba-строки если hbaCount = 0
    if (exclusions.hbaRows && item.selectId && item.selectId.startsWith('hba-')) return;

    // Исключаем по правилам "Удалить"
    if (exclusions.gpu.trigger && exclusions.gpu.exclude.includes(item.selectId)) return;
    if (exclusions.controller.trigger && exclusions.controller.exclude.includes(item.selectId)) return;
    if (exclusions.controller3.trigger && exclusions.controller3.exclude.includes(item.selectId)) return;
    if (exclusions.hba.trigger && exclusions.hba.exclude.includes(item.selectId)) return;

    // drive-5-N: исключаем если drive-3 не SATA/SAS
    if (/^drive-5/.test(item.selectId)) {
      const type = extractType(item.selectId);
      const drive3Value = driveValues.drive3Values[type] ? driveValues.drive3Values[type][3] : '';
      if (drive3Value !== 'SATA' && drive3Value !== 'SAS') return;
    }

    // drive-6-N: исключаем если drive-3 не SATA/SAS ИЛИ drive-5 не HDD
    if (/^drive-6/.test(item.selectId)) {
      const type = extractType(item.selectId);
      const drive3Value = driveValues.drive3Values[type] ? driveValues.drive3Values[type][3] : '';
      if (drive3Value !== 'SATA' && drive3Value !== 'SAS') return;
      const drive5Value = driveValues.drive5Values[type] ? driveValues.drive5Values[type][5] : '';
      if (drive5Value !== 'HDD') return;
    }

    // network-6-N: исключаем если заблокирован
    if (/^network-6/.test(item.selectId)) {
      const select = getElement(item.selectId);
      if (select && select.disabled) return;
    }

    data.push([item.fixedValue1, item.selectedValue, item.fixedValue2]);
  });

  return data;
}
