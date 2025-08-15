from starlette.responses import JSONResponse, HTMLResponse


main_page_response = HTMLResponse(content=open('data/website_files/html/main_page.html', encoding="utf-8").read(), status_code=200)
start_net_test = JSONResponse({"response": "Тест успешно запущен"}, status_code=200)
success_registration_device = JSONResponse({"response": 'Ваше устройство было успешно зарегистрировано в системе'}, status_code=200)
