import json
## converts the message object (and its nested objects) to a dictionary

def format_output(MsgObj, image_url=None):

    output = MsgObj.__dict__
    if (output["tool_calls"] is not None):
        output = output["tool_calls"][0].__dict__
        if (output["function"] is not None):
            output["function"] = output["function"].__dict__
            output["function"]["arguments"] = json.loads(output["function"]["arguments"])
            if (output["function"]["name"] == "search"):
                output["function"]["arguments"]["query"] = output["function"]["arguments"]["query"].replace(" ", "+")
    # if this is the first msg in the thread, then this initiate_task tells client to open a tab
    if (image_url == None):
        output["initiate_task"] = True
    else:
        output["initiate_task"] = False
    return output