from starlette.responses import JSONResponse

from fastapi import FastAPI, APIRouter

from src.handlers.get_handlers import get_handlers
from src.handlers.post_handlers import post_handlers


class QMSEngine:
	def __init__(self):
		self.router_of_get_handlers = APIRouter()
		self.router_of_post_handlers = APIRouter()

	def run_case(self):
		get_handlers(self.router_of_get_handlers)
		post_handlers(self.router_of_post_handlers)