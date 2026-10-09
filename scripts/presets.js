// Загрузка и применение пресетов

// Текущий пресет
let currentPreset = getStorageValue('currentPreset', 'standart');

// Опции для drive и network
let driveOptions = {};
let networkOptions = {};

/**
 * Применить пресет
 * @param {string} presetName - имя пресета
 */
function applyPreset(presetName) {
  removeStorageValue('currentPreset');

  // Загружаем общие файлы
  const commonPromises = CONFIG.COMMON_FILES.map(file =>
    fetch(CONFIG.PRESETS_PATH + file)
      .then(res => {
        if (!res.ok) throw new Error(`Ошибка загрузки ${file}`);
        return res.json();
      })
  );

  Promise.all(commonPromises)
    .then(commonResults => {
      const commonOptions = Object.assign({}, ...commonResults);

      // Загружаем специфичный пресет
      const presetFile = CONFIG.PRESET_FILES[presetName];

      fetch(CONFIG.PRESETS_PATH + presetFile)
        .then(res => {
          if (!res.ok) throw new Error(`Ошибка загрузки ${presetFile}`);
          return res.json();
        })
        .then(presetOptions => {
          const allOptions = { ...commonOptions, ...presetOptions };
          updateSelects(allOptions);

          // Применяем drive-опции
          applyDriveOptions(commonOptions);

          // Применяем network-опции
          applyNetworkOptions(commonOptions);

          // Инициализация HBA
          initHba();

          // Проверка и подсветка строк
          checkRows();

          // Применяем подсказки из пресета
          applyHints(presetOptions.hints || {});

          // Инициализация: запускаем обработчики для "Удалить"
          initDeleteHandlers();

          // Инициализация: запускаем обработчики для клонов HBA
          initHbaClones();

          currentPreset = presetName;
          setStorageValue('currentPreset', presetName);
        })
        .catch(err => {
          console.error('Ошибка загрузки специфичного файла:', err);
        });
    })
    .catch(err => {
      console.error('Ошибка загрузки общих файлов:', err);
    });
}

/**
 * Применить drive-опции ко всем drive-селектам
 * @param {Object} options - опции
 */
function applyDriveOptions(options) {
  driveOptions = options;

  const driveSelects = document.querySelectorAll('[id^="drive-"]');
  driveSelects.forEach(select => {
    const parts = select.id.split('-');
    const driveIndex = parseInt(parts[1]);
    const opts = options[`drive-${driveIndex}`];
    if (opts) {
      populateSelect(select, opts);
    }
  });

  // Если driveCount > 1, клонируем строки
  const driveCount = getNumberValue(CONFIG.ELEMENTS.DRIVE_COUNT) || 1;
  if (driveCount > 1) {
    cloneDrives();
  } else {
    updateDrive5();
    updateDrive6();
  }
}

/**
 * Применить network-опции ко всем network-селектам
 * @param {Object} options - опции
 */
function applyNetworkOptions(options) {
  networkOptions = options;

  const networkSelects = document.querySelectorAll('[id^="network-"]');
  networkSelects.forEach(select => {
    const parts = select.id.split('-');
    const networkIndex = parseInt(parts[1]);
    const opts = options[`network-${networkIndex}`];
    if (opts) {
      populateSelect(select, opts);
    }
  });

  // Если networkCount > 1, клонируем строки
  const networkCount = getNumberValue(CONFIG.ELEMENTS.NETWORK_COUNT) || 1;
  if (networkCount > 1) {
    cloneNetworks();
  } else {
    updateNetwork6AfterClone(1);
  }
}

/**
 * Инициализация HBA
 */
function initHba() {
  const hbaCount = getNumberValue(CONFIG.ELEMENTS.HBA_COUNT);
  if (hbaCount > 0) {
    cloneHba();
  }
}

/**
 * Инициализация: запускаем обработчики для "Удалить"
 */
function initDeleteHandlers() {
  ['gpu-1', 'controller-1', 'hba-1', 'controller-3'].forEach(id => {
    const el = getElement(id);
    if (el) el.dispatchEvent(new Event('change'));
  });
}

/**
 * Инициализация: запускаем обработчики для клонов HBA
 */
function initHbaClones() {
  const hbaCountVal = getNumberValue(CONFIG.ELEMENTS.HBA_COUNT);
  if (hbaCountVal > 1) {
    for (let type = 2; type <= hbaCountVal; type++) {
      const hba1Clone = getElement(`hba-1-${type}`);
      if (hba1Clone) hba1Clone.dispatchEvent(new Event('change'));
    }
  }
}

/**
 * Загрузить примечания из notes.json
 */
function loadNotes() {
  fetch(CONFIG.PRESETS_PATH + 'notes.json')
    .then(res => res.json())
    .then(notes => {
      NOTE_TEXTS = notes;
    })
    .catch(err => {
      console.error('Ошибка загрузки notes.json:', err);
    });
}

/**
 * Заполнить все селекті опциями
 * @param {Object} options - объект { selectId: [options] }
 */
function updateSelects(options) {
  for (const selectId in options) {
    const select = getElement(selectId);
    if (select) {
      populateSelect(select, options[selectId]);
      select.disabled = options[selectId].length <= 1;
    }
  }
}

/**
 * Применить подсказки из пресета к ячейкам .hint
 * @param {Object} hints - объект { selectId: hintText }
 */
function applyHints(hints) {
  if (!hints || Object.keys(hints).length === 0) return;

  for (const selectId in hints) {
    const select = getElement(selectId);
    if (!select) continue;

    const row = select.closest('tr');
    if (!row) continue;

    const hintCell = row.querySelector('.hint');
    if (hintCell) {
      hintCell.textContent = hints[selectId];
    }
  }
}
