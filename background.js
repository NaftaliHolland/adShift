chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        isEnabled: true,
        settings: {
            replaceAllAds: true,
            maxTasksPerPage: 5
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'GET_STATUS':
            chrome.storage.local.get('isEnabled', (data) => {
                sendResponse({ isEnabled: data.isEnabled });
            });
            return true;
            break;
        case 'GET_TASKS':
            chrome.storage.local.get(['tasks', 'settings'], (data) => {
                const tasks = data.tasks || [];
                const settings = data.settings || {};
                sendResponse({
                    tasks: tasks,
                    settings: settings
                });
            });
            return true;
            break
        case 'REFRESH_TASKS':
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'REFRESH_CONTENT'
                    });
                }
            });
            sendResponse({ success: true });
            break;
        case 'TOGGLE_EXTENSION':
            chrome.storage.local.get('isEnabled', (data) => {
                const newState = !data.isEnabled;
                chrome.storage.local.set({ isEnabled: newState }, () => {
                    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                        if (tabs[0]) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: 'STATE_CHANGED',
                                isEnabled: newState
                            });
                        }
                    });
                    sendResponse({ isEnabled: newState });
                });
            })
    }
})