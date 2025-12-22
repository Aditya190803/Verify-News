chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "verifySelection",
    title: "Verify with VerifyNews",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "verifySelection") {
    const query = encodeURIComponent(info.selectionText);
    chrome.tabs.create({
      url: `https://verifynews.app/?q=${query}`
    });
  }
});
