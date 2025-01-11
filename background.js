// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'renameTab',
    title: 'Rename Tab',
    type: 'normal',
    contexts: ['page'],
    documentUrlPatterns: ['<all_urls>']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'renameTab') {
    const newName = prompt('Enter new name for tab:', tab.title);
    if (newName) {
      // Store the new name
      const data = {};
      data[tab.url] = newName;
      chrome.storage.local.set(data, function() {
        // Update the tab title
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (newTitle) => {
            document.title = newTitle;
          },
          args: [newName]
        }).catch(err => console.log('Script injection failed:', err));
      });
    }
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get([tab.url], function(result) {
      if (result[tab.url]) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (newTitle) => {
            document.title = newTitle;
          },
          args: [result[tab.url]]
        }).catch(err => console.log('Script injection failed:', err));
      }
    });
  }
});

// Handle tab activation (switching between tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (tab.url) {  // Make sure URL is available
      chrome.storage.local.get([tab.url], function(result) {
        if (result[tab.url]) {
          chrome.scripting.executeScript({
            target: { tabId: activeInfo.tabId },
            func: (newTitle) => {
              document.title = newTitle;
            },
            args: [result[tab.url]]
          }).catch(err => console.log('Script injection failed:', err));
        }
      });
    }
  });
}); 