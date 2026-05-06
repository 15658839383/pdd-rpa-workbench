const DEFAULT_BACKEND_URL = 'http://106.75.215.11:8080';

function buildInitialShopState() {
  return {
    status: 'idle',
    all: [],
    available: [],
    scope: null,
    selected: null,
    draftCode: '',
    search: '',
    error: '',
    isOpen: false,
    isRequired: false,
    quickLoginPendingShopCodes: []
  };
}

function buildInitialTemplateExportState() {
  return {
    status: 'idle',
    summary: '尚未导出当前模板',
    path: '导出目录会显示在这里。',
    output: '导出结果会显示在这里。',
    error: '',
    exportRoot: ''
  };
}

function buildInitialCategoryState() {
  return {
    isOpen: false,
    status: 'idle',
    error: '',
    shopCode: '',
    rootOptions: [],
    secondOptions: [],
    thirdOptions: [],
    pathHints: [],
    draftLevel1Id: '',
    draftLevel2Id: '',
    draftLevel3Id: '',
    notice: '',
    selectionMeta: null
  };
}

function buildInitialAttributeState() {
  return {
    status: 'idle',
    error: '',
    message: '请先选择三级类目。',
    schema: [],
    shopCode: '',
    categoryId: ''
  };
}

function buildInitialProductFillState() {
  return {
    isOpen: false,
    status: 'idle',
    productId: '',
    error: '',
    summary: '输入商品 ID 后自动识别所属店铺并覆盖当前模板。'
  };
}

function buildInitialSalesOverviewState() {
  return {
    isOpen: false,
    status: 'idle',
    error: '',
    notice: '还没有经营数据。',
    search: '',
    operatorFilter: 'all',
    trendMetric: 'todayGmv',
    trendFilter: 'all',
    sortMode: 'default',
    selectedShopCodes: [],
    rows: [],
    summary: {
      text: '默认查询当前账号可见店铺。',
      scopeText: '已勾选 0 家店铺。',
      selectedCount: 0,
      visibleCount: 0,
      totalCount: 0,
      fetchedAt: '',
      totals: null
    },
    entrySource: 'shop-selection',
    fetchSession: 0,
    fetchController: null,
    hasInitializedSelection: false,
    isExporting: false
  };
}

function createEmptySkuSpecSelection() {
  return {
    id: '',
    label: ''
  };
}

function buildInitialSkuSpecState() {
  return {
    status: 'idle',
    error: '',
    message: '请先选择三级类目，再加载可选规格。',
    options: [],
    shopCode: '',
    categoryId: '',
    selectedSlots: [createEmptySkuSpecSelection(), createEmptySkuSpecSelection()],
    valueLists: [[], []]
  };
}

const CATEGORY_FIELD_IDS = {
  display: 'pddForm_categoryData',
  level1: 'pddForm_categoryId1',
  level2: 'pddForm_categoryId2',
  level3: 'pddForm_categoryId3',
  leaf: 'pddForm_leafCategoryId'
};

const SKU_SPEC_FIELD_IDS = {
  slot1Id: 'pddForm_goodsSpecType1Id',
  slot1Name: 'pddForm_goodsSpecType1Name',
  slot2Id: 'pddForm_goodsSpecType2Id',
  slot2Name: 'pddForm_goodsSpecType2Name'
};

const SKU_SPEC_VALUE_FIELD_IDS = {
  slot1Values: 'pddForm_goodsSpecType1Values',
  slot2Values: 'pddForm_goodsSpecType2Values'
};

const state = {
  bridge: window.desktopBridge || null,
  workspace: null,
  templates: [],
  currentTemplateId: null,
  currentTemplate: null,
  defaultFormData: null,
  automationLogs: [],
  autosaveTimer: null,
  skuSpecRebuildTimer: null,
  isHydrating: false,
  isWorkbenchReady: false,
  isWorkbenchHydrating: false,
  unsubscribeAuth: null,
  slotRegistry: {},
  dragContext: null,
  authNoticeTimer: null,
  auth: {
    status: 'checking',
    baseUrl: DEFAULT_BACKEND_URL,
    user: null,
    lastUsername: '',
    rememberPassword: false,
    savedPassword: '',
    error: '',
    notice: '',
    isLoggingIn: false,
    isChangingPassword: false
  },
  shop: buildInitialShopState(),
  salesOverview: buildInitialSalesOverviewState(),
  category: buildInitialCategoryState(),
  attribute: buildInitialAttributeState(),
  skuSpec: buildInitialSkuSpecState(),
  productFill: buildInitialProductFillState(),
  templateExport: buildInitialTemplateExportState(),
  ui: buildInitialUiState()
};

const ASSET_LAYOUT = {
  mainGallery: {
    type: 'dynamic-array',
    containerSelector: '#pddForm_mainSpareImage',
    max: 10,
    label: '主图',
    slotClassName: 'image-slot image-slot--gallery'
  },
  detailGallery: {
    type: 'dynamic-array',
    containerSelector: '#pddForm_detailGallerySlots',
    max: 100,
    label: '详情图',
    slotClassName: 'image-slot image-slot--detail'
  },
  whiteImage: { selector: '[data-asset-zone="whiteImage"]', type: 'single' },
  longImage: { selector: '[data-asset-zone="longImage"]', type: 'single' },
  skuThumbs: { selector: '[data-asset-zone="skuThumbs"]', type: 'array' }
};

const BRAND_ATTRIBUTE_KEYS = {
  primary: 'pddForm_goodsAttribute_310',
  secondary: 'goodsAttribute[310]'
};

const SKU_FIELD_NAMES = ['specName', 'groupPrice', 'singlePrice', 'stock', 'weight'];
const SKU_DIMENSION_LABELS = ['规格一', '规格二', '规格三'];
const DEFAULT_SKU_ROWS = [
  {
    specName: '黑色1+1黑色--过膝款 / （均码）毛圈加厚',
    groupPrice: '15.90',
    singlePrice: '19.90',
    stock: '500',
    weight: '0.18'
  },
  {
    specName: '奶白色--中筒款 / （均码）毛圈加厚',
    groupPrice: '15.90',
    singlePrice: '19.90',
    stock: '420',
    weight: '0.18'
  },
  {
    specName: '麻灰色--高筒款 / （均码）毛圈加厚',
    groupPrice: '16.50',
    singlePrice: '20.50',
    stock: '360',
    weight: '0.19'
  }
];

const STATUS_LABELS = {
  idle: '未启动',
  starting: '启动中',
  'launching-browser': '启动浏览器',
  'waiting-login': '等待登录',
  filling: '填写中',
  'manual-review': '待人工检查',
  completed: '已完成',
  failed: '失败',
  stopped: '已停止',
  loading: '加载中',
  success: '成功',
  error: '失败'
};

const SALES_OVERVIEW_COLUMNS = [
  {
    key: 'index',
    label: '序号',
    type: 'index',
    align: 'center',
    className: 'sales-table__col sales-table__col--index'
  },
  {
    key: 'shop',
    label: '店铺名称',
    type: 'shop',
    align: 'left',
    className: 'sales-table__col sales-table__col--shop'
  },
  {
    key: 'listedCount',
    label: '上架商品数',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric'
  },
  {
    key: 'delistedCount',
    label: '下架商品数',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric'
  },
  {
    key: 'yesterdayOrderCount',
    label: '昨天全天订单数',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric-wide'
  },
  {
    key: 'comparisonOrderCount',
    label: '昨天同小时订单数',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric-wide'
  },
  {
    key: 'todayOrderCount',
    label: '今天订单数',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric'
  },
  {
    key: 'yesterdayGmv',
    label: '昨天全天交易额',
    type: 'money',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--money'
  },
  {
    key: 'comparisonGmv',
    label: '昨天同小时交易额',
    type: 'money',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--money'
  },
  {
    key: 'todayGmv',
    label: '今天交易额',
    type: 'money',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--money'
  },
  {
    key: 'yesterdayBuyerCount',
    label: '昨天全天支付买家数',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric-wide'
  },
  {
    key: 'todayBuyerCount',
    label: '今天支付买家数',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric-wide'
  },
  {
    key: 'yesterdayVisitors',
    label: '昨天全天访客数',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric-wide'
  },
  {
    key: 'todayVisitors',
    label: '今天访客数',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric-wide'
  },
  {
    key: 'yesterdayViews',
    label: '昨天全天浏览量',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric-wide'
  },
  {
    key: 'todayViews',
    label: '今天浏览量',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric-wide'
  },
  {
    key: 'yesterdayVisitedGoodsCount',
    label: '昨天全天访问商品数',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric-wide'
  },
  {
    key: 'todayVisitedGoodsCount',
    label: '今天访问商品数',
    type: 'metric',
    summable: true,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric-wide'
  },
  {
    key: 'yesterdayPayRate',
    label: '昨天全天支付转化率',
    type: 'rate',
    summable: false,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric-wide'
  },
  {
    key: 'todayPayRate',
    label: '今天支付转化率',
    type: 'rate',
    summable: false,
    align: 'center',
    className: 'sales-table__col sales-table__col--metric-wide'
  }
];

const SALES_OVERVIEW_TREND_METRICS = [
  {
    key: 'todayOrderCount',
    label: '订单数',
    currentLabel: '今天订单数',
    baselineKey: 'comparisonOrderCount'
  },
  {
    key: 'todayGmv',
    label: '交易额',
    currentLabel: '今天交易额',
    baselineKey: 'comparisonGmv'
  },
  {
    key: 'todayBuyerCount',
    label: '支付买家数',
    currentLabel: '今天支付买家数',
    baselineKey: 'comparisonBuyerCount'
  },
  {
    key: 'todayVisitors',
    label: '访客数',
    currentLabel: '今天访客数',
    baselineKey: 'comparisonVisitors'
  },
  {
    key: 'todayViews',
    label: '浏览量',
    currentLabel: '今天浏览量',
    baselineKey: 'comparisonViews'
  },
  {
    key: 'todayVisitedGoodsCount',
    label: '访问商品数',
    currentLabel: '今天访问商品数',
    baselineKey: 'comparisonVisitedGoodsCount'
  },
  {
    key: 'todayPayRate',
    label: '支付转化率',
    currentLabel: '今天支付转化率',
    baselineKey: 'comparisonPayRate'
  }
];

const dom = {};

document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
  cacheDom();

  bindUiEvents();
  setupImageSlots();
  renderSkuRows(extractSkuRowsFromFormData(serializeForm(), { fallbackRows: DEFAULT_SKU_ROWS }));
  state.defaultFormData = stripTemplateDefaultFormData(serializeForm());
  renderBridgeMode();
  renderWorkspaceSummary();
  renderTemplateList();
  renderLogs();
  renderAuthState();
  renderAttributeState();
  renderSkuSpecState();
  renderSelectedShop();
  renderCategoryPicker();
  renderShopPicker();
  renderSalesOverviewPage();
  renderProductFillState();
  renderTemplateExport();

  if (state.bridge?.auth?.onEvent) {
    state.unsubscribeAuth = state.bridge.auth.onEvent(handleAuthEvent);
  }

  await bootstrapAuth();
}

function cacheDom() {
  dom.authGate = document.getElementById('authGate');
  dom.authNotice = document.getElementById('authNotice');
  dom.authStatusText = document.getElementById('authStatusText');
  dom.appShell = document.getElementById('appShell');
  dom.appHeaderCurrentShop = document.getElementById('appHeaderCurrentShop');
  dom.appHeaderAccountName = document.getElementById('appHeaderAccountName');
  dom.openSecondaryDrawerBtn = document.getElementById('openSecondaryDrawerBtn');
  dom.appTabs = Array.from(document.querySelectorAll('[data-app-tab]'));
  dom.shopSelectionPage = document.getElementById('shopSelectionPage');
  dom.shopSelectionBackBtn = document.getElementById('shopSelectionBackBtn');
  dom.shopSelectionAccountName = document.getElementById('shopSelectionAccountName');
  dom.shopSelectionAccountRole = document.getElementById('shopSelectionAccountRole');
  dom.shopSelectionAccountUsername = document.getElementById('shopSelectionAccountUsername');
  dom.shopSelectionCurrentShop = document.getElementById('shopSelectionCurrentShop');
  dom.openSalesOverviewBtn = document.getElementById('openSalesOverviewBtn');
  dom.salesOverviewPage = document.getElementById('salesOverviewPage');
  dom.salesOverviewBackBtn = document.getElementById('salesOverviewBackBtn');
  dom.salesOverviewSelectedCount = document.getElementById('salesOverviewSelectedCount');
  dom.salesOverviewStatusText = document.getElementById('salesOverviewStatusText');
  dom.salesOverviewLastFetched = document.getElementById('salesOverviewLastFetched');
  dom.salesOverviewStatus = document.getElementById('salesOverviewStatus');
  dom.salesOverviewSummary = document.getElementById('salesOverviewSummary');
  dom.salesOverviewScopeMeta = document.getElementById('salesOverviewScopeMeta');
  dom.salesOverviewFetchBtn = document.getElementById('salesOverviewFetchBtn');
  dom.salesOverviewStopBtn = document.getElementById('salesOverviewStopBtn');
  dom.salesOverviewExportBtn = document.getElementById('salesOverviewExportBtn');
  dom.salesOverviewSearchInput = document.getElementById('salesOverviewSearchInput');
  dom.salesOverviewOperatorFilterSelect = document.getElementById('salesOverviewOperatorFilterSelect');
  dom.salesOverviewTrendMetricSelect = document.getElementById('salesOverviewTrendMetricSelect');
  dom.salesOverviewTrendFilterSelect = document.getElementById('salesOverviewTrendFilterSelect');
  dom.salesOverviewSortSelect = document.getElementById('salesOverviewSortSelect');
  dom.salesOverviewNotice = document.getElementById('salesOverviewNotice');
  dom.salesOverviewError = document.getElementById('salesOverviewError');
  dom.salesOverviewSelectAllBtn = document.getElementById('salesOverviewSelectAllBtn');
  dom.salesOverviewClearBtn = document.getElementById('salesOverviewClearBtn');
  dom.salesOverviewResultBadge = document.getElementById('salesOverviewResultBadge');
  dom.salesOverviewTableWrap = document.getElementById('salesOverviewTableWrap');
  dom.salesOverviewTableScroll = document.getElementById('salesOverviewTableScroll');
  dom.salesOverviewTable = document.getElementById('salesOverviewTable');
  dom.salesOverviewStickyTableColgroup = document.getElementById('salesOverviewStickyTableColgroup');
  dom.salesOverviewStickyTableHead = document.getElementById('salesOverviewStickyTableHead');
  dom.salesOverviewTableColgroup = document.getElementById('salesOverviewTableColgroup');
  dom.salesOverviewTableHead = document.getElementById('salesOverviewTableHead');
  dom.salesOverviewTableBody = document.getElementById('salesOverviewTableBody');
  dom.salesOverviewSummaryRow = document.getElementById('salesOverviewSummaryRow');
  dom.workspaceShell = document.getElementById('workspaceShell');
  dom.loginForm = document.getElementById('loginForm');
  dom.loginUsernameInput = document.getElementById('loginUsernameInput');
  dom.loginPasswordInput = document.getElementById('loginPasswordInput');
  dom.loginRememberPasswordInput = document.getElementById('loginRememberPasswordInput');
  dom.loginSubmitBtn = document.getElementById('loginSubmitBtn');
  dom.loginError = document.getElementById('loginError');
  dom.logoutBtn = document.getElementById('logoutBtn');
  dom.openQuickLoginBtn = document.getElementById('openQuickLoginBtn');
  dom.openChangePasswordBtn = document.getElementById('openChangePasswordBtn');
  dom.accountDisplayName = document.getElementById('accountDisplayName');
  dom.accountRoleName = document.getElementById('accountRoleName');
  dom.accountUsername = document.getElementById('accountUsername');
  dom.accountCurrentShop = document.getElementById('accountCurrentShop');
  dom.accountRole = document.getElementById('accountRole');
  dom.accountUid = document.getElementById('accountUid');
  dom.openShopPickerBtn = document.getElementById('openShopPickerBtn');
  dom.shopPickerDesc = document.getElementById('shopPickerDesc');
  dom.shopAccessScope = document.getElementById('shopAccessScope');
  dom.shopCountBadge = document.getElementById('shopCountBadge');
  dom.shopSearchInput = document.getElementById('shopSearchInput');
  dom.shopSelectionError = document.getElementById('shopSelectionError');
  dom.shopSelectionList = document.getElementById('shopSelectionList');
  dom.shopSelectionConfirmBtn = document.getElementById('shopSelectionConfirmBtn');
  dom.shopSelectionRefreshBtn = document.getElementById('shopSelectionRefreshBtn');
  dom.shopPickerLogoutBtn = document.getElementById('shopPickerLogoutBtn');
  dom.openCategoryPickerBtn = document.getElementById('openCategoryPickerBtn');
  dom.openProductFillBtn = document.getElementById('openProductFillBtn');
  dom.categoryDataInput = document.getElementById(CATEGORY_FIELD_IDS.display);
  dom.categoryPickerModal = document.getElementById('categoryPickerModal');
  dom.categoryPickerBackdrop = document.getElementById('categoryPickerBackdrop');
  dom.closeCategoryPickerBtn = document.getElementById('closeCategoryPickerBtn');
  dom.categoryPickerDesc = document.getElementById('categoryPickerDesc');
  dom.categoryPickerSummary = document.getElementById('categoryPickerSummary');
  dom.categoryPickerError = document.getElementById('categoryPickerError');
  dom.categoryLevel1Select = document.getElementById('categoryLevel1Select');
  dom.categoryLevel2Select = document.getElementById('categoryLevel2Select');
  dom.categoryLevel3Select = document.getElementById('categoryLevel3Select');
  dom.categoryPickerNotice = document.getElementById('categoryPickerNotice');
  dom.categoryPickerRefreshBtn = document.getElementById('categoryPickerRefreshBtn');
  dom.categoryPickerConfirmBtn = document.getElementById('categoryPickerConfirmBtn');
  dom.goodsAttributeStatus = document.getElementById('goodsAttributeStatus');
  dom.goodsAttributeError = document.getElementById('goodsAttributeError');
  dom.goodsAttributeContainer = document.getElementById('pdd_GoodsAttribute');
  dom.goodsSkuBoard = document.getElementById('pddForm_goodsSku');
  dom.goodsSkuTableBody = document.getElementById('skuTableBody');
  dom.exportTemplateBtn = document.getElementById('exportTemplateBtn');
  dom.templateExportStatus = document.getElementById('templateExportStatus');
  dom.templateExportSummary = document.getElementById('templateExportSummary');
  dom.templateExportPath = document.getElementById('templateExportPath');
  dom.templateExportError = document.getElementById('templateExportError');
  dom.templateExportOutput = document.getElementById('templateExportOutput');
  dom.openExportFolderBtn = document.getElementById('openExportFolderBtn');
  dom.changePasswordModal = document.getElementById('changePasswordModal');
  dom.changePasswordBackdrop = document.getElementById('changePasswordBackdrop');
  dom.closeChangePasswordBtn = document.getElementById('closeChangePasswordBtn');
  dom.changePasswordForm = document.getElementById('changePasswordForm');
  dom.currentPasswordInput = document.getElementById('currentPasswordInput');
  dom.newPasswordInput = document.getElementById('newPasswordInput');
  dom.confirmPasswordInput = document.getElementById('confirmPasswordInput');
  dom.changePasswordError = document.getElementById('changePasswordError');
  dom.changePasswordSuccess = document.getElementById('changePasswordSuccess');
  dom.changePasswordSubmitBtn = document.getElementById('changePasswordSubmitBtn');
  dom.productFillModal = document.getElementById('productFillModal');
  dom.productFillBackdrop = document.getElementById('productFillBackdrop');
  dom.closeProductFillBtn = document.getElementById('closeProductFillBtn');
  dom.productFillForm = document.getElementById('productFillForm');
  dom.productFillIdInput = document.getElementById('productFillIdInput');
  dom.productFillSummary = document.getElementById('productFillSummary');
  dom.productFillError = document.getElementById('productFillError');
  dom.productFillConfirmBtn = document.getElementById('productFillConfirmBtn');
  dom.webModeNotice = document.getElementById('webModeNotice');
  dom.form = document.getElementById('pddForm');
  dom.goodsNameInput = document.getElementById('pddForm_goodsName');
  dom.goodsNameLengthMeta = document.getElementById('goodsNameLengthMeta');
  dom.templateNameInput = document.getElementById('templateNameInput');
  dom.currentTemplateMeta = document.getElementById('currentTemplateMeta');
  dom.templateList = document.getElementById('templateList');
  dom.templateCountBadge = document.getElementById('templateCountBadge');
  dom.workspaceSummary = document.getElementById('workspaceSummary');
  dom.heroCurrentTemplate = document.getElementById('heroCurrentTemplate');
  dom.workspaceOverviewTemplateMeta = document.getElementById('workspaceOverviewTemplateMeta');
  dom.workspaceProductSummary = document.getElementById('workspaceProductSummary');
  dom.workspaceMediaSummary = document.getElementById('workspaceMediaSummary');
  dom.workspaceSkuSummary = document.getElementById('workspaceSkuSummary');
  dom.workspacePublishSummary = document.getElementById('workspacePublishSummary');
  dom.workspaceExportSummary = document.getElementById('workspaceExportSummary');
  dom.workspaceExportPath = document.getElementById('workspaceExportPath');
  dom.workspaceAccountDisplayName = document.getElementById('workspaceAccountDisplayName');
  dom.workspaceAccountRoleName = document.getElementById('workspaceAccountRoleName');
  dom.workspaceSaveTemplateBtn = document.getElementById('workspaceSaveTemplateBtn');
  dom.workspaceOpenWorkspaceBtn = document.getElementById('workspaceOpenWorkspaceBtn');
  dom.freightNotice = document.getElementById('freightNotice');
  dom.ignoreEditWarnNotice = document.getElementById('ignoreEditWarnNotice');
  dom.openSecondaryPanelTriggers = Array.from(document.querySelectorAll('[data-open-secondary-panel]'));
  dom.workspaceStepToggles = Array.from(document.querySelectorAll('[data-workspace-step-toggle]'));
  dom.workspaceNavLinks = Array.from(document.querySelectorAll('[data-workspace-nav-link]'));
  dom.workspaceSections = Array.from(document.querySelectorAll('[data-workspace-section]'));
  dom.secondaryDrawer = document.getElementById('secondaryDrawer');
  dom.secondaryDrawerBackdrop = document.getElementById('secondaryDrawerBackdrop');
  dom.closeSecondaryDrawerBtn = document.getElementById('closeSecondaryDrawerBtn');
  dom.secondaryPanelTriggers = Array.from(document.querySelectorAll('[data-secondary-panel-trigger]'));
  dom.secondaryPanels = Array.from(document.querySelectorAll('[data-secondary-panel]'));
  dom.actionCurrentTemplate = document.getElementById('actionCurrentTemplate');
  dom.automationLogList = document.getElementById('automationLogList');
  dom.logCountBadge = document.getElementById('logCountBadge');
  dom.detailPreviewRefreshBtn = document.getElementById('detailPreviewRefreshBtn');
}

function bindUiEvents() {
  dom.loginForm?.addEventListener('submit', handleLoginSubmit);
  dom.loginUsernameInput?.addEventListener('input', clearLoginError);
  dom.loginPasswordInput?.addEventListener('input', clearLoginError);
  dom.loginRememberPasswordInput?.addEventListener('change', handleRememberPasswordChange);
  dom.appTabs.forEach((tab) => tab.addEventListener('click', handleAppTabClick));
  dom.logoutBtn?.addEventListener('click', handleLogout);
  dom.openQuickLoginBtn?.addEventListener('click', handleOpenQuickLogin);
  dom.openShopPickerBtn?.addEventListener('click', handleOpenShopPicker);
  dom.shopSelectionBackBtn?.addEventListener('click', closeShopPicker);
  dom.openSalesOverviewBtn?.addEventListener('click', handleOpenSalesOverviewPage);
  dom.shopSearchInput?.addEventListener('input', handleShopSearchInput);
  dom.shopSearchInput?.addEventListener('keydown', handleShopSearchKeyDown);
  dom.shopSelectionList?.addEventListener('click', handleShopSelectionListClick);
  dom.shopSelectionConfirmBtn?.addEventListener('click', handleConfirmShopSelection);
  dom.shopPickerLogoutBtn?.addEventListener('click', handleLogout);
  dom.shopSelectionRefreshBtn?.addEventListener('click', () => {
    hydrateShopCatalog({ force: true }).catch((error) => {
      console.error(error);
    });
  });
  dom.salesOverviewBackBtn?.addEventListener('click', closeSalesOverviewPage);
  dom.salesOverviewFetchBtn?.addEventListener('click', handleStartSalesOverviewFetch);
  dom.salesOverviewStopBtn?.addEventListener('click', handleStopSalesOverviewFetch);
  dom.salesOverviewExportBtn?.addEventListener('click', handleExportSalesOverview);
  dom.salesOverviewSearchInput?.addEventListener('input', handleSalesOverviewSearchInput);
  dom.salesOverviewOperatorFilterSelect?.addEventListener('change', handleSalesOverviewOperatorFilterChange);
  dom.salesOverviewTrendMetricSelect?.addEventListener('change', handleSalesOverviewTrendMetricChange);
  dom.salesOverviewTrendFilterSelect?.addEventListener('change', handleSalesOverviewTrendFilterChange);
  dom.salesOverviewSortSelect?.addEventListener('change', handleSalesOverviewSortChange);
  dom.salesOverviewSelectAllBtn?.addEventListener('click', handleSelectAllSalesOverviewShops);
  dom.salesOverviewClearBtn?.addEventListener('click', handleClearSalesOverviewShops);
  dom.salesOverviewTableScroll?.addEventListener('scroll', syncSalesOverviewStickyHeader, { passive: true });
  dom.salesOverviewTableBody?.addEventListener('change', handleSalesOverviewTableSelectionChange);
  dom.salesOverviewTableBody?.addEventListener('click', handleSalesOverviewTableClick);
  dom.openProductFillBtn?.addEventListener('click', openProductFillModal);
  dom.workspaceSaveTemplateBtn?.addEventListener('click', () => saveCurrentTemplate({ silent: false }));
  dom.workspaceOpenWorkspaceBtn?.addEventListener('click', () => openWorkspaceFolder('root'));
  dom.openSecondaryDrawerBtn?.addEventListener('click', () => openSecondaryDrawer({ panel: 'templates' }));
  dom.secondaryDrawerBackdrop?.addEventListener('click', closeSecondaryDrawer);
  dom.closeSecondaryDrawerBtn?.addEventListener('click', closeSecondaryDrawer);
  dom.secondaryPanelTriggers.forEach((trigger) => trigger.addEventListener('click', handleSecondaryPanelTriggerClick));
  dom.openSecondaryPanelTriggers.forEach((trigger) => trigger.addEventListener('click', handleOpenSecondaryPanelClick));
  dom.workspaceNavLinks.forEach((link) => link.addEventListener('click', handleWorkspaceNavClick));
  dom.workspaceStepToggles.forEach((button) => button.addEventListener('click', handleWorkspaceStepToggleClick));
  dom.openCategoryPickerBtn?.addEventListener('click', handleOpenCategoryPicker);
  dom.categoryDataInput?.addEventListener('click', handleOpenCategoryPicker);
  dom.categoryPickerBackdrop?.addEventListener('click', closeCategoryPicker);
  dom.closeCategoryPickerBtn?.addEventListener('click', closeCategoryPicker);
  dom.categoryLevel1Select?.addEventListener('change', handleCategoryLevel1Change);
  dom.categoryLevel2Select?.addEventListener('change', handleCategoryLevel2Change);
  dom.categoryLevel3Select?.addEventListener('change', handleCategoryLevel3Change);
  dom.categoryPickerRefreshBtn?.addEventListener('click', () => {
    hydrateCategoryPicker({ force: true }).catch((error) => {
      console.error(error);
    });
  });
  dom.categoryPickerConfirmBtn?.addEventListener('click', handleConfirmCategorySelection);
  dom.exportTemplateBtn?.addEventListener('click', handleExportTemplateToFolder);
  dom.openExportFolderBtn?.addEventListener('click', handleOpenExportFolder);
  dom.openChangePasswordBtn?.addEventListener('click', openChangePasswordModal);
  dom.closeChangePasswordBtn?.addEventListener('click', closeChangePasswordModal);
  dom.changePasswordBackdrop?.addEventListener('click', closeChangePasswordModal);
  dom.changePasswordForm?.addEventListener('submit', handleChangePasswordSubmit);
  dom.currentPasswordInput?.addEventListener('input', clearChangePasswordFeedback);
  dom.newPasswordInput?.addEventListener('input', clearChangePasswordFeedback);
  dom.confirmPasswordInput?.addEventListener('input', clearChangePasswordFeedback);
  dom.productFillBackdrop?.addEventListener('click', closeProductFillModal);
  dom.closeProductFillBtn?.addEventListener('click', closeProductFillModal);
  dom.productFillForm?.addEventListener('submit', handleProductFillSubmit);
  dom.productFillIdInput?.addEventListener('input', handleProductFillIdInput);
  dom.goodsSkuTableBody?.addEventListener('click', handleSkuTableClick);
  dom.goodsSkuTableBody?.addEventListener('input', handleSkuTableInput);
  dom.goodsSkuBoard?.addEventListener('click', handleSkuSpecBoardClick);
  dom.goodsSkuBoard?.addEventListener('change', handleSkuSpecBoardChange);
  dom.goodsSkuBoard?.addEventListener('compositionstart', handleSkuSpecBoardCompositionStart);
  dom.goodsSkuBoard?.addEventListener('compositionend', handleSkuSpecBoardCompositionEnd);
  dom.goodsSkuBoard?.addEventListener('input', handleSkuSpecBoardInput);

  document.getElementById('newTemplateBtn')?.addEventListener('click', handleCreateTemplate);
  document.getElementById('saveTemplateBtn')?.addEventListener('click', () => saveCurrentTemplate({ silent: false }));
  document.getElementById('duplicateTemplateBtn')?.addEventListener('click', handleDuplicateTemplate);
  document.getElementById('deleteTemplateBtn')?.addEventListener('click', handleDeleteTemplate);
  document.getElementById('setDefaultTemplateBtn')?.addEventListener('click', handleSetDefaultTemplate);
  document.getElementById('openWorkspaceBtn')?.addEventListener('click', () => openWorkspaceFolder('root'));
  document.getElementById('openAssetsBtn')?.addEventListener('click', () => openWorkspaceFolder('assets'));
  dom.detailPreviewRefreshBtn?.addEventListener('click', () => {
    renderDetailGalleryPreview(getArrayZoneRefs('detailGallery'));
  });

  document.querySelectorAll('[data-zone-upload]').forEach((button) => {
    button.addEventListener('click', () => {
      triggerZoneUpload(button.dataset.zoneUpload).catch((error) => {
        console.error(error);
      });
    });
  });

  dom.templateNameInput?.addEventListener('input', () => {
    scheduleAutoSave();
    renderWorkspaceMeta();
  });

  dom.templateList?.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-template-id]');
    if (!trigger) {
      return;
    }

    await selectTemplate(trigger.dataset.templateId);
  });

  dom.form?.addEventListener('input', () => {
    if (!state.isHydrating) {
      scheduleAutoSave();
    }
    renderWorkspaceMeta();
  });

  dom.form?.addEventListener('change', () => {
    if (!state.isHydrating) {
      scheduleAutoSave();
    }
    renderWorkspaceMeta();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dom.categoryPickerModal.hidden) {
      closeCategoryPicker();
      return;
    }

    if (event.key === 'Escape' && !dom.changePasswordModal.hidden) {
      closeChangePasswordModal();
      return;
    }

    if (event.key === 'Escape' && !dom.productFillModal.hidden) {
      closeProductFillModal();
      return;
    }

    if (event.key === 'Escape' && dom.secondaryDrawer && !dom.secondaryDrawer.hidden) {
      closeSecondaryDrawer();
    }
  });

  window.addEventListener('scroll', handleWindowViewportChange, { passive: true });
  window.addEventListener('resize', handleWindowViewportChange);
}

function handleOpenSecondaryPanelClick(event) {
  const panel = String(event.currentTarget?.dataset?.openSecondaryPanel || '').trim();
  if (!panel) {
    return;
  }

  openSecondaryDrawer({ panel });
}

