const PRESET_FILES = {
  'standart': 'standart.json',
  'urgent': 'urgent.json',
  'custom': 'custom.json'
};

const COMMON_FILES = [
  'processors.json',
  'memory.json',
  'storage.json',
  'controllers.json',
  'network.json',
  'gpu.json',
  'power.json'
];

const PRESETS_PATH = 'presets/';
let currentPreset = localStorage.getItem('currentPreset') || 'standart';
let driveOptions = {};
let networkOptions = {};

// Клонирование drive-строк
function cloneDrives() {
  const count = parseInt(document.getElementById('driveCount').value) || 1;
  if (count < 1) return;
  
  const container = document.getElementById('drive-container');
  if (!container) return;
  
  // Удаляем все клонированные строки (кроме базовых)
  const existingClones = container.querySelectorAll('tr.clone');
  existingClones.forEach(row => row.remove());
  
  // Если только 1 тип, ничего не клонируем
  if (count === 1) return;
  
  // Запрашиваем базовые строки ПОСЛЕ удаления клонов
  const baseRows = container.querySelectorAll('tr');
  
  // Клонируем строки для каждого дополнительного типа
  for (let type = 2; type <= count; type++) {
    baseRows.forEach((baseRow, index) => {
      const clone = baseRow.cloneNode(true);
      clone.classList.add('clone');
      
      // Обновляем id селектов
      const select = clone.querySelector('select');
      if (select) {
        select.id = `drive-${index + 1}-${type}`;
        // Заполняем селекты данными из presets
        const options = driveOptions[`drive-${index + 1}`];
        if (options) {
          select.innerHTML = '';
          options.forEach(optText => {
            const option = document.createElement('option');
            option.textContent = optText;
            select.appendChild(option);
          });
        }
      }
      
      // Заменяем "(тип 1)" на "(тип 2)" и т.д.
      const cells = clone.querySelectorAll('td');
      cells.forEach(cell => {
        cell.innerHTML = cell.innerHTML.replace(/\(тип \d+\)/g, `(тип ${type})`);
        cell.innerHTML = cell.innerHTML.replace(/Тип \d+/g, `Тип ${type}`);
      });
      
      container.appendChild(clone);
    });
  }
  
  // Обновляем drive-5 и drive-6 после клонирования
  updateDriveAfterClone(count);
  
  // Скрываем строки с пустыми селекторами
  checkRows();
}

// Обновление drive-5-N и drive-6-N после клонирования
function updateDriveAfterClone(count) {
  for (let type = 2; type <= count; type++) {
    const drive3Clone = document.getElementById(`drive-3-${type}`);
    const drive5Clone = document.getElementById(`drive-5-${type}`);
    const drive6Clone = document.getElementById(`drive-6-${type}`);
    
    // Если drive-3-N не SATA/SAS, drive-5-N = SSD
    if (drive3Clone && drive5Clone) {
      const isSataOrSas = drive3Clone.selectedOptions[0].text === 'SATA' || drive3Clone.selectedOptions[0].text === 'SAS';
      if (!isSataOrSas) {
        drive5Clone.value = drive5Clone.options[0] ? drive5Clone.options[0].value : '';
      }
    }
    
    // Если drive-3-N не SATA/SAS, скрываем drive-6-N
    if (drive3Clone && drive6Clone) {
      const isSataOrSas = drive3Clone.selectedOptions[0].text === 'SATA' || drive3Clone.selectedOptions[0].text === 'SAS';
      drive6Clone.disabled = !isSataOrSas;
      if (!isSataOrSas) {
        drive6Clone.value = '';
      } else {
        drive6Clone.value = drive6Clone.options[0] ? drive6Clone.options[0].value : '';
      }
    }
    
    // Если drive-5-N не HDD, скрываем drive-6-N
    if (drive5Clone && drive6Clone) {
      const isHdd = drive5Clone.selectedOptions[0].text === 'HDD';
      drive6Clone.disabled = !isHdd;
      if (!isHdd) {
        drive6Clone.value = '';
      } else {
        drive6Clone.value = drive6Clone.options[0] ? drive6Clone.options[0].value : '';
      }
    }
  }
}

