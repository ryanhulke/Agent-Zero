from openai import OpenAI

def describe_element(element_description, element_image):
    model = OpenAI()
    system_prompt = """You are a helpful AI that takes in some info about an html element
      and an image of it, and outputs a brief description of what it is and what it might do. If the image 
      is blank or the element is not visible, it likely does nothing. Keep in mind that the purpose of this 
      is to ultimately describe the purpose of element on a page in plain text, so that a language 
      model can use this description to take an action on the element, such as click or type into it.
      Here are some example responses. Your response doesn't have to be structured like this or as brief as this
      if you have more valuable information to provide.: 
      A return button, that may take you back to the previous page
      A search bar that says "ask me something..." in it
      A blue button containing the word "submit", which may submit a form
      A link that takes you to "https://www.twitter.com/account"
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
                "text": element_description
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": element_image
                }
            }]
        
        }]
    
  
    response = model.chat.completions.create(model="gpt-4-vision-preview", messages=messages)
    msg = response.choices[0].message.content
    return msg