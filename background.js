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