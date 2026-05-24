(() => {
  'use strict';

  // ── Icons ────────────────────────────────────────────────────────────────
  const FOLDER_SVG = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 3.5A1 1 0 012.5 2.5h3.086a1 1 0 01.707.293L7.207 3.707A1 1 0 007.914 4H13.5a1 1 0 011 1v7a1 1 0 01-1 1h-11a1 1 0 01-1-1V3.5z" fill="#FFA000"/>
    <path d="M1.5 5.5h13v6a1 1 0 01-1 1h-11a1 1 0 01-1-1v-6z" fill="#FFD54F"/>
  </svg>`;

  const BOOKMARK_SVG = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="1.5" width="12" height="13" rx="1" fill="#4285F4" opacity="0.15"/>
    <rect x="2" y="1.5" width="12" height="13" rx="1" stroke="#4285F4" stroke-width="1.2"/>
    <path d="M5 5.5h6M5 8h4" stroke="#4285F4" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;

  const CHEVRON_RIGHT_SVG = `<svg viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 1l3 3-3 3" stroke="#8a8a8a" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  const CHEVRON_DOWN_SVG = `<svg viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 2l3 3 3-3" stroke="#8a8a8a" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  // ── Favicon ──────────────────────────────────────────────────────────────
  function faviconUrl(url) {
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(url).origin}&sz=32`;
    } catch { return null; }
  }

  function makeIcon(node) {
    const span = document.createElement('span');
    span.className = 'cbbar-icon';
    if (node.url) {
      const fav = faviconUrl(node.url);
      if (fav) {
        const img = document.createElement('img');
        img.src = fav;
        img.onerror = () => { span.innerHTML = BOOKMARK_SVG; };
        span.appendChild(img);
      } else {
        span.innerHTML = BOOKMARK_SVG;
      }
    } else {
      span.innerHTML = FOLDER_SVG;
    }
    return span;
  }

  // ── Build nested dropdown (recursive, DOM-nested) ─────────────────────────
  //
  // 構造:
  //   .cbbar-dropdown
  //     .cbbar-dd-item          ← ブックマーク (リンク)
  //     .cbbar-dd-folder        ← フォルダ行 (div)
  //       .cbbar-dd-folder-row  ← クリック可能な行部分
  //       .cbbar-dropdown       ← 子メニュー (非表示→ホバーで表示)
  //
  function buildMenu(nodes) {
    const menu = document.createElement('div');
    menu.className = 'cbbar-dropdown';

    nodes.forEach(node => {
      if (!node.url && (!node.children || node.children.length === 0)) return;

      if (node.url) {
        // ── ブックマーク行 ──
        const item = document.createElement('a');
        item.className = 'cbbar-dd-item';
        item.href = node.url;
        item.target = '_blank';
        item.rel = 'noopener noreferrer';
        item.appendChild(makeIcon(node));
        const label = document.createElement('span');
        label.className = 'cbbar-item-text';
        label.textContent = node.title || node.url;
        item.appendChild(label);
        menu.appendChild(item);

      } else {
        // ── フォルダ行 ──
        const folder = document.createElement('div');
        folder.className = 'cbbar-dd-folder';

        const row = document.createElement('div');
        row.className = 'cbbar-dd-folder-row';
        row.appendChild(makeIcon(node));
        const label = document.createElement('span');
        label.className = 'cbbar-item-text';
        label.textContent = node.title || 'フォルダ';
        row.appendChild(label);
        const chev = document.createElement('span');
        chev.className = 'cbbar-folder-chevron';
        chev.innerHTML = CHEVRON_RIGHT_SVG;
        row.appendChild(chev);
        folder.appendChild(row);

        // 子メニューを入れ子で生成
        const subMenu = buildMenu(node.children || []);
        subMenu.classList.add('cbbar-submenu');
        folder.appendChild(subMenu);

        // ホバーで子メニュー表示
        let showTimer, hideTimer;
        folder.addEventListener('mouseenter', () => {
          clearTimeout(hideTimer);
          showTimer = setTimeout(() => {
            // 同じ親内の他サブメニューを閉じる
            const siblings = menu.querySelectorAll(':scope > .cbbar-dd-folder > .cbbar-submenu.open');
            siblings.forEach(s => s.classList.remove('open'));
            subMenu.classList.add('open');
            positionSubMenu(subMenu, folder);
          }, 100);
        });
        folder.addEventListener('mouseleave', () => {
          clearTimeout(showTimer);
          hideTimer = setTimeout(() => {
            subMenu.classList.remove('open');
          }, 200);
        });
        subMenu.addEventListener('mouseenter', () => clearTimeout(hideTimer));
        subMenu.addEventListener('mouseleave', () => {
          hideTimer = setTimeout(() => subMenu.classList.remove('open'), 200);
        });

        menu.appendChild(folder);
      }
    });

    return menu;
  }

  // サブメニューを右側または左側に配置
  function positionSubMenu(subMenu, folderEl) {
    subMenu.style.top = '0px';
    subMenu.style.left = '';
    subMenu.style.right = '';

    const folderRect = folderEl.getBoundingClientRect();
    const menuWidth = 220;
    const spaceRight = window.innerWidth - folderRect.right;

    if (spaceRight >= menuWidth) {
      subMenu.style.left = '100%';
    } else {
      subMenu.style.right = '100%';
      subMenu.style.left = 'auto';
    }
  }

  // ── バー上のフォルダボタン（入れ子メニューのルート）──────────────────────
  function buildBarFolder(node) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cbbar-item cbbar-bar-folder';

    const row = document.createElement('div');
    row.className = 'cbbar-bar-folder-row';
    row.appendChild(makeIcon(node));
    const label = document.createElement('span');
    label.className = 'cbbar-label';
    label.textContent = node.title || 'フォルダ';
    row.appendChild(label);
    const chev = document.createElement('span');
    chev.className = 'cbbar-folder-chevron';
    chev.innerHTML = CHEVRON_DOWN_SVG;
    row.appendChild(chev);
    wrapper.appendChild(row);

    // ドロップダウンを wrapper の子として入れ子
    const menu = buildMenu(node.children || []);
    menu.classList.add('cbbar-bar-menu');
    wrapper.appendChild(menu);

    // クリックでトグル
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      closeAllBarMenus();
      if (!isOpen) {
        menu.classList.add('open');
        positionBarMenu(menu, wrapper);
      }
    });

    return wrapper;
  }

  function positionBarMenu(menu, anchor) {
    menu.style.left = '0px';
    // 右端チェック
    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = (window.innerWidth - rect.right - 4) + 'px';
      }
    });
  }

  function closeAllBarMenus() {
    document.querySelectorAll('.cbbar-bar-menu.open, .cbbar-submenu.open').forEach(m => {
      m.classList.remove('open');
    });
  }

  // ── バー描画 ──────────────────────────────────────────────────────────────
  function renderBar(barRoot, bookmarkNodes) {
    barRoot.innerHTML = '';
    const items = [];

    bookmarkNodes.forEach(node => {
      let el;
      if (node.url) {
        el = document.createElement('a');
        el.className = 'cbbar-item';
        el.href = node.url;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
        el.appendChild(makeIcon(node));
        const label = document.createElement('span');
        label.className = 'cbbar-label';
        label.textContent = node.title || node.url;
        el.appendChild(label);
      } else {
        el = buildBarFolder(node);
      }

      items.push({ el, node });
      barRoot.appendChild(el);
    });

    // オーバーフロー処理
    requestAnimationFrame(() => {
      const available = barRoot.offsetWidth - 64;
      let totalW = 0;
      let overflowStart = -1;

      for (let i = 0; i < items.length; i++) {
        totalW += items[i].el.offsetWidth + 2;
        if (totalW > available && overflowStart === -1) {
          overflowStart = i;
        }
      }

      if (overflowStart !== -1) {
        const overflowNodes = [];
        for (let i = overflowStart; i < items.length; i++) {
          items[i].el.style.display = 'none';
          overflowNodes.push(items[i].node);
        }

        // オーバーフローフォルダとして表示
        const moreNode = { title: `» ${overflowNodes.length}件`, children: overflowNodes };
        const moreEl = buildBarFolder(moreNode);
        moreEl.style.marginLeft = 'auto';
        barRoot.appendChild(moreEl);
      }
    });
  }

  // ── Bookmarks取得 ────────────────────────────────────────────────────────
  function getBookmarksBarNodes(callback) {
    chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        console.warn('[BookmarksBar]', chrome.runtime.lastError);
        callback([]);
        return;
      }
      callback(response.nodes || []);
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    if (document.getElementById('custom-bookmarks-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'custom-bookmarks-bar';
    document.body.insertBefore(bar, document.body.firstChild);

    getBookmarksBarNodes((nodes) => renderBar(bar, nodes));

    // 外クリックで閉じる
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.cbbar-bar-folder')) {
        closeAllBarMenus();
      }
    });

    // リサイズ
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        getBookmarksBarNodes((nodes) => renderBar(bar, nodes));
      }, 200);
    });
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

})();
