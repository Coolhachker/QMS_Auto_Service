from fastapi import FastAPI
import json
from src.post_logs_engine.post_log import postLog

from src.responses.responses_200 import main_page_response

from src.databases.sqlite_db.sqlite_engine import sqlite_engine
from src.rabbitmq_engine.producer import producer
from src.rabbitmq_engine.Tasks import Tasks
from src.models import Device


def get_handlers(router: FastAPI):
	@router.get('/')
	async def handle_request_on_main_page():
		postLog.debug("/ - Принял запрос на главную страницу.")
		return main_page_response

	@router.get('/get_devices')
	async def hadle_request_on_get_devices():
		postLog.debug("/get_device - Принял запрос на получение всех девайсов из БД.")
		for device in sqlite_engine.get_devices():
			get_device(device.device_id)
		return sqlite_engine.get_devices()

	@router.get('/get_device/{device_id}')
	async def handle_request_on_get_device(device_id: str):
		postLog.info(f"/get_device/ принял запрос на получение устройства: {device_id}")
		get_device(device_id)
		return sqlite_engine.get_device(device_id)



def get_device(device_id: str):
	data_for_consumers: dict = {'device_id': device_id, 'task': Tasks.task_check_device}
	response = producer.publish(json.dumps(data_for_consumers, ensure_ascii=False))

	try:
		assert response is not None
		assert response['response'] == 3 and response['device_id'] == device_id
		postLog.info(f"Отправил запрос на состояние девайса {device_id}. Девайс работает")
		sqlite_engine.update_status_device(device_id, 'on')
	except AssertionError:
		postLog.warning(f"Отправил запрос на состояние девайса {device_id}. Девайс не работает")
		sqlite_engine.update_status_device(device_id, 'off') 