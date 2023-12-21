### AGENT ZERO

## Description:
User on the web app sends a computer task to server, server calls the AI and returns the action to take.
The web app client recieves the action, but currently does nothing with it.

TO-DO: send functions (click, type, etc.) from web app client to chrome extension. write all of the chrome extension logic. implement async server requests

## How to run:
after installing dependancies, go into the server directory and run "python server.py". Then go into client directory and run "streamlit run streamlit-client.py".
