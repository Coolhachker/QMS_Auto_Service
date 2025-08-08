from starlette.responses import JSONResponse, HTMLResponse


main_page_response = HTMLResponse(content=open('data/website_files/html/main_page.html', encoding="utf-8").read(), status_code=200)
