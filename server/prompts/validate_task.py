from openai import OpenAI

async def validate_task(task):
    model = OpenAI()
    system_prompt = """You are a helpful AI that will decide whether a given prompt is a 
     task that can be completed on a browser or not. You will be given the prompt and you are to return
      a boolean value indicating whether it is a valid task or not.\n
    here are a few examples:\n\n
    USER: "I want to find the weather in New York City."\n
    ASSISTANT: "True"\n\n
    USER: "What is 5 times 5?"\n
    ASSISTANT: "False"\n\n
    USER: "Find 10 candidates for a software engineering position on my LinkedIn, and send them each a message."\nWhat is the score of the Lakers game?"\n
    ASSISTANT: "True"\n\n
    USER: "Wslfslvasldkjf"\n
    ASSISTANT: "False"\n\n
    USER: "How do I write the code for a function that returns a list of 50 random numbers"\n
    ASSISTANT: "False"\n\n
    USER: "What is the score of the Lakers game?"\n
    ASSISTANT: "True"\n\n
    USER: "Find the highest rated Italian restaurant in San Francisco and make a reservation for 2 people at 7pm."\n
    ASSISTANT: "True" 
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
    response = await model.chat.completions.create(model="gpt-3.5-turbo-1106", messages=messages)
    bool_response = response.choices[0].message.content
    print(bool_response)
    return response.choices[0].message.content == "True"

