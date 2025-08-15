from fastapi import FastAPI

from src.models import StartNetConnectionModel, DeviceModel
from src.responses.responses_200 import start_net_test, success_registration_device
from src.responses.responses_409 import attempt_to_re_register
from src.databases.sqlite_db.sqlite_engine import sqlite_engine
from src.rabbitmq_engine.producer import producer
from src.rabbitmq_engine.Tasks import Tasks

from logging import getLogger
import json

logger = getLogger()


def post_handlers(router: FastAPI):
	@router.post("/start_net_test")
	async def handle_start_net_test(data: StartNetConnectionModel):
		logger.debug(f"Данные, которые отправил клиента для тестирования сети: {data}")
		table_of_results: dict = {}
		for device_id in data.list_id_of_devices:
			devica_name = sqlite_engine.get_device(device_id).device_name
			table_of_results[device_name] = {1: {'downstream': -1, 'upstream': -1}}

			data_for_consumers: dict = {'device_id': device_id, 'task': Tasks.task_net_test}
			response = producer.publish(json.dumps(data_for_consumers, ensure_ascii=False))
			if response['response'] == 4:
				results_of_test: dict = responses['data']
				logger.info(f'Результаты тестирования устройства: {device_id}, downstream: {results_of_test["downstream"]}, upstream: {results_of_test["upstream"]}')
				table_of_results[device_name] = {1: {'downstream': results_of_test["downstream"], 'upstream': results_of_test["upstream"]}}
		return start_net_test

	@router.post("/registrate_device")
	async def handle_registrate_device(data: DeviceModel):
		if sqlite_engine.registrate_device_in_db(data.device_id, data.device_name):
			return success_registration_device
		else:
			return attempt_to_re_register


