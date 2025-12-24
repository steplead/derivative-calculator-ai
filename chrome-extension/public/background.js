// Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "solve-derivative",
        title: "Solve: '%s'",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "solve-derivative" && info.selectionText) {
        // Open side panel
        chrome.sidePanel.open({ windowId: tab?.windowId });

        // Wait a bit for side panel to open then send message
        setTimeout(() => {
            chrome.runtime.sendMessage({
                action: "SOLVE_SELECTION",
                text: info.selectionText
            });
        }, 500);
    }
});