function handleSecondaryPanelTriggerClick(event) {
  const panel = String(event.currentTarget?.dataset?.panel || '').trim();
  if (!panel) {
    return;
  }

  state.ui.secondaryDrawerPanel = panel;
  renderSecondaryDrawer();
}

function openSecondaryDrawer({ panel = 'templates' } = {}) {
  if (state.ui.activeSurface !== 'workspace') {
    if (!state.shop.selected) {
      return;
    }

    state.salesOverview.isOpen = false;
    state.shop.isOpen = false;
    state.shop.isRequired = false;
  }

  state.ui.secondaryDrawerPanel = panel;
  renderShellState();
}

function closeSecondaryDrawer() {
  state.ui.secondaryDrawerPanel = '';
  renderSecondaryDrawer();
}

function renderSecondaryDrawer() {
  if (!dom.secondaryDrawer) {
    return;
  }

  const activePanel = String(state.ui.secondaryDrawerPanel || '').trim();
  const isOpen = Boolean(activePanel) && state.ui.activeSurface === 'workspace';
  dom.secondaryDrawer.hidden = !isOpen;

  if (dom.openSecondaryDrawerBtn) {
    dom.openSecondaryDrawerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  dom.secondaryPanelTriggers.forEach((trigger) => {
    const panel = String(trigger.dataset.panel || '').trim();
    const isActive = isOpen && panel === activePanel;
    trigger.classList.toggle('is-active', isActive);
    trigger.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  dom.secondaryPanels.forEach((panel) => {
    const panelKey = String(panel.dataset.secondaryPanel || '').trim();
    panel.hidden = !isOpen || panelKey !== activePanel;
  });
}

function handleWorkspaceStepToggleClick(event) {
  const sectionKey = String(event.currentTarget?.dataset?.section || '').trim();
  if (!sectionKey) {
    return;
  }

  setActiveWorkspaceStep(sectionKey);
}

function handleToggleSalesOverviewScope() {
  state.ui.isSalesScopeOpen = !state.ui.isSalesScopeOpen;
  renderSalesOverviewPage();
}

async function handleAppTabClick(event) {
  const targetTab = String(event.currentTarget?.dataset?.appTab || '').trim();
  if (!state.auth.user || !targetTab) {
    return;
  }

  if (targetTab === 'shops') {
    handleOpenShopPicker().catch((error) => {
      console.error(error);
    });
    return;
  }

  if (targetTab === 'overview') {
    handleOpenSalesOverviewPage();
    return;
  }

  state.salesOverview.isOpen = false;
  state.ui.secondaryDrawerPanel = '';
  state.shop.isOpen = false;
  if (!state.ui.activeWorkspaceStep) {
    state.ui.activeWorkspaceStep = 'overview';
  }
  renderShellState();
  renderShopPicker();
  renderSalesOverviewPage();
  updateActiveWorkspaceSection();
  await tryAutoBindCurrentTemplateShop({ source: 'template' });
}

function handleWorkspaceNavClick(event) {
  const button = event.currentTarget;
  const sectionKey = String(button?.dataset?.section || '').trim();
  if (!sectionKey) {
    return;
  }

  setActiveWorkspaceStep(sectionKey);
}

function handleWindowViewportChange() {
  if (state.ui.activeSurface !== 'workspace') {
    return;
  }

  renderWorkspaceStageNav();
}

async function bootstrapAuth() {
  state.auth.baseUrl = DEFAULT_BACKEND_URL;

  if (!state.bridge?.auth) {
    state.auth.status = 'unauthenticated';
    state.auth.error = '当前页面没有连接到 Electron 主进程，无法使用登录能力。';
    resetShopState();
    resetSalesOverviewState();
    renderAuthState();
    return;
  }

  state.auth.status = 'checking';
  state.auth.error = '';
  renderAuthState();

  const result = await state.bridge.auth.restoreSession();
  state.auth.baseUrl = DEFAULT_BACKEND_URL;
  state.auth.lastUsername = result.lastUsername || '';
  state.auth.rememberPassword = result.rememberPassword === true;
  state.auth.savedPassword = state.auth.rememberPassword ? String(result.savedPassword || '') : '';

  if (result.authenticated) {
    state.auth.user = result.user || null;
    state.auth.status = 'authenticated';
    state.auth.error = '';
    renderAuthState();
    await ensureWorkbenchReady();
    await hydrateShopCatalog();
    await tryAutoBindCurrentTemplateShop({ source: 'template' });
  } else {
    state.auth.user = null;
    state.auth.status = 'unauthenticated';
    state.auth.error = result.message || '';
    resetShopState();
    resetSalesOverviewState();
    applyRememberedCredentials({ force: true, focusPassword: Boolean(state.auth.lastUsername) });
  }

  renderAuthState();
}

async function ensureWorkbenchReady() {
  if (state.isWorkbenchReady || state.isWorkbenchHydrating) {
    return;
  }

  state.isWorkbenchHydrating = true;
  try {
    await hydrateWorkspace();
    await hydrateTemplates();
    state.isWorkbenchReady = true;
  } finally {
    state.isWorkbenchHydrating = false;
  }
}

function handleAuthEvent(event) {
  if (event?.type === 'session-expired') {
    handleSessionExpired(event.message || '登录已失效，请重新登录');
  }
}

function handleSessionExpired(message) {
  stopSalesOverviewFetch({ preserveStatus: false });
  state.auth.lastUsername = getUsername(state.auth.user) || state.auth.lastUsername;
  state.auth.status = 'unauthenticated';
  state.auth.user = null;
  state.auth.error = message || '登录已失效，请重新登录';
  state.auth.isLoggingIn = false;
  state.auth.isChangingPassword = false;
  closeChangePasswordModal();
  resetCategoryState();
  resetAttributeState();
  resetSkuSpecState();
  resetProductFillState();
  dom.loginPasswordInput.value = '';
  resetShopState();
  resetSalesOverviewState();
  resetTemplateExportState();
  showAuthNotice(state.auth.error);
  renderAuthState();
  restoreLoggedOutLoginControls();
  applyRememberedCredentials({ force: true, focusPassword: Boolean(state.auth.lastUsername) });
}

function shouldShowShopSelectionPage() {
  return Boolean(state.auth.user) && !state.salesOverview.isOpen && state.shop.isOpen;
}

function shouldShowSalesOverviewPage() {
  return Boolean(state.auth.user) && state.salesOverview.isOpen;
}

function getCurrentSurface() {
  if (state.auth.status !== 'authenticated') {
    return 'auth';
  }

  if (shouldShowSalesOverviewPage()) {
    return 'overview';
  }

  if (shouldShowShopSelectionPage()) {
    return 'shops';
  }

  return 'workspace';
}

function renderShellState() {
  const surface = getCurrentSurface();
  const isAuthenticated = surface !== 'auth';
  const showAuthGate = surface === 'auth';
  const showSalesOverviewPage = surface === 'overview';
  const showShopSelectionPage = surface === 'shops';
  const showWorkspaceShell = surface === 'workspace';
  state.ui.activeSurface = surface;

  if (dom.authGate) {
    dom.authGate.hidden = !showAuthGate;
  }

  if (dom.appShell) {
    dom.appShell.hidden = !isAuthenticated;
  }

  if (dom.shopSelectionPage) {
    dom.shopSelectionPage.hidden = !showShopSelectionPage;
  }

  if (dom.salesOverviewPage) {
    dom.salesOverviewPage.hidden = !showSalesOverviewPage;
  }

  if (dom.workspaceShell) {
    dom.workspaceShell.hidden = !showWorkspaceShell;
  }

  if (!showWorkspaceShell && state.ui.secondaryDrawerPanel) {
    state.ui.secondaryDrawerPanel = '';
  }

  renderAppShell();
  renderSecondaryDrawer();
  if (showWorkspaceShell) {
    updateActiveWorkspaceSection();
  }
}

function renderAppShell() {
  if (dom.appHeaderCurrentShop) {
    dom.appHeaderCurrentShop.textContent = getCurrentShopLabel({ emptyLabel: state.auth.user ? '待选择' : '未登录' });
  }

  if (dom.appHeaderAccountName) {
    dom.appHeaderAccountName.textContent = state.auth.user ? getDisplayName(state.auth.user) : '未登录';
  }

  if (dom.openSecondaryDrawerBtn) {
    dom.openSecondaryDrawerBtn.disabled = !state.shop.selected;
  }

  dom.appTabs.forEach((tab) => {
    const tabName = String(tab.dataset.appTab || '').trim();
    const isActive = tabName === state.ui.activeSurface;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  renderWorkspaceStageNav();
}

function renderWorkspaceStageNav() {
  renderWorkspaceMeta();

  dom.workspaceNavLinks.forEach((link) => {
    const sectionKey = String(link.dataset.section || '').trim();
    const isActive = sectionKey === state.ui.activeWorkspaceStep;
    link.classList.toggle('is-active', isActive);
    link.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  dom.workspaceSections.forEach((section) => {
    const sectionKey = String(section.dataset.workspaceSection || '').trim();
    const body = section.querySelector('.section-card__body');
    const isExpanded = sectionKey === 'overview' || sectionKey === state.ui.activeWorkspaceStep;
    section.classList.toggle('is-step-active', isExpanded);
    section.classList.toggle('is-step-collapsed', !isExpanded && sectionKey !== 'overview');

    if (body) {
      body.hidden = !isExpanded;
    }

    const toggle = section.querySelector('[data-workspace-step-toggle]');
    if (toggle) {
      toggle.textContent = isExpanded ? '当前步骤' : '展开';
      toggle.setAttribute('aria-pressed', isExpanded ? 'true' : 'false');
    }
  });
}

function updateActiveWorkspaceSection() {
  if (!dom.workspaceSections.length || state.ui.activeSurface !== 'workspace') {
    return;
  }

  state.ui.activeWorkspaceSection = state.ui.activeWorkspaceStep;
  renderWorkspaceStageNav();
}

function setActiveWorkspaceStep(sectionKey, { scroll = true } = {}) {
  const normalizedKey = String(sectionKey || 'overview').trim() || 'overview';
  state.ui.activeWorkspaceStep = normalizedKey;
  state.ui.activeWorkspaceSection = normalizedKey;
  renderWorkspaceStageNav();

  if (!scroll) {
    return;
  }

  const targetId = normalizedKey === 'overview'
    ? 'workspaceOverviewSection'
    : `workspace${normalizedKey.charAt(0).toUpperCase()}${normalizedKey.slice(1)}Section`;
  const target = document.getElementById(targetId);
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderWorkspaceMeta() {
  renderWorkspaceStepSummaries();
  renderConditionalWorkspaceNotices();
}

function renderWorkspaceStepSummaries() {
  if (!dom.form) {
    return;
  }

  const formData = serializeForm();
  const categoryLabel = compactCategoryLabel(dom.categoryDataInput?.value);
  const goodsNameUsage = renderGoodsNameLengthMeta(formData);
  const attributeCount = countFilledAttributeControls();
  const mainCount = getArrayZoneRefs('mainGallery').length;
  const detailCount = getArrayZoneRefs('detailGallery').length;
  const hasWhiteImage = Boolean(state.slotRegistry.whiteImage?.[0]?.__assetRef);
  const hasLongImage = Boolean(state.slotRegistry.longImage?.[0]?.__assetRef);
  const skuRows = extractSkuRowsFromFormData(formData, { fallbackRows: [] });
  const publishType = readCheckedControlLabel('pddForm_publishType');
  const shipmentLimit = readCheckedControlLabel('pddForm_shipmentLimitSecond');
  const ignoreEditWarn = String(formData.ignoreEditWarn || '').trim() === 'true';

  setNodeText(dom.workspaceProductSummary, [
    categoryLabel || '未选类目',
    formatGoodsNameSummary(goodsNameUsage),
    attributeCount ? `属性 ${attributeCount} 项` : '属性待填'
  ].join(' · '));

  setNodeText(dom.workspaceMediaSummary, [
    `轮播 ${mainCount}/10`,
    `详情 ${detailCount}`,
    hasWhiteImage ? '白底图已传' : '白底图未传',
    hasLongImage ? '长图已传' : '长图未传'
  ].join(' · '));

  setNodeText(dom.workspaceSkuSummary, [
    skuRows.length ? `SKU ${skuRows.length} 行` : 'SKU 未配置',
    formData.styleCode ? `满2件折扣 ${formData.styleCode}` : '满2件折扣未填',
    formData.marketPrice ? `市场价 ${formData.marketPrice}` : '市场价未填'
  ].join(' · '));

  setNodeText(dom.workspacePublishSummary, [
    publishType || '未选上架方式',
    shipmentLimit || '未选发货时效',
    ignoreEditWarn ? '忽略平台提示' : '遵循平台提示'
  ].join(' · '));
}

function formatGoodsNameSummary(usage) {
  if (!usage || !usage.value) {
    return '标题未填';
  }

  if (usage.maxLength > 0) {
    return `标题 ${usage.length}/${usage.maxLength}`;
  }

  return `标题 ${usage.length}`;
}

function renderGoodsNameLengthMeta(formData = null) {
  const value = dom.goodsNameInput
    ? String(dom.goodsNameInput.value || '')
    : String(formData?.goodsName || formData?.pddForm_goodsName || '');
  const maxLength = resolveControlMaxLength('pddForm_goodsName', 60);
  const length = maxLength > 0 ? maxLength : value.length;

  if (dom.goodsNameLengthMeta) {
    setNodeText(
      dom.goodsNameLengthMeta,
      maxLength > 0 ? `${length} / ${maxLength}` : String(length)
    );
  }

  return {
    value,
    length,
    maxLength
  };
}

function renderConditionalWorkspaceNotices() {
  if (dom.freightNotice) {
    const freightValue = String(dom.form?.querySelector('#pddForm_shopShelvesFreights_select')?.value || '').trim();
    dom.freightNotice.hidden = !freightValue || freightValue === 'cn-free';
  }

  if (dom.ignoreEditWarnNotice) {
    const ignoreEditWarn = String(dom.form?.querySelector('input[name="ignoreEditWarn"]:checked')?.value || '').trim();
    dom.ignoreEditWarnNotice.hidden = ignoreEditWarn !== 'true';
  }
}

function compactCategoryLabel(value) {
  const parts = String(value || '')
    .split('>')
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return '';
  }

  return parts.slice(-2).join(' / ');
}

function countFilledAttributeControls() {
  if (!dom.goodsAttributeContainer) {
    return 0;
  }

  return Array.from(dom.goodsAttributeContainer.querySelectorAll('input, select, textarea')).filter((control) => {
    return String(control.value || '').trim();
  }).length;
}

function readCheckedControlLabel(containerId) {
  const label = document.querySelector(`#${containerId} input:checked + span`);
  return String(label?.textContent || '').trim();
}

function setNodeText(node, value) {
  if (node) {
    node.textContent = value;
  }
}

function renderAuthState() {
  const isChecking = state.auth.status === 'checking';
  const isAuthenticated = state.auth.status === 'authenticated';
  const canUseDesktopAuth = Boolean(state.bridge?.auth);

  renderShellState();

  if (isChecking) {
    dom.authStatusText.textContent = '正在检查本地会话…';
  } else if (isAuthenticated) {
    dom.authStatusText.textContent = `已登录为 ${getDisplayName(state.auth.user)}`;
  } else {
    dom.authStatusText.textContent = canUseDesktopAuth
      ? '请输入账号密码'
      : '当前页面未连接桌面主进程';
  }

  dom.loginError.hidden = !state.auth.error;
  dom.loginError.textContent = state.auth.error || '';

  dom.loginUsernameInput.disabled = isChecking || state.auth.isLoggingIn || !canUseDesktopAuth;
  dom.loginPasswordInput.disabled = isChecking || state.auth.isLoggingIn || !canUseDesktopAuth;
  if (dom.loginRememberPasswordInput) {
    dom.loginRememberPasswordInput.disabled = isChecking || state.auth.isLoggingIn || !canUseDesktopAuth;
    dom.loginRememberPasswordInput.checked = Boolean(state.auth.rememberPassword);
  }
  dom.loginSubmitBtn.disabled = isChecking || state.auth.isLoggingIn || !canUseDesktopAuth;
  dom.loginSubmitBtn.textContent = isChecking
    ? '正在检查会话...'
    : state.auth.isLoggingIn
      ? '正在登录...'
      : '进入工作台';

  renderAccountPanel();
  renderSalesOverviewPage();
  renderChangePasswordState();
  renderProductFillState();
  renderTemplateExport();
}

function renderAccountPanel() {
  const user = state.auth.user;
  dom.accountDisplayName.textContent = user ? getDisplayName(user) : '未登录';
  dom.accountRoleName.textContent = user ? (user.role_name || user.roleName || user.role || '-') : '-';
  dom.accountUsername.textContent = user ? getUsername(user) : '-';
  dom.accountCurrentShop.textContent = getCurrentShopLabel({ emptyLabel: user ? '待选择' : '-' });
  dom.accountRole.textContent = user ? (user.role || '-') : '-';
  dom.accountUid.textContent = user ? (user.uid || '-') : '-';

  if (dom.shopSelectionAccountName) {
    dom.shopSelectionAccountName.textContent = user ? getDisplayName(user) : '未登录';
  }

  if (dom.shopSelectionAccountRole) {
    dom.shopSelectionAccountRole.textContent = user ? (user.role_name || user.roleName || user.role || '-') : '-';
  }

  if (dom.shopSelectionAccountUsername) {
    dom.shopSelectionAccountUsername.textContent = user ? getUsername(user) : '-';
  }

  if (dom.shopSelectionCurrentShop) {
    dom.shopSelectionCurrentShop.textContent = `当前店铺：${getCurrentShopLabel({ emptyLabel: user ? '尚未确认' : '-' })}`;
  }

  if (dom.appHeaderAccountName) {
    dom.appHeaderAccountName.textContent = user ? getDisplayName(user) : '未登录';
  }

  if (dom.workspaceAccountDisplayName) {
    dom.workspaceAccountDisplayName.textContent = user ? getDisplayName(user) : '未登录';
  }

  if (dom.workspaceAccountRoleName) {
    dom.workspaceAccountRoleName.textContent = user ? (user.role_name || user.roleName || user.role || '-') : '角色信息会显示在这里。';
  }
}

function showAuthNotice(message) {
  if (!message) {
    dom.authNotice.hidden = true;
    dom.authNotice.textContent = '';
    return;
  }

  dom.authNotice.textContent = message;
  dom.authNotice.hidden = false;
  window.clearTimeout(state.authNoticeTimer);
  state.authNoticeTimer = window.setTimeout(() => {
    dom.authNotice.hidden = true;
    dom.authNotice.textContent = '';
  }, 6000);
}

function clearLoginError() {
  if (!state.auth.error) {
    return;
  }

  state.auth.error = '';
  renderAuthState();
}

function handleRememberPasswordChange(event) {
  state.auth.rememberPassword = Boolean(event.target?.checked);
  clearLoginError();
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  if (!state.bridge?.auth) {
    return;
  }

  const submittedUsername = dom.loginUsernameInput.value.trim();
  const submittedPassword = dom.loginPasswordInput.value;
  const rememberPassword = Boolean(dom.loginRememberPasswordInput?.checked);
  state.auth.baseUrl = DEFAULT_BACKEND_URL;
  state.auth.error = '';
  state.auth.rememberPassword = rememberPassword;
  state.auth.isLoggingIn = true;
  renderAuthState();

  const result = await state.bridge.auth.login({
    baseUrl: DEFAULT_BACKEND_URL,
    username: submittedUsername,
    password: submittedPassword,
    rememberPassword
  });

  state.auth.isLoggingIn = false;
  state.auth.baseUrl = DEFAULT_BACKEND_URL;

  if (!result.ok) {
    state.auth.status = 'unauthenticated';
    state.auth.error = result.error?.message || '登录失败，请稍后重试';
    renderAuthState();
    return;
  }

  state.auth.user = result.user || null;
  state.auth.lastUsername = result.lastUsername || getUsername(result.user) || submittedUsername;
  state.auth.rememberPassword = result.rememberPassword === true;
  state.auth.savedPassword = state.auth.rememberPassword
    ? String(result.savedPassword || submittedPassword)
    : '';
  state.auth.status = 'authenticated';
  state.auth.error = '';
  dom.loginUsernameInput.value = state.auth.lastUsername;
  dom.loginPasswordInput.value = '';
  renderAuthState();

  await ensureWorkbenchReady();
  await hydrateShopCatalog();
  await tryAutoBindCurrentTemplateShop({ source: 'template' });
  renderAuthState();
}

async function handleLogout() {
  if (!state.bridge?.auth) {
    return;
  }

  const confirmed = window.confirm('确认退出当前账号吗？');
  if (!confirmed) {
    return;
  }

  state.auth.lastUsername = getUsername(state.auth.user) || state.auth.lastUsername;
  await state.bridge.auth.logout();
  state.auth.status = 'unauthenticated';
  state.auth.user = null;
  state.auth.error = '';
  state.auth.isLoggingIn = false;
  state.auth.isChangingPassword = false;
  stopSalesOverviewFetch({ preserveStatus: false });
  dom.loginPasswordInput.value = '';
  resetCategoryState();
  resetAttributeState();
  resetSkuSpecState();
  resetProductFillState();
  resetShopState();
  resetSalesOverviewState();
  resetTemplateExportState();
  closeChangePasswordModal();
  renderAuthState();
  restoreLoggedOutLoginControls();
  applyRememberedCredentials({ force: true, focusPassword: Boolean(state.auth.lastUsername) });
  showAuthNotice('已退出登录');
}

function openChangePasswordModal() {
  if (!state.auth.user) {
    return;
  }

  closeSecondaryDrawer();
  dom.changePasswordForm.reset();
  clearChangePasswordFeedback();
  dom.changePasswordModal.hidden = false;
  dom.currentPasswordInput.focus();
}

function closeChangePasswordModal() {
  dom.changePasswordModal.hidden = true;
  state.auth.isChangingPassword = false;
  renderChangePasswordState();
}

function clearChangePasswordFeedback() {
  dom.changePasswordError.hidden = true;
  dom.changePasswordError.textContent = '';
  dom.changePasswordSuccess.hidden = true;
  dom.changePasswordSuccess.textContent = '';
}

function renderChangePasswordState() {
  const disabled = state.auth.isChangingPassword || !state.auth.user;
  dom.currentPasswordInput.disabled = disabled;
  dom.newPasswordInput.disabled = disabled;
  dom.confirmPasswordInput.disabled = disabled;
  dom.changePasswordSubmitBtn.disabled = disabled;
  dom.changePasswordSubmitBtn.textContent = state.auth.isChangingPassword ? '正在提交...' : '确认修改';
}

function canUseProductFill() {
  return Boolean(state.bridge?.auth && state.auth.user && state.currentTemplateId);
}

function resetProductFillState() {
  const draftProductId = String(dom.productFillIdInput?.value || state.productFill.productId || '').trim();
  state.productFill = buildInitialProductFillState();
  state.productFill.productId = draftProductId;
  renderProductFillState();
}

function openProductFillModal() {
  if (!canUseProductFill()) {
    return;
  }

  closeSecondaryDrawer();
  state.productFill.isOpen = true;
  state.productFill.status = 'idle';
  state.productFill.error = '';
  state.productFill.summary = '输入商品 ID 后自动识别所属店铺并覆盖当前模板。';
  renderProductFillState();

  window.requestAnimationFrame(() => {
    if (dom.productFillIdInput?.disabled) {
      return;
    }

    dom.productFillIdInput.focus();
    dom.productFillIdInput.select();
  });
}

function closeProductFillModal() {
  if (state.productFill.status === 'loading') {
    return;
  }

  resetProductFillState();
}

function renderProductFillState() {
  if (!dom.openProductFillBtn || !dom.productFillModal) {
    return;
  }

  const available = canUseProductFill();
  const isLoading = state.productFill.status === 'loading';

  dom.openProductFillBtn.disabled = !available;
  dom.productFillModal.hidden = !state.productFill.isOpen;
  dom.productFillIdInput.disabled = isLoading || !available;
  dom.productFillConfirmBtn.disabled = isLoading || !available;
  dom.closeProductFillBtn.disabled = isLoading;
  dom.productFillConfirmBtn.textContent = isLoading ? '填充中...' : '开始填充';
  dom.productFillSummary.textContent = state.productFill.summary || '输入商品 ID 后自动识别所属店铺并覆盖当前模板。';
  dom.productFillError.hidden = !state.productFill.error;
  dom.productFillError.textContent = state.productFill.error || '';

  if (!isLoading && dom.productFillIdInput.value !== state.productFill.productId) {
    dom.productFillIdInput.value = state.productFill.productId;
  }
}

function handleProductFillIdInput() {
  state.productFill.productId = String(dom.productFillIdInput?.value || '').trim();
  if (!state.productFill.error) {
    return;
  }

  state.productFill.error = '';
  renderProductFillState();
}

async function handleChangePasswordSubmit(event) {
  event.preventDefault();

  if (!state.bridge?.auth || !state.auth.user) {
    return;
  }

  clearChangePasswordFeedback();

  const currentPassword = dom.currentPasswordInput.value;
  const newPassword = dom.newPasswordInput.value;
  const confirmPassword = dom.confirmPasswordInput.value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    dom.changePasswordError.hidden = false;
    dom.changePasswordError.textContent = '请完整填写当前密码、新密码和确认密码。';
    return;
  }

  if (newPassword !== confirmPassword) {
    dom.changePasswordError.hidden = false;
    dom.changePasswordError.textContent = '两次输入的新密码不一致。';
    return;
  }

  state.auth.isChangingPassword = true;
  renderChangePasswordState();

  const result = await state.bridge.auth.changePassword({
    user: getUsername(state.auth.user),
    currentPassword,
    newPassword
  });

  state.auth.isChangingPassword = false;
  renderChangePasswordState();

  if (!result.ok) {
    if (result.error?.code === 'AUTH_EXPIRED') {
      handleSessionExpired(result.error.message || '登录已失效，请重新登录');
      return;
    }

    dom.changePasswordError.hidden = false;
    dom.changePasswordError.textContent = result.error?.message || '修改密码失败，请稍后重试。';
    return;
  }

  dom.changePasswordForm.reset();
  dom.changePasswordSuccess.hidden = false;
  dom.changePasswordSuccess.textContent = result.message || '密码修改成功。';
}

async function handleProductFillSubmit(event) {
  event.preventDefault();

  if (!canUseProductFill()) {
    return;
  }

  const productId = String(dom.productFillIdInput?.value || '').trim();
  state.productFill.productId = productId;

  if (!productId) {
    state.productFill.status = 'error';
    state.productFill.error = '请输入商品ID后再执行填充。';
    state.productFill.summary = '当前模板尚未改动。';
    renderProductFillState();
    return;
  }

  state.productFill.status = 'loading';
  state.productFill.error = '';
  state.productFill.summary = `正在识别商品 ${productId} 的所属店铺并读取详情...`;
  renderProductFillState();

  const result = await fillCurrentTemplateFromProductId(productId);
  if (!result.ok) {
    if (result.error?.code === 'AUTH_EXPIRED') {
      handleSessionExpired(result.error.message || '登录已失效，请重新登录');
      return;
    }

    state.productFill.status = 'error';
    state.productFill.error = result.error?.message || '按商品ID填充失败，请稍后重试。';
    state.productFill.summary = '本次填充未完成，当前模板中的类目、标题、商品属性、主图、详情图和 SKU 保持不变。';
    renderProductFillState();
    pushLocalLog('error', `按商品ID填充失败：${state.productFill.error}`);
    return;
  }

  pushLocalLog('info', result.logMessage || result.summary);
  resetProductFillState();
}

async function fillCurrentTemplateFromProductId(productId) {
  const currentFormData = serializeForm();
  const detailResult = await state.bridge.auth.getProductFullDetail({
    productId
  });
  if (!detailResult.ok) {
    return detailResult;
  }

  const resolvedShopCode = String(detailResult.resolvedShop?.shopCode || detailResult.shopCode || '').trim();
  if (!resolvedShopCode) {
    return createProductFillFailure('未识别到该商品所属店铺，无法自动填充。', 'SHOP_NOT_RESOLVED');
  }

  const resolvedShopLabel = formatShopLabel({
    shopCode: resolvedShopCode,
    shopName: detailResult.resolvedShop?.shopName || ''
  });
  const previousSelectedShopCode = String(state.shop.selected?.shopCode || '').trim();
  const shopBindResult = await applySelectedShopByCode(resolvedShopCode, {
    reason: 'product-fill',
    autoSave: false,
    log: false,
    closePicker: false,
    focusOverview: false,
    hydrateAttributes: false,
    preserveProductFillState: true
  });
  if (!shopBindResult.ok) {
    return createProductFillFailure(shopBindResult.error?.message || '识别所属店铺后自动绑定失败，请稍后重试。', shopBindResult.error?.code || 'SHOP_BIND_FAILED');
  }

  state.productFill.summary = previousSelectedShopCode && previousSelectedShopCode !== resolvedShopCode
    ? `已识别所属店铺《${resolvedShopLabel}》，正在切换店铺并解析类目...`
    : `已识别所属店铺《${resolvedShopLabel}》，正在解析类目...`;
  renderProductFillState();

  const categoryPath = normalizeFilledCategoryPath(detailResult.categoryPath);
  if (!categoryPath) {
    return createProductFillFailure('该商品未返回可用的类目信息，无法自动填充。', 'CATEGORY_PATH_MISSING');
  }

  const resolvedSelection = await resolveCategorySelectionFromPath({
    shopCode: resolvedShopCode,
    pathHints: splitCategoryPath(categoryPath)
  });

  if (!resolvedSelection?.leafId) {
    return createProductFillFailure(`店铺《${resolvedShopLabel}》下无法解析该商品类目，请确认商品类目是否可发布。`, 'CATEGORY_NOT_RESOLVED');
  }

  const attributeResult = await state.bridge.auth.listCategoryAttributes({
    shopCode: resolvedShopCode,
    catId: resolvedSelection.leafId,
    force: true
  });

  if (!attributeResult.ok) {
    return createProductFillFailure(attributeResult.error?.message || '商品属性加载失败，请稍后重试。', attributeResult.error?.code || 'ATTRIBUTE_LOAD_FAILED');
  }

  let stagedMainGalleryRefs = [];
  let mainGalleryApplied = false;
  let mainGalleryNote = '接口未返回主图，已保留当前主图。';
  let mainGalleryCount = 0;
  let stagedDetailGalleryRefs = [];
  let detailGalleryApplied = false;
  let detailGalleryNote = '接口未返回详情图，已保留当前详情图。';
  let detailGalleryCount = 0;
  let stagedSkuThumbRefs = [];
  let skuRowsApplied = false;
  let skuThumbNote = 'SKU图已保留当前内容。';
  let skuThumbImportedCount = 0;
  const detailSkuRows = buildSkuRowsFromProductDetail(detailResult.skus);
  const shouldReplaceSkuRows = detailSkuRows.length > 0;
  const carouselImages = Array.isArray(detailResult.carouselImages)
    ? detailResult.carouselImages.slice(0, ASSET_LAYOUT.mainGallery.max)
    : [];
  const detailImages = Array.isArray(detailResult.detailImages)
    ? detailResult.detailImages.slice(0, ASSET_LAYOUT.detailGallery.max)
    : [];

  if (carouselImages.length && state.bridge?.asset?.importRemote && state.currentTemplateId) {
    state.productFill.summary = `已解析类目，正在下载商品 ${productId} 的轮播主图...`;
    renderProductFillState();
    try {
      stagedMainGalleryRefs = await state.bridge.asset.importRemote({
        templateId: state.currentTemplateId,
        zone: 'mainGallery',
        slotIndex: 0,
        urls: carouselImages,
        maxCount: ASSET_LAYOUT.mainGallery.max
      });
      mainGalleryCount = Array.isArray(stagedMainGalleryRefs) ? stagedMainGalleryRefs.length : 0;
      mainGalleryNote = mainGalleryCount
        ? `主图已覆盖 ${mainGalleryCount} 张。`
        : '接口未返回可导入的主图，已保留当前主图。';
    } catch (error) {
      mainGalleryNote = `${error instanceof Error ? error.message : '主图下载失败'}，已保留当前主图。`;
      stagedMainGalleryRefs = [];
      mainGalleryCount = 0;
    }
  }

  if (detailImages.length && state.bridge?.asset?.importRemote && state.currentTemplateId) {
    state.productFill.summary = `已下载主图，正在下载商品 ${productId} 的详情图...`;
    renderProductFillState();
    try {
      stagedDetailGalleryRefs = await state.bridge.asset.importRemote({
        templateId: state.currentTemplateId,
        zone: 'detailGallery',
        slotIndex: 0,
        urls: detailImages,
        maxCount: ASSET_LAYOUT.detailGallery.max
      });
      detailGalleryCount = Array.isArray(stagedDetailGalleryRefs) ? stagedDetailGalleryRefs.length : 0;
      detailGalleryNote = detailGalleryCount
        ? `详情图已覆盖 ${detailGalleryCount} 张。`
        : '接口未返回可导入的详情图，已保留当前详情图。';
    } catch (error) {
      detailGalleryNote = `${error instanceof Error ? error.message : '详情图下载失败'}，已保留当前详情图。`;
      stagedDetailGalleryRefs = [];
      detailGalleryCount = 0;
    }
  }

  if (shouldReplaceSkuRows) {
    state.productFill.summary = `已解析类目，正在下载商品 ${productId} 的 SKU 图片...`;
    renderProductFillState();
    try {
      const stagedSkuResult = await stageSkuThumbRefsForRows(detailSkuRows);
      stagedSkuThumbRefs = stagedSkuResult.refs;
      skuThumbImportedCount = stagedSkuResult.importedCount;
      skuThumbNote = stagedSkuResult.summary;
    } catch (error) {
      skuThumbNote = `${error instanceof Error ? error.message : 'SKU图下载失败'}，本次仍会继续填充SKU文本信息。`;
      stagedSkuThumbRefs = [];
      skuThumbImportedCount = 0;
    }
  } else {
    skuThumbNote = '接口未返回SKU，已保留当前SKU与SKU图。';
  }

  try {
    state.productFill.summary = `已获取商品 ${productId} 数据，正在回填当前模板...`;
    renderProductFillState();

    const formBuildResult = buildProductFillFormData({
      currentFormData,
      detail: detailResult,
      selection: resolvedSelection,
      schema: attributeResult.attributes,
      skuRows: detailSkuRows,
      shouldReplaceSkuRows
    });

    if (shouldReplaceSkuRows) {
      await replaceSkuRowsWithRefs(formBuildResult.skuRows, stagedSkuThumbRefs);
      skuRowsApplied = true;
    }

    applyProductFillFormData({
      formData: formBuildResult.formData,
      selection: resolvedSelection,
      schema: attributeResult.attributes,
      categoryPath
    });
    await hydrateSkuSpecOptionsFromCurrentForm({
      force: true,
      formData: formBuildResult.formData
    });
    syncSkuSpecSelectionsToForm(state.skuSpec.selectedSlots);

    if (stagedMainGalleryRefs.length) {
      await replaceMainGalleryRefs(stagedMainGalleryRefs);
      mainGalleryApplied = true;
    }

    if (stagedDetailGalleryRefs.length) {
      await replaceDetailGalleryRefs(stagedDetailGalleryRefs);
      detailGalleryApplied = true;
    }

    await saveCurrentTemplate({ silent: true });

    const summary = buildProductFillSummary({
      productId,
      shopLabel: resolvedShopLabel,
      filledCount: formBuildResult.filledCount,
      skippedCount: formBuildResult.skippedCount,
      mainGalleryNote,
      detailGalleryNote,
      skuCount: formBuildResult.skuCount,
      skuNote: skuThumbNote
    });

    return {
      ok: true,
      summary,
      logMessage: `商品 ${productId} 已识别所属店铺《${resolvedShopLabel}》并完成填充：已填充属性 ${formBuildResult.filledCount} 项，跳过 ${formBuildResult.skippedCount} 项，SKU ${formBuildResult.skuCount} 行，导入SKU图 ${skuThumbImportedCount} 张，${mainGalleryNote} ${detailGalleryNote} ${skuThumbNote}`
    };
  } catch (error) {
    if (stagedMainGalleryRefs.length && !mainGalleryApplied) {
      await cleanupAssetRefs(stagedMainGalleryRefs);
    }
    if (stagedDetailGalleryRefs.length && !detailGalleryApplied) {
      await cleanupAssetRefs(stagedDetailGalleryRefs);
    }
    if (stagedSkuThumbRefs.length && !skuRowsApplied) {
      await cleanupAssetRefs(stagedSkuThumbRefs);
    }

    return createProductFillFailure(
      error instanceof Error ? error.message : '按商品ID填充失败，请稍后重试。',
      'PRODUCT_FILL_FAILED'
    );
  }
}

function createProductFillFailure(message, code = 'PRODUCT_FILL_FAILED') {
  return {
    ok: false,
    error: {
      code,
      message
    }
  };
}

function normalizeFilledCategoryPath(value) {
  return splitCategoryPath(value).join(' > ');
}

function buildSkuRowsFromProductDetail(detailSkus) {
  return (Array.isArray(detailSkus) ? detailSkus : [])
    .map((sku) => ({
      ...normalizeSkuRow({
        specName: sku?.specName,
        groupPrice: sku?.groupPrice,
        singlePrice: sku?.singlePrice,
        stock: sku?.stock,
        weight: sku?.weight
      }),
      skuImageUrl: String(sku?.skuImageUrl || '').trim()
    }))
    .filter((row) => {
      return SKU_FIELD_NAMES.some((fieldName) => String(row[fieldName] || '').trim() !== '');
    });
}

function buildSkuSpecSelectionsFromProductDetail(detail) {
  const dimensions = Array.isArray(detail?.specDimensions) ? detail.specDimensions : [];
  return normalizeSkuSpecSelections(dimensions.map((item) => {
    return {
      id: String(item?.id || '').trim(),
      label: String(item?.label || '').trim()
    };
  }).slice(0, 2));
}

function buildSkuSpecValueListsFromProductDetail(detail) {
  const selections = buildSkuSpecSelectionsFromProductDetail(detail);
  const valueBuckets = [new Set(), new Set()];

  (Array.isArray(detail?.skus) ? detail.skus : []).forEach((sku) => {
    (Array.isArray(sku?.specItems) ? sku.specItems : []).forEach((item) => {
      const specLabel = String(item?.parentName || '').trim();
      const specValue = String(item?.specName || '').trim();
      if (!specLabel || !specValue) {
        return;
      }

      const slotIndex = selections.findIndex((selection) => selection.label === specLabel || selection.id === String(item?.parentId || '').trim());
      if (slotIndex !== -1) {
        valueBuckets[slotIndex].add(specValue);
      }
    });
  });

  return normalizeSkuSpecValueLists(valueBuckets.map((bucket) => Array.from(bucket)));
}

async function stageSkuThumbRefsForRows(rows) {
  const refs = new Array(rows.length).fill(null);
  let importedCount = 0;

  if (!state.bridge?.asset?.importRemote || !state.currentTemplateId) {
    return {
      refs,
      importedCount,
      summary: '当前环境不支持自动导入SKU图。'
    };
  }

  for (let index = 0; index < rows.length; index += 1) {
    const sourceSku = Array.isArray(rows) ? rows[index] : null;
    const imageUrl = String(sourceSku?.skuImageUrl || '').trim();
    if (!imageUrl) {
      continue;
    }

    const importedRefs = await state.bridge.asset.importRemote({
      templateId: state.currentTemplateId,
      zone: 'skuThumbs',
      slotIndex: index,
      urls: [imageUrl],
      maxCount: 1
    });

    if (Array.isArray(importedRefs) && importedRefs[0]) {
      refs[index] = importedRefs[0];
      importedCount += 1;
    }
  }

  return {
    refs,
    importedCount,
    summary: importedCount > 0 ? `SKU图已导入 ${importedCount} 张。` : '接口未返回可导入的SKU图。'
  };
}

function buildProductFillFormData({ currentFormData, detail, selection, schema, skuRows, shouldReplaceSkuRows }) {
  const shouldReplaceAttributes = Array.isArray(detail?.attributes) && detail.attributes.length > 0;
  const nextFormData = applySelectedShopToFormData(stripFormData({
    ...currentFormData
  }, {
    removeDynamicAttributes: shouldReplaceAttributes,
    removeSkuRows: shouldReplaceSkuRows
  }));

  assignFormDataValue(nextFormData, CATEGORY_FIELD_IDS.display, 'categoryData', normalizeFilledCategoryPath(detail.categoryPath));
  assignFormDataValue(nextFormData, 'pddForm_categoryMappingId', 'categoryMappingId', '');
  assignFormDataValue(nextFormData, CATEGORY_FIELD_IDS.level1, 'categoryId1', selection.level1Id || '');
  assignFormDataValue(nextFormData, CATEGORY_FIELD_IDS.level2, 'categoryId2', selection.level2Id || '');
  assignFormDataValue(nextFormData, CATEGORY_FIELD_IDS.level3, 'categoryId3', selection.level3Id || '');
  assignFormDataValue(nextFormData, CATEGORY_FIELD_IDS.leaf, 'leafCategoryId', selection.leafId || '');
  assignFormDataValue(
    nextFormData,
    'pddForm_goodsName',
    'goodsName',
    truncateByControlLimit(
      detail.productName || currentFormData.pddForm_goodsName || currentFormData.goodsName || '',
      'pddForm_goodsName'
    )
  );
  assignFormDataValue(
    nextFormData,
    'pddForm_marketPrice',
    'marketPrice',
    detail.marketPrice || currentFormData.pddForm_marketPrice || currentFormData.marketPrice || ''
  );
  assignFormDataValue(
    nextFormData,
    'pddForm_styleCode',
    'styleCode',
    detail.twoPiecesDiscount || currentFormData.pddForm_styleCode || currentFormData.styleCode || ''
  );

  const attributeStats = applyDetailAttributesToFormData({
    formData: nextFormData,
    detailAttributes: detail.attributes,
    schema
  });

  const normalizedSkuRows = shouldReplaceSkuRows ? buildSkuRowsFromProductDetail(detail.skus || skuRows) : getCurrentSkuRows();
  if (shouldReplaceSkuRows) {
    assignSkuRowsToFormData(nextFormData, normalizedSkuRows);
  }

  const nextSkuSpecSelections = buildSkuSpecSelectionsFromProductDetail(detail);
  if (nextSkuSpecSelections.some((item) => item.id || item.label)) {
    assignSkuSpecSelectionsToFormData(nextFormData, nextSkuSpecSelections);
    assignSkuSpecValueListsToFormData(nextFormData, buildSkuSpecValueListsFromProductDetail(detail));
  }

  return {
    formData: nextFormData,
    filledCount: attributeStats.filledCount,
    skippedCount: attributeStats.skippedCount,
    skuRows: normalizedSkuRows,
    skuCount: normalizedSkuRows.length
  };
}

function assignSkuRowsToFormData(formData, skuRows) {
  (Array.isArray(skuRows) ? skuRows : []).forEach((row, index) => {
    SKU_FIELD_NAMES.forEach((fieldName) => {
      formData[`goodsSkuDetail[${index}][${fieldName}]`] = String(row?.[fieldName] || '').trim();
    });
  });
}

function assignFormDataValue(formData, primaryKey, secondaryKey, value) {
  if (primaryKey) {
    formData[primaryKey] = value;
  }

  if (secondaryKey) {
    formData[secondaryKey] = value;
  }
}

function truncateByControlLimit(value, controlId, fallbackMaxLength = 0) {
  const normalizedValue = String(value || '').trim();
  const maxLength = resolveControlMaxLength(controlId, fallbackMaxLength);
  return maxLength > 0 ? normalizedValue.slice(0, maxLength) : normalizedValue;
}

function resolveControlMaxLength(controlId, fallbackMaxLength = 0) {
  const control = dom.form?.querySelector(`#${controlId}`);
  const controlMaxLength = Number(control?.maxLength);
  if (Number.isFinite(controlMaxLength) && controlMaxLength > 0) {
    return controlMaxLength;
  }

  const normalizedFallback = Number(fallbackMaxLength);
  return Number.isFinite(normalizedFallback) && normalizedFallback > 0 ? normalizedFallback : 0;
}

function applyDetailAttributesToFormData({ formData, detailAttributes, schema }) {
  const schemaByRefPid = new Map((Array.isArray(schema) ? schema : []).map((item) => [String(item.refPid || '').trim(), item]));
  let filledCount = 0;
  let skippedCount = 0;

  (Array.isArray(detailAttributes) ? detailAttributes : []).forEach((detailAttribute) => {
    const refPid = String(detailAttribute?.refPid || '').trim();
    const schemaAttribute = schemaByRefPid.get(refPid);
    if (!schemaAttribute) {
      skippedCount += 1;
      return;
    }

    const value = resolveProductAttributeFillValue(detailAttribute, schemaAttribute);
    if (!value) {
      skippedCount += 1;
      return;
    }

    assignFormDataValue(
      formData,
      buildAttributeControlId(refPid),
      buildAttributeControlName(refPid),
      value
    );
    filledCount += 1;
  });

  return {
    filledCount,
    skippedCount
  };
}

function resolveProductAttributeFillValue(detailAttribute, schemaAttribute) {
  const values = Array.isArray(detailAttribute?.values) ? detailAttribute.values : [];
  if (!values.length) {
    return '';
  }

  if (schemaAttribute.controlType === 1 && Array.isArray(schemaAttribute.options) && schemaAttribute.options.length) {
    const allowedLabels = new Set(schemaAttribute.options.map((option) => option.label));
    const matchedValue = values
      .map((item) => String(item.rawValue || item.value || '').trim())
      .find((label) => label && allowedLabels.has(label));
    return matchedValue || '';
  }

  const joinedValue = values
    .map((item) => String(item.rawValue || item.value || '').trim())
    .filter(Boolean)
    .join('，');

  return truncateByControlLimit(joinedValue, buildAttributeControlId(schemaAttribute.refPid), schemaAttribute.maxValue);
}

function applyProductFillFormData({ formData, selection, schema, categoryPath }) {
  state.category.pathHints = splitCategoryPath(categoryPath);
  state.category.draftLevel1Id = selection.level1Id || '';
  state.category.draftLevel2Id = selection.level2Id || '';
  state.category.draftLevel3Id = selection.level3Id || '';
  state.category.notice = '';
  syncCategorySelectionMeta(selection);
  state.attribute.status = 'ready';
  state.attribute.error = '';
  state.attribute.shopCode = String(state.shop.selected?.shopCode || '').trim();
  state.attribute.categoryId = selection.leafId || '';
  state.attribute.schema = Array.isArray(schema) ? schema : [];
  state.attribute.message = state.attribute.schema.length
    ? `已加载 ${state.attribute.schema.length} 个商品属性，可根据当前三级类目手动调整。`
    : '当前三级类目暂无可编辑商品属性。';
  renderAttributeState();
  fillForm(formData);
  syncSelectedShopIntoForm();
}

async function replaceSkuRowsWithRefs(rows, nextRefs) {
  const previousRefs = getCurrentSkuThumbRefs();
  renderSkuRows(rows, {
    imageRefs: nextRefs
  });
  await cleanupAssetRefs(previousRefs);
}

async function replaceDetailGalleryRefs(nextRefs) {
  const previousRefs = getArrayZoneRefs('detailGallery');
  renderDynamicArrayZone('detailGallery', nextRefs);
  await cleanupAssetRefs(previousRefs);
}

async function replaceMainGalleryRefs(nextRefs) {
  const previousRefs = getArrayZoneRefs('mainGallery');
  renderDynamicArrayZone('mainGallery', nextRefs);
  await cleanupAssetRefs(previousRefs);
}

async function cleanupAssetRefs(refs) {
  const cleanupTargets = Array.isArray(refs) ? refs.filter(Boolean) : [];
  for (const ref of cleanupTargets) {
    if (ref.temporary && ref.fileUrl) {
      URL.revokeObjectURL(ref.fileUrl);
      continue;
    }

    if (state.bridge?.asset && !ref.temporary) {
      try {
        await state.bridge.asset.remove({ ref: stripTransientFields(ref) });
      } catch (error) {
        console.warn('清理旧素材失败', error);
      }
    }
  }
}

function buildProductFillSummary({
  productId,
  shopLabel = '',
  filledCount,
  skippedCount,
  mainGalleryNote,
  detailGalleryNote,
  skuCount = 0,
  skuNote = ''
}) {
  const parts = [
    shopLabel ? `商品 ${productId} 已识别所属店铺《${shopLabel}》并完成填充` : `商品 ${productId} 已完成填充`,
    `SKU ${skuCount} 行`
  ];

  if (filledCount > 0) {
    parts.push(`属性已填充 ${filledCount} 项`);
  }

  if (skippedCount > 0) {
    parts.push(`跳过 ${skippedCount} 项`);
  }

  if (mainGalleryNote) {
    parts.push(mainGalleryNote.replace(/[。]+$/g, ''));
  }

  if (detailGalleryNote) {
    parts.push(detailGalleryNote.replace(/[。]+$/g, ''));
  }

  if (skuNote) {
    parts.push(skuNote.replace(/[。]+$/g, ''));
  }

  return parts.join('，') + '。';
}

async function handleSkuTableClick(event) {
  if (!event.target) {
    return;
  }
}

function handleSkuTableInput(event) {
  if (!event.target) {
    return;
  }
}

function getUsername(user) {
  return user?.username || user?.user || '';
}

function getDisplayName(user) {
  return user?.display_name || user?.name || getUsername(user) || '未命名账号';
}

function formatShopLabel(shop, { emptyLabel = '未选择' } = {}) {
  const normalizedShop = shop && typeof shop === 'object' ? shop : null;
  if (!normalizedShop?.shopCode) {
    return emptyLabel;
  }

  const shopName = normalizedShop.shopName || '未命名店铺';
  return `${shopName}（${normalizedShop.shopCode}）`;
}

function getCurrentShopLabel({ emptyLabel = '未选择' } = {}) {
  return formatShopLabel(state.shop.selected, { emptyLabel });
}

function renderSelectedShop() {
  const emptyLabel = state.auth.user ? '待选择' : '未选择';
  if (dom.accountCurrentShop) {
    dom.accountCurrentShop.textContent = getCurrentShopLabel({ emptyLabel: state.auth.user ? '待选择' : '-' });
  }

  if (dom.shopSelectionCurrentShop) {
    dom.shopSelectionCurrentShop.textContent = `当前店铺：${getCurrentShopLabel({ emptyLabel: state.auth.user ? '尚未确认' : '-' })}`;
  }

  if (dom.appHeaderCurrentShop) {
    dom.appHeaderCurrentShop.textContent = getCurrentShopLabel({ emptyLabel });
  }

  if (dom.openShopPickerBtn) {
    dom.openShopPickerBtn.disabled = !state.auth.user;
  }

  if (dom.openCategoryPickerBtn) {
    dom.openCategoryPickerBtn.disabled = !state.auth.user || !state.shop.selected;
  }

  renderProductFillState();
  renderAttributeState();
  renderSkuSpecState();
  renderAppShell();
  renderWorkspaceMeta();
}

function renderAttributeState() {
  if (!dom.goodsAttributeContainer || !dom.goodsAttributeStatus || !dom.goodsAttributeError) {
    return;
  }

  const status = state.attribute.status || 'idle';
  const hasSelectedShop = Boolean(state.shop.selected?.shopCode);
  const leafCategoryId = getCurrentLeafCategoryId();

  let fallbackMessage;
  if (!state.auth.user) {
    fallbackMessage = '请先登录后再加载商品属性。';
  } else if (!hasSelectedShop) {
    fallbackMessage = '请先选择店铺，再加载商品属性。';
  } else if (!leafCategoryId) {
    fallbackMessage = '请先选择三级类目。';
  } else {
    fallbackMessage = '当前三级类目暂无可编辑商品属性。';
  }

  dom.goodsAttributeStatus.textContent = state.attribute.message || fallbackMessage;
  dom.goodsAttributeError.hidden = !state.attribute.error;
  dom.goodsAttributeError.textContent = state.attribute.error || '';

  if (status === 'loading') {
    dom.goodsAttributeContainer.innerHTML = '<div class="empty-state">正在加载当前三级类目的商品属性...</div>';
    renderWorkspaceMeta();
    return;
  }

  if (status === 'error') {
    dom.goodsAttributeContainer.innerHTML = '<div class="empty-state">商品属性加载失败，请重新选择类目或稍后重试。</div>';
    renderWorkspaceMeta();
    return;
  }

  if (!state.attribute.schema.length) {
    dom.goodsAttributeContainer.innerHTML = `<div class="empty-state">${escapeHtml(fallbackMessage)}</div>`;
    renderWorkspaceMeta();
    return;
  }

  dom.goodsAttributeContainer.innerHTML = state.attribute.schema.map((attribute) => {
    const controlId = buildAttributeControlId(attribute.refPid);
    const controlName = buildAttributeControlName(attribute.refPid);
    const helperText = [attribute.topTip, attribute.bottomTip].filter(Boolean).join(' ');
    const metaText = [
      attribute.required ? '必填' : '',
      attribute.important ? '重点' : '',
      attribute.valueUnit ? `单位：${attribute.valueUnit}` : ''
    ].filter(Boolean).join(' · ');

    const controlMarkup = attribute.controlType === 1 && attribute.options.length
      ? [
          `<select id="${escapeHtml(controlId)}" name="${escapeHtml(controlName)}">`,
          `<option value="">${escapeHtml(`请选择${attribute.label}`)}</option>`,
          ...attribute.options.map((option) => {
            return `<option value="${escapeHtml(option.label)}">${escapeHtml(option.label)}</option>`;
          }),
          '</select>'
        ].join('')
      : `<input id="${escapeHtml(controlId)}" name="${escapeHtml(controlName)}" type="text" placeholder="${escapeHtml(resolveAttributePlaceholder(attribute))}"${buildAttributeInputMaxLength(attribute)}>`;

    return [
      '<label class="attribute-card">',
      `<span class="attribute-card__label">${escapeHtml(attribute.label)}</span>`,
      metaText ? `<span class="attribute-card__meta">${escapeHtml(metaText)}</span>` : '',
      controlMarkup,
      helperText ? `<span class="attribute-card__tip">${escapeHtml(helperText)}</span>` : '',
      '</label>'
    ].join('');
  }).join('');

  renderWorkspaceMeta();
}

function getSkuSpecFallbackMessage() {
  const hasSelectedShop = Boolean(state.shop.selected?.shopCode);
  const leafCategoryId = getCurrentLeafCategoryId();

  if (!state.auth.user) {
    return '请先登录后再加载可选规格。';
  }

  if (!hasSelectedShop) {
    return '请先选择店铺，再加载可选规格。';
  }

  if (!leafCategoryId) {
    return '请先选择三级类目，再加载可选规格。';
  }

  return '当前三级类目暂无可选规格。';
}

async function hydrateSkuSpecOptionsFromCurrentForm({ force = false, formData = null } = {}) {
  const selectedShopCode = String(state.shop.selected?.shopCode || '').trim();
  const leafCategoryId = getCurrentLeafCategoryId(formData);

  if (!state.bridge?.auth || !state.auth.user) {
    resetSkuSpecState({ preserveSelection: true });
    return;
  }

  if (!selectedShopCode || !leafCategoryId) {
    resetSkuSpecState({ preserveSelection: true });
    return;
  }

  const nextConfig = normalizeSkuSpecConfigFromForm(formData, state.skuSpec.options);

  if (!force
    && state.skuSpec.status === 'ready'
    && state.skuSpec.shopCode === selectedShopCode
    && state.skuSpec.categoryId === leafCategoryId
    && state.skuSpec.options.length) {
    state.skuSpec.selectedSlots = nextConfig.selectedSlots;
    state.skuSpec.valueLists = nextConfig.valueLists;
    state.skuSpec.message = `当前类目可选 ${state.skuSpec.options.length} 个规格，最多选择 2 个且不可重复。`;
    renderSkuSpecState();
    return;
  }

  state.skuSpec.status = 'loading';
  state.skuSpec.error = '';
  state.skuSpec.shopCode = selectedShopCode;
  state.skuSpec.categoryId = leafCategoryId;
  renderSkuSpecState();

  const result = await state.bridge.auth.listCategorySkuSpecs({
    shopCode: selectedShopCode,
    catId: leafCategoryId,
    force
  });

  if (selectedShopCode !== String(state.shop.selected?.shopCode || '').trim() || leafCategoryId !== getCurrentLeafCategoryId()) {
    return;
  }

  if (!result.ok) {
    state.skuSpec.status = 'error';
    state.skuSpec.error = result.error?.message || '商品规格加载失败，请稍后重试。';
    state.skuSpec.options = [];
    state.skuSpec.message = '';
    renderSkuSpecState();
    return;
  }

  state.skuSpec.status = 'ready';
  state.skuSpec.error = '';
  state.skuSpec.options = Array.isArray(result.specOptions) ? result.specOptions : [];
  const resolvedConfig = normalizeSkuSpecConfigFromForm(formData, state.skuSpec.options);
  state.skuSpec.selectedSlots = resolvedConfig.selectedSlots;
  state.skuSpec.valueLists = resolvedConfig.valueLists;
  state.skuSpec.message = state.skuSpec.options.length
    ? `当前类目可选 ${state.skuSpec.options.length} 个规格，最多选择 2 个且不可重复。`
    : getSkuSpecFallbackMessage();
  renderSkuSpecState();
}

function applyRememberedCredentials({ force = false, focusPassword = false } = {}) {
  if (!dom.loginUsernameInput) {
    return;
  }

  const rememberedUsername = String(state.auth.lastUsername || '').trim();
  const rememberedPassword = state.auth.rememberPassword ? String(state.auth.savedPassword || '') : '';

  if (force) {
    dom.loginUsernameInput.value = rememberedUsername;
  } else if (!dom.loginUsernameInput.value.trim() && rememberedUsername) {
    dom.loginUsernameInput.value = rememberedUsername;
  }

  if (dom.loginRememberPasswordInput) {
    dom.loginRememberPasswordInput.checked = Boolean(state.auth.rememberPassword);
  }

  if (dom.loginPasswordInput && (force || !dom.loginPasswordInput.value)) {
    dom.loginPasswordInput.value = rememberedPassword;
  }

  if (!focusPassword || !dom.loginPasswordInput || dom.authGate.hidden) {
    return;
  }

  window.requestAnimationFrame(() => {
    if (dom.loginPasswordInput.disabled) {
      return;
    }

    dom.loginPasswordInput.focus();
  });
}

function restoreLoggedOutLoginControls() {
  if (!state.bridge?.auth || state.auth.status !== 'unauthenticated') {
    return;
  }

  dom.loginUsernameInput.disabled = false;
  dom.loginPasswordInput.disabled = false;
  if (dom.loginRememberPasswordInput) {
    dom.loginRememberPasswordInput.disabled = false;
  }
  dom.loginUsernameInput.readOnly = false;
  dom.loginPasswordInput.readOnly = false;
  dom.loginSubmitBtn.disabled = false;
  dom.loginSubmitBtn.textContent = '登录并进入工作台';
}

function resetShopState() {
  state.shop = buildInitialShopState();
  state.attribute = buildInitialAttributeState();
  state.skuSpec = buildInitialSkuSpecState();
  state.productFill = buildInitialProductFillState();
  renderSelectedShop();
  renderShopPicker();
  renderSalesOverviewPage();
  renderProductFillState();
  renderSkuSpecState();
}

function resetSalesOverviewState() {
  stopSalesOverviewFetch({ preserveStatus: false });
  state.salesOverview = buildInitialSalesOverviewState();
  renderSalesOverviewPage();
}

function resetTemplateExportState() {
  state.templateExport = buildInitialTemplateExportState();
  renderTemplateExport();
}

function resolveTemplateShopCodePreference() {
  const candidates = [
    dom.form?.querySelector('#pddForm_firstShopId')?.value,
    dom.form?.querySelector('[name="firstShopId"]')?.value,
    state.currentTemplate?.formData?.pddForm_firstShopId,
    state.currentTemplate?.formData?.firstShopId
  ];

  return candidates
    .map((value) => String(value || '').trim())
    .find(Boolean) || '';
}

function buildShopSelectionLogMessage(shop, reason = 'manual') {
  const shopLabel = formatShopLabel(shop);
  if (reason === 'template') {
    return `已根据当前模板自动绑定店铺《${shopLabel}》`;
  }

  if (reason === 'product-fill') {
    return `已根据商品所属店铺自动切换为《${shopLabel}》`;
  }

  return `当前操作店铺已切换为《${shopLabel}》`;
}

async function applySelectedShopByCode(shopCode, options = {}) {
  if (!state.auth.user) {
    return createProductFillFailure('登录已失效，请重新登录', 'AUTH_EXPIRED');
  }

  const normalizedShopCode = String(shopCode || '').trim();
  if (!normalizedShopCode) {
    return createProductFillFailure('未提供可绑定的店铺编码。', 'SHOP_CODE_REQUIRED');
  }

  if ((state.shop.status === 'idle' || state.shop.status === 'error' || !state.shop.available.length) && state.bridge?.auth) {
    await hydrateShopCatalog();
  }

  const selectedShop = state.shop.available.find((shop) => shop.shopCode === normalizedShopCode) || null;
  if (!selectedShop) {
    return createProductFillFailure('未在当前账号可见店铺范围内找到该店铺，请刷新店铺列表后重试。', 'SHOP_NOT_FOUND');
  }

  const {
    reason = 'manual',
    autoSave = true,
    log = true,
    closePicker = false,
    focusOverview = false,
    hydrateAttributes = true,
    preserveProductFillState = false
  } = options;
  const previousSelectedCode = String(state.shop.selected?.shopCode || '').trim();
  const isChanged = previousSelectedCode !== normalizedShopCode;

  state.shop.selected = selectedShop;
  state.shop.draftCode = selectedShop.shopCode;
  if (closePicker) {
    state.shop.isOpen = false;
    state.shop.isRequired = false;
  }

  if (isChanged) {
    resetCategoryState();
    resetAttributeState();
    resetSkuSpecState();
    if (!preserveProductFillState) {
      resetProductFillState();
    }
  }

  syncSelectedShopIntoForm();
  renderSelectedShop();
  renderShopPicker();

  if (focusOverview) {
    setActiveWorkspaceStep('overview', { scroll: false });
  }

  if (hydrateAttributes) {
    await hydrateAttributesFromCurrentForm({
      force: isChanged
    });
  }

  if (isChanged) {
    if (autoSave) {
      scheduleAutoSave();
    }
    if (log) {
      pushLocalLog('info', buildShopSelectionLogMessage(selectedShop, reason));
    }
  }

  return {
    ok: true,
    changed: isChanged,
    shop: selectedShop
  };
}

async function tryAutoBindCurrentTemplateShop({ source = 'template' } = {}) {
  if (!state.auth.user || state.shop.selected?.shopCode) {
    return false;
  }

  const preferredShopCode = resolveTemplateShopCodePreference();
  if (!preferredShopCode) {
    return false;
  }

  const result = await applySelectedShopByCode(preferredShopCode, {
    reason: source,
    autoSave: false,
    log: false,
    closePicker: false,
    focusOverview: false,
    hydrateAttributes: true,
    preserveProductFillState: true
  });

  if (result.ok && result.changed) {
    pushLocalLog('info', buildShopSelectionLogMessage(result.shop, source));
  }

  return Boolean(result.ok);
}

async function handleOpenQuickLogin() {
  if (!state.bridge?.window?.enterQuickLogin) {
    return;
  }
  await state.bridge.window.enterQuickLogin();
}

async function handleOpenShopPicker() {
  if (!state.auth.user) {
    return;
  }

  openShopPicker();

  if (state.shop.status === 'idle' || state.shop.status === 'error') {
    await hydrateShopCatalog();
  }
}

function openShopPicker({ required = false } = {}) {
  state.salesOverview.isOpen = false;
  state.shop.isOpen = true;
  state.shop.isRequired = required || (state.shop.isRequired && !state.shop.selected);
  state.ui.secondaryDrawerPanel = '';
  seedShopDraftSelection();
  renderShopPicker();
  focusShopSearchInput();
}

function closeShopPicker() {
  if (state.shop.isRequired && !state.shop.selected) {
    return;
  }

  state.shop.isOpen = false;
  state.shop.isRequired = false;
  renderShopPicker();
}

async function hydrateShopCatalog({ force = false } = {}) {
  if (!state.bridge?.auth || !state.auth.user) {
    return;
  }

  if (!force && state.shop.status === 'ready' && state.shop.available.length) {
    seedShopDraftSelection();
    renderShopPicker();
    syncSalesOverviewSelectionWithAvailableShops();
    renderSalesOverviewPage();
    return;
  }

  state.shop.status = 'loading';
  state.shop.error = '';
  renderShopPicker();

  const result = await state.bridge.auth.listShops({
    forceRefresh: force
  });
  if (!result.ok) {
    state.shop.status = 'error';
    state.shop.error = result.error?.message || '店铺列表加载失败，请稍后重试。';
    renderShopPicker();
    renderSalesOverviewPage();
    return;
  }

  state.shop.all = Array.isArray(result.shops) ? result.shops : [];
  state.shop.scope = result.scope && typeof result.scope === 'object' ? result.scope : null;
  state.shop.available = state.shop.scope
    ? sortShopsByName(state.shop.all)
    : filterShopsForCurrentUser(state.shop.all, state.auth.user);
  state.shop.status = 'ready';
  state.shop.error = '';
  const previousSelectedCode = state.shop.selected?.shopCode || '';

  if (state.shop.selected) {
    state.shop.selected = state.shop.available.find((shop) => {
      return shop.shopCode === state.shop.selected.shopCode;
    }) || null;
  }

  seedShopDraftSelection();
  syncSalesOverviewSelectionWithAvailableShops();
  renderSelectedShop();
  renderShopPicker();
  renderSalesOverviewPage();
}

function filterShopsForCurrentUser(shops, user) {
  const normalizedShops = sortShopsByName(shops);

  const accessContext = buildShopAccessContext(user);
  if (accessContext.isAdmin) {
    return normalizedShops;
  }

  return normalizedShops.filter((shop) => {
    return matchesShopAccessContext(shop, accessContext);
  });
}

function sortShopsByName(shops) {
  const normalizedShops = Array.isArray(shops) ? shops.slice() : [];
  normalizedShops.sort((left, right) => {
    return String(left.shopName || left.shopCode).localeCompare(String(right.shopName || right.shopCode), 'zh-CN');
  });
  return normalizedShops;
}

function isAdminUser(user) {
  const role = String(user?.role || '').trim().toLowerCase();
  const roleName = String(user?.role_name || user?.roleName || '').trim();
  return role === 'admin' || roleName.includes('管理员');
}

function canViewAllShops(user) {
  return isAdminUser(user) || isFinanceUser(user);
}

function canFilterSalesOverviewByOperator(user) {
  const role = String(user?.role || '').trim().toLowerCase();
  const roleName = String(user?.role_name || user?.roleName || '').trim();
  return role === 'admin' || role === '运营管理' || roleName === '运营管理';
}

function isFinanceUser(user) {
  const role = String(user?.role || '').trim().toLowerCase();
  const roleName = String(user?.role_name || user?.roleName || '').trim();
  return role === 'finance' || role === 'caiwu' || role === '财务' || roleName.includes('财务');
}

function canUseShopQuickLogin(user) {
  return canFilterSalesOverviewByOperator(user) || isFinanceUser(user);
}

function getShopQuickLoginDeniedMessage() {
  return '仅 admin、运营管理和财务角色可使用一键登录';
}

function buildShopAccessContext(user) {
  const context = {
    isAdmin: canViewAllShops(user),
    operatorIds: new Set(),
    operatorNames: new Set(),
    includesManagedOperators: false
  };

  appendOperatorIdentity(context, user);

  const managedOperatorObjects = [
    user?.managed_operators,
    user?.managedOperators,
    user?.managed_operator_profiles,
    user?.managedOperatorProfiles,
    user?.managed_operator_users,
    user?.managedOperatorUsers
  ];

  managedOperatorObjects.forEach((items) => {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((item) => {
      if (!item) {
        return;
      }

      context.includesManagedOperators = true;
      appendOperatorIdentity(context, item);
    });
  });

  [
    user?.managed_operator_ids,
    user?.managedOperatorIds,
    user?.managed_operator_uids,
    user?.managedOperatorUids
  ].forEach((items) => {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((value) => {
      const normalizedValue = String(value || '').trim();
      if (!normalizedValue) {
        return;
      }

      context.includesManagedOperators = true;
      context.operatorIds.add(normalizedValue);
    });
  });

  [
    user?.managed_operator_names,
    user?.managedOperatorNames
  ].forEach((items) => {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((value) => {
      const normalizedValue = String(value || '').trim();
      if (!normalizedValue) {
        return;
      }

      context.includesManagedOperators = true;
      context.operatorNames.add(normalizedValue);
    });
  });

  return context;
}

function appendOperatorIdentity(context, value) {
  if (!context || !value) {
    return;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    [
      value.operator_id,
      value.operatorId,
      value.id,
      value.uid,
      value.user_id,
      value.userId
    ].forEach((candidate) => {
      const normalizedCandidate = String(candidate || '').trim();
      if (normalizedCandidate) {
        context.operatorIds.add(normalizedCandidate);
      }
    });

    [
      value.display_name,
      value.displayName,
      value.name,
      value.operator_name,
      value.operatorName,
      value.currentOperator,
      value.current_operator,
      value.username,
      value.user
    ].forEach((candidate) => {
      const normalizedCandidate = String(candidate || '').trim();
      if (normalizedCandidate) {
        context.operatorNames.add(normalizedCandidate);
      }
    });
  }

  [
    getDisplayName(value),
    getUsername(value)
  ].forEach((candidate) => {
    const normalizedCandidate = String(candidate || '').trim();
    if (normalizedCandidate) {
      context.operatorNames.add(normalizedCandidate);
    }
  });
}

function matchesShopAccessContext(shop, accessContext) {
  if (!shop || !accessContext) {
    return false;
  }

  const shopOperatorIds = [
    shop.currentOperatorId,
    shop.operatorId,
    shop.currentOperatorUid
  ].map((value) => String(value || '').trim()).filter(Boolean);

  if (shopOperatorIds.some((value) => accessContext.operatorIds.has(value))) {
    return true;
  }

  const shopOperatorNames = [
    shop.currentOperator,
    shop.currentOperatorName,
    shop.currentOperatorUsername
  ].map((value) => String(value || '').trim()).filter(Boolean);

  return shopOperatorNames.some((value) => accessContext.operatorNames.has(value));
}

function seedShopDraftSelection() {
  const visibleShopCodes = new Set(state.shop.available.map((shop) => shop.shopCode));
  const preferredCode = resolvePreferredShopCode();

  if (state.shop.selected && visibleShopCodes.has(state.shop.selected.shopCode)) {
    state.shop.draftCode = state.shop.selected.shopCode;
    return;
  }

  if (preferredCode && visibleShopCodes.has(preferredCode)) {
    state.shop.draftCode = preferredCode;
    return;
  }

  state.shop.draftCode = state.shop.available[0]?.shopCode || '';
}

function resolvePreferredShopCode() {
  const candidates = [
    state.shop.selected?.shopCode,
    dom.form?.querySelector('#pddForm_firstShopId')?.value,
    state.currentTemplate?.formData?.pddForm_firstShopId,
    state.currentTemplate?.formData?.firstShopId
  ];

  return candidates
    .map((value) => String(value || '').trim())
    .find(Boolean) || '';
}

function handleShopSearchInput(event) {
  state.shop.search = String(event.target.value || '');
  renderShopPicker();
}

async function handleShopSearchKeyDown(event) {
  if (event.key !== 'Enter' || state.shop.status !== 'ready' || event.currentTarget?.disabled) {
    return;
  }

  const visibleShops = getVisibleShopList();
  if (visibleShops.length !== 1) {
    return;
  }

  const targetShopCode = String(visibleShops[0]?.shopCode || '').trim();
  if (!targetShopCode || isShopQuickLoginPending(targetShopCode)) {
    return;
  }

  event.preventDefault();
  state.shop.draftCode = targetShopCode;
  renderShopPicker();
  await handleQuickLoginShop(targetShopCode);
}

async function handleShopSelectionListClick(event) {
  const quickLoginTrigger = event.target.closest('[data-shop-quick-login-code]');
  if (quickLoginTrigger) {
    await handleQuickLoginShop(quickLoginTrigger.dataset.shopQuickLoginCode || '');
    return;
  }

  const trigger = event.target.closest('[data-shop-select-code]');
  if (!trigger) {
    return;
  }

  state.shop.draftCode = trigger.dataset.shopSelectCode || '';
  renderShopPicker();
}

function isShopQuickLoginPending(shopCode) {
  const normalizedShopCode = String(shopCode || '').trim();
  return state.shop.quickLoginPendingShopCodes.includes(normalizedShopCode);
}

function setShopQuickLoginPending(shopCode, pending) {
  const normalizedShopCode = String(shopCode || '').trim();
  if (!normalizedShopCode) {
    return;
  }

  const currentCodes = new Set(state.shop.quickLoginPendingShopCodes);
  if (pending) {
    currentCodes.add(normalizedShopCode);
  } else {
    currentCodes.delete(normalizedShopCode);
  }

  state.shop.quickLoginPendingShopCodes = Array.from(currentCodes);
}

function renderQuickLoginRelatedViews() {
  renderShopPicker();
  if (state.salesOverview.isOpen) {
    renderSalesOverviewPage();
  }
}

async function handleQuickLoginShop(shopCode) {
  if (!state.bridge?.auth?.quickLoginShop || !state.auth.user) {
    return;
  }

  if (!canUseShopQuickLogin(state.auth.user)) {
    const message = getShopQuickLoginDeniedMessage();
    showAuthNotice(message);
    pushLocalLog('warning', message);
    return;
  }

  const normalizedShopCode = String(shopCode || '').trim();
  if (!normalizedShopCode || isShopQuickLoginPending(normalizedShopCode)) {
    return;
  }

  const targetShop = state.shop.available.find((shop) => shop.shopCode === normalizedShopCode) || null;
  const shopLabel = targetShop?.shopName || normalizedShopCode;

  setShopQuickLoginPending(normalizedShopCode, true);
  renderQuickLoginRelatedViews();

  try {
    const result = await state.bridge.auth.quickLoginShop({
      shopCode: normalizedShopCode
    });

    if (!result?.ok) {
      const message = result?.error?.message || '一键登录失败，请稍后重试。';
      showAuthNotice(message);
      pushLocalLog('error', `店铺《${shopLabel}》一键登录失败：${message}`);
      return;
    }

    const successMessage = result.message || `店铺《${result.shopName || shopLabel}》已打开浏览器并注入最新 cookies`;
    showAuthNotice(successMessage);
    pushLocalLog('info', successMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : '一键登录失败，请稍后重试。';
    showAuthNotice(message);
    pushLocalLog('error', `店铺《${shopLabel}》一键登录失败：${message}`);
  } finally {
    setShopQuickLoginPending(normalizedShopCode, false);
    renderQuickLoginRelatedViews();
  }
}

async function handleConfirmShopSelection() {
  if (!state.shop.draftCode) {
    return;
  }

  const result = await applySelectedShopByCode(state.shop.draftCode, {
    reason: 'manual',
    autoSave: true,
    log: true,
    closePicker: true,
    focusOverview: true,
    hydrateAttributes: true,
    preserveProductFillState: false
  });

  if (!result.ok) {
    showAuthNotice(result.error?.message || '店铺切换失败，请稍后重试。');
  }
}

function syncSelectedShopIntoForm() {
  const selectedShop = state.shop.selected;
  const shopFields = Array.from(dom.form?.querySelectorAll('#pddForm_firstShopId, [name="firstShopId"]') || []);
  if (!selectedShop || !shopFields.length) {
    return;
  }

  shopFields.forEach((field) => {
    field.value = selectedShop.shopCode;
  });
}

function applySelectedShopToFormData(formData) {
  if (!state.shop.selected) {
    return formData;
  }

  return {
    ...formData,
    pddForm_firstShopId: state.shop.selected.shopCode,
    firstShopId: state.shop.selected.shopCode
  };
}

function renderShopPicker() {
  if (!dom.shopSelectionPage) {
    return;
  }

  renderShellState();
  if (state.ui.activeSurface !== 'shops') {
    return;
  }
  dom.shopSearchInput.value = state.shop.search;
  dom.shopSearchInput.disabled = state.shop.status === 'loading';
  dom.shopSelectionRefreshBtn.disabled = state.shop.status === 'loading';
  dom.shopPickerLogoutBtn.disabled = state.shop.status === 'loading';
  dom.shopSelectionConfirmBtn.disabled = state.shop.status !== 'ready' || !state.shop.draftCode;
  dom.shopSelectionConfirmBtn.textContent = state.shop.selected ? '确认切换店铺' : '确认进入工作台';
  dom.shopSelectionBackBtn.hidden = state.shop.isRequired || !state.shop.selected;
  dom.shopSelectionBackBtn.disabled = state.shop.status === 'loading';
  dom.shopAccessScope.textContent = getShopAccessScopeLabel();
  dom.shopPickerDesc.textContent = getShopPickerDescription();

  const visibleShops = getVisibleShopList();
  dom.shopCountBadge.textContent = state.shop.status === 'ready'
    ? `${visibleShops.length}/${state.shop.available.length}`
    : '...';

  dom.shopSelectionError.hidden = !state.shop.error;
  dom.shopSelectionError.textContent = state.shop.error || '';

  if (state.shop.status === 'loading') {
    dom.shopSelectionList.innerHTML = '<div class="empty-state">正在加载店铺列表...</div>';
    return;
  }

  if (state.shop.status === 'error' && !state.shop.available.length) {
    dom.shopSelectionList.innerHTML = '<div class="empty-state">店铺列表加载失败，请点击刷新重试。</div>';
    return;
  }

  if (!state.shop.available.length) {
    dom.shopSelectionList.innerHTML = '<div class="empty-state">当前账号没有可操作的店铺，请联系管理员处理权限。</div>';
    return;
  }

  if (!visibleShops.length) {
    dom.shopSelectionList.innerHTML = '<div class="empty-state">没有匹配到店铺，请换个关键词试试。</div>';
    return;
  }

  dom.shopSelectionList.innerHTML = visibleShops.map((shop) => {
    const selectedClass = shop.shopCode === state.shop.draftCode ? 'is-selected' : '';
    const quickLoginPending = isShopQuickLoginPending(shop.shopCode);
    const quickLoginAllowed = canUseShopQuickLogin(state.auth.user);
    const quickLoginDisabled = state.shop.status !== 'ready'
      || quickLoginPending
      || !state.bridge?.auth?.quickLoginShop
      || !quickLoginAllowed;
    const quickLoginTitle = !quickLoginAllowed
      ? getShopQuickLoginDeniedMessage()
      : (quickLoginPending ? '正在执行一键登录' : '打开独立浏览器并注入最新 cookies');
    const remarkTag = shop.remark
      ? `<span class="shop-selection-item__tag shop-selection-item__tag--remark">${escapeHtml(shop.remark)}</span>`
      : '';

    return [
      `<article class="shop-selection-item ${selectedClass}">`,
      `<button type="button" class="shop-selection-item__main" data-shop-select-code="${escapeHtml(shop.shopCode)}">`,
      '<span class="shop-selection-item__top">',
      `<strong class="shop-selection-item__title">${escapeHtml(shop.shopName || shop.shopCode)}</strong>`,
      `<span class="shop-selection-item__code">店铺ID ${escapeHtml(shop.shopCode)}</span>`,
      '</span>',
      '<span class="shop-selection-item__badges">',
      shop.platform ? `<span class="shop-selection-item__tag">${escapeHtml(shop.platform)}</span>` : '',
      remarkTag,
      '</span>',
      '<span class="shop-selection-item__meta">',
      `<span>运营：${escapeHtml(shop.currentOperator || '未分配')}</span>`,
      '</span>',
      '</button>',
      '<div class="shop-selection-item__actions">',
      '<span class="shop-selection-item__action-label">快捷操作</span>',
      `<button type="button" class="secondary-button secondary-button--sm shop-selection-item__quick-login" data-shop-quick-login-code="${escapeHtml(shop.shopCode)}" title="${escapeHtml(quickLoginTitle)}"${quickLoginDisabled ? ' disabled' : ''}>${quickLoginPending ? '登录中...' : '一键登录'}</button>`,
      '</div>',
      '</article>'
    ].join('');
  }).join('');
}

function getAvailableSalesOverviewShops() {
  if (canFilterSalesOverviewByOperator(state.auth.user) && Array.isArray(state.shop.all) && state.shop.all.length) {
    return sortShopsByName(state.shop.all);
  }

  return Array.isArray(state.shop.available) ? state.shop.available : [];
}

function syncSalesOverviewSelectionWithAvailableShops({ forceAll = false } = {}) {
  const availableShops = getAvailableSalesOverviewShops();
  const availableCodes = new Set(availableShops.map((shop) => shop.shopCode));

  if (forceAll) {
    state.salesOverview.selectedShopCodes = availableShops.map((shop) => shop.shopCode);
    state.salesOverview.hasInitializedSelection = true;
    return;
  }

  if (!state.salesOverview.hasInitializedSelection) {
    if (!availableShops.length) {
      return;
    }

    state.salesOverview.selectedShopCodes = availableShops.map((shop) => shop.shopCode);
    state.salesOverview.hasInitializedSelection = true;
    return;
  }

  state.salesOverview.selectedShopCodes = state.salesOverview.selectedShopCodes.filter((shopCode) => {
    return availableCodes.has(shopCode);
  });
}

function handleOpenSalesOverviewPage() {
  if (!state.auth.user) {
    return;
  }

  openSalesOverviewPage({ from: state.shop.isOpen ? 'shop-selection' : 'app-shell' });

  if (state.shop.status === 'idle' || state.shop.status === 'error') {
    hydrateShopCatalog().catch((error) => {
      console.error(error);
    });
  }
}

function openSalesOverviewPage({ from = 'shop-selection' } = {}) {
  state.salesOverview.isOpen = true;
  state.salesOverview.entrySource = from;
  state.shop.isOpen = false;
  state.ui.secondaryDrawerPanel = '';
  syncSalesOverviewSelectionWithAvailableShops();
  renderSalesOverviewPage();
}

function closeSalesOverviewPage() {
  stopSalesOverviewFetch({ preserveStatus: true });
  state.salesOverview.isOpen = false;

  if (state.salesOverview.entrySource === 'shop-selection') {
    state.shop.isOpen = true;
    renderShopPicker();
    focusShopSearchInput();
    return;
  }

  renderShellState();
}

function handleSalesOverviewSearchInput(event) {
  state.salesOverview.search = String(event.target.value || '');
  renderSalesOverviewPage();
}

function handleSalesOverviewOperatorFilterChange(event) {
  const nextOperator = String(event.target.value || '').trim();
  state.salesOverview.operatorFilter = isSupportedSalesOverviewOperatorFilter(nextOperator)
    ? nextOperator
    : 'all';
  renderSalesOverviewPage();
}

function handleSalesOverviewTrendMetricChange(event) {
  const nextMetric = String(event.target.value || '').trim();
  state.salesOverview.trendMetric = isSupportedSalesOverviewTrendMetric(nextMetric)
    ? nextMetric
    : getDefaultSalesOverviewTrendMetricKey();
  renderSalesOverviewPage();
}

function handleSalesOverviewTrendFilterChange(event) {
  const nextFilter = String(event.target.value || '').trim();
  state.salesOverview.trendFilter = isSupportedSalesOverviewTrendFilter(nextFilter)
    ? nextFilter
    : 'all';
  renderSalesOverviewPage();
}

function handleSalesOverviewSortChange(event) {
  const nextSort = String(event.target.value || '').trim();
  state.salesOverview.sortMode = isSupportedSalesOverviewSortMode(nextSort)
    ? nextSort
    : 'default';
  renderSalesOverviewPage();
}

function handleSalesOverviewTableSelectionChange(event) {
  if (state.salesOverview.status === 'loading') {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') {
    return;
  }

  const shopCode = String(target.dataset.salesTableShopCode || '').trim();
  if (!shopCode) {
    return;
  }

  const selectedCodes = new Set(state.salesOverview.selectedShopCodes);
  if (target.checked) {
    selectedCodes.add(shopCode);
  } else {
    selectedCodes.delete(shopCode);
  }

  state.salesOverview.hasInitializedSelection = true;
  state.salesOverview.selectedShopCodes = getAvailableSalesOverviewShops()
    .map((shop) => shop.shopCode)
    .filter((code) => selectedCodes.has(code));
  markSalesOverviewSelectionDirty();
  renderSalesOverviewPage();
}

async function handleSalesOverviewTableClick(event) {
  if (!(event.target instanceof Element)) {
    return;
  }

  const quickLoginTrigger = event.target.closest('[data-sales-table-shop-login-code]');
  if (!quickLoginTrigger) {
    return;
  }

  await handleQuickLoginShop(quickLoginTrigger.dataset.salesTableShopLoginCode || '');
}

function handleSelectAllSalesOverviewShops() {
  if (state.salesOverview.status === 'loading') {
    return;
  }

  syncSalesOverviewSelectionWithAvailableShops({ forceAll: true });
  markSalesOverviewSelectionDirty();
  renderSalesOverviewPage();
}

function handleClearSalesOverviewShops() {
  if (state.salesOverview.status === 'loading') {
    return;
  }

  state.salesOverview.hasInitializedSelection = true;
  state.salesOverview.selectedShopCodes = [];
  markSalesOverviewSelectionDirty();
  renderSalesOverviewPage();
}

async function handleStartSalesOverviewFetch() {
  if (!state.auth.user) {
    return;
  }

  syncSalesOverviewSelectionWithAvailableShops();
  const selectedShopCodes = state.salesOverview.selectedShopCodes.slice();

  if (!selectedShopCodes.length) {
    state.salesOverview.status = 'error';
    state.salesOverview.error = '请至少勾选 1 家店铺后再开始获取。';
    state.salesOverview.notice = '当前没有勾选可查询的店铺，请先在表格中勾选店铺。';
    renderSalesOverviewPage();
    return;
  }

  stopSalesOverviewFetch({ preserveStatus: false });

  const controller = new AbortController();
  const fetchSession = state.salesOverview.fetchSession + 1;
  state.salesOverview.fetchSession = fetchSession;
  state.salesOverview.fetchController = controller;
  state.salesOverview.status = 'loading';
  state.salesOverview.error = '';
  state.salesOverview.rows = [];
  state.salesOverview.notice = `正在准备获取 ${selectedShopCodes.length} 家店铺的经营数据...`;
  state.salesOverview.summary = {
    ...state.salesOverview.summary,
    text: '正在获取经营数据...',
    scopeText: `已勾选 ${selectedShopCodes.length} 家店铺，正在等待返回结果。`
  };
  renderSalesOverviewPage();

  try {
    const result = await fetchSalesOverviewReport({
      shopCodes: selectedShopCodes,
      signal: controller.signal,
      onProgress: (progress) => {
        if (fetchSession !== state.salesOverview.fetchSession || state.salesOverview.status !== 'loading') {
          return;
        }

        state.salesOverview.rows = Array.isArray(progress.rows) ? progress.rows : [];
        state.salesOverview.notice = progress.notice || state.salesOverview.notice;
        state.salesOverview.summary = buildSalesOverviewSummary({
          rows: state.salesOverview.rows,
          selectedShopCodes,
          fetchedAt: progress.fetchedAt || '',
          text: progress.summary?.text || '正在获取经营数据...',
          scopeText: progress.summary?.scopeText || `已勾选 ${selectedShopCodes.length} 家店铺，正在等待返回结果。`
        });
        renderSalesOverviewPage();
      }
    });

    if (fetchSession !== state.salesOverview.fetchSession) {
      return;
    }

    state.salesOverview.fetchController = null;

    if (!result?.ok) {
      state.salesOverview.status = 'error';
      state.salesOverview.error = result?.error?.message || '经营数据获取失败，请稍后重试。';
      state.salesOverview.notice = '本次未获取到可用经营数据。';
      state.salesOverview.rows = [];
      state.salesOverview.summary = buildSalesOverviewSummary({
        rows: [],
        selectedShopCodes,
        fetchedAt: '',
        text: '经营数据获取失败',
        scopeText: `已勾选 ${selectedShopCodes.length} 家店铺，请修正问题后再重试。`
      });
      renderSalesOverviewPage();
      pushLocalLog('error', `经营总览获取失败：${state.salesOverview.error}`);
      return;
    }

    const successfulCount = Number(result.successCount) || 0;
    const failedCount = Number(result.failedCount) || 0;
    state.salesOverview.status = successfulCount > 0 ? 'success' : (failedCount > 0 ? 'error' : 'success');
    state.salesOverview.error = successfulCount > 0
      ? ''
      : (failedCount > 0 ? '本次经营总览未获取到可用数据，请检查店铺 cookies 或接口状态。' : '');
    state.salesOverview.notice = result.notice || '经营数据已更新。';
    state.salesOverview.rows = Array.isArray(result.rows) ? result.rows : [];
    state.salesOverview.summary = buildSalesOverviewSummary({
      rows: state.salesOverview.rows,
      selectedShopCodes,
      fetchedAt: result.fetchedAt || new Date().toISOString(),
      text: result.summary?.text || (
        successfulCount > 0 ? '经营数据已完成刷新。' : '经营数据获取完成，但没有可用成功结果。'
      ),
      scopeText: result.summary?.scopeText || `已勾选 ${selectedShopCodes.length} 家店铺，当前返回 ${state.salesOverview.rows.length} 行结果。`
    });
    renderSalesOverviewPage();
    pushLocalLog(successfulCount > 0 ? 'info' : 'warning', result.notice || `经营总览已完成刷新，当前选择 ${selectedShopCodes.length} 家店铺`);
  } catch (error) {
    if (fetchSession !== state.salesOverview.fetchSession) {
      return;
    }

    state.salesOverview.fetchController = null;

    if (error?.name === 'AbortError') {
      renderSalesOverviewPage();
      return;
    }

    state.salesOverview.status = 'error';
    state.salesOverview.error = error instanceof Error ? error.message : '经营数据获取失败，请稍后重试。';
    state.salesOverview.notice = '本次未获取到可用经营数据。';
    state.salesOverview.rows = [];
    state.salesOverview.summary = buildSalesOverviewSummary({
      rows: [],
      selectedShopCodes,
      fetchedAt: '',
      text: '经营数据获取失败',
      scopeText: `已勾选 ${selectedShopCodes.length} 家店铺，请稍后重试。`
    });
    renderSalesOverviewPage();
    pushLocalLog('error', `经营总览获取失败：${state.salesOverview.error}`);
  }
}

function handleStopSalesOverviewFetch() {
  stopSalesOverviewFetch({ preserveStatus: true });
  renderSalesOverviewPage();
}

async function handleExportSalesOverview() {
  if (!state.bridge?.workspace?.exportSalesOverview) {
    const message = '当前环境不支持经营总览导出，请使用桌面端最新版本。';
    showAuthNotice(message);
    pushLocalLog('warning', message);
    return;
  }

  if (state.salesOverview.isExporting) {
    return;
  }

  const visibleRows = getVisibleSalesOverviewRows();
  const exportRows = getExportableSalesOverviewRows(visibleRows);
  if (!exportRows.length) {
    const message = '当前没有可导出的经营数据，请先完成获取或调整筛选条件。';
    showAuthNotice(message);
    pushLocalLog('warning', message);
    return;
  }

  const trendMetric = getActiveSalesOverviewTrendMetric();
  const totals = calculateSalesOverviewTotals(exportRows.filter((row) => row.isSelected !== false));

  state.salesOverview.isExporting = true;
  renderSalesOverviewPage();

  try {
    const result = await state.bridge.workspace.exportSalesOverview({
      columns: SALES_OVERVIEW_COLUMNS.map((column) => {
        return {
          key: column.key,
          label: column.label,
          type: column.type,
          summable: Boolean(column.summable)
        };
      }),
      rows: exportRows.map((row, index) => buildSalesOverviewExportRow(row, index)),
      totals,
      meta: {
        title: '经营总览导出',
        fetchedAt: state.salesOverview.summary.fetchedAt || '',
        exportedAt: new Date().toISOString(),
        selectedCount: state.salesOverview.selectedShopCodes.length,
        visibleCount: exportRows.length,
        status: state.salesOverview.status || 'idle',
        search: state.salesOverview.search || '',
        operatorFilter: state.salesOverview.operatorFilter || 'all',
        operatorFilterLabel: getSalesOverviewOperatorFilterLabel(state.salesOverview.operatorFilter),
        trendMetricKey: trendMetric?.key || '',
        trendMetricLabel: trendMetric?.label || '',
        trendFilter: state.salesOverview.trendFilter || 'all',
        sortMode: state.salesOverview.sortMode || 'default',
        notice: state.salesOverview.notice || '',
        summaryText: state.salesOverview.summary?.text || '',
        scopeText: state.salesOverview.summary?.scopeText || '',
        comparisonNote: '今天列的涨跌颜色、筛选和排序统一按昨天同小时口径比较；昨天全天列保留全天累计值。'
      }
    });

    if (!result?.ok) {
      if (!result?.canceled) {
        const message = result?.error?.message || '导出经营总览失败，请稍后重试。';
        showAuthNotice(message);
        pushLocalLog('error', message);
      }
      return;
    }

    const successMessage = result.message || `经营总览已导出到 ${result.path || '目标文件'}`;
    showAuthNotice(successMessage);
    pushLocalLog('info', successMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出经营总览失败，请稍后重试。';
    showAuthNotice(message);
    pushLocalLog('error', message);
  } finally {
    state.salesOverview.isExporting = false;
    renderSalesOverviewPage();
  }
}

function stopSalesOverviewFetch({ preserveStatus = true } = {}) {
  if (state.salesOverview.fetchController) {
    state.salesOverview.fetchController.abort();
    state.salesOverview.fetchController = null;
  }

  state.salesOverview.fetchSession += 1;

  if (preserveStatus && state.salesOverview.status === 'loading') {
    const completedCount = Array.isArray(state.salesOverview.rows) ? state.salesOverview.rows.length : 0;
    const pendingCount = Math.max(0, state.salesOverview.selectedShopCodes.length - completedCount);
    state.salesOverview.status = 'stopped';
    state.salesOverview.error = '';
    state.salesOverview.notice = pendingCount > 0
      ? `已停止本次经营数据获取，已有 ${completedCount} 家返回，${pendingCount} 家未执行。`
      : '已停止本次经营数据获取。';
    state.salesOverview.summary = {
      ...state.salesOverview.summary,
      text: '经营数据获取已停止',
      scopeText: pendingCount > 0
        ? `已勾选 ${state.salesOverview.selectedShopCodes.length} 家店铺，已有 ${completedCount} 家返回，${pendingCount} 家未执行。`
        : `已勾选 ${state.salesOverview.selectedShopCodes.length} 家店铺，你可以重新开始获取。`
    };
    pushLocalLog('warning', '已停止经营总览数据获取');
  }
}

function buildSalesOverviewSummary({
  rows = [],
  selectedShopCodes = [],
  fetchedAt = '',
  text = '',
  scopeText = ''
} = {}) {
  return {
    text: text || '默认查询当前账号可见店铺。',
    scopeText: scopeText || `已勾选 ${selectedShopCodes.length} 家店铺，返回 ${rows.length} 行。`,
    selectedCount: selectedShopCodes.length,
    visibleCount: rows.length,
    totalCount: getAvailableSalesOverviewShops().length,
    fetchedAt,
    totals: calculateSalesOverviewTotals(rows)
  };
}

function buildInitialUiState() {
  return {
    activeSurface: 'auth',
    activeWorkspaceSection: 'overview',
    activeWorkspaceStep: 'overview',
    secondaryDrawerPanel: '',
    isSalesScopeOpen: false
  };
}

function markSalesOverviewSelectionDirty() {
  state.salesOverview.status = 'idle';
  state.salesOverview.error = '';
  state.salesOverview.notice = '店铺勾选已更新。';
  state.salesOverview.rows = [];
  state.salesOverview.summary = buildSalesOverviewSummary({
    rows: [],
    selectedShopCodes: state.salesOverview.selectedShopCodes,
    fetchedAt: '',
    text: '店铺勾选已更新',
    scopeText: `已勾选 ${state.salesOverview.selectedShopCodes.length} 家店铺。`
  });
}

function getVisibleSalesOverviewRows() {
  const keyword = String(state.salesOverview.search || '').trim().toLowerCase();
  const rows = applySalesOverviewTrendFilterAndSort(
    applySalesOverviewOperatorFilter(getSalesOverviewDisplayRows())
  );

  if (!keyword) {
    return rows;
  }

  return rows.filter((row) => {
    return [
      row.shopName,
      row.shopCode,
      row.currentOperator
    ].some((value) => String(value || '').toLowerCase().includes(keyword));
  });
}

function applySalesOverviewOperatorFilter(rows = []) {
  const normalizedRows = Array.isArray(rows) ? rows : [];
  const operatorFilter = String(state.salesOverview.operatorFilter || 'all').trim();

  if (operatorFilter === 'all') {
    return normalizedRows.slice();
  }

  return normalizedRows.filter((row) => {
    return getSalesOverviewRowOperatorLabel(row) === operatorFilter;
  });
}

function applySalesOverviewTrendFilterAndSort(rows = []) {
  const normalizedRows = Array.isArray(rows) ? rows.slice() : [];
  const trendMetric = getActiveSalesOverviewTrendMetric();
  const trendFilter = String(state.salesOverview.trendFilter || 'all').trim();
  const sortMode = String(state.salesOverview.sortMode || 'default').trim();

  const filteredRows = normalizedRows.filter((row) => {
    if (trendFilter === 'all') {
      return true;
    }

    const comparison = getSalesOverviewMetricComparison(row, trendMetric?.key);
    if (comparison === null) {
      return false;
    }

    if (trendFilter === 'up') {
      return comparison > 0;
    }

    if (trendFilter === 'down') {
      return comparison < 0;
    }

    if (trendFilter === 'flat') {
      return comparison === 0;
    }

    return true;
  });

  if (sortMode === 'default') {
    return filteredRows;
  }

  return filteredRows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const compareResult = compareSalesOverviewRowsByTrend(left.row, right.row, trendMetric, sortMode);
      return compareResult !== 0 ? compareResult : left.index - right.index;
    })
    .map((entry) => entry.row);
}

function getActiveSalesOverviewTrendMetric() {
  const metricKey = String(state.salesOverview.trendMetric || '').trim();
  return getSalesOverviewTrendMetricDefinition(metricKey)
    || getSalesOverviewTrendMetricDefinition(getDefaultSalesOverviewTrendMetricKey())
    || SALES_OVERVIEW_TREND_METRICS[0]
    || null;
}

function getSalesOverviewTrendMetricDefinition(metricKey) {
  const normalizedMetricKey = String(metricKey || '').trim();
  return SALES_OVERVIEW_TREND_METRICS.find((metric) => metric.key === normalizedMetricKey) || null;
}

function getDefaultSalesOverviewTrendMetricKey() {
  return SALES_OVERVIEW_TREND_METRICS[0]?.key || 'todayGmv';
}

function isSupportedSalesOverviewTrendMetric(metricKey) {
  return Boolean(getSalesOverviewTrendMetricDefinition(metricKey));
}

function isSupportedSalesOverviewOperatorFilter(operatorValue) {
  const normalizedOperator = String(operatorValue || '').trim();
  return normalizedOperator === 'all'
    || getSalesOverviewOperatorOptions().some((option) => option.value === normalizedOperator);
}

function isSupportedSalesOverviewTrendFilter(filterValue) {
  return ['all', 'up', 'down', 'flat'].includes(String(filterValue || '').trim());
}

function isSupportedSalesOverviewSortMode(sortMode) {
  return ['default', 'delta-desc', 'delta-asc', 'current-desc', 'current-asc'].includes(String(sortMode || '').trim());
}

function compareSalesOverviewRowsByTrend(leftRow, rightRow, trendMetric, sortMode) {
  const leftDelta = getSalesOverviewMetricDelta(leftRow, trendMetric?.key);
  const rightDelta = getSalesOverviewMetricDelta(rightRow, trendMetric?.key);
  const leftCurrent = getSalesOverviewTrendMetricValue(leftRow, trendMetric?.key);
  const rightCurrent = getSalesOverviewTrendMetricValue(rightRow, trendMetric?.key);

  if (sortMode === 'delta-desc') {
    return compareSalesOverviewSortableValues(rightDelta, leftDelta);
  }

  if (sortMode === 'delta-asc') {
    return compareSalesOverviewSortableValues(leftDelta, rightDelta);
  }

  if (sortMode === 'current-desc') {
    return compareSalesOverviewSortableValues(rightCurrent, leftCurrent);
  }

  if (sortMode === 'current-asc') {
    return compareSalesOverviewSortableValues(leftCurrent, rightCurrent);
  }

  return 0;
}

function compareSalesOverviewSortableValues(leftValue, rightValue) {
  const leftComparable = Number.isFinite(leftValue);
  const rightComparable = Number.isFinite(rightValue);

  if (!leftComparable && !rightComparable) {
    return 0;
  }

  if (!leftComparable) {
    return 1;
  }

  if (!rightComparable) {
    return -1;
  }

  if (leftValue === rightValue) {
    return 0;
  }

  return leftValue < rightValue ? -1 : 1;
}

function getSalesOverviewTrendMetricValue(row, metricKey) {
  const metricDefinition = getSalesOverviewTrendMetricDefinition(metricKey);
  if (!metricDefinition) {
    return null;
  }

  return normalizeSalesOverviewComparableNumber(row?.[metricDefinition.key]);
}

function getSalesOverviewMetricDelta(row, metricKey) {
  const metricDefinition = getSalesOverviewTrendMetricDefinition(metricKey);
  if (!metricDefinition) {
    return null;
  }

  const currentValue = normalizeSalesOverviewComparableNumber(row?.[metricDefinition.key]);
  const baselineValue = normalizeSalesOverviewComparableNumber(row?.[metricDefinition.baselineKey]);

  if (!Number.isFinite(currentValue) || !Number.isFinite(baselineValue)) {
    return null;
  }

  return currentValue - baselineValue;
}

function getSalesOverviewMetricComparison(row, metricKey) {
  const delta = getSalesOverviewMetricDelta(row, metricKey);
  if (!Number.isFinite(delta)) {
    return null;
  }

  if (delta > 0) {
    return 1;
  }

  if (delta < 0) {
    return -1;
  }

  return 0;
}

function normalizeSalesOverviewComparableNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function getSalesOverviewOperatorOptions() {
  const options = getSalesOverviewDisplayRows()
    .map((row) => getSalesOverviewRowOperatorLabel(row))
    .filter(Boolean);
  const uniqueOptions = Array.from(new Set(options));

  return uniqueOptions
    .sort((left, right) => left.localeCompare(right, 'zh-CN'))
    .map((value) => ({ value, label: value }));
}

function getSalesOverviewOperatorFilterLabel(operatorValue) {
  const normalizedOperator = String(operatorValue || '').trim();
  if (!normalizedOperator || normalizedOperator === 'all') {
    return '全部运营';
  }

  return normalizedOperator;
}

function getSalesOverviewRowOperatorLabel(row) {
  return String(row?.currentOperator || '').trim() || '未分配';
}

function getSalesOverviewDisplayRows() {
  const availableShops = getAvailableSalesOverviewShops();
  const realRows = Array.isArray(state.salesOverview.rows) ? state.salesOverview.rows : [];
  const realRowMap = new Map(realRows.map((row) => [String(row.shopCode || '').trim(), row]));
  const selectedCodes = new Set(state.salesOverview.selectedShopCodes);

  return availableShops.map((shop) => {
    const shopCode = String(shop.shopCode || '').trim();
    const realRow = realRowMap.get(shopCode);
    if (realRow) {
      return {
        ...realRow,
        shopCode,
        shopName: realRow.shopName || shop.shopName || shopCode,
        currentOperator: realRow.currentOperator || shop.currentOperator || '未分配',
        isSelected: selectedCodes.has(shopCode)
      };
    }

    return {
      shopCode,
      shopName: shop.shopName || shopCode,
      currentOperator: shop.currentOperator || '未分配',
      isScopePlaceholder: true,
      isSelected: selectedCodes.has(shopCode)
    };
  });
}

function calculateSalesOverviewTotals(rows = []) {
  const successfulRows = (Array.isArray(rows) ? rows : []).filter((row) => {
    return row && row.rowStatus === 'success';
  });
  const summableColumns = SALES_OVERVIEW_COLUMNS.filter((column) => column.summable);

  if (!successfulRows.length || !summableColumns.length) {
    return null;
  }

  return successfulRows.reduce((totals, row) => {
    summableColumns.forEach((column) => {
      totals[column.key] += normalizeMetricNumber(row[column.key]);
    });
    return totals;
  }, summableColumns.reduce((totals, column) => {
    totals[column.key] = 0;
    return totals;
  }, {}));
}

function renderSalesOverviewPage() {
  if (!dom.salesOverviewPage) {
    return;
  }

  renderShellState();
  syncSalesOverviewSelectionWithAvailableShops();
  if (state.ui.activeSurface !== 'overview') {
    return;
  }

  const availableShops = getAvailableSalesOverviewShops();
  const selectedCount = state.salesOverview.selectedShopCodes.length;
  const visibleRows = getVisibleSalesOverviewRows();
  const exportableVisibleRows = getExportableSalesOverviewRows(visibleRows);
  const selectedVisibleRows = visibleRows.filter((row) => row.isSelected !== false);
  const totals = state.salesOverview.rows.length ? calculateSalesOverviewTotals(selectedVisibleRows) : null;
  const operatorOptions = getSalesOverviewOperatorOptions();
  const isInitialOverviewState = state.salesOverview.status === 'idle'
    && !state.salesOverview.summary.fetchedAt
    && !state.salesOverview.rows.length
    && state.salesOverview.notice === '还没有经营数据。';
  const effectiveError = state.salesOverview.error || (
    state.shop.status === 'error' && !availableShops.length
      ? state.shop.error || '店铺范围加载失败，请稍后重试。'
      : ''
  );

  if (dom.openSalesOverviewBtn) {
    dom.openSalesOverviewBtn.disabled = !state.auth.user;
  }

  dom.salesOverviewSelectedCount.textContent = `${selectedCount} 家`;
  dom.salesOverviewStatusText.textContent = toTitleCase(state.salesOverview.status || 'idle');
  dom.salesOverviewLastFetched.textContent = state.salesOverview.summary.fetchedAt
    ? formatDateTime(state.salesOverview.summary.fetchedAt)
    : '尚未获取';
  dom.salesOverviewStatus.className = `status-pill status-pill--${state.salesOverview.status || 'idle'}`;
  dom.salesOverviewStatus.textContent = toTitleCase(state.salesOverview.status || 'idle');
  dom.salesOverviewSummary.textContent = isInitialOverviewState
    ? '默认查询当前账号可见店铺。'
    : (state.salesOverview.summary.text || '默认查询当前账号可见店铺。');
  dom.salesOverviewScopeMeta.textContent = isInitialOverviewState
    ? `已勾选 ${selectedCount} 家店铺。`
    : (state.salesOverview.summary.scopeText || `已勾选 ${selectedCount} 家店铺。`);
  dom.salesOverviewFetchBtn.disabled = !state.auth.user
    || state.salesOverview.status === 'loading'
    || !selectedCount
    || state.shop.status === 'loading'
    || !availableShops.length;
  dom.salesOverviewStopBtn.disabled = state.salesOverview.status !== 'loading';
  if (dom.salesOverviewExportBtn) {
    dom.salesOverviewExportBtn.disabled = state.salesOverview.status === 'loading'
      || state.salesOverview.isExporting
      || !exportableVisibleRows.length
      || !state.bridge?.workspace?.exportSalesOverview;
    dom.salesOverviewExportBtn.textContent = state.salesOverview.isExporting ? '导出中...' : '导出 Excel';
  }
  dom.salesOverviewSelectAllBtn.disabled = !availableShops.length || state.salesOverview.status === 'loading';
  dom.salesOverviewClearBtn.disabled = state.salesOverview.status === 'loading';
  dom.salesOverviewSearchInput.value = state.salesOverview.search;
  dom.salesOverviewSearchInput.disabled = !availableShops.length && !state.salesOverview.rows.length;
  const normalizedOperatorFilter = isSupportedSalesOverviewOperatorFilter(state.salesOverview.operatorFilter)
    ? state.salesOverview.operatorFilter
    : 'all';
  state.salesOverview.operatorFilter = normalizedOperatorFilter;
  if (dom.salesOverviewOperatorFilterSelect) {
    dom.salesOverviewOperatorFilterSelect.innerHTML = [
      '<option value="all">全部运营</option>',
      ...operatorOptions.map((option) => {
        return `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`;
      })
    ].join('');
    dom.salesOverviewOperatorFilterSelect.value = normalizedOperatorFilter;
    dom.salesOverviewOperatorFilterSelect.disabled = !operatorOptions.length && !state.salesOverview.rows.length;
  }
  if (dom.salesOverviewTrendMetricSelect) {
    dom.salesOverviewTrendMetricSelect.value = getActiveSalesOverviewTrendMetric()?.key || getDefaultSalesOverviewTrendMetricKey();
    dom.salesOverviewTrendMetricSelect.disabled = !availableShops.length && !state.salesOverview.rows.length;
  }
  if (dom.salesOverviewTrendFilterSelect) {
    dom.salesOverviewTrendFilterSelect.value = isSupportedSalesOverviewTrendFilter(state.salesOverview.trendFilter)
      ? state.salesOverview.trendFilter
      : 'all';
    dom.salesOverviewTrendFilterSelect.disabled = !availableShops.length && !state.salesOverview.rows.length;
  }
  if (dom.salesOverviewSortSelect) {
    dom.salesOverviewSortSelect.value = isSupportedSalesOverviewSortMode(state.salesOverview.sortMode)
      ? state.salesOverview.sortMode
      : 'default';
    dom.salesOverviewSortSelect.disabled = !availableShops.length && !state.salesOverview.rows.length;
  }
  dom.salesOverviewNotice.textContent = resolveSalesOverviewNoticeText(availableShops);
  dom.salesOverviewError.hidden = !effectiveError;
  dom.salesOverviewError.textContent = effectiveError;
  dom.salesOverviewResultBadge.textContent = `${visibleRows.length} 行`;

  renderSalesOverviewTable(visibleRows, totals);
}

function resolveSalesOverviewNoticeText(availableShops) {
  if (state.shop.status === 'loading' && !availableShops.length) {
    return '正在加载店铺范围。';
  }

  if (state.shop.status === 'error' && !availableShops.length) {
    return '店铺范围加载失败。';
  }

  return state.salesOverview.notice || '还没有经营数据。';
}

function renderSalesOverviewTable(rows, totals) {
  if (!dom.salesOverviewTableBody || !dom.salesOverviewSummaryRow) {
    return;
  }

  renderSalesOverviewTableFrame();

  if (state.salesOverview.status === 'loading' && !rows.length && !state.salesOverview.rows.length) {
    dom.salesOverviewTableBody.innerHTML = `<tr><td colspan="${getSalesOverviewEmptyColspan()}" class="sales-table__empty-cell"><div class="empty-state">正在获取经营数据，请稍候...</div></td></tr>`;
    renderSalesOverviewSummaryRow(null);
    return;
  }

  if (state.salesOverview.status === 'error' && !rows.length && !state.salesOverview.rows.length) {
    dom.salesOverviewTableBody.innerHTML = `<tr><td colspan="${getSalesOverviewEmptyColspan()}" class="sales-table__empty-cell"><div class="empty-state">经营数据暂时不可用，请修正问题后重试。</div></td></tr>`;
    renderSalesOverviewSummaryRow(null);
    return;
  }

  if (!rows.length) {
    const emptyCopy = state.salesOverview.rows.length
      ? '当前搜索条件下没有匹配到店铺，请换个关键词试试。'
      : state.salesOverview.summary.fetchedAt
        ? '本轮尚未返回可展示的经营数据，请稍后重试。'
        : '当前还没有经营数据，点击“开始获取”后会在这里展示结果。';
    dom.salesOverviewTableBody.innerHTML = `<tr><td colspan="${getSalesOverviewEmptyColspan()}" class="sales-table__empty-cell"><div class="empty-state">${escapeHtml(emptyCopy)}</div></td></tr>`;
    renderSalesOverviewSummaryRow(null);
    return;
  }

  dom.salesOverviewTableBody.innerHTML = rows.map((row, index) => {
    return renderSalesOverviewTableRow(row, index);
  }).join('');

  renderSalesOverviewSummaryRow(totals);
}

function renderSalesOverviewTableFrame() {
  const colgroupHtml = getSalesOverviewTableColgroupHtml();
  const headHtml = getSalesOverviewTableHeadHtml();

  if (dom.salesOverviewTableColgroup) {
    dom.salesOverviewTableColgroup.innerHTML = colgroupHtml;
  }

  if (dom.salesOverviewStickyTableColgroup) {
    dom.salesOverviewStickyTableColgroup.innerHTML = colgroupHtml;
  }

  if (dom.salesOverviewTableHead) {
    dom.salesOverviewTableHead.innerHTML = headHtml;
  }

  if (dom.salesOverviewStickyTableHead) {
    dom.salesOverviewStickyTableHead.innerHTML = headHtml;
  }

  syncSalesOverviewStickyHeader();
}

function renderSalesOverviewTableRow(row, index) {
  const rowClassName = row.isSelected === false ? 'sales-table__row--inactive' : '';
  const cells = SALES_OVERVIEW_COLUMNS.map((column) => {
    if (column.type === 'index') {
      const className = `${getSalesOverviewTableCellClassName(column)} sales-table__num`.trim();
      return `<td class="${escapeHtml(className)}">${index + 1}</td>`;
    }

    if (column.type === 'shop') {
      return renderSalesOverviewShopCell(column, row);
    }

    return renderSalesOverviewMetricCell(column, row);
  }).join('');

  return `<tr class="${rowClassName}">${cells}</tr>`;
}

function renderSalesOverviewShopCell(column, row) {
  const selectionLabel = row.isSelected === false ? '未勾选' : '已勾选';
  const shopCode = String(row.shopCode || '').trim();
  const shopName = row.shopName || row.shopCode || '未命名店铺';
  const checkboxDisabled = state.salesOverview.status === 'loading' ? ' disabled' : '';
  const quickLoginPending = isShopQuickLoginPending(shopCode);
  const quickLoginAllowed = canUseShopQuickLogin(state.auth.user);
  const quickLoginDisabled = !shopCode
    || state.shop.status !== 'ready'
    || quickLoginPending
    || !state.bridge?.auth?.quickLoginShop
    || !state.auth.user
    || !quickLoginAllowed;

  const shopMetaParts = [
    row.shopCode || '-',
    row.currentOperator || '未分配'
  ];

  if (row.isScopePlaceholder) {
    shopMetaParts.push(selectionLabel);
  }

  if (row.rowStatus === 'error' && row.rowError) {
    shopMetaParts.push(`获取失败：${row.rowError}`);
  }

  if (row.rowStatus === 'success' && row.comparisonHour) {
    shopMetaParts.push(`昨天同小时截至 ${row.comparisonHour}:00`);
  }

  const shopTitleHints = [];
  if (!quickLoginAllowed) {
    shopTitleHints.push(getShopQuickLoginDeniedMessage());
  } else if (!quickLoginDisabled) {
    shopTitleHints.push('点击一键登录');
  }

  if (row.rowStatus === 'error' && row.rowError) {
    shopTitleHints.push(`获取失败：${row.rowError}`);
  }

  const shopNameTitle = shopTitleHints.length
    ? `${shopName}（${shopTitleHints.join('；')}）`
    : shopName;

  const className = getSalesOverviewTableCellClassName(column);
  return [
    `<td class="${escapeHtml(className)}">`,
    '<div class="sales-table__shop-selector">',
    `<input type="checkbox" class="sales-table__checkbox" data-sales-table-shop-code="${escapeHtml(row.shopCode || '')}"${row.isSelected === false ? '' : ' checked'}${checkboxDisabled}>`,
    '<div class="sales-table__shop">',
    `<button type="button" class="sales-table__shop-name" data-sales-table-shop-login-code="${escapeHtml(shopCode)}" title="${escapeHtml(shopNameTitle)}"${quickLoginDisabled ? ' disabled' : ''}>${escapeHtml(shopName)}</button>`,
    `<span class="sales-table__shop-meta">${escapeHtml(shopMetaParts.join(' · '))}</span>`,
    '</div>',
    '</div>',
    '</td>'
  ].join('');
}

function renderSalesOverviewMetricCell(column, row) {
  const formattedValue = formatSalesValueByColumn(column, row?.[column.key]);
  const cellTone = getSalesOverviewMetricTone(row, column.key);
  const className = `${getSalesOverviewTableCellClassName(column)} sales-table__num`.trim();
  const TONE_CLASS_MAP = {
    up: 'sales-table__value sales-table__value--up',
    down: 'sales-table__value sales-table__value--down'
  };
  const valueClassName = TONE_CLASS_MAP[cellTone] || 'sales-table__value';

  return `<td class="${escapeHtml(className)}"><span class="${valueClassName}">${formattedValue}</span></td>`;
}

function getSalesOverviewColumnAlign(column) {
  return column?.align === 'left' ? 'left' : 'center';
}

function getSalesOverviewTableColgroupHtml() {
  return SALES_OVERVIEW_COLUMNS.map((column) => {
    return `<col class="${escapeHtml(column.className || '')}">`;
  }).join('');
}

function getSalesOverviewTableHeadHtml() {
  return `<tr>${SALES_OVERVIEW_COLUMNS.map((column) => {
    const className = getSalesOverviewTableCellClassName(column, 'head');
    return `<th scope="col" class="${escapeHtml(className)}">${escapeHtml(column.label || '')}</th>`;
  }).join('')}</tr>`;
}

function getSalesOverviewTableCellClassName(column, target = 'body') {
  const align = getSalesOverviewColumnAlign(column);
  if (target === 'head') {
    return `sales-table__head-cell sales-table__head-cell--${align}`;
  }
  if (target === 'summary') {
    return `sales-table__summary-cell sales-table__summary-cell--${align}`;
  }
  return `sales-table__cell sales-table__cell--${align}`;
}

function syncSalesOverviewStickyHeader() {
  if (!dom.salesOverviewTableWrap) {
    return;
  }

  const scrollLeft = dom.salesOverviewTableScroll?.scrollLeft || 0;
  let stickyInset = 0;
  const firstHeaderCell = dom.salesOverviewTableHead?.querySelector('th');
  if (dom.salesOverviewTableScroll && firstHeaderCell) {
    const scrollRect = dom.salesOverviewTableScroll.getBoundingClientRect();
    const headerRect = firstHeaderCell.getBoundingClientRect();
    stickyInset = headerRect.left - scrollRect.left + scrollLeft;
  }

  dom.salesOverviewTableWrap.style.setProperty('--sales-table-sticky-offset', `${scrollLeft * -1}px`);
  dom.salesOverviewTableWrap.style.setProperty('--sales-table-sticky-inset', `${stickyInset}px`);
}

function getSalesOverviewMetricTone(row, metricKey) {
  const comparison = getSalesOverviewMetricComparison(row, metricKey);
  if (comparison === null) {
    return '';
  }

  if (comparison > 0) {
    return 'up';
  }

  if (comparison < 0) {
    return 'down';
  }

  return '';
}

function getExportableSalesOverviewRows(rows = []) {
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    return row && !row.isScopePlaceholder && String(row.shopCode || '').trim();
  });
}

function buildSalesOverviewExportRow(row, index) {
  const exportRow = {
    index: index + 1,
    shopName: row.shopName || row.shopCode || `店铺 ${index + 1}`,
    shopCode: row.shopCode || '',
    currentOperator: row.currentOperator || '未分配',
    comparisonHour: row.comparisonHour || '',
    rowStatus: row.rowStatus || '',
    rowError: row.rowError || ''
  };

  SALES_OVERVIEW_COLUMNS.forEach((column) => {
    if (column.type === 'index' || column.type === 'shop') {
      return;
    }

    exportRow[column.key] = row?.[column.key] ?? null;
  });

  exportRow.cellToneByKey = SALES_OVERVIEW_COLUMNS.reduce((tones, column) => {
    if (column.type === 'index' || column.type === 'shop') {
      return tones;
    }

    const tone = getSalesOverviewMetricTone(row, column.key);
    if (tone) {
      tones[column.key] = tone;
    }
    return tones;
  }, {});

  return exportRow;
}

function renderSalesOverviewSummaryRow(totals) {
  if (!dom.salesOverviewSummaryRow) {
    return;
  }

  const cells = ['<td colspan="2" class="sales-table__summary-cell sales-table__summary-cell--left">统计</td>'];

  SALES_OVERVIEW_COLUMNS.slice(2).forEach((column) => {
    const className = `${getSalesOverviewTableCellClassName(column, 'summary')} sales-table__num`.trim();
    if (!totals || !column.summable) {
      cells.push(`<td class="${escapeHtml(className)}">-</td>`);
      return;
    }

    cells.push(`<td class="${escapeHtml(className)}">${formatSalesValueByColumn(column, totals[column.key])}</td>`);
  });

  dom.salesOverviewSummaryRow.innerHTML = cells.join('');
}

function getSalesOverviewEmptyColspan() {
  return SALES_OVERVIEW_COLUMNS.length;
}

function normalizeMetricNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatSalesValueByColumn(column, value) {
  if (column?.type === 'money') {
    return formatSalesMoneyValue(value);
  }

  if (column?.type === 'rate') {
    return formatSalesRateValue(value);
  }

  return formatSalesMetricValue(value);
}

function formatSalesMetricValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString('zh-CN', {
      maximumFractionDigits: 0
    });
  }

  return escapeHtml(value);
}

function formatSalesMoneyValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  return escapeHtml(value);
}

function formatSalesRateValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    const displayValue = Math.abs(numericValue) > 1 ? numericValue : numericValue * 100;
    return `${displayValue.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}%`;
  }

  const normalizedText = String(value || '').trim();
  return normalizedText ? escapeHtml(normalizedText) : '-';
}

