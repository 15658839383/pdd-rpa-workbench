const fs = require("fs/promises");
const path = require("path");
const ExcelJS = require("exceljs");

const EXPORT_FILE_PREFIX = "经营总览";
const SHEET_NAME = "经营总览";
const TONE_COLORS = {
  up: "FFC45549",
  down: "FF4D82D6"
};

function createSalesOverviewExportService(workspace) {
  const defaultDir = String(workspace?.root || process.cwd()).trim() || process.cwd();

  async function exportWorkbook(payload = {}, targetPath) {
    const outputPath = String(targetPath || "").trim();
    if (!outputPath) {
      throw createError("缺少导出路径，无法导出经营总览");
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "宜承多多工作台";
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet(SHEET_NAME, {
      views: [{ state: "frozen", ySplit: 6 }]
    });

    const columns = Array.isArray(payload?.columns) ? payload.columns : [];
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    const totals = payload?.totals && typeof payload.totals === "object" ? payload.totals : null;
    const meta = payload?.meta && typeof payload.meta === "object" ? payload.meta : {};
    const totalColumnCount = Math.max(columns.length, 2);

    writeSheetMeta(sheet, meta, totalColumnCount);
    writeSheetColumns(sheet, columns);
    writeSheetRows(sheet, columns, rows);
    writeSheetTotals(sheet, columns, totals, rows.length);
    applySheetLayout(sheet, columns, rows.length, Boolean(totals));

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await workbook.xlsx.writeFile(outputPath);

    return {
      ok: true,
      path: outputPath,
      fileName: path.basename(outputPath),
      rowCount: rows.length,
      exportedAt: new Date().toISOString(),
      message: `经营总览已导出到 ${outputPath}`
    };
  }

  function buildDefaultPath(meta = {}) {
    const fetchedAt = String(meta?.fetchedAt || "").trim();
    const timestamp = formatFileTimestamp(fetchedAt ? new Date(fetchedAt) : new Date());
    return path.join(defaultDir, `${EXPORT_FILE_PREFIX}-${timestamp}.xlsx`);
  }

  return {
    buildDefaultPath,
    exportWorkbook
  };
}

function writeSheetMeta(sheet, meta, totalColumnCount) {
  const title = String(meta?.title || SHEET_NAME).trim() || SHEET_NAME;
  const fetchedAt = String(meta?.fetchedAt || "").trim();
  const exportedAt = String(meta?.exportedAt || "").trim();
  const comparisonNote = String(meta?.comparisonNote || "").trim();
  const summaryText = String(meta?.summaryText || "").trim();
  const scopeText = String(meta?.scopeText || "").trim();
  const search = String(meta?.search || "").trim();
  const operatorFilterLabel = String(meta?.operatorFilterLabel || "").trim();
  const trendMetricLabel = String(meta?.trendMetricLabel || "").trim();
  const trendFilterLabel = getTrendFilterLabel(meta?.trendFilter);
  const sortModeLabel = getSortModeLabel(meta?.sortMode);

  mergeWholeRow(sheet, 1, totalColumnCount);
  mergeWholeRow(sheet, 2, totalColumnCount);
  mergeWholeRow(sheet, 3, totalColumnCount);
  mergeWholeRow(sheet, 4, totalColumnCount);

  const row1 = sheet.getCell(1, 1);
  row1.value = title;
  row1.font = {
    name: "Microsoft YaHei UI",
    size: 16,
    bold: true,
    color: { argb: "FF201515" }
  };
  row1.alignment = { vertical: "middle", horizontal: "left" };

  const row2 = sheet.getCell(2, 1);
  row2.value = [
    fetchedAt ? `最近获取：${formatDateTimeText(fetchedAt)}` : "",
    exportedAt ? `导出时间：${formatDateTimeText(exportedAt)}` : "",
    Number.isFinite(Number(meta?.selectedCount)) ? `已选店铺：${Number(meta.selectedCount)} 家` : "",
    Number.isFinite(Number(meta?.visibleCount)) ? `导出行数：${Number(meta.visibleCount)} 行` : ""
  ].filter(Boolean).join("    ");
  row2.font = {
    name: "Microsoft YaHei UI",
    size: 10,
    color: { argb: "FF36342E" }
  };
  row2.alignment = { vertical: "middle", horizontal: "left" };

  const row3 = sheet.getCell(3, 1);
  row3.value = [
    `运营筛选：${operatorFilterLabel || "全部运营"}`,
    trendMetricLabel ? `比较指标：${trendMetricLabel}` : "",
    `涨跌筛选：${trendFilterLabel}`,
    `排序方式：${sortModeLabel}`,
    search ? `搜索：${search}` : ""
  ].filter(Boolean).join("    ");
  row3.font = {
    name: "Microsoft YaHei UI",
    size: 10,
    color: { argb: "FF36342E" }
  };
  row3.alignment = { vertical: "middle", horizontal: "left" };

  const row4 = sheet.getCell(4, 1);
  row4.value = [summaryText, scopeText, comparisonNote].filter(Boolean).join("    ");
  row4.font = {
    name: "Microsoft YaHei UI",
    size: 10,
    color: { argb: "FF5A5346" }
  };
  row4.alignment = { vertical: "middle", horizontal: "left", wrapText: true };

  sheet.getRow(1).height = 24;
  sheet.getRow(2).height = 18;
  sheet.getRow(3).height = 18;
  sheet.getRow(4).height = 32;
}

function writeSheetColumns(sheet, columns) {
  const headerRowNumber = 6;
  const headerRow = sheet.getRow(headerRowNumber);

  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = String(column?.label || "").trim();
    cell.font = {
      name: "Microsoft YaHei UI",
      bold: true,
      size: 10,
      color: { argb: "FF201515" }
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF6F2E8" }
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD7D0C0" } },
      bottom: { style: "thin", color: { argb: "FFD7D0C0" } }
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: column?.type === "shop" ? "left" : "center",
      wrapText: true
    };
  });

  headerRow.height = 26;
}

