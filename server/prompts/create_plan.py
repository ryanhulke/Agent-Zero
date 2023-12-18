from openai import OpenAI

async def create_plan(task):
    model = OpenAI()
    system_prompt = """You are a helpful AI that will create an initial general step-by-step plan to complete a given computer task.\n
    At each stage, you are able to take 1 of 5 actions: click, type, search, and navigate_to_url, and ask_user.\n
    Only ask the user for input when you absolutely need clarification or additional info. (ex. you're stuck because you need their login info).\n
    Take a deep breath and give a smart plan using these actions in sequence to complete the task.\n
    Think step by step.
    Here is an example of how you should format your response:\n\n
    USER: "Read my top 2 emails and reply to each of them appropriately."\n
    ASSISTANT: "1. ask the user which email service they user\n
    2. navigate to the user's email service\n
    3. click on the user's inbox\n
    4. click on the user's top email\n
    5. read it and click on the reply button\n
    6. type the user's reply\n
    7. click send\n
    8. click on the user's next top email\n
    9. read it and click on the reply button\n
    10. type the user's reply\n
    11. click send"\n\n
    """
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
                }]
        }
        ]
    response = await model.chat.completions.create(model="gpt-4-1106-preview", messages=messages)
    plan = response.choices[0].message.content
    return plan
    