async function fetchSalesOverviewReport({ shopCodes = [], signal, onProgress } = {}) {
  if (!state.bridge?.auth?.getShopOverview) {
    return {
      ok: false,
      error: {
        message: '当前环境不支持经营总览接口，请使用桌面端最新版本。'
      }
    };
  }

  const normalizedShopCodes = (Array.isArray(shopCodes) ? shopCodes : [])
    .map((shopCode) => String(shopCode || '').trim())
    .filter(Boolean);
  const availableShops = getAvailableSalesOverviewShops();
  const shopMap = new Map(availableShops.map((shop) => [shop.shopCode, shop]));
  const rows = [];
  const queryDate = formatSalesOverviewQueryDate(new Date());
  let successCount = 0;
  let failedCount = 0;
  let fetchedAt = '';

  for (let index = 0; index < normalizedShopCodes.length; index += 1) {
    ensureSalesOverviewNotAborted(signal);

    const shopCode = normalizedShopCodes[index];
    const fallbackShop = shopMap.get(shopCode) || {
      shopCode,
      shopName: shopCode,
      currentOperator: '未分配'
    };

    try {
      const result = await state.bridge.auth.getShopOverview({
        shopCode,
        queryDate
      });

      ensureSalesOverviewNotAborted(signal);

      if (result?.ok) {
        rows.push({
          ...result,
          shopCode: result.shopCode || fallbackShop.shopCode,
          shopName: result.shopName || fallbackShop.shopName || fallbackShop.shopCode,
          currentOperator: result.currentOperator || fallbackShop.currentOperator || '未分配',
          rowStatus: result.rowStatus || 'success',
          rowError: result.rowError || '',
          fetchedAt: result.fetchedAt || new Date().toISOString()
        });
        successCount += 1;
      } else {
        rows.push(buildSalesOverviewFailureRow(
          fallbackShop,
          result?.error?.message || '经营总览接口返回失败。'
        ));
        failedCount += 1;
      }
    } catch (error) {
      if (signal?.aborted || error?.name === 'AbortError') {
        throw createSalesOverviewAbortError();
      }

      rows.push(buildSalesOverviewFailureRow(
        fallbackShop,
        error instanceof Error ? error.message : '经营总览获取失败，请稍后重试。'
      ));
      failedCount += 1;
    }

    fetchedAt = rows[rows.length - 1]?.fetchedAt || new Date().toISOString();
    const pendingCount = Math.max(0, normalizedShopCodes.length - rows.length);
    onProgress?.({
      rows: rows.slice(),
      fetchedAt,
      notice: buildSalesOverviewFetchNotice({
        successCount,
        failedCount,
        pendingCount,
        isFinal: false
      }),
      summary: buildSalesOverviewFetchSummary({
        selectedCount: normalizedShopCodes.length,
        completedCount: rows.length,
        successCount,
        failedCount,
        pendingCount,
        isFinal: false
      })
    });
  }

  ensureSalesOverviewNotAborted(signal);

  const pendingCount = Math.max(0, normalizedShopCodes.length - rows.length);
  return {
    ok: true,
    rows,
    fetchedAt: fetchedAt || new Date().toISOString(),
    successCount,
    failedCount,
    pendingCount,
    notice: buildSalesOverviewFetchNotice({
      successCount,
      failedCount,
      pendingCount,
      isFinal: true
    }),
    summary: buildSalesOverviewFetchSummary({
      selectedCount: normalizedShopCodes.length,
      completedCount: rows.length,
      successCount,
      failedCount,
      pendingCount,
      isFinal: true
    })
  };
}

