(function() {
  const url = window.location.href;
  chrome.storage.local.get(url, (result) => {
    const settings = result[url];
    if (settings && settings.customTitle) {
      modifyTab(settings.customTitle, settings.color, settings.protect);
    }
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
})();
