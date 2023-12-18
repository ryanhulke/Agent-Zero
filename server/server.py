from aiohttp import web
from prompts.validate_task import validate_task
from prompts.create_plan import create_plan
from prompts.update_plan import update_plan
from prompts.decide_next_action import decide_next_action
from prompts.general_q import general_q

# handle post requests from client, send msg to API, and return response
async def handle_request(request):
    print(request)
    try:
        request_data = await request.json()
        req_type = request_data.get('type')

        # if request is an initial submission from web app
        if (req_type == 'task'):
            prompt = request_data.get('messages')[0].get('content')[0].get('text')
            is_task = await validate_task(prompt)

            # if the request is a task (needs to open a tab)
            if (is_task):
                plan = await create_plan(prompt)
                action = await decide_next_action(prompt, plan)
                return web.json_response(action)
            
            # if the request is a general question/prompt (doesn't need to open a tab)
            else:
                response = await general_q(prompt)
                return web.json_response(response)
            
        # if the request is from an update from the chrome extension's browser tab
        elif (req_type == 'update'):
            prompt = request_data.get('messages')[0].get('content')[0].get('text')
            base64_image =request_data.get('image')
            plan = await update_plan(prompt, base64_image)
            action = await decide_next_action(prompt, plan)
            return web.json_response(action)            
        else:
            print("invalid request type")
            return web.Response(status=500)
        
    except Exception as e:
        print("error: ", e)
        return web.Response(status=500)

app = web.Application()
app.router.add_post('/api', handle_request)

web.run_app(app, host='localhost', port=8000)
print("HTTP server started.")