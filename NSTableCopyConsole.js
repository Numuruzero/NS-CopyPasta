// Determine if record is estimate, and if it's in edit mode
const url = window.location.href;
const edCheck = new RegExp('e=T');
const isEd = edCheck.test(url);
const estCheck = new RegExp(/estimate\.nl/);
const isEST = estCheck.test(url);

// Variables to determine specific column numbers
const itmCol = {
    set: false,
    itmSKU: "ITEM",
    boStatus: isEST ? "ESD (USED IN AUTOMATION)" : "STATUS",
    numBO: isEST ? "BACK ORDERED" : "# BACKORDERED",
    numPO: "CREATE PO",
    itmCost: "PRICE PER UNIT"
};

// Get the size of the order's item table programmatically
// Content rows start at 2, accounting for header row
const getRowCount = () => {
    let testRows;
    let lastRow = 0;
    let y = 2;
    testRows = document.querySelector("#item_splits > tbody > tr:nth-child(2) > td:nth-child(1)");
    // The lines are written differently in edit mode, so we'll need to account for this while counting rows
    if (isEd) {
        y = 1;
        while (testRows) {
            lastRow = y;
            testRows = document.querySelector(`#item_row_${y} > td:nth-child(1)`);
            y++;
        }
    } else {
        while (testRows) {
            lastRow = y - 1;
            testRows = document.querySelector(`#item_splits > tbody > tr:nth-child(${y}) > td:nth-child(1)`);
            y++;
        }
    }
    return lastRow;
}

const getColumnCount = () => {
    let testColumns;
    let lastColumn = 0;
    let x = 1;
    testColumns = document.querySelector("#item_splits > tbody > tr:nth-child(2) > td:nth-child(1)");
    while (testColumns) {
        lastColumn = x - 1;
        testColumns = document.querySelector(`#item_splits > tbody > tr:nth-child(2) > td:nth-child(${x})`);
        x++;
    }
    return lastColumn;
}

/**
 * Checks a text to see if it matches a column header, and sets according to the given number
 */
const checkItemHeader = (check, num) => {
    switch (check) {
        case itmCol.itmSKU:
            itmCol.itmSKU = num;
            break;
        case itmCol.numBO:
            itmCol.numBO = num;
            break;
        case itmCol.boStatus:
            itmCol.boStatus = num;
            break;
        case itmCol.numPO:
            itmCol.numPO = num;
            break;
        case itmCol.itmCost:
            itmCol.itmCost = num;
            break;
    }
}

