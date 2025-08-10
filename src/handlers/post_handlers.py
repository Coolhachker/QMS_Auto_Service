from fastapi import FastAPI
from src.models import StartNetConnectionModel

from src.responses.responses_200 import start_net_test

from logging import getLogger

logger = getLogger()


def post_handlers(router: FastAPI):
	@router.post("/start_net_test")
	async def handle_start_net_test(data: StartNetConnectionModel):
		logger.debug(f"Данные, которые отправил клиента для тестирования сети: {data}")
		# отправка консумерам задачи
		# ...
		# принятие от них результатов
		return start_net_test