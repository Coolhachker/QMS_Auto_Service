import requests

from dataclasses import dataclass

from configs.Hosts import Hosts


@dataclass
class LogLevels:
	DEBUG: str = 'DEBUG'
	INFO: str = 'INFO'
	WARNING: str = 'WARNING'
	CRITICAL: str = 'CRITICAL'



class postLog:
	@staticmethod
	def post_log(data: dict[str, str]):
		requests.post('http://'+Hosts.fluentd_logger+'/web-service', json=data)

	@staticmethod
	def info(message: str):
		data = {"log": message, "level": LogLevels.INFO}
		postLog.post_log(data)

	@staticmethod
	def debug(message: str):
		data = {"log": message, "level": LogLevels.DEBUG}
		postLog.post_log(data)

	@staticmethod
	def warning(message: str):
		data = {"log": message, "level": LogLevels.WARNING}
		postLog.post_log(data)

	@staticmethod
	def critical(message: str):
		data = {"log": message, "level": LogLevels.CRITICAL}
		postLog.post_log(data)