document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById('newTabName');
  let currentTab = null;

  // Get the current tab's title
  chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
    if (tabs[0]) {
      currentTab = tabs[0];
      input.value = currentTab.title;
      input.select();
    }
  });

  // Handle Enter key
  input.addEventListener('keyup', async function(event) {
    if (event.key === 'Enter') {
      const newName = input.value.trim();
      if (newName && currentTab) {
        const data = {};
        data[currentTab.url] = newName;
        
        try {
          await chrome.storage.local.set(data);
          await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: (newTitle) => {
              document.title = newTitle;
            },
            args: [newName]
          });
          window.close();
        } catch (err) {
          console.error('Failed to update tab name:', err);
        }
      }
    } else if (event.key === 'Escape') {
      window.close();
    }
  });

  // Handle click outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.container')) {
      window.close();
    }
  });

  // Auto-focus the input field
  input.focus();
}); 