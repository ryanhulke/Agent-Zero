

# converts msg format from streamlit client format - {role: "user", content: "hello"} 
# to openai format - {role: "user", content: [{type: "text", text: "hello"}]

def format_messages(messages):
    formatted_messages = []
    for msg in messages:
        new_msg = {
            "role": msg["role"],
            "content": [{
                "type": "text",
                "text": msg.get("content")
            }]}
        
        formatted_messages.append(new_msg)

    return formatted_messages