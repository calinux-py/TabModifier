document.getElementById('modifyBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const url = activeTab.url;
    const newTitle = document.getElementById('tabTitle').value || activeTab.title;
    const color = document.getElementById('faviconColor').value;
    const protect = document.getElementById('protectTab').checked;
    chrome.storage.local.get(url, (result) => {
      const settings = result[url] || {};
      if (!settings.originalTitle) {
        settings.originalTitle = activeTab.title;
      }
      settings.customTitle = newTitle;
      settings.color = color;
      settings.protect = protect;
      chrome.storage.local.set({ [url]: settings }, () => {
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: modifyTab,
          args: [newTitle, color, protect]
        }, () => {
          window.close();
        });
      });
    });
  });
});

document.getElementById('resetBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const url = activeTab.url;
    chrome.storage.local.remove(url, () => {
      chrome.tabs.reload(activeTab.id);
    });
  });
});

function modifyTab(title, color, protect) {
  document.title = title;
  if (color) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, 2 * Math.PI);
    ctx.fill();
    document.querySelectorAll("link[rel*='icon']").forEach(link => link.remove());
    const newLink = document.createElement('link');
    newLink.type = 'image/png';
    newLink.rel = 'icon';
    newLink.href = canvas.toDataURL();
    document.head.appendChild(newLink);
  }
  if (protect) {
    window.onbeforeunload = function(e) {
      return "Are you sure you want to leave?";
    };
  } else {
    window.onbeforeunload = null;
  }
}
