document.addEventListener('DOMContentLoaded', function() {
  // Мок-данные устройств
  const devices = [
    { name: "Смартфон", status: "on" },
    { name: "Ноутбук", status: "off" },
    { name: "Умный дом", status: "on" },
    { name: "Телевизор", status: "off" }
  ];

  const devicesGrid = document.getElementById('devicesGrid');
  const startTestBtn = document.getElementById('startTest');
  const stopTestBtn = document.getElementById('stopTest');
  const frequencySelect = document.getElementById('frequency');
  const logContent = document.querySelector('.log-content');

  // Отображение карточек устройств
  function renderDevices() {
    devicesGrid.innerHTML = '';
    devices.forEach(device => {
      const card = document.createElement('div');
      card.className = 'device-card';
      card.innerHTML = `
        <h3>${device.name}</h3>
        <span class="device-status status-${device.status}">
          ${device.status === 'on' ? 'Включен' : 'Выключен'}
        </span>
      `;
      devicesGrid.appendChild(card);
    });
  }

  // Логирование в журнал
  function logMessage(message) {
    const entry = document.createElement('div');
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
  }

  // AJAX-запрос (мок)
  function sendTestRequest(frequency, action) {
    logMessage(`Отправка запроса: ${action} на ${frequency} GHz...`);
    
    // Имитация AJAX
    setTimeout(() => {
      if (action === 'start') {
        logMessage(`Тест на ${frequency} GHz запущен.`);
      } else {
        logMessage(`Тест остановлен.`);
      }
    }, 1000);
  }

  // Обработчики кнопок
  startTestBtn.addEventListener('click', () => {
    const frequency = frequencySelect.value;
    sendTestRequest(frequency, 'start');
    startTestBtn.disabled = true;
    stopTestBtn.disabled = false;
  });

  stopTestBtn.addEventListener('click', () => {
    sendTestRequest(frequencySelect.value, 'stop');
    startTestBtn.disabled = false;
    stopTestBtn.disabled = true;
  });

  // Инициализация
  renderDevices();
  logMessage('Система готова к тестированию.');
});