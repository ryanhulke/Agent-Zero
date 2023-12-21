from openai import OpenAI

def general_q(msgs):
    model = OpenAI()
    system_prompt = """You are a helpful AI named Zero"""
    messages = [{
            "role": "system",
            "content": [{
                "type": "text",
                "text": system_prompt
            }]
        }]
    
    for msg in msgs:
        messages.append(msg)
        
    response = model.chat.completions.create(model="gpt-4-1106-preview", messages=messages)
    msg = response.choices[0].message.__dict__
    return msg