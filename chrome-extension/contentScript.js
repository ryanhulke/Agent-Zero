

window.addEventListener("message", function(event) {
  // We only accept messages from our window
  if (event.source != window)
    return;
 
  // forward message to background.js
  if (event.data.type && (event.data.type == "FROM_PAGE")) {
    console.log("Forwarding message from contentScript to background:", event.data);
    chrome.runtime.sendMessage({message: event.data});
  }
}, false);

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log("Message recived from background, forwarding...");
  if (message.hasOwnProperty("elements")) {
    window.postMessage({
      type: "FROM_EXTENSION",
      data: message
  }, "http://localhost:5000");
  }
});