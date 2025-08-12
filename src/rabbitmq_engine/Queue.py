from dataclasses import dataclass


@dataclass
class Queue:
	qms_queue: str = 'qms_queue'
	qms_callback_queue: str = 'qms_callback_queue'
	ping_pong_queue: str = 'ping_pong_queue'