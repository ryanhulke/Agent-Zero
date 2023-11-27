const customCSS = `
    ::-webkit-scrollbar {
        width: 10px;
    }

    ::-webkit-scrollbar-track {
        background: #27272a;
    }

    ::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 0.375rem;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
`;

window.addEventListener('DOMContentLoaded', () => {
    const styleTag = document.createElement('style');
    styleTag.textContent = customCSS;
    document.head.append(styleTag);
});

const { ipcRenderer } = require('electron');

// Listen for messages from preload.js to navigate
ipcRenderer.on('navigate-webview', (event, action, payload) => {
    switch (action) {
        case 'goBack':
            if (window.history.length > 1) {
                window.history.back();
            }
            break;
        case 'goForward':
            if (window.history.length > 1) {
                window.history.forward();
            }
            break;
        case 'reload':
            window.location.reload();
            break;
        case 'loadURL':
            window.location.href = payload;
            break;
    }
});

// Send the current URL whenever it changes
window.addEventListener('load', () => {
    ipcRenderer.send('current-url', window.location.href);
    
    let oldHref = document.location.href;
    const body = document.querySelector("body");
    const observer = new MutationObserver(mutations => {
        if (oldHref !== document.location.href) {
            oldHref = document.location.href;
            ipcRenderer.send('current-url', window.location.href);
        }
    });
    observer.observe(body, { childList: true, subtree: true });
});

window.addEventListener('beforeunload', () => {
    ipcRenderer.send('current-url', window.location.href);
});

window.addEventListener('popstate', () => {
    ipcRenderer.send('current-url', window.location.href);
});
