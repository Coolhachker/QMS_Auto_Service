from fastapi import FastAPI

from src.models import StartNetConnectionModel, DeviceModel
from src.responses.responses_200 import start_net_test, success_registration_device
from src.responses.responses_409 import attempt_to_re_register
from src.databases.sqlite_db.sqlite_engine import sqlite_engine
from src.rabbitmq_engine.producer import producer
from src.rabbitmq_engine.Tasks import Tasks
from src.models import Test, DataOfTest

from configs.paths import path_to_csv_file

from src.post_logs_engine.post_log import postLog
import json
import datetime
from datetime import timedelta, timezone
import csv
from typing import Optional


def post_handlers(router: FastAPI):
	@router.post("/start_net_test")
	async def handle_start_net_test(data: StartNetConnectionModel):
		postLog.debug(f"Данные, которые отправил клиента для тестирования сети: {data}")
		dict_of_results: dict[str: list[DataOfTest]] = {}
		for device_id in data.list_id_of_devices:
			save_test_in_db(set_net_test(device_id, 1))

		return start_net_test

	@router.post("/registrate_device")
	async def handle_registrate_device(data: DeviceModel):
		postLog.info(f'"/registrate_device" - Принял запрос на регистрацию устройства {data}.')
		if sqlite_engine.registrate_device_in_db(data.device_id, data.device_name):
			return success_registration_device
		else:
			return attempt_to_re_register


def set_net_test(device_id: str, count_of_tests: int):
	data_of_test: list[DataOfTest] = []
	for i in range(count_of_tests):
		data_for_consumers: dict = {'device_id': device_id, 'task': Tasks.task_net_test}
		response = producer.publish(json.dumps(data_for_consumers, ensure_ascii=False))
		if response['response'] == 5:
			results_of_test: dict = response['data']
			postLog.info(f'Результаты тестирования устройства: {device_id}, downstream: {results_of_test["downstream"]}, upstream: {results_of_test["upstream"]}')
			data_of_test.append(DataOfTest(device_id=device_id, downstream=results_of_test["downstream"], upstream=results_of_test["upstream"], attempt=i))
		else:
			postLog.warning(f"Устройство {device_id} не смогло произвести тест сети.")
			data_of_test.append(DataOfTest(device_id=device_id, downstream=-1.0, upstream=-1.0, attempt=i))

	return data_of_test


def save_test_in_db(data_of_test: list[DataOfTest], name_of_test: str = None):
	date_of_test = datetime.datetime.now(timezone(timedelta(hours=+3)))
	postLog.debug(f'Тип переменной date_of_test {date_of_test} в функции {save_test_in_db} = {type(date_of_test)}')

	test = Test(date_of_test=date_of_test, name_of_test=name_of_test)

	for data in data_of_test:
		sqlite_engine.add_the_test_in_db(test, data)


def set_results_in_csv_file(results: dict):
	"""
	Метод сохраняет данные в csv таблицу

	:return:
	"""
	with open(path_to_csv_file % str(datetime.datetime.now(datetime.pytz.timezone("UTC+3"))), 'w+', encoding='utf-8') as writer:
		fieldnames = results.keys()
		csv_writer = csv.DictWriter(writer, fieldnames=fieldnames)

		csv_writer.writeheader()
		csv_writer.writerow(results)