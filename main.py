from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from src.QMS_Engine.core_of_service import QMSEngine

from logging import basicConfig, DEBUG, INFO, WARNING, getLogger
basicConfig(filename='data/logs/logs.log', encoding="utf-8", filemode='a', level=DEBUG, format='%(levelname)s : %(asctime)s - %(message)s')
logger = getLogger()


app = FastAPI()

app.mount('/css', StaticFiles(directory='data/website_files/css/'))
app.mount('/js', StaticFiles(directory='data/website_files/js/'))

engine = QMSEngine()
logger.info("Инициализировалось ядро сайта.")

engine.run_case()

app.include_router(engine.router_of_get_handlers)
app.include_router(engine.router_of_post_handlers)
logger.info("Подключил все endpoints")