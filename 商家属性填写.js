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
    categoryId: '',
    meta: {}
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

function buildInitialAutoFillState() {
  return {
    status: 'idle',
    error: '',
    summary: '自动填充会使用当前店铺和当前模板。',
    runId: '',
    shopCode: '',
    shopName: ''
  };
}

function buildInitialLogoBatchConfig() {
  return {
    logoRef: null,
    sourceRefs: [],
    areaPercent: 5,
    centerXRatio: 0.784,
    centerYRatio: 0.784,
    updatedAt: '',
    pendingGeneratedRefs: null
  };
}

function buildInitialLogoBatchState() {
  return {
    isOpen: false,
    zoneKey: '',
    status: 'idle',
    summary: '仅桌面版支持批量加 LOGO。',
    activePreviewIndex: 0,
    drag: {
      isActive: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      originCenterXRatio: 0.784,
      originCenterYRatio: 0.784
    },
    preview: {
      imageNaturalWidth: 0,
      imageNaturalHeight: 0,
      displayWidth: 0,
      displayHeight: 0,
      logoDisplayWidth: 0,
      logoDisplayHeight: 0
    },
    configs: {
      mainGallery: buildInitialLogoBatchConfig(),
      skuThumbs: buildInitialLogoBatchConfig()
    }
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
    valueLists: [[], []],
    aiRenameStatus: 'idle',
    aiRenameError: '',
    aiRenameMessage: ''
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
  unsubscribeAutomation: null,
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
  autoFill: buildInitialAutoFillState(),
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

const LOGO_BATCH_ZONE_META = {
  mainGallery: {
    zoneKey: 'mainGallery',
    title: '轮播图批量加 LOGO',
    desc: '上传一张 LOGO，调整面积占比与位置后，一键应用到全部商品轮播图。',
    previewLabel: '轮播图预览',
    internalLogoZone: 'logoBatchMainGallery'
  },
  skuThumbs: {
    zoneKey: 'skuThumbs',
    title: 'SKU图批量加 LOGO',
    desc: '上传一张 LOGO，调整面积占比与位置后，一键应用到全部 SKU 图。',
    previewLabel: 'SKU图预览',
    internalLogoZone: 'logoBatchSkuThumbs'
  }
};

const BRAND_ATTRIBUTE_KEYS = {
  primary: 'pddForm_goodsAttribute_310',
  secondary: 'goodsAttribute[310]'
};

const SKU_FIELD_NAMES = ['specName', 'groupPrice', 'singlePrice', 'stock', 'outSkuSn'];
const SKU_DIMENSION_LABELS = ['规格一', '规格二', '规格三'];
const SHIPMENT_LIMIT_RADIO_VALUES = new Set(['0', '86400', '172800']);
const DEFAULT_SKU_ROWS = [
  {
    specName: '黑色 / 均码',
    groupPrice: '15.90',
    singlePrice: '19.90',
    stock: '500',
    outSkuSn: ''
  },
  {
    specName: '黑色 / 加大码',
    groupPrice: '15.90',
    singlePrice: '19.90',
    stock: '420',
    outSkuSn: ''
  },
  {
    specName: '奶白色 / 均码',
    groupPrice: '16.50',
    singlePrice: '20.50',
    stock: '360',
    outSkuSn: ''
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
  renderAutoFillState();
  renderTemplateExport();

  if (state.bridge?.auth?.onEvent) {
    state.unsubscribeAuth = state.bridge.auth.onEvent(handleAuthEvent);
  }

  if (state.bridge?.automation?.onEvent) {
    state.unsubscribeAutomation = state.bridge.automation.onEvent(handleAutomationEvent);
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
  dom.shopSelectionCurrentShop = document.getElementById('shopSelectionCurrentShop');
  dom.shopSelectionDraftState = document.getElementById('shopSelectionDraftState');
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
  dom.shopSearchHint = document.getElementById('shopSearchHint');
  dom.shopSelectionError = document.getElementById('shopSelectionError');
  dom.shopSelectionList = document.getElementById('shopSelectionList');
  dom.shopSelectionConfirmBtn = document.getElementById('shopSelectionConfirmBtn');
  dom.shopSelectionActionSummary = document.getElementById('shopSelectionActionSummary');
  dom.shopSelectionRefreshBtn = document.getElementById('shopSelectionRefreshBtn');
  dom.shopPickerLogoutBtn = document.getElementById('shopPickerLogoutBtn');
  dom.openCategoryPickerBtn = document.getElementById('openCategoryPickerBtn');
  dom.openProductFillBtn = document.getElementById('openProductFillBtn');
  dom.startAutoFillBtn = document.getElementById('startAutoFillBtn');
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
  dom.skuBulkToolbar = document.getElementById('skuBulkToolbar');
  dom.skuBulkGroupPriceInput = document.getElementById('skuBulkGroupPriceInput');
  dom.skuBulkSinglePriceInput = document.getElementById('skuBulkSinglePriceInput');
  dom.skuBulkStockInput = document.getElementById('skuBulkStockInput');
  dom.skuBulkSkuCodeSearchInput = document.getElementById('skuBulkSkuCodeSearchInput');
  dom.skuBulkSkuCodeReplaceInput = document.getElementById('skuBulkSkuCodeReplaceInput');
  dom.applySkuBulkStockBtn = document.getElementById('applySkuBulkStockBtn');
  dom.applySkuBulkCodeReplaceBtn = document.getElementById('applySkuBulkCodeReplaceBtn');
  dom.openMainGalleryLogoBatchBtn = document.getElementById('openMainGalleryLogoBatchBtn');
  dom.openSkuLogoBatchBtn = document.getElementById('openSkuLogoBatchBtn');
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
  dom.imagePreviewModal = document.getElementById('imagePreviewModal');
  dom.imagePreviewBackdrop = document.getElementById('imagePreviewBackdrop');
  dom.closeImagePreviewBtn = document.getElementById('closeImagePreviewBtn');
  dom.imagePreviewTitle = document.getElementById('imagePreviewTitle');
  dom.imagePreviewImage = document.getElementById('imagePreviewImage');
  dom.imagePreviewMeta = document.getElementById('imagePreviewMeta');
  dom.logoBatchModal = document.getElementById('logoBatchModal');
  dom.logoBatchBackdrop = document.getElementById('logoBatchBackdrop');
  dom.closeLogoBatchBtn = document.getElementById('closeLogoBatchBtn');
  dom.logoBatchTitle = document.getElementById('logoBatchTitle');
  dom.logoBatchDesc = document.getElementById('logoBatchDesc');
  dom.logoBatchPreviewLabel = document.getElementById('logoBatchPreviewLabel');
  dom.logoBatchPreviewMeta = document.getElementById('logoBatchPreviewMeta');
  dom.logoBatchStage = document.getElementById('logoBatchStage');
  dom.logoBatchSummary = document.getElementById('logoBatchSummary');
  dom.logoBatchUploadBtn = document.getElementById('logoBatchUploadBtn');
  dom.logoBatchResetPositionBtn = document.getElementById('logoBatchResetPositionBtn');
  dom.logoBatchLogoStatus = document.getElementById('logoBatchLogoStatus');
  dom.logoBatchAreaRange = document.getElementById('logoBatchAreaRange');
  dom.logoBatchAreaInput = document.getElementById('logoBatchAreaInput');
  dom.logoBatchRestoreBtn = document.getElementById('logoBatchRestoreBtn');
  dom.logoBatchApplyBtn = document.getElementById('logoBatchApplyBtn');
  dom.logoBatchPrevBtn = document.getElementById('logoBatchPrevBtn');
  dom.logoBatchNextBtn = document.getElementById('logoBatchNextBtn');
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
  dom.detailPreviewCanvas = document.getElementById('detailPreviewCanvas');
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
  dom.startAutoFillBtn?.addEventListener('click', handleStartAutoFill);
  document.addEventListener('change', (event) => {
    const target = event.target;
    if (target && target.name === 'shipmentLimitSecond') {
      syncShipmentLimitCustomShell();
    }
  });
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
  dom.imagePreviewBackdrop?.addEventListener('click', closeImagePreviewModal);
  dom.closeImagePreviewBtn?.addEventListener('click', closeImagePreviewModal);
  dom.openMainGalleryLogoBatchBtn?.addEventListener('click', () => {
    openLogoBatchModal('mainGallery').catch((error) => {
      console.error(error);
    });
  });
  dom.openSkuLogoBatchBtn?.addEventListener('click', () => {
    openLogoBatchModal('skuThumbs').catch((error) => {
      console.error(error);
    });
  });
  dom.logoBatchBackdrop?.addEventListener('click', closeLogoBatchModal);
  dom.closeLogoBatchBtn?.addEventListener('click', closeLogoBatchModal);
  dom.logoBatchUploadBtn?.addEventListener('click', () => {
    handleLogoBatchUpload().catch((error) => {
      console.error(error);
    });
  });
  dom.logoBatchResetPositionBtn?.addEventListener('click', handleLogoBatchResetPosition);
  dom.logoBatchAreaRange?.addEventListener('input', handleLogoBatchAreaRangeInput);
  dom.logoBatchAreaInput?.addEventListener('input', handleLogoBatchAreaInput);
  dom.logoBatchAreaInput?.addEventListener('blur', normalizeLogoBatchAreaInput);
  dom.logoBatchRestoreBtn?.addEventListener('click', () => {
    handleLogoBatchRestore().catch((error) => {
      console.error(error);
    });
  });
  dom.logoBatchApplyBtn?.addEventListener('click', () => {
    handleLogoBatchApply().catch((error) => {
      console.error(error);
    });
  });
  dom.logoBatchPrevBtn?.addEventListener('click', () => shiftLogoBatchPreviewIndex(-1));
  dom.logoBatchNextBtn?.addEventListener('click', () => shiftLogoBatchPreviewIndex(1));
  dom.skuBulkToolbar?.addEventListener('click', handleSkuBulkToolbarClick);
  dom.skuBulkGroupPriceInput?.addEventListener('keydown', handleSkuBulkPriceInputKeyDown);
  dom.skuBulkSinglePriceInput?.addEventListener('keydown', handleSkuBulkPriceInputKeyDown);
  dom.applySkuBulkStockBtn?.addEventListener('click', handleApplySkuBulkStock);
  dom.skuBulkStockInput?.addEventListener('keydown', handleSkuBulkStockKeyDown);
  dom.skuBulkSkuCodeSearchInput?.addEventListener('keydown', handleSkuBulkCodeReplaceKeyDown);
  dom.skuBulkSkuCodeReplaceInput?.addEventListener('keydown', handleSkuBulkCodeReplaceKeyDown);
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
  dom.detailPreviewCanvas?.addEventListener('click', handleDetailPreviewCanvasClick);
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
    if (event.key === 'Escape' && dom.imagePreviewModal && !dom.imagePreviewModal.hidden) {
      closeImagePreviewModal();
      return;
    }

    if (event.key === 'Escape' && dom.logoBatchModal && !dom.logoBatchModal.hidden) {
      closeLogoBatchModal();
      return;
    }

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

function handleAutomationEvent(event) {
  if (!event || typeof event !== 'object') {
    return;
  }

  const message = String(event.message || '').trim();
  if (event.type === 'started') {
    state.autoFill = {
      status: 'running',
      error: '',
      summary: message || '自动填充已启动...',
      runId: String(event.runId || ''),
      shopCode: String(event.shopCode || state.shop.selected?.shopCode || ''),
      shopName: String(event.shopName || state.shop.selected?.shopName || '')
    };
    pushLocalLog('info', message || '自动填充已启动');
    renderAutoFillState();
    return;
  }

  if (event.type === 'progress') {
    state.autoFill.summary = message || state.autoFill.summary;
    state.autoFill.status = state.autoFill.status === 'idle' ? 'running' : state.autoFill.status;
    if (message) {
      pushLocalLog('info', message);
    }
    renderAutoFillState();
    return;
  }

  if (event.type === 'completed') {
    state.autoFill.status = 'success';
    state.autoFill.error = '';
    state.autoFill.summary = message || '自动填充已完成，请人工检查后发布';
    pushLocalLog('info', state.autoFill.summary);
    showAuthNotice(state.autoFill.summary);
    renderAutoFillState();
    return;
  }

  if (event.type === 'failed') {
    state.autoFill.status = 'error';
    state.autoFill.error = event.error?.message || message || '自动填充失败，请稍后重试。';
    state.autoFill.summary = state.autoFill.error;
    pushLocalLog('error', `自动填充失败：${state.autoFill.error}`);
    showAuthNotice(state.autoFill.error);
    renderAutoFillState();
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
  resetAutoFillState();
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
  const logoBatches = normalizeLogoBatches(state.currentTemplate?.imageRefs?.logoBatches || createEmptyLogoBatchStore());
  const hasMainGalleryLogo = Boolean(logoBatches.mainGallery?.logoRef);
  const hasSkuLogo = Boolean(logoBatches.skuThumbs?.logoRef);
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
    hasMainGalleryLogo ? '轮播已加LOGO' : '轮播未加LOGO',
    `详情 ${detailCount}`,
    hasWhiteImage ? '白底图已传' : '白底图未传',
    hasLongImage ? '长图已传' : '长图未传'
  ].join(' · '));

  setNodeText(dom.workspaceSkuSummary, [
    skuRows.length ? `SKU ${skuRows.length} 行` : 'SKU 未配置',
    hasSkuLogo ? 'SKU图已加LOGO' : 'SKU图未加LOGO',
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
  renderAutoFillState();
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

  if (dom.shopSelectionCurrentShop) {
    dom.shopSelectionCurrentShop.textContent = getCurrentShopLabel({ emptyLabel: user ? '尚未确认' : '-' });
  }

  if (dom.shopSelectionDraftState) {
    dom.shopSelectionDraftState.textContent = getShopDraftStatusText();
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
  resetAutoFillState();
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

function canUseAutoFill(user = state.auth.user) {
  const role = String(user?.role || '').trim().toLowerCase();
  const roleName = String(user?.role_name || user?.roleName || '').trim();
  return role === 'admin' || role === '运营管理' || roleName === '运营管理' || roleName.includes('管理员');
}

function getAutoFillDeniedMessage() {
  return '仅管理员和运营管理可启动自动填充';
}

function resetAutoFillState() {
  state.autoFill = buildInitialAutoFillState();
  renderAutoFillState();
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

function openImagePreviewModal(slot) {
  const ref = slot?.__assetRef || null;
  if (!ref?.fileUrl || !dom.imagePreviewModal) {
    return;
  }

  const label = slot.dataset.frameLabel || ref.fileName || '图片';
  openImagePreviewRef(ref, label);
}

function openImagePreviewRef(ref, label = '图片') {
  if (!ref?.fileUrl || !dom.imagePreviewModal) {
    return;
  }

  state.ui.imagePreview = {
    isOpen: true,
    ref,
    label
  };
  renderImagePreviewModal();
}

function closeImagePreviewModal() {
  state.ui.imagePreview = {
    isOpen: false,
    ref: null,
    label: ''
  };
  renderImagePreviewModal();
}

function canUseLogoBatch() {
  return Boolean(state.bridge?.asset?.import && state.bridge?.asset?.writeGeneratedBatch && state.currentTemplateId);
}

function createDefaultLogoBatchPosition(areaPercent = 5) {
  const normalizedPercent = clampLogoBatchAreaPercent(areaPercent);
  const widthRatio = Math.sqrt(normalizedPercent / 100);
  const marginRatio = 0.04;
  const centerRatio = 1 - marginRatio - widthRatio / 2;
  return {
    centerXRatio: clamp(0.5, centerRatio, 1),
    centerYRatio: clamp(0.5, centerRatio, 1)
  };
}

function clamp(min, value, max) {
  return Math.min(Math.max(value, min), max);
}

function clampLogoBatchAreaPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 5;
  }
  return clamp(5, Math.round(numeric * 2) / 2, 200);
}

function createEmptyLogoBatchStore() {
  return {
    mainGallery: null,
    skuThumbs: null
  };
}

function sanitizeLogoBatchRefs(refs, { allowNullItems = false } = {}) {
  const normalizedRefs = Array.isArray(refs) ? refs : [];
  return normalizedRefs.map((ref) => {
    if (!ref) {
      return allowNullItems ? null : null;
    }
    return stripTransientFields(ref);
  }).filter((item) => allowNullItems || Boolean(item));
}

function sanitizeLogoBatchConfig(value, zoneKey) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const fallbackPosition = createDefaultLogoBatchPosition(value.areaPercent);
  const sourceRefs = zoneKey === 'skuThumbs'
    ? sanitizeLogoBatchRefs(value.sourceRefs, { allowNullItems: true })
    : sanitizeLogoBatchRefs(value.sourceRefs);

  return {
    logoRef: sanitizeAssetRef(value.logoRef),
    sourceRefs,
    areaPercent: clampLogoBatchAreaPercent(value.areaPercent),
    centerXRatio: clamp(0, Number(value.centerXRatio) || fallbackPosition.centerXRatio, 1),
    centerYRatio: clamp(0, Number(value.centerYRatio) || fallbackPosition.centerYRatio, 1),
    updatedAt: String(value.updatedAt || '').trim()
  };
}

function normalizeLogoBatches(rawLogoBatches = {}) {
  return {
    mainGallery: sanitizeLogoBatchConfig(rawLogoBatches?.mainGallery, 'mainGallery'),
    skuThumbs: sanitizeLogoBatchConfig(rawLogoBatches?.skuThumbs, 'skuThumbs')
  };
}

function getCurrentLogoBatchStore() {
  return normalizeLogoBatches(state.currentTemplate?.imageRefs?.logoBatches || createEmptyLogoBatchStore());
}

function ensureCurrentTemplateLogoBatchStore() {
  if (!state.currentTemplate) {
    return createEmptyLogoBatchStore();
  }
  if (!state.currentTemplate.imageRefs) {
    state.currentTemplate.imageRefs = buildEmptyImageRefs();
  }
  if (!state.currentTemplate.imageRefs.logoBatches) {
    state.currentTemplate.imageRefs.logoBatches = createEmptyLogoBatchStore();
  }
  return state.currentTemplate.imageRefs.logoBatches;
}

function syncUiLogoBatchConfig(zoneKey, persistedConfig = null) {
  const config = buildInitialLogoBatchConfig();
  const persisted = sanitizeLogoBatchConfig(persistedConfig, zoneKey);
  const next = {
    ...config,
    ...(persisted || {})
  };
  if (!next.centerXRatio || !next.centerYRatio) {
    const fallback = createDefaultLogoBatchPosition(next.areaPercent);
    next.centerXRatio = fallback.centerXRatio;
    next.centerYRatio = fallback.centerYRatio;
  }
  next.pendingGeneratedRefs = null;
  state.ui.logoBatch.configs[zoneKey] = next;
  return next;
}

function getLogoBatchConfig(zoneKey) {
  if (!LOGO_BATCH_ZONE_META[zoneKey]) {
    return buildInitialLogoBatchConfig();
  }
  if (!state.ui.logoBatch.configs[zoneKey]) {
    state.ui.logoBatch.configs[zoneKey] = buildInitialLogoBatchConfig();
  }
  return state.ui.logoBatch.configs[zoneKey];
}

function getLogoBatchCurrentRefs(zoneKey) {
  if (zoneKey === 'mainGallery') {
    return getArrayZoneRefs('mainGallery');
  }
  if (zoneKey === 'skuThumbs') {
    return Array.isArray(state.slotRegistry.skuThumbs)
      ? state.slotRegistry.skuThumbs.map((slot) => slot.__assetRef || null)
      : [];
  }
  return [];
}

function getLogoBatchEffectiveSourceRefs(zoneKey) {
  const config = getLogoBatchConfig(zoneKey);
  const currentRefs = getLogoBatchCurrentRefs(zoneKey);
  const hasSourceRefs = Array.isArray(config.sourceRefs) && config.sourceRefs.some((item) => Boolean(item));
  if (hasSourceRefs) {
    return zoneKey === 'skuThumbs'
      ? config.sourceRefs.map((ref) => ref || null)
      : config.sourceRefs.filter(Boolean);
  }
  return zoneKey === 'skuThumbs'
    ? currentRefs.map((ref) => ref || null)
    : currentRefs.filter(Boolean);
}

function getLogoBatchPreviewRefs(zoneKey) {
  const refs = getLogoBatchEffectiveSourceRefs(zoneKey);
  return refs.filter(Boolean);
}

function getLogoBatchPreviewRef(zoneKey) {
  const previewRefs = getLogoBatchPreviewRefs(zoneKey);
  const index = clamp(0, state.ui.logoBatch.activePreviewIndex || 0, Math.max(previewRefs.length - 1, 0));
  state.ui.logoBatch.activePreviewIndex = index;
  return previewRefs[index] || null;
}

function getLogoBatchPreviewMetaText(zoneKey) {
  const previewRefs = getLogoBatchPreviewRefs(zoneKey);
  if (!previewRefs.length) {
    return '当前区域暂无图片。';
  }
  const currentIndex = clamp(0, state.ui.logoBatch.activePreviewIndex || 0, previewRefs.length - 1);
  return `预览第 ${currentIndex + 1}/${previewRefs.length} 张，拖动 LOGO 可调整位置。`;
}

async function openLogoBatchModal(zoneKey) {
  if (!LOGO_BATCH_ZONE_META[zoneKey]) {
    return;
  }

  if (!canUseLogoBatch()) {
    showAuthNotice('仅桌面版支持批量加 LOGO。');
    return;
  }

  closeSecondaryDrawer();
  const templateLogoBatches = normalizeLogoBatches(state.currentTemplate?.imageRefs?.logoBatches || getCurrentLogoBatchStore() || createEmptyLogoBatchStore());
  syncUiLogoBatchConfig(zoneKey, templateLogoBatches[zoneKey]);
  state.ui.logoBatch.isOpen = true;
  state.ui.logoBatch.zoneKey = zoneKey;
  state.ui.logoBatch.status = 'idle';
  state.ui.logoBatch.summary = '拖动预览中的 LOGO 可调整位置，点击“应用到全部图片”后会覆盖当前区域图片，但可随时恢复原图。';
  state.ui.logoBatch.activePreviewIndex = 0;
  renderLogoBatchModal();
}

function closeLogoBatchModal() {
  if (state.ui.logoBatch.status === 'loading') {
    return;
  }
  state.ui.logoBatch.isOpen = false;
  state.ui.logoBatch.zoneKey = '';
  state.ui.logoBatch.status = 'idle';
  state.ui.logoBatch.drag.isActive = false;
  state.ui.logoBatch.drag.pointerId = null;
  state.ui.logoBatch.preview = {
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    displayWidth: 0,
    displayHeight: 0,
    logoDisplayWidth: 0,
    logoDisplayHeight: 0
  };
  renderLogoBatchModal();
}

function renderLogoBatchModal() {
  if (!dom.logoBatchModal) {
    return;
  }

  const batchState = state.ui.logoBatch;
  const zoneKey = batchState.zoneKey;
  const zoneMeta = LOGO_BATCH_ZONE_META[zoneKey] || null;
  const isOpen = Boolean(batchState.isOpen && zoneMeta);
  const available = canUseLogoBatch();
  const config = zoneMeta ? getLogoBatchConfig(zoneKey) : buildInitialLogoBatchConfig();
  const previewRef = zoneMeta ? getLogoBatchPreviewRef(zoneKey) : null;
  const previewRefs = zoneMeta ? getLogoBatchPreviewRefs(zoneKey) : [];
  const isLoading = batchState.status === 'loading';
  const hasLogo = Boolean(config.logoRef?.fileUrl);
  const hasAppliedState = Array.isArray(config.sourceRefs) && config.sourceRefs.some((item) => Boolean(item));

  dom.logoBatchModal.hidden = !isOpen;
  if (!isOpen) {
    if (dom.logoBatchStage) {
      dom.logoBatchStage.innerHTML = '';
    }
    return;
  }

  dom.logoBatchTitle.textContent = zoneMeta.title;
  dom.logoBatchDesc.textContent = zoneMeta.desc;
  dom.logoBatchPreviewLabel.textContent = zoneMeta.previewLabel;
  dom.logoBatchPreviewMeta.textContent = getLogoBatchPreviewMetaText(zoneKey);
  dom.logoBatchSummary.textContent = batchState.summary || '调整完成后可一键应用到全部图片。';
  dom.logoBatchLogoStatus.textContent = config.logoRef?.fileName
    ? `${config.logoRef.fileName}${config.logoRef.importedAt ? ` · ${formatDateTime(config.logoRef.importedAt)}` : ''}`
    : '尚未上传 LOGO。';
  dom.logoBatchAreaRange.value = String(config.areaPercent);
  dom.logoBatchAreaInput.value = String(config.areaPercent);
  dom.logoBatchUploadBtn.disabled = !available || isLoading;
  dom.logoBatchResetPositionBtn.disabled = !available || isLoading || !hasLogo;
  dom.logoBatchRestoreBtn.disabled = !available || isLoading || !hasAppliedState;
  dom.logoBatchApplyBtn.disabled = !available || isLoading || !hasLogo || !previewRefs.length;
  dom.logoBatchPrevBtn.disabled = !previewRefs.length || previewRefs.length <= 1 || isLoading;
  dom.logoBatchNextBtn.disabled = !previewRefs.length || previewRefs.length <= 1 || isLoading;
  renderLogoBatchPreviewStage(previewRef, config, { isLoading });
}

function renderLogoBatchPreviewStage(previewRef, config, { isLoading = false } = {}) {
  if (!dom.logoBatchStage) {
    return;
  }

  if (!previewRef?.fileUrl) {
    dom.logoBatchStage.innerHTML = [
      '<div class="detail-preview-empty">',
      '<span class="detail-preview-empty__graphic" aria-hidden="true"></span>',
      '<strong>暂无可预览图片</strong>',
      '<span>请先上传当前区域图片。</span>',
      '</div>'
    ].join('');
    return;
  }

  const draggingClass = state.ui.logoBatch.drag.isActive ? ' is-dragging' : '';
  const overlayMarkup = config.logoRef?.fileUrl
    ? [
      '<div class="logo-batch-modal__overlay" id="logoBatchOverlay">',
      `<img id="logoBatchLogoImage" class="logo-batch-modal__logo" src="${escapeHtml(config.logoRef.fileUrl)}" alt="LOGO 预览" draggable="false">`,
      '<div id="logoBatchLogoFrame" class="logo-batch-modal__logo-frame"></div>',
      '</div>'
    ].join('')
    : '';

  dom.logoBatchStage.innerHTML = [
    `<div id="logoBatchCanvas" class="logo-batch-modal__canvas${draggingClass}"${isLoading ? ' aria-busy="true"' : ''}>`,
    `<img id="logoBatchBaseImage" class="logo-batch-modal__base" src="${escapeHtml(previewRef.fileUrl)}" alt="图片预览" draggable="false">`,
    overlayMarkup,
    '</div>'
  ].join('');

  const baseImage = document.getElementById('logoBatchBaseImage');
  if (baseImage) {
    const syncPreview = () => syncLogoBatchPreviewMetrics();
    baseImage.addEventListener('load', syncPreview, { once: true });
    if (baseImage.complete) {
      syncLogoBatchPreviewMetrics();
    }
  }

  const logoImage = document.getElementById('logoBatchLogoImage');
  if (logoImage) {
    const syncPreview = () => syncLogoBatchPreviewMetrics();
    logoImage.addEventListener('load', syncPreview, { once: true });
    if (logoImage.complete) {
      syncLogoBatchPreviewMetrics();
    }
  }

  const canvas = document.getElementById('logoBatchCanvas');
  if (canvas) {
    canvas.addEventListener('pointerdown', handleLogoBatchPointerDown);
  }
}

function syncLogoBatchPreviewMetrics() {
  const zoneKey = state.ui.logoBatch.zoneKey;
  const config = getLogoBatchConfig(zoneKey);
  const baseImage = document.getElementById('logoBatchBaseImage');
  const logoImage = document.getElementById('logoBatchLogoImage');
  const logoFrame = document.getElementById('logoBatchLogoFrame');
  const canvas = document.getElementById('logoBatchCanvas');
  if (!baseImage || !canvas) {
    return;
  }

  const rect = baseImage.getBoundingClientRect();
  state.ui.logoBatch.preview.imageNaturalWidth = baseImage.naturalWidth || 0;
  state.ui.logoBatch.preview.imageNaturalHeight = baseImage.naturalHeight || 0;
  state.ui.logoBatch.preview.displayWidth = rect.width || 0;
  state.ui.logoBatch.preview.displayHeight = rect.height || 0;

  if (!logoImage || !logoFrame || !config.logoRef?.fileUrl || !rect.width || !rect.height) {
    return;
  }

  const logoNaturalWidth = logoImage.naturalWidth || 0;
  const logoNaturalHeight = logoImage.naturalHeight || 0;
  const displaySize = computeLogoRenderBox({
    baseWidth: rect.width,
    baseHeight: rect.height,
    logoWidth: logoNaturalWidth,
    logoHeight: logoNaturalHeight,
    areaPercent: config.areaPercent
  });

  state.ui.logoBatch.preview.logoDisplayWidth = displaySize.width;
  state.ui.logoBatch.preview.logoDisplayHeight = displaySize.height;
  const positioned = clampLogoCenterToFrame({
    centerX: config.centerXRatio * rect.width,
    centerY: config.centerYRatio * rect.height,
    width: displaySize.width,
    height: displaySize.height,
    frameWidth: rect.width,
    frameHeight: rect.height
  });
  const left = positioned.centerX - displaySize.width / 2;
  const top = positioned.centerY - displaySize.height / 2;

  logoImage.style.width = `${displaySize.width}px`;
  logoImage.style.height = `${displaySize.height}px`;
  logoImage.style.left = `${left}px`;
  logoImage.style.top = `${top}px`;
  logoFrame.style.width = `${displaySize.width}px`;
  logoFrame.style.height = `${displaySize.height}px`;
  logoFrame.style.left = `${left}px`;
  logoFrame.style.top = `${top}px`;
}

function computeLogoRenderBox({ baseWidth, baseHeight, logoWidth, logoHeight, areaPercent }) {
  const safeBaseWidth = Number(baseWidth) || 0;
  const safeBaseHeight = Number(baseHeight) || 0;
  const safeLogoWidth = Number(logoWidth) || 0;
  const safeLogoHeight = Number(logoHeight) || 0;
  if (!safeBaseWidth || !safeBaseHeight || !safeLogoWidth || !safeLogoHeight) {
    return { width: 0, height: 0 };
  }

  const targetArea = safeBaseWidth * safeBaseHeight * (clampLogoBatchAreaPercent(areaPercent) / 100);
  let scale = Math.sqrt(targetArea / (safeLogoWidth * safeLogoHeight));
  let width = safeLogoWidth * scale;
  let height = safeLogoHeight * scale;
  if (width > safeBaseWidth || height > safeBaseHeight) {
    const shrink = Math.min(safeBaseWidth / width, safeBaseHeight / height);
    width *= shrink;
    height *= shrink;
  }
  return {
    width,
    height
  };
}

function clampLogoCenterToFrame({ centerX, centerY, width, height, frameWidth, frameHeight }) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return {
    centerX: clamp(halfWidth, centerX, Math.max(halfWidth, frameWidth - halfWidth)),
    centerY: clamp(halfHeight, centerY, Math.max(halfHeight, frameHeight - halfHeight))
  };
}

function handleLogoBatchPointerDown(event) {
  const zoneKey = state.ui.logoBatch.zoneKey;
  const config = getLogoBatchConfig(zoneKey);
  if (!config.logoRef?.fileUrl || state.ui.logoBatch.status === 'loading') {
    return;
  }
  const canvas = document.getElementById('logoBatchCanvas');
  if (!canvas) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return;
  }

  state.ui.logoBatch.drag.isActive = true;
  state.ui.logoBatch.drag.pointerId = event.pointerId;
  state.ui.logoBatch.drag.startX = event.clientX;
  state.ui.logoBatch.drag.startY = event.clientY;
  state.ui.logoBatch.drag.originCenterXRatio = config.centerXRatio;
  state.ui.logoBatch.drag.originCenterYRatio = config.centerYRatio;
  canvas.classList.add('is-dragging');
  canvas.setPointerCapture?.(event.pointerId);
  canvas.addEventListener('pointermove', handleLogoBatchPointerMove);
  canvas.addEventListener('pointerup', handleLogoBatchPointerUp);
  canvas.addEventListener('pointercancel', handleLogoBatchPointerUp);
}

function handleLogoBatchPointerMove(event) {
  if (!state.ui.logoBatch.drag.isActive || event.pointerId !== state.ui.logoBatch.drag.pointerId) {
    return;
  }
  const zoneKey = state.ui.logoBatch.zoneKey;
  const config = getLogoBatchConfig(zoneKey);
  const displayWidth = state.ui.logoBatch.preview.displayWidth;
  const displayHeight = state.ui.logoBatch.preview.displayHeight;
  const logoWidth = state.ui.logoBatch.preview.logoDisplayWidth;
  const logoHeight = state.ui.logoBatch.preview.logoDisplayHeight;
  if (!displayWidth || !displayHeight || !logoWidth || !logoHeight) {
    return;
  }

  const deltaX = event.clientX - state.ui.logoBatch.drag.startX;
  const deltaY = event.clientY - state.ui.logoBatch.drag.startY;
  const next = clampLogoCenterToFrame({
    centerX: state.ui.logoBatch.drag.originCenterXRatio * displayWidth + deltaX,
    centerY: state.ui.logoBatch.drag.originCenterYRatio * displayHeight + deltaY,
    width: logoWidth,
    height: logoHeight,
    frameWidth: displayWidth,
    frameHeight: displayHeight
  });
  config.centerXRatio = next.centerX / displayWidth;
  config.centerYRatio = next.centerY / displayHeight;
  syncLogoBatchPreviewMetrics();
}

function handleLogoBatchPointerUp(event) {
  if (state.ui.logoBatch.drag.pointerId !== event.pointerId) {
    return;
  }
  const canvas = document.getElementById('logoBatchCanvas');
  state.ui.logoBatch.drag.isActive = false;
  state.ui.logoBatch.drag.pointerId = null;
  canvas?.classList.remove('is-dragging');
  canvas?.releasePointerCapture?.(event.pointerId);
  canvas?.removeEventListener('pointermove', handleLogoBatchPointerMove);
  canvas?.removeEventListener('pointerup', handleLogoBatchPointerUp);
  canvas?.removeEventListener('pointercancel', handleLogoBatchPointerUp);
}

function shiftLogoBatchPreviewIndex(offset) {
  const zoneKey = state.ui.logoBatch.zoneKey;
  const previewRefs = getLogoBatchPreviewRefs(zoneKey);
  if (previewRefs.length <= 1) {
    return;
  }
  const current = state.ui.logoBatch.activePreviewIndex || 0;
  state.ui.logoBatch.activePreviewIndex = (current + offset + previewRefs.length) % previewRefs.length;
  renderLogoBatchModal();
}

function handleLogoBatchAreaRangeInput(event) {
  updateLogoBatchAreaPercent(event.target?.value, { from: 'range' });
}

function handleLogoBatchAreaInput(event) {
  updateLogoBatchAreaPercent(event.target?.value, { from: 'input', deferNormalize: true });
}

function normalizeLogoBatchAreaInput() {
  const zoneKey = state.ui.logoBatch.zoneKey;
  if (!zoneKey) {
    return;
  }
  const config = getLogoBatchConfig(zoneKey);
  config.areaPercent = clampLogoBatchAreaPercent(config.areaPercent);
  renderLogoBatchModal();
}

function updateLogoBatchAreaPercent(rawValue, { from = 'input', deferNormalize = false } = {}) {
  const zoneKey = state.ui.logoBatch.zoneKey;
  if (!zoneKey) {
    return;
  }
  const config = getLogoBatchConfig(zoneKey);
  const nextValue = deferNormalize ? Number(rawValue) : clampLogoBatchAreaPercent(rawValue);
  if (!Number.isFinite(nextValue)) {
    return;
  }
  config.areaPercent = deferNormalize ? nextValue : clampLogoBatchAreaPercent(nextValue);
  if (from !== 'range' && dom.logoBatchAreaRange) {
    dom.logoBatchAreaRange.value = String(clampLogoBatchAreaPercent(config.areaPercent));
  }
  if (from !== 'input' && dom.logoBatchAreaInput) {
    dom.logoBatchAreaInput.value = String(clampLogoBatchAreaPercent(config.areaPercent));
  }
  syncLogoBatchPreviewMetrics();
}

function handleLogoBatchResetPosition() {
  const zoneKey = state.ui.logoBatch.zoneKey;
  if (!zoneKey) {
    return;
  }
  const config = getLogoBatchConfig(zoneKey);
  const fallback = createDefaultLogoBatchPosition(config.areaPercent);
  config.centerXRatio = fallback.centerXRatio;
  config.centerYRatio = fallback.centerYRatio;
  syncLogoBatchPreviewMetrics();
}

async function handleLogoBatchUpload() {
  const zoneKey = state.ui.logoBatch.zoneKey;
  const zoneMeta = LOGO_BATCH_ZONE_META[zoneKey];
  if (!zoneMeta || !canUseLogoBatch()) {
    return;
  }
  const config = getLogoBatchConfig(zoneKey);
  const previousRef = config.logoRef;
  const imported = await state.bridge.asset.import({
    templateId: state.currentTemplateId,
    zone: zoneMeta.internalLogoZone,
    slotIndex: null,
    multiple: false,
    maxCount: 1
  });
  if (!imported) {
    return;
  }
  if (previousRef && !previousRef.temporary) {
    await state.bridge.asset.remove({ ref: stripTransientFields(previousRef) }).catch(() => undefined);
  }
  config.logoRef = imported;
  config.updatedAt = new Date().toISOString();
  renderLogoBatchModal();
}

async function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败'));
    image.src = src;
  });
}

async function composeLogoImageDataUrl(baseRef, logoRef, { areaPercent, centerXRatio, centerYRatio }) {
  const baseImage = await loadImageElement(baseRef.fileUrl);
  const logoImage = await loadImageElement(logoRef.fileUrl);
  const canvas = document.createElement('canvas');
  canvas.width = baseImage.naturalWidth || baseImage.width;
  canvas.height = baseImage.naturalHeight || baseImage.height;
  const context = canvas.getContext('2d');
  if (!context || !canvas.width || !canvas.height) {
    throw new Error('无法生成 LOGO 图片');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
  const renderBox = computeLogoRenderBox({
    baseWidth: canvas.width,
    baseHeight: canvas.height,
    logoWidth: logoImage.naturalWidth || logoImage.width,
    logoHeight: logoImage.naturalHeight || logoImage.height,
    areaPercent
  });
  const positioned = clampLogoCenterToFrame({
    centerX: centerXRatio * canvas.width,
    centerY: centerYRatio * canvas.height,
    width: renderBox.width,
    height: renderBox.height,
    frameWidth: canvas.width,
    frameHeight: canvas.height
  });
  const left = positioned.centerX - renderBox.width / 2;
  const top = positioned.centerY - renderBox.height / 2;
  context.drawImage(logoImage, left, top, renderBox.width, renderBox.height);

  const extension = String(baseRef.fileName || '').toLowerCase();
  const mimeType = extension.endsWith('.jpg') || extension.endsWith('.jpeg')
    ? 'image/jpeg'
    : extension.endsWith('.webp')
      ? 'image/webp'
      : 'image/png';
  return canvas.toDataURL(mimeType);
}

function buildLogoBatchFileNameHint(ref) {
  return String(ref?.fileName || 'logo-batch')
    .replace(/\.[^.]+$/g, '')
    .slice(0, 48);
}

function buildAppliedLogoBatchPayload(zoneKey, config, nextRefs) {
  const payload = {
    logoRef: sanitizeAssetRef(config.logoRef),
    sourceRefs: zoneKey === 'skuThumbs'
      ? sanitizeLogoBatchRefs(config.sourceRefs, { allowNullItems: true })
      : sanitizeLogoBatchRefs(config.sourceRefs),
    areaPercent: clampLogoBatchAreaPercent(config.areaPercent),
    centerXRatio: clamp(0, config.centerXRatio, 1),
    centerYRatio: clamp(0, config.centerYRatio, 1),
    updatedAt: new Date().toISOString()
  };
  config.pendingGeneratedRefs = nextRefs;
  return payload;
}

async function handleLogoBatchApply() {
  const zoneKey = state.ui.logoBatch.zoneKey;
  const zoneMeta = LOGO_BATCH_ZONE_META[zoneKey];
  const config = getLogoBatchConfig(zoneKey);
  if (!zoneMeta || !config.logoRef?.fileUrl) {
    return;
  }

  const sourceRefs = getLogoBatchEffectiveSourceRefs(zoneKey);
  const validSourceRefs = sourceRefs.filter(Boolean);
  if (!validSourceRefs.length) {
    window.alert('当前区域没有可处理的图片。');
    return;
  }

  state.ui.logoBatch.status = 'loading';
  state.ui.logoBatch.summary = `正在为 ${validSourceRefs.length} 张图片生成带 LOGO 素材...`;
  renderLogoBatchModal();

  try {
    const items = [];
    for (let index = 0; index < sourceRefs.length; index += 1) {
      const sourceRef = sourceRefs[index];
      if (!sourceRef) {
        continue;
      }
      const dataUrl = await composeLogoImageDataUrl(sourceRef, config.logoRef, {
        areaPercent: config.areaPercent,
        centerXRatio: config.centerXRatio,
        centerYRatio: config.centerYRatio
      });
      items.push({
        slotIndex: index,
        dataUrl,
        fileNameHint: buildLogoBatchFileNameHint(sourceRef)
      });
    }

    const writtenRefs = await state.bridge.asset.writeGeneratedBatch({
      templateId: state.currentTemplateId,
      zone: zoneKey,
      items
    });

    config.sourceRefs = zoneKey === 'skuThumbs'
      ? sourceRefs.map((ref) => sanitizeAssetRef(ref))
      : sourceRefs.filter(Boolean).map((ref) => sanitizeAssetRef(ref));
    const logoBatchPayload = buildAppliedLogoBatchPayload(zoneKey, config, writtenRefs);

    if (zoneKey === 'mainGallery') {
      await replaceMainGalleryRefs(writtenRefs, {
        nextLogoBatch: logoBatchPayload,
        skipClearLogoBatch: true,
        preservePreviousRefs: true
      });
    } else if (zoneKey === 'skuThumbs') {
      await replaceSkuThumbRefs(writtenRefs, {
        nextLogoBatch: logoBatchPayload,
        skipClearLogoBatch: true,
        preservePreviousRefs: true
      });
    }

    config.pendingGeneratedRefs = null;
    state.ui.logoBatch.status = 'idle';
    state.ui.logoBatch.summary = `已为当前${zoneKey === 'mainGallery' ? '轮播图' : 'SKU图'}应用 LOGO，可继续调整或恢复原图。`;
    await saveCurrentTemplate({ silent: true });
    renderWorkspaceMeta();
    renderLogoBatchModal();
  } catch (error) {
    state.ui.logoBatch.status = 'idle';
    state.ui.logoBatch.summary = error instanceof Error ? error.message : '批量加 LOGO 失败，请稍后重试。';
    renderLogoBatchModal();
    throw error;
  }
}

async function handleLogoBatchRestore() {
  const zoneKey = state.ui.logoBatch.zoneKey;
  const config = getLogoBatchConfig(zoneKey);
  const sourceRefs = Array.isArray(config.sourceRefs) ? config.sourceRefs : [];
  if (!sourceRefs.some((item) => Boolean(item))) {
    return;
  }

  if (zoneKey === 'mainGallery') {
    await replaceMainGalleryRefs(sourceRefs.filter(Boolean), {
      clearLogoBatch: true,
      skipClearLogoBatch: true,
      preservePreviousRefs: false
    });
  } else if (zoneKey === 'skuThumbs') {
    await replaceSkuThumbRefs(sourceRefs, {
      clearLogoBatch: true,
      skipClearLogoBatch: true,
      preservePreviousRefs: false
    });
  }

  await clearLogoBatchState(zoneKey, { preserveCurrentImages: true, reason: '' });
  state.ui.logoBatch.summary = '已恢复原图，你可以重新上传 LOGO 再次应用。';
  renderLogoBatchModal();
}

function renderImagePreviewModal() {
  if (!dom.imagePreviewModal) {
    return;
  }

  const preview = state.ui.imagePreview || {};
  const ref = preview.ref || null;
  const isOpen = Boolean(preview.isOpen && ref?.fileUrl);
  dom.imagePreviewModal.hidden = !isOpen;

  if (!isOpen) {
    if (dom.imagePreviewImage) {
      dom.imagePreviewImage.removeAttribute('src');
      dom.imagePreviewImage.alt = '查看图片';
    }

    if (dom.imagePreviewMeta) {
      dom.imagePreviewMeta.textContent = '';
    }
    return;
  }

  const title = preview.label || ref.fileName || '查看图片';
  dom.imagePreviewTitle.textContent = title;
  dom.imagePreviewImage.src = ref.fileUrl;
  dom.imagePreviewImage.alt = title;
  dom.imagePreviewMeta.textContent = [
    ref.fileName || title,
    ref.importedAt ? `导入时间 ${formatDateTime(ref.importedAt)}` : ''
  ].filter(Boolean).join(' · ');
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

function renderAutoFillState() {
  if (!dom.startAutoFillBtn) {
    return;
  }

  const isRunning = state.autoFill.status === 'running';
  const hasBridge = Boolean(state.bridge?.automation?.startAutoFill);
  const hasTemplate = Boolean(state.currentTemplateId);
  const hasShop = Boolean(state.shop.selected?.shopCode);
  const hasPermission = canUseAutoFill(state.auth.user);
  const disabled = isRunning || !hasBridge || !hasTemplate || !hasShop || !hasPermission;

  dom.startAutoFillBtn.disabled = disabled;
  dom.startAutoFillBtn.textContent = isRunning ? '自动填充中...' : '启动自动填充';

  if (!hasPermission && state.auth.user) {
    dom.startAutoFillBtn.title = getAutoFillDeniedMessage();
  } else if (!hasShop) {
    dom.startAutoFillBtn.title = '请先选择当前店铺';
  } else if (!hasTemplate) {
    dom.startAutoFillBtn.title = '请先选择模板';
  } else if (!hasBridge) {
    dom.startAutoFillBtn.title = '当前环境不支持自动填充';
  } else {
    dom.startAutoFillBtn.title = state.autoFill.summary || '启动自动填充';
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

async function handleStartAutoFill() {
  if (state.autoFill.status === 'running') {
    return;
  }

  if (!state.bridge?.automation?.startAutoFill) {
    const message = '当前环境不支持自动填充，请使用桌面端最新版本。';
    showAuthNotice(message);
    pushLocalLog('warning', message);
    return;
  }

  if (!canUseAutoFill(state.auth.user)) {
    const message = getAutoFillDeniedMessage();
    showAuthNotice(message);
    pushLocalLog('warning', message);
    return;
  }

  if (!state.currentTemplateId) {
    const message = '请先选择模板，再启动自动填充。';
    showAuthNotice(message);
    pushLocalLog('warning', message);
    return;
  }

  const selectedShop = state.shop.selected;
  if (!selectedShop?.shopCode) {
    const message = '请先选择当前店铺，再启动自动填充。';
    showAuthNotice(message);
    pushLocalLog('warning', message);
    return;
  }

  state.autoFill.status = 'running';
  state.autoFill.error = '';
  state.autoFill.summary = `正在保存模板并准备店铺《${selectedShop.shopName || selectedShop.shopCode}》自动填充...`;
  state.autoFill.shopCode = selectedShop.shopCode;
  state.autoFill.shopName = selectedShop.shopName || selectedShop.shopCode;
  renderAutoFillState();
  pushLocalLog('info', state.autoFill.summary);

  try {
    const saved = await saveCurrentTemplate({ silent: true });
    const templateId = saved?.id || state.currentTemplateId;
    const result = await state.bridge.automation.startAutoFill({
      templateId,
      shopCode: selectedShop.shopCode
    });

    if (!result?.ok) {
      const message = result?.error?.message || '自动填充启动失败，请稍后重试。';
      state.autoFill.status = 'error';
      state.autoFill.error = message;
      state.autoFill.summary = message;
      renderAutoFillState();
      showAuthNotice(message);
      pushLocalLog('error', `自动填充启动失败：${message}`);
      return;
    }

    state.autoFill.status = 'success';
    state.autoFill.error = '';
    state.autoFill.summary = result.message || '自动填充已完成，请人工检查后发布。';
    state.autoFill.runId = result.runId || state.autoFill.runId;
    renderAutoFillState();
  } catch (error) {
    const message = error instanceof Error ? error.message : '自动填充启动失败，请稍后重试。';
    state.autoFill.status = 'error';
    state.autoFill.error = message;
    state.autoFill.summary = message;
    renderAutoFillState();
    showAuthNotice(message);
    pushLocalLog('error', `自动填充启动失败：${message}`);
  }
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
  const pathHints = splitCategoryPath(categoryPath);
  const categoryIds = detailResult.categoryIds && typeof detailResult.categoryIds === 'object'
    ? detailResult.categoryIds
    : null;

  let resolvedSelection = null;
  if (categoryIds && Object.values(categoryIds).some((value) => String(value || '').trim())) {
    resolvedSelection = await resolveCategorySelectionFromDetail({
      shopCode: resolvedShopCode,
      categoryIds,
      pathHints
    });
  }

  if (!resolvedSelection || resolvedSelection.degraded || !resolvedSelection.leafId) {
    if (categoryPath) {
      const pathFallback = await resolveCategorySelectionFromPath({
        shopCode: resolvedShopCode,
        pathHints
      });
      if (pathFallback?.leafId) {
        resolvedSelection = {
          ...pathFallback,
          matchedDepth: 3,
          degraded: false
        };
      }
    }
  }

  if (!resolvedSelection?.leafId) {
    const matched = resolvedSelection?.matchedDepth || 0;
    const reason = matched > 0
      ? `已自动定位到 ${matched} 级类目，但更深层级在店铺《${resolvedShopLabel}》下未匹配，请打开类目选择器手动确认。`
      : `店铺《${resolvedShopLabel}》下无法解析该商品类目，请确认商品类目是否可发布。`;
    return createProductFillFailure(reason, 'CATEGORY_NOT_RESOLVED');
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
    syncSkuSpecValueListsToForm(state.skuSpec.valueLists);

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
        outSkuSn: sku?.outSkuSn || sku?.externalSkuCode
      }),
      specItems: Array.isArray(sku?.specItems) ? sku.specItems : [],
      skuImageUrl: String(sku?.skuImageUrl || '').trim()
    }))
    .filter((row) => {
      return SKU_FIELD_NAMES.some((fieldName) => String(row[fieldName] || '').trim() !== '');
    });
}

function isSkuSpecValueColorLike(value) {
  return extractColorTokens(value).length > 0;
}

function isSkuSpecValueSizeLike(value) {
  const text = String(value || '').trim();
  if (!text) {
    return false;
  }

  return /均码|大码|小码|中码|加大码|常规款|高个子|小个子|短版|长版|超长版|加长版|短筒|中筒|长筒|薄款|厚款|春秋款/i.test(text)
    || /\b(?:XS|S|M|L|XL|XXL|XXXL|XXXXL)\b/i.test(text)
    || /\d+\s*[-~—至]\s*\d+\s*(?:cm|CM|斤|kg|KG|码|m|M)/.test(text)
    || /\d+\s*D/i.test(text);
}

function inferFallbackSkuSpecLabel(values, slotIndex) {
  const normalizedValues = (Array.isArray(values) ? values : []).map((value) => String(value || '').trim()).filter(Boolean);
  if (!normalizedValues.length) {
    return '';
  }

  const colorCount = normalizedValues.filter((value) => isSkuSpecValueColorLike(value)).length;
  const sizeCount = normalizedValues.filter((value) => isSkuSpecValueSizeLike(value)).length;

  if (colorCount > 0 && colorCount >= sizeCount) {
    return '颜色';
  }

  if (sizeCount > 0) {
    return '尺码';
  }

  return slotIndex === 0 ? '规格一' : '规格二';
}

function buildFallbackSkuSpecConfigFromRows(rows) {
  const valueBuckets = [new Set(), new Set()];

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const parts = splitSkuSpecName(row?.specName);
    const colorValue = String(parts[0] || '').trim();
    const sizeValue = String(parts.slice(1).join(' / ') || '').trim();
    if (colorValue) {
      valueBuckets[0].add(colorValue);
    }
    if (sizeValue) {
      valueBuckets[1].add(sizeValue);
    }
  });

  const valueLists = normalizeSkuSpecValueLists(valueBuckets.map((bucket) => Array.from(bucket)));
  return {
    selectedSlots: normalizeSkuSpecSelections(valueLists.map((values, slotIndex) => {
      if (!values.length) {
        return createEmptySkuSpecSelection();
      }

      return {
        id: '',
        label: inferFallbackSkuSpecLabel(values, slotIndex)
      };
    })),
    valueLists
  };
}

