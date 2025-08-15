from fastapi import FastAPI
import json
from logging import getLogger

from src.responses.responses_200 import main_page_response

from src.databases.sqlite_db.sqlite_engine import sqlite_engine
from src.rabbitmq_engine.producer import producer
from src.rabbitmq_engine.Tasks import Tasks
from src.models import Device

logger = getLogger()


def get_handlers(router: FastAPI):
	@router.get('/')
	async def handle_request_on_main_page():
		return main_page_response

	@router.get('/get_devices')
	async def hadle_request_on_get_devices():
		for device in sqlite_engine.get_devices():
			get_device(device.device_id)
		return sqlite_engine.get_devices()

	@router.get('/get_device/{device_id}')
	async def handle_request_on_get_device(device_id: str):
		get_device(device_id)
		return sqlite_engine.get_device(device_id)



def get_device(device_id: str):
	data_for_consumers: dict = {'device_id': device_id, 'task': Tasks.task_check_device}
	response = producer.publish(json.dumps(data_for_consumers, ensure_ascii=False))

	logger.info(f"status of device: {data_for_consumers['device_id']} - {response}")

	if response['response'] == 3:
		sqlite_engine.update_status_device(device_id, 'on')
	else:
		sqlite_engine.update_status_device(device_id, 'off')