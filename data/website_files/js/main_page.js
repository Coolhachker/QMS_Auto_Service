document.addEventListener('DOMContentLoaded', async function() {
  // DOM-элементы
  const devicesGrid = document.getElementById('devicesGrid');
  const startTestBtn = document.getElementById('startTest');
  const stopTestBtn = document.getElementById('stopTest');
  const frequencySelect = document.getElementById('frequency');
  const logContent = document.querySelector('.log-content');
  const selectAllBtn = document.getElementById('selectAll');
  const deselectAllBtn = document.getElementById('deselectAll');

  // Загрузка устройств
  async function loadDevices() {
    logMessage("Загрузка списка устройств...");
    try {
      // В реальном проекте замените на:
      // const response = await fetch('/api/devices');
      // if (!response.ok) throw new Error('Ошибка сети');
      // return await response.json();
      
      // Мок-данные:
      return [
        { id: 1, name: "Смартфон Samsung", status: "on" },
        { id: 2, name: "Ноутбук Lenovo", status: "off" },
        { id: 3, name: "Умный дом", status: "on" },
        { id: 4, name: "Телевизор LG", status: "off" },
        { id: 5, name: "Планшет Apple", status: "on" },
        { id: 6, name: "Игровая консоль", status: "on" }
      ];
    } catch (error) {
      logMessage(`Ошибка загрузки: ${error.message}`);
      return [];
    }
  }

  // Отображение устройств
  function renderDevices(devices) {
    if (!devicesGrid) return;
    
    devicesGrid.innerHTML = '';
    devices.forEach(device => {
      const card = document.createElement('div');
      card.className = 'device-card';
      card.innerHTML = `
        <div class="device-header">
          <div class="device-checkbox-container">
            <label class="device-checkbox">
              <input type="checkbox" class="checkbox" data-id="${device.id}">
              <span class="checkmark"></span>
            </label>
            <h3>${device.name}</h3>
          </div>
          <span class="device-status status-${device.status}">
            ${device.status === 'on' ? 'Включен' : 'Выключен'}
          </span>
        </div>
      `;
      devicesGrid.appendChild(card);
    });
  }

  // Валидация выбора устройств
  function validateSelection() {
    const cards = document.querySelectorAll('.device-card');
    const hasSelection = document.querySelector('.checkbox:checked') !== null;
    
    cards.forEach(card => {
      card.classList.toggle('invalid', !hasSelection);
    });
    
    return hasSelection;
  }

  // Получение выбранных устройств
  function getSelectedDevices() {
    const checkboxes = document.querySelectorAll('.checkbox:checked');
    return Array.from(checkboxes).map(checkbox => parseInt(checkbox.dataset.id));
  }

  // Логирование сообщений
  function logMessage(message) {
    if (!logContent) return;
    
    const entry = document.createElement('div');
    entry.textContent = `[${new Date().toLocaleTimeString('ru-RU')}] ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
  }

  // Отправка тестового запроса
  async function sendTestRequest(frequency, action) {
    if (!validateSelection()) {
      logMessage("Ошибка: необходимо выбрать хотя бы одно устройство!");
      return false;
    }

    const deviceIds = getSelectedDevices();
    logMessage(`Запрос: ${action === 'start' ? 'Запуск' : 'Остановка'} теста на ${frequency} GHz для устройств [${deviceIds.join(', ')}]`);

    try {
      // В реальном проекте:
      // const response = await fetch('/api/test', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ frequency, deviceIds, action })
      // });
      
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      
      // const data = await response.json();
      // logMessage(data.message);
      
      // Имитация запроса
      await new Promise(resolve => setTimeout(resolve, 1000));
      logMessage(`Тест ${action === 'start' ? 'запущен' : 'остановлен'} успешно`);
      
      return true;
    } catch (error) {
      logMessage(`Ошибка запроса: ${error.message}`);
      return false;
    }
  }

  // Инициализация приложения
  async function initApp() {
    try {
      const devices = await loadDevices();
      if (devices.length === 0) {
        logMessage("Нет доступных устройств для тестирования");
        return;
      }
      
      renderDevices(devices);
      logMessage("Система готова. Выберите устройства для теста.");
      
      // Обработчики группового выбора
      selectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.checkbox').forEach(checkbox => {
          checkbox.checked = true;
        });
      });

      deselectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.checkbox').forEach(checkbox => {
          checkbox.checked = false;
        });
      });

      // Обработчики тестирования
      startTestBtn.addEventListener('click', async () => {
        const frequency = frequencySelect.value;
        const success = await sendTestRequest(frequency, 'start');
        
        if (success) {
          startTestBtn.disabled = true;
          stopTestBtn.disabled = false;
        }
      });

      stopTestBtn.addEventListener('click', async () => {
        const success = await sendTestRequest(frequencySelect.value, 'stop');
        
        if (success) {
          startTestBtn.disabled = false;
          stopTestBtn.disabled = true;
        }
      });
    } catch (error) {
      logMessage(`Ошибка инициализации: ${error.message}`);
    }
  }

  // Запуск приложения
  initApp();
});