from openai import OpenAI
import os
import json

# takes in the updated plan from vision model and calls the appropriate function
async def decide_next_action(task, plan, elements):

    # load the tools
    tool_files = [item for item in os.listdir("../lib") if os.path.isfile(os.path.join("../lib", item))]
    tools = []
    for tool_file in tool_files:
        with open(f"../lib/{tool_file}", "r") as f:
            tools.append(json.loads(f.read()))

    model = OpenAI()
    system_prompt = """You are a helpful AI that will decide the next action to take based on the task, the given interactable elements, and the plan.
     You are able to take 1 of 5 actions: click, type, search, and navigate_to_url, and ask_user.\n
    """
    user_prompt = f"""Task: {task}\n
    Updated Plan: {plan}\n
    Page Elements: {elements}\n
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
                "text": user_prompt
                }]
        }
        ]
    response = await model.chat.completions.create(model="gpt-4-1106-preview", messages=messages, tools=tools)
    return response.choices[0].message