function buildSalesOverviewFetchSummary({
  selectedCount = 0,
  completedCount = 0,
  successCount = 0,
  failedCount = 0,
  pendingCount = 0,
  isFinal = false
} = {}) {
  if (!isFinal) {
    return {
      text: `正在获取经营数据，已完成 ${completedCount}/${selectedCount} 家店铺。`,
      scopeText: `成功 ${successCount} 家，失败 ${failedCount} 家，待执行 ${pendingCount} 家。`
    };
  }

  if (successCount > 0 && failedCount > 0) {
    return {
      text: `经营数据获取完成，${successCount} 家成功，${failedCount} 家失败。`,
      scopeText: `已勾选 ${selectedCount} 家店铺，仍有 ${failedCount} 家需要检查 cookies 或接口状态。`
    };
  }

  if (successCount > 0) {
    return {
      text: `经营数据获取完成，${successCount} 家店铺已成功刷新。`,
      scopeText: `已勾选 ${selectedCount} 家店铺，当前返回 ${completedCount} 行结果。`
    };
  }

  return {
    text: '经营数据获取完成，但未拿到可用成功结果。',
    scopeText: `已勾选 ${selectedCount} 家店铺，失败 ${failedCount} 家。`
  };
}

function buildSalesOverviewFetchNotice({
  successCount = 0,
  failedCount = 0,
  pendingCount = 0,
  isFinal = false
} = {}) {
  const parts = [];

  if (successCount > 0) {
    parts.push(`${successCount} 家成功`);
  }

  if (failedCount > 0) {
    parts.push(`${failedCount} 家失败`);
  }

  if (pendingCount > 0) {
    parts.push(`${pendingCount} 家未执行`);
  }

  if (!parts.length) {
    return '经营总览暂无可用结果。';
  }

  const basisNote = isFinal ? ' 今天列的涨跌、筛选和排序统一按昨天同小时口径比较。' : '';
  return `${isFinal ? '经营总览获取完成' : '经营总览获取进度'}：${parts.join('，')}。${basisNote}`;
}

