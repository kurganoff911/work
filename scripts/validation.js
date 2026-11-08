// Условная логика и правила валидации

// ============================================
// DRIVE RULES
// ============================================

/**
 * Drive-3: если выбрано не SATA и не SAS, скрываем drive-6
 */
function updateDrive5() {
  const drive3 = getElement('drive-3');
  if (!drive3) return;
  
  const selectedText = getSelectedText(drive3);
  const isSataOrSas = selectedText === 'SATA' || selectedText === 'SAS';

  // Если drive-3 не SATA/SAS, drive-5 = SSD
  const drive5 = getElement('drive-5');
  if (drive5 && !isSataOrSas) {
    drive5.value = drive5.options.length > 0 ? drive5.options[0].value : '';
    // Явно вызываем updateDrive6, т.к. change не сработает
    updateDrive6();
    return;
  }

  // drive-6 блокируется, если drive-3 не SATA/SAS ИЛИ drive-5 не HDD
  const drive6 = getElement('drive-6');
  if (drive6 && drive5) {
    const drive5Text = getSelectedText(drive5);
    const isHdd = drive5Text === 'HDD';
    const shouldDisable = !isSataOrSas || !isHdd;
    toggleSelect(drive6, shouldDisable);
  }

  checkRows();
}

/**
 * Drive-5: если выбрано не HDD, блокируем drive-6
 */
function updateDrive6() {
  const drive5 = getElement('drive-5');
  if (!drive5) return;
  
  const selectedText = getSelectedText(drive5);
  const isHdd = selectedText === 'HDD';

  const drive6 = getElement('drive-6');
  if (drive6) {
    drive6.disabled = !isHdd;
    if (!isHdd) {
      drive6.value = '';
    } else {
      drive6.value = drive6.options[0] ? drive6.options[0].value : '';
    }
  }

  checkRows();
}

// ============================================
// NETWORK RULES
// ============================================

/**
 * Network-2: network-6 заблокирована по умолчанию, разблокируется если network-2 ≠ Ethernet
 */
function updateNetwork6() {
  const network2 = getElement('network-2');
  if (!network2) return;
  
  const selectedText = getSelectedText(network2);
  const isEthernet = selectedText === 'Ethernet';

  // Обновляем ТОЛЬКО базовый network-6
  const network6 = getElement('network-6');
  if (!network6) return;

  toggleSelect(network6, isEthernet);
  checkRows();
}

/**
 * Обновление network-6 для каждого типа
 * @param {number} count - количество типов
 */
function updateNetwork6AfterClone(count) {
  // Базовый network-6 проверяет network-2
  const network2 = getElement('network-2');
  const network6 = getElement('network-6');
  if (network2 && network6) {
    const isEthernet = getSelectedText(network2) === 'Ethernet';
    toggleSelect(network6, isEthernet);
  }

  // Клонированные network-6-N проверяют network-2-N
  for (let type = 2; type <= count; type++) {
    const network2Clone = getElement(`network-2-${type}`);
    const network6Clone = getElement(`network-6-${type}`);
    if (network2Clone && network6Clone) {
      const isEthernet = getSelectedText(network2Clone) === 'Ethernet';
      toggleSelect(network6Clone, isEthernet);
    }
  }

  checkRows();
}

// ============================================
// DELETE RULES (Удалить)
// ============================================

/**
 * Обработчик: если элемент = "Удалить", блокируем связанные элементы
 * @param {string} triggerId - ID триггерного элемента
 * @param {string[]} excludeKeys - массив ID элементов для блокировки
 */
function handleDeleteRule(triggerId, excludeKeys) {
  const el = getElement(triggerId);
  if (!el) return;

  const shouldDisable = getSelectedText(el).includes('Удалить');
  excludeKeys.forEach(key => {
    toggleSelect(getElement(key), shouldDisable);
  });
  checkRows();
}

/**
 * Обработчик controller-1: скрывает controller-4 если "Удалить", иначе блокирует
 */
function handleController1Delete() {
  const controller1 = getElement('controller-1');
  if (!controller1) return;

  const isDelete = getSelectedText(controller1).includes('Удалить');
  const controller4 = getElement('controller-4');
  if (!controller4) return;

  if (isDelete) {
    // controller-1 = "Удалить" → скрываем controller-4
    const row = controller4.closest('tr');
    if (row) {
      row.style.display = 'none';
      row.style.removeProperty('background-color');
    }
  } else {
    // controller-1 ≠ "Удалить" → блокируем controller-4 (зелёный)
    toggleSelect(controller4, true);
    const row = controller4.closest('tr');
    if (row) {
      row.style.display = '';
      row.style.backgroundColor = CONFIG.STYLES.DISABLED_ROW;
    }
  }
}

/**
 * Обработчик: если controller-3 = "Удалить", очищаем controller-2
 */
function handleController3Delete() {
  const controller3 = getElement('controller-3');
  if (!controller3) return;

  const shouldClear = getSelectedText(controller3).includes('Удалить');
  toggleSelect(getElement('controller-2'), shouldClear);
}

/**
 * Обработчик для клонированных drive-N-TYPE
 * @param {Event} e - событие change
 */
function handleDriveCloneChange(e) {
  const select = e.target;
  const match = select.id.match(/^drive-(\d+)-(\d+)$/);
  if (!match) return;

  const index = parseInt(match[1]);
  const type = parseInt(match[2]);

  // drive-3-N → drive-5-N
  if (index === 3) {
    const drive5Clone = getElement(`drive-5-${type}`);
    const isSataOrSas = getSelectedText(select) === 'SATA' || getSelectedText(select) === 'SAS';

    if (drive5Clone && !isSataOrSas) {
      drive5Clone.value = drive5Clone.options[0] ? drive5Clone.options[0].value : '';
    }

    checkRows();
  }

  // drive-5-N → drive-6-N
  if (index === 5) {
    const drive6Clone = getElement(`drive-6-${type}`);
    if (drive6Clone) {
      const isHdd = getSelectedText(select) === 'HDD';
      toggleSelect(drive6Clone, !isHdd);
      checkRows();
    }
  }
}

/**
 * Обработчик для клонированных network-2-N
 * @param {Event} e - событие change
 */
function handleNetworkCloneChange(e) {
  const select = e.target;
  const match = select.id.match(/^network-(\d+)-(\d+)$/);
  if (!match) return;

  const index = parseInt(match[1]);
  const type = parseInt(match[2]);

  // Если изменился network-N-TYPE, проверяем network-6-TYPE
  if (index === 2) {
    const network6Clone = getElement(`network-6-${type}`);
    const isEthernet = getSelectedText(select) === 'Ethernet';
    toggleSelect(network6Clone, isEthernet);
    checkRows();
  }
}
