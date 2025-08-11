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

  // Текущее состояние логов
  let lastLogSize = 0;
  let logRefreshInterval = 3000; // 3 секунды между обновлениями
  let logUpdateTimer = null;

  // Функция обновления состояния карточки
  function updateCardState(card, isChecked) {
    card.classList.toggle('active', isChecked);
  }

  // Загрузка устройств
  async function loadDevices() {
    logMessage("Загрузка списка устройств...");
    try {
      const response = await fetch('/get_devices', {
        method: "GET"
      });

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      };

      const data = await response.json();
      return data;
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
              <input type="checkbox" class="checkbox" data-id="${device.device_id}">
              <span class="checkmark"></span>
            </label>
            <h3>${device.device_name}</h3>
          </div>
          <span class="device-status status-${device.device_status}">
            ${device.device_status === 'on' ? 'Включен' : 'Выключен'}
          </span>
        </div>
      `;
      
      const checkbox = card.querySelector('.checkbox');
      
      // Обработчик клика по карточке
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('device-status')) return;
        
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }
        
        updateCardState(card, checkbox.checked);
        const changeEvent = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(changeEvent);
      });
      
      checkbox.addEventListener('change', () => {
        updateCardState(card, checkbox.checked);
      });

      devicesGrid.appendChild(card);
    });
  }

  // Чтение логов с сервера
  async function updateLogs() {
    try {
      const response = await fetch('/logs/logs.log');
      if (!response.ok) throw new Error('Ошибка загрузки логов');
      
      const logText = await response.text();
      const logLines = logText.split('\n').filter(line => line.trim());
      
      if (logLines.length > lastLogSize) {
        // Добавляем только новые записи
        const newLines = logLines.slice(lastLogSize);
        newLines.forEach(line => {
          const entry = document.createElement('div');
          entry.textContent = line;
          logContent.appendChild(entry);
        });
        
        lastLogSize = logLines.length;
        logContent.scrollTop = logContent.scrollHeight;
      }
    } catch (error) {
      console.error('Ошибка обновления логов:', error);
    }
  }

  // Запуск автообновления логов
  function startLogUpdates() {
    if (logUpdateTimer) clearInterval(logUpdateTimer);
    logUpdateTimer = setInterval(updateLogs, logRefreshInterval);
    updateLogs(); // Первая загрузка
  }

  // Остановка автообновления логов
  function stopLogUpdates() {
    if (logUpdateTimer) {
      clearInterval(logUpdateTimer);
      logUpdateTimer = null;
    }
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

  // Логирование сообщений (для локальных сообщений)
  function logMessage(message) {
    const entry = document.createElement('div');
    entry.textContent = `[${new Date().toLocaleTimeString('ru-RU')}] ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
    lastLogSize++; // Учитываем добавленное сообщение
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
      if (action === 'start') {
        const response = await fetch('/start_net_test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ssid: ssid,
            password: password,
            list_id_of_devices: deviceIds
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        logMessage(`Ответ сервера: ${JSON.stringify(data)}`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        logMessage("Тест остановлен");
      }
      
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
      startLogUpdates(); // Запускаем мониторинг логов
      logMessage("Система готова. Введите данные Wi-Fi и выберите устройства.");
      
      // Обработчики группового выбора
      selectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.device-card').forEach(card => {
          const checkbox = card.querySelector('.checkbox');
          checkbox.checked = true;
          updateCardState(card, true);
        });
      });

      deselectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.device-card').forEach(card => {
          const checkbox = card.querySelector('.checkbox');
          checkbox.checked = false;
          updateCardState(card, false);
        });
      });

      // Обработчики тестирования
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

  // Запуск приложения
  initApp();
});