document.addEventListener('DOMContentLoaded', async function() {
  // DOM-элементы
  const devicesGrid = document.getElementById('devicesGrid');
  const startTestBtn = document.getElementById('startTest');
  const stopTestBtn = document.getElementById('stopTest');
  const ssidInput = document.getElementById('ssid');
  const passwordInput = document.getElementById('password');
  const logContent = document.querySelector('.log-content');
  const selectAllBtn = document.getElementById('selectAll');
  const deselectAllBtn = document.getElementById('deselectAll');

  // Загрузка устройств
  async function loadDevices() {
    logMessage("Загрузка списка устройств...");
    try {
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
      
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.classList.contains('device-status')) return;
        
        const checkbox = card.querySelector('.checkbox');
        checkbox.checked = !checkbox.checked;
        const event = new Event('change');
        checkbox.dispatchEvent(event);
        card.classList.toggle('active', checkbox.checked);
      });
      
      const checkbox = card.querySelector('.checkbox');
      checkbox.addEventListener('change', () => {
        card.classList.toggle('active', checkbox.checked);
      });

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

  // Валидация данных Wi-Fi
  function validateWiFi() {
    const ssid = ssidInput.value.trim();
    if (!ssid) {
      logMessage("Ошибка: введите имя Wi-Fi сети (SSID)!");
      ssidInput.focus();
      return false;
    }
    return true;
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
  async function sendTestRequest(action) {
    if (!validateSelection()) {
      logMessage("Ошибка: необходимо выбрать хотя бы одно устройство!");
      return false;
    }
    
    if (!validateWiFi()) return false;

    const ssid = ssidInput.value.trim();
    const password = passwordInput.value;
    const deviceIds = getSelectedDevices();

    logMessage(`Запрос: ${action === 'start' ? 'Запуск' : 'Остановка'} теста для сети '${ssid}'`);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      logMessage(`Тест ${action === 'start' ? 'запущен' : 'остановлен'} успешно для сети '${ssid}'`);
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
      logMessage("Система готова. Введите данные Wi-Fi и выберите устройства.");
      
      selectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.checkbox').forEach(checkbox => {
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event('change'));
        });
      });

      deselectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.checkbox').forEach(checkbox => {
          checkbox.checked = false;
          checkbox.dispatchEvent(new Event('change'));
        });
      });

      startTestBtn.addEventListener('click', async () => {
        const success = await sendTestRequest('start');
        if (success) {
          startTestBtn.disabled = true;
          stopTestBtn.disabled = false;
        }
      });

      stopTestBtn.addEventListener('click', async () => {
        const success = await sendTestRequest('stop');
        if (success) {
          startTestBtn.disabled = false;
          stopTestBtn.disabled = true;
        }
      });
    } catch (error) {
      logMessage(`Ошибка инициализации: ${error.message}`);
    }
  }

  initApp();
});