// Клонирование network-строк
function cloneNetworks() {
  const count = parseInt(document.getElementById('networkCount').value) || 1;
  if (count < 1) return;
  
  const container = document.getElementById('network-container');
  if (!container) return;
  
  // Удаляем все клонированные строки (кроме базовых)
  const existingClones = container.querySelectorAll('tr.clone');
  existingClones.forEach(row => row.remove());
  
  // Если только 1 тип, ничего не клонируем
  if (count === 1) return;
  
  // Запрашиваем базовые строки ПОСЛЕ удаления клонов
  const baseRows = container.querySelectorAll('tr');
  
  // Клонируем строки для каждого дополнительного типа
  for (let type = 2; type <= count; type++) {
    baseRows.forEach((baseRow, index) => {
      const clone = baseRow.cloneNode(true);
      clone.classList.add('clone');
      
      // Обновляем id селектов
      const select = clone.querySelector('select');
      if (select) {
        select.id = `network-${index + 1}-${type}`;
        // Заполняем селекты данными из presets
        const options = networkOptions[`network-${index + 1}`];
        if (options) {
          select.innerHTML = '';
          options.forEach(optText => {
            const option = document.createElement('option');
            option.textContent = optText;
            select.appendChild(option);
          });
        }
      }
      
      // Заменяем "(тип 1)" на "(тип 2)" и т.д. (регистронезависимо)
      const cells = clone.querySelectorAll('td');
      cells.forEach(cell => {
        cell.innerHTML = cell.innerHTML.replace(/\(Тип \d+\)/gi, `(Тип ${type})`);
      });
      
      container.appendChild(clone);
    });
  }
  
  // После клонирования проверяем network-6 для каждого типа
  updateNetwork6AfterClone(count);
}

// Network-2: network-6 заблокирована по умолчанию, разблокируется если network-2 ≠ Ethernet
function updateNetwork6() {
  const network2 = document.getElementById('network-2');
  if (!network2) return;
  const selectedText = network2.selectedOptions[0].text;
  const isEthernet = selectedText === 'Ethernet';
  
  // Обновляем ТОЛЬКО базовый network-6
  const network6 = document.getElementById('network-6');
  if (!network6) return;
  
  network6.disabled = isEthernet;
  if (isEthernet) {
    network6.value = '';
  } else {
    network6.value = network6.options[0] ? network6.options[0].value : '';
  }
  
  checkRows();
}

// Обновление network-6 для каждого типа
function updateNetwork6AfterClone(count) {
  // Базовый network-6 проверяет network-2
  const network2 = document.getElementById('network-2');
  const network6 = document.getElementById('network-6');
  if (network2 && network6) {
    const isEthernet = network2.selectedOptions[0].text === 'Ethernet';
    network6.disabled = isEthernet;
    if (isEthernet) {
      network6.value = '';
    } else {
      network6.value = network6.options[0] ? network6.options[0].value : '';
    }
  }
  
  // Клонированные network-6-N проверяют network-2-N
  for (let type = 2; type <= count; type++) {
    const network2Clone = document.getElementById(`network-2-${type}`);
    const network6Clone = document.getElementById(`network-6-${type}`);
    if (network2Clone && network6Clone) {
      const isEthernet = network2Clone.selectedOptions[0].text === 'Ethernet';
      network6Clone.disabled = isEthernet;
      if (isEthernet) {
        network6Clone.value = '';
      } else {
        network6Clone.value = network6Clone.options[0] ? network6Clone.options[0].value : '';
      }
    }
  }
  
  checkRows();
}

// Drive-3: если выбрано не SATA и не SAS, скрываем drive-6
function updateDrive5() {
  const drive3 = document.getElementById('drive-3');
  if (!drive3) return;
  const selectedText = drive3.selectedOptions[0].text;
  const isSataOrSas = selectedText === 'SATA' || selectedText === 'SAS';
  
  // Если drive-3 не SATA/SAS, drive-5 = SSD
  const drive5 = document.getElementById('drive-5');
  if (drive5 && !isSataOrSas) {
    drive5.value = drive5.options.length > 0 ? drive5.options[0].value : '';
  }
  
  // Если drive-3 не SATA/SAS, скрываем drive-6
  const drive6 = document.getElementById('drive-6');
  if (drive6) {
    drive6.disabled = !isSataOrSas;
    if (!isSataOrSas) {
      drive6.value = '';
    } else {
      drive6.value = drive6.options[0] ? drive6.options[0].value : '';
    }
  }
  
  checkRows();
}

