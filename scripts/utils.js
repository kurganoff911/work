// Утилиты и вспомогательные функции

/**
 * Включить/отключить селект и установить значение
 * @param {HTMLElement} el - элемент select
 * @param {boolean} shouldDisable - отключить или включить
 */
function toggleSelect(el, shouldDisable) {
  if (!el) return;
  el.disabled = shouldDisable;
  if (shouldDisable) {
    el.value = '';
  } else {
    el.value = el.options[0] ? el.options[0].value : '';
  }
}

/**
 * Получить текст выбранной опции селекта
 * @param {HTMLElement} select - элемент select
 * @returns {string} текст выбранной опции
 */
function getSelectedText(select) {
  if (!select || !select.selectedOptions || select.selectedOptions.length === 0) {
    return '';
  }
  return select.selectedOptions[0].text;
}

/**
 * Извлечь номер типа из ID элемента (hba-1-2 -> 2, drive-3 -> 1)
 * @param {string} id - ID элемента
 * @returns {number} номер типа
 */
function extractType(id) {
  const match = id.match(/-(\d+)$/);
  return match ? parseInt(match[1]) : 1;
}

/**
 * Заменить номер типа в тексте ячейки (тип 1 -> тип N)
 * @param {string} html - HTML ячейки
 * @param {number} type - новый номер типа
 * @returns {string} обновлённый HTML
 */
function replaceTypeInText(html, type) {
  return html
    .replace(/\(тип \d+\)/g, `(тип ${type})`)
    .replace(/Тип \d+/g, `Тип ${type}`);
}

/**
 * Заменить номер типа в тексте ячейки (Тип 1 -> Тип N, регистронезависимо)
 * @param {string} html - HTML ячейки
 * @param {number} type - новый номер типа
 * @returns {string} обновлённый HTML
 */
function replaceTypeInTextCaseInsensitive(html, type) {
  return html.replace(/\(Тип \d+\)/gi, `(Тип ${type})`);
}

/**
 * Получить значение из localStorage или значение по умолчанию
 * @param {string} key - ключ
 * @param {string} defaultValue - значение по умолчанию
 * @returns {string} значение
 */
function getStorageValue(key, defaultValue) {
  return localStorage.getItem(key) || defaultValue;
}

/**
 * Сохранить значение в localStorage
 * @param {string} key - ключ
 * @param {string} value - значение
 */
function setStorageValue(key, value) {
  localStorage.setItem(key, value);
}

/**
 * Удалить значение из localStorage
 * @param {string} key - ключ
 */
function removeStorageValue(key) {
  localStorage.removeItem(key);
}

/**
 * Получить DOM-элемент по ID
 * @param {string} id - ID элемента
 * @returns {HTMLElement|null} элемент
 */
function getElement(id) {
  return document.getElementById(id);
}

/**
 * Получить значение числового input или 0
 * @param {string} id - ID элемента
 * @returns {number} значение
 */
function getNumberValue(id) {
  const el = getElement(id);
  return el ? (parseInt(el.value) || 0) : 0;
}

/**
 * Удалить все клонированные строки из контейнера
 * @param {HTMLElement} container - контейнер
 */
function removeClones(container) {
  const clones = container.querySelectorAll('tr.clone');
  clones.forEach(row => row.remove());
}

/**
 * Получить базовые строки из контейнера
 * @param {HTMLElement} container - контейнер
 * @returns {NodeList} базовые строки
 */
function getBaseRows(container) {
  return container.querySelectorAll('tr:not(.clone)');
}
