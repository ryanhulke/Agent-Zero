
## converts the message object (and its nested objects) to a dictionary

def format_output(MsgObj):
    output = MsgObj.__dict__
    if (output["tool_calls"] is not None):
        output = output["tool_calls"][0].__dict__
        if (output["function"] is not None):
            output["function"] = output["function"].__dict__

    return output