chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "modifyTab",
    title: "Modify Tab",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "modifyTab") {
    chrome.action.openPopup();
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "open_popup") {
    chrome.action.openPopup();
  } else if (command === "rename_tab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: function() {
          const cwElement = document.querySelector('.cw_CwTextField');
          return cwElement ? cwElement.value : null;
        }
      }, (results) => {
        if (results && results[0] && results[0].result) {
          const newTitle = results[0].result;
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: function(title) {
              document.title = title;
            },
            args: [newTitle]
          });
        }
      });
    });
  } else if (command === "random_favicon") {
    const colors = [
      "#F9C1D5", "#B5EAD7", "#C7CEEA", "#FFDAC1", "#E2F0CB", "#FF9AA2",
      "#FF2A6D", "#05D9E8", "#D300C5", "#FFEE00", "#00FF87",
      "#FF007F", "#00FEFE", "#6B8E23", "#556B2F", "#A0522D",
      "#4682B4", "#5F9EA0", "#D2691E", "#B8860B", "#2A9D8F",
      "#E9C46A", "#F4A261", "#E76F51", "#FEFAE0"
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.storage.local.get(activeTab.url, (result) => {
        const settings = result[activeTab.url] || {};
        if (!settings.originalTitle) {
          settings.originalTitle = activeTab.title;
        }
        settings.customTitle = activeTab.title;
        settings.color = randomColor;
        settings.protect = settings.protect || false;
        chrome.storage.local.set({ [activeTab.url]: settings }, () => {
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: function(title, color, protect) {
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
            },
            args: [activeTab.title, randomColor, settings.protect]
          });
        });
      });
    });
  } else if (command === "open_in_new_tab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.create({ url: activeTab.url });
    });
  }
});
