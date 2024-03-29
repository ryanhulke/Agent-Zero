from openai import OpenAI

# sees screen and plan, reasons the next action in plain English and updates rest of plan
def update_plan(task, base64_image):
    model = OpenAI()
    system_prompt = """You are a helpful AI that will read the plan to accomplish a task, 
    see the current screenshot, and decide what to do next, and then repeat the plan (with changes if necessary).\n
    At each stage, you are able to take 1 of 6 actions: click, type, search, and navigate_to_url, ask_user, or done.\n
    Only ask the user for input when you absolutely need clarification or additional info. (ex. you're stuck because you need their login info).\n
    Briefly describe the page we're on, take a deep breath, think step by step and then decide the best next action for the computer. Then complete the rest of the updated plan.\n

    Here are some examples of how you should format your response:\n\n
    USER: "Task: Read my top 2 emails and reply to each of them appropriately.\n
    Plan: Ask which email service they use, navigate to it, click on the inbox, click on the top email,
    read it and click on the reply, type the reply, click send, click on the next top email, 
    read it and click on the reply, type the reply, click send."\n
    Screenshot: *screenshot of the email inbox*\n\n
    ASSISTANT: "You are on the inbox page. You need to click on the top email next. 
    After that, type in the appropriate response, and then go to the inbox page and do the same for the next email."\n\n
    ex. 2: \n
    USER: "Task: Go to the website of my favorite restaurant and order my favorite meal.\n
    Plan: You are on the "finalize order" page. Click on the "place order" button.\n
    Screenshot: *screenshot of the "finalize order" page, indicating you placed the order*"\n\n
    ASSISTANT: "You are on the "finalize order" page, indicating you placed the order, so the task is complete."\n\n"""
    messages = [{
            "role": "system",
            "content": [{
                "type": "text",
                "text": system_prompt
        }]
        },
        {
            "role": "user",
            "content": [{
                "type": "text",
                "text": task
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": base64_image
                }
            }]
        }
        ]
    response = model.chat.completions.create(model="gpt-4-vision-preview", messages=messages)
    plan = response.choices[0].message.content
    print(plan)
    return plan
    