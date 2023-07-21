  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('compareBtn').addEventListener('click', () => {
        const productionURL = document.getElementById('productionURL').value;
        const testingURL = document.getElementById('testingURL').value;
      
        // Get the current active tab ID and send it along with the message
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0].id;
          // Send the URLs and tab ID to the background script for screenshot capture and comparison
          chrome.runtime.sendMessage({ type: 'COMPARE', productionURL, testingURL, tabId });
        });
      });
  });
  
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'RESULTS') {
      // Display the comparison results in the popup
      const resultsDiv = document.getElementById('results');
      resultsDiv.innerHTML = `<img src="${message.diffDataUrl}" alt="Differences">`;
    }
  });
  