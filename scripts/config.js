// Константы и конфигурация проекта

const CONFIG = {
  // Пути
  PRESETS_PATH: 'presets/',

  // Пресеты
  PRESET_FILES: {
    'standart': 'standart.json',
    'urgent': 'urgent.json',
    'custom': 'custom.json'
  },

  // Общие файлы для всех пресетов
  COMMON_FILES: [
    'processors.json',
    'memory.json',
    'storage.json',
    'controllers.json',
    'network.json',
    'gpu.json',
    'power.json'
  ],

  // ID элементов DOM
  ELEMENTS: {
    PRESET_SELECTOR: 'presetSelector',
    DRIVE_COUNT: 'driveCount',
    DRIVE_CONTAINER: 'drive-container',
    NETWORK_COUNT: 'networkCount',
    NETWORK_CONTAINER: 'network-container',
    HBA_COUNT: 'hbaCount',
    HBA_CONTAINER: 'hba-container',
    DATA_TABLE: 'dataTable',
    NOTE_SELECTOR: 'noteSelector',
    EXPORT_BTN: 'exportBtn',
    EXPORT_WORD_BTN: 'exportWordBtn'
  },

  // Исключения для экспорта
  EXCLUSION_RULES: {
    GPU: {
      trigger: 'gpu-1',
      exclude: ['gpu-2', 'gpu-3', 'gpu-4', 'gpu-5', 'gpu-6', 'gpu-7', 'gpu-8']
    },
    CONTROLLER: {
      trigger: 'controller-1',
      exclude: ['controller-2', 'controller-3', 'controller-4', 'select-59']
    },
    CONTROLLER_3: {
      trigger: 'controller-3',
      exclude: ['controller-2']
    },
    HBA: {
      trigger: 'hba-1',
      exclude: ['hba-2', 'hba-3', 'hba-4']
    }
  },

  // Цвета для подсветки строк
  STYLES: {
    DELETE_ROW: '#F08080',    // Красный — строка "Удалить"
    DISABLED_ROW: '#90EE90'   // Зелёный — заблокированный селект
  }
};
