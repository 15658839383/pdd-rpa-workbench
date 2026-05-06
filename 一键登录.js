(function() {
  'use strict';

  const state = {
    user: null,
    shops: [],
    loading: true,
    pendingShopCode: '',
    search: ''
  };

  const dom = {};

  function initDom() {
    dom.accountName = document.getElementById('quickLoginAccountName');
    dom.shopList = document.getElementById('quickLoginShopList');
    dom.backBtn = document.getElementById('backToWorkbenchBtn');
    dom.toast = document.getElementById('quickLoginToast');
    dom.searchWrap = document.getElementById('quickLoginSearchWrap');
    dom.searchInput = document.getElementById('quickLoginSearchInput');
    dom.searchCount = document.getElementById('quickLoginSearchCount');
    dom.totalCount = document.getElementById('quickLoginTotalCount');
  }

  function isFinanceUser(user) {
    const role = String(user?.role || '').trim().toLowerCase();
    const roleName = String(user?.role_name || user?.roleName || '').trim();
    return role === 'finance' || role === 'caiwu' || role === '财务' || roleName.includes('财务');
  }

  function canFilterSalesOverviewByOperator(user) {
    const role = String(user?.role || '').trim().toLowerCase();
    const roleName = String(user?.role_name || user?.roleName || '').trim();
    return role === 'admin' || role === '运营管理' || roleName === '运营管理';
  }

  function canUseShopQuickLogin(user) {
    return canFilterSalesOverviewByOperator(user) || isFinanceUser(user);
  }

  function getShopQuickLoginDeniedMessage() {
    return '仅 admin、运营管理和财务角色可使用一键登录';
  }

  function sortShopsByName(shops) {
    const normalizedShops = Array.isArray(shops) ? shops.slice() : [];
    normalizedShops.sort((left, right) => {
      return String(left.shopName || left.shopCode).localeCompare(String(right.shopName || right.shopCode), 'zh-CN');
    });
    return normalizedShops;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text || '');
    return div.innerHTML;
  }

  function showToast(message, type) {
    if (!dom.toast) return;
    dom.toast.textContent = String(message || '');
    dom.toast.className = 'quick-login-toast is-visible' + (type ? ' is-' + type : '');
    setTimeout(() => {
      dom.toast.classList.remove('is-visible');
    }, 2500);
  }

  function getVisibleShops() {
    const keyword = state.search.trim().toLowerCase();
    if (!keyword) {
      return state.shops;
    }
    return state.shops.filter((shop) => {
      const name = String(shop.shopName || '').toLowerCase();
      const code = String(shop.shopCode || '').toLowerCase();
      return name.includes(keyword) || code.includes(keyword);
    });
  }

  function render() {
    if (!dom.accountName || !dom.shopList) return;

    if (state.loading) {
      dom.accountName.textContent = '正在加载…';
      dom.shopList.innerHTML = '<div class="quick-login-empty">正在加载店铺列表…</div>';
      if (dom.searchWrap) dom.searchWrap.hidden = true;
      return;
    }

    if (!state.user) {
      dom.accountName.textContent = '未登录';
      dom.shopList.innerHTML = '<div class="quick-login-empty">请先在工作台登录后再使用一键登录。</div>';
      if (dom.searchWrap) dom.searchWrap.hidden = true;
      return;
    }

    const displayName = state.user.display_name || state.user.displayName || state.user.name || state.user.username || '已登录';
    dom.accountName.textContent = '当前账号：' + displayName;

    if (!state.shops.length) {
      dom.shopList.innerHTML = '<div class="quick-login-empty">当前账号没有可操作的店铺。</div>';
      if (dom.searchWrap) dom.searchWrap.hidden = true;
      return;
    }

    if (dom.searchWrap) dom.searchWrap.hidden = false;
    if (dom.totalCount) dom.totalCount.textContent = '共 ' + state.shops.length + ' 家';

    const visibleShops = getVisibleShops();
    if (dom.searchCount) dom.searchCount.textContent = '显示 ' + visibleShops.length + ' 家';

    const quickLoginAllowed = canUseShopQuickLogin(state.user);
    const deniedMessage = getShopQuickLoginDeniedMessage();

    if (!visibleShops.length) {
      dom.shopList.innerHTML = '<div class="quick-login-empty">没有匹配的店铺。</div>';
      return;
    }

    dom.shopList.innerHTML = visibleShops.map((shop) => {
      const shopCode = String(shop.shopCode || '').trim();
      const shopName = escapeHtml(shop.shopName || shopCode);
      const isPending = state.pendingShopCode === shopCode;
      const disabled = !quickLoginAllowed || isPending;
      const title = !quickLoginAllowed ? deniedMessage : (isPending ? '正在执行一键登录' : '打开独立浏览器并注入最新 cookies');
      const btnText = isPending ? '登录中…' : '一键登录';

      return (
        '<div class="quick-login-item">' +
          '<span class="quick-login-item__name" title="' + escapeHtml(shopName) + '">' + escapeHtml(shopName) + '</span>' +
          '<button type="button" class="secondary-button secondary-button--sm quick-login-item__btn" ' +
            'data-shop-code="' + escapeHtml(shopCode) + '" ' +
            'title="' + escapeHtml(title) + '"' +
            (disabled ? ' disabled' : '') +
          '">' + escapeHtml(btnText) + '</button>' +
        '</div>'
      );
    }).join('');
  }

  async function handleQuickLogin(shopCode) {
    const normalizedCode = String(shopCode || '').trim();
    if (!normalizedCode || state.pendingShopCode) return;

    if (!canUseShopQuickLogin(state.user)) {
      showToast(getShopQuickLoginDeniedMessage(), 'error');
      return;
    }

    state.pendingShopCode = normalizedCode;
    render();

    try {
      const result = await window.desktopBridge.auth.quickLoginShop({
        shopCode: normalizedCode
      });

      if (!result?.ok) {
        const message = result?.error?.message || '一键登录失败，请稍后重试。';
        showToast(message, 'error');
        return;
      }

      const shop = state.shops.find((s) => String(s.shopCode || '').trim() === normalizedCode);
      const shopLabel = shop?.shopName || normalizedCode;
      const successMessage = result.message || '店铺《' + shopLabel + '》已打开浏览器并注入最新 cookies';
      showToast(successMessage, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : '一键登录失败，请稍后重试。';
      showToast(message, 'error');
    } finally {
      state.pendingShopCode = '';
      render();
    }
  }

  async function init() {
    initDom();

    if (!window.desktopBridge) {
      dom.accountName.textContent = '环境异常';
      dom.shopList.innerHTML = '<div class="quick-login-empty">桌面桥接未就绪，请重启应用。</div>';
      return;
    }

    dom.backBtn?.addEventListener('click', () => {
      window.desktopBridge.window.exitQuickLogin();
    });

    dom.shopList?.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-shop-code]');
      if (!btn) return;
      const code = btn.dataset.shopCode || '';
      handleQuickLogin(code);
    });

    dom.searchInput?.addEventListener('input', (event) => {
      state.search = String(event.target.value || '');
      render();
    });

    dom.searchInput?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      const visible = getVisibleShops();
      if (visible.length === 1) {
        handleQuickLogin(visible[0].shopCode);
      }
    });

    try {
      const stateResult = await window.desktopBridge.auth.getState();
      if (stateResult?.authenticated && stateResult.user) {
        state.user = stateResult.user;
      } else {
        state.user = null;
      }
    } catch {
      state.user = null;
    }

    if (state.user) {
      try {
        const shopsResult = await window.desktopBridge.auth.listShops();
        if (shopsResult?.ok && Array.isArray(shopsResult.shops)) {
          state.shops = sortShopsByName(shopsResult.shops);
        } else {
          state.shops = [];
        }
      } catch {
        state.shops = [];
      }
    }

    state.loading = false;
    render();
  }

  init();
})();
