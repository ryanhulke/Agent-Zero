var current_elements = [];

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
          current_elements[message.function.element_id].click();
      } else if (message.function.name == "type") {
          current_elements[message.function.element_id].value = message.function.arguments.text;
      }
    }
}
function getElements() {
      // Get all the elements by the selector
      const elements = document.querySelectorAll(
          "a, button, input, textarea, [role=button], [role=treeitem]"
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

          function isElementInViewport(el) {
              const rect = el.getBoundingClientRect();
              return (
                  rect.top >= 0 &&
                  rect.left >= 0 &&
                  rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                  rect.right <= (window.innerWidth || document.documentElement.clientWidth)
              );
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

          // Finally, check if the element is within the viewport
          return isElementInViewport(el);
      }

      elements.forEach(e => {
          const position = e.getBoundingClientRect();

          if(position.width > 5 && position.height > 5 && isElementVisible(e)) {
              valid_elements.push(e);
          }
      });

      current_elements = valid_elements;
      // turns element objects into one string for the ai
      let polishedElements = transformElements(valid_elements);

      html2canvas(document.body).then(canvas => {
        var img = canvas.toDataURL("image/png");
        console.log("screenshot:", img);
        let data = {elements: polishedElements, type: "RETURN_ELEMENTS", screenshot: img};
        chrome.runtime.sendMessage({message: data});
      });
}


function transformElements(elements) {
    let combinedElements = "";
    for (let i = 0; i < elements.length; i++) {
        let type = elements[i].tagName.toLowerCase();
        combinedElements += `${i}. Type: ${type}, Text: "${elements[i].textContent.trim()}"`;
        let role = elements[i].getAttribute('role');
        if (role) {
            combinedElements += `, Role: ${role}`;
        }
        let href = '';
        if (type === 'a') {
            href = elements[i].getAttribute('href');
        }
        if (href) {
            combinedElements += `, Href: ${href}`;
        }
        if (i !== elements.length - 1) {
            combinedElements += "\n";
        }
    }
    return combinedElements;
}