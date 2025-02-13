const AD_SELECTORS = [
    '[class*="ad"]',
    '[class*="sponsored"]',
    '[class*="promo"]', 
    '[class*="banner"]',
    '[id*="ad"]',
    '[id*="sponsored"]',
    '[id*="promo"]',
    '[id*="banner"]',
    'iframe[src*="ads"]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
    'iframe[src*="taboola"]',
    'iframe[src*="outbrain"]' 
];

let replacedElements = new Set();

function createTaskReminder(task) {
    const reminder = document.createElement('div');
    reminder.className = 'task-reminder-extension';

    const dueDate = newDate(task.dueDate).toLocalDateString();

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
            console.log("Add element found", adElement);
            if (replacedElements.has(adElement)) return;

            const rect = adElement.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const task = tasks[taskIndex % tasks.lenght];
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