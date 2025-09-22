import sqlite3
import uuid

from src.models import DeviceModel, Test, DataOfTest

from src.post_logs_engine.post_log import postLog

from configs.paths import path_to_sqlite_db

import traceback

connection = sqlite3.connect(path_to_sqlite_db)

class SQLiteDB:
	def __init__(self):
		self.cursor = connection.cursor()
		self.make_tables()

	def make_tables(self):
		self.cursor.execute("CREATE TABLE IF NOT EXISTS admins(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, login VARCHAR(10) NOT NULL, password VARCHAR(10) NOT NULL)")
		self.cursor.execute("CREATE TABLE IF NOT EXISTS devices(id VARCHAR(10) NOT NULL PRIMARY KEY, name VARCHAR(25) NOT NULL)")
		self.cursor.execute("CREATE TABLE IF NOT EXISTS state_of_device(id_of_device VARCHAR(10) NOT NULL, state VARCHAR(7) DEFAULT 'off', FOREIGN KEY (id_of_device) REFERENCES devices(id) ON DELETE CASCADE)")

		self.cursor.execute("CREATE TABLE IF NOT EXISTS tests(id_of_test INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name VARCHAR(50) DEFAULT 'test_of_speed', date_of_test DATETIME NOT NULL)")
		self.cursor.execute("CREATE TABLE IF NOT EXISTS data_of_tests(id_of_test INTEGER NOT NULL, ordinal_number_of_test INTEGER NOT NULL, id_of_device VARCHAR(10) NOT NULL, downstream DOUBLE NOT NULL DEFAULT -1, upstream DOUBLE NOT NULL DEFAULT -1, PRIMARY KEY (id_of_test, ordinal_number_of_test), FOREIGN KEY (id_of_test) REFERENCES tests(id_of_test) ON DELETE CASCADE)")


	def get_devices(self) -> list[DeviceModel]:
		self.cursor.execute("SELECT id, name, state_of_device.state FROM devices INNER JOIN state_of_device ON devices.id = state_of_device.id_of_device")
		devices = self.cursor.fetchall()

		list_of_devices: list[DeviceModel] = []

		for device in devices:
			list_of_devices.append(
				DeviceModel(
					device_id=device[0], 
					device_name=device[1], 
					device_status=device[2]
					)
				)
		postLog.debug(f"Сохраненные девайсы из базы данных: {list_of_devices}")

		return list_of_devices

	def get_device(self, device_id: str) -> DeviceModel:
		self.cursor.execute("SELECT id, name, state_of_device.state FROM devices INNER JOIN state_of_device ON state_of_device.id_of_device = id WHERE id = ?", (device_id, ))
		device = self.cursor.fetchone()

		stack = traceback.format_stack()[-2]

		postLog.info(f'Функцию {self.get_device} вызвал стек {stack}')

		postLog.debug(f"Девайс {device[0]} с названием {device[1]} и со статусом {device[2]}")

		return DeviceModel(
				device_id=device[0],
				device_name=device[1],
				device_status=device[2]
			)

	def create_test_device(self):
		id_of_device = str(uuid.uuid4())[:10]

		self.cursor.execute("INSERT INTO devices ('id', 'name') VALUES (?, 'iphone 11')", (id_of_device, ))

		self.cursor.execute("INSERT INTO state_of_device ('id_of_device', 'state') VALUES (?, ?)", (id_of_device, 'on'))

		connection.commit()

	def registrate_device_in_db(self, device_id: str, device_name: str) -> bool:
		try:
			self.cursor.execute("INSERT INTO devices ('id', 'name') VALUES (?, ?)", (device_id, device_name))
			self.cursor.execute("INSERT INTO state_of_device ('id_of_device') VALUES (?)", (device_id, ))
			connection.commit()
			postLog.info(f"Успешно зарегестрировал новое устройство: {device_name}, с id {device_id}")
			return True
		except sqlite3.IntegrityError:
			return False

	def update_status_device(self, device_id: str, status: str):
		self.cursor.execute("UPDATE state_of_device SET state = ? WHERE id_of_device = ?", (status, device_id))
		connection.commit()
		postLog.info(f'Успешно обновил состояние девайса {device_id} на {status}')

	def add_the_test_in_db(self, test: Test, data_of_test: DataOfTest):
		self.cursor.execute("INSERT INTO tests (name, date_of_test) VALUES (?, ?)", (test.name_of_test, test.date_of_test))

		self.cursor.execute("SELECT last_insert_rowid()")
		id_of_test = self.cursor.fetchone()[0]

		self.cursor.execute("INSERT INTO data_of_tests (id_of_test, id_of_device, downstream, upstream, ordinal_number_of_test) VALUES (?, ?, ?, ?, ?)", (id_of_test, data_of_test.device_id, data_of_test.downstream, data_of_test.upstream, data_of_test.attempt))

		connection.commit()
		postLog.info(f"Успешно добавил новый тест {id_of_test} девайса {data_of_test.device_id}")


sqlite_engine = SQLiteDB()