// Drive-5: если выбрано не HDD, блокируем drive-6
function updateDrive6() {
  const drive5 = document.getElementById('drive-5');
  if (!drive5) return;
  const selectedText = drive5.selectedOptions[0].text;
  const isHdd = selectedText === 'HDD';
  
  // Обновляем ТОЛЬКО базовый drive-6
  const drive6 = document.getElementById('drive-6');
  if (!drive6) return;
  
  drive6.disabled = !isHdd;
  if (!isHdd) {
    drive6.value = '';
  } else {
    drive6.value = drive6.options[0] ? drive6.options[0].value : '';
  }
  
  checkRows();
}

// Проверка и подсветка строк
function checkRows() {
  const driveCount = parseInt(document.getElementById('driveCount').value) || 0;
  const driveContainer = document.getElementById('drive-container');
  
  // Скрываем/показываем весь контейнер drive-строк
  if (driveContainer) {
    driveContainer.style.display = driveCount === 0 ? 'none' : '';
  }
  
  const table = document.getElementById('dataTable');
  const rows = table.querySelectorAll('tbody tr');
  
  rows.forEach(row => {
    const select = row.querySelector('select');
    if (select) {
      // Скрываем drive-6-N при drive-3-N не SATA/SAS
      if (select.id && /^drive-6/.test(select.id)) {
        const parts = select.id.split('-');
        const baseIndex = parseInt(parts[1]);
        const typeMatch = select.id.match(/-(\d+)$/);
        const type = typeMatch ? parseInt(typeMatch[1]) : 1;
        
        // Для базового drive-6 (type=1) проверяем drive-3, для клонов — drive-3-N
        const drive3Id = type === 1 ? 'drive-3' : `drive-3-${type}`;
        const drive3Clone = document.getElementById(drive3Id);
        if (drive3Clone) {
          const drive3Text = drive3Clone.selectedOptions[0].text;
          const isSataOrSas = drive3Text === 'SATA' || drive3Text === 'SAS';
          if (!isSataOrSas) {
            row.style.display = 'none';
            row.style.removeProperty('background-color');
            return;
          }
        }
      }
      
      // Скрываем network-6-N при блокировке (Ethernet)
      if (select.id && /^network-6/.test(select.id) && select.disabled) {
        row.style.display = 'none';
        row.style.removeProperty('background-color');
        return;
      }
      
      const selectedValue = select.selectedOptions[0] ? select.selectedOptions[0].text : '';
      if (!selectedValue || selectedValue.trim() === '') {
        row.style.display = 'none';
        row.style.removeProperty('background-color');
      } else if (selectedValue.includes('Удалить')) {
        row.style.display = '';
        row.style.backgroundColor = '#F08080';
      } else if (select.disabled) {
        // Остальные disabled (одно значение) — показываем с зелёным фоном
        row.style.display = '';
        row.style.backgroundColor = '#90EE90';
      } else {
        row.style.display = '';
        row.style.removeProperty('background-color');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  applyPreset(currentPreset);

  document.getElementById('presetSelector').addEventListener('change', function (e) {
    applyPreset(e.target.value);
  });

  document.getElementById('driveCount').addEventListener('input', function () {
    cloneDrives();
    checkRows();
  });

  document.getElementById('applyDriveBtn').addEventListener('click', function () {
    cloneDrives();
  });

  document.getElementById('networkCount').addEventListener('input', function () {
    cloneNetworks();
  });

  document.getElementById('applyNetworkBtn').addEventListener('click', function () {
    cloneNetworks();
  });

  // Контроллер: если controller-1 = "Удалить", блокируем controller-2,3,4 и select-59
  document.getElementById('controller-1').addEventListener('change', function () {
    const controllerKeys = ['controller-2', 'controller-3', 'controller-4', 'select-59'];
    const shouldDisable = this.selectedOptions[0].text.includes('Удалить');
    controllerKeys.forEach(key => {
      const el = document.getElementById(key);
      if (el) {
        el.disabled = shouldDisable;
        if (shouldDisable) {
          el.value = '';
        } else {
          el.value = el.options[0] ? el.options[0].value : '';
        }
      }
    });
  });

  // Контроллер-3: если "Удалить", очищаем controller-2
  document.getElementById('controller-3').addEventListener('change', function () {
    const shouldClear = this.selectedOptions[0].text.includes('Удалить');
    const controller2 = document.getElementById('controller-2');
    if (controller2) {
      if (shouldClear) {
        controller2.value = '';
      } else {
        controller2.value = controller2.options[0] ? controller2.options[0].value : '';
      }
    }
  });

  // GPU: если gpu-1 = "Удалить", блокируем gpu-2...gpu-8
  document.getElementById('gpu-1').addEventListener('change', function () {
    const gpuKeys = ['gpu-2', 'gpu-3', 'gpu-4', 'gpu-5', 'gpu-6', 'gpu-7', 'gpu-8'];
    const shouldDisable = this.selectedOptions[0].text.includes('Удалить');
    gpuKeys.forEach(key => {
      const el = document.getElementById(key);
      if (el) {
        el.disabled = shouldDisable;
        if (shouldDisable) {
          el.value = '';
        } else {
          el.value = el.options[0] ? el.options[0].value : '';
        }
      }
    });
  });

  // HBA: если hba-1 = "Удалить", блокируем hba-2, hba-3, hba-4
  document.getElementById('hba-1').addEventListener('change', function () {
    const hbaKeys = ['hba-2', 'hba-3', 'hba-4'];
    const shouldDisable = this.selectedOptions[0].text.includes('Удалить');
    hbaKeys.forEach(key => {
      const el = document.getElementById(key);
      if (el) {
        el.disabled = shouldDisable;
        if (shouldDisable) {
          el.value = '';
        } else {
          el.value = el.options[0] ? el.options[0].value : '';
        }
      }
    });
  });

  document.getElementById('drive-3').addEventListener('change', updateDrive5);
  document.getElementById('drive-5').addEventListener('change', updateDrive6);
  document.getElementById('network-2').addEventListener('change', updateNetwork6);

  // Делегирование событий для клонированных drive-N-TYPE
  const driveContainer = document.getElementById('drive-container');
  if (driveContainer) {
    driveContainer.addEventListener('change', function (e) {
      const select = e.target;
      const match = select.id.match(/^drive-(\d+)-(\d+)$/);
      if (match) {
        const index = parseInt(match[1]);
        const type = parseInt(match[2]);
        
        // drive-3-N → drive-5-N и drive-6-N
        if (index === 3) {
          const drive5Clone = document.getElementById(`drive-5-${type}`);
          const drive6Clone = document.getElementById(`drive-6-${type}`);
          const isSataOrSas = select.selectedOptions[0].text === 'SATA' || select.selectedOptions[0].text === 'SAS';
          
          // Если drive-3-N не SATA/SAS, drive-5-N = SSD
          if (drive5Clone && !isSataOrSas) {
            drive5Clone.value = drive5Clone.options[0] ? drive5Clone.options[0].value : '';
          }
          
          // Если drive-3-N не SATA/SAS, скрываем drive-6-N
          if (drive6Clone) {
            drive6Clone.disabled = !isSataOrSas;
            if (!isSataOrSas) {
              drive6Clone.value = '';
            } else {
              drive6Clone.value = drive6Clone.options[0] ? drive6Clone.options[0].value : '';
            }
          }
          checkRows();
        }
        
        // drive-5-N → drive-6-N
        if (index === 5) {
          const drive6Clone = document.getElementById(`drive-6-${type}`);
          if (drive6Clone) {
            const isHdd = select.selectedOptions[0].text === 'HDD';
            drive6Clone.disabled = !isHdd;
            if (!isHdd) {
              drive6Clone.value = '';
            } else {
              drive6Clone.value = drive6Clone.options[0] ? drive6Clone.options[0].value : '';
            }
            checkRows();
          }
        }
      }
    });
  }

  // Делегирование событий для клонированных network-2-N
  const networkContainer = document.getElementById('network-container');
  if (networkContainer) {
    networkContainer.addEventListener('change', function (e) {
      const select = e.target;
      const match = select.id.match(/^network-(\d+)-(\d+)$/);
      if (match) {
        const index = parseInt(match[1]);
        const type = parseInt(match[2]);
        // Если изменился network-N-TYPE, проверяем network-6-TYPE
        if (index === 2) {
          const network6Clone = document.getElementById(`network-6-${type}`);
          if (network6Clone) {
            const isEthernet = select.selectedOptions[0].text === 'Ethernet';
            network6Clone.disabled = isEthernet;
            if (isEthernet) {
              network6Clone.value = '';
            } else {
              network6Clone.value = network6Clone.options[0] ? network6Clone.options[0].value : '';
            }
            checkRows();
          }
        }
      }
    });
  }

  // Скрываем строки с пустыми селекторами при изменении любого селектора
  const allSelects = document.querySelectorAll('#dataTable tbody select');
  allSelects.forEach(select => {
    select.addEventListener('change', checkRows);
  });

  document.getElementById('exportBtn').addEventListener('click', function () {
    const table = document.getElementById('dataTable');
    const rows = table.querySelectorAll('tbody tr');
    const data = [];

    // 1. Собираем все строки с их select id
    const allRows = [];
    rows.forEach(row => {
      const select = row.querySelector('select');
      const selectId = select ? select.id : null;
      const fixedValue1 = row.cells[0].textContent.trim();
      const selectedValue = select && select.selectedOptions.length > 0
        ? select.selectedOptions[0].text
        : '';
      const fixedValue2 = row.cells[2].textContent.trim();
      allRows.push({ selectId, fixedValue1, selectedValue, fixedValue2 });
    });

    // 2. Проверяем gpu-1 — если "Удалить", исключаем gpu-2...gpu-8
    const gpu1Row = allRows.find(r => r.selectId === 'gpu-1');
    const excludeGpu = gpu1Row && gpu1Row.selectedValue.includes('Удалить');
    const gpuKeysToExclude = ['gpu-2', 'gpu-3', 'gpu-4', 'gpu-5', 'gpu-6', 'gpu-7', 'gpu-8'];

    // 3. Проверяем controller-1 — если "Удалить", исключаем controller-2,3,4
    const controller1Row = allRows.find(r => r.selectId === 'controller-1');
    const excludeController = controller1Row && controller1Row.selectedValue.includes('Удалить');
    const controllerKeysToExclude = ['controller-2', 'controller-3', 'controller-4', 'select-59'];

    // 4. Проверяем hba-1 — если "Удалить", исключаем hba-2, hba-3, hba-4
    const hba1Row = allRows.find(r => r.selectId === 'hba-1');
    const excludeHba = hba1Row && hba1Row.selectedValue.includes('Удалить');
    const hbaKeysToExclude = ['hba-2', 'hba-3', 'hba-4'];

    // 5. Проверяем controller-3 — если "Удалить", исключаем controller-2
    const controller3Row = allRows.find(r => r.selectId === 'controller-3');
    const excludeController2 = controller3Row && controller3Row.selectedValue.includes('Удалить');

    // 6. Проверяем driveCount — если 0, исключаем все drive-строки
    const driveCount = parseInt(document.getElementById('driveCount').value) || 0;
    const excludeDrives = driveCount === 0;

    // 5. Проверяем drive-3-N: если не SATA и не SAS, исключаем drive-5-N
    const drive3Rows = allRows.filter(r => r.selectId && /^drive-3/.test(r.selectId));
    const drive3Values = {};
    drive3Rows.forEach(row => {
      const parts = row.selectId.split('-');
      const baseIndex = parseInt(parts[1]);
      const typeMatch = row.selectId.match(/-(\d+)$/);
      const type = typeMatch ? parseInt(typeMatch[1]) : 1;
      if (!drive3Values[type]) drive3Values[type] = {};
      drive3Values[type][baseIndex] = row.selectedValue;
    });

    // 6. Проверяем drive-5-N: если не HDD, исключаем drive-6-N
    const drive5Rows = allRows.filter(r => r.selectId && /^drive-5/.test(r.selectId));
    const drive5Values = {};
    drive5Rows.forEach(row => {
      const parts = row.selectId.split('-');
      const baseIndex = parseInt(parts[1]);
      const typeMatch = row.selectId.match(/-(\d+)$/);
      const type = typeMatch ? parseInt(typeMatch[1]) : 1;
      if (!drive5Values[type]) drive5Values[type] = {};
      drive5Values[type][baseIndex] = row.selectedValue;
    });

    // 7. Проверяем network-2-N: network-6-N исключается из выгрузки если network-2-N = Ethernet
    const allNetwork6Selects = document.querySelectorAll('[id^="network-6"]');
    const network6DisabledMap = {};
    allNetwork6Selects.forEach(select => {
      const match = select.id.match(/^network-6(-(\d+))?$/);
      if (match) {
        const type = match[2] ? parseInt(match[2]) : 1;
        network6DisabledMap[type] = select.disabled;
      }
    });

    // 5. Собираем данные с учётом исключений
    allRows.forEach(item => {
      // Пропускаем строки, если выбрано "Удалить"
      if (item.selectedValue.includes('Удалить')) return;

      // Пропускаем drive-строки, если driveCount = 0
      if (excludeDrives && item.selectId && item.selectId.startsWith('drive-')) return;

      // Пропускаем gpu-строки, если gpu-1 = "Удалить"
      if (excludeGpu && gpuKeysToExclude.includes(item.selectId)) return;

      // Пропускаем controller-строки, если controller-1 = "Удалить"
      if (excludeController && controllerKeysToExclude.includes(item.selectId)) return;

      // Пропускаем controller-2, если controller-3 = "Удалить"
      if (excludeController2 && item.selectId === 'controller-2') return;

      // Пропускаем hba-строки, если hba-1 = "Удалить"
      if (excludeHba && hbaKeysToExclude.includes(item.selectId)) return;

      // Пропускаем drive-5-N, если drive-3-N не SATA и не SAS
      if (item.selectId && /^drive-5/.test(item.selectId)) {
        const parts = item.selectId.split('-');
        const baseIndex = parseInt(parts[1]);
        const typeMatch = item.selectId.match(/-(\d+)$/);
        const type = typeMatch ? parseInt(typeMatch[1]) : 1;
        const drive3Value = drive3Values[type] ? drive3Values[type][baseIndex] : '';
        const isSataOrSas = drive3Value === 'SATA' || drive3Value === 'SAS';
        if (!isSataOrSas) return;
      }

      // Пропускаем drive-6-N, если drive-3-N не SATA/SAS ИЛИ drive-5-N не HDD
      if (item.selectId && /^drive-6/.test(item.selectId)) {
        const parts = item.selectId.split('-');
        const baseIndex = parseInt(parts[1]);
        const typeMatch = item.selectId.match(/-(\d+)$/);
        const type = typeMatch ? parseInt(typeMatch[1]) : 1;
        const drive3Value = drive3Values[type] ? drive3Values[type][baseIndex] : '';
        const isSataOrSas = drive3Value === 'SATA' || drive3Value === 'SAS';
        if (!isSataOrSas) return;
        const drive5Value = drive5Values[type] ? drive5Values[type][baseIndex] : '';
        if (drive5Value !== 'HDD') return;
      }

      // Пропускаем network-6-N, если заблокирована (network-2-N = Ethernet)
      if (item.selectId && /^network-6/.test(item.selectId)) {
        const parts = item.selectId.split('-');
        const baseIndex = parseInt(parts[1]);
        const typeMatch = item.selectId.match(/-(\d+)$/);
        const type = typeMatch ? parseInt(typeMatch[1]) : 1;
        if (network6DisabledMap[type]) return;
      }

      data.push([item.fixedValue1, item.selectedValue, item.fixedValue2]);
    });

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

    // Применяем стили
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

    // Скачиваем файл
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'export.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
    });
  });
});

function applyPreset(presetName) {
  localStorage.removeItem('currentPreset');
  
  const commonPromises = COMMON_FILES.map(file =>
    fetch(PRESETS_PATH + file)
      .then(res => {
        if (!res.ok) throw new Error(`Ошибка загрузки ${file}`);
        return res.json();
      })
  );

  Promise.all(commonPromises)
    .then(commonResults => {
      const commonOptions = Object.assign({}, ...commonResults);

      const presetFile = PRESET_FILES[presetName];
      
      fetch(PRESETS_PATH + presetFile)
        .then(res => {
          if (!res.ok) throw new Error(`Ошибка загрузки ${presetFile}`);
          return res.json();
        })
        .then(presetOptions => {
          const allOptions = { ...commonOptions, ...presetOptions };
          updateSelects(allOptions);
          
          // Сохраняем drive-опции и применяем ко всем drive-селектам
          driveOptions = commonOptions;
          
          const driveSelects = document.querySelectorAll('[id^="drive-"]');
          driveSelects.forEach(select => {
            const parts = select.id.split('-');
            const driveIndex = parseInt(parts[1]);
            const options = driveOptions[`drive-${driveIndex}`];
            if (options) {
              select.innerHTML = '';
              options.forEach(optText => {
                const option = document.createElement('option');
                option.textContent = optText;
                select.appendChild(option);
              });
            }
          });
          
          // Если driveCount > 1, клонируем строки
          const driveCount = parseInt(document.getElementById('driveCount').value) || 1;
          if (driveCount > 1) {
            cloneDrives();
          } else {
            // Разблокированные drive-6 получают первое значение
            const drive6Selects = document.querySelectorAll('[id^="drive-6"]');
            const drive3 = document.getElementById('drive-3');
            const drive3Text = drive3 ? drive3.selectedOptions[0].text : '';
            const isSataOrSas = drive3Text === 'SATA' || drive3Text === 'SAS';
            if (isSataOrSas) {
              drive6Selects.forEach(select => {
                select.value = select.options[0] ? select.options[0].value : '';
              });
            }
          }
          
          // Загружаем network-опции
          networkOptions = commonOptions;
          
          const networkSelects = document.querySelectorAll('[id^="network-"]');
          networkSelects.forEach(select => {
            const parts = select.id.split('-');
            const networkIndex = parseInt(parts[1]);
            const options = networkOptions[`network-${networkIndex}`];
            if (options) {
              select.innerHTML = '';
              options.forEach(optText => {
                const option = document.createElement('option');
                option.textContent = optText;
                select.appendChild(option);
              });
            }
          });
          
          // Если networkCount > 1, клонируем строки
          const networkCount = parseInt(document.getElementById('networkCount').value) || 1;
          if (networkCount > 1) {
            cloneNetworks();
          } else {
            // Если нет клонирования, блокируем network-6 по умолчанию
            updateNetwork6AfterClone(1);
          }
          
          // Проверка и подсветка строк
          checkRows();
          
          // Инициализируем GPU: если gpu-1 = "Удалить", блокируем gpu-2...gpu-8
          const gpu1Init = document.getElementById('gpu-1');
          if (gpu1Init) {
            gpu1Init.dispatchEvent(new Event('change'));
          }
          
          // Инициализируем controller-1: если "Удалить", блокируем controller-2,3,4 и select-59
          const controller1Init = document.getElementById('controller-1');
          if (controller1Init) {
            controller1Init.dispatchEvent(new Event('change'));
          }
          
          // Инициализируем hba-1: если "Удалить", блокируем hba-2,3,4
          const hba1Init = document.getElementById('hba-1');
          if (hba1Init) {
            hba1Init.dispatchEvent(new Event('change'));
          }
          
          // Инициализируем controller-3: если "Удалить", очищаем controller-2
          const controller3Init = document.getElementById('controller-3');
          if (controller3Init) {
            controller3Init.dispatchEvent(new Event('change'));
          }
          
          currentPreset = presetName;
          localStorage.setItem('currentPreset', presetName);
        })
        .catch(err => {
          console.error('Ошибка загрузки специфичного файла:', err);
        });
    })
    .catch(err => {
      console.error('Ошибка загрузки общих файлов:', err);
    });
}

function updateSelects(options) {
  for (const selectId in options) {
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = '';
      options[selectId].forEach(optText => {
        const option = document.createElement('option');
        option.textContent = optText;
        select.appendChild(option);
      });

      // Если доступно только одно значение — делаем поле неактивным
      if (options[selectId].length <= 1) {
        select.disabled = true;
      } else {
        select.disabled = false;
      }
    }
  }
}