// Declaring variables for various info fields
// BUT FIRST ERROR CATCHING
const orderInfo = {
    shipAddress: document.querySelector("#shipaddress_fs_lbl_uir_label") ? document.querySelector("#shipaddress_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
    shipPhone: document.querySelector("#custbodyshipphonenumber_fs_lbl_uir_label") ? document.querySelector("#custbodyshipphonenumber_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
    email: document.querySelector("#custbody5_fs_lbl_uir_label") ? document.querySelector("#custbody5_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
    shipMethod: document.querySelector("#shipmethod_fs_lbl_uir_label") ? document.querySelector("#shipmethod_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
    estPallets: document.querySelector("#custbody_freight_packages_fs_lbl_uir_label") ? document.querySelector("#custbody_freight_packages_fs_lbl_uir_label").nextElementSibling.innerHTML.trim().replace(/<br>/g, '\r\n').replace(/<\/*[bu]>|/g, "") : 'NA',
    shipRates: document.querySelector("#custbody_quoted_rates_fs_lbl_uir_label") ? document.querySelector("#custbody_quoted_rates_fs_lbl_uir_label").nextElementSibling.innerHTML.trim().replace(/<br>/g, '\r\n').replace(/<\/*[bu]>|/g, "") : 'NA',
    estFreight: document.querySelector("#custbodyfreightquote_fs_lbl_uir_label") ? document.querySelector("#custbodyfreightquote_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
    estParcel: document.querySelector("#custbodyparcelquote_fs_lbl_uir_label") ? document.querySelector("#custbodyparcelquote_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
    recordNumber: document.querySelector("#main_form > table > tbody > tr:nth-child(1) > td > div > div.uir-page-title-secondline > div.uir-record-id") ? document.querySelector("#main_form > table > tbody > tr:nth-child(1) > td > div > div.uir-page-title-secondline > div.uir-record-id").innerText : 'NA',
    recordURL: window.location.href,
    orderDiscount: document.querySelector("#discountrate_fs_lbl_uir_label") ? document.querySelector("#discountrate_fs_lbl_uir_label").nextElementSibling.textContent.trim() : 'NA',
    shipDate: document.querySelector("#custbody57_fs_lbl_uir_label") ? document.querySelector("#custbody57_fs_lbl_uir_label").nextElementSibling.textContent.trim() : 'NA',
    dateProcessed: document.querySelector("#custbody_date_processed_fs_lbl_uir_label") ? document.querySelector("#custbody_date_processed_fs_lbl_uir_label").nextElementSibling.textContent.trim() : 'NA',
    createdFrom: document.querySelector("#createdfrom_lbl_uir_label") ? document.querySelector("#createdfrom_lbl_uir_label").nextElementSibling.textContent.trim() : 'NA'
};

// Build an array out of the table
// Newline/return replacement is commented out because surrounding elements with quotes eliminates the need to remove these
const buildItemTable = () => {
    const itemTable = [];
    const totalRows = getRowCount();
    const totalColumns = getColumnCount();
    let currentRow = [];
    let row = 2;
    let column = 1;
    let aRow;
    while (row <= totalRows) {
        currentRow = [];
        while (column <= totalColumns) {
            aRow = document.querySelector(`#item_splits > tbody > tr:nth-child(${row}) > td:nth-child(${column})`).innerText;
            aRow = `"${aRow./*replace(/[\n\r]/gm,' ').*/replace(/"/gm, '""')}"`
            currentRow.push(aRow);
            if (!itmCol.set) checkItemHeader(document.querySelector(`#item_splits > tbody > tr.uir-machine-headerrow > td:nth-child(${column})`).innerText, column - 1);
            column++;
        };
        column = 1;
        itmCol.set = true;
        itemTable.push(currentRow);
        row++
    };
    return itemTable;
}

// Specifically find and return info on the WG line item, if available.
function getWGLine(table) {
    if (typeof itmCol.numPO != "number") {
        return ["NA", "NA"];
    }
    const WGSearch = new RegExp(/WG-/);
    const WGInfo = [];
    table.forEach((line) => {
        if (WGSearch.exec(line[0])) {
            if (Number(line[itmCol.itmCost].slice(1, -1)) > 0) {
                WGInfo.push((line[itmCol.itmCost].slice(1, -1)));
            }
            if (line[itmCol.numPO].includes("PO")) {
                WGInfo.push((line[itmCol.numPO].slice(1, -1).trim()));
            }
        };
    })
    return WGInfo;
}

// Copy all table and order info to clipboard
function copyAll() {
    let copyContent = '';
    let itemTable = buildItemTable();
    const WGInfo = getWGLine(itemTable);
    const infoValues = [orderInfo.shipAddress, orderInfo.shipPhone, orderInfo.email, orderInfo.shipMethod, orderInfo.estPallets, orderInfo.shipRates, orderInfo.recordNumber, orderInfo.recordURL, orderInfo.orderDiscount, orderInfo.shipDate, orderInfo.dateProcessed, orderInfo.createdFrom, WGInfo[0], WGInfo[1]];
    const infoArray = infoValues.map((info) => `"${info}"`);
    itemTable.push(['"Begin Order Info"']);
    itemTable.push(['"Address"', '"Phone Number"', '"Email"', '"Shipping Method"', '"Estimated Pallets"', '"Shipping Estimates"', '"Order Number"', '"Order URL"', '"Order Discount"', '"Ship Date"', '"Date Processed"', '"Created From"', '"WG Cost"', '"WG PO Number"']);
    itemTable.push(infoArray);
    itemTable.forEach(function (rowArray) {
        let thisRow = rowArray.join(String.fromCharCode(9));
        copyContent += thisRow + "\r\n";
    });

    navigator.clipboard.writeText(copyContent);
}

// Add button that copies some text to clipboard from the page
const addCopyButton = () => {
    const btn = document.createElement("button");
    btn.innerHTML = "Copy Order Info to Clipboard";
    btn.onclick = () => {
        copyAll();
        return false;
    };
    // Choose element to attach button to
    document.querySelector(".uir_form_tab_container").before(btn);
};

addCopyButton();
