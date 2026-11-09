// Загрузка и применение пресетов

// Текущий пресет
let currentPreset = getStorageValue('currentPreset', 'R220G3');

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

          // Проверка и подсветка строк
          checkRows();

          // Применяем подсказки из пресета
          applyHints(presetOptions.hints || {});

          // Применяем правила пресета
          applyPresetRules(presetOptions.rules || {});

          // Настраиваем слушатели для динамического применения правил
          setupRuleListeners(presetOptions.rules || {});

          // Инициализация: запускаем обработчики для "Удалить"
          ['gpu-1', 'hba-1', 'controller-3'].forEach(id => {
            const el = getElement(id);
            if (el) el.dispatchEvent(new Event('change'));
          });
          // controller-1 обрабатывается отдельно
          handleController1Delete();

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
 * Применить правила, специфичные для пресета
 * @param {Object} rules - объект правил { ruleName: { trigger, target, action } }
 */
function applyPresetRules(rules) {
  for (const ruleName in rules) {
    const rule = rules[ruleName];
    const triggerEl = getElement(rule.trigger);
    if (!triggerEl) continue;

    const selectedText = getSelectedText(triggerEl);

    // Проверка условия
    let conditionMet = false;
    if (rule.condition) {
      conditionMet = selectedText === rule.condition;
    } else {
      conditionMet = selectedText.includes(rule.conditionText || 'Удалить');
    }

    if (!conditionMet) continue;

    // Применение действия
    applyRuleAction(rule);
  }

  checkRows();
}

/**
 * Применить действие правила
 * @param {Object} rule - правило
 */
function applyRuleAction(rule) {
  const targetEl = getElement(rule.target);
  if (!targetEl) return;

  if (rule.action === 'hide') {
    const row = targetEl.closest('tr');
    if (row) {
      row.style.display = 'none';
      row.style.removeProperty('background-color');
    }
  } else if (rule.action === 'disable') {
    targetEl.disabled = true;
    targetEl.value = '';
  } else if (rule.action === 'clear') {
    targetEl.value = '';
  } else if (rule.action === 'setValue') {
    // Ищем опцию по точному или частичному совпадению
    let matched = false;
    for (let i = 0; i < targetEl.options.length; i++) {
      if (targetEl.options[i].text === rule.value) {
        targetEl.value = targetEl.options[i].value;
        matched = true;
        break;
      }
    }
    // Если точного совпадения нет, ищем частичное
    if (!matched) {
      for (let i = 0; i < targetEl.options.length; i++) {
        if (targetEl.options[i].text.includes(rule.value)) {
          targetEl.value = targetEl.options[i].value;
          break;
        }
      }
    }
  }
}

/**
 * Настроить слушатели для правил (динамическое применение)
 * @param {Object} rules - объект правил
 */
function setupRuleListeners(rules) {
  for (const ruleName in rules) {
    const rule = rules[ruleName];
    const triggerEl = getElement(rule.trigger);
    if (!triggerEl) continue;

    // Сохраняем правило в элементе
    triggerEl._presetRule = rule;

    // Добавляем слушатель на change
    triggerEl.addEventListener('change', function onRuleChange() {
      const r = this._presetRule;
      if (!r) return;

      const selectedText = getSelectedText(this);

      let conditionMet = false;
      if (r.condition) {
        conditionMet = selectedText === r.condition;
      } else {
        conditionMet = selectedText.includes(r.conditionText || 'Удалить');
      }

      if (conditionMet) {
        applyRuleAction(r);
        checkRows();
      }
    });
  }
}

/**
 * Применить опции ко всем селектам с данным префиксом
 * @param {string} prefix - префикс (drive, network)
 * @param {string} optionsVar - имя переменной для хранения (driveOptions, networkOptions)
 * @param {string} countId - ID input для количества
 * @param {Function} cloneFn - функция клонирования
 * @param {Function} updateFn - функция обновления после клонирования
 * @param {Object} options - опции из пресета
 */
function applyOptions(prefix, optionsVar, countId, cloneFn, updateFn, options) {
  // Сохраняем опции в глобальную переменную
  window[optionsVar] = options;

  const selects = document.querySelectorAll(`[id^="${prefix}-"]`);
  selects.forEach(select => {
    const parts = select.id.split('-');
    const index = parseInt(parts[1]);
    const opts = options[`${prefix}-${index}`];
    if (opts) {
      populateSelect(select, opts);
      applySingleLongOption(select);
    }
  });

  // Если количество > 1, клонируем строки
  const count = getNumberValue(countId) || 1;
  if (count > 1) {
    cloneFn();
  } else {
    updateFn();
  }
}

/**
 * Применить drive-опции ко всем drive-селектам
 * @param {Object} options - опции
 */
function applyDriveOptions(options) {
  applyOptions('drive', 'driveOptions', CONFIG.ELEMENTS.DRIVE_COUNT, cloneDrives, () => {
    updateDrive5();
    updateDrive6();
  }, options);
}

/**
 * Применить network-опции ко всем network-селектам
 * @param {Object} options - опции
 */
function applyNetworkOptions(options) {
  applyOptions('network', 'networkOptions', CONFIG.ELEMENTS.NETWORK_COUNT, cloneNetworks, () => {
    updateNetwork6AfterClone(1);
  }, options);
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
 * Заполнить все селекты опциями
 * @param {Object} options - объект { selectId: [options] }
 */
function updateSelects(options) {
  for (const selectId in options) {
    const select = getElement(selectId);
    if (select) {
      populateSelect(select, options[selectId]);
      // controller-4 управляется через controller-1, не блокируем здесь
      if (selectId !== 'controller-4') {
        select.disabled = options[selectId].length <= 1;
      }
      applySingleLongOption(select);
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
