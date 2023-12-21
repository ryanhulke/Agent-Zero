import streamlit as st
import requests


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

    print(response)
    msg = response
  
    st.session_state.messages.append(response)

    print(msg["tool_calls"])   
    st.chat_message("assistant").write(msg["content"])