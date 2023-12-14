async function unmarkPage(page, labels) {
    for(const label of labels) {
      await page.evaluate(() => {
        document.body.removeChild(label); 
      })
    }
  }
async function markPage( page, labels) {
    await unmarkPage(page, labels);
    labels = [];
    // Mark and return all clickable elements
    // this function runs in the browser context separate from Node.js context.
    const res = await page.evaluate(() => {
        let label_elements = []
        let items = Array.prototype.slice.call(
            document.querySelectorAll('*')
        ).map(function(element) {
            var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            
            var rects = [...element.getClientRects()].map(bb => {
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
                (element.tagName === "IFRAME" || element.tagName === "VIDEO")
            ,
            area,
            rects,
            text: element.textContent.trim().replace(/\s{2,}/g, ' ')
            };
        }).filter(item =>
            item.include && (item.area >= 20)
        );
        
        // Only keep inner clickable items
        items = items.filter(x => !items.some(y => x.element.contains(y.element) && !(x == y)))
        
        // Function to generate random colors
        function getRandomColor() {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }
        
        // Lets create a floating border on top of these elements that will always be visible
        items.forEach(function(item, index) {
            item.rects.forEach((bbox) => {
            newElement = document.createElement("div");
            var borderColor = getRandomColor();
            newElement.style.outline = `2px dashed ${borderColor}`;
            newElement.style.position = "fixed";
            newElement.style.left = bbox.left + "px";
            newElement.style.top = bbox.top + "px";
            newElement.style.width = bbox.width + "px";
            newElement.style.height = bbox.height + "px";
            newElement.style.pointerEvents = "none";
            newElement.style.boxSizing = "border-box";
            newElement.style.zIndex = 2147483647;
            // newElement.style.background = `${borderColor}80`;
            
            // Add floating label at the corner
            var label = document.createElement("span");
            label.textContent = index;
            label.style.position = "absolute";
            label.style.top = "-19px";
            label.style.left = "0px";
            label.style.background = borderColor;
            label.style.color = "white";
            label.style.padding = "2px 4px";
            label.style.fontSize = "12px";
            label.style.borderRadius = "2px";
            newElement.appendChild(label);
            
            document.body.appendChild(newElement);
            label_elements.push(newElement);
            // item.element.setAttribute("-ai-label", label.textContent);
            });
        });
        items = items.map(item => {
            return {
                x: (item.rects[0].left + item.rects[0].right) / 2,
                y: (item.rects[0].top + item.rects[0].bottom) / 2,
            }
        })
        return { element_px_locations: items, labels: label_elements};
    });
    labels = res.labels;
    const element_px_locations = res.element_px_locations;
    return { element_px_locations, labels};
}

module.exports = { markPage };