function buildSalesOverviewFailureRow(shop, message) {
  return {
    shopCode: String(shop?.shopCode || '').trim(),
    shopName: String(shop?.shopName || shop?.shopCode || '').trim(),
    currentOperator: String(shop?.currentOperator || '').trim() || '未分配',
    listedCount: null,
    delistedCount: null,
    yesterdayOrderCount: null,
    comparisonOrderCount: null,
    todayOrderCount: null,
    yesterdayGmv: null,
    comparisonGmv: null,
    todayGmv: null,
    yesterdayBuyerCount: null,
    comparisonBuyerCount: null,
    todayBuyerCount: null,
    yesterdayVisitors: null,
    comparisonVisitors: null,
    todayVisitors: null,
    yesterdayViews: null,
    comparisonViews: null,
    todayViews: null,
    yesterdayVisitedGoodsCount: null,
    comparisonVisitedGoodsCount: null,
    todayVisitedGoodsCount: null,
    yesterdayPayRate: null,
    comparisonPayRate: null,
    todayPayRate: null,
    rowStatus: 'error',
    rowError: String(message || '经营总览获取失败').trim(),
    fetchedAt: new Date().toISOString(),
    comparisonHour: ''
  };
}

function ensureSalesOverviewNotAborted(signal) {
  if (signal?.aborted) {
    throw createSalesOverviewAbortError();
  }
}

function createSalesOverviewAbortError() {
  const abortError = new Error('Fetch aborted');
  abortError.name = 'AbortError';
  return abortError;
}

function formatSalesOverviewQueryDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getVisibleShopList() {
  const keyword = String(state.shop.search || '').trim().toLowerCase();
  if (!keyword) {
    return state.shop.available;
  }

  return state.shop.available.filter((shop) => {
    return [
      shop.shopName,
      shop.shopCode,
      shop.currentOperator,
      shop.platform,
      shop.remark
    ].some((value) => String(value || '').toLowerCase().includes(keyword));
  });
}

