const EventEmitter = require("events");
const { OpenAI } = require("openai");

class Thread extends EventEmitter {
    constructor() {
        super();
        this.client = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
        this.messages = [];
        this.user_id = Math.floor(Math.random() * 100000);
    }

    async sendMessage(prompt, image) {
        // Create the message object
        const msg = {}
        
        const response =  await fetch('http://localhost:8000/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: this.user_id,
                prompt: prompt,
                image: image,
            }),
        })
        const res = await response.json();
        // emit the response
        this.emit("end_turn", res);
    }
}

module.exports = Thread;