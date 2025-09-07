from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from src.QMS_Engine.core_of_service import QMSEngine

from src.post_logs_engine.post_log import postLog
from configs.paths import path_to_log_file

app = FastAPI()

app.mount('/css', StaticFiles(directory='data/website_files/css/'))
app.mount('/js', StaticFiles(directory='data/website_files/js/'))
app.mount('/logs', StaticFiles(directory='data/logs/'))

engine = QMSEngine()
postLog.info("Инициализировалось ядро сайта.")

engine.run_case()

app.include_router(engine.router_of_get_handlers)
app.include_router(engine.router_of_post_handlers)
app.include_router(engine.router_of_websocket_handlers)
postLog.info("Подключил все endpoints")

from src.rabbitmq_engine.producer import producer
postLog.info('Запустился rmq брокер.')