function getShopAccessScopeLabel() {
  if (!state.auth.user) {
    return '未登录';
  }

  const mode = String(state.shop.scope?.mode || '').trim();
  if (mode === 'all') {
    return '全部店铺';
  }

  if (mode === 'self_and_managed') {
    return '本人 + 被管理运营';
  }

  if (mode === 'self_only') {
    return '我的店铺';
  }

  const accessContext = buildShopAccessContext(state.auth.user);
  if (accessContext.isAdmin) {
    return '全部店铺';
  }

  return accessContext.includesManagedOperators ? '本人 + 被管理运营' : '我的店铺';
}

function getShopPickerDescription() {
  if (!state.auth.user) {
    return '请先登录。';
  }

  if (state.shop.status === 'loading') {
    return '正在加载店铺列表。';
  }

  const mode = String(state.shop.scope?.mode || '').trim();
  if (mode === 'all') {
    return '请选择本次要操作的店铺。';
  }

  if (mode === 'self_and_managed') {
    return '当前显示你与被管理运营名下店铺。';
  }

  if (mode === 'self_only') {
    return `当前仅显示 ${getDisplayName(state.auth.user)} 名下店铺。`;
  }

  if (canViewAllShops(state.auth.user)) {
    return '请选择本次要操作的店铺。';
  }

  if (buildShopAccessContext(state.auth.user).includesManagedOperators) {
    return '当前显示你与被管理运营名下店铺。';
  }

  return `当前仅显示 ${getDisplayName(state.auth.user)} 名下店铺。`;
}

function handleOpenCategoryPicker() {
  if (!state.bridge?.auth || !state.auth.user) {
    return;
  }

  if (!state.shop.selected?.shopCode) {
    window.alert('请先选择店铺，再编辑类目。');
    return;
  }

  openCategoryPicker().catch((error) => {
    console.error(error);
  });
}

async function openCategoryPicker({ force = false } = {}) {
  const selectedShopCode = String(state.shop.selected?.shopCode || '').trim();
  const shouldReset = state.category.shopCode !== selectedShopCode;

  closeSecondaryDrawer();
  state.category.isOpen = true;
  state.category.shopCode = selectedShopCode;
  state.category.error = '';

  if (shouldReset) {
    state.category.rootOptions = [];
    state.category.secondOptions = [];
    state.category.thirdOptions = [];
  }

  seedCategoryDraftFromForm();
  renderCategoryPicker();
  await hydrateCategoryPicker({ force: force || shouldReset });
}

function closeCategoryPicker() {
  state.category.isOpen = false;
  state.category.error = '';
  renderCategoryPicker();
}

function resetCategoryState() {
  state.category = buildInitialCategoryState();
  renderCategoryPicker();
}

function resetSkuSpecState({ preserveSelection = false } = {}) {
  const nextConfig = preserveSelection
    ? normalizeSkuSpecConfigFromForm(null, [])
    : {
        selectedSlots: [createEmptySkuSpecSelection(), createEmptySkuSpecSelection()],
        valueLists: [[], []]
      };
  state.skuSpec = buildInitialSkuSpecState();
  state.skuSpec.selectedSlots = nextConfig.selectedSlots;
  state.skuSpec.valueLists = nextConfig.valueLists;
  renderSkuSpecState();
}

function seedCategoryDraftFromForm() {
  const selection = readCategoryFormSelection();
  state.category.draftLevel1Id = selection.level1Id;
  state.category.draftLevel2Id = selection.level2Id;
  state.category.draftLevel3Id = selection.level3Id;
  state.category.pathHints = splitCategoryPath(selection.pathLabel);
  state.category.notice = '';
}

function readCategoryFormSelection() {
  return {
    pathLabel: String(dom.categoryDataInput?.value || '').trim(),
    level1Id: String(dom.form?.querySelector(`#${CATEGORY_FIELD_IDS.level1}`)?.value || '').trim(),
    level2Id: String(dom.form?.querySelector(`#${CATEGORY_FIELD_IDS.level2}`)?.value || '').trim(),
    level3Id: String(dom.form?.querySelector(`#${CATEGORY_FIELD_IDS.level3}`)?.value || '').trim(),
    leafId: String(dom.form?.querySelector(`#${CATEGORY_FIELD_IDS.leaf}`)?.value || '').trim()
  };
}

function splitCategoryPath(value) {
  return String(value || '')
    .split('>')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStringList(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : [])
    .map((item) => String(item || '').trim())
    .filter((item) => {
      if (!item || seen.has(item)) {
        return false;
      }

      seen.add(item);
      return true;
    });
}

function syncCategorySelectionMeta(selection = null) {
  const stapleNames = normalizeStringList([
    ...(Array.isArray(selection?.stapleNames) ? selection.stapleNames : []),
    ...(Array.isArray(selection?.level1?.stapleNames) ? selection.level1.stapleNames : [])
  ]);

  state.category.selectionMeta = stapleNames.length ? { stapleNames } : null;
}

function buildCurrentCategoryExportMeta() {
  return {
    stapleNames: normalizeStringList([
      ...(findCategoryOption(state.category.rootOptions, readCategoryFormSelection().level1Id)?.stapleNames || []),
      ...(state.category.selectionMeta?.stapleNames || []),
      ...(state.currentTemplate?.categoryMeta?.stapleNames || [])
    ])
  };
}

async function hydrateCategorySelectionMetaFromCurrentForm() {
  const selection = readCategoryFormSelection();
  if (state.category.selectionMeta?.stapleNames?.length) {
    return state.category.selectionMeta;
  }

  const selectedShopCode = String(state.shop.selected?.shopCode || '').trim();
  const level1Id = String(selection.level1Id || '').trim();
  if (!state.bridge?.auth || !state.auth.user || !selectedShopCode || !level1Id) {
    return state.category.selectionMeta;
  }

  let rootOptions = Array.isArray(state.category.rootOptions) ? state.category.rootOptions : [];
  if (!rootOptions.length) {
    const result = await state.bridge.auth.listPublishCategories({
      shopCode: selectedShopCode,
      parentId: '',
      force: false
    });

    if (result.ok) {
      rootOptions = Array.isArray(result.categories) ? result.categories : [];
      state.category.rootOptions = rootOptions;
    }
  }

  const level1 = findCategoryOption(rootOptions, level1Id);
  if (level1?.stapleNames?.length) {
    syncCategorySelectionMeta({
      stapleNames: level1.stapleNames,
      level1
    });
  }

  return state.category.selectionMeta;
}

async function resolveCategorySelectionFromPath({ shopCode, pathHints }) {
  const normalizedShopCode = String(shopCode || '').trim();
  const normalizedPathHints = Array.isArray(pathHints) ? pathHints.filter(Boolean) : [];
  if (!normalizedShopCode || !normalizedPathHints.length || !state.bridge?.auth) {
    return null;
  }

  const rootResult = await state.bridge.auth.listPublishCategories({
    shopCode: normalizedShopCode,
    parentId: '',
    force: false
  });
  if (!rootResult.ok) {
    return null;
  }

  const level1 = (rootResult.categories || []).find((item) => item.name === normalizedPathHints[0]);
  if (!level1) {
    return null;
  }

  const resolved = {
    level1Id: level1.id,
    level2Id: '',
    level3Id: '',
    leafId: level1.isLeaf ? level1.id : '',
    stapleNames: normalizeStringList(level1.stapleNames || [])
  };

  if (normalizedPathHints.length < 2 || level1.isLeaf) {
    return resolved.leafId ? resolved : null;
  }

  const secondResult = await state.bridge.auth.listPublishCategories({
    shopCode: normalizedShopCode,
    parentId: level1.id,
    force: false
  });
  if (!secondResult.ok) {
    return null;
  }

  const level2 = (secondResult.categories || []).find((item) => item.name === normalizedPathHints[1]);
  if (!level2) {
    return null;
  }

  resolved.level2Id = level2.id;
  resolved.leafId = level2.isLeaf ? level2.id : '';

  if (normalizedPathHints.length < 3 || level2.isLeaf) {
    return resolved.leafId ? resolved : null;
  }

  const thirdResult = await state.bridge.auth.listPublishCategories({
    shopCode: normalizedShopCode,
    parentId: level2.id,
    force: false
  });
  if (!thirdResult.ok) {
    return null;
  }

  const level3 = (thirdResult.categories || []).find((item) => item.name === normalizedPathHints[2]);
  if (!level3) {
    return null;
  }

  resolved.level3Id = level3.id;
  resolved.leafId = level3.id;
  return resolved;
}

async function hydrateCategoryPicker({ force = false } = {}) {
  if (!state.bridge?.auth || !state.auth.user || !state.category.shopCode) {
    return;
  }

  state.category.status = 'loading';
  state.category.error = '';
  renderCategoryPicker();

  const rootLoaded = await loadCategoryOptions({
    level: 'root',
    parentId: '',
    force
  });

  if (!rootLoaded) {
    state.category.status = 'error';
    renderCategoryPicker();
    return;
  }

  await syncCategoryDraftWithLoadedOptions({ forceChildren: force });
  state.category.status = state.category.error ? 'error' : 'ready';
  renderCategoryPicker();
  focusCategoryPickerControl();
}

async function loadCategoryOptions({ level, parentId, force = false }) {
  const result = await state.bridge.auth.listPublishCategories({
    shopCode: state.category.shopCode,
    parentId,
    force
  });

  if (!result.ok) {
    state.category.error = result.error?.message || '类目加载失败，请稍后重试。';
    if (level === 'root') {
      state.category.rootOptions = [];
    } else if (level === 'second') {
      state.category.secondOptions = [];
    } else if (level === 'third') {
      state.category.thirdOptions = [];
    }
    return false;
  }

  state.category.error = '';
  const categories = Array.isArray(result.categories) ? result.categories : [];

  if (level === 'root') {
    state.category.rootOptions = categories;
  } else if (level === 'second') {
    state.category.secondOptions = categories;
  } else if (level === 'third') {
    state.category.thirdOptions = categories;
  }

  return true;
}

async function syncCategoryDraftWithLoadedOptions({ forceChildren = false } = {}) {
  const level1Hint = state.category.draftLevel1Id;
  const level2Hint = state.category.draftLevel2Id;
  const level3Hint = state.category.draftLevel3Id;

  state.category.draftLevel1Id = resolveCategoryOptionId(
    state.category.rootOptions,
    level1Hint,
    state.category.pathHints[0]
  );
  state.category.draftLevel2Id = '';
  state.category.draftLevel3Id = '';
  state.category.secondOptions = [];
  state.category.thirdOptions = [];

  const level1Item = findCategoryOption(state.category.rootOptions, state.category.draftLevel1Id);
  if (!level1Item) {
    updateCategoryNotice();
    return;
  }

  if (level1Item.isLeaf) {
    updateCategoryNotice();
    return;
  }

  const secondLoaded = await loadCategoryOptions({
    level: 'second',
    parentId: level1Item.id,
    force: forceChildren
  });

  if (!secondLoaded) {
    updateCategoryNotice();
    return;
  }

  state.category.draftLevel2Id = resolveCategoryOptionId(
    state.category.secondOptions,
    level2Hint,
    state.category.pathHints[1]
  );

  const level2Item = findCategoryOption(state.category.secondOptions, state.category.draftLevel2Id);
  if (!level2Item) {
    updateCategoryNotice();
    return;
  }

  if (level2Item.isLeaf) {
    updateCategoryNotice();
    return;
  }

  const thirdLoaded = await loadCategoryOptions({
    level: 'third',
    parentId: level2Item.id,
    force: forceChildren
  });

  if (!thirdLoaded) {
    updateCategoryNotice();
    return;
  }

  state.category.draftLevel3Id = resolveCategoryOptionId(
    state.category.thirdOptions,
    level3Hint,
    state.category.pathHints[2]
  );
  updateCategoryNotice();
}

function resolveCategoryOptionId(options, idHint, nameHint) {
  const normalizedIdHint = String(idHint || '').trim();
  if (normalizedIdHint && options.some((item) => item.id === normalizedIdHint)) {
    return normalizedIdHint;
  }

  const normalizedNameHint = String(nameHint || '').trim();
  if (!normalizedNameHint) {
    return '';
  }

  return options.find((item) => item.name === normalizedNameHint)?.id || '';
}

function findCategoryOption(options, id) {
  const normalizedId = String(id || '').trim();
  return options.find((item) => item.id === normalizedId) || null;
}

async function handleCategoryLevel1Change(event) {
  const nextId = String(event.target.value || '').trim();
  state.category.draftLevel1Id = nextId;
  state.category.draftLevel2Id = '';
  state.category.draftLevel3Id = '';
  state.category.secondOptions = [];
  state.category.thirdOptions = [];
  state.category.error = '';
  updateCategoryNotice();
  renderCategoryPicker();

  const category = findCategoryOption(state.category.rootOptions, nextId);
  if (!category || category.isLeaf) {
    return;
  }

  state.category.status = 'loading';
  renderCategoryPicker();
  await loadCategoryOptions({
    level: 'second',
    parentId: category.id
  });
  state.category.status = state.category.error ? 'error' : 'ready';
  updateCategoryNotice();
  renderCategoryPicker();
}

async function handleCategoryLevel2Change(event) {
  const nextId = String(event.target.value || '').trim();
  state.category.draftLevel2Id = nextId;
  state.category.draftLevel3Id = '';
  state.category.thirdOptions = [];
  state.category.error = '';
  updateCategoryNotice();
  renderCategoryPicker();

  const category = findCategoryOption(state.category.secondOptions, nextId);
  if (!category || category.isLeaf) {
    return;
  }

  state.category.status = 'loading';
  renderCategoryPicker();
  await loadCategoryOptions({
    level: 'third',
    parentId: category.id
  });
  state.category.status = state.category.error ? 'error' : 'ready';
  updateCategoryNotice();
  renderCategoryPicker();
}

function handleCategoryLevel3Change(event) {
  state.category.draftLevel3Id = String(event.target.value || '').trim();
  state.category.error = '';
  updateCategoryNotice();
  renderCategoryPicker();
}

function updateCategoryNotice() {
  state.category.notice = resolveDraftCategorySelection().notice;
}

function resolveDraftCategorySelection() {
  const level1 = findCategoryOption(state.category.rootOptions, state.category.draftLevel1Id);
  const level2 = findCategoryOption(state.category.secondOptions, state.category.draftLevel2Id);
  const level3 = findCategoryOption(state.category.thirdOptions, state.category.draftLevel3Id);
  const finalItem = level3 || (level2?.isLeaf ? level2 : (level1?.isLeaf ? level1 : null));
  const pathItems = [level1, level2, level3].filter(Boolean);

  return {
    level1,
    level2,
    level3,
    finalItem,
    pathLabel: pathItems.map((item) => item.name).join(' > '),
    notice: level3?.notice || level2?.notice || level1?.notice || ''
  };
}

function renderCategoryPicker() {
  if (!dom.categoryPickerModal) {
    return;
  }

  const isLoading = state.category.status === 'loading';
  const selection = resolveDraftCategorySelection();
  const currentPathLabel = selection.pathLabel || readCategoryFormSelection().pathLabel || '未选择';
  const level2Item = findCategoryOption(state.category.secondOptions, state.category.draftLevel2Id);
  const disableLevel2 = isLoading || !state.category.draftLevel1Id;
  const disableLevel3 = isLoading || !state.category.draftLevel2Id || Boolean(level2Item?.isLeaf);

  dom.categoryPickerModal.hidden = !state.category.isOpen;
  dom.categoryPickerDesc.textContent = state.shop.selected
    ? `当前店铺：${state.shop.selected.shopName || state.shop.selected.shopCode}`
    : '请先选择店铺。';
  dom.categoryPickerSummary.textContent = `当前类目：${currentPathLabel}`;
  dom.categoryPickerError.hidden = !state.category.error;
  dom.categoryPickerError.textContent = state.category.error || '';
  dom.categoryPickerNotice.hidden = !state.category.notice;
  dom.categoryPickerNotice.textContent = state.category.notice || '';
  dom.categoryPickerRefreshBtn.disabled = isLoading || !state.shop.selected?.shopCode;
  dom.categoryPickerConfirmBtn.disabled = isLoading || !selection.finalItem;
  dom.categoryPickerConfirmBtn.textContent = isLoading ? '加载中...' : '确认使用该类目';

  populateCategorySelect(dom.categoryLevel1Select, state.category.rootOptions, state.category.draftLevel1Id, '请选择一级类目');
  populateCategorySelect(dom.categoryLevel2Select, state.category.secondOptions, state.category.draftLevel2Id, '请选择二级类目');
  populateCategorySelect(dom.categoryLevel3Select, state.category.thirdOptions, state.category.draftLevel3Id, '请选择三级类目');

  dom.categoryLevel1Select.disabled = isLoading || !state.shop.selected?.shopCode;
  dom.categoryLevel2Select.disabled = disableLevel2;
  dom.categoryLevel3Select.disabled = disableLevel3;
  dom.closeCategoryPickerBtn.disabled = isLoading;

  if (dom.openCategoryPickerBtn) {
    dom.openCategoryPickerBtn.disabled = !state.auth.user || !state.shop.selected;
  }
}

function populateCategorySelect(select, options, selectedId, placeholder) {
  if (!select) {
    return;
  }

  const html = [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...options.map((item) => {
      return `<option value="${escapeHtml(item.id)}">${escapeHtml(formatCategoryOptionLabel(item))}</option>`;
    })
  ].join('');

  select.innerHTML = html;
  select.value = String(selectedId || '').trim();
}

function formatCategoryOptionLabel(item) {
  const stapleLabel = Array.isArray(item?.stapleNames) && item.stapleNames.length
    ? ` · ${item.stapleNames.join(' / ')}`
    : '';
  return `${item?.name || ''}${stapleLabel}`;
}

function focusCategoryPickerControl() {
  if (!state.category.isOpen || !dom.categoryLevel1Select) {
    return;
  }

  window.requestAnimationFrame(() => {
    if (!dom.categoryLevel1Select.disabled) {
      dom.categoryLevel1Select.focus();
    }
  });
}

async function handleConfirmCategorySelection() {
  const selection = resolveDraftCategorySelection();
  if (!selection.finalItem || !selection.pathLabel) {
    state.category.error = '请完成类目选择后再确认。';
    renderCategoryPicker();
    return;
  }

  const previousSelection = readCategoryFormSelection();
  applyCategorySelectionToForm(selection);
  await hydrateAttributesFromCurrentForm({
    force: true
  });
  closeCategoryPicker();

  const hasChanged = selection.pathLabel !== previousSelection.pathLabel
    || (selection.level1?.id || '') !== previousSelection.level1Id
    || (selection.level2?.id || '') !== previousSelection.level2Id
    || (selection.level3?.id || '') !== previousSelection.level3Id
    || (selection.finalItem?.id || '') !== previousSelection.leafId;

  if (hasChanged) {
    scheduleAutoSave();
    pushLocalLog('info', `商品类目已切换为《${selection.pathLabel}》`);
  }
}

function applyCategorySelectionToForm(selection) {
  setFormControlValue(CATEGORY_FIELD_IDS.display, selection.pathLabel);
  setFormControlValue(CATEGORY_FIELD_IDS.level1, selection.level1?.id || '');
  setFormControlValue(CATEGORY_FIELD_IDS.level2, selection.level2?.id || '');
  setFormControlValue(CATEGORY_FIELD_IDS.level3, selection.level3?.id || '');
  setFormControlValue(CATEGORY_FIELD_IDS.leaf, selection.finalItem?.id || '');
  state.category.pathHints = splitCategoryPath(selection.pathLabel);
  syncCategorySelectionMeta(selection);
}

function setFormControlValue(id, value) {
  const control = dom.form?.querySelector(`#${id}`);
  if (control) {
    control.value = String(value || '');
  }
}

function readSkuSpecSelectionsFromForm(formData = null) {
  if (formData) {
    return normalizeSkuSpecSelections([
      {
        id: String(formData[SKU_SPEC_FIELD_IDS.slot1Id] ?? formData.goodsSpecType1Id ?? '').trim(),
        label: String(formData[SKU_SPEC_FIELD_IDS.slot1Name] ?? formData.goodsSpecType1Name ?? '').trim()
      },
      {
        id: String(formData[SKU_SPEC_FIELD_IDS.slot2Id] ?? formData.goodsSpecType2Id ?? '').trim(),
        label: String(formData[SKU_SPEC_FIELD_IDS.slot2Name] ?? formData.goodsSpecType2Name ?? '').trim()
      }
    ]);
  }

  return normalizeSkuSpecSelections([
    {
      id: String(dom.form?.querySelector(`#${SKU_SPEC_FIELD_IDS.slot1Id}`)?.value || '').trim(),
      label: String(dom.form?.querySelector(`#${SKU_SPEC_FIELD_IDS.slot1Name}`)?.value || '').trim()
    },
    {
      id: String(dom.form?.querySelector(`#${SKU_SPEC_FIELD_IDS.slot2Id}`)?.value || '').trim(),
      label: String(dom.form?.querySelector(`#${SKU_SPEC_FIELD_IDS.slot2Name}`)?.value || '').trim()
    }
  ]);
}

function parseSkuSpecValueField(value) {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(normalizedValue);
    return normalizeSkuSpecValueList(parsed);
  } catch {
    return normalizeSkuSpecValueList(normalizedValue.split('\n'));
  }
}

function normalizeSkuSpecValueList(values, { keepEmpty = false, dedupe = false } = {}) {
  const seenValues = new Set();
  let hasEmptyValue = false;
  const normalizedValues = (Array.isArray(values) ? values : [])
    .map((item) => String(item || '').trim())
    .filter((item) => {
      if (!item) {
        if (!keepEmpty || hasEmptyValue) {
          return false;
        }
        hasEmptyValue = true;
        return true;
      }

      if (dedupe && seenValues.has(item)) {
        return false;
      }
      if (dedupe) {
        seenValues.add(item);
      }
      return true;
    });

  return normalizedValues;
}

function normalizeSkuSpecValueLists(valueLists, options = {}) {
  const normalizedLists = Array.isArray(valueLists) ? valueLists : [];
  return [0, 1].map((slotIndex) => {
    return normalizeSkuSpecValueList(normalizedLists[slotIndex] || [], options);
  });
}

function readSkuSpecValueListsFromForm(formData = null) {
  if (formData) {
    return normalizeSkuSpecValueLists([
      parseSkuSpecValueField(formData[SKU_SPEC_VALUE_FIELD_IDS.slot1Values] ?? formData.goodsSpecType1Values ?? '[]'),
      parseSkuSpecValueField(formData[SKU_SPEC_VALUE_FIELD_IDS.slot2Values] ?? formData.goodsSpecType2Values ?? '[]')
    ]);
  }

  return normalizeSkuSpecValueLists([
    parseSkuSpecValueField(dom.form?.querySelector(`#${SKU_SPEC_VALUE_FIELD_IDS.slot1Values}`)?.value || '[]'),
    parseSkuSpecValueField(dom.form?.querySelector(`#${SKU_SPEC_VALUE_FIELD_IDS.slot2Values}`)?.value || '[]')
  ]);
}

function syncSkuSpecValueListsToForm(valueLists) {
  const normalizedValueLists = normalizeSkuSpecValueLists(valueLists);
  setFormControlValue(SKU_SPEC_VALUE_FIELD_IDS.slot1Values, JSON.stringify(normalizedValueLists[0].filter(Boolean)));
  setFormControlValue(SKU_SPEC_VALUE_FIELD_IDS.slot2Values, JSON.stringify(normalizedValueLists[1].filter(Boolean)));
}

function assignSkuSpecValueListsToFormData(formData, valueLists) {
  const normalizedValueLists = normalizeSkuSpecValueLists(valueLists);
  assignFormDataValue(formData, SKU_SPEC_VALUE_FIELD_IDS.slot1Values, 'goodsSpecType1Values', JSON.stringify(normalizedValueLists[0].filter(Boolean)));
  assignFormDataValue(formData, SKU_SPEC_VALUE_FIELD_IDS.slot2Values, 'goodsSpecType2Values', JSON.stringify(normalizedValueLists[1].filter(Boolean)));
}

function normalizeSkuSpecSelections(selections) {
  const nextSelections = [createEmptySkuSpecSelection(), createEmptySkuSpecSelection()];
  const normalizedSelections = Array.isArray(selections) ? selections : [];
  const seenIds = new Set();
  let cursor = 0;

  normalizedSelections.forEach((selection) => {
    const id = String(selection?.id || '').trim();
    const label = String(selection?.label || '').trim();
    if ((!id && !label) || cursor >= 2) {
      return;
    }

    if (id && seenIds.has(id)) {
      return;
    }

    if (id) {
      seenIds.add(id);
    }

    nextSelections[cursor] = {
      id,
      label
    };
    cursor += 1;
  });

  return nextSelections;
}

function syncSkuSpecSelectionsToForm(selections) {
  const normalizedSelections = normalizeSkuSpecSelections(selections);
  setFormControlValue(SKU_SPEC_FIELD_IDS.slot1Id, normalizedSelections[0]?.id || '');
  setFormControlValue(SKU_SPEC_FIELD_IDS.slot1Name, normalizedSelections[0]?.label || '');
  setFormControlValue(SKU_SPEC_FIELD_IDS.slot2Id, normalizedSelections[1]?.id || '');
  setFormControlValue(SKU_SPEC_FIELD_IDS.slot2Name, normalizedSelections[1]?.label || '');
}

function assignSkuSpecSelectionsToFormData(formData, selections) {
  const normalizedSelections = normalizeSkuSpecSelections(selections);
  assignFormDataValue(formData, SKU_SPEC_FIELD_IDS.slot1Id, 'goodsSpecType1Id', normalizedSelections[0]?.id || '');
  assignFormDataValue(formData, SKU_SPEC_FIELD_IDS.slot1Name, 'goodsSpecType1Name', normalizedSelections[0]?.label || '');
  assignFormDataValue(formData, SKU_SPEC_FIELD_IDS.slot2Id, 'goodsSpecType2Id', normalizedSelections[1]?.id || '');
  assignFormDataValue(formData, SKU_SPEC_FIELD_IDS.slot2Name, 'goodsSpecType2Name', normalizedSelections[1]?.label || '');
}

function normalizeSelectedSkuSpecSlotsAgainstOptions(selections, options) {
  const normalizedSelections = normalizeSkuSpecSelections(selections);
  const normalizedOptions = Array.isArray(options) ? options : [];
  const resolvedSelections = normalizedSelections.map((selection) => {
    if (!selection.id && !selection.label) {
      return createEmptySkuSpecSelection();
    }

    const matchedOption = normalizedOptions.find((option) => {
      return option.id === selection.id || option.label === selection.label;
    });

    if (!matchedOption) {
      return createEmptySkuSpecSelection();
    }

    return {
      id: matchedOption.id,
      label: matchedOption.label
    };
  });

  return normalizeSkuSpecSelections(resolvedSelections);
}

function normalizeSkuSpecConfigFromForm(formData, options) {
  const normalizedSelections = normalizeSelectedSkuSpecSlotsAgainstOptions(
    readSkuSpecSelectionsFromForm(formData),
    options
  );
  const normalizedValueLists = normalizeSkuSpecValueLists(readSkuSpecValueListsFromForm(formData));

  return {
    selectedSlots: normalizedSelections.map((selection, index) => {
      if (!selection.id && !selection.label) {
        normalizedValueLists[index] = [];
      }
      return selection;
    }),
    valueLists: normalizedValueLists
  };
}

function stripTemplateDefaultFormData(formData) {
  return stripFormData(formData, {
    removeDynamicAttributes: true,
    removeSkuRows: true
  });
}

function stripFormData(formData, options = {}) {
  return Object.fromEntries(Object.entries(formData || {}).filter(([key]) => {
    if (options.removeDynamicAttributes && isDynamicAttributeKey(key)) {
      return false;
    }

    if (options.removeSkuRows && isSkuFormKey(key)) {
      return false;
    }

    return true;
  }));
}

function isDynamicAttributeKey(key) {
  const normalizedKey = String(key || '').trim();
  return normalizedKey.startsWith('pddForm_goodsAttribute_') || normalizedKey.startsWith('goodsAttribute[');
}

function isSkuFormKey(key) {
  return /^goodsSkuDetail\[\d+\]\[(specName|groupPrice|singlePrice|stock|weight)\]$/.test(String(key || '').trim());
}

function buildBlankSkuRow() {
  return {
    specName: '',
    groupPrice: '',
    singlePrice: '',
    stock: '',
    weight: ''
  };
}

function normalizeSkuRow(row = {}) {
  return {
    specName: String(row.specName || '').trim(),
    groupPrice: String(row.groupPrice || '').trim(),
    singlePrice: String(row.singlePrice || '').trim(),
    stock: String(row.stock || '').trim(),
    weight: String(row.weight || '').trim()
  };
}

function extractSkuRowsFromFormData(formData, { fallbackRows = [] } = {}) {
  const groupedRows = new Map();

  Object.entries(formData || {}).forEach(([key, value]) => {
    const match = String(key || '').trim().match(/^goodsSkuDetail\[(\d+)\]\[(specName|groupPrice|singlePrice|stock|weight)\]$/);
    if (!match) {
      return;
    }

    const index = Number(match[1]);
    const field = match[2];
    if (!groupedRows.has(index)) {
      groupedRows.set(index, buildBlankSkuRow());
    }

    groupedRows.get(index)[field] = String(value ?? '').trim();
  });

  const rows = Array.from(groupedRows.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([, row]) => normalizeSkuRow(row))
    .filter((row) => {
      return SKU_FIELD_NAMES.some((fieldName) => String(row[fieldName] || '').trim() !== '');
    });

  if (rows.length) {
    return rows;
  }

  return (Array.isArray(fallbackRows) ? fallbackRows : []).map((row) => normalizeSkuRow(row));
}

