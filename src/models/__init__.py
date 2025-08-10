from pydantic import BaseModel


class StartNetConnectionModel(BaseModel):
	ssid: str
	password: str
	list_id_of_devices: list[int]


class DeviceModel(BaseModel):
	device_id: int
	device_name: str
	device_status: bool | None = None