function mergeSkuSpecConfigs(primaryConfig, fallbackConfig) {
  const primarySelections = normalizeSkuSpecSelections(primaryConfig?.selectedSlots);
  const fallbackSelections = normalizeSkuSpecSelections(fallbackConfig?.selectedSlots);
  const primaryValueLists = normalizeSkuSpecValueLists(primaryConfig?.valueLists);
  const fallbackValueLists = normalizeSkuSpecValueLists(fallbackConfig?.valueLists);

  return {
    selectedSlots: normalizeSkuSpecSelections([0, 1].map((slotIndex) => {
      const primarySelection = primarySelections[slotIndex];
      if (primarySelection?.id || primarySelection?.label) {
        return primarySelection;
      }
      return fallbackSelections[slotIndex];
    })),
    valueLists: normalizeSkuSpecValueLists([0, 1].map((slotIndex) => {
      const mergedValues = [];
      const seenValues = new Set();

      [...(primaryValueLists[slotIndex] || []), ...(fallbackValueLists[slotIndex] || [])].forEach((value) => {
        const normalizedValue = String(value || '').trim();
        if (!normalizedValue || seenValues.has(normalizedValue)) {
          return;
        }

        seenValues.add(normalizedValue);
        mergedValues.push(normalizedValue);
      });

      return mergedValues;
    }))
  };
}