function splitSkuSpecName(value) {
  return String(value || '')
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCurrentSkuRows() {
  return extractSkuRowsFromFormData(serializeForm(), { fallbackRows: [] });
}

function getCurrentSkuThumbRefs() {
  const refs = collectImageRefs()?.skuThumbs;
  return Array.isArray(refs) ? refs.filter((ref) => ref !== undefined) : [];
}

function getFilledSkuSpecValueLists(valueLists = null) {
  return normalizeSkuSpecValueLists(valueLists || state.skuSpec.valueLists, { dedupe: true }).map((values) => {
    return values.map((item) => String(item || '').trim()).filter(Boolean);
  });
}

function buildSkuCombinationSpecNames(selectedSlots, valueLists) {
  const normalizedSelections = normalizeSkuSpecSelections(selectedSlots);
  const normalizedValueLists = getFilledSkuSpecValueLists(valueLists);
  const activeSlots = normalizedSelections
    .map((selection, slotIndex) => ({
      selection,
      values: normalizedValueLists[slotIndex] || []
    }))
    .filter((item) => item.selection?.id && item.values.length);

  if (!activeSlots.length) {
    return [];
  }

  if (activeSlots.length === 1) {
    return activeSlots[0].values.map((value) => value.trim()).filter(Boolean);
  }

  const [firstSlot, secondSlot] = activeSlots;
  const combinations = [];

  firstSlot.values.forEach((firstValue) => {
    secondSlot.values.forEach((secondValue) => {
      const parts = [String(firstValue || '').trim(), String(secondValue || '').trim()].filter(Boolean);
      if (parts.length) {
        combinations.push(parts.join(' / '));
      }
    });
  });

  return combinations;
}

function buildDefaultGeneratedSkuRow(specName) {
  return {
    specName: String(specName || '').trim(),
    groupPrice: '',
    singlePrice: '',
    stock: '',
    weight: ''
  };
}

function buildGeneratedSkuRows({ selectedSlots, valueLists, existingRows, existingRefs }) {
  const existingMap = new Map();
  (Array.isArray(existingRows) ? existingRows : []).forEach((row, index) => {
    const specName = String(row?.specName || '').trim();
    if (!specName) {
      return;
    }

    existingMap.set(specName, {
      row: normalizeSkuRow(row),
      ref: Array.isArray(existingRefs) ? existingRefs[index] || null : null
    });
  });

  const desiredSpecNames = buildSkuCombinationSpecNames(selectedSlots, valueLists);
  const usedSpecNames = new Set();
  const rows = desiredSpecNames.map((specName) => {
    usedSpecNames.add(specName);
    const existingEntry = existingMap.get(specName);
    return existingEntry
      ? { ...existingEntry.row, specName }
      : buildDefaultGeneratedSkuRow(specName);
  });
  const refs = desiredSpecNames.map((specName) => existingMap.get(specName)?.ref || null);
  const removedRefs = Array.from(existingMap.entries())
    .filter(([specName]) => !usedSpecNames.has(specName))
    .map(([, entry]) => entry.ref)
    .filter(Boolean);

  return {
    rows,
    refs,
    removedRefs
  };
}

async function rebuildSkuRowsFromSpecConfig({ existingRows = null, existingRefs = null, clearWhenEmpty = true } = {}) {
  const sourceRows = Array.isArray(existingRows) ? existingRows : getCurrentSkuRows();
  const sourceRefs = Array.isArray(existingRefs) ? existingRefs : getCurrentSkuThumbRefs();
  const desiredSpecNames = buildSkuCombinationSpecNames(state.skuSpec.selectedSlots, state.skuSpec.valueLists);
  if (!desiredSpecNames.length && !clearWhenEmpty) {
    return;
  }

  const generated = buildGeneratedSkuRows({
    selectedSlots: state.skuSpec.selectedSlots,
    valueLists: state.skuSpec.valueLists,
    existingRows: sourceRows,
    existingRefs: sourceRefs
  });

  renderSkuRows(generated.rows, {
    imageRefs: generated.refs
  });

  if (generated.removedRefs.length) {
    await cleanupAssetRefs(generated.removedRefs);
  }
}

function queueSkuRowsFromSpecConfigRebuild(delay = 0) {
  window.clearTimeout(state.skuSpecRebuildTimer);

  const run = () => {
    state.skuSpecRebuildTimer = null;
    rebuildSkuRowsFromSpecConfig().catch((error) => {
      console.error(error);
    });
  };

  if (!Number.isFinite(delay) || delay <= 0) {
    run();
    return;
  }

  state.skuSpecRebuildTimer = window.setTimeout(run, delay);
}

function buildSkuWarningMarkup() {
  return [
    '<div class="sku-warning">',
    '<span class="alert-pill">!</span>',
    '<span>发布商品时添加的规格不会保存到供应链。V1 自动化只做辅助填充，不会自动发布。</span>',
    '</div>'
  ].join('');
}

function buildSkuSpecTypeSelectOptions(options, selectedSlots, slotIndex) {
  const normalizedOptions = Array.isArray(options) ? options : [];
  const normalizedSelections = normalizeSkuSpecSelections(selectedSlots);
  const currentSelectionId = normalizedSelections[slotIndex]?.id || '';
  const otherSlotId = normalizedSelections[slotIndex === 0 ? 1 : 0]?.id || '';

  return [
    '<option value="">请选择规格类型</option>',
    ...normalizedOptions.map((option) => {
      const isDisabled = option.id === otherSlotId && option.id !== currentSelectionId;
      const recommendedSuffix = option.isRecommended ? ' · 推荐' : '';
      return `<option value="${escapeHtml(option.id)}"${isDisabled ? ' disabled' : ''}>${escapeHtml(`${option.label}${recommendedSuffix}`)}</option>`;
    })
  ].join('');
}

function buildSkuSpecValueEditorMarkup(valueLists, slotIndex) {
  const normalizedValueLists = normalizeSkuSpecValueLists(valueLists, { keepEmpty: true });
  const values = normalizedValueLists[slotIndex] || [];

  return [
    '<div class="sku-spec-values">',
    values.length
      ? values.map((value, valueIndex) => {
        return [
          '<div class="sku-spec-value-item">',
          `<input class="sku-spec-value-item__input" type="text" value="${escapeHtml(value)}" placeholder="请输入规格名称" data-sku-spec-value-slot="${slotIndex}" data-sku-spec-value-index="${valueIndex}">`,
          `<button type="button" class="text-button sku-spec-value-item__remove" data-sku-spec-remove-slot="${slotIndex}" data-sku-spec-remove-index="${valueIndex}">删除</button>`,
          '</div>'
        ].join('');
      }).join('')
      : '<div class="empty-state empty-state--compact sku-spec-values__empty">暂无规格值，请点击下方按钮新增。</div>',
    '</div>',
    `<div class="sku-spec-values__actions"><button type="button" class="text-button" data-sku-spec-add-slot="${slotIndex}">新增规格值</button></div>`
  ].join('');
}

function buildSkuSpecBoardMarkup(options, selectedSlots, valueLists) {
  const normalizedSelections = normalizeSkuSpecSelections(selectedSlots);
  const normalizedValueLists = normalizeSkuSpecValueLists(valueLists, { keepEmpty: true });
  const selectedCount = normalizedSelections.filter((item) => item.id).length;
  const groupsMarkup = [0, 1].map((slotIndex) => {
    const currentSelection = normalizedSelections[slotIndex];
    const selectionId = currentSelection?.id || '';
    return [
      '<section class="sku-spec-editor">',
      '<div class="sku-spec-editor__head">',
      `<div class="sku-spec-editor__label">${escapeHtml(SKU_DIMENSION_LABELS[slotIndex] || `规格${slotIndex + 1}`)}</div>`,
      '<div class="sku-spec-editor__controls">',
      `<select class="sku-spec-editor__select" data-sku-spec-select-slot="${slotIndex}">${buildSkuSpecTypeSelectOptions(options, normalizedSelections, slotIndex)}</select>`,
      selectionId ? `<button type="button" class="text-button" data-sku-spec-clear-slot="${slotIndex}">删除规格类型</button>` : '',
      '</div>',
      '</div>',
      selectionId
        ? buildSkuSpecValueEditorMarkup(normalizedValueLists, slotIndex)
        : '<div class="empty-state empty-state--compact">请选择规格类型后，再录入规格值。</div>',
      '</section>'
    ].join('');
  }).join('');

  return [
    `<div class="sku-spec-board__meta">最多添加 2 个商品规格类型，当前已选 ${selectedCount}/2 个，规格类型会自动去重。</div>`,
    groupsMarkup,
    buildSkuWarningMarkup()
  ].join('');
}

function renderSkuSpecState() {
  if (!dom.goodsSkuBoard) {
    return;
  }

  const status = state.skuSpec.status || 'idle';
  const fallbackMessage = getSkuSpecFallbackMessage();

  if (status === 'loading') {
    dom.goodsSkuBoard.innerHTML = [
      '<div class="empty-state empty-state--compact">正在加载当前三级类目的可选规格...</div>',
      buildSkuWarningMarkup()
    ].join('');
    return;
  }

  if (status === 'error') {
    dom.goodsSkuBoard.innerHTML = [
      `<div class="empty-state empty-state--compact">${escapeHtml(state.skuSpec.error || '商品规格加载失败，请稍后重试。')}</div>`,
      buildSkuWarningMarkup()
    ].join('');
    return;
  }

  if (!state.skuSpec.options.length) {
    dom.goodsSkuBoard.innerHTML = [
      `<div class="empty-state empty-state--compact">${escapeHtml(state.skuSpec.message || fallbackMessage)}</div>`,
      buildSkuWarningMarkup()
    ].join('');
    return;
  }

  dom.goodsSkuBoard.innerHTML = buildSkuSpecBoardMarkup(
    state.skuSpec.options,
    state.skuSpec.selectedSlots,
    state.skuSpec.valueLists
  );
  [0, 1].forEach((slotIndex) => {
    const select = dom.goodsSkuBoard.querySelector(`[data-sku-spec-select-slot="${slotIndex}"]`);
    if (select) {
      select.value = state.skuSpec.selectedSlots[slotIndex]?.id || '';
    }
  });
}

function resolveSkuSpecValueInputContext(target) {
  const input = target?.closest?.('[data-sku-spec-value-slot]');
  if (!input || !dom.goodsSkuBoard?.contains(input)) {
    return null;
  }

  const slotIndex = Number(input.dataset.skuSpecValueSlot);
  const valueIndex = Number(input.dataset.skuSpecValueIndex);
  if (!Number.isFinite(slotIndex) || !Number.isFinite(valueIndex) || slotIndex < 0 || slotIndex > 1) {
    return null;
  }

  return {
    input,
    slotIndex,
    valueIndex
  };
}

function restoreSkuSpecValueInputFocus(slotIndex, valueIndex, selectionStart = null, selectionEnd = null) {
  if (!dom.goodsSkuBoard) {
    return;
  }

  const nextInput = dom.goodsSkuBoard.querySelector(
    `[data-sku-spec-value-slot="${slotIndex}"][data-sku-spec-value-index="${valueIndex}"]`
  );
  if (!nextInput) {
    return;
  }

  nextInput.focus();
  if (typeof nextInput.setSelectionRange !== 'function') {
    return;
  }

  const maxPosition = nextInput.value.length;
  const fallbackPosition = maxPosition;
  const safeStart = Number.isFinite(selectionStart)
    ? Math.min(Math.max(selectionStart, 0), maxPosition)
    : fallbackPosition;
  const safeEnd = Number.isFinite(selectionEnd)
    ? Math.min(Math.max(selectionEnd, safeStart), maxPosition)
    : safeStart;
  nextInput.setSelectionRange(safeStart, safeEnd);
}

function areSkuSpecValueListsEqual(left, right, options = {}) {
  const normalizedLeft = normalizeSkuSpecValueLists(left, options);
  const normalizedRight = normalizeSkuSpecValueLists(right, options);

  return [0, 1].every((slotIndex) => {
    const leftValues = normalizedLeft[slotIndex] || [];
    const rightValues = normalizedRight[slotIndex] || [];
    return leftValues.length === rightValues.length
      && leftValues.every((value, index) => value === rightValues[index]);
  });
}

function commitSkuSpecBoardInputValue({
  slotIndex,
  valueIndex,
  rawValue,
  restoreFocus = false,
  selectionStart = null,
  selectionEnd = null
}) {
  const currentValueLists = normalizeSkuSpecValueLists(state.skuSpec.valueLists, { keepEmpty: true });
  const nextValueLists = currentValueLists.map((values) => [...values]);
  if (!Array.isArray(nextValueLists[slotIndex])) {
    nextValueLists[slotIndex] = [];
  }

  nextValueLists[slotIndex][valueIndex] = String(rawValue || '');
  const normalizedLists = normalizeSkuSpecValueLists(nextValueLists, { keepEmpty: true });
  const uiNeedsRender = normalizedLists[slotIndex].length !== nextValueLists[slotIndex].length
    || normalizedLists[slotIndex].some((value, index) => value !== nextValueLists[slotIndex][index]);
  const stateChanged = !areSkuSpecValueListsEqual(currentValueLists, normalizedLists, { keepEmpty: true });

  if (!stateChanged && !uiNeedsRender) {
    return;
  }

  if (stateChanged) {
    state.skuSpec.valueLists = normalizedLists;
    syncSkuSpecValueListsToForm(state.skuSpec.valueLists);
  }

  if (uiNeedsRender) {
    renderSkuSpecState();
    if (restoreFocus) {
      restoreSkuSpecValueInputFocus(slotIndex, valueIndex, selectionStart, selectionEnd);
    }
  }

  if (!stateChanged) {
    return;
  }

  queueSkuRowsFromSpecConfigRebuild(120);
  scheduleAutoSave();
}

function handleSkuSpecBoardCompositionStart(event) {
  const context = resolveSkuSpecValueInputContext(event.target);
  if (!context) {
    return;
  }

  context.input.dataset.skuSpecComposing = 'true';
}

function handleSkuSpecBoardCompositionEnd(event) {
  const context = resolveSkuSpecValueInputContext(event.target);
  if (!context) {
    return;
  }

  delete context.input.dataset.skuSpecComposing;
  commitSkuSpecBoardInputValue({
    slotIndex: context.slotIndex,
    valueIndex: context.valueIndex,
    rawValue: context.input.value,
    restoreFocus: true,
    selectionStart: context.input.selectionStart,
    selectionEnd: context.input.selectionEnd
  });
}

function handleSkuSpecBoardClick(event) {
  const clearTrigger = event.target.closest('[data-sku-spec-clear-slot]');
  if (clearTrigger && dom.goodsSkuBoard?.contains(clearTrigger)) {
    const slotIndex = Number(clearTrigger.dataset.skuSpecClearSlot);
    if (!Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex > 1) {
      return;
    }

    state.skuSpec.selectedSlots[slotIndex] = createEmptySkuSpecSelection();
    state.skuSpec.valueLists[slotIndex] = [];
    syncSkuSpecSelectionsToForm(state.skuSpec.selectedSlots);
    syncSkuSpecValueListsToForm(state.skuSpec.valueLists);
    renderSkuSpecState();
    queueSkuRowsFromSpecConfigRebuild();
    scheduleAutoSave();
    return;
  }

  const addValueTrigger = event.target.closest('[data-sku-spec-add-slot]');
  if (addValueTrigger && dom.goodsSkuBoard?.contains(addValueTrigger)) {
    const slotIndex = Number(addValueTrigger.dataset.skuSpecAddSlot);
    if (!Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex > 1) {
      return;
    }

    const nextValueLists = normalizeSkuSpecValueLists(state.skuSpec.valueLists, { keepEmpty: true });
    const existingEmptyIndex = nextValueLists[slotIndex].findIndex((value) => !String(value || '').trim());
    if (existingEmptyIndex !== -1) {
      restoreSkuSpecValueInputFocus(slotIndex, existingEmptyIndex);
      return;
    }

    nextValueLists[slotIndex] = [...nextValueLists[slotIndex], ''];
    state.skuSpec.valueLists = normalizeSkuSpecValueLists(nextValueLists, { keepEmpty: true });
    renderSkuSpecState();
    restoreSkuSpecValueInputFocus(slotIndex, state.skuSpec.valueLists[slotIndex].length - 1);
    return;
  }

  const removeValueTrigger = event.target.closest('[data-sku-spec-remove-slot]');
  if (!removeValueTrigger || !dom.goodsSkuBoard?.contains(removeValueTrigger)) {
    return;
  }

  const slotIndex = Number(removeValueTrigger.dataset.skuSpecRemoveSlot);
  const valueIndex = Number(removeValueTrigger.dataset.skuSpecRemoveIndex);
  if (!Number.isFinite(slotIndex) || !Number.isFinite(valueIndex) || slotIndex < 0 || slotIndex > 1) {
    return;
  }

  const nextValueLists = normalizeSkuSpecValueLists(state.skuSpec.valueLists, { keepEmpty: true });
  nextValueLists[slotIndex].splice(valueIndex, 1);
  state.skuSpec.valueLists = normalizeSkuSpecValueLists(nextValueLists, { keepEmpty: true });
  syncSkuSpecValueListsToForm(state.skuSpec.valueLists);
  renderSkuSpecState();
  queueSkuRowsFromSpecConfigRebuild();
  scheduleAutoSave();
}

function handleSkuSpecBoardChange(event) {
  const select = event.target.closest('[data-sku-spec-select-slot]');
  if (!select || !dom.goodsSkuBoard?.contains(select)) {
    return;
  }

  const slotIndex = Number(select.dataset.skuSpecSelectSlot);
  const optionId = String(select.value || '').trim();
  if (!Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex > 1) {
    return;
  }

  const nextSelections = normalizeSkuSpecSelections(state.skuSpec.selectedSlots);
  const previousSelectionId = nextSelections[slotIndex]?.id || '';
  const otherSelection = nextSelections[slotIndex === 0 ? 1 : 0];
  if (optionId && otherSelection?.id === optionId) {
    select.value = nextSelections[slotIndex]?.id || '';
    return;
  }

  const matchedOption = state.skuSpec.options.find((option) => option.id === optionId) || null;
  nextSelections[slotIndex] = matchedOption
    ? { id: matchedOption.id, label: matchedOption.label }
    : createEmptySkuSpecSelection();

  if (!matchedOption || previousSelectionId !== optionId) {
    state.skuSpec.valueLists[slotIndex] = [];
  } else if (!Array.isArray(state.skuSpec.valueLists[slotIndex]) || !state.skuSpec.valueLists[slotIndex].length) {
    state.skuSpec.valueLists[slotIndex] = [];
  }

  state.skuSpec.selectedSlots = normalizeSkuSpecSelections(nextSelections);
  state.skuSpec.valueLists = normalizeSkuSpecValueLists(state.skuSpec.valueLists, { keepEmpty: true });
  syncSkuSpecSelectionsToForm(state.skuSpec.selectedSlots);
  syncSkuSpecValueListsToForm(state.skuSpec.valueLists);
  renderSkuSpecState();
  queueSkuRowsFromSpecConfigRebuild();
  scheduleAutoSave();
}

function handleSkuSpecBoardInput(event) {
  const context = resolveSkuSpecValueInputContext(event.target);
  if (!context) {
    return;
  }

  if (event.isComposing || context.input.dataset.skuSpecComposing === 'true') {
    return;
  }

  commitSkuSpecBoardInputValue({
    slotIndex: context.slotIndex,
    valueIndex: context.valueIndex,
    rawValue: context.input.value,
    restoreFocus: true,
    selectionStart: context.input.selectionStart,
    selectionEnd: context.input.selectionEnd
  });
}

function buildSkuRowMarkup(row, index) {
  return [
    '<tr>',
    `<td class="sku-table__cell sku-table__cell--image"><div id="pddForm_goodsSkuDetail_${index}_pic" class="image-slot image-slot--sku" data-image-zone="sku-thumb" data-asset-zone="skuThumbs" data-slot-index="${index}" data-frame-label="SKU图${index + 1}"><input type="file" accept="image/*"></div></td>`,
    `<td class="sku-table__cell sku-table__cell--name"><input class="sku-table__input sku-table__input--name" name="goodsSkuDetail[${index}][specName]" type="text" value="${escapeHtml(row.specName)}" placeholder="请输入规格名" readonly></td>`,
    `<td class="sku-table__cell"><input class="sku-table__input" name="goodsSkuDetail[${index}][groupPrice]" type="number" step="0.01" value="${escapeHtml(row.groupPrice)}"></td>`,
    `<td class="sku-table__cell"><input class="sku-table__input" name="goodsSkuDetail[${index}][singlePrice]" type="number" step="0.01" value="${escapeHtml(row.singlePrice)}"></td>`,
    `<td class="sku-table__cell"><input class="sku-table__input" name="goodsSkuDetail[${index}][stock]" type="number" value="${escapeHtml(row.stock)}"></td>`,
    `<td class="sku-table__cell"><input class="sku-table__input" name="goodsSkuDetail[${index}][weight]" type="number" step="0.01" value="${escapeHtml(row.weight)}"></td>`,
    '</tr>'
  ].join('');
}

function renderSkuRows(rows, { imageRefs = null } = {}) {
  if (!dom.goodsSkuBoard || !dom.goodsSkuTableBody) {
    return;
  }

  const normalizedRows = (Array.isArray(rows) ? rows : []).map((row) => normalizeSkuRow(row));
  const resolvedRefs = Array.isArray(imageRefs) ? imageRefs : getCurrentSkuThumbRefs();
  dom.goodsSkuTableBody.innerHTML = normalizedRows.length
    ? normalizedRows.map((row, index) => buildSkuRowMarkup(row, index)).join('')
    : '<tr class="sku-table__empty-row"><td class="sku-table__empty" colspan="6"><div class="empty-state">暂无SKU，请先配置规格类型和规格值。</div></td></tr>';

  state.slotRegistry.skuThumbs = [];
  Array.from(dom.goodsSkuTableBody.querySelectorAll('[data-asset-zone="skuThumbs"]')).forEach((slot) => {
    registerImageSlot(slot);
  });

  Array.from(state.slotRegistry.skuThumbs || []).forEach((slot, index) => {
    setSlotAsset(slot, resolvedRefs[index] || null);
  });

  renderWorkspaceMeta();
}

function buildAttributeControlId(refPid) {
  return `pddForm_goodsAttribute_${refPid}`;
}

function buildAttributeControlName(refPid) {
  return `goodsAttribute[${refPid}]`;
}

function extractAttributeRefPidFromKey(key) {
  const normalizedKey = String(key || '').trim();
  const match = normalizedKey.match(/^pddForm_goodsAttribute_(\d+)$/) || normalizedKey.match(/^goodsAttribute\[(\d+)\]$/);
  return match?.[1] || '';
}

function buildCurrentAttributeLabelMap() {
  const result = {};

  (Array.isArray(state.attribute.schema) ? state.attribute.schema : []).forEach((attribute) => {
    const refPid = String(attribute?.refPid || '').trim();
    const label = String(attribute?.label || '').trim();
    if (refPid && label) {
      result[refPid] = label;
    }
  });

  Array.from(dom.goodsAttributeContainer?.querySelectorAll('label.attribute-card') || []).forEach((card) => {
    const label = String(card.querySelector('.attribute-card__label')?.textContent || '').trim();
    const control = card.querySelector('input, textarea, select');
    const refPid = extractAttributeRefPidFromKey(control?.id || control?.name || '');
    if (refPid && label) {
      result[refPid] = label;
    }
  });

  return result;
}

function resolveAttributePlaceholder(attribute) {
  if (attribute.controlType === 1 && attribute.options.length) {
    return `请选择${attribute.label}`;
  }

  return attribute.topTip || attribute.bottomTip || '请输入';
}

function buildAttributeInputMaxLength(attribute) {
  const maxValue = Number(attribute?.maxValue);
  return Number.isFinite(maxValue) && maxValue > 0 ? ` maxlength="${maxValue}"` : '';
}

function getCurrentLeafCategoryId(formData = null) {
  if (formData) {
    return String(
      formData[CATEGORY_FIELD_IDS.leaf]
      ?? formData[CATEGORY_FIELD_IDS.level3]
      ?? ''
    ).trim();
  }

  return String(
    dom.form?.querySelector(`#${CATEGORY_FIELD_IDS.leaf}`)?.value
    || dom.form?.querySelector(`#${CATEGORY_FIELD_IDS.level3}`)?.value
    || ''
  ).trim();
}

function resetAttributeState({ preserveMessage = false } = {}) {
  const previousMessage = state.attribute.message;
  state.attribute = buildInitialAttributeState();
  if (preserveMessage) {
    state.attribute.message = previousMessage;
  }
  renderAttributeState();
}

async function hydrateAttributesFromCurrentForm({ force = false, formData = null } = {}) {
  if (!dom.form) {
    return;
  }

  let snapshot = formData || serializeForm();
  let leafCategoryId = getCurrentLeafCategoryId(snapshot);
  const selectedShopCode = String(state.shop.selected?.shopCode || '').trim();

  if (!state.bridge?.auth || !state.auth.user) {
    resetAttributeState();
    resetSkuSpecState({ preserveSelection: true });
    return;
  }

  if (!selectedShopCode) {
    resetAttributeState();
    resetSkuSpecState({ preserveSelection: true });
    return;
  }

  if (!leafCategoryId) {
    const resolvedSelection = await resolveCategorySelectionFromPath({
      shopCode: selectedShopCode,
      pathHints: splitCategoryPath(snapshot[CATEGORY_FIELD_IDS.display] ?? snapshot.categoryData)
    });

    if (resolvedSelection?.leafId) {
      syncCategorySelectionMeta(resolvedSelection);
      setFormControlValue(CATEGORY_FIELD_IDS.level1, resolvedSelection.level1Id);
      setFormControlValue(CATEGORY_FIELD_IDS.level2, resolvedSelection.level2Id);
      setFormControlValue(CATEGORY_FIELD_IDS.level3, resolvedSelection.level3Id);
      setFormControlValue(CATEGORY_FIELD_IDS.leaf, resolvedSelection.leafId);
      snapshot = {
        ...snapshot,
        [CATEGORY_FIELD_IDS.level1]: resolvedSelection.level1Id,
        categoryId1: resolvedSelection.level1Id,
        [CATEGORY_FIELD_IDS.level2]: resolvedSelection.level2Id,
        categoryId2: resolvedSelection.level2Id,
        [CATEGORY_FIELD_IDS.level3]: resolvedSelection.level3Id,
        categoryId3: resolvedSelection.level3Id,
        [CATEGORY_FIELD_IDS.leaf]: resolvedSelection.leafId,
        leafCategoryId: resolvedSelection.leafId
      };
      leafCategoryId = resolvedSelection.leafId;
    } else {
      state.attribute = buildInitialAttributeState();
      state.attribute.shopCode = selectedShopCode;
      state.attribute.message = '请先选择三级类目。';
      renderAttributeState();
      resetSkuSpecState({ preserveSelection: true });
      return;
    }
  }

  const hydrateSkuSpecPromise = hydrateSkuSpecOptionsFromCurrentForm({
    force,
    formData: snapshot
  });

  if (!force
    && state.attribute.status === 'ready'
    && state.attribute.shopCode === selectedShopCode
    && state.attribute.categoryId === leafCategoryId
    && state.attribute.schema.length) {
    await hydrateSkuSpecPromise;
    renderAttributeState();
    fillForm(snapshot);
    syncSkuSpecSelectionsToForm(state.skuSpec.selectedSlots);
    syncSkuSpecValueListsToForm(state.skuSpec.valueLists);
    await rebuildSkuRowsFromSpecConfig({ clearWhenEmpty: false });
    return;
  }

  state.attribute.status = 'loading';
  state.attribute.error = '';
  state.attribute.message = '正在加载当前三级类目的商品属性...';
  state.attribute.shopCode = selectedShopCode;
  state.attribute.categoryId = leafCategoryId;
  renderAttributeState();

  const result = await state.bridge.auth.listCategoryAttributes({
    shopCode: selectedShopCode,
    catId: leafCategoryId,
    force
  });

  if (selectedShopCode !== String(state.shop.selected?.shopCode || '').trim() || leafCategoryId !== getCurrentLeafCategoryId()) {
    return;
  }

  if (!result.ok) {
    state.attribute.status = 'error';
    state.attribute.error = result.error?.message || '商品属性加载失败，请稍后重试。';
    state.attribute.message = '当前三级类目的商品属性未能加载成功。';
    state.attribute.schema = [];
    await hydrateSkuSpecPromise;
    renderAttributeState();
    syncSkuSpecSelectionsToForm(state.skuSpec.selectedSlots);
    syncSkuSpecValueListsToForm(state.skuSpec.valueLists);
    await rebuildSkuRowsFromSpecConfig({ clearWhenEmpty: false });
    return;
  }

  state.attribute.status = 'ready';
  state.attribute.error = '';
  state.attribute.schema = Array.isArray(result.attributes) ? result.attributes : [];
  state.attribute.message = state.attribute.schema.length
    ? `已加载 ${state.attribute.schema.length} 个商品属性，可根据当前三级类目手动调整。`
    : '当前三级类目暂无可编辑商品属性。';
  renderAttributeState();
  await hydrateSkuSpecPromise;
  fillForm(snapshot);
  syncSkuSpecSelectionsToForm(state.skuSpec.selectedSlots);
  syncSkuSpecValueListsToForm(state.skuSpec.valueLists);
  await rebuildSkuRowsFromSpecConfig({ clearWhenEmpty: false });
}

function renderTemplateExport() {
  if (!dom.templateExportStatus) {
    return;
  }

  const status = state.templateExport.status || 'idle';
  dom.templateExportStatus.className = `status-pill status-pill--${status}`;
  dom.templateExportStatus.textContent = toTitleCase(status);
  dom.templateExportSummary.textContent = state.templateExport.summary;
  dom.templateExportPath.textContent = state.templateExport.path;
  dom.templateExportOutput.textContent = state.templateExport.output;
  dom.templateExportError.hidden = !state.templateExport.error;
  dom.templateExportError.textContent = state.templateExport.error || '';
  dom.exportTemplateBtn.disabled = !state.bridge?.template || !state.currentTemplateId || status === 'loading';
  dom.openExportFolderBtn.disabled = !state.bridge?.workspace?.openPath || !state.templateExport.exportRoot;

  if (dom.workspaceExportSummary) {
    dom.workspaceExportSummary.textContent = state.templateExport.summary;
  }

  if (dom.workspaceExportPath) {
    dom.workspaceExportPath.textContent = state.templateExport.path;
  }

  renderWorkspaceMeta();
}

async function handleExportTemplateToFolder() {
  if (!state.bridge?.template || !state.currentTemplateId) {
    window.alert('请先保存并选择一个模板。');
    return;
  }

  const saved = await saveCurrentTemplate({ silent: true });
  state.templateExport.status = 'loading';
  state.templateExport.summary = '正在导出当前模板...';
  state.templateExport.path = '请选择目标文件夹，系统会自动写入模板 JSON 和关联素材。';
  state.templateExport.output = '导出进行中...';
  state.templateExport.error = '';
  renderTemplateExport();

  const result = await state.bridge.template.exportToFolder(saved.id);

  if (!result?.ok) {
    if (result?.canceled) {
      state.templateExport.status = 'idle';
      state.templateExport.summary = '已取消导出';
      state.templateExport.path = '未选择导出目录。';
      state.templateExport.output = '导出已取消。';
      state.templateExport.error = '';
      state.templateExport.exportRoot = '';
      renderTemplateExport();
      return;
    }

    state.templateExport.status = 'error';
    state.templateExport.summary = '模板导出失败';
    state.templateExport.path = state.templateExport.path;
    state.templateExport.output = '导出失败，没有生成可用的模板快照。';
    state.templateExport.error = result?.error?.message || '导出失败，请稍后重试。';
    state.templateExport.exportRoot = '';
    renderTemplateExport();
    pushLocalLog('error', `模板导出失败：${state.templateExport.error}`);
    return;
  }

  state.templateExport.status = 'success';
  state.templateExport.summary = `模板已导出：${result.templateName}`;
  state.templateExport.path = result.exportRoot || '导出目录未知';
  state.templateExport.output = safeStringifyForDisplay({
    templatePath: result.templatePath,
    exportRoot: result.exportRoot,
    assetCount: result.assetCount
  });
  state.templateExport.error = '';
  state.templateExport.exportRoot = result.exportRoot || '';
  renderTemplateExport();
  pushLocalLog('info', `模板已导出到 ${result.exportRoot}，共携带 ${result.assetCount} 个素材文件`);
}

async function handleOpenExportFolder() {
  if (!state.bridge?.workspace?.openPath || !state.templateExport.exportRoot) {
    return;
  }

  await state.bridge.workspace.openPath(state.templateExport.exportRoot);
}

function safeStringifyForDisplay(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return `结果无法序列化：${error instanceof Error ? error.message : String(error)}`;
  }
}

function focusShopSearchInput() {
  if (!shouldShowShopSelectionPage() || !dom.shopSearchInput) {
    return;
  }

  window.requestAnimationFrame(() => {
    if (dom.shopSearchInput.disabled) {
      return;
    }

    dom.shopSearchInput.focus();
    dom.shopSearchInput.select();
  });
}

function renderBridgeMode() {
  dom.webModeNotice.hidden = Boolean(state.bridge);
}

async function hydrateWorkspace() {
  if (!state.bridge) {
    return;
  }

  state.workspace = await state.bridge.workspace.getPaths();
  renderWorkspaceSummary();
}

async function hydrateTemplates() {
  if (!state.bridge) {
    state.currentTemplateId = 'browser-local';
    state.currentTemplate = {
      id: 'browser-local',
      meta: {
        name: '浏览器临时模板',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true
      },
      formData: serializeForm(),
      imageRefs: buildEmptyImageRefs()
    };
    state.templates = [{ id: state.currentTemplate.id, meta: state.currentTemplate.meta }];
    await applyTemplate(state.currentTemplate);
    renderTemplateList();
    return;
  }

  let snapshot = await state.bridge.template.list();
  if (snapshot.templates.length === 0) {
    await state.bridge.template.create({
      name: '默认模板',
      formData: serializeForm(),
      imageRefs: buildEmptyImageRefs()
    });
    snapshot = await state.bridge.template.list();
  }

  state.templates = snapshot.templates;
  const templateId = snapshot.currentTemplateId || snapshot.defaultTemplateId || snapshot.templates[0]?.id;
  if (templateId) {
    await selectTemplate(templateId);
  } else {
    renderTemplateList();
  }
}

async function selectTemplate(templateId) {
  if (!templateId) {
    return;
  }

  if (!state.bridge && templateId === state.currentTemplateId) {
    return;
  }

  state.isHydrating = true;
  try {
    const template = state.bridge
      ? await state.bridge.template.load(templateId)
      : state.currentTemplate;

    state.currentTemplateId = template.id;
    state.currentTemplate = template;
    await applyTemplate(template);
    renderTemplateList();
  } finally {
    state.isHydrating = false;
  }
}

