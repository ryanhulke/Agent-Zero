
chrome.tabs.onUpdated.addListener((tabId, tab) => {
    // when the user is on our website, we activate the extension...??? idk
    if (tab.url && tab.url.includes("localhost:8501")) {
        
        chrome.tabs.sendMessage(tabId, {
        type: "NEW",
        
      });
    }
  });
  // when the server sends a message to extension to start a task, open a new tab
chrome.runtime.onMessage.addListener(({message, sender, sendResponse}) => {
    if (message.action === 'start-task') {
      chrome.tabs.create({
        url: message.url
      }, tab => {
        autoTab = tab;
      });
    }
  });