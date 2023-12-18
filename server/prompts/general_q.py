from openai import OpenAI

async def general_q(prompt):
    model = OpenAI()
    system_prompt = """You are a helpful AI named Zero that will answer the user's question based on the given prompt.\n
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
                "text": prompt
                }]
        }
        ]
    response = await model.chat.completions.create(model="gpt-4-1106-preview", messages=messages)
    msg = response.choices[0].message
    return msg