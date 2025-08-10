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

  // Функция обновления состояния карточки
  function updateCardState(card, isChecked) {
    card.classList.toggle('active', isChecked);
  }

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
      
      const checkbox = card.querySelector('.checkbox');
      
      // Обработчик клика по карточке
      card.addEventListener('click', (e) => {
        // Игнорируем клики по статусу устройства
        if (e.target.classList.contains('device-status')) return;
        
        // Переключаем состояние только если кликнули не на сам чекбокс
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }
        
        // Обновляем визуальное состояние
        updateCardState(card, checkbox.checked);
        
        // Инициируем событие change
        const changeEvent = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(changeEvent);
      });
      
      // Обработчик изменения чекбокса
      checkbox.addEventListener('change', () => {
        updateCardState(card, checkbox.checked);
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
      if (action === 'start') {
        // Отправка POST-запроса на сервер
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
        // Для остановки теста (оставил мок, замените на реальный эндпоинт при необходимости)
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