async function applyTemplate(template) {
  const normalizedFormData = normalizeFormData(template.formData || {});
  const skuRows = extractSkuRowsFromFormData(normalizedFormData, { fallbackRows: [] });
  const mergedFormData = applySelectedShopToFormData({
    ...state.defaultFormData,
    ...normalizedFormData
  });

  dom.templateNameInput.value = template.meta.name || '';
  renderSkuRows(skuRows, {
    imageRefs: Array.isArray(template.imageRefs?.skuThumbs) ? template.imageRefs.skuThumbs : []
  });
  fillForm(mergedFormData);
  syncSelectedShopIntoForm();
  await hydrateAttributesFromCurrentForm({
    force: true,
    formData: mergedFormData
  });
  fillForm(mergedFormData);
  applyImageRefs(template.imageRefs || buildEmptyImageRefs());
  updateTemplateLabels();
  if (!state.shop.selected && (state.shop.status === 'ready' || state.shop.available.length)) {
    await tryAutoBindCurrentTemplateShop({ source: 'template' });
  }
}

function normalizeFormData(formData) {
  const nextFormData = {
    ...formData
  };
  const brandValue = resolveBrandAttributeValue(formData);

  if (brandValue !== '') {
    nextFormData[BRAND_ATTRIBUTE_KEYS.primary] = brandValue;
    nextFormData[BRAND_ATTRIBUTE_KEYS.secondary] = brandValue;
  }

  return nextFormData;
}

function resolveBrandAttributeValue(formData) {
  return [
    formData?.[BRAND_ATTRIBUTE_KEYS.primary],
    formData?.[BRAND_ATTRIBUTE_KEYS.secondary],
    formData?.brandSelect,
    formData?.['brandList[0][data]']
  ].find((value) => value !== undefined && value !== null && value !== '') || '';
}

function fillForm(formData) {
  const controls = Array.from(dom.form.querySelectorAll('input, textarea, select')).filter((control) => {
    return control.type !== 'file' && control.type !== 'button' && control.type !== 'submit' && control.type !== 'reset';
  });

  controls.forEach((control) => {
    const primaryKey = control.id || control.name;
    const secondaryKey = control.name && control.name !== primaryKey ? control.name : null;
    const value = formData[primaryKey] ?? (secondaryKey ? formData[secondaryKey] : undefined);

    if (control.type === 'radio') {
      const radioValue = formData[control.name] ?? state.defaultFormData[control.name];
      control.checked = radioValue === control.value;
      return;
    }

    if (control.type === 'checkbox') {
      const checkboxValues = formData[control.name] ?? state.defaultFormData[control.name] ?? [];
      control.checked = Array.isArray(checkboxValues) && checkboxValues.includes(control.value);
      return;
    }

    if (value !== undefined) {
      control.value = value;
    }
  });
}

function serializeForm() {
  const result = {};
  const checkboxGroups = new Set();
  const controls = Array.from(dom.form.querySelectorAll('input, textarea, select')).filter((control) => {
    return control.type !== 'file' && control.type !== 'button' && control.type !== 'submit' && control.type !== 'reset';
  });

  controls.forEach((control) => {
    const recordValue = (key, value) => {
      if (key) {
        result[key] = value;
      }
    };

    if (control.type === 'radio') {
      if (control.checked) {
        recordValue(control.name, control.value);
        recordValue(control.id, control.value);
      }
      return;
    }

    if (control.type === 'checkbox') {
      checkboxGroups.add(control.name);
      if (!Array.isArray(result[control.name])) {
        result[control.name] = [];
      }
      if (control.checked) {
        result[control.name].push(control.value);
      }
      return;
    }

    recordValue(control.id, control.value);
    recordValue(control.name, control.value);
  });

  checkboxGroups.forEach((name) => {
    if (!Array.isArray(result[name])) {
      result[name] = [];
    }
  });

  return result;
}

function setupImageSlots() {
  Object.keys(ASSET_LAYOUT).forEach((zoneKey) => {
    state.slotRegistry[zoneKey] = [];
  });

  Object.entries(ASSET_LAYOUT).forEach(([zoneKey, config]) => {
    if (config.type === 'dynamic-array') {
      renderDynamicArrayZone(zoneKey, []);
      return;
    }

    document.querySelectorAll(config.selector).forEach((slot) => {
      registerImageSlot(slot);
      renderSlot(slot, null);
    });
  });

  renderZoneSummary('mainGallery', 0);
  renderZoneSummary('detailGallery', 0);
  renderDetailGalleryPreview([]);
}

function registerImageSlot(slot) {
  if (slot.__frame) {
    return slot;
  }

  const zoneKey = slot.dataset.assetZone;
  const frameLabel = slot.dataset.frameLabel || '图片框';
  const input = slot.querySelector('input[type="file"]');
  const frame = document.createElement('div');

  frame.className = getImageFrameClassName(slot);
  frame.tabIndex = 0;
  frame.setAttribute('role', 'button');
  frame.setAttribute('aria-label', `${frameLabel} 导入图片`);
  frame.innerHTML = [
    `<span class="image-frame__badge">${escapeHtml(frameLabel)}</span>`,
    '<div class="image-frame__canvas"></div>',
    '<div class="image-frame__info"></div>',
    '<div class="image-frame__actions"></div>'
  ].join('');

  slot.appendChild(frame);
  slot.__input = input;
  slot.__frame = frame;
  slot.__assetRef = null;

  if (!state.slotRegistry[zoneKey]) {
    state.slotRegistry[zoneKey] = [];
  }

  state.slotRegistry[zoneKey].push(slot);

  frame.addEventListener('click', (event) => {
    const actionTrigger = event.target.closest('[data-slot-action]');
    if (actionTrigger) {
      event.stopPropagation();
      handleSlotAction(slot, actionTrigger.dataset.slotAction);
      return;
    }

    if (zoneKey === 'detailGallery' && slot.__assetRef) {
      activateFrame(slot.__frame);
      return;
    }

    openSlotPicker(slot, {
      allowMultiple: isDynamicArrayZone(zoneKey) && !slot.__assetRef
    }).catch((error) => {
      console.error(error);
    });
  });

  frame.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openSlotPicker(slot, {
        allowMultiple: isDynamicArrayZone(zoneKey) && !slot.__assetRef
      }).catch((error) => {
        console.error(error);
      });
    }
  });

  frame.addEventListener('dragstart', (event) => handleSlotDragStart(event, slot));
  frame.addEventListener('dragover', (event) => handleSlotDragOver(event, slot));
  frame.addEventListener('dragleave', () => handleSlotDragLeave(slot));
  frame.addEventListener('drop', (event) => {
    handleSlotDrop(event, slot).catch((error) => {
      console.error(error);
    });
  });
  frame.addEventListener('dragend', handleSlotDragEnd);

  input.addEventListener('change', () => handleLocalFilePreview(slot));
  return slot;
}

function getImageFrameClassName(slot) {
  if (slot.classList.contains('image-slot--sku')) {
    return 'image-frame image-frame--compact';
  }

  if (slot.classList.contains('image-slot--detail')) {
    return 'image-frame image-frame--tile';
  }

  return 'image-frame';
}

function renderDynamicArrayZone(zoneKey, refs) {
  const config = ASSET_LAYOUT[zoneKey];
  const container = document.querySelector(config.containerSelector);
  if (!container) {
    return;
  }

  if (zoneKey === 'detailGallery') {
    cleanupDetailDragState();
  }

  const normalizedRefs = normalizeArrayRefs(zoneKey, refs);
  const visibleSlotCount = normalizedRefs.length < config.max
    ? normalizedRefs.length + 1
    : normalizedRefs.length;

  container.innerHTML = '';
  state.slotRegistry[zoneKey] = [];

  for (let index = 0; index < visibleSlotCount; index += 1) {
    const slot = createDynamicSlot(zoneKey, index);
    container.appendChild(slot);
    registerImageSlot(slot);
    setSlotAsset(slot, normalizedRefs[index] || null);
  }

  renderZoneSummary(zoneKey, normalizedRefs.length);

  if (zoneKey === 'detailGallery') {
    renderDetailGalleryPreview(normalizedRefs);
  }
}

function createDynamicSlot(zoneKey, slotIndex) {
  const config = ASSET_LAYOUT[zoneKey];
  const slot = document.createElement('div');

  slot.className = config.slotClassName || 'image-slot';
  slot.dataset.assetZone = zoneKey;
  slot.dataset.slotIndex = String(slotIndex);
  slot.dataset.frameLabel = `${config.label}${slotIndex + 1}`;
  slot.innerHTML = '<input type="file" accept="image/*">';

  return slot;
}

function isDynamicArrayZone(zoneKey) {
  return ASSET_LAYOUT[zoneKey]?.type === 'dynamic-array';
}

function normalizeArrayRefs(zoneKey, refs) {
  return (Array.isArray(refs) ? refs : [])
    .filter(Boolean)
    .map((ref, index) => ({
      ...ref,
      zone: zoneKey,
      slotIndex: index
    }));
}

function getArrayZoneRefs(zoneKey) {
  const refs = (state.slotRegistry[zoneKey] || [])
    .map((slot) => slot.__assetRef)
    .filter(Boolean);

  return normalizeArrayRefs(zoneKey, refs);
}

function applyRefsToDynamicArrayZone(zoneKey, startIndex, refs) {
  const nextRefs = getArrayZoneRefs(zoneKey);
  refs.forEach((ref, offset) => {
    nextRefs[startIndex + offset] = {
      ...ref,
      zone: zoneKey,
      slotIndex: startIndex + offset
    };
  });
  renderDynamicArrayZone(zoneKey, nextRefs);
}

function isDetailSortableSlot(slot) {
  return slot.dataset.assetZone === 'detailGallery' && Boolean(slot.__assetRef);
}

function syncSlotDragState(slot, ref) {
  const draggable = slot.dataset.assetZone === 'detailGallery' && Boolean(ref);
  slot.__frame.draggable = draggable;
  slot.__frame.classList.toggle('is-sortable', draggable);
}

function handleSlotDragStart(event, slot) {
  if (!isDetailSortableSlot(slot)) {
    event.preventDefault();
    return;
  }

  state.dragContext = {
    zoneKey: slot.dataset.assetZone,
    fromIndex: normalizeSlotIndex(slot.dataset.slotIndex)
  };

  slot.__frame.classList.add('is-dragging');

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(state.dragContext.fromIndex));
  }
}

function handleSlotDragOver(event, slot) {
  const dragContext = state.dragContext;
  if (!dragContext || dragContext.zoneKey !== 'detailGallery' || slot.dataset.assetZone !== 'detailGallery') {
    return;
  }

  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';

  document.querySelectorAll('.image-frame--tile.is-drop-target').forEach((node) => {
    if (node !== slot.__frame) {
      node.classList.remove('is-drop-target');
    }
  });

  if (normalizeSlotIndex(slot.dataset.slotIndex) !== dragContext.fromIndex) {
    slot.__frame.classList.add('is-drop-target');
  }
}

function handleSlotDragLeave(slot) {
  slot.__frame.classList.remove('is-drop-target');
}

async function handleSlotDrop(event, slot) {
  const dragContext = state.dragContext;
  if (!dragContext || dragContext.zoneKey !== 'detailGallery' || slot.dataset.assetZone !== 'detailGallery') {
    return;
  }

  event.preventDefault();

  const targetIndex = normalizeSlotIndex(slot.dataset.slotIndex);
  cleanupDetailDragState();

  if (targetIndex === null || targetIndex === dragContext.fromIndex) {
    return;
  }

  await reorderDynamicArrayZone('detailGallery', dragContext.fromIndex, targetIndex);
}

function handleSlotDragEnd() {
  cleanupDetailDragState();
}

function cleanupDetailDragState() {
  document.querySelectorAll('.image-frame--tile.is-dragging, .image-frame--tile.is-drop-target').forEach((node) => {
    node.classList.remove('is-dragging', 'is-drop-target');
  });
  state.dragContext = null;
}

async function reorderDynamicArrayZone(zoneKey, fromIndex, targetIndex) {
  const refs = getArrayZoneRefs(zoneKey);
  if (!refs.length || fromIndex === null || targetIndex === null) {
    return;
  }

  const maxTargetIndex = refs.length;
  const boundedTargetIndex = Math.max(0, Math.min(targetIndex, maxTargetIndex));
  if (fromIndex === boundedTargetIndex) {
    return;
  }

  const [movedRef] = refs.splice(fromIndex, 1);
  if (!movedRef) {
    return;
  }

  const insertIndex = Math.min(boundedTargetIndex, refs.length);
  refs.splice(insertIndex, 0, movedRef);
  renderDynamicArrayZone(zoneKey, refs);
  await saveCurrentTemplate({ silent: true });
}

function renderZoneSummary(zoneKey, uploadedCount) {
  const config = ASSET_LAYOUT[zoneKey];
  if (!config?.max) {
    return;
  }

  document.querySelectorAll(`[data-zone-count="${zoneKey}"]`).forEach((node) => {
    node.textContent = `已上传 ${uploadedCount}/${config.max} 张`;
  });

  document.querySelectorAll(`[data-zone-upload="${zoneKey}"]`).forEach((button) => {
    button.disabled = uploadedCount >= config.max;
  });

  renderWorkspaceMeta();
}

function renderDetailGalleryPreview(refs) {
  const canvas = document.getElementById('detailPreviewCanvas');
  if (!canvas) {
    return;
  }

  if (!refs.length) {
    canvas.innerHTML = [
      '<div class="detail-preview-empty">',
      '<span class="detail-preview-empty__graphic" aria-hidden="true"></span>',
      '<strong>暂无详情图</strong>',
      '<span>上传后会按当前顺序生成预览</span>',
      '</div>'
    ].join('');
    return;
  }

  canvas.innerHTML = [
    '<div class="detail-preview-stream">',
    refs.map((ref, index) => {
      return [
        `<img class="detail-preview-stream__image" src="${escapeHtml(ref.fileUrl)}" alt="详情图 ${index + 1}">`
      ].join('');
    }).join(''),
    '</div>'
  ].join('');
}

async function triggerZoneUpload(zoneKey) {
  const config = ASSET_LAYOUT[zoneKey];
  if (!config || !isDynamicArrayZone(zoneKey)) {
    return;
  }

  const targetSlot = (state.slotRegistry[zoneKey] || []).find((slot) => !slot.__assetRef);
  if (!targetSlot) {
    window.alert(`${config.label}最多可上传 ${config.max} 张图片。`);
    return;
  }

  await openSlotPicker(targetSlot, { allowMultiple: true });
}

async function openSlotPicker(slot, options = {}) {
  activateFrame(slot.__frame);
  const zoneKey = slot.dataset.assetZone;
  const slotIndex = normalizeSlotIndex(slot.dataset.slotIndex);
  const previousRef = slot.__assetRef;
  const allowMultiple = Boolean(options.allowMultiple && isDynamicArrayZone(zoneKey));
  const config = ASSET_LAYOUT[zoneKey];

  if (state.bridge && state.currentTemplateId) {
    const imported = await state.bridge.asset.import({
      templateId: state.currentTemplateId,
      zone: zoneKey,
      slotIndex,
      multiple: allowMultiple,
      maxCount: allowMultiple && config?.max ? Math.max(config.max - slotIndex, 0) : 1
    });

    if (allowMultiple) {
      const importedRefs = Array.isArray(imported) ? imported : imported ? [imported] : [];
      if (importedRefs.length > 0) {
        applyRefsToDynamicArrayZone(zoneKey, slotIndex, importedRefs);
        await saveCurrentTemplate({ silent: true });
      }
      return;
    }

    if (imported) {
      if (previousRef && !previousRef.temporary) {
        await state.bridge.asset.remove({ ref: stripTransientFields(previousRef) });
      }

      if (isDynamicArrayZone(zoneKey)) {
        applyRefsToDynamicArrayZone(zoneKey, slotIndex, [imported]);
      } else {
        setSlotAsset(slot, imported);
      }

      await saveCurrentTemplate({ silent: true });
    }
    return;
  }

  slot.__allowMultiple = allowMultiple;
  slot.__input.multiple = allowMultiple;
  slot.__input.value = '';
  slot.__input.click();
}

function handleLocalFilePreview(slot) {
  const files = Array.from(slot.__input.files || []);
  if (!files.length) {
    return;
  }

  const zoneKey = slot.dataset.assetZone;
  const slotIndex = normalizeSlotIndex(slot.dataset.slotIndex);
  const allowMultiple = Boolean(slot.__allowMultiple && isDynamicArrayZone(zoneKey));
  slot.__allowMultiple = false;
  slot.__input.multiple = false;

  if (slot.__assetRef?.temporary && slot.__assetRef.fileUrl) {
    URL.revokeObjectURL(slot.__assetRef.fileUrl);
  }

  if (isDynamicArrayZone(zoneKey)) {
    const config = ASSET_LAYOUT[zoneKey];
    const usableFiles = allowMultiple
      ? files.slice(0, Math.max(config.max - slotIndex, 0))
      : files.slice(0, 1);

    if (allowMultiple && usableFiles.length < files.length) {
      window.alert(`${config.label}最多可上传 ${config.max} 张图片，本次仅导入前 ${usableFiles.length} 张。`);
    }

    const temporaryRefs = usableFiles.map((file, offset) => ({
      temporary: true,
      zone: zoneKey,
      slotIndex: slotIndex + offset,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      importedAt: new Date().toISOString()
    }));

    applyRefsToDynamicArrayZone(zoneKey, slotIndex, temporaryRefs);
    return;
  }

  const file = files[0];
  const temporaryRef = {
    temporary: true,
    zone: zoneKey,
    slotIndex,
    fileName: file.name,
    fileUrl: URL.createObjectURL(file),
    importedAt: new Date().toISOString()
  };

  setSlotAsset(slot, temporaryRef);
}

async function handleSlotAction(slot, action) {
  if (action === 'replace') {
    await openSlotPicker(slot, { allowMultiple: false });
    return;
  }

  if (action === 'clear') {
    await clearSlotAsset(slot);
  }
}

async function clearSlotAsset(slot) {
  const zoneKey = slot.dataset.assetZone;
  const slotIndex = normalizeSlotIndex(slot.dataset.slotIndex);
  const currentRef = slot.__assetRef;

  if (isDynamicArrayZone(zoneKey)) {
    if (currentRef?.temporary && currentRef.fileUrl) {
      URL.revokeObjectURL(currentRef.fileUrl);
    }

    if (state.bridge && currentRef && !currentRef.temporary) {
      await state.bridge.asset.remove({ ref: stripTransientFields(currentRef) });
    }

    const nextRefs = getArrayZoneRefs(zoneKey);
    nextRefs.splice(slotIndex, 1);
    renderDynamicArrayZone(zoneKey, nextRefs);

    if (state.bridge && state.currentTemplateId) {
      await saveCurrentTemplate({ silent: true });
    }
    return;
  }

  if (slot.__assetRef?.temporary && slot.__assetRef.fileUrl) {
    URL.revokeObjectURL(slot.__assetRef.fileUrl);
  }

  if (state.bridge && slot.__assetRef && !slot.__assetRef.temporary) {
    await state.bridge.asset.remove({ ref: stripTransientFields(slot.__assetRef) });
  }

  if (slot.__input) {
    slot.__input.value = '';
  }

  slot.__assetRef = null;
  renderSlot(slot, null);

  if (state.bridge && state.currentTemplateId) {
    await saveCurrentTemplate({ silent: true });
  }
}

function setSlotAsset(slot, ref) {
  slot.__assetRef = ref;
  syncSlotDragState(slot, ref);
  renderSlot(slot, ref);
}

function renderSlot(slot, ref) {
  const frame = slot.__frame;
  const canvas = frame.querySelector('.image-frame__canvas');
  const info = frame.querySelector('.image-frame__info');
  const actions = frame.querySelector('.image-frame__actions');
  const label = slot.dataset.frameLabel || '图片框';
  const compact = frame.classList.contains('image-frame--compact');
  const tile = frame.classList.contains('image-frame--tile');
  let placeholderMarkup;
  if (compact) {
    placeholderMarkup = [
      '<div class="image-frame__placeholder image-frame__placeholder--compact">',
      '<span class="image-frame__plus"></span>',
      '<span class="image-frame__placeholder-note">导入</span>',
      '</div>'
    ].join('');
  } else if (tile) {
    placeholderMarkup = [
      '<div class="image-frame__placeholder image-frame__placeholder--tile">',
      '<span class="image-frame__plus"></span>',
      '<span class="image-frame__placeholder-note">上传</span>',
      '</div>'
    ].join('');
  } else {
    placeholderMarkup = [
      '<div class="image-frame__placeholder">',
      '<span class="image-frame__plus"></span>',
      `<strong>${escapeHtml(label)}</strong>`,
      '<span>点击导入</span>',
      '</div>'
    ].join('');
  }

  frame.classList.toggle('has-preview', Boolean(ref?.fileUrl));

  if (ref?.fileUrl) {
    canvas.innerHTML = [
      `<img class="image-frame__preview" src="${escapeHtml(ref.fileUrl)}" alt="${escapeHtml(label)}">`,
      '<div class="image-frame__overlay">',
      '<button type="button" class="image-frame__mini-btn" data-slot-action="replace">替换</button>',
      '<button type="button" class="image-frame__mini-btn" data-slot-action="clear">清空</button>',
      '</div>'
    ].join('');
  } else {
    canvas.innerHTML = placeholderMarkup;
  }

  if (compact || tile) {
    info.innerHTML = '';
    actions.innerHTML = '';
    return;
  }

  info.innerHTML = ref
    ? `<strong class="image-frame__title">${escapeHtml(ref.fileName || label)}</strong><span class="image-frame__sub">${formatDateTime(ref.importedAt)}</span>`
    : `<strong class="image-frame__title">${escapeHtml(label)}</strong><span class="image-frame__sub">未导入图片</span>`;

  actions.innerHTML = ref
    ? '<span class="image-frame__action">已同步工作区</span><span class="image-frame__action">支持替换 / 清空</span>'
    : '<span class="image-frame__action">本地导入</span><span class="image-frame__action">模板随应用保留</span>';
}

function applyImageRefs(imageRefs) {
  Object.entries(ASSET_LAYOUT).forEach(([zoneKey, config]) => {
    if (config.type === 'dynamic-array') {
      renderDynamicArrayZone(zoneKey, imageRefs?.[zoneKey] || []);
      return;
    }

    const slots = Array.from(state.slotRegistry[zoneKey] || document.querySelectorAll(config.selector));

    if (config.type === 'array') {
      const refs = Array.isArray(imageRefs?.[zoneKey]) ? imageRefs[zoneKey] : [];
      slots.forEach((slot, index) => {
        setSlotAsset(slot, refs[index] || null);
      });
      return;
    }

    const ref = imageRefs?.[zoneKey] || null;
    slots.forEach((slot) => setSlotAsset(slot, ref));
  });
}

function collectImageRefs() {
  const imageRefs = buildEmptyImageRefs();

  Object.entries(ASSET_LAYOUT).forEach(([zoneKey, config]) => {
    const slots = Array.from(state.slotRegistry[zoneKey] || (config.selector ? document.querySelectorAll(config.selector) : []));
    if (config.type === 'dynamic-array') {
      imageRefs[zoneKey] = normalizeArrayRefs(zoneKey, slots.map((slot) => sanitizeAssetRef(slot.__assetRef)).filter(Boolean));
      return;
    }

    if (config.type === 'array') {
      imageRefs[zoneKey] = slots.map((slot) => sanitizeAssetRef(slot.__assetRef));
      return;
    }

    imageRefs[zoneKey] = sanitizeAssetRef(slots[0]?.__assetRef || null);
  });

  return imageRefs;
}

function sanitizeAssetRef(ref) {
  if (!ref || ref.temporary) {
    return null;
  }

  return stripTransientFields(ref);
}

function stripTransientFields(ref) {
  if (!ref) {
    return null;
  }

  return {
    assetId: ref.assetId,
    zone: ref.zone,
    slotIndex: ref.slotIndex,
    fileName: ref.fileName,
    absolutePath: ref.absolutePath,
    relativePath: ref.relativePath,
    fileUrl: ref.fileUrl,
    importedAt: ref.importedAt
  };
}

function buildEmptyImageRefs() {
  return {
    mainGallery: [],
    detailGallery: [],
    whiteImage: null,
    longImage: null,
    skuThumbs: []
  };
}

function activateFrame(frame) {
  document.querySelectorAll('.image-frame.is-active').forEach((node) => {
    if (node !== frame) {
      node.classList.remove('is-active');
    }
  });
  frame.classList.add('is-active');
}

function renderTemplateList() {
  dom.templateCountBadge.textContent = String(state.templates.length);

  if (state.templates.length === 0) {
    dom.templateList.innerHTML = '<div class="empty-state">还没有模板，先新建一个。</div>';
    return;
  }

  dom.templateList.innerHTML = state.templates.map((template) => {
    const activeClass = template.id === state.currentTemplateId ? 'is-active' : '';
    const lastRunResult = template.meta.lastRunResult || '未执行';
    return [
      `<button type="button" class="template-item ${activeClass}" data-template-id="${template.id}">`,
      '<span class="template-item__top">',
      `<span class="template-item__title">${escapeHtml(template.meta.name)}</span>`,
      template.meta.isDefault ? '<span class="template-item__default">默认</span>' : '',
      '</span>',
      '<span class="template-item__bottom">',
      `<span class="template-item__meta">更新于 ${formatDateTime(template.meta.updatedAt)}</span>`,
      `<span class="template-item__meta template-item__meta--result">${escapeHtml(lastRunResult)}</span>`,
      '</span>',
      '</button>'
    ].join('');
  }).join('');
}

function renderWorkspaceSummary() {
  if (!state.workspace) {
    dom.workspaceSummary.innerHTML = '<div class="path-list__item"><dt>模式</dt><dd>浏览器模式下不启用本地工作区</dd></div>';
    return;
  }

  const rows = [
    ['根目录', state.workspace.root],
    ['模板目录', state.workspace.templates],
    ['素材目录', state.workspace.assets],
    ['浏览器配置', state.workspace.browserProfile],
    ['日志目录', state.workspace.logs]
  ];

  dom.workspaceSummary.innerHTML = rows.map(([title, value]) => {
    return `<div class="path-list__item"><dt>${escapeHtml(title)}</dt><dd>${escapeHtml(value)}</dd></div>`;
  }).join('');
}

function renderLogs() {
  dom.logCountBadge.textContent = String(state.automationLogs.length);

  if (!state.automationLogs.length) {
    dom.automationLogList.innerHTML = '<div class="empty-state">操作记录会显示在这里。</div>';
    return;
  }

  const visibleLogs = state.automationLogs.slice(-14).reverse();
  dom.automationLogList.innerHTML = visibleLogs.map((item) => {
    const level = item.level || (item.state === 'failed' ? 'error' : item.state === 'waiting-login' ? 'warning' : 'info');
    return [
      `<article class="log-item log-item--${escapeHtml(level)}">`,
      `<strong class="log-item__title">${escapeHtml(item.message || item.state || item.type)}</strong>`,
      `<span class="log-item__meta">${escapeHtml(formatDateTime(item.timestamp))}</span>`,
      '</article>'
    ].join('');
  }).join('');
}

function updateTemplateLabels() {
  const templateName = state.currentTemplate?.meta?.name || '未选择';
  const metaText = state.currentTemplate
    ? `创建于 ${formatDateTime(state.currentTemplate.meta.createdAt)}，最近更新 ${formatDateTime(state.currentTemplate.meta.updatedAt)}`
    : '尚未载入模板';
  dom.currentTemplateMeta.textContent = metaText;
  dom.heroCurrentTemplate.textContent = templateName;
  if (dom.actionCurrentTemplate) {
    dom.actionCurrentTemplate.textContent = templateName;
  }
  if (dom.workspaceOverviewTemplateMeta) {
    dom.workspaceOverviewTemplateMeta.textContent = metaText;
  }
  renderProductFillState();
  renderTemplateExport();
  renderWorkspaceMeta();
}

async function handleCreateTemplate() {
  const templateName = window.prompt('请输入新模板名称', `模板 ${state.templates.length + 1}`);
  if (!templateName || !state.bridge) {
    return;
  }

  const template = await state.bridge.template.create({
    name: templateName,
    formData: applySelectedShopToFormData(state.defaultFormData),
    imageRefs: buildEmptyImageRefs()
  });
  await refreshTemplates(template.id);
}

async function handleDuplicateTemplate() {
  if (!state.bridge || !state.currentTemplateId) {
    return;
  }

  await saveCurrentTemplate({ silent: true });
  const duplicate = await state.bridge.template.duplicate(state.currentTemplateId);
  await refreshTemplates(duplicate.id);
}

async function handleDeleteTemplate() {
  if (!state.bridge || !state.currentTemplateId) {
    return;
  }

  if (state.templates.length <= 1) {
    window.alert('至少需要保留一个模板。');
    return;
  }

  const confirmed = window.confirm('删除模板后，其工作区素材也会被移除。确定继续吗？');
  if (!confirmed) {
    return;
  }

  const result = await state.bridge.template.delete(state.currentTemplateId);
  await refreshTemplates(result.currentTemplateId);
}

async function handleSetDefaultTemplate() {
  if (!state.bridge || !state.currentTemplateId) {
    return;
  }

  await state.bridge.template.setDefault(state.currentTemplateId);
  await refreshTemplates(state.currentTemplateId);
}

async function refreshTemplates(preferredTemplateId) {
  const snapshot = await state.bridge.template.list();
  state.templates = snapshot.templates;
  renderTemplateList();

  const targetId = preferredTemplateId || snapshot.currentTemplateId || snapshot.defaultTemplateId || snapshot.templates[0]?.id;
  if (targetId) {
    await selectTemplate(targetId);
  }
}

function scheduleAutoSave() {
  if (!state.bridge || !state.currentTemplateId || state.isHydrating) {
    return;
  }

  window.clearTimeout(state.autosaveTimer);
  state.autosaveTimer = window.setTimeout(() => {
    saveCurrentTemplate({ silent: true }).catch((error) => {
      console.error(error);
    });
  }, 500);
}

async function saveCurrentTemplate({ silent }) {
  if (!state.currentTemplate) {
    return null;
  }

  await hydrateCategorySelectionMetaFromCurrentForm();

  if (!state.bridge) {
    state.currentTemplate = {
      ...state.currentTemplate,
      meta: {
        ...state.currentTemplate.meta,
        name: dom.templateNameInput.value.trim() || state.currentTemplate.meta.name,
        updatedAt: new Date().toISOString()
      },
      formData: serializeForm(),
      imageRefs: collectImageRefs(),
      attributeLabels: buildCurrentAttributeLabelMap(),
      categoryMeta: buildCurrentCategoryExportMeta()
    };
    updateTemplateLabels();
    renderTemplateList();
    return state.currentTemplate;
  }

  const saved = await state.bridge.template.save({
    id: state.currentTemplateId,
    name: dom.templateNameInput.value.trim() || state.currentTemplate.meta.name,
    formData: serializeForm(),
    imageRefs: collectImageRefs(),
    attributeLabels: buildCurrentAttributeLabelMap(),
    categoryMeta: buildCurrentCategoryExportMeta(),
    meta: {
      lastRunResult: state.currentTemplate.meta.lastRunResult || null
    }
  });

  state.currentTemplate = saved;
  state.currentTemplateId = saved.id;
  syncTemplateSummary(saved);
  updateTemplateLabels();
  renderTemplateList();

  if (!silent) {
    pushLocalLog('info', `模板《${saved.meta.name}》已保存`);
  }

  return saved;
}

function syncTemplateSummary(template) {
  state.templates = state.templates.map((item) => {
    if (item.id !== template.id) {
      return item;
    }

    return {
      id: template.id,
      meta: template.meta
    };
  });
}

async function openWorkspaceFolder(key) {
  if (!state.bridge) {
    return;
  }

  await state.bridge.workspace.openFolder(key);
}

function pushLocalLog(level, message) {
  const event = {
    type: 'log',
    level,
    message,
    timestamp: new Date().toISOString()
  };
  state.automationLogs = [...state.automationLogs.slice(-119), event];
  renderLogs();
}

function normalizeSlotIndex(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return Number(value);
}

function formatDateTime(value) {
  if (!value) {
    return '未知时间';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '未知时间';
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function toTitleCase(value) {
  const normalizedValue = String(value || 'idle');
  if (STATUS_LABELS[normalizedValue]) {
    return STATUS_LABELS[normalizedValue];
  }

  return normalizedValue
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
