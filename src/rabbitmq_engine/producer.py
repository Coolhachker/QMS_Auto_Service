import pika
from typing import Any, Optional
import json
import re

from configs.Hosts import Hosts
from src.rabbitmq_engine.Queue import Queue
from src.databases.sqlite_db.sqlite_engine import sqlite_engine

from src.post_logs_engine.post_log import postLog


class Producer:
    def __init__(self, host):
        self.parameters = pika.ConnectionParameters(heartbeat=0, host=host)
        self.connection = pika.BlockingConnection(self.parameters)
        self.channel = self.connection.channel()

        self.queue = Queue.qms_queue
        self.callback_queue = Queue.qms_callback_queue
        self.ping_pong_queue = Queue.ping_pong_queue
        self.exchange = ''

        self.declare_queues()
        self.consume_the_response()

        self.response: Optional[str] = None


    def declare_queues(self):
        self.channel.queue_declare(queue=self.queue, durable=True)
        self.channel.queue_declare(queue=self.callback_queue, durable=True)
        self.channel.queue_declare(queue=self.ping_pong_queue, durable=True)

    def publish(self, message: Any, properties: pika.BasicProperties = None, queue=None, callback_queue=None, wait: bool = True):
        properties_with_reply_to = pika.BasicProperties(delivery_mode=pika.DeliveryMode.Persistent, reply_to=self.callback_queue)
        try:
            self.channel.basic_publish(
                exchange=self.exchange,
                routing_key=self.queue,
                body=message.encode(),
                properties=properties_with_reply_to
            )

            count: int = 0
            while self.response is None and wait:
                self.connection.process_data_events(time_limit=1)
                count += 1
                if count == 10:
                    sqlite_engine.update_status_device(json.loads(message)['device_id'], 'off')
                    raise ConnectionRefusedError('соединение с клиентом потеряно')
            response = self.response
            self.response = None
            return json.loads(response)
        except (pika.exceptions.ChannelWrongStateError, pika.exceptions.StreamLostError, AssertionError) as ex:
            self.reconnect()
            self.publish(message=message, properties=properties, queue=queue, wait=wait)

        except ConnectionRefusedError:
            return {'response': 4, 'message': 'Клиент не отвечает.'}

    def consume_the_response(self):
        """
        Функция нужна для обозначения ожидания ответа от Consumer в очереди self.callback_queue

        :return: None
        """
        self.channel.basic_qos(prefetch_count=25)
        self.channel.basic_consume(
            queue=self.callback_queue,
            on_message_callback=self.on_response,
            auto_ack=True
        )

    def on_response(self, channel, method, properties, body: bytes):
        """
        Callback функция на ответ от Consumer
        :param channel: канал связи
        :param method: метод передачи
        :param properties: настройки передачи
        :param body: сообщение ответа в виде байтов
        :return: None
        """
        message = body.decode()
        message_json = json.loads(message)
        postLog.debug(f"Получил сообщение от клиента - {message}")
        if re.search(r'ERROR', message):
            raise WronglyResponse(f'Ошибка: {message}')
        if message_json['response'] == 2:
            sqlite_engine.update_status_device(message_json['device_id'], 'working')
        if message_json['response'] == 5:
            sqlite_engine.update_status_device(message_json['device_id'], 'on')
            postLog.info(f'Данные теста устройства {message_json['device_id']}, {message_json['data']}')
        self.response = body.decode()


    def reconnect(self):
        """
        Функция нужна для переподключения к контейнеру rabbitmq

        :return: None
        """
        self.connection = pika.BlockingConnection(self.parameters)
        self.channel = self.connection.channel()
        self.consume_the_response()


producer = Producer(Hosts.rabbitmq)