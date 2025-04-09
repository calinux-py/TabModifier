const tabModify = document.getElementById('tabModify');
const tabSettings = document.getElementById('tabSettings');
const modifySection = document.getElementById('modifySection');
const settingsSection = document.getElementById('settingsSection');

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

tabModify.addEventListener('click', () => {
  tabModify.classList.add('active');
  tabSettings.classList.remove('active');
  modifySection.classList.add('active');
  settingsSection.classList.remove('active');
});

tabSettings.addEventListener('click', () => {
  tabSettings.classList.add('active');
  tabModify.classList.remove('active');
  settingsSection.classList.add('active');
  modifySection.classList.remove('active');
  chrome.storage.local.get('hotkeys', (result) => {
    const hk = result.hotkeys || { 
      rename_tab: "Alt+R", 
      random_favicon: "Alt+C", 
      open_in_new_tab: "Alt+V", 
      click_new_note: "Alt+B" 
    };
    document.getElementById('hkRename').value = hk.rename_tab;
    document.getElementById('hkRandom').value = hk.random_favicon;
    document.getElementById('hkNewTab').value = hk.open_in_new_tab;
    document.getElementById('hkNewNote').value = hk.click_new_note || "Alt+B";
  });
});

document.getElementById('saveHotkeysBtn').addEventListener('click', () => {
  const hkRename = document.getElementById('hkRename').value || "Alt+R";
  const hkRandom = document.getElementById('hkRandom').value || "Alt+C";
  const hkNewTab = document.getElementById('hkNewTab').value || "Alt+V";
  const hkNewNote = document.getElementById('hkNewNote').value || "Alt+B";
  const hotkeys = {
    rename_tab: hkRename,
    random_favicon: hkRandom,
    open_in_new_tab: hkNewTab,
    click_new_note: hkNewNote
  };
  chrome.storage.local.set({ hotkeys }, () => {
    const statusBar = document.getElementById('statusBar');
    statusBar.firstElementChild.textContent = 
      `Hotkeys: ALT+T, ${hkRename.toUpperCase()}, ${hkRandom.toUpperCase()}, ${hkNewTab.toUpperCase()}, ${hkNewNote.toUpperCase()}`;
    window.close();
  });
});

document.getElementById('modifyBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const url = activeTab.url;
    let newTitle = document.getElementById('tabTitle').value || activeTab.title;
    const color = document.getElementById('faviconColor').value;
    const protect = document.getElementById('protectTab').checked;
    const useConnectWise = document.getElementById('connectWise').checked;
    
    if (useConnectWise) {
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: function() {
          const cwElement = document.querySelector('.cw_CwTextField');
          return cwElement ? cwElement.value : null;
        }
      }, (results) => {
        if (results && results[0] && results[0].result) {
          newTitle = results[0].result;
        }
        updateTab(activeTab, url, newTitle, color, protect);
      });
    } else {
      updateTab(activeTab, url, newTitle, color, protect);
    }
  });
});

document.getElementById('resetBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const url = activeTab.url;
    const endpointKey = isSpecialEndpoint(url) ? getSpecialEndpointKey(url) : null;

    if (endpointKey) {
      chrome.storage.local.get('specialEndpointSettings', (result) => {
        const specialSettings = result.specialEndpointSettings || {};
        if (specialSettings[endpointKey]) {
          specialSettings[endpointKey] = {};
          chrome.storage.local.set({ specialEndpointSettings: specialSettings }, () => {
            chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: function() {
                location.reload();
              }
            }, () => {
              window.close();
            });
          });
        } else {
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: function() {
              location.reload();
            }
          }, () => {
            window.close();
          });
        }
      });
    } else {
      chrome.storage.local.get(activeTab.url, (result) => {
        if (result[activeTab.url]) {
          chrome.storage.local.remove(activeTab.url, () => {
            chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: function() {
                location.reload();
              }
            }, () => {
              window.close();
            });
          });
        } else {
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: function() {
              location.reload();
            }
          }, () => {
            window.close();
          });
        }
      });
    }
  });
});

function updateTab(activeTab, url, newTitle, color, protect) {
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
      
      specialSettings[endpointKey].customTitle = newTitle;
      specialSettings[endpointKey].color = color;
      specialSettings[endpointKey].protect = protect;
      
      chrome.storage.local.set({ specialEndpointSettings: specialSettings }, () => {
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: modifyTab,
          args: [newTitle, color, protect]
        }, () => {
          window.close();
        });
      });
    });
  } else {
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
  }
}

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
