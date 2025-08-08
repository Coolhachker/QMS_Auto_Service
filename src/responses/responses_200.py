from starlette.responses import JSONResponse


main_page_response = JSONResponse({'response': 'OK'}, status_code=200)