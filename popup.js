document.addEventListener('DOMContentLoaded', function() {
  const nameInput = document.getElementById('newTabName');
  const notesInput = document.getElementById('notes');

  // Get current tab info
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    nameInput.value = currentTab.title;
    nameInput.select();

    // Get existing notes if any
    chrome.storage.local.get([currentTab.url], function(result) {
      if (result[currentTab.url]) {
        notesInput.value = result[currentTab.url].description || '';
      }
    });
  });

  const handleSave = () => {
    const newTitle = nameInput.value.trim();
    const description = notesInput.value.trim();
    
    if (newTitle) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        
        // Store the data
        const data = {};
        data[currentTab.url] = {
          title: newTitle,
          description: description
        };
        chrome.storage.local.set(data);

        // Update the tab title and create tooltip
        chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: (info) => {
            document.title = info.title;
            
            // Remove existing tooltip if any
            const existingTooltip = document.querySelector('.tab-tooltip');
            if (existingTooltip) {
              existingTooltip.remove();
            }
            
            // Create new tooltip
            let tooltip = document.createElement('div');
            tooltip.className = 'tab-tooltip';
            tooltip.style.cssText = `
              position: fixed;
              top: 0;
              left: 50%;
              transform: translateX(-50%);
              background: #333;
              color: white;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 14px;
              z-index: 2147483647;
              max-width: 500px;
              display: none;
              white-space: normal;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            tooltip.textContent = info.description ? `Notes: ${info.description}` : 'No notes';
            document.body.appendChild(tooltip);

            // Add hover listener
            document.addEventListener('mousemove', (e) => {
              if (e.clientY < 40) {
                tooltip.style.display = 'block';
              } else {
                tooltip.style.display = 'none';
              }
            });
          },
          args: [{
            title: newTitle,
            description: description
          }]
        });

        window.close();
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