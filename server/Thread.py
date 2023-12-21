from openai import OpenAI
from prompts.create_plan import create_plan
from prompts.update_plan import update_plan
from format.format_output import format_output
import uuid
import json
import os

# each Thread object represents a task that is being completed
class Thread:

    # change this to the elements on google home page
    default_elements = ""

    # load all tools from lib folder
    tool_files = [item for item in os.listdir("./lib")]
    tools = []
    for tool_file in tool_files:
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
                    "text": """You are a Self-operating browser. You use the same operating system as a human.
                    You can go to websites, click on buttons, type, etc. to do things like
                    research, posting on social media, and online shopping.
                     Your goal is to take the best next action based on
                     the task, the current interactable elements on the page, and the current plan to complete the task. 
                     You are always to call one of your functions to take an action.
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
        
        response = Thread.model.chat.completions.create(
            model="gpt-4-1106-preview",
            messages=self.messages,
            tools=Thread.tools,
        )

        # formats from object to dictionary
        response = format_output(response.choices[0].message)

        # if this is the first msg in the thread, then this initiate_task tells client to open a tab
        if (image_url == None):
            response["initiate_task"] = True
        else:
            response["initiate_task"] = False

        print(response)    
        return response
