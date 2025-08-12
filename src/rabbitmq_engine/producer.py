import pika

from configs.Hosts import Hosts
from src.rabbitmq_engine.Queue import Queue


class Producer:
	def __init__(self, host):
		self.parameters = pika.ConnectionParameters(heartbeat=120, host=host)
        self.connection = pika.BlockingConnection(self.parameters)
        self.channel = self.connection.channel()

        self.queue = Queue.qms_queue
        self.callback_queue = Queue.qms_callback_queue
        self.ping_pong_queue = Queue.ping_pong_queue

        self.declare_queues()


    def declare_queues(self):
    	self.channel.queue_declare(queue=self.queue, durable=True)
        self.channel.queue_declare(queue=self.callback_queue, durable=True)
        self.channel.queue_declare(queue=self.ping_pong_queue, durable=True)

