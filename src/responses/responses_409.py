from starlette.responses import JSONResponse


attempt_to_re_register = JSONResponse({"response": 'Вы попытались повторно зарегестрировать свое устройство в системе'}, status_code=409)