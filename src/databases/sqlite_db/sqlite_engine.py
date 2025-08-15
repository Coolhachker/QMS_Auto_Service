import sqlite3
import uuid

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
		self.cursor.execute("CREATE TABLE IF NOT EXISTS devices(id VARCHAR(10) NOT NULL PRIMARY KEY, name VARCHAR(25) NOT NULL)")
		self.cursor.execute("CREATE TABLE IF NOT EXISTS state_of_device(id_of_device VARCHAR(10) NOT NULL, state VARCHAR(7) DEFAULT 'off', FOREIGN KEY (id_of_device) REFERENCES devices(id) ON DELETE CASCADE)")

	def get_devices(self) -> list[DeviceModel]:
		self.cursor.execute("SELECT id, name, state_of_device.state FROM devices INNER JOIN state_of_device WHERE devices.id = state_of_device.id_of_device")
		devices = self.cursor.fetchall()

		list_of_devices: list[DeviceModel] = []

		logger.debug(devices)


		for device in devices:
			logger.debug(f"Device: {device[0]}, status: {device[2]}")
			list_of_devices.append(
				DeviceModel(
					device_id=device[0], 
					device_name=device[1], 
					device_status=device[2]
					)
				)

		return list_of_devices

	def get_device(self, device_id: str) -> DeviceModel:
		self.cursor.execute("SELECT id, name, state_of_device.state FROM devices INNER JOIN state_of_device WHERE devices.id = state_of_device.id_of_device")
		device = self.cursor.fetchone()

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
			return True
		except sqlite3.IntegrityError:
			return False

	def update_status_device(self, device_id: str, status: str):
		self.cursor.execute("UPDATE state_of_device SET state = ? WHERE id_of_device = ?", (status, device_id))
		connection.commit()

sqlite_engine = SQLiteDB()