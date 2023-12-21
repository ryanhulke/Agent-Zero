from aiohttp import web
from prompts.validate_task import validate_task
from prompts.general_q import general_q
from format.format_messages import format_messages
from Thread import Thread


# dictionary to store all active threads - key: user_id, value: Thread object
# once a task is finished, it gets saved to a database and deleted from this dictionary in server RAM
threads = {}

# handle post requests from client, send msg to API, and return response
async def handle_request(request):
    try:
        request_data = await request.json()
        req_type = request_data['type']
        # if request is an initial submission from web app
        if (req_type == 'task'):
            messages = format_messages(request_data['messages'])
            prompt = messages[-1]['content'][0]['text']

            # checks to see if the request is a computer task to be completed (needs to open a tab)
            is_task = validate_task(prompt)

            # if the prompt is a task (needs to open a tab)
            if (is_task):
                thread = Thread(prompt)
                threads[thread.id] = thread
                action = thread.get_action(prompt)
                return web.json_response(action)
            
            # if the request is a general question/prompt (doesn't need to open a tab)
            else:
                response = general_q(messages)
                return web.json_response(response)
            
        # if the request is from an update from the chrome extension's browser tab
        elif (req_type == 'update'):
            prompt = messages[-1].get('content')[0].get('text')
            base64_image =request_data.get('image')
            id = request_data.get('id')
            elements = request_data.get('elements')

            action = threads[id].get_action(prompt, base64_image, elements)

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
