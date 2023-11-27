import asyncio
import aiohttp
from aiohttp import web
import json
from Thread import Thread

# global dictionary of thread_ids -> Thread objects
user_threads = {}

# handle post requests from client, send msg to API, and return response
async def handle_request(request):
    print(request)
    request_data = await request.json()
    user_id = request_data.get('user_id')
    print(user_id)
    if user_id not in user_threads:
        user_threads[user_id] = Thread(user_id)
    try:
        thread = user_threads[user_id]
        res = await thread.send_message(request_data)
        print(res)
    except Exception as e:
        print("error: ", e)
        return web.Response(status=500)
    return web.json_response(res)


app = web.Application()
app.router.add_post('/api', handle_request)

web.run_app(app, host='localhost', port=8000)
print("HTTP server started.")