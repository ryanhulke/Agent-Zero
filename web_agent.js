const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const OpenAI = require('openai');
const readline = require('readline');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');

puppeteer.use(StealthPlugin());

const openai = new OpenAI();
const timeout = 10000;

async function image_to_base64(image_file) {
    return await new Promise((resolve, reject) => {
        fs.readFile(image_file, (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                reject();
                return;
            }

            const base64Data = data.toString('base64');
            const dataURI = `data:image/jpeg;base64,${base64Data}`;
            resolve(dataURI);
        });
    });
}

async function input( text ) {
    let the_prompt;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await (async () => {
        return new Promise( resolve => {
            rl.question( text, (prompt) => {
                the_prompt = prompt;
                rl.close();
                resolve();
            } );
        } );
    })();

    return the_prompt;
}

async function sleep( milliseconds ) {
    return await new Promise((r, _) => {
        setTimeout( () => {
            r();
        }, milliseconds );
    });
}

async function waitForEvent(page, event) {
    return page.evaluate(event => {
        return new Promise((r, _) => {
            document.addEventListener(event, function(e) {
                r();
            });
        });
    }, event)
}

async function highlight_links( page ) {
    await page.evaluate(() => {
        document.querySelectorAll('[gpt-link-text]').forEach(e => {
            e.removeAttribute("gpt-link-text");
        });
    });

    const elements = await page.$$(
        "a, button, input, textarea, [role=button], [role=treeitem]"
    );
    
    let valid_elements = [];
    for (let i = 0; i < elements.length; i++) {
        const e = elements[i];
        const isValid = await page.evaluate(e => {
            function getRandomColor() {
                var letters = '0123456789ABCDEF';
                var color = '#';
                for (var j = 0; j < 6; j++) {
                color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            }
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
            var borderColor = getRandomColor();
            e.style.outline = `2px dashed ${borderColor}`;
            var label = document.createElement("span");
            label.textContent = i;
            label.style.position = "absolute";
            label.style.top = "-19px";
            label.style.left = "0px";
            label.style.background = borderColor;
            label.style.color = "white";
            label.style.padding = "2px 4px";
            label.style.fontSize = "12px";
            label.style.borderRadius = "2px";
            e.appendChild(label);
            const position = e.getBoundingClientRect();

            if( position.width > 5 && position.height > 5 && isElementVisible(e) ) {
                const link_text = e.textContent.replace(/[^a-zA-Z0-9 ]/g, '');
                e.setAttribute( "gpt-link-text", link_text );
                return true;
            }
            return false;
        }, e);
        if (isValid) {
            valid_elements.push(e);
        }
    };
    return valid_elements;
}

(async () => {
    console.log( "###########################################" );
    console.log( "# GPT4V-Browsing by Unconventional Coding #" );
    console.log( "###########################################\n" );

    const platform = os.platform();
    const username = os.userInfo().username;
    if (platform !== 'win32' && platform !== 'darwin') {
        console.log("ERROR: Unsupported operating system");
        process.exit(1);
    } else if (platform === 'win32') {  // path for Windows
        executablePath = `C:\\Users\\${username}\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe`;
        userDataDir = `C:\\Users\\${username}\\AppData\\Local\\Google\\Chrome SxS\\User Data`;
    } else { // path for macOS
        executablePath = `/Applications/Google\\ Chrome\\ Canary.app/Contents/MacOS/Google\\ Chrome\\ Canary`;
        userDataDir = `/Users/${username}/Library/Application\\ Support/Google/Chrome\\ Canary/Default`;
    }

    const browser = await puppeteer.launch( {
        headless: "false",
        executablePath: executablePath,
        userDataDir: userDataDir
    } );

    const page = await browser.newPage();

    await page.setViewport( {
        width: 1200,
        height: 1200,
        deviceScaleFactor: 1,
    } );

    const messages = [
        {
            "role": "system",
            "content": `You are a website crawler. You will be given instructions on what to do by browsing. You are connected to a web browser and you will be given the screenshot of the website you are on. The links on the website will be highlighted in red in the screenshot. Always read what is in the screenshot. Don't guess link names.

            You can go to a specific URL by answering with the following JSON format:
            { "url": "url goes here" }

            You can click links on the website by referencing the text inside of the link/button, by answering in the following JSON format:
            { "click": element number }
            for example:
            { "click": 2 }

            Once you are on a URL and you have found the answer to the user's question, you can answer with a regular message.

            Use google search by set a sub-page like 'https://google.com/search?q=search' if applicable. Prefer to use Google for simple queries. If the user provides a direct URL, go to that one. Do not make up links`,
        }
    ];

    console.log("GPT: How can I assist you today?")
    const prompt = await input("You: ");
    console.log();

    messages.push({
        "role": "user",
        "content": prompt,
    });

    let url;
    let screenshot_taken = false;

    // element labels drawn on page
    let labels = [];

    while( true ) {
        if( url ) {
            console.log("Crawling " + url);
            await page.goto( url, {
                waitUntil: "domcontentloaded",
                timeout: timeout,
            } );

            await Promise.race( [
                waitForEvent(page, 'load'),
                sleep(timeout)
            ] );
            console.log("labels: ", labels);
            labels = await highlight_links( page );

            console.log("Marked page")
            await page.screenshot( {
                path: "screenshot.jpg",
                fullPage: true,
            } );
            console.log("Took screenshot")
            screenshot_taken = true;
            url = null;
        }

        if( screenshot_taken ) {
            const base64_image = await image_to_base64("screenshot.jpg");

            messages.push({
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": base64_image,
                    },
                    {
                        "type": "text",
                        "text": "Here's the screenshot of the website you are on right now. You can click on links with {\"click\": \"element number\"} or you can crawl to another URL if this one is incorrect. If you find the answer to the user's question, you can respond normally.",
                    }
                ]
            });

            screenshot_taken = false;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            max_tokens: 1024,
            messages: messages,
        });

        const message = response.choices[0].message;
        const message_text = message.content;

        messages.push({
            "role": "assistant",
            "content": message_text,
        });

        console.log( "GPT: " + message_text );

        if (message_text.indexOf('{ "click": "') !== -1) {
            let parts = message_text.split('{ "click": "');
            parts = parts[1].split('"}');
            const element = parts[0].replace(/[^a-zA-Z0-9 ]/g, '');
        
            console.log("Clicking on " + element)
            const element_number = parseInt(element);
            try {
                if (element_number < labels.length && element_number > 0) {
                    const target = labels[element_number];
                    const [response] = await Promise.all([
                        page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(e => console.log("Navigation timeout/error:", e.message)),
                        target.click()
                    ]);
        
                    // Additional checks can be done here, like validating the response or URL
                    await Promise.race( [
                        waitForEvent(page, 'load'),
                        sleep(timeout)
                    ] );

                    labels = await highlight_links(page);

                    await page.screenshot({
                        path: "screenshot.jpg",
                        quality: 100,
                        fullpage: true
                    });
        
                    screenshot_taken = true;
                } else {
                    throw new Error("Can't find element");
                }
            } catch (error) {
                console.log("ERROR: Clicking failed", error);
        
                messages.push({
                    "role": "user",
                    "content": "ERROR: I was unable to click that element",
                });
            }
        
            continue;
        } else if (message_text.indexOf('{ "url": "') !== -1) {
            let parts = message_text.split('{ "url": "');
            parts = parts[1].split('" }');
            url = parts[0];
        
            continue;
        }

        const prompt = await input("You: ");
        console.log();

        messages.push({
            "role": "user",
            "content": prompt,
        });
    }
})();
