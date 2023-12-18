
import streamlit as st
import requests

# load all of the tools - click, type, search
import os
import json
tool_files = [item for item in os.listdir("../lib") if os.path.isfile(os.path.join("../lib", item))]
tools = []
for tool_file in tool_files:
    with open(f"../lib/{tool_file}", "r") as f:
        tools.append(json.loads(f.read()))


st.title("💬 Chat with Zero") 

if "messages" not in st.session_state:
    st.session_state["messages"] = [{"role": "assistant", "content": "How can I help you?"}]

for msg in st.session_state.messages:
    st.chat_message(msg["role"]).write(msg["content"])


if prompt := st.chat_input():

    st.session_state.messages.append({"role": "user", "content": prompt})
    st.chat_message("user").write(prompt)
    response = requests.post("http://localhost:8000/api", json={
        "type": "task",
        "messages": st.session_state.messages
    }).json()
    # send async request to localhost server(model="gpt-3.5-turbo-1106", max_tokens=2048, messages=st.session_state.messages, tools=tools)
    msg = response.choices[0].message
    print(msg)
    if msg.function_call is None:
        del msg.function_call
    if msg.tool_calls is None:
        del msg.tool_calls
    if msg.content is None:
        del msg.content
    st.session_state.messages.append(msg.__dict__)
    if (hasattr(msg, "tool_calls")):
        # function called
        print(msg.tool_calls)   
    st.chat_message("assistant").write(msg.content)