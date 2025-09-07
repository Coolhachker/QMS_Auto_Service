from fastapi import FastAPI, WebSocket
import json

from src.post_logs_engine.post_log import postLog
from src.databases.sqlite_db.sqlite_engine import sqlite_engine
from src.handlers.get_handlers import get_device
from src.post_logs_engine.post_log import postLog


def websocket_handlers(router: FastAPI):
	@router.websocket('/get_devices')
	async def handle_websocket_on_get_devices(websocket: WebSocket):
		postLog.debug("/get_device - Принял запрос на создание websocket соединения для получения всех девайсов из БД.")
		await websocket.accept()
		for device in sqlite_engine.get_devices():
			postLog.info(f"Обработка устройства: {device} для отправки websocket клиенту.")
			get_device(device.device_id)
			postLog.info(f"Устройство: {device} обработано.")
			device_from_db = sqlite_engine.get_device(device.device_id).__dict__

			await websocket.send_text(json.dumps(device_from_db))
			postLog.debug(f"Данные устройства, которые отправляются клиенту через websocket {device_from_db}")
		await websocket.send_text(0)