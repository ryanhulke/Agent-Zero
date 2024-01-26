### AGENT ZERO

This experimental project is a web app that works with a chrome extension, to allow AI to control your browser to do basic tasks for you.

## How to run:
make sure your openai api key is set to the environment variable OPENAI_API_KEY. Go to browser extensions and turn on developer mode. then click on "unpack" and unpack the "chrome-extension" folder. Then after installing dependancies, go into the server directory and run "python server.py". Then in the browser navigate to localhost:5000.

## Description:
User on the web app submits a task, the server calls the AI and returns the action to take.
The web app client recieves the action, sends it to the chrome extension, and the chrome extension will open a new tab if necessary, then execute the action.

## Similar Projects:
This product has been brought to life by hyperwriteAI as their Personal Assistant as well as several similar open-source projects. However, they each have their problems. The open-source projects are their own browser, as opposed to a chrome extension, which is impractical. And all of them, including Hyperwrite's, suffer from an annoyingly high error rate, making them unusable for many tasks.

Previous attempts have used given the model only the HTML/text of the web page, which limits its ability to click on things that do not have text, such as icons that are not labeled, but are obvious to humans. Some have sent the AI a screenshot of the webpage, but this does not help much.

## Approach:
My approach was to take an individual screenshot of each element on the page (via the html2canvas library), and send that along with its HTML to the LLM to describe what the element does. This way, we end up with an ordered list of elements and their descriptions, which can then be used in conjunction with a screenshot of the whole page, to let the AI decide where to click/type. This approach is impractical for production because html2canvas is slow for complex pages, and it uses lots of OpenAI tokens to describe the page's elements. However, it is a good proof of concept.