function writeSheetRows(sheet, columns, rows) {
  const startRowNumber = 7;

  rows.forEach((rowData, rowIndex) => {
    const rowNumber = startRowNumber + rowIndex;
    const row = sheet.getRow(rowNumber);

    columns.forEach((column, columnIndex) => {
      const cell = row.getCell(columnIndex + 1);
      assignDataCellValue(cell, column, rowData);
      styleDataCell(cell, column, rowData);
    });

    row.height = 36;
  });
}

function writeSheetTotals(sheet, columns, totals, rowCount) {
  if (!totals || rowCount <= 0) {
    return;
  }

  const totalRowNumber = 7 + rowCount;
  const totalRow = sheet.getRow(totalRowNumber);

  columns.forEach((column, columnIndex) => {
    const cell = totalRow.getCell(columnIndex + 1);

    if (columnIndex === 0) {
      cell.value = "统计";
    } else if (columnIndex === 1) {
      cell.value = "";
    } else if (column?.summable) {
      cell.value = normalizeExportNumericValue(totals[column.key], column?.type);
      applyNumericCellFormat(cell, column);
    } else {
      cell.value = "";
    }

    cell.font = {
      name: "Microsoft YaHei UI",
      size: 10,
      bold: true,
      color: { argb: "FF201515" }
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF6F2E8" }
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD7D0C0" } },
      bottom: { style: "thin", color: { argb: "FFD7D0C0" } }
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: column?.type === "shop" ? "left" : "right"
    };
  });

  totalRow.height = 24;
}

function applySheetLayout(sheet, columns, rowCount, hasTotals) {
  columns.forEach((column, index) => {
    sheet.getColumn(index + 1).width = getColumnWidth(column);
  });

  const headerRowNumber = 6;
  const lastDataRow = Math.max(headerRowNumber, headerRowNumber + rowCount);
  const lastRowNumber = hasTotals ? lastDataRow + 1 : lastDataRow;

  sheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: Math.max(headerRowNumber, lastRowNumber), column: Math.max(columns.length, 1) }
  };

  sheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2
    }
  };
}

