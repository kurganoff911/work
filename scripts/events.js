// Привязка событий

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
  });

  // HBA: если hba-1 = "Удалить", блокируем hba-2, hba-3, hba-4
  getElement('hba-1').addEventListener('change', function () {
    handleDeleteRule('hba-1', ['hba-2', 'hba-3', 'hba-4']);
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
 * Инициализация обработчиков экспорта
 */
function initExportHandlers() {
  getElement(CONFIG.ELEMENTS.EXPORT_BTN)
    .addEventListener('click', exportToExcel);

  getElement(CONFIG.ELEMENTS.EXPORT_WORD_BTN)
    .addEventListener('click', exportToWord);
}
