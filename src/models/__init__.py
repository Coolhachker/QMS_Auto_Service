from pydantic import BaseModel


class StartNetConnectionModel(BaseModel):
	ssid: str
	password: str
	list_id_of_devices: list[str]


class DeviceModel(BaseModel):
	device_id: str
	device_name: str
	device_status: str


class Device(BaseModel):
	device_id: str