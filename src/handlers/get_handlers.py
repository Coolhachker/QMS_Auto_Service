from fastapi import FastAPI

from src.responses.responses_200 import main_page_response

from src.databases.sqlite_db.sqlite_engine import sqlite_engine



def get_handlers(router: FastAPI):
	@router.get('/')
	async def handle_request_on_main_page():
		return main_page_response

	@router.get('/get_devices')
	async def hadle_request_on_get_devices():
		return sqlite_engine.get_devices()