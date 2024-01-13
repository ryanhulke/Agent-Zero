### AGENT ZERO

## Description:
User on the web app sends a computer task to server, server calls the AI and returns the action to take.
The web app client recieves the action, sends it to the chrome extension, and the chrome extension executes the action.


## How to run:
make sure your openai api key is set to the environment variable OPENAI_API_KEY. Go to browser extensions and turn on developer mode. then click on "unpack" and unpack the "chrome-extension" folder. Then after installing dependancies, go into the server directory and run "python server.py". Then in the browser navigate to localhost:5000.

TO-DO: ensure the short side of the screenshot is less than 768px and the long side is less than 2,000px.

