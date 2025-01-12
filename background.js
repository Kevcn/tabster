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
          align-items: center;
          background-color: white;
          border-radius: 25px;
          padding: 12px 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.2s ease-out;
        }
        .tab-renamer-label {
          font-size: 16px;
          margin-right: 12px;
          color: #333;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 500;
        }
        .tab-renamer-divider {
          width: 1px;
          height: 24px;
          background-color: #ccc;
          margin-right: 12px;
        }
        .tab-renamer-input {
          width: 320px;
          padding: 2px;
          border: none;
          font-size: 16px;
          outline: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
      `
    });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (currentTitle) => {
        // Create and inject the dialog
        const overlay = document.createElement('div');
        overlay.className = 'tab-renamer-overlay';
        
        const container = document.createElement('div');
        container.className = 'tab-renamer-container';
        
        const label = document.createElement('span');
        label.className = 'tab-renamer-label';
        label.textContent = 'Tab name';
        
        const divider = document.createElement('div');
        divider.className = 'tab-renamer-divider';
        
        const input = document.createElement('input');
        input.className = 'tab-renamer-input';
        input.type = 'text';
        input.value = currentTitle;
        input.placeholder = 'Enter tab name';
        
        container.appendChild(label);
        container.appendChild(divider);
        container.appendChild(input);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        
        // Focus and select the input
        input.focus();
        input.select();
        
        // Handle click outside
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            overlay.remove();
          }
        });
        
        // Handle keyboard events
        input.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            const newTitle = input.value.trim();
            if (newTitle) {
              // Store the new title
              chrome.runtime.sendMessage({
                action: 'updateTitle',
                url: window.location.href,
                title: newTitle
              });
              document.title = newTitle;
            }
            overlay.remove();
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
    data[message.url] = message.title;
    chrome.storage.local.set(data);
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