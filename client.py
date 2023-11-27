from openai import OpenAI
import base64
import io
import pyautogui as gui
import time

def encode_image(screenshot):
    jpg_image_buffer = io.BytesIO()
    screenshot.save(jpg_image_buffer, format='JPEG')
    final = base64.b64encode(jpg_image_buffer.getvalue()).decode('utf-8')
    return final

client = OpenAI()  
while(True):
    screenshot = gui.screenshot()
    base64_image = encode_image(screenshot)
    response = client.chat.completions.create(
        model="gpt-4-vision-preview",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What’s in this image?"},
                    {
                        "type": "image_url",
                        "image_url": f"data:image/jpg;base64,{base64_image}",
                    },
                ],
            }
        ],
        max_tokens=300,
    )
    print(response.choices[0].message.content)
    time.sleep(5) # sleep 5 seconds