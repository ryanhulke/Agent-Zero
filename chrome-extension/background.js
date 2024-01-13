
let tabId = 0; // The id of the tab we are automating
let elements = []; // The elements on the page
let url = ""; // The url of the page

/*
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "captureTab") {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.captureVisibleTab(tabs[0].windowId, {format: 'png'}, function(dataUrl) {
              if (chrome.runtime.lastError) {
                  console.error("Capture error:", chrome.runtime.lastError.message);
                  return;
              }
              // Process the captured image Data URL
              console.log("Captured screenshot:", dataUrl);
              // You can send it back to popup.js if needed
              sendResponse({screenshotUrl: dataUrl});
          });
      });
      return true; // Keep the message channel open for asynchronous response
  }
});
*/


  // when the server sends a message to extension to start a task, open a new tab
chrome.runtime.onMessage.addListener(({message, sender, sendResponse}) => {
  
if (message.type && message.type == "RETURN_ELEMENTS") {
  elements = message.elements;
  chrome.tabs.query({url: "http://localhost:5000/"}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {elements: message.elements, screenshot: message.screenshot});
  });
} else if (message.initiate_task == true) {
      if (message.function.name == "navigate_to_url") {
        console.log("Navigating to URL:", message.function.arguments.url);
        chrome.windows.create({
          url: message.function.arguments.url,
          type: 'normal', // or 'popup' for a smaller window
          width: 800,
          height: 600
        }, function(window) {
            // This callback function will execute after the window is created
            tabId = window.tabs[0].id;
            chrome.tabs.onUpdated.addListener(function(tabID, changeInfo, tab) {
              console.log("loaded");
              if (changeInfo.status == 'complete' && tabId == tabID ) {
                console.log("getting elements: ->>");
                  // Now send the message
                  getElements();
              }
            });
        });
      } else if (message.function.name == "search") {
        console.log("Searching:", message.function.arguments.query);
        let tempURL = "https://www.google.com/search?q=" + message.function.arguments.query;
        chrome.windows.create({
          url: tempURL,
          type: 'normal',
          width: 600,
          height: 400
        }, function(window) {
            // This callback function will execute after the window is created
            console.log("window created");
            tabId = window.tabs[0].id;
            
            console.log("waiting: ", tabId, url);
            chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

              if (changeInfo.status == 'complete' && tab.url == tempURL) {
                console.log("getting elements: ->");
                  // Now send the message
                  getElements();
              }
            });
        });
      }
      // if we don't needa openn a new tab, just execute the function using execute.js
  } else {
    execute(message);
    getElements();
  }

});

function execute(message) {
  console.log("Executing function:", message.function);
  message.type = "EXECUTE";
  chrome.tabs.sendMessage(tabId, message);
}

function getElements() {
  console.log("Getting elements")
  chrome.tabs.sendMessage(tabId, { type: "GET_ELEMENTS" });

}
function onCaptured (imageUri) {
  console.log("Captured screenshot: " + imageUri);
  chrome.tabs.query({url: "http://localhost:5000"}, function(tabs) {
          
            if (!tabs.length) {
              console.log("No tabs found");
              return;
            }
            console.log("Tab ID:", tabs[0].id);
    
            chrome.tabs.sendMessage(tabs[0].id, { screenshot: dataUrl, elements: elements });
  });
}

function onError (error) {
  console.log(`Error: ${error}`);
}
