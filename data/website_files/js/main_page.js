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
  let logRefreshInterval = 10000000000000;
  let logUpdateTimer = null;

  // Функция обновления состояния карточки
  function updateCardState(card, isChecked) {
    card.classList.toggle('active', isChecked);
  }

  // Новая функция для загрузки устройств через WebSocket
  function loadDevices() {
    return new Promise((resolve, reject) => {
      logMessage("Установка WebSocket соединения для получения устройств...");
      
      // Создаем WebSocket соединение
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/get_devices`);
      const devices = [];
      let connectionTimeout;

      // Таймаут для соединения
      const connectionTimeoutDelay = 500000000;
      
      // Обработчики WebSocket
      ws.onopen = () => {
        logMessage("WebSocket соединение установлено");
        clearTimeout(connectionTimeout);
      };

      ws.onmessage = (event) => {
        try {
          // Проверяем сообщение о завершении
          if (event.data === '0') {
            logMessage("Все устройства получены, закрытие соединения");
            ws.close();
            resolve(devices);
            return;
          }

          // Парсим данные устройства
          const deviceData = JSON.parse(event.data);
          
          // Валидация основных полей
          if (!deviceData.device_id || !deviceData.device_name) {
            throw new Error('Получены неполные данные устройства');
          }

          devices.push(deviceData);
          logMessage(`Получено устройство: ${deviceData.device_name}`);
          
          // Опционально: обновляем интерфейс по мере поступления данных
          renderDevices(devices);

        } catch (error) {
          console.error('Ошибка обработки сообщения:', error);
          logMessage(`Ошибка обработки устройства: ${error.message}`);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket ошибка:', error);
        clearTimeout(connectionTimeout);
        reject(new Error('Ошибка соединения с сервером'));
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        if (!event.wasClean && devices.length === 0) {
          reject(new Error('Соединение прервано до получения данных'));
        }
      };

      // Таймаут соединения
      connectionTimeout = setTimeout(() => {
        ws.close();
        reject(new Error('Таймаут соединения с сервером'));
      }, connectionTimeoutDelay);
    });
  }

  // Отображение устройств
  function renderDevices(devices) {
    if (!devicesGrid) return;
    
    devicesGrid.innerHTML = '';
    devices.forEach(device => {
      const card = document.createElement('div');
      card.className = 'device-card';
      card.dataset.deviceId = device.device_id;
      
      // Добавляем класс working если устройство в работе
      if (device.device_status === 'working') {
        card.classList.add('working');
      }
      
      card.innerHTML = `
        <div class="device-header">
          <div class="device-title-row">
            <div class="device-checkbox-container">
              <label class="device-checkbox">
                <input type="checkbox" class="checkbox" data-id="${device.device_id}">
                <span class="checkmark"></span>
              </label>
              <h3 title="${device.device_name}">${device.device_name}</h3>
            </div>
            <div class="device-actions">
              <button class="refresh-btn" title="Обновить данные">↻</button>
            </div>
          </div>
          <div class="device-status-row">
            <span class="device-status status-${device.device_status}">
              ${device.device_status === 'on' ? 'Включен' : 
                device.device_status === 'off' ? 'Выключен' : 
                'В работе...'}
            </span>
          </div>
        </div>
      `;
      
      const checkbox = card.querySelector('.checkbox');
      
      // Обработчик клика по карточке (ИСПРАВЛЕНО)
      card.addEventListener('click', (e) => {
        // Игнорируем клики по кнопке обновления и статусу
        if (e.target.closest('.refresh-btn') || e.target.classList.contains('device-status')) {
          return;
        }
        
        const newState = !checkbox.checked;
        checkbox.checked = newState;
        updateCardState(card, newState);
        
        const changeEvent = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(changeEvent);
      });
      
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        updateCardState(card, checkbox.checked);
      });

      // Обработчик для кнопки обновления
      const refreshBtn = card.querySelector('.refresh-btn');
      refreshBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await refreshDeviceCard(card, device.device_id);
      });

      devicesGrid.appendChild(card);
    });
  }

  // Обновление карточки устройства
  async function refreshDeviceCard(card, deviceId) {
    const refreshBtn = card.querySelector('.refresh-btn');
    refreshBtn.classList.add('loading');
    
    try {
      const response = await fetch(`/get_device/${deviceId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const deviceData = await response.json();
      
      // Сохраняем состояние чекбокса (ИСПРАВЛЕНО)
      const wasChecked = card.querySelector('.checkbox').checked;
      
      // Обновляем класс working
      card.classList.toggle('working', deviceData.device_status === 'working');
      
      // Обновляем данные карточки
      card.querySelector('.device-status').className = `device-status status-${deviceData.device_status}`;
      card.querySelector('.device-status').textContent = "";
      if (deviceData.device_status == 'on') {
        card.querySelector('.device-status').textContent = 'Включен';
      };
      if (deviceData.device_status == 'off') {
        card.querySelector('.device-status').textContent = 'Выключен';
      };
      if (deviceData.device_status == 'working') {
        card.querySelector('.device-status').textContent = 'В работе...';
      };
      
      const nameElement = card.querySelector('h3');
      nameElement.textContent = deviceData.device_name;
      nameElement.title = deviceData.device_name;
      
      // Восстанавливаем состояние чекбокса
      card.querySelector('.checkbox').checked = wasChecked;
      updateCardState(card, wasChecked);
      
      logMessage(`Устройство "${deviceData.device_name}" обновлено`);
    } catch (error) {
      logMessage(`Ошибка обновления устройства: ${error.message}`);
      card.classList.add('invalid');
      setTimeout(() => card.classList.remove('invalid'), 1000);
    } finally {
      refreshBtn.classList.remove('loading');
    }
  }

  // Чтение логов с сервера
  async function updateLogs() {
    try {
      const response = await fetch('/logs/logs.log');
      if (!response.ok) throw new Error('Ошибка загрузки логов');
      
      const logText = await response.text();
      const logLines = logText.split('\n').filter(line => line.trim());
      
      if (logLines.length > lastLogSize) {
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
    updateLogs();
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
    return Array.from(checkboxes).map(checkbox => checkbox.dataset.id);
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
    const entry = document.createElement('div');
    entry.textContent = `[${new Date().toLocaleTimeString('ru-RU')}] ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
    lastLogSize++;
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
      startLogUpdates();
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