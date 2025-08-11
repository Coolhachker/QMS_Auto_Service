import sqlite3

from src.models import DeviceModel

from logging import getLogger

from configs.paths import path_to_sqlite_db

connection = sqlite3.connect(path_to_sqlite_db)

logger = getLogger()


class SQLiteDB:
	def __init__(self):
		self.cursor = connection.cursor()
		self.make_tables()

	def make_tables(self):
		self.cursor.execute("CREATE TABLE IF NOT EXISTS admins(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, login VARCHAR(10) NOT NULL, password VARCHAR(10) NOT NULL)")
		self.cursor.execute("CREATE TABLE IF NOT EXISTS devices(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name VARCHAR(25) NOT NULL)")
		self.cursor.execute("CREATE TABLE IF NOT EXISTS state_of_device(id_of_device INTEGER NOT NULL, state BOOL default NULL, FOREIGN KEY (id_of_device) REFERENCES devices(id) ON DELETE CASCADE)")

	def get_devices(self) -> list[DeviceModel]:
		self.cursor.execute("SELECT id, name, state_of_device.state FROM devices INNER JOIN state_of_device WHERE devices.id = state_of_device.id_of_device")
		devices = self.cursor.fetchall()

		list_of_devices: list[DeviceModel] = []

		logger.debug(devices)


		for device in devices:
			list_of_devices.append(
				DeviceModel(
					device_id=device[0], 
					device_name=device[1], 
					device_status='on' if device[2] is True else 'off'
					)
				)

		return list_of_devices

	def create_test_device(self):
		self.cursor.execute("INSERT INTO devices ('name') VALUES ('iphone 11')")
		self.cursor.execute("SELECT last_insert_rowid()")

		id_of_device = self.cursor.fetchone()[0]

		self.cursor.execute("INSERT INTO state_of_device ('id_of_device', 'state') VALUES (?, ?)", (id_of_device, True))

		connection.commit()


sqlite_engine = SQLiteDB()