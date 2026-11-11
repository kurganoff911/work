// Привязка событий

// Базовые оригинальные значения корзины (неизменяемые)
let defaultBasketValues = { select18: '', select19: '' };

/**
 * Инициализация всех событий
 */
function initEvents() {
  // Загружаем тексты примечаний
  loadNotes();

  // Применяем текущий пресет
  applyPreset(currentPreset);

  // Выбор пресета
  getElement(CONFIG.ELEMENTS.PRESET_SELECTOR)
    .addEventListener('change', function (e) {
      applyPreset(e.target.value);
    });

  // Клонирование drive-строк
  getElement(CONFIG.ELEMENTS.DRIVE_COUNT)
    .addEventListener('input', cloneDrives);
  getElement('applyDriveBtn')
    .addEventListener('click', cloneDrives);

  // Клонирование network-строк
  getElement(CONFIG.ELEMENTS.NETWORK_COUNT)
    .addEventListener('input', cloneNetworks);
  getElement('applyNetworkBtn')
    .addEventListener('click', cloneNetworks);

  // Обработчики "Удалить"
  initDeleteEventListeners();

  // Базовые обработчики drive/network
  initBaseEventListeners();

  // Делегирование событий для клонов
  initCloneEventDelegation();

  // Скрываем строки с пустыми селекторами при изменении любого селектора
  initAllSelectsChangeHandler();

  // Экспорт
  initExportHandlers();
}

/**
 * Инициализация обработчиков "Удалить"
 */
function initDeleteEventListeners() {
  // Controller-1: скрывает controller-4 и блокирует controller-2,3, select-59
  getElement('controller-1').addEventListener('change', function () {
    handleController1Delete();
    const isDelete = getSelectedText(getElement('controller-1')).includes('Удалить');
    toggleSelect(getElement('controller-2'), isDelete);
    toggleSelect(getElement('controller-3'), isDelete);
    toggleSelect(getElement('select-59'), isDelete);
    checkRows();
  });

  // Контроллер-3: если "Удалить", очищаем controller-2
  getElement('controller-3').addEventListener('change', handleController3Delete);

  // GPU: если gpu-1 = "Удалить", блокируем gpu-2...gpu-8
  getElement('gpu-1').addEventListener('change', function () {
    handleDeleteRule('gpu-1', ['gpu-2', 'gpu-3', 'gpu-4', 'gpu-5', 'gpu-6', 'gpu-7', 'gpu-8']);
    checkRows();
  });

  // HBA: если hba-1 = "Удалить", блокируем hba-2, hba-3, hba-4
  getElement('hba-1').addEventListener('change', function () {
    handleDeleteRule('hba-1', ['hba-2', 'hba-3', 'hba-4']);
    checkRows();
  });
}

/**
 * Инициализация базовых обработчиков drive/network
 */
function initBaseEventListeners() {
  getElement('drive-3').addEventListener('change', updateDrive5);
  getElement('drive-5').addEventListener('change', updateDrive6);
  getElement('network-2').addEventListener('change', updateNetwork6);
}

/**
 * Инициализация делегирования событий для клонов
 */
function initCloneEventDelegation() {
  // Делегирование для drive-N-TYPE
  const driveContainer = getElement(CONFIG.ELEMENTS.DRIVE_CONTAINER);
  if (driveContainer) {
    driveContainer.addEventListener('change', handleDriveCloneChange);
  }

  // Делегирование для network-2-N
  const networkContainer = getElement(CONFIG.ELEMENTS.NETWORK_CONTAINER);
  if (networkContainer) {
    networkContainer.addEventListener('change', handleNetworkCloneChange);
  }
}

/**
 * Инициализация обработчика изменения всех селектов
 */
function initAllSelectsChangeHandler() {
  const allSelects = document.querySelectorAll('#dataTable tbody select');
  allSelects.forEach(select => {
    select.addEventListener('change', checkRows);
  });
}

/**
 * Инициализация обработчиков типа передней корзины
 */
function initBasketTypeHandlers() {
  // Сохраняем оригинальные значения при инициализации
  const select18 = getElement('select-18');
  const select19 = getElement('select-19');
  if (select18) defaultBasketValues.select18 = select18.value;
  if (select19) defaultBasketValues.select19 = select19.value;

  // Обработчик для радиокнопок
  const radios = document.querySelectorAll('input[name="basketType"]');
  radios.forEach(radio => {
    radio.addEventListener('change', function () {
      if (this.value === 'LFF') {
        applyBasketType('LFF');
      } else if (this.value === 'SFF') {
        applyBasketType('SFF');
      }
    });
  });

  // Применяем правило для выбранной по умолчанию радиокнопки
  const checkedRadio = document.querySelector('input[name="basketType"]:checked');
  if (checkedRadio) {
    applyBasketType(checkedRadio.value);
  }
}

/**
 * Применить тип корзины
 * @param {string} type - 'LFF' или 'SFF'
 */
function applyBasketType(type) {
  const select18 = getElement('select-18');
  const select19 = getElement('select-19');

  if (!select18 || !select19) return;

  if (type === 'LFF') {
    // select-18 остается неизменным, select-19 = "Удалить"
    select18.value = defaultBasketValues.select18;
    const removeOption = findOptionByText(select19, 'Удалить');
    if (removeOption) {
      select19.value = removeOption.value;
    }
  } else if (type === 'SFF') {
    // select-19 остается неизменным, select-18 = "Удалить"
    select19.value = defaultBasketValues.select19;
    const removeOption = findOptionByText(select18, 'Удалить');
    if (removeOption) {
      select18.value = removeOption.value;
    }
  }

  checkRows();
}

/**
 * Найти опцию по тексту
 * @param {HTMLElement} select - элемент select
 * @param {string} text - текст опции
 * @returns {HTMLOptionElement|null}
 */
function findOptionByText(select, text) {
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].text === text) {
      return select.options[i];
    }
  }
  return null;
}

/**
 * Инициализация обработчиков экспорта
 */
function initExportHandlers() {
  getElement(CONFIG.ELEMENTS.EXPORT_BTN)
    .addEventListener('click', exportToExcel);

  getElement(CONFIG.ELEMENTS.EXPORT_WORD_BTN)
    .addEventListener('click', exportToWord);
}
