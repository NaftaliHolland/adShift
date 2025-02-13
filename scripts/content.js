const AD_SELECTORS = [
    // Generic ad-related classes & IDs (case-insensitive)
    '[class*=" ad " i]', '[class^="ad-" i]', '[class$="-ad" i]', '[class*="-ad-" i]', 
    '[id^="ad-" i]', '[id*="-ad-" i]', '[id$="-ad" i]', 
    '[class*=" sponsored " i]', '[id*="sponsored" i]',
    '[class*=" promo " i]', '[id*="promo" i]',
    '[class*=" banner " i]', '[id*="banner" i]',
    
    // Common ad containers
    '[class*="ad-container" i]', '[class*="ad-slot" i]', '[class*="ad-placeholder" i]',
    '[class*="ad-wrapper" i]', '[class*="ad-unit" i]', '[class*="adsbygoogle" i]', 
    
    // Specific ad platforms
    'iframe[src*="ads" i]', 'iframe[src*="doubleclick" i]', 'iframe[src*="googlesyndication" i]',
    'iframe[src*="adservice" i]', 'iframe[src*="taboola" i]', 'iframe[src*="outbrain" i]',
    'iframe[src*="revcontent" i]', 'iframe[src*="mgid.com" i]',
    
    // Inline ad scripts
    'script[src*="ads" i]', 'script[src*="doubleclick" i]', 'script[src*="googlesyndication" i]',
    
    // Sponsored links
    'a[href*="sponsored" i]', 'a[href*="adclick" i]', 'a[href*="utm_source=ad" i]'
];

let replacedElements = new Set();

function createTaskReminder(task) {
    const reminder = document.createElement('div');
    reminder.className = 'task-reminder-extension';

    const dueDate = new Date(task.dueDate).toLocaleDateString();

    reminder.style.cssText = `
        padding: 15px;
        margin: 10px 0;
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        min-height: 100px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
    `;
    reminder.innerHTML = `
        <div style="margin-bottom: 8px; color: #0066cc; font-weight: bold;">
            Task Reminder
        </div>
        <div style="margin-bottom: 8px; color: #333;">
            ${task.text}
        </div>
        <div style="color: #666; font-size: 0.9em;">
            Due: ${dueDate}
        </div>
    `;

    return reminder;
}

async function replaceAds() {
    const { isEnabled } = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    if (!isEnabled) return;

    const response = await chrome.runtime.sendMessage({ type: 'GET_TASKS' });
    const tasks = response.tasks || [];

    if (tasks.length === 0) return;

    let taskIndex = 0;

    AD_SELECTORS.forEach(selector => {
        document.querySelectorAll(selector).forEach(adElement => {
            if (replacedElements.has(adElement)) return;

            const rect = adElement.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const task = tasks[taskIndex % tasks.length];
            const reminder = createTaskReminder(task);

            reminder.style.width = rect.width + 'px';
            reminder.style.height = rect.height + 'px';

            adElement.replaceWith(reminder);
            replacedElements.add(reminder);

            taskIndex++;
        });
    });
}

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            replaceAds();
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'REFRESH_CONTENT':
            replaceAds();
            break;
            
        case 'STATE_CHANGED':
            if (message.isEnabled) {
                replaceAds();
            } else {
                // Could implement logic to restore original ads
                location.reload();
            }
            break;
            
        case 'PAGE_LOADED':
            replaceAds();
            break;
    }
});

replaceAds();

observer.observe(document.body, {
    childList: true,
    subtree: true
});