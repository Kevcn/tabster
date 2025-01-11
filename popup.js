document.addEventListener('DOMContentLoaded', function() {
  const tabNameInput = document.getElementById('tabName');
  const saveButton = document.getElementById('saveButton');
  const resetButton = document.getElementById('resetButton');

  // Get current tab's name when popup opens
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    chrome.storage.local.get([currentTab.url], function(result) {
      if (result[currentTab.url]) {
        tabNameInput.value = result[currentTab.url];
      } else {
        tabNameInput.value = currentTab.title;
      }
    });
  });

  saveButton.addEventListener('click', function() {
    const newName = tabNameInput.value.trim();
    if (newName) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const data = {};
        data[currentTab.url] = newName;
        
        chrome.storage.local.set(data, function() {
          chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: (newTitle) => {
              document.title = newTitle;
            },
            args: [newName]
          });
          window.close();
        });
      });
    }
  });

  resetButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const originalTitle = currentTab.title;
      chrome.storage.local.remove(currentTab.url, function() {
        chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: (originalTitle) => {
            document.title = originalTitle;
          },
          args: [originalTitle]
        });
        window.close();
      });
    });
  });
}); 