// Background Service Worker
// chrome.bookmarks API はここからのみアクセス可能

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_BOOKMARKS') {
    chrome.bookmarks.getTree((tree) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      const root = tree[0];
      if (!root || !root.children) {
        sendResponse({ nodes: [] });
        return;
      }
      // ブックマークバーは通常 id="1"
      let barNode = root.children.find(c => c.id === '1');
      if (!barNode) barNode = root.children[0];
      sendResponse({ nodes: barNode ? (barNode.children || []) : [] });
    });
    return true; // 非同期レスポンスのために必要
  }
});