function rearrangeSkuRowsByCartesianProduct(rows, selections, valueLists) {
  const slot1 = selections?.[0] || { id: '', label: '' };
  const slot2 = selections?.[1] || { id: '', label: '' };
  const values1 = Array.isArray(valueLists?.[0]) ? valueLists[0].filter(Boolean) : [];
  const values2 = Array.isArray(valueLists?.[1]) ? valueLists[1].filter(Boolean) : [];

  const matchSlotValue = (row, slot, slotIndex) => {
    const list = Array.isArray(row?.specItems) ? row.specItems : [];
    const slotId = String(slot?.id || '').trim();
    const slotLabel = String(slot?.label || '').trim();
    const hit = list.find((item) => {
      const parentId = String(item?.parentId || '').trim();
      const parentName = String(item?.parentName || '').trim();
      return (slotId && slotId === parentId) || (slotLabel && slotLabel === parentName);
    });
    const structuredValue = String(hit?.specName || '').trim();
    if (structuredValue) {
      return structuredValue;
    }

    const parts = splitSkuSpecName(row?.specName);
    if (slotIndex === 0) {
      return String(parts[0] || '').trim();
    }
    if (slotIndex === 1) {
      return String(parts.slice(1).join(' / ') || '').trim();
    }
    return String(parts[slotIndex] || '').trim();
  };

  const rowMap = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const v1 = matchSlotValue(row, slot1, 0);
    const v2 = slot2.id || slot2.label ? matchSlotValue(row, slot2, 1) : '';
    const key = `${v1}${v2}`;
    if (!rowMap.has(key)) {
      rowMap.set(key, row);
    }
  });

  const outerValues = values1.length ? values1 : [''];
  const innerValues = (slot2.id || slot2.label) && values2.length ? values2 : [''];

  const ordered = [];
  outerValues.forEach((v1) => {
    innerValues.forEach((v2) => {
      const key = `${v1}${v2}`;
      const row = rowMap.get(key);
      const composedSpecName = [v1, v2].filter(Boolean).join(' / ');
      if (row) {
        ordered.push({
          ...row,
          specName: row.specName || composedSpecName
        });
      } else {
        ordered.push({
          ...buildBlankSkuRow(),
          specName: composedSpecName,
          stock: '0',
          specItems: [],
          skuImageUrl: ''
        });
      }
    });
  });

  return ordered;
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

  assignFormDataValue(nextFormData, 'pddForm_costTemplateId', 'costTemplateId', String(detail.costTemplateId || '').trim());
  assignFormDataValue(nextFormData, 'pddForm_sendAddress', 'sendAddress', String(detail.sendAddress || '').trim());

  const limitSec = String(detail.shipmentLimitSecond || '').trim();
  if (limitSec) {
    if (SHIPMENT_LIMIT_RADIO_VALUES.has(limitSec)) {
      assignFormDataValue(nextFormData, 'pddForm_shipmentLimitSecond', 'shipmentLimitSecond', limitSec);
      assignFormDataValue(nextFormData, 'pddForm_shipmentLimitSecondCustom', 'shipmentLimitSecondCustom', '');
    } else {
      assignFormDataValue(nextFormData, 'pddForm_shipmentLimitSecond', 'shipmentLimitSecond', 'custom');
      assignFormDataValue(nextFormData, 'pddForm_shipmentLimitSecondCustom', 'shipmentLimitSecondCustom', limitSec);
    }
  }

  if (shouldReplaceAttributes) {
    state.attribute.meta = {};
  }

  const attributeStats = applyDetailAttributesToFormData({
    formData: nextFormData,
    detailAttributes: detail.attributes,
    schema
  });

  const detailRowsByInterfaceOrder = buildSkuRowsFromProductDetail(detail.skus || skuRows);
  const nextSkuSpecConfig = mergeSkuSpecConfigs(
    {
      selectedSlots: buildSkuSpecSelectionsFromProductDetail(detail),
      valueLists: buildSkuSpecValueListsFromProductDetail(detail)
    },
    buildFallbackSkuSpecConfigFromRows(detailRowsByInterfaceOrder)
  );
  const nextSkuSpecSelections = nextSkuSpecConfig.selectedSlots;
  const hasSpecDimensions = nextSkuSpecSelections.some((item) => item.id || item.label);
  const nextSkuSpecValueLists = hasSpecDimensions ? nextSkuSpecConfig.valueLists : [[], []];
  const normalizedSkuRows = shouldReplaceSkuRows
    ? (hasSpecDimensions
      ? rearrangeSkuRowsByCartesianProduct(detailRowsByInterfaceOrder, nextSkuSpecSelections, nextSkuSpecValueLists)
      : detailRowsByInterfaceOrder)
    : getCurrentSkuRows();
  if (shouldReplaceSkuRows) {
    assignSkuRowsToFormData(nextFormData, normalizedSkuRows);
  }

  if (hasSpecDimensions) {
    assignSkuSpecSelectionsToFormData(nextFormData, nextSkuSpecSelections);
    assignSkuSpecValueListsToFormData(nextFormData, nextSkuSpecValueLists);
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
  const meta = {};

  (Array.isArray(detailAttributes) ? detailAttributes : []).forEach((detailAttribute) => {
    const refPid = String(detailAttribute?.refPid || '').trim();
    const schemaAttribute = schemaByRefPid.get(refPid);
    if (!schemaAttribute) {
      skippedCount += 1;
      return;
    }

    const resolved = resolveProductAttributeFillValue(detailAttribute, schemaAttribute);
    if (!resolved.value) {
      skippedCount += 1;
      return;
    }

    assignFormDataValue(
      formData,
      buildAttributeControlId(refPid),
      buildAttributeControlName(refPid),
      resolved.value
    );
    filledCount += 1;
    if (resolved.vid || resolved.unit) {
      meta[refPid] = {
        ...(resolved.vid ? { vid: resolved.vid } : {}),
        ...(resolved.unit ? { unit: resolved.unit } : {})
      };
    }
  });

  state.attribute.meta = {
    ...(state.attribute.meta || {}),
    ...meta
  };

  return {
    filledCount,
    skippedCount,
    meta
  };
}

