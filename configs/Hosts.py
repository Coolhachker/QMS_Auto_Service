from dataclasses import dataclass


@dataclass
class Hosts:
	domain: str = "127.0.0.1"
	rabbitmq: str = "172.10.0.2"
	fluentd_logger: str = "172.10.0.5:9880"