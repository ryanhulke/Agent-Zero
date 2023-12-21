from openai import OpenAI
from prompts.create_plan import create_plan
from prompts.update_plan import update_plan
import uuid
import json
import os

# each Thread object represents a task that is being completed
class Thread:

    # change this to the elements on google home page
    default_elements = ""

    # load all tools from lib folder
    tool_files = [item for item in os.listdir("./lib") if os.path.isfile(os.path.join("./lib", item))]
    tools = []
    for tool_file in tool_files:
        if ".json" in tool_file:
            with open(f"./lib/{tool_file}", "r") as f:
                tools.append(json.loads(f.read()))


    model = OpenAI()

    def __init__(self, task):

        self.id = uuid.uuid4()
        self.plan = create_plan(task)
        
        self.messages = [
            {
            "role": "system",
            "content": [{
                    "type": "text",
                    "text": """You are a helpful AI that will decide the next action to take based on
                     the task, the given interactable elements, and the plan. You are able to take 1 of 5
                     actions: click, type, search, and navigate_to_url, and ask_user.\n
        """
                }]
        }
        ]
    
    def get_action(self, prompt, image_url=None, elements=default_elements):

        if (image_url != None):
            self.plan = update_plan(prompt, image_url)

        self.messages.append({
            "role": "user",
            "content": [
                {
                    "type": "text", 
                    "text": f"""Task: {prompt}
                    Plan: {self.plan}
                    Page Elements: {elements}"""
                }
            ]
        })
        if (image_url != None):
            self.messages[-1]["content"].append({
                "type": "image_url",
                "image_url": {
                    "url": image_url
                }
            })
        
        response = Thread.model.chat.completions.create(
            model="gpt-4-1106-preview",
            messages=self.messages
        )
        response = response.choices[0].message.content
        print(response)    
        return response
