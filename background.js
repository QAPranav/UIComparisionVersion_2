chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === 'COMPARE' && message.productionURL && message.testingURL && message.tabId) {
      const { productionURL, testingURL, tabId } = message;
  
      // Execute the screenshot capture and comparison
      compareScreenshots(productionURL, testingURL, tabId)
        .then((diffDataUrl) => {
          // Send the results back to the popup
          chrome.tabs.sendMessage(tabId, { type: 'RESULTS', diffDataUrl });
        })
        .catch((error) => {
          console.error('Error during screenshot capture and comparison:', error);
        });
    } else {
      console.error('Invalid or incomplete message received in the background script:', JSON.stringify(message));
    }
  });
  
  async function compareScreenshots(productionURL, testingURL, tabId) {
    return new Promise((resolve, reject) => {
      // Implement screenshot capture using chrome.tabs.captureVisibleTab API
      chrome.tabs.create({ url: productionURL, active: false }, async (productionTab) => {
        chrome.tabs.create({ url: testingURL, active: false }, async (testingTab) => {
          let productionTabLoaded = false;
          let testingTabLoaded = false;
  
          const checkTabsStatus = () => {
            if (productionTabLoaded && testingTabLoaded) {
              captureAndCompareScreenshots(productionTab, testingTab)
                .then(resolve)
                .catch(reject);
            }
          };
  
          chrome.tabs.onUpdated.addListener(function onUpdated(tabId, changeInfo) {
            if (tabId === productionTab.id && changeInfo.status === 'complete') {
              productionTabLoaded = true;
              chrome.tabs.onUpdated.removeListener(onUpdated);
              checkTabsStatus();
            }
          });
  
          chrome.tabs.onUpdated.addListener(function onUpdated(tabId, changeInfo) {
            if (tabId === testingTab.id && changeInfo.status === 'complete') {
              testingTabLoaded = true;
              chrome.tabs.onUpdated.removeListener(onUpdated);
              checkTabsStatus();
            }
          });
        });
      });
    });
  }
  
  async function captureAndCompareScreenshots(productionTab, testingTab) {
    return new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab({ format: 'png', quality: 100 }, async (productionScreenshot) => {
        chrome.tabs.captureVisibleTab({ format: 'png', quality: 100 }, async (testingScreenshot) => {
          chrome.tabs.remove(productionTab.id);
          chrome.tabs.remove(testingTab.id);
          const diffDataUrl = await compareImages(productionScreenshot, testingScreenshot);
          resolve(diffDataUrl);
        });
      });
    });
  }
  
  // Rest of your background.js script remains unchanged.
  
  
  // Implement image comparison using Resemble.js
  async function compareImages(imageDataUrl1, imageDataUrl2) {
 //   const resemble = await import('./resemble.js'); // Import Resemble.js library
    return new Promise((resolve) => {
      const image1 = new Image();
      image1.onload = () => {
        const image2 = new Image();
        image2.onload = () => {
          resemble(image1).compareTo(image2).ignoreAntialiasing().onComplete((data) => {
            resolve(data.getImageDataUrl());
          });
        };
        image2.src = imageDataUrl2;
      };
      image1.src = imageDataUrl1;
    });
  }
  