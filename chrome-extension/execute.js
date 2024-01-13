// assume params are set before this script is executed

params = JSON.parse(params);
if (params.initiate_task == false) {
    if (params.name == "navigate_to_url") {
        window.location.href = params.arguments.url;
    } else if (params.name == "search") {
        window.location.href = "https://www.google.com/search?q=" + params.arguments.query;
        window.onload = function() {
            const elements = getElements();

        }
    }
} else {

    if (params.name == "click") {
        document.querySelector(params.arguments.element_id).click();
    } else if (params.name == "type") {
        document.querySelector(params.arguments.selector).value = params.arguments.text;
    }
}

var elements = getElements();
chrome.runtime.sendMessage({message: {elements: elements}});
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

    return valid_elements;
}
