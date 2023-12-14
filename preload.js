const { ipcRenderer } = require('electron');

document.addEventListener("DOMContentLoaded", function () {
    // mini-browser setup

    const urlInput = document.getElementById('urlInput');
    const webview = document.getElementById('webview');

    document.getElementById('backButton').addEventListener('click', () => {
        webview.send('navigate-webview', 'goBack');
    });

    document.getElementById('forwardButton').addEventListener('click', () => {
        webview.send('navigate-webview', 'goForward');
    });

    document.getElementById('reloadButton').addEventListener('click', () => {
        webview.send('navigate-webview', 'reload');
    });

    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            webview.send('navigate-webview', 'loadURL', urlInput.value);
        }
    });

    webview.addEventListener('will-navigate', (event) => {
        console.log(event);
        urlInput.value = event.url;
    });

    ipcRenderer.on('update-url', (event, url) => {
        urlInput.value = url;
    });
    
    webview.addEventListener('dom-ready', () => {
        console.log(webview.getWebContentsId());
        ipcRenderer.send('webview-ready', webview.getWebContentsId());
    });
    
    // Agent stuff

    const inputElement = document.querySelector('input[type="text"]');
    const sendButton = document.querySelector('button#send');
    const chatContainer = document.querySelector('#chat-container');

    // document.querySelector('#screenshot').addEventListener('click', () => ipcRenderer.send('screenshot'));
    document.querySelector('#continue').addEventListener('click', () => ipcRenderer.send('continue'));
    document.querySelector('#execute').addEventListener('click', () => ipcRenderer.send('execute'));

    // document.querySelector('#mark').addEventListener('click', () => webview.send('observer', 'screenshot-start'));
    // document.querySelector('#unmark').addEventListener('click', () => webview.send('observer', 'screenshot-end'));
    document.querySelector('#export').addEventListener('click', () => ipcRenderer.send('export'));
    document.querySelector('#randomize').addEventListener('click', () => ipcRenderer.send('randomize'));
    
    ipcRenderer.on('end_turn', (event, content) => {
        // Create the message div and its container
        const messageDiv = document.createElement('div');
        messageDiv.className = "py-2 px-3 bg-indigo-700 text-indigo-200 rounded-lg shadow-md break-words";
        messageDiv.textContent = content; // This ensures no HTML or scripts in `content` are executed
    
        const containerDiv = document.createElement('div');
        containerDiv.className = "mb-2 mr-8";
        containerDiv.appendChild(messageDiv);
    
        // Append the message to the chat container
        chatContainer.appendChild(containerDiv);
        
        // Scroll to the bottom to show the newest messages
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });

    function getElements() {
        console.log(!document);
        var items = Array.prototype.slice.call(
          document.querySelectorAll('*')
        ).map(function(element) {
          var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
          var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
          
          var rects = [...element.getClientRects()].filter(bb => {
            var center_x = bb.left + bb.width / 2;
            var center_y = bb.top + bb.height / 2;
            var elAtCenter = document.elementFromPoint(center_x, center_y);
      
            return elAtCenter === element || element.contains(elAtCenter) 
          }).map(bb => {
            const rect = {
              left: Math.max(0, bb.left),
              top: Math.max(0, bb.top),
              right: Math.min(vw, bb.right),
              bottom: Math.min(vh, bb.bottom)
            };
            return {
              ...rect,
              width: rect.right - rect.left,
              height: rect.bottom - rect.top
            }
          });
      
          var area = rects.reduce((acc, rect) => acc + rect.width * rect.height, 0);
      
          return {
            element: element,
            include: 
              (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") ||
              (element.tagName === "BUTTON" || element.tagName === "A" || (element.onclick != null) || window.getComputedStyle(element).cursor == "pointer") ||
              (element.tagName === "IFRAME" || element.tagName === "VIDEO"),
            area,
            rects,
            text: element.textContent.trim().replace(/\s{2,}/g, ' ')
          };
        }).filter(item =>
          item.include && (item.area >= 20)
        );
      
        // Only keep inner clickable items
        items = items.filter(x => !items.some(y => x.element.contains(y.element) && !(x == y)))
      
        console.log("items: ", items);
        items = JSON.stringify(items.map(item => {
            return {
                x: (item.rects[0].left + item.rects[0].right) / 2, 
                y: (item.rects[0].top + item.rects[0].bottom) / 2,
                bboxs: item.rects.map(({left, top, width, height}) => [left, top, width, height])
            }
          }));
        return items;
    }
    function sendMessage() {
        console.log("sendMessage called");
        const userMessage = inputElement.value;
        if (!userMessage.trim()) return;

        // Append user's message
        chatContainer.innerHTML += `
          <div class="mb-2 ml-8">
              <div class="py-2 px-3 bg-zinc-200 text-zinc-700 rounded-lg shadow-md break-words">
                  ${userMessage}
              </div>
          </div>
      `;

        // Clear the input after sending the message
        inputElement.value = '';

        // Scroll to the bottom to show the newest messages
        chatContainer.scrollTop = chatContainer.scrollHeight;
        const elements = getElements();
        ipcRenderer.send('send', { userMessage, elements });
    }

    inputElement.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            console.log("Enter pressed");
            sendMessage();
            console.log("sendMessage called");
        }
    });

    sendButton.addEventListener('click', sendMessage);
});
