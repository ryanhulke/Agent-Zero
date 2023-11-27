from openai import OpenAI


class Thread:
    def __init__(self, user_id):
        self.user_id = user_id
        self.client = OpenAI()
        self.system_message = {
            "role": "system",
            "content": [
                {
                    "type": "text", 
                    "text": """
                            You are a an AI designed to navigate the web one step at a time. You are given a task and a screenshot of the current webpage, and you must decide what to do next. 
                            You can click on an element (they will be labeled), type, scroll, request info from the user, or decide you are done if the task is completed.
                            Here are the functions you have access to:
                 
                            type ClickAction = { action: "click", element: number }
                            type TypeAction = { action: "type", element: number, text: string }
                            type ScrollAction = { action: "scroll", direction: "up" | "down" }
                            type RequestInfoFromUser = { action: "request-info", prompt: string }
                            type RememberInfoFromSite = { action: "remember-info", info: string }
                            type Done = { action: "done" }
                            
                            ## response format
                            {
                              briefExplanation: string,
                              nextAction: ClickAction | TypeAction | ScrollAction | RequestInfoFromUser | RememberInfoFromSite | Done
                            }
                            
                            ## response examples
                            {
                              "briefExplanation": "I'll type 'funny cat videos' into the search bar"
                              "nextAction": { "action": "type", "element": 11, "text": "funny cat videos" }
                            }
                            {
                              "briefExplanation": "Today's doodle looks interesting, I'll click it"
                              "nextAction": { "action": "click", "element": 9 }
                            }
                            {
                              "briefExplanation": "I have to login to create a post"
                              "nextAction": { "action": "request-info", "prompt": "What is your login information?" }
                            }
                            
                            ## instructions
                            # observe the screenshot, and think about the next action
                            # output your response in json according to the format above"""
                 },
            ]
        }
        self.messages = [self.system_message]
    
    async def send_message(self, request):
        # Assuming the request's data is sent as JSON
        request_data = await request.json()
        prompt = request_data['prompt']
        image_url = request_data['image_url']
        self.messages.append({
            "role": "user",
            "content": [
                {
                    "type": "text", 
                    "text": prompt
                 },
                 {
                    "type": "image", 
                    "image_url": {
                        "url": image_url
                    }
                 }
            ]
        })
        response = await self.client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=self.messages
        )
        response = response.choices[0].message.content
        print(response)

        return response
