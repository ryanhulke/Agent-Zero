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

    if (response["type"] == "function"):
        if (response["initiate_task"]):
            st.session_state.messages.append({
                "role": "assistant", 
                "content": "Opening a new tab..."
            })
            st.chat_message("assistant").write("Opening a new tab...")
            # open new tab here
            
        
        # send function to chrome extension here

        msg = {
            "role": "assistant", 
            "content": response["function"]["name"] + " " + response["function"]["arguments"]
        }
    else: 
        msg = {
            "role": "assistant", 
            "content": response["content"]
        }

    st.session_state.messages.append(msg)

    st.chat_message("assistant").write(msg["content"])