from fastapi import FastAPI

from src.responses.responses_200 import main_page_response


def get_handlers(router: FastAPI):
	@router.get('/')
	async def handler_of_main_page():
		return main_page_response