(function() {
  const url = window.location.href;
  
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

  const endpointKey = isSpecialEndpoint(url) ? getSpecialEndpointKey(url) : null;

  if (endpointKey) {
    chrome.storage.local.get('specialEndpointSettings', (result) => {
      const specialSettings = result.specialEndpointSettings || {};
      const settings = specialSettings[endpointKey];
      
      if (settings && settings.customTitle) {
        applyCustomizations(settings.customTitle, settings.color, settings.protect);

        if (url.startsWith("https://na.myconnectwise.net/")) {
          let attempts = 0;
          const intervalId = setInterval(() => {
            applyCustomizations(settings.customTitle, settings.color, settings.protect);
            attempts++;
            if (attempts >= 10) clearInterval(intervalId);
          }, 1000);
        }
      }
    });
  } else {
    chrome.storage.local.get(url, (result) => {
      const settings = result[url];
      if (settings && settings.customTitle) {
        applyCustomizations(settings.customTitle, settings.color, settings.protect);

        if (url.startsWith("https://na.myconnectwise.net/")) {
          let attempts = 0;
          const intervalId = setInterval(() => {
            applyCustomizations(settings.customTitle, settings.color, settings.protect);
            attempts++;
            if (attempts >= 10) clearInterval(intervalId);
          }, 1000);
        }
      }
    });
  }

  function applyCustomizations(title, color, protect) {
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
      window.onbeforeunload = function() {
        return "Are you sure you want to leave?";
      };
    } else {
      window.onbeforeunload = null;
    }
  }

  let currentHotkeys = {
    rename_tab: "Alt+R",
    random_favicon: "Alt+C",
    open_in_new_tab: "Alt+V",
    click_new_note: "Alt+B"
  };

  chrome.storage.local.get("hotkeys", (res) => {
    if (res.hotkeys) {
      currentHotkeys = res.hotkeys;
      if (!currentHotkeys.click_new_note) {
        currentHotkeys.click_new_note = "Alt+B";
      }
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.hotkeys) {
      currentHotkeys = changes.hotkeys.newValue;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (matchHotkey(e, currentHotkeys.rename_tab)) {
      e.preventDefault();
      chrome.runtime.sendMessage({ command: "rename_tab" });
    }
    if (matchHotkey(e, currentHotkeys.random_favicon)) {
      e.preventDefault();
      chrome.runtime.sendMessage({ command: "random_favicon" });
    }
    if (matchHotkey(e, currentHotkeys.open_in_new_tab)) {
      e.preventDefault();
      chrome.runtime.sendMessage({ command: "open_in_new_tab" });
    }
    if (matchHotkey(e, currentHotkeys.click_new_note)) {
      e.preventDefault();
      chrome.runtime.sendMessage({ command: "click_new_note" });
    }
  });

  function matchHotkey(e, hotkey) {
    const parts = hotkey.split("+").map(s => s.trim().toLowerCase());
    let requiredKey = "";
    let alt = false, ctrl = false, shift = false, meta = false;

    parts.forEach(part => {
      if (part === "alt") alt = true;
      else if (part === "ctrl" || part === "control") ctrl = true;
      else if (part === "shift") shift = true;
      else if (part === "meta" || part === "cmd" || part === "command") meta = true;
      else requiredKey = part;
    });

    return (
      e.altKey === alt &&
      e.ctrlKey === ctrl &&
      e.shiftKey === shift &&
      e.metaKey === meta &&
      e.key.toLowerCase() === requiredKey
    );
  }
})();
