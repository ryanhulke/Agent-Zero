let messages = []; // Store all messages here
const extensionId = "ehjpoiefjhmnbelangogfjphhhepegcp";
let onTaskQuestion = false;
let thread_id = null;
let performing_action = false;

$(document).ready(function() {
    // when a user submits a message
    $("#messageArea").on("submit", function(event) {
        var rawText = $("#text").val();

        addMessage(rawText, "user");
        if (onTaskQuestion) {
            getChatResponse("task_question_response");
            onTaskQuestion = false;
        } else {
            getChatResponse("task");
        }
        event.preventDefault();
    });
    
});

// Listen for messages from the background script
window.addEventListener("message", (event) => {
    if (event.origin == "http://localhost:5000" && event.data.type && event.data.type == "FROM_EXTENSION"
        && performing_action) {
        if (event.data.data.is_last_batch == true) {
            performing_action = false;
        }
        console.log("Message recived from contentScript:", event.data);
        if (event.data.data.hasOwnProperty("elements")) {
            var msg = {role: "user", content: null, elements: event.data.data.elements, elementImgs: event.data.data.elementImgs };
            if (event.data.data.hasOwnProperty("screenshot")) {
                msg.screenshot = event.data.data.screenshot;
            }
            msg.is_last_batch = event.data.data.is_last_batch;
            messages.push(msg);
            getChatResponse("update");
        } else if (event.data.data.hasOwnProperty("done")) {
            // add summary of task to chat log
            addMessage("Summary: " + event.data.data.summary, "assistant");
        }
    }
}); 

// add msg to chat window and message list for api
function addMessage (msg, role) {
    var name= "", r = "";
    role == "user" ? name = "You" : name = "Zero";
    role == "action" ? r = "action" : r = name;

    var messageHtml = `<div class="container ${r}">
        <h1 class="user_name">${name}</h1>
        <p>${msg}</p>
    </div>`;

    $("#messages").append($.parseHTML(messageHtml));
    if (role == "user")
        $("#text").val("");
    // Scroll to the bottom
    $("#messages").scrollTop($("#messages")[0].scrollHeight);
    messages.push({role: role, content: msg});
}

function getChatResponse(type) {
    let data = { type: type, messages: messages };
    if (thread_id != null) {
        data.thread_id = thread_id;
    }
    $.ajax({
        data: JSON.stringify(data),
        contentType: "application/json",
        type: "POST",
        url: "/api",
    }).done(function(data) {
        if (data.hasOwnProperty("content")) {
            addMessage(data.content, "assistant");
        } else if (data.hasOwnProperty("function")) {
            performing_action = true;
            if (data.initiate_task == true) {
                thread_id = data.thread_id;
                addMessage("Opening a new tab...", "action");
            }
            if (data.function.name == "navigate_to_url") 
                addMessage("Navigating to URL: " + data.function.arguments.url, "action");
            else if (data.function.name == "search")
                addMessage("Searching: " + data.function.arguments.query, "action");
            else if (data.function.name == "click")
                addMessage("Clicking...", "action");
            else if (data.function.name == "type")
                addMessage("Typing: " + data.function.arguments.text, "action");
            else if (data.function.name == "ask_user"){
                addMessage(data.function.arguments.prompt, "action");
                onTaskQuestion = true;
                // don't send message to background.js
                return;
            } else if (data.function.name == "done") {
                if (data.function.arguments.close_tab == true) {
                    addMessage("Closing the tab...", "action");
                }
                thread_id = null;
            }
            data.type = "FROM_PAGE";
            window.postMessage(data);
        }
    });
}