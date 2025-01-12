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
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      css: `
        .tab-renamer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 15vh;
          z-index: 2147483647;
        }
        .tab-renamer-container {
          display: flex;
          flex-direction: column;
          background-color: #ffffff !important;
          border-radius: 25px;
          padding: 16px 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.2s ease-out;
        }
        .tab-renamer-row {
          display: flex;
          align-items: center;
        }
        .tab-renamer-divider {
          width: 100%;
          height: 1px;
          background-color: #eee !important;
          margin: 12px 0;
        }
        .tab-renamer-label {
          font-size: 16px;
          margin-right: 12px;
          min-width: 100px;
          color: #333 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 500;
        }
        .tab-renamer-input {
          width: 320px;
          padding: 2px;
          border: none;
          font-size: 16px;
          outline: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #ffffff !important;
          color: #333 !important;
        }
        .tab-renamer-description {
          width: 320px;
          padding: 2px;
          border: none;
          font-size: 14px;
          outline: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #666 !important;
          height: 200px;
          resize: none;
          overflow-y: auto;
          background-color: #ffffff !important;
          
          /* Webkit (Chrome, Safari, Edge) scrollbar styling */
          &::-webkit-scrollbar {
            width: 8px;
            background-color: #ffffff !important;
          }
          
          &::-webkit-scrollbar-thumb {
            background-color: #cccccc !important;
            border-radius: 4px;
            border: 2px solid #ffffff !important;
          }
          
          &::-webkit-scrollbar-track {
            background-color: #ffffff !important;
          }
          
          /* Firefox scrollbar styling */
          scrollbar-width: thin;
          scrollbar-color: #cccccc #ffffff !important;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .tab-renamer-row {
          display: flex;
          align-items: center;
        }
        /* Add specific style for notes row */
        .tab-renamer-row.notes-row {
          align-items: flex-start;
          padding-top: 4px;
        }
        .tab-renamer-row.notes-row .tab-renamer-label {
          padding-top: 2px;
        }
      `
    });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async (currentTitle) => {
        // Get existing description if any
        const response = await chrome.runtime.sendMessage({
          action: 'getTabInfo',
          url: window.location.href
        });
        const existingDesc = response?.description || '';

        // Create and inject the dialog
        const overlay = document.createElement('div');
        overlay.className = 'tab-renamer-overlay';
        
        const container = document.createElement('div');
        container.className = 'tab-renamer-container';
        
        // Name row
        const nameRow = document.createElement('div');
        nameRow.className = 'tab-renamer-row';
        
        const nameLabel = document.createElement('span');
        nameLabel.className = 'tab-renamer-label';
        nameLabel.textContent = 'Tab name';
        
        const nameInput = document.createElement('input');
        nameInput.className = 'tab-renamer-input';
        nameInput.type = 'text';
        nameInput.value = currentTitle;
        nameInput.placeholder = 'Enter tab name';
        
        nameRow.appendChild(nameLabel);
        nameRow.appendChild(nameInput);
        
        // Horizontal divider
        const divider = document.createElement('div');
        divider.className = 'tab-renamer-divider';
        
        // Notes row (renamed from Description)
        const notesRow = document.createElement('div');
        notesRow.className = 'tab-renamer-row notes-row';
        
        const notesLabel = document.createElement('span');
        notesLabel.className = 'tab-renamer-label';
        notesLabel.textContent = 'Notes';
        
        const notesInput = document.createElement('textarea');
        notesInput.className = 'tab-renamer-description';
        notesInput.value = existingDesc;
        notesInput.placeholder = 'Add notes';
        
        notesRow.appendChild(notesLabel);
        notesRow.appendChild(notesInput);
        
        container.appendChild(nameRow);
        container.appendChild(divider);
        container.appendChild(notesRow);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        
        // Focus and select the name input
        nameInput.focus();
        nameInput.select();
        
        // Handle click outside
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            overlay.remove();
          }
        });
        
        // Handle keyboard events
        const handleSave = () => {
          const newTitle = nameInput.value.trim();
          const description = notesInput.value.trim();
          if (newTitle) {
            document.title = newTitle;

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
            tooltip.textContent = description ? `Notes: ${description}` : 'No notes';
            document.body.appendChild(tooltip);

            // Add hover listener
            document.addEventListener('mousemove', (e) => {
              if (e.clientY < 40) {
                tooltip.style.display = 'block';
              } else {
                tooltip.style.display = 'none';
              }
            });

            chrome.runtime.sendMessage({
              action: 'updateTitle',
              url: window.location.href,
              title: newTitle,
              description: description
            });
          }
          overlay.remove();
        };

        nameInput.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            handleSave();
          } else if (e.key === 'Escape') {
            overlay.remove();
          }
        });

        notesInput.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            handleSave();
          } else if (e.key === 'Escape') {
            overlay.remove();
          }
        });
      },
      args: [tab.title]
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateTitle') {
    const data = {};
    data[message.url] = {
      title: message.title,
      description: message.description
    };
    chrome.storage.local.set(data);
  } else if (message.action === 'getTabInfo') {
    chrome.storage.local.get([message.url], (result) => {
      sendResponse(result[message.url] || {});
    });
    return true; // Required for async response
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get([tab.url], function(result) {
      if (result[tab.url]) {
        const tabInfo = result[tab.url];
        
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (info) => {
            document.title = info.title;
            
            // Remove existing tooltip if any
            const existingTooltip = document.querySelector('.tab-tooltip');
            if (existingTooltip) {
              existingTooltip.remove();
            }
            
            // Add custom tooltip element
            let tooltip = document.createElement('div');
            tooltip.className = 'tab-tooltip';  // Add class for easy selection
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

            // Show tooltip when mouse is near top of window
            document.addEventListener('mousemove', (e) => {
              if (e.clientY < 40) {  // Only show when mouse is near the tab bar
                tooltip.style.display = 'block';
              } else {
                tooltip.style.display = 'none';
              }
            });
          },
          args: [{
            title: tabInfo.title,
            description: tabInfo.description
          }]
        }).catch(err => console.log('Script injection failed:', err));
      }
    });
  }
});

// Handle tab activation (switching between tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (tab.url) {
      chrome.storage.local.get([tab.url], function(result) {
        if (result[tab.url]) {
          const tabInfo = result[tab.url];
          chrome.scripting.executeScript({
            target: { tabId: activeInfo.tabId },
            func: (title) => {
              document.title = title;
            },
            args: [tabInfo.title]
          }).catch(err => console.log('Script injection failed:', err));
        }
      });
    }
  });
}); 