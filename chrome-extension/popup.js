document.getElementById('captureBtn').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: "captureTab" });
});