function assignDataCellValue(cell, column, rowData) {
  if (column?.type === "index") {
    cell.value = Number.isFinite(Number(rowData?.index)) ? Number(rowData.index) : null;
    return;
  }

  if (column?.type === "shop") {
    cell.value = buildShopCellValue(rowData);
    return;
  }

  cell.value = normalizeExportNumericValue(rowData?.[column.key], column?.type);
}

function styleDataCell(cell, column, rowData) {
  cell.font = {
    name: "Microsoft YaHei UI",
    size: 10,
    color: { argb: resolveCellFontColor(rowData, column) }
  };

  if (column?.type !== "shop" && column?.type !== "index") {
    applyNumericCellFormat(cell, column);
  }

  cell.alignment = {
    vertical: "middle",
    horizontal: column?.type === "shop" ? "left" : column?.type === "index" ? "center" : "right",
    wrapText: column?.type === "shop"
  };

  cell.border = {
    bottom: { style: "thin", color: { argb: "FFE3DDD1" } }
  };
}

function applyNumericCellFormat(cell, column) {
  if (column?.type === "money") {
    cell.numFmt = '#,##0.00';
    return;
  }

  if (column?.type === "rate") {
    cell.numFmt = '0.00%';
    return;
  }

  cell.numFmt = '#,##0';
}

function resolveCellFontColor(rowData, column) {
  const tone = rowData?.cellToneByKey?.[column?.key];
  if (tone && TONE_COLORS[tone]) {
    return TONE_COLORS[tone];
  }

  return "FF201515";
}

function normalizeExportNumericValue(value, type) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  if (type === "metric" || type === "index") {
    return Math.trunc(numericValue);
  }

  return numericValue;
}

function buildShopCellValue(rowData) {
  const shopName = String(rowData?.shopName || rowData?.shopCode || "").trim();
  const metaParts = [
    String(rowData?.shopCode || "").trim(),
    String(rowData?.currentOperator || "").trim()
  ].filter(Boolean);

  if (String(rowData?.rowStatus || "").trim() === "error" && String(rowData?.rowError || "").trim()) {
    metaParts.push(`获取失败：${String(rowData.rowError).trim()}`);
  } else if (String(rowData?.comparisonHour || "").trim()) {
    metaParts.push(`昨天同小时截至 ${String(rowData.comparisonHour).trim()}:00`);
  }

  return [shopName, metaParts.join(" · ")].filter(Boolean).join("\n");
}

function getColumnWidth(column) {
  if (column?.type === "index") {
    return 8;
  }

  if (column?.type === "shop") {
    return 36;
  }

  if (column?.type === "money") {
    return 14;
  }

  if (column?.type === "rate") {
    return 14;
  }

  return 13;
}

function mergeWholeRow(sheet, rowNumber, totalColumnCount) {
  if (totalColumnCount <= 1) {
    return;
  }

  sheet.mergeCells(rowNumber, 1, rowNumber, totalColumnCount);
}

function formatFileTimestamp(date) {
  const target = Number.isNaN(date?.getTime?.()) ? new Date() : date;
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  const hours = String(target.getHours()).padStart(2, "0");
  const minutes = String(target.getMinutes()).padStart(2, "0");
  const seconds = String(target.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function formatDateTimeText(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value || "").trim();
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

function getTrendFilterLabel(value) {
  const normalizedValue = String(value || "").trim();
  if (normalizedValue === "up") {
    return "仅看上涨";
  }

  if (normalizedValue === "down") {
    return "仅看下降";
  }

  if (normalizedValue === "flat") {
    return "仅看持平";
  }

  return "全部店铺";
}

function getSortModeLabel(value) {
  const normalizedValue = String(value || "").trim();
  if (normalizedValue === "delta-desc") {
    return "按涨跌值从高到低";
  }

  if (normalizedValue === "delta-asc") {
    return "按涨跌值从低到高";
  }

  if (normalizedValue === "current-desc") {
    return "按今天值从高到低";
  }

  if (normalizedValue === "current-asc") {
    return "按今天值从低到高";
  }

  return "默认顺序";
}

function createError(message) {
  const error = new Error(message);
  error.code = "SALES_OVERVIEW_EXPORT_FAILED";
  return error;
}

module.exports = {
  createSalesOverviewExportService
};