function resolveProductAttributeFillValue(detailAttribute, schemaAttribute) {
  const values = Array.isArray(detailAttribute?.values) ? detailAttribute.values : [];
  if (!values.length) {
    return { value: '', vid: '', unit: '' };
  }

  if (schemaAttribute.controlType === 1 && Array.isArray(schemaAttribute.options) && schemaAttribute.options.length) {
    const optionsByVid = new Map(
      schemaAttribute.options
        .filter((option) => option && (option.id || option.vid))
        .map((option) => [String(option.id ?? option.vid).trim(), option])
    );
    const optionsByLabel = new Map(
      schemaAttribute.options.map((option) => [String(option.label || '').trim(), option])
    );

    for (const item of values) {
      const vid = String(item?.vid || '').trim();
      if (vid && optionsByVid.has(vid)) {
        const option = optionsByVid.get(vid);
        return {
          value: String(option.label || '').trim(),
          vid,
          unit: String(item?.unit || '').trim()
        };
      }
    }

    for (const item of values) {
      const label = String(item?.rawValue || item?.value || '').trim();
      if (label && optionsByLabel.has(label)) {
        const option = optionsByLabel.get(label);
        return {
          value: label,
          vid: String(option.id ?? option.vid ?? '').trim(),
          unit: String(item?.unit || '').trim()
        };
      }
    }

    return { value: '', vid: '', unit: '' };
  }

  const joinedValue = values
    .map((item) => String(item.rawValue || item.value || '').trim())
    .filter(Boolean)
    .join('，');

  const truncated = truncateByControlLimit(joinedValue, buildAttributeControlId(schemaAttribute.refPid), schemaAttribute.maxValue);
  const firstWithVid = values.find((item) => String(item?.vid || '').trim());
  const firstWithUnit = values.find((item) => String(item?.unit || '').trim());

  return {
    value: truncated,
    vid: String(firstWithVid?.vid || '').trim(),
    unit: String(firstWithUnit?.unit || '').trim()
  };
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
  await clearLogoBatchForImageChange('skuThumbs', 'SKU 图已被新的商品数据覆盖，请重新应用 LOGO。');
  renderSkuRows(rows, {
    imageRefs: nextRefs
  });
  await cleanupAssetRefs(previousRefs);
}

