document.addEventListener('DOMContentLoaded', function() {
  const nameInput = document.getElementById('newTabName');
  const notesInput = document.getElementById('notes');

  // Get current tab info
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    
    // Get existing tab name and notes if any
    chrome.storage.local.get(['renamedTabs'], function(result) {
      const renamedTabs = result.renamedTabs || {};
      if (renamedTabs[currentTab.url]) {
        nameInput.value = renamedTabs[currentTab.url].title;
        notesInput.value = renamedTabs[currentTab.url].description || '';
      } else {
        nameInput.value = currentTab.title;
      }
      nameInput.select();
    });
  });

  const handleSave = () => {
    const newTitle = nameInput.value.trim();
    const description = notesInput.value.trim();
    
    if (newTitle) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        
        // Get existing renamed tabs
        chrome.storage.local.get(['renamedTabs'], function(result) {
          const renamedTabs = result.renamedTabs || {};
          
          // Update the renamed tabs
          renamedTabs[currentTab.url] = {
            title: newTitle,
            description: description,
            lastModified: Date.now()
          };
          
          // Store the updated data
          chrome.storage.local.set({ renamedTabs }, function() {
            // Update the current tab title
            chrome.scripting.executeScript({
              target: { tabId: currentTab.id },
              func: (title) => {
                document.title = title;
              },
              args: [newTitle]
            });
            
            // Close the popup
            window.close();
          });
        });
      });
    }
  };

  // Handle Enter key in both inputs
  nameInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      handleSave();
    }
  });

  notesInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      handleSave();
    }
  });
}); 