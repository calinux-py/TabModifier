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
  }
});