async function replaceSkuThumbRefs(nextRefs, options = {}) {
  const {
    nextLogoBatch = null,
    clearLogoBatch = false,
    skipClearLogoBatch = false,
    preservePreviousRefs = false
  } = options;
  const previousRefs = Array.isArray(state.slotRegistry.skuThumbs)
    ? state.slotRegistry.skuThumbs.map((slot) => slot.__assetRef || null)
    : [];
  const skuRows = getCurrentSkuRows();
  renderSkuRows(skuRows, {
    imageRefs: Array.isArray(nextRefs) ? nextRefs : []
  });
  if (nextLogoBatch) {
    syncUiLogoBatchConfig('skuThumbs', nextLogoBatch);
    ensureCurrentTemplateLogoBatchStore().skuThumbs = sanitizeLogoBatchConfig(nextLogoBatch, 'skuThumbs');
  } else if (clearLogoBatch) {
    syncUiLogoBatchConfig('skuThumbs', null);
    ensureCurrentTemplateLogoBatchStore().skuThumbs = null;
  }
  if (!preservePreviousRefs) {
    await cleanupAssetRefs(previousRefs);
  }
  if (!skipClearLogoBatch) {
    await clearLogoBatchState('skuThumbs', { preserveCurrentImages: true, reason: '' });
  }
}

async function replaceDetailGalleryRefs(nextRefs, options = {}) {
  const previousRefs = getArrayZoneRefs('detailGallery');
  renderDynamicArrayZone('detailGallery', nextRefs);
  await cleanupAssetRefs(previousRefs);
}

