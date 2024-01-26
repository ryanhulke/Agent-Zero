let current_elements = [];

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // if its a message from the background script to execute a function
    
    if (message.type && message.type == "EXECUTE") {
        takeAction(message);
    } else if (message.type && message.type == "GET_ELEMENTS") {
        getElements(message);
    }
  });

  
function takeAction(message) {
  // take action

    console.log("actioning:", message.initiate_task)
    if (message.initiate_task == false){
      if (message.function.name == "navigate_to_url") {
          window.location.href = message.function.arguments.url;
      } else if (message.function.name == "search") {
          window.location.href = "https://www.google.com/search?q=" + message.function.arguments.query;
      } else if (message.function.name == "click") {
          console.log("clicking:", message.function.element_id)
          console.log(current_elements[parseInt(message.function.element_id)])
          current_elements[parseInt(message.function.element_id)].click();
      } else if (message.function.name == "type") {
          current_elements[message.function.element_id].value = message.function.arguments.text;
      }
    }
}
async function getElements() {
    
      // Get all the elements by the selector
    const elements = document.querySelectorAll(
        "a[href], [onclick], button, input, textarea, [contenteditable=true], [role=button], [role=treeitem], [role=link], [role=tab], [role=menuitem]"
    );
    let valid_elements = [];

    function isElementVisible(el) {
        if (!el) return false; // Element does not exist
        function isStyleVisible(el) {
            const style = window.getComputedStyle(el);
            return style.width !== '0' &&
                style.height !== '0' &&
                style.opacity !== '0' &&
                style.display !== 'none' &&
                style.visibility !== 'hidden';
        }
        
          // Check if the element is visible style-wise
        if (!isStyleVisible(el)) {
            return false;
        }

          // Traverse up the DOM and check if any ancestor element is hidden
        let parent = el;
        while (parent) {
            if (!isStyleVisible(parent)) {
                return false;
            }
            parent = parent.parentElement;
        }

        return true;
    }

    elements.forEach(e => {
        const position = e.getBoundingClientRect();

        if(position.width > 5 && position.height > 5 && isElementVisible(e)) {
            valid_elements.push(e);
        }
    });
    current_elements = valid_elements;
    console.log("valid elements:",current_elements)
      // Map to hold element-info pairs
    const elementInfoMap = new Map();

    valid_elements.forEach(e => {
        // Extracting relevant information
        let infoString = "";

        let type = e.tagName.toLowerCase();
        infoString += `Type: ${type}`;
        let innerText = e.innerText;
        if (innerText) {
            infoString +=`, Text: ${innerText}`;
        }
        let id = e.id;
        if (id) {
            infoString += `, Id: ${id}`;
        }
        let ariaLabel = e.getAttribute('aria-label');
        if (ariaLabel) {
            infoString += `, AriaLabel: ${ariaLabel}`;
        }
        let role = e.getAttribute('role');
        if (role) {
            infoString += `, Role: ${role}`;
        }
        let href = e.getAttribute('href');
        if (href) {
            infoString += `, Href: ${href}`;
        }

      // Add to map
      elementInfoMap.set(infoString, e);
    });

    var startTime = new Date().getTime();
    captureInBatches(elementInfoMap, 5);
    var endTime = new Date().getTime();
    console.log("time to take all screenshots:", endTime - startTime);
}

async function html2screenshot(element) {
    let canvas = await html2canvas(element);
    return canvas.toDataURL();
}


async function captureInBatches(elementsMap, batchSize) {
    var batch = [];
    var elementsArr = Array.from(elementsMap.entries())
    for (var i = 0; i < elementsArr.length; i++) {
        batch.push(elementsArr[i]);
        var is_last_batch = i === elementsArr.length - 1;
        if (batch.length === batchSize || is_last_batch) {
            // Process the current batch
            
            await processBatch(batch, is_last_batch);
            batch = [];
        }
    }
}

async function processBatch(batch, is_last_batch) {
    var canvi = [];
    var elementsInfo = [];
    for (const element of batch) {
        elementsInfo.push(element[0]);
    }
    var promises = batch.map(e => html2screenshot(e[1]));
    var elementImgs = await Promise.all(promises);

    var data = { elements: elementsInfo, type: "RETURN_ELEMENTS", elementImgs: elementImgs, is_last_batch: is_last_batch };
    if (is_last_batch) {
        var screenshot = (await html2canvas(document.body)).toDataURL();
        data.screenshot = screenshot;
    }
    chrome.runtime.sendMessage({message: data});
}