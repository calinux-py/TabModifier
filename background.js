function injectContentScriptAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id && tab.url && /^https?:\/\//.test(tab.url)) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }, () => {
          console.log(`Injected content.js into tab ${tab.id} (${tab.url})`);
        });
      }
    });
  });
}

function isSpecialEndpoint(url) {
  return url.endsWith("CalendarSchedule") || 
         url.endsWith("DispatchSchedule") || 
         url.endsWith("ProjectBoard");
}

function getSpecialEndpointKey(url) {
  if (url.endsWith("CalendarSchedule")) return "CalendarSchedule";
  if (url.endsWith("DispatchSchedule")) return "DispatchSchedule";
  if (url.endsWith("ProjectBoard")) return "ProjectBoard";
  return null;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('hotkeys', (res) => {
    if (!res.hotkeys) {
      chrome.storage.local.set({
        hotkeys: {
          rename_tab: "Alt+R",
          random_favicon: "Alt+C",
          open_in_new_tab: "Alt+V",
          click_new_note: "Alt+B"
        }
      });
    }
  });

  chrome.storage.local.get('specialEndpointSettings', (res) => {
    if (!res.specialEndpointSettings) {
      chrome.storage.local.set({
        specialEndpointSettings: {
          CalendarSchedule: {},
          DispatchSchedule: {},
          ProjectBoard: {}
        }
      });
    }
  });

  injectContentScriptAllTabs();

  chrome.contextMenus.create({
    id: "modifyTab",
    title: "Modify Tab",
    contexts: ["all"]
  });
});

chrome.runtime.onStartup.addListener(() => {
  injectContentScriptAllTabs();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "modifyTab") {
    chrome.action.openPopup();
  }
});

function executeRenameTab() {
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
}

function executeRandomFavicon() {
  const colors = [
    "#F9C1D5","#B5EAD7","#C7CEEA","#FFDAC1","#E2F0CB","#FF9AA2",
    "#FF2A6D","#05D9E8","#D300C5","#FFEE00","#00FF87","#FF007F",
    "#00FEFE","#6B8E23","#556B2F","#A0522D","#4682B4","#5F9EA0",
    "#D2691E","#B8860B","#2A9D8F","#E9C46A","#F4A261","#E76F51",
    "#FEFAE0"
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const url = activeTab.url;
    const endpointKey = isSpecialEndpoint(url) ? getSpecialEndpointKey(url) : null;

    if (endpointKey) {
      chrome.storage.local.get('specialEndpointSettings', (result) => {
        const specialSettings = result.specialEndpointSettings || {
          CalendarSchedule: {},
          DispatchSchedule: {},
          ProjectBoard: {}
        };
        
        if (!specialSettings[endpointKey].originalTitle) {
          specialSettings[endpointKey].originalTitle = activeTab.title;
        }
        specialSettings[endpointKey].customTitle = activeTab.title;
        specialSettings[endpointKey].color = randomColor;
        specialSettings[endpointKey].protect = specialSettings[endpointKey].protect || false;

        chrome.storage.local.set({ specialEndpointSettings: specialSettings }, () => {
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
            args: [activeTab.title, randomColor, specialSettings[endpointKey].protect]
          });
        });
      });
    } else {
      chrome.storage.local.get(url, (result) => {
        const settings = result[url] || {};
        if (!settings.originalTitle) {
          settings.originalTitle = activeTab.title;
        }
        settings.customTitle = activeTab.title;
        settings.color = randomColor;
        settings.protect = settings.protect || false;

        chrome.storage.local.set({ [url]: settings }, () => {
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
    }
  });
}

function executeOpenInNewTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.create({ url: activeTab.url });
  });
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "open_popup") {
    chrome.action.openPopup();
  } else if (command === "rename_tab") {
    executeRenameTab();
  } else if (command === "random_favicon") {
    executeRandomFavicon();
  } else if (command === "open_in_new_tab") {
    executeOpenInNewTab();
  } else if (command === "click_new_note") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: function() {
          const buttons = Array.from(document.querySelectorAll('div.CwButton-innerLightActive'));
          const newNoteBtn = buttons.find(btn => btn.textContent.trim() === "New Note");
          if (newNoteBtn) {
            newNoteBtn.click();
          }
        }
      });
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "rename_tab") {
    executeRenameTab();
  } else if (message.command === "random_favicon") {
    executeRandomFavicon();
  } else if (message.command === "open_in_new_tab") {
    executeOpenInNewTab();
  } else if (message.command === "click_new_note") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: function() {
          const buttons = Array.from(document.querySelectorAll('div.CwButton-innerLightActive'));
          const newNoteBtn = buttons.find(btn => btn.textContent.trim() === "New Note");
          if (newNoteBtn) {
            newNoteBtn.click();
          }
        }
      });
    });
  }
});