async function replaceMainGalleryRefs(nextRefs, options = {}) {
  const {
    nextLogoBatch = null,
    clearLogoBatch = false,
    skipClearLogoBatch = false,
    preservePreviousRefs = false
  } = options;
  const previousRefs = getArrayZoneRefs('mainGallery');
  if (!skipClearLogoBatch && !nextLogoBatch) {
    await clearLogoBatchForImageChange('mainGallery', '轮播图已被新的商品数据覆盖，请重新应用 LOGO。');
  }
  renderDynamicArrayZone('mainGallery', nextRefs);
  if (nextLogoBatch) {
    syncUiLogoBatchConfig('mainGallery', nextLogoBatch);
    ensureCurrentTemplateLogoBatchStore().mainGallery = sanitizeLogoBatchConfig(nextLogoBatch, 'mainGallery');
  } else if (clearLogoBatch) {
    syncUiLogoBatchConfig('mainGallery', null);
    ensureCurrentTemplateLogoBatchStore().mainGallery = null;
  }
  if (!preservePreviousRefs) {
    await cleanupAssetRefs(previousRefs);
  }
  if (!skipClearLogoBatch) {
    await clearLogoBatchState('mainGallery', { preserveCurrentImages: true, reason: '' });
  }
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

async function cleanupSingleAssetRef(ref) {
  if (!ref) {
    return;
  }
  await cleanupAssetRefs([ref]);
}

function getLogoBatchAssetRefsToCleanup(zoneKey, config) {
  const refs = [];
  if (config?.logoRef) {
    refs.push(config.logoRef);
  }
  if (Array.isArray(config?.pendingGeneratedRefs)) {
    refs.push(...config.pendingGeneratedRefs.filter(Boolean));
  }
  return refs;
}

async function clearLogoBatchState(zoneKey, { preserveCurrentImages = false, reason = '' } = {}) {
  if (!LOGO_BATCH_ZONE_META[zoneKey]) {
    return;
  }
  const config = getLogoBatchConfig(zoneKey);
  const refsToCleanup = getLogoBatchAssetRefsToCleanup(zoneKey, config);
  syncUiLogoBatchConfig(zoneKey, null);
  await cleanupAssetRefs(refsToCleanup);
  if (state.currentTemplate?.imageRefs?.logoBatches) {
    state.currentTemplate.imageRefs.logoBatches[zoneKey] = null;
  }
  if (state.ui.logoBatch.isOpen && state.ui.logoBatch.zoneKey === zoneKey) {
    state.ui.logoBatch.summary = reason || '图片已变更，请重新应用 LOGO。';
    renderLogoBatchModal();
  }
  if (reason) {
    showAuthNotice(reason);
    pushLocalLog('warning', reason);
  }
  if (!preserveCurrentImages && state.bridge && state.currentTemplateId) {
    await saveCurrentTemplate({ silent: true });
  }
}

async function clearLogoBatchForImageChange(zoneKey, reason) {
  const config = getLogoBatchConfig(zoneKey);
  const hasState = Boolean(config.logoRef) || (Array.isArray(config.sourceRefs) && config.sourceRefs.some((item) => Boolean(item)));
  if (!hasState) {
    return;
  }
  await clearLogoBatchState(zoneKey, { preserveCurrentImages: true, reason });
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

  scheduleAutoSave();
  renderWorkspaceMeta();
}

function handleSkuBulkStockKeyDown(event) {
  if (event.key !== 'Enter') {
    return;
  }

  event.preventDefault();
  handleApplySkuBulkStock();
}

function handleSkuBulkPriceInputKeyDown(event) {
  if (event.key !== 'Enter') {
    return;
  }

  event.preventDefault();
  applySkuBulkPriceAdjust({
    field: event.target?.id === 'skuBulkSinglePriceInput' ? 'singlePrice' : 'groupPrice',
    action: 'increase',
    inputId: event.target?.id
  });
}

function handleSkuBulkToolbarClick(event) {
  const trigger = event.target?.closest?.('[data-sku-bulk-price-action]');
  if (trigger) {
    applySkuBulkPriceAdjust({
      field: trigger.dataset.skuBulkPriceField,
      action: trigger.dataset.skuBulkPriceAction,
      inputId: trigger.dataset.skuBulkPriceInput
    });
    return;
  }

  const replaceTrigger = event.target?.closest?.('[data-sku-bulk-code-replace]');
  if (!replaceTrigger) {
    return;
  }

  handleApplySkuBulkCodeReplace();
}

function normalizePriceToFen(value) {
  return Math.max(0, Math.round(Number(value) * 100));
}

function formatFenToPrice(fen) {
  return (Math.max(0, Number(fen) || 0) / 100).toFixed(2);
}

function applySkuBulkPriceAdjust({ field, action, inputId }) {
  const input = inputId ? document.getElementById(inputId) : null;
  const rawValue = String(input?.value || '').trim();
  if (!rawValue) {
    input?.focus();
    return;
  }

  const delta = Number(rawValue);
  if (!Number.isFinite(delta) || delta < 0) {
    window.alert('请输入大于等于 0 的价格变动值。');
    input?.focus();
    return;
  }

  const normalizedField = field === 'singlePrice' ? 'singlePrice' : 'groupPrice';
  const normalizedAction = action === 'decrease' ? 'decrease' : 'increase';
  const deltaFen = normalizePriceToFen(delta);
  const priceInputs = Array.from(
    dom.goodsSkuTableBody?.querySelectorAll(`input[name$="[${normalizedField}]"]`) || []
  );
  if (!priceInputs.length) {
    window.alert('当前没有可调整价格的 SKU。');
    return;
  }

  priceInputs.forEach((priceInput) => {
    const currentFen = normalizePriceToFen(priceInput.value);
    const nextFen = normalizedAction === 'decrease'
      ? Math.max(0, currentFen - deltaFen)
      : currentFen + deltaFen;
    priceInput.value = formatFenToPrice(nextFen);
  });

  scheduleAutoSave();
  renderWorkspaceMeta();
}

function handleApplySkuBulkStock() {
  const rawValue = String(dom.skuBulkStockInput?.value || '').trim();
  if (!rawValue) {
    dom.skuBulkStockInput?.focus();
    return;
  }

  const stockValue = Number(rawValue);
  if (!Number.isFinite(stockValue) || stockValue < 0) {
    window.alert('请输入大于等于 0 的库存。');
    dom.skuBulkStockInput?.focus();
    return;
  }

  const normalizedStock = String(Math.floor(stockValue));
  const stockInputs = Array.from(dom.goodsSkuTableBody?.querySelectorAll('input[name$="[stock]"]') || []);
  if (!stockInputs.length) {
    window.alert('当前没有可设置库存的 SKU。');
    return;
  }

  stockInputs.forEach((input) => {
    input.value = normalizedStock;
  });

  scheduleAutoSave();
  renderWorkspaceMeta();
}

function handleSkuBulkCodeReplaceKeyDown(event) {
  if (event.key !== 'Enter') {
    return;
  }

  event.preventDefault();
  handleApplySkuBulkCodeReplace();
}

function handleApplySkuBulkCodeReplace() {
  const searchValue = String(dom.skuBulkSkuCodeSearchInput?.value || '');
  const replaceValue = String(dom.skuBulkSkuCodeReplaceInput?.value || '');
  if (!searchValue.length) {
    window.alert('请输入要查找的 SKU 编码字符。');
    dom.skuBulkSkuCodeSearchInput?.focus();
    return;
  }

  const codeInputs = Array.from(dom.goodsSkuTableBody?.querySelectorAll('input[name$="[outSkuSn]"]') || []);
  if (!codeInputs.length) {
    window.alert('当前没有可替换 SKU 编码的 SKU。');
    return;
  }

  let matched = false;
  codeInputs.forEach((input) => {
    const currentValue = String(input.value || '');
    if (!currentValue.includes(searchValue)) {
      return;
    }

    matched = true;
    input.value = currentValue.split(searchValue).join(replaceValue);
  });

  if (!matched) {
    window.alert('当前商品SKU编码中没有匹配的字符。');
    dom.skuBulkSkuCodeSearchInput?.focus();
    return;
  }

  scheduleAutoSave();
  renderWorkspaceMeta();
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
    dom.shopSelectionCurrentShop.textContent = getCurrentShopLabel({ emptyLabel: state.auth.user ? '尚未确认' : '-' });
  }

  if (dom.shopSelectionDraftState) {
    dom.shopSelectionDraftState.textContent = getShopDraftStatusText();
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
  renderAutoFillState();
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

  // 必须在 reset 之前抓 snapshot：resetAttributeState/resetSkuSpecState 会清空对应 DOM，之后再 serializeForm 就拿不到已填值。
  const preservedFormSnapshot = isChanged ? serializeForm() : null;

  if (isChanged) {
    resetAttributeState();
    resetSkuSpecState();
    if (!preserveProductFillState) {
      resetProductFillState();
    }
  }

  syncSelectedShopIntoForm();
  renderSelectedShop();
  renderAutoFillState();
  renderShopPicker();

  if (focusOverview) {
    setActiveWorkspaceStep('overview', { scroll: false });
  }

  if (hydrateAttributes) {
    await hydrateAttributesFromCurrentForm({
      force: isChanged,
      formData: preservedFormSnapshot
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
  renderAutoFillState();
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

  const currentShopCode = String(state.shop.selected?.shopCode || '').trim();
  const draftShopCode = String(state.shop.draftCode || '').trim();
  if (currentShopCode && draftShopCode === currentShopCode) {
    closeShopPicker();
    setActiveWorkspaceStep('overview', { scroll: false });
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
  dom.shopSelectionConfirmBtn.textContent = getShopSelectionConfirmText();
  dom.shopSelectionBackBtn.hidden = state.shop.isRequired || !state.shop.selected;
  dom.shopSelectionBackBtn.disabled = state.shop.status === 'loading';
  dom.shopAccessScope.textContent = getShopAccessScopeLabel();
  dom.shopPickerDesc.textContent = getShopPickerDescription();

  const visibleShops = getVisibleShopList();
  if (dom.shopSearchHint) {
    dom.shopSearchHint.textContent = getShopSearchHintText(visibleShops);
  }
  if (dom.shopSelectionDraftState) {
    dom.shopSelectionDraftState.textContent = getShopDraftStatusText();
  }
  if (dom.shopSelectionActionSummary) {
    dom.shopSelectionActionSummary.textContent = getShopActionSummaryText();
  }
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
    const isSelected = shop.shopCode === state.shop.draftCode;
    const isCurrent = shop.shopCode === String(state.shop.selected?.shopCode || '').trim();
    const selectedClass = isSelected ? 'is-selected' : '';
    const currentClass = isCurrent ? 'is-current' : '';
    const pendingClass = isSelected && !isCurrent ? 'is-pending' : '';
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
    const statusTags = [
      isCurrent && isSelected ? '<span class="shop-selection-item__tag shop-selection-item__tag--current">当前且已选中</span>' : '',
      isCurrent && !isSelected ? '<span class="shop-selection-item__tag shop-selection-item__tag--current">当前生效</span>' : '',
      isSelected && !isCurrent ? '<span class="shop-selection-item__tag shop-selection-item__tag--pending">待切换</span>' : '',
      quickLoginPending ? '<span class="shop-selection-item__tag shop-selection-item__tag--pending-login">一键登录处理中</span>' : ''
    ].filter(Boolean).join('');

    return [
      `<article class="shop-selection-item ${selectedClass} ${currentClass} ${pendingClass}">`,
      `<button type="button" class="shop-selection-item__main" data-shop-select-code="${escapeHtml(shop.shopCode)}">`,
      '<span class="shop-selection-item__top">',
      `<strong class="shop-selection-item__title">${escapeHtml(shop.shopName || shop.shopCode)}</strong>`,
      `<span class="shop-selection-item__code">店铺ID ${escapeHtml(shop.shopCode)}</span>`,
      '</span>',
      '<span class="shop-selection-item__badges">',
      statusTags,
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
    isSalesScopeOpen: false,
    imagePreview: {
      isOpen: false,
      ref: null,
      label: ''
    },
    logoBatch: buildInitialLogoBatchState()
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
    return '';
  }

  if (state.shop.status === 'loading') {
    return '';
  }

  return '';
}

function getShopDraftStatusText() {
  if (!state.auth.user) {
    return '';
  }

  const currentShopCode = String(state.shop.selected?.shopCode || '').trim();
  const draftShopCode = String(state.shop.draftCode || '').trim();
  const draftShop = state.shop.available.find((shop) => shop.shopCode === draftShopCode) || null;

  if (!currentShopCode && draftShop) {
    return `待进入：${formatShopLabel(draftShop)}`;
  }

  if (!currentShopCode) {
    return '';
  }

  if (draftShop && draftShopCode !== currentShopCode) {
    return `待切换：${formatShopLabel(draftShop)}`;
  }

  return '';
}

function getShopSearchHintText(visibleShops) {
  return '';
}

function getShopActionSummaryText() {
  if (!state.auth.user) {
    return '';
  }

  const currentShopCode = String(state.shop.selected?.shopCode || '').trim();
  const draftShopCode = String(state.shop.draftCode || '').trim();
  const draftShop = state.shop.available.find((shop) => shop.shopCode === draftShopCode) || null;

  if (!draftShopCode || !draftShop) {
    return currentShopCode
      ? formatShopLabel(state.shop.selected)
      : '';
  }

  if (!currentShopCode) {
    return formatShopLabel(draftShop);
  }

  if (draftShopCode === currentShopCode) {
    return formatShopLabel(state.shop.selected);
  }

  return `${formatShopLabel(state.shop.selected)} -> ${formatShopLabel(draftShop)}`;
}

function getShopSelectionConfirmText() {
  const currentShopCode = String(state.shop.selected?.shopCode || '').trim();
  const draftShopCode = String(state.shop.draftCode || '').trim();

  if (!currentShopCode) {
    return '确认进入工作台';
  }

  if (!draftShopCode || draftShopCode === currentShopCode) {
    return '继续使用当前店铺';
  }

  return '确认切换到该店铺';
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

function pickCategoryNode(options, idHint, nameHint) {
  const list = Array.isArray(options) ? options : [];
  const trimmedId = String(idHint || '').trim();
  const trimmedName = String(nameHint || '').trim();

  if (trimmedId) {
    const byId = list.find((item) => String(item.id || '').trim() === trimmedId);
    if (byId) {
      return byId;
    }
  }

  if (trimmedName) {
    const byName = list.find((item) => String(item.name || '').trim() === trimmedName);
    if (byName) {
      return byName;
    }
  }

  return null;
}

async function resolveCategorySelectionFromDetail({ shopCode, categoryIds, pathHints }) {
  const normalizedShopCode = String(shopCode || '').trim();
  const normalizedHints = Array.isArray(pathHints) ? pathHints.map((item) => String(item || '').trim()) : [];
  const ids = categoryIds && typeof categoryIds === 'object' ? categoryIds : {};
  const idHints = [
    String(ids.level1Id || '').trim(),
    String(ids.level2Id || '').trim(),
    String(ids.level3Id || '').trim(),
    String(ids.level4Id || '').trim()
  ];

  if (!normalizedShopCode || !state.bridge?.auth) {
    return null;
  }

  if (!idHints.some(Boolean)) {
    return null;
  }

  const resolved = {
    level1Id: '',
    level2Id: '',
    level3Id: '',
    leafId: '',
    stapleNames: [],
    matchedDepth: 0,
    degraded: false
  };

  const rootResult = await state.bridge.auth.listPublishCategories({
    shopCode: normalizedShopCode,
    parentId: '',
    force: false
  });
  if (!rootResult.ok) {
    return null;
  }

  const level1 = pickCategoryNode(rootResult.categories || [], idHints[0], normalizedHints[0]);
  if (!level1) {
    return { ...resolved, degraded: true };
  }
  resolved.level1Id = level1.id;
  resolved.matchedDepth = 1;
  resolved.stapleNames = normalizeStringList(level1.stapleNames || []);
  if (level1.isLeaf) {
    resolved.leafId = level1.id;
    return resolved;
  }

  const secondResult = await state.bridge.auth.listPublishCategories({
    shopCode: normalizedShopCode,
    parentId: level1.id,
    force: false
  });
  if (!secondResult.ok) {
    return { ...resolved, degraded: true };
  }
  const level2 = pickCategoryNode(secondResult.categories || [], idHints[1], normalizedHints[1]);
  if (!level2) {
    return { ...resolved, degraded: true };
  }
  resolved.level2Id = level2.id;
  resolved.matchedDepth = 2;
  if (level2.isLeaf) {
    resolved.leafId = level2.id;
    return resolved;
  }

  const thirdResult = await state.bridge.auth.listPublishCategories({
    shopCode: normalizedShopCode,
    parentId: level2.id,
    force: false
  });
  if (!thirdResult.ok) {
    return { ...resolved, degraded: true };
  }
  const level3 = pickCategoryNode(thirdResult.categories || [], idHints[2], normalizedHints[2]);
  if (!level3) {
    return { ...resolved, degraded: true };
  }
  resolved.level3Id = level3.id;
  resolved.matchedDepth = 3;
  if (level3.isLeaf || !idHints[3]) {
    resolved.leafId = level3.id;
    return resolved;
  }

  const fourthResult = await state.bridge.auth.listPublishCategories({
    shopCode: normalizedShopCode,
    parentId: level3.id,
    force: false
  });
  if (!fourthResult.ok) {
    resolved.leafId = level3.id;
    return resolved;
  }
  const level4 = pickCategoryNode(fourthResult.categories || [], idHints[3], normalizedHints[3]);
  if (level4) {
    resolved.leafId = level4.id;
    resolved.matchedDepth = 4;
  } else {
    resolved.leafId = level3.id;
  }
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

function scoreSkuSpecOptionMatch(option, selection, slotIndex) {
  const optionLabel = String(option?.label || '').trim();
  const selectionLabel = String(selection?.label || '').trim();
  if (!optionLabel) {
    return Number.NEGATIVE_INFINITY;
  }

  if (selectionLabel && optionLabel === selectionLabel) {
    return 1000;
  }

  let score = 0;

  if (selectionLabel && (optionLabel.includes(selectionLabel) || selectionLabel.includes(optionLabel))) {
    score += 200;
  }

  const positiveKeywords = slotIndex === 0
    ? ['颜色', '花色', '色号', '色']
    : ['尺码', '尺寸', '身高', '长度', '裤长', '袜长', '规格'];
  const negativeKeywords = slotIndex === 0
    ? ['尺码', '尺寸', '身高', '长度', '裤长', '袜长']
    : ['颜色', '花色', '色号'];

  positiveKeywords.forEach((keyword, index) => {
    if (optionLabel.includes(keyword)) {
      score += 50 - index;
    }
  });

  negativeKeywords.forEach((keyword) => {
    if (optionLabel.includes(keyword)) {
      score -= 60;
    }
  });

  return score;
}

function resolveSkuSpecSelectionOption(options, selection, slotIndex, usedOptionIds = new Set()) {
  const normalizedOptions = Array.isArray(options) ? options : [];
  const selectionId = String(selection?.id || '').trim();
  const selectionLabel = String(selection?.label || '').trim();

  if (selectionId) {
    const optionById = normalizedOptions.find((option) => option.id === selectionId && !usedOptionIds.has(option.id));
    if (optionById) {
      return optionById;
    }
  }

  if (selectionLabel) {
    const optionByLabel = normalizedOptions.find((option) => option.label === selectionLabel && !usedOptionIds.has(option.id));
    if (optionByLabel) {
      return optionByLabel;
    }
  }

  return normalizedOptions
    .filter((option) => option.id && !usedOptionIds.has(option.id))
    .map((option) => ({
      option,
      score: scoreSkuSpecOptionMatch(option, selection, slotIndex)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.option.label.localeCompare(right.option.label, 'zh-CN');
    })[0]?.option || null;
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
  const usedOptionIds = new Set();
  const resolvedSelections = normalizedSelections.map((selection, slotIndex) => {
    if (!selection.id && !selection.label) {
      return createEmptySkuSpecSelection();
    }

    const matchedOption = resolveSkuSpecSelectionOption(normalizedOptions, selection, slotIndex, usedOptionIds);

    if (!matchedOption) {
      return createEmptySkuSpecSelection();
    }

    usedOptionIds.add(matchedOption.id);

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

const SKU_FORM_KEY_PATTERN = new RegExp(`^goodsSkuDetail\\[(\\d+)\\]\\[(${SKU_FIELD_NAMES.join('|')})\\]$`);

function isSkuFormKey(key) {
  return SKU_FORM_KEY_PATTERN.test(String(key || '').trim());
}

function buildBlankSkuRow() {
  const row = {};
  SKU_FIELD_NAMES.forEach((field) => {
    row[field] = '';
  });
  return row;
}

function normalizeSkuRow(row = {}) {
  const normalized = {};
  SKU_FIELD_NAMES.forEach((field) => {
    normalized[field] = String(row?.[field] || '').trim();
  });
  return normalized;
}

function extractSkuRowsFromFormData(formData, { fallbackRows = [] } = {}) {
  const groupedRows = new Map();

  Object.entries(formData || {}).forEach(([key, value]) => {
    const match = String(key || '').trim().match(SKU_FORM_KEY_PATTERN);
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
    .split(' / ')
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

  await clearLogoBatchForImageChange('skuThumbs', 'SKU 规格已重建，请重新应用 LOGO。');
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

function getSkuSpecAiRenameDimensions(selectedSlots = state.skuSpec.selectedSlots, valueLists = state.skuSpec.valueLists) {
  const normalizedSelections = normalizeSkuSpecSelections(selectedSlots);
  const normalizedValueLists = normalizeSkuSpecValueLists(valueLists).map((values) => {
    return values.map((item) => String(item || '').trim()).filter(Boolean);
  });

  return normalizedSelections
    .map((selection, slotIndex) => ({
      slot: slotIndex,
      label: String(selection?.label || SKU_DIMENSION_LABELS[slotIndex] || `规格${slotIndex + 1}`).trim(),
      values: normalizedValueLists[slotIndex] || []
    }))
    .filter((item) => normalizedSelections[item.slot]?.id && item.values.length);
}

function buildSkuSpecAiRenameFeedbackMarkup() {
  const error = String(state.skuSpec.aiRenameError || '').trim();
  const message = String(state.skuSpec.aiRenameMessage || '').trim();
  if (!error && !message) {
    return '';
  }

  const className = error
    ? 'sku-spec-ai-feedback sku-spec-ai-feedback--error'
    : 'sku-spec-ai-feedback';
  return `<div class="${className}">${escapeHtml(error || message)}</div>`;
}

function buildSkuSpecBoardMarkup(options, selectedSlots, valueLists) {
  const normalizedSelections = normalizeSkuSpecSelections(selectedSlots);
  const normalizedValueLists = normalizeSkuSpecValueLists(valueLists, { keepEmpty: true });
  const selectedCount = normalizedSelections.filter((item) => item.id).length;
  const canAiRename = getSkuSpecAiRenameDimensions(normalizedSelections, normalizedValueLists).length > 0;
  const isAiRenaming = state.skuSpec.aiRenameStatus === 'loading';
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
    '<div class="sku-spec-board__topline">',
    `<div class="sku-spec-board__meta">最多添加 2 个商品规格类型，当前已选 ${selectedCount}/2 个，规格类型会自动去重。</div>`,
    `<button type="button" class="ghost-button ghost-button--sm sku-spec-ai-button" data-sku-spec-ai-rename${canAiRename && !isAiRenaming ? '' : ' disabled'}>${isAiRenaming ? 'AI改写中...' : 'AI改规格名'}</button>`,
    '</div>',
    buildSkuSpecAiRenameFeedbackMarkup(),
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

function areSkuSpecSelectionsEqual(left, right) {
  const normalizedLeft = normalizeSkuSpecSelections(left);
  const normalizedRight = normalizeSkuSpecSelections(right);
  return [0, 1].every((slotIndex) => {
    return normalizedLeft[slotIndex]?.id === normalizedRight[slotIndex]?.id
      && normalizedLeft[slotIndex]?.label === normalizedRight[slotIndex]?.label;
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
  const aiRenameTrigger = event.target.closest('[data-sku-spec-ai-rename]');
  if (aiRenameTrigger && dom.goodsSkuBoard?.contains(aiRenameTrigger)) {
    handleSkuSpecAiRename().catch((error) => {
      console.error(error);
    });
    return;
  }

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

async function handleSkuSpecAiRename() {
  if (state.skuSpec.aiRenameStatus === 'loading') {
    return;
  }

  const dimensions = getSkuSpecAiRenameDimensions();
  if (!dimensions.length) {
    setSkuSpecAiRenameFeedback({
      status: 'error',
      error: '请先选择规格类型并录入规格值。'
    });
    return;
  }

  const duplicateDimension = dimensions.find((dimension) => new Set(dimension.values).size !== dimension.values.length);
  if (duplicateDimension) {
    setSkuSpecAiRenameFeedback({
      status: 'error',
      error: `${duplicateDimension.label} 存在重复规格值，请先处理后再使用 AI 改写。`
    });
    return;
  }

  if (!state.bridge?.auth?.rewriteSkuSpecNames || !state.auth.user) {
    setSkuSpecAiRenameFeedback({
      status: 'error',
      error: '当前环境无法调用 AI 改写能力，请确认已登录桌面端。'
    });
    return;
  }

  setSkuSpecAiRenameFeedback({
    status: 'loading',
    message: 'AI 正在改写规格名...'
  });

  const previousRows = getCurrentSkuRows();
  const previousRefs = getCurrentSkuThumbRefs();
  const previousValueLists = normalizeSkuSpecValueLists(state.skuSpec.valueLists);
  const previousSelections = normalizeSkuSpecSelections(state.skuSpec.selectedSlots);

  let result = null;
  try {
    result = await state.bridge.auth.rewriteSkuSpecNames({
      dimensions,
      context: buildSkuSpecAiRenameContext()
    });
  } catch (error) {
    setSkuSpecAiRenameFeedback({
      status: 'error',
      error: error instanceof Error ? error.message : 'AI 改写规格名失败，请稍后重试。'
    });
    return;
  }

  if (!result?.ok) {
    setSkuSpecAiRenameFeedback({
      status: 'error',
      error: result?.error?.message || 'AI 改写规格名失败，请稍后重试。'
    });
    return;
  }

  if (!areSkuSpecValueListsEqual(previousValueLists, state.skuSpec.valueLists)
    || !areSkuSpecSelectionsEqual(previousSelections, state.skuSpec.selectedSlots)) {
    setSkuSpecAiRenameFeedback({
      status: 'error',
      error: 'AI 改写期间规格值已变化，本次结果未应用。'
    });
    return;
  }

  const validation = validateAiSkuSpecRenameResult(dimensions, result.dimensions);
  if (!validation.ok) {
    setSkuSpecAiRenameFeedback({
      status: 'error',
      error: validation.message
    });
    return;
  }

  const nextValueLists = previousValueLists.map((values) => [...values]);
  validation.dimensions.forEach((dimension) => {
    nextValueLists[dimension.slot] = dimension.values;
  });

  state.skuSpec.valueLists = normalizeSkuSpecValueLists(nextValueLists);
  syncSkuSpecValueListsToForm(state.skuSpec.valueLists);
  renderSkuSpecState();

  const renamedRows = buildRenamedSkuRowsFromValueLists({
    rows: previousRows,
    sourceValueLists: previousValueLists,
    targetValueLists: state.skuSpec.valueLists
  });
  await rebuildSkuRowsFromSpecConfig({
    existingRows: renamedRows,
    existingRefs: previousRefs
  });

  setSkuSpecAiRenameFeedback({
    status: 'success',
    message: `AI 已改写 ${validation.changedCount} 个规格名，并保留原价格、库存、SKU编码和图片。`
  });
  scheduleAutoSave();
}

function setSkuSpecAiRenameFeedback({ status = 'idle', error = '', message = '' } = {}) {
  state.skuSpec.aiRenameStatus = status;
  state.skuSpec.aiRenameError = String(error || '').trim();
  state.skuSpec.aiRenameMessage = String(message || '').trim();
  renderSkuSpecState();
}

function validateAiSkuSpecRenameResult(requestDimensions, responseDimensions) {
  const requestBySlot = new Map((Array.isArray(requestDimensions) ? requestDimensions : []).map((dimension) => {
    return [dimension.slot, dimension];
  }));
  const responseBySlot = new Map();

  (Array.isArray(responseDimensions) ? responseDimensions : []).forEach((dimension) => {
    if (Number.isInteger(dimension?.slot)) {
      responseBySlot.set(dimension.slot, dimension);
    }
  });

  const normalizedDimensions = [];
  let changedCount = 0;
  for (const requestDimension of requestBySlot.values()) {
    const responseDimension = responseBySlot.get(requestDimension.slot);
    const responseValues = Array.isArray(responseDimension?.values)
      ? responseDimension.values.map((value) => String(value || '').trim())
      : [];

    const resolvedValues = [];
    for (let index = 0; index < requestDimension.values.length; index += 1) {
      const originalValue = requestDimension.values[index];
      let nextValue = normalizeSkuSpecRenameText(responseValues[index]);
      if (!nextValue || nextValue === originalValue || isWeakAppendedSkuSpecRename(originalValue, nextValue)) {
        nextValue = buildSkuSpecFallbackRenameValue({
          originalValue,
          index,
          usedValues: resolvedValues,
          dimensionLabel: requestDimension.label
        });
      }

      changedCount += 1;

      resolvedValues.push(nextValue);
    }

    if (new Set(resolvedValues).size !== resolvedValues.length) {
      return {
        ok: false,
        message: `${requestDimension.label} 返回了重复规格名，未改动规格名。`
      };
    }

    normalizedDimensions.push({
      slot: requestDimension.slot,
      values: resolvedValues
    });
  }

  return {
    ok: true,
    dimensions: normalizedDimensions,
    changedCount
  };
}

function buildSkuSpecAiRenameContext() {
  const formData = serializeForm();
  return {
    productName: String(
      formData.pddForm_goodsName
      ?? formData.goodsName
      ?? dom.goodsNameInput?.value
      ?? ''
    ).trim(),
    categoryPath: String(
      formData[CATEGORY_FIELD_IDS.display]
      ?? formData.categoryData
      ?? dom.categoryDataInput?.value
      ?? ''
    ).trim()
  };
}

function isWeakAppendedSkuSpecRename(originalValue, nextValue) {
  const originalText = String(originalValue || '').trim();
  const nextText = String(nextValue || '').trim();
  if (!originalText || !nextText.startsWith(originalText)) {
    return false;
  }

  const suffix = nextText.slice(originalText.length).replace(/^[\s·\-—_]+/g, '').trim();
  if (!suffix) {
    return false;
  }

  return /^(经典款|柔感款|日常款|舒适款|优选款|百搭款|轻柔款|基础款|精选款|通勤款|透气款|细腻款|简约款|软弹款|顺滑款|焕新版|亲肤款|常规款)$/.test(suffix);
}

function normalizeSkuSpecRenameText(value) {
  return String(value || '')
    .replace(/[·•・]/g, '-')
    .replace(/[|｜]/g, '/')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s*\/\s*/g, '/')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function buildSkuSpecFallbackRenameValue({ originalValue, index, usedValues = [], dimensionLabel = '' } = {}) {
  const baseValue = String(originalValue || '').trim();
  const candidates = [
    ...buildSkuSpecStructuredFallbackCandidates(baseValue, index, dimensionLabel),
    ...buildSkuSpecGenericFallbackCandidates(baseValue, index)
  ];
  const usedSet = new Set((Array.isArray(usedValues) ? usedValues : []).map((value) => String(value || '').trim()));

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeSkuSpecRenameText(candidate);
    if (normalizedCandidate !== baseValue
      && !usedSet.has(normalizedCandidate)
      && !isWeakAppendedSkuSpecRename(baseValue, normalizedCandidate)) {
      return normalizedCandidate;
    }
  }

  return normalizeSkuSpecRenameText(`${baseValue}规格组`);
}

function buildSkuSpecStructuredFallbackCandidates(baseValue, index, dimensionLabel) {
  const label = String(dimensionLabel || '');
  const colors = extractColorTokens(baseValue);
  const isColorLike = label.includes('颜色') || colors.length > 0;
  const hasMixedColors = /[+＋]/.test(baseValue) || colors.length > 1;
  const totalCount = extractSkuSpecTotalCount(baseValue);
  const candidates = [];

  if (isColorLike) {
    const colorRatio = buildSkuSpecColorRatioText(baseValue);
    const primaryColorAlias = colors[0] ? getSkuSpecColorAlias(colors[0], { descriptive: true }) : '';
    const singleDescriptors = ['通勤基础组', '日常换洗组', '柔暖常备组', '简净实穿组', '百搭囤货组', '保暖基础组'];
    const mixedDescriptors = ['三色配比装', '多色轮换组', '混色换洗装', '配色常备组', '组合囤货装', '日常搭配组'];
    const descriptors = hasMixedColors ? mixedDescriptors : singleDescriptors;
    descriptors.forEach((descriptor, descriptorIndex) => {
      const resolvedDescriptor = descriptors[(index + descriptorIndex) % descriptors.length];
      if (hasMixedColors && colorRatio) {
        candidates.push(`${colorRatio}-${totalCount ? `${totalCount}条` : ''}${resolvedDescriptor}`);
        candidates.push(`${colorRatio}/${totalCount ? `${totalCount}条` : ''}${resolvedDescriptor}`);
      } else if (primaryColorAlias) {
        candidates.push(`${primaryColorAlias}${totalCount ? `/${totalCount}条装` : ''}-${resolvedDescriptor}`);
        candidates.push(`${primaryColorAlias}${totalCount ? `${totalCount}条装` : ''}/${resolvedDescriptor}`);
      }
    });
    return candidates;
  }

  if (label.includes('尺码') || /\d+\s*[-~—至]\s*\d+\s*(?:斤|kg|KG)/.test(baseValue) || /均码|大码|小码|中码/.test(baseValue)) {
    const denier = baseValue.match(/\d+\s*D/i)?.[0]?.replace(/\s+/g, '') || '';
    const fitRange = baseValue.match(/\d+\s*[-~—至]\s*\d+\s*(?:斤|kg|KG)/)?.[0]?.replace(/\s+/g, '') || '';
    const sizeToken = baseValue.match(/均码|大码|小码|中码|加大码/)?.[0] || '';
    const featurePhrases = [
      '裸感无痕',
      '柔暖贴合',
      '毛圈保暖',
      '弹力包裹',
      '加绒亲肤',
      '轻压不勒',
      '冬季暖护',
      '舒弹适穿'
    ];
    featurePhrases.forEach((feature, featureIndex) => {
      const resolvedFeature = featurePhrases[(index + featureIndex) % featurePhrases.length];
      const left = [denier, resolvedFeature].filter(Boolean).join('');
      const right = [sizeToken ? `${sizeToken}贴合` : '', fitRange].filter(Boolean).join('/');
      if (left || right) {
        candidates.push(`${left || resolvedFeature}-${right || baseValue}`);
      }
      candidates.push(`${baseValue.replace(/雅鹿款|品牌款|同款|原款|常规款/g, '').trim()}-${resolvedFeature}`);
    });
    return candidates;
  }

  return candidates;
}

function buildSkuSpecGenericFallbackCandidates(baseValue, index) {
  const suffixes = [
    '换洗备选组',
    '实穿组合款',
    '日用常备款',
    '舒弹适穿组',
    '保暖通勤款',
    '柔暖基础组'
  ];
  return suffixes.map((suffix, suffixIndex) => {
    const resolvedSuffix = suffixes[(index + suffixIndex) % suffixes.length];
    return `${baseValue}${resolvedSuffix}`;
  });
}

function extractColorTokens(value) {
  const text = String(value || '');
  const tokens = [];
  const colorPattern = /(?:经典黑|自然肤|裸感肤|裸肤|浅肤|深肤|高级灰|烟灰|浅灰|深灰|奶白|藏青|酒红|玫红|卡其|藕粉|姜黄|墨绿|燕麦|香槟|荧光|黑色?|白色?|红色?|粉色?|蓝色?|绿色?|黄色?|紫色?|灰色?|棕色?|咖色?|橙色?|驼色?|金色?|银色?|肤色?|裸色|米色?|杏色?|黑|白|红|粉|蓝|绿|黄|紫|灰|棕|咖|橙|驼|金|银|肤(?!感)|米|杏)/g;
  let match = colorPattern.exec(text);
  while (match) {
    tokens.push(match[0]);
    match = colorPattern.exec(text);
  }
  return tokens;
}

function normalizeSkuSpecColorToken(value) {
  const token = String(value || '').replace(/色$/g, '').trim();
  if (!token) {
    return '';
  }

  if (token.includes('黑')) return '黑';
  if (token.includes('肤') || token.includes('裸')) return '肤';
  if (token.includes('灰')) return '灰';
  if (token.includes('白')) return '白';
  if (token.includes('红')) return '红';
  if (token.includes('粉')) return '粉';
  if (token.includes('蓝') || token.includes('藏青')) return '蓝';
  if (token.includes('绿')) return '绿';
  if (token.includes('黄')) return '黄';
  if (token.includes('紫')) return '紫';
  if (token.includes('棕') || token.includes('咖')) return '棕';
  if (token.includes('橙')) return '橙';
  if (token.includes('驼') || token.includes('卡其')) return '驼';
  if (token.includes('金') || token.includes('香槟')) return '金';
  if (token.includes('银')) return '银';
  if (token.includes('米') || token.includes('杏') || token.includes('燕麦')) return '米';
  return token;
}

function getSkuSpecColorAlias(color, { descriptive = false } = {}) {
  const normalizedColor = normalizeSkuSpecColorToken(color);
  const descriptiveMap = {
    黑: '经典黑',
    肤: '裸感肤',
    灰: '高级灰',
    白: '柔雾白',
    红: '显白红',
    粉: '柔粉',
    蓝: '清爽蓝',
    绿: '森系绿',
    黄: '暖姜黄',
    紫: '温柔紫',
    棕: '咖棕',
    橙: '暖橙',
    驼: '卡其驼',
    金: '香槟金',
    银: '浅银',
    米: '燕麦米'
  };
  return descriptive ? descriptiveMap[normalizedColor] || `${normalizedColor}系` : normalizedColor;
}

function buildSkuSpecColorRatioText(value) {
  const text = String(value || '');
  const parts = text
    .split(/[+＋]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const color = extractColorTokens(part)[0] || '';
      const number = part.match(/\d+(?!.*】)/)?.[0] || '';
      const alias = getSkuSpecColorAlias(color);
      return alias && number ? `${alias}${number}` : '';
    })
    .filter(Boolean);
  return parts.join('+');
}

function extractSkuSpecTotalCount(value) {
  const text = String(value || '');
  const bracketCount = text.match(/【\s*(\d+)\s*条\s*】/);
  if (bracketCount?.[1]) {
    return bracketCount[1];
  }

  const count = text.match(/(\d+)\s*条/);
  return count?.[1] || '';
}

function buildRenamedSkuRowsFromValueLists({ rows, sourceValueLists, targetValueLists }) {
  const normalizedRows = (Array.isArray(rows) ? rows : []).map((row) => normalizeSkuRow(row));
  const sourceLists = getFilledSkuSpecValueLists(sourceValueLists);
  const targetLists = getFilledSkuSpecValueLists(targetValueLists);
  const valueMaps = [0, 1].map((slotIndex) => {
    const map = new Map();
    (sourceLists[slotIndex] || []).forEach((value, valueIndex) => {
      const nextValue = targetLists[slotIndex]?.[valueIndex];
      if (value && nextValue) {
        map.set(value, nextValue);
      }
    });
    return map;
  });

  return normalizedRows.map((row) => {
    const parts = splitSkuSpecName(row.specName);
    const renamedParts = parts.map((part, index) => valueMaps[index]?.get(part) || part);
    return {
      ...row,
      specName: renamedParts.filter(Boolean).join(' / ')
    };
  });
}

function splitSkuSpecParts(specName) {
  const parts = String(specName || '')
    .split(' / ')
    .map((item) => item.trim())
    .filter(Boolean);
  const color = parts[0] || '';
  const size = parts.slice(1).join(' / ');
  return { color, size };
}

function buildSkuRowMarkup(row, index, options = {}) {
  const { color, size } = splitSkuSpecParts(row.specName);
  const { isGroupHead = true, groupSize = 1 } = options;
  const cells = [];

  cells.push(
    `<td class="sku-table__cell sku-table__cell--image"><div id="pddForm_goodsSkuDetail_${index}_pic" class="image-slot image-slot--sku" data-image-zone="sku-thumb" data-asset-zone="skuThumbs" data-slot-index="${index}" data-frame-label="SKU图${index + 1}"><input type="file" accept="image/*"></div></td>`
  );

  if (isGroupHead) {
    cells.push(
      `<td class="sku-table__cell sku-table__cell--color" rowspan="${groupSize}">${escapeHtml(color)}</td>`
    );
  }

  cells.push(
    `<td class="sku-table__cell sku-table__cell--size">${escapeHtml(size)}<input type="hidden" name="goodsSkuDetail[${index}][specName]" value="${escapeHtml(row.specName)}"></td>`,
    `<td class="sku-table__cell"><input class="sku-table__input" name="goodsSkuDetail[${index}][groupPrice]" type="number" step="0.01" value="${escapeHtml(row.groupPrice)}"></td>`,
    `<td class="sku-table__cell"><input class="sku-table__input" name="goodsSkuDetail[${index}][singlePrice]" type="number" step="0.01" value="${escapeHtml(row.singlePrice)}"></td>`,
    `<td class="sku-table__cell"><input class="sku-table__input" name="goodsSkuDetail[${index}][outSkuSn]" type="text" value="${escapeHtml(row.outSkuSn)}"></td>`,
    `<td class="sku-table__cell"><input class="sku-table__input" name="goodsSkuDetail[${index}][stock]" type="number" value="${escapeHtml(row.stock)}"></td>`
  );

  return `<tr>${cells.join('')}</tr>`;
}

function renderSkuRows(rows, { imageRefs = null } = {}) {
  if (!dom.goodsSkuBoard || !dom.goodsSkuTableBody) {
    return;
  }

  const normalizedRows = (Array.isArray(rows) ? rows : []).map((row) => normalizeSkuRow(row));
  const resolvedRefs = Array.isArray(imageRefs) ? imageRefs : getCurrentSkuThumbRefs();

  if (!normalizedRows.length) {
    dom.goodsSkuTableBody.innerHTML = '<tr class="sku-table__empty-row"><td class="sku-table__empty" colspan="7"><div class="empty-state">暂无SKU，请先配置规格类型和规格值。</div></td></tr>';
  } else {
    const groupSizes = new Map();
    normalizedRows.forEach((row) => {
      const { color } = splitSkuSpecParts(row.specName);
      groupSizes.set(color, (groupSizes.get(color) || 0) + 1);
    });

    const seenGroups = new Set();
    dom.goodsSkuTableBody.innerHTML = normalizedRows.map((row, index) => {
      const { color } = splitSkuSpecParts(row.specName);
      const isGroupHead = !seenGroups.has(color);
      if (isGroupHead) {
        seenGroups.add(color);
      }
      return buildSkuRowMarkup(row, index, {
        isGroupHead,
        groupSize: groupSizes.get(color) || 1
      });
    }).join('');
  }

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

function buildCurrentAttributeMetaMap() {
  const meta = state.attribute.meta && typeof state.attribute.meta === 'object' ? state.attribute.meta : {};
  const result = {};
  Object.entries(meta).forEach(([refPid, entry]) => {
    if (!refPid || !entry) {
      return;
    }
    const vid = String(entry.vid || '').trim();
    const unit = String(entry.unit || '').trim();
    if (vid || unit) {
      result[refPid] = {
        ...(vid ? { vid } : {}),
        ...(unit ? { unit } : {})
      };
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

  state.attribute.meta = template.attributeMeta && typeof template.attributeMeta === 'object'
    ? { ...template.attributeMeta }
    : {};

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

  syncShipmentLimitCustomShell();
  syncCostTemplateIdHint();
}

function syncShipmentLimitCustomShell() {
  const shell = document.getElementById('shipmentLimitSecondCustomShell');
  if (!shell) {
    return;
  }
  const checkedRadio = document.querySelector('input[name="shipmentLimitSecond"]:checked');
  const isCustom = checkedRadio?.value === 'custom';
  shell.hidden = !isCustom;
}

function syncCostTemplateIdHint() {
  const hint = document.getElementById('costTemplateIdHint');
  const hidden = document.getElementById('pddForm_costTemplateId');
  if (!hint || !hidden) {
    return;
  }
  const value = String(hidden.value || '').trim();
  hint.hidden = !value;
  const code = hint.querySelector('[data-cost-template-id]');
  if (code) {
    code.textContent = value;
  }
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

    const previewArea = event.target.closest('.image-frame__canvas');
    if (slot.__assetRef?.fileUrl && previewArea) {
      openImagePreviewModal(slot);
      if (zoneKey === 'detailGallery') {
        activateFrame(slot.__frame);
      }
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
      if (slot.__assetRef?.fileUrl) {
        openImagePreviewModal(slot);
        if (zoneKey === 'detailGallery') {
          activateFrame(slot.__frame);
        }
        return;
      }

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
  if (zoneKey === 'mainGallery') {
    await clearLogoBatchForImageChange('mainGallery', '轮播图顺序已变更，请重新应用 LOGO。');
  }
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
        `<img class="detail-preview-stream__image" src="${escapeHtml(ref.fileUrl)}" alt="详情图 ${index + 1}" title="点击查看大图" data-detail-preview-index="${index}">`
      ].join('');
    }).join(''),
    '</div>'
  ].join('');
}

function handleDetailPreviewCanvasClick(event) {
  const image = event.target?.closest?.('[data-detail-preview-index]');
  if (!image) {
    return;
  }

  const index = normalizeSlotIndex(image.dataset.detailPreviewIndex);
  const ref = getArrayZoneRefs('detailGallery')[index];
  if (!ref?.fileUrl) {
    return;
  }

  openImagePreviewRef(ref, `详情图${index + 1}`);
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
        if (zoneKey === 'mainGallery') {
          await clearLogoBatchForImageChange('mainGallery', '轮播图已更换，请重新应用 LOGO。');
        }
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
        if (zoneKey === 'mainGallery') {
          await clearLogoBatchForImageChange('mainGallery', '轮播图已更换，请重新应用 LOGO。');
        }
        applyRefsToDynamicArrayZone(zoneKey, slotIndex, [imported]);
      } else {
        if (zoneKey === 'skuThumbs') {
          await clearLogoBatchForImageChange('skuThumbs', 'SKU图已更换，请重新应用 LOGO。');
        }
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
    if (zoneKey === 'mainGallery') {
      clearLogoBatchForImageChange('mainGallery', '轮播图已更换，请重新应用 LOGO。').catch((error) => {
        console.error(error);
      });
    }
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
  if (zoneKey === 'skuThumbs') {
    clearLogoBatchForImageChange('skuThumbs', 'SKU图已更换，请重新应用 LOGO。').catch((error) => {
      console.error(error);
    });
  }
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
    if (zoneKey === 'mainGallery') {
      await clearLogoBatchForImageChange('mainGallery', '轮播图已变更，请重新应用 LOGO。');
    }

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
  if (zoneKey === 'skuThumbs') {
    await clearLogoBatchForImageChange('skuThumbs', 'SKU图已变更，请重新应用 LOGO。');
  }

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
      `<img class="image-frame__preview" src="${escapeHtml(ref.fileUrl)}" alt="${escapeHtml(label)}" title="点击查看大图" draggable="false">`,
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
  const normalizedImageRefs = imageRefs || buildEmptyImageRefs();
  Object.entries(ASSET_LAYOUT).forEach(([zoneKey, config]) => {
    if (config.type === 'dynamic-array') {
      renderDynamicArrayZone(zoneKey, normalizedImageRefs?.[zoneKey] || []);
      return;
    }

    const slots = Array.from(state.slotRegistry[zoneKey] || document.querySelectorAll(config.selector));

    if (config.type === 'array') {
      const refs = Array.isArray(normalizedImageRefs?.[zoneKey]) ? normalizedImageRefs[zoneKey] : [];
      slots.forEach((slot, index) => {
        setSlotAsset(slot, refs[index] || null);
      });
      return;
    }

    const ref = normalizedImageRefs?.[zoneKey] || null;
    slots.forEach((slot) => setSlotAsset(slot, ref));
  });

  const normalizedLogoBatches = normalizeLogoBatches(normalizedImageRefs.logoBatches || createEmptyLogoBatchStore());
  syncUiLogoBatchConfig('mainGallery', normalizedLogoBatches.mainGallery);
  syncUiLogoBatchConfig('skuThumbs', normalizedLogoBatches.skuThumbs);
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

  imageRefs.logoBatches = {
    mainGallery: sanitizeLogoBatchConfig(state.currentTemplate?.imageRefs?.logoBatches?.mainGallery, 'mainGallery'),
    skuThumbs: sanitizeLogoBatchConfig(state.currentTemplate?.imageRefs?.logoBatches?.skuThumbs, 'skuThumbs')
  };

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
    skuThumbs: [],
    logoBatches: createEmptyLogoBatchStore()
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
  renderAutoFillState();
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
      attributeMeta: buildCurrentAttributeMetaMap(),
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
    attributeMeta: buildCurrentAttributeMetaMap(),
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
