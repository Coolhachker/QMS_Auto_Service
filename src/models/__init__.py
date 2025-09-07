from pydantic import BaseModel
from typing import Optional

import datetime


class StartNetConnectionModel(BaseModel):
	ssid: str
	password: str
	list_id_of_devices: list[str]
	count_of_tests: int = 1


class DeviceModel(BaseModel):
	device_id: str
	device_name: str
	device_status: str


class Device(BaseModel):
	device_id: str


class Test(BaseModel):
	date_of_test: datetime.datetime
	name_of_test: Optional[str]


class DataOfTest(BaseModel):
	device_id: str
	downstream: float
	upstream: float
	attempt: int = 1



