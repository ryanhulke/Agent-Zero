
let tabId = 0; // The id of the tab we are automating
let elements = []; // The elements on the page
let url = ""; // The url of the page


  // when the server sends a message to extension to start a task, open a new tab
chrome.runtime.onMessage.addListener(({message, sender, sendResponse}) => {
  
if (message.type && message.type == "RETURN_ELEMENTS") {
  chrome.tabs.query({url: "http://localhost:5000/"}, function(tabs) {
    console.log(message.elements);
    chrome.tabs.sendMessage(tabs[0].id, {screenshot: message.screenshot, elements: message.elements,
       type: "FROM_ZERO", elementImgs: message.elementImgs, is_last_batch: message.is_last_batch });
  });
} else if (message.function.name == "done") {
  if (message.function.arguments.close_tab == true) {
    chrome.tabs.remove(tabId);
  }
  url = "";
  elements = [];
  tabId = 0;
  chrome.tabs.query({url: "http://localhost:5000/"}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {done: true, summary: message.function.arguments.summary});
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
                  // Now send the messa
                  getElements();
              }
            });
        });
      }
  } else {

    // since we don't needa open a new tab, just execute the function on the current tab
    execute(message);
    // once we complete the action (click, type, etc.), get the new elements on the page
    getElements();
  }

});

function execute(message) {
  console.log("Executing function:", message.function);
  message.type = "EXECUTE";

  // sends message to the content script titled "actionAndGetElements.js"
  chrome.tabs.sendMessage(tabId, message);
}

/* the getElements function, which gets received in actionAndGetElements.js, sends them in a message
 back to this background.js file, which sends them to the correct localhost:5000 tab's content script,
 which sends it to the app client via window.postMessage(). Then the app client can send the 
 elements/screenshot to the server
*/
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
