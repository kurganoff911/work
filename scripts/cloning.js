// Логика клонирования строк

/**
 * Клонирование HBA-строк
 */
function cloneHba() {
  const count = getNumberValue(CONFIG.ELEMENTS.HBA_COUNT);
  const container = getElement(CONFIG.ELEMENTS.HBA_CONTAINER);
  if (!container) return;

  removeClones(container);

  // Если 0, скрываем контейнер
  if (count === 0) {
    container.style.display = 'none';
    checkRows();
    return;
  }

  container.style.display = '';

  // Если только 1 тип, ничего не клонируем
  if (count === 1) {
    checkRows();
    return;
  }

  const baseRows = getBaseRows(container);

  // Клонируем строки для каждого дополнительного типа
  for (let type = 2; type <= count; type++) {
    baseRows.forEach((baseRow, index) => {
      const clone = baseRow.cloneNode(true);
      clone.classList.add('clone');

      // Обновляем id селектов
      const select = clone.querySelector('select');
      if (select) {
        select.id = `hba-${index + 1}-${type}`;
        const options = driveOptions[`hba-${index + 1}`];
        if (options) {
          populateSelect(select, options);
          applySingleLongOption(select);
        }
      }

      // Заменяем "(тип 1)" на "(тип 2)" и т.д.
      const cells = clone.querySelectorAll('td');
      cells.forEach(cell => {
        cell.innerHTML = replaceTypeInText(cell.innerHTML, type);
      });

      container.appendChild(clone);
    });
  }

  checkRows();
}

/**
 * Клонирование drive-строк
 */
function cloneDrives() {
  const count = getNumberValue(CONFIG.ELEMENTS.DRIVE_COUNT) || 1;
  const container = getElement(CONFIG.ELEMENTS.DRIVE_CONTAINER);
  if (!container) return;

  removeClones(container);

  // Если только 1 тип, ничего не клонируем
  if (count === 1) return;

  const baseRows = getBaseRows(container);

  // Клонируем строки для каждого дополнительного типа
  for (let type = 2; type <= count; type++) {
    baseRows.forEach((baseRow, index) => {
      const clone = baseRow.cloneNode(true);
      clone.classList.add('clone');

      // Обновляем id селектов
      const select = clone.querySelector('select');
      if (select) {
        select.id = `drive-${index + 1}-${type}`;
        const options = driveOptions[`drive-${index + 1}`];
        if (options) {
          populateSelect(select, options);
          applySingleLongOption(select);
        }
      }

      // Заменяем "(тип 1)" на "(тип 2)" и т.д.
      const cells = clone.querySelectorAll('td');
      cells.forEach(cell => {
        cell.innerHTML = replaceTypeInText(cell.innerHTML, type);
      });

      container.appendChild(clone);
    });
  }

  // Обновляем drive-5 и drive-6 после клонирования
  updateDriveAfterClone(count);
  checkRows();
}

/**
 * Обновление drive-5-N и drive-6-N после клонирования
 * @param {number} count - количество типов
 */
function updateDriveAfterClone(count) {
  for (let type = 2; type <= count; type++) {
    const drive3Clone = getElement(`drive-3-${type}`);
    const drive5Clone = getElement(`drive-5-${type}`);
    const drive6Clone = getElement(`drive-6-${type}`);

    if (drive3Clone && drive5Clone && drive6Clone) {
      const drive3Text = getSelectedText(drive3Clone);
      const drive5Text = getSelectedText(drive5Clone);
      const isSataOrSas = drive3Text === 'SATA' || drive3Text === 'SAS';
      const isHdd = drive5Text === 'HDD';
      const shouldDisable = !isSataOrSas || !isHdd;

      if (!isSataOrSas) {
        drive5Clone.value = drive5Clone.options[0] ? drive5Clone.options[0].value : '';
      }
      toggleSelect(drive6Clone, shouldDisable);
    }
  }
}

/**
 * Клонирование network-строк
 */
function cloneNetworks() {
  const count = getNumberValue(CONFIG.ELEMENTS.NETWORK_COUNT) || 1;
  const container = getElement(CONFIG.ELEMENTS.NETWORK_CONTAINER);
  if (!container) return;

  removeClones(container);

  // Если только 1 тип, ничего не клонируем
  if (count === 1) return;

  const baseRows = getBaseRows(container);

  // Клонируем строки для каждого дополнительного типа
  for (let type = 2; type <= count; type++) {
    baseRows.forEach((baseRow, index) => {
      const clone = baseRow.cloneNode(true);
      clone.classList.add('clone');

      // Обновляем id селектов
      const select = clone.querySelector('select');
      if (select) {
        select.id = `network-${index + 1}-${type}`;
        const options = networkOptions[`network-${index + 1}`];
        if (options) {
          populateSelect(select, options);
          applySingleLongOption(select);
        }
      }

      // Заменяем "(тип 1)" на "(тип 2)" и т.д. (регистронезависимо)
      const cells = clone.querySelectorAll('td');
      cells.forEach(cell => {
        cell.innerHTML = replaceTypeInTextCaseInsensitive(cell.innerHTML, type);
      });

      container.appendChild(clone);
    });
  }

  // После клонирования проверяем network-6 для каждого типа
  updateNetwork6AfterClone(count);
}

/**
 * Заполнить селект опциями
 * @param {HTMLElement} select - элемент select
 * @param {string[]} options - массив текстов опций
 */
function populateSelect(select, options) {
  select.innerHTML = '';
  options.forEach(optText => {
    const option = document.createElement('option');
    option.textContent = optText;
    select.appendChild(option);
  });
}

/**
 * Если в селекте одна опция и текст длинный — показать как текст
 * @param {HTMLElement} select - элемент select
 */
function applySingleLongOption(select) {
  if (!select || !select.options || select.options.length !== 1) return;

  const TEXT_THRESHOLD = 30;
  const text = select.options[0].text;

  if (text.length > TEXT_THRESHOLD) {
    // Сохраняем ID селекта в data-атрибут строки
    const row = select.closest('tr');
    if (row) {
      row.dataset.selectId = select.id;
    }

    // Заменяем select на span с текстом
    const span = document.createElement('span');
    span.textContent = text;
    span.style.whiteSpace = 'normal';
    span.style.wordWrap = 'break-word';
    span.style.display = 'block';

    const cell = select.closest('td');
    if (cell) {
      cell.innerHTML = '';
      cell.appendChild(span);
      // Помечаем строку для подсветки
      row.classList.add('single-option-row');
      // Сразу применяем зелёный фон (как для единственной опции)
      row.style.backgroundColor = '#90EE90';
    }
  }
}
