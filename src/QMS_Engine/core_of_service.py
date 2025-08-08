from starlette.responses import JSONResponse

from fastapi import FastAPI, APIRouter

from src.handlers.get_handlers import get_handlers

class QMSEngine:
	def __init__(self, app: FastAPI):
		self.app = app
		self.router_of_get_handlers = APIRouter()

	def run_case(self):
		get_handlers(self.router_of_get_handlers)