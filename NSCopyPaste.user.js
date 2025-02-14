// ==UserScript==
// @name        NetSuite Copy/Paste Buttons
// @namespace   jhutt.com
// @match       https://1206578.app.netsuite.com/app/accounting/transactions/salesord.nl*
// @match       https://1206578.app.netsuite.com/app/accounting/transactions/estimate.nl*
// @downloadURL https://raw.githubusercontent.com/Numuruzero/NS-CopyPasta/refs/heads/main/NSCopyPaste.user.js
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @version     1.873
// ==/UserScript==

////////////////////////////// Universal Check Vars //////////////////////////////

// Determine if the record is in edit mode
const edCheck = new RegExp('e=T');
const url = window.location.href;
const isEd = edCheck.test(url);

// Determine if record is estimate
const estCheck = new RegExp(/estimate\.nl/);
const isEST = estCheck.test(url);

// Custom flags
const flags = {
    boPresent: false,
    boItems: []
}

////////////////////////////// Begin table grab //////////////////////////////

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

// Add iframe for shipquote info since it has moved outside the scope of the SO/EST
const addShipIframe = () => {
    const shipFrame = document.createElement("iframe");
    // Add &l=T to URL which loads the page without the navbar
    shipFrame.src = `${frameInfo.shipLink}&l=T`;
    shipFrame.title = 'Shipquote Info';
    shipFrame.id = 'ShipquoteFrame';
    shipFrame.style.width = '200px';
    shipFrame.style.resize = 'both';
    shipFrame.style.overflow = 'auto';

    // Choose element to attach frame to
    frameInfo.shipButton.after(shipFrame);
}

// Beginning implementation of iframe for GP info
// document.querySelector("#ext-element-85 > table > tbody > tr:nth-child(5) > td > div > span.uir-field.inputreadonly.uir-user-styled.uir-resizable > a").onclick.toString().match(/https[:/.?=&\w]+/)

// Setting vars which will act as a document in place of the iframe
let frameDoc;
const setFrameVars = () => {
    const shipquoteFrame = document.getElementById('ShipquoteFrame');
    frameDoc = shipquoteFrame.contentDocument;
}

// Attempt to grab info from iframe, log errors if unsuccessful
const changeShipquoteInfo = () => {
    try {
        const tempShip = frameDoc.querySelector("#custrecord_sq_quoted_rates");
        tempShip ? orderInfo.shipRates = frameDoc.querySelector("#custrecord_sq_quoted_rates").value.trim().replace(/<br>/g, '\r\n').replace(/<\/*[bu]>|/g, "") : console.log('Failed to get shipment estimates');
        const tempPallets = frameDoc.querySelector("#main_form > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(4) > table > tbody > tr:nth-child(1) > td > div > span.uir-field.inputreadonly.uir-user-styled.uir-resizable");
        tempPallets ? orderInfo.estPallets = frameDoc.querySelector("#main_form > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(4) > table > tbody > tr:nth-child(1) > td > div > span.uir-field.inputreadonly.uir-user-styled.uir-resizable").innerHTML.trim().replace(/<br>/g, '\r\n').replace(/<\/*[bu]>|/g, "") : console.log('Failed to get freight packages');
    }
    catch (error) {
        console.log(error);
    }
}

// Method for iframe
const disconnectFrame = VM.observe(document.body, () => {
    // Find the target node
    const node = document.querySelector("#custbody_shipquote_val > a");

    if (node) {
        addShipIframe();

        // disconnect observer
        return true;
    }
});



// Declaring variables as NA for frame method if necessary
const frameInfo = {
    shipButton: document.querySelector("#custbody_shipquote_val > a") ? document.querySelector("#custbody_shipquote_val > a") : 'NA',
    shipLink: document.querySelector("#custbody_shipquote_val > a") ? document.querySelector("#custbody_shipquote_val > a").href : 'NA',
    shipRatesFrame: document.querySelector("#custrecord_sq_quoted_parcel_rates_fs_lbl_uir_label") ? document.querySelector("#custrecord_sq_quoted_parcel_rates_fs_lbl_uir_label").nextElementSibling.innerHTML.trim().replace(/<br>/g, '\r\n').replace(/<\/*[bu]>|/g, "") : 'NA',
    estPalletsFrame: document.querySelector("#custrecord_sq_quoted_freight_pkg_fs_lbl_uir_label") ? document.querySelector("#custrecord_sq_quoted_freight_pkg_fs_lbl_uir_label").nextElementSibling.innerHTML.trim().replace(/<br>/g, '\r\n').replace(/<\/*[bu]>|/g, "") : 'NA'
}

// Declaring variables for various info fields
// BUT FIRST ERROR CATCHING
const orderInfo = {
    shipAddress: document.querySelector("#shipaddress_fs_lbl_uir_label") ? document.querySelector("#shipaddress_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
    shipPhone: document.querySelector("#custbodyshipphonenumber_fs_lbl_uir_label") ? document.querySelector("#custbodyshipphonenumber_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
    email: document.querySelector("#custbody5_fs_lbl_uir_label") ? document.querySelector("#custbody5_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
    shipMethod: document.querySelector("#shipmethod_fs_lbl_uir_label") ? document.querySelector("#shipmethod_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
    estPallets: document.querySelector("#custbody_freight_packages_fs_lbl_uir_label") ? document.querySelector("#custbody_freight_packages_fs_lbl_uir_label").nextElementSibling.innerHTML.trim().replace(/<br>/g, '\r\n').replace(/<\/*[bu]>|/g, "") : frameInfo.estPalletsFrame,
    shipRates: document.querySelector("#custbody_quoted_rates_fs_lbl_uir_label") ? document.querySelector("#custbody_quoted_rates_fs_lbl_uir_label").nextElementSibling.innerHTML.trim().replace(/<br>/g, '\r\n').replace(/<\/*[bu]>|/g, "") : frameInfo.shipRatesFrame,
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

// Checks the table for backordered items and returns a list of SKUs, if any
function catchBackorders() {
    if (!itmCol.numBO) return 'NSA mucked it up, also make this automatic you lazy bum';
    const totalRows = getRowCount();
    let boItems = [];
    let row = 1;
    let aRow;
    while (row <= totalRows) {
        // Non-inventory items have no number which returns null, check for a null count and replace with 0
        aRow = document.querySelector(`#item_row_${row} > td:nth-child(${itmCol.numBO})`) ? document.querySelector(`#item_row_${row} > td:nth-child(${itmCol.numBO})`).innerText : 0;
        if (Number(aRow) > 0) boItems.push(document.querySelector(`#item_row_${row} > td:nth-child(${itmCol.itmSKU})`).innerText)
        row++
    };
    return boItems;
}

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

// Not used, but available for copying only item table.
function copyTable() {
    let copyContent = '';
    let itemTable = buildItemTable();
    itemTable.forEach(function (rowArray) {
        let thisRow = rowArray.join("	");
        copyContent += thisRow + "\r\n";
    });

    navigator.clipboard.writeText(copyContent);
}

function copyAll() {
    let copyContent = '';
    let itemTable = buildItemTable();
    const WGInfo = getWGLine(itemTable);
    if (!document.querySelector("#custbody_freight_packages_fs_lbl_uir_label")) {
        setFrameVars();
        changeShipquoteInfo();
    }
    const infoValues = [orderInfo.shipAddress, orderInfo.shipPhone, orderInfo.email, orderInfo.shipMethod, orderInfo.estPallets, orderInfo.shipRates, orderInfo.recordNumber, orderInfo.recordURL, orderInfo.orderDiscount, orderInfo.shipDate, orderInfo.dateProcessed, orderInfo.createdFrom, WGInfo[0], WGInfo[1]];
    const infoArray = infoValues.map((info) => `"${info}"`);
    itemTable.push(['"Begin Order Info"']);
    itemTable.push(['"Address"', '"Phone Number"', '"Email"', '"Shipping Method"', '"Estimated Pallets"', '"Shipping Estimates"', '"Order Number"', '"Order URL"', '"Order Discount"', '"Ship Date"', '"Date Processed"', '"Created From"', '"WG Cost"', '"WG PO Number"']);
    itemTable.push(infoArray);
    itemTable.forEach(function (rowArray) {
        let thisRow = rowArray.join("	");
        copyContent += thisRow + "\r\n";
    });

    navigator.clipboard.writeText(copyContent);
}

// This function takes a specific array that contains all INET information and pastes it onto the order
function pasteAll(data) {
    buildItemTable();
    const inetInfo = data;
    const boJoin = flags.boItems.join(', ');
    checkFlags();
    if (document.querySelector("#custbody20").value !== '') {
        document.querySelector("#custbody20").value += '\n\n';
    };
    document.querySelector("#custbody20").value += inetInfo[0]
    if (document.querySelector("#hasbo").checked === true) {
        document.querySelector("#custbody20").value += `\n\nWHEN AVAILABLE, SEND BACKORDERED ITEMS (${boJoin}) DIRECT TO CUSTOMER AS NORMAL.`;
    };
    if (document.querySelector("#custbody_pacejet_delivery_instructions").value !== '') {
        document.querySelector("#custbody_pacejet_delivery_instructions").value += '\n\n';
    };
    document.querySelector("#custbody_pacejet_delivery_instructions").value += inetInfo[1]
    if (document.querySelector("#hasbo").checked === true) {
        document.querySelector("#custbody_pacejet_delivery_instructions").value += `\n\nWHEN AVAILABLE, SEND BACKORDERED ITEMS (${boJoin}) DIRECT TO CUSTOMER AS NORMAL.`;
    };
    document.querySelector("#custbody_shipaddressee").value = inetInfo[2]
    document.querySelector("#custbody_shipattention").value = inetInfo[3]
    document.querySelector("#custbody_shipaddress1").value = inetInfo[4]
    document.querySelector("#custbody_shipaddress2").value = inetInfo[5]
    document.querySelector("#custbody_shipcity").value = inetInfo[6]
    document.querySelector("#custbody_shipstate").value = inetInfo[7]
    document.querySelector("#custbody_shipzip").value = inetInfo[8]
    document.querySelector("#custbody_shipphone").value = inetInfo[9]
}

// Function to decide if items tab is loaded; if so, just perform above function, otherwise click the Items tab and perform VM await function
const pasteBOCheck = (carrier) => {
    if (document.querySelector("#item_row_1 > td:nth-child(1)")) {
        switch (carrier) {
            case "inet":
                pasteData();
                break;
            case "allegro":
                allegroInfo();
                break;
        }
    } else {
        document.querySelector("#itemstxt").click();
        const waitForItems = VM.observe(document.body, () => {
            // Find the target node
            const node = document.querySelector("#item_row_1 > td:nth-child(1)");

            if (node) {
                if (isEd) {
                    switch (carrier) {
                        case "inet":
                            pasteData();
                            break;
                        case "allegro":
                            allegroInfo();
                            break;
                    };
                }
                // disconnect observer
                return true;
            }
        });
    };
};

// Pick up data from the clipboard and use it with above function
async function pasteData() {
    let inetInfo;
    try {
        const clipboardContents = await navigator.clipboard.read();
        for (const item of clipboardContents) {
            for (const mimeType of item.types) {
                if (mimeType === "text/plain") {
                    const blob = await item.getType("text/plain");
                    const blobText = await blob.text();
                    const blobArray = blobText.split('&+')
                    inetInfo = blobArray;
                    pasteAll(inetInfo);
                } else {
                    throw new Error(`${mimeType} not supported.`);
                }
            }
        }
    } catch (error) {
    }
}

// Create a checkbox for determining if a backorder is present
const addBackorderCheckbox = () => {
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.id = "hasbo";
    chk.innerHTML = '<label for="hasbo">Order contains at least one backordered item</label>'
    const chkp = document.createElement("p");
    chkp.innerHTML = "WG: Check to add BO clause to info";
    chkp.style.fontSize = "13px";
    chkp.style.marginLeft = "5px";
    chkp.style.display = "inline-block";
    document.querySelector("#tr_fg_fieldGroup471 > td:nth-child(1) > table > tbody > tr:nth-child(5) > td > div").after(chk);
    chk.after(chkp);
}

// Adds Allegro info to order
const allegroInfo = () => {
    checkFlags();
    const allegroNote = 'ORDER FOR ALLEGRO DEL/INSTALL - PACK AND SET ASIDE, CONTACT whiteglove@upliftdesk.com WITH BOL FOR BOOKING';
    const delIns = document.querySelector("#custbody_pacejet_delivery_instructions");
    const prodMemo = document.querySelector("#custbody20");
    const boJoin = flags.boItems.join(', ');
    if (prodMemo.value !== '') prodMemo.value += '\n\n';
    prodMemo.value += allegroNote;
    if (document.querySelector("#hasbo").checked === true) {
        prodMemo.value += `\n\nWHEN AVAILABLE, SEND BACKORDERED ITEMS (${boJoin}) DIRECT TO CUSTOMER AS NORMAL.`;
    };
    if (delIns.value !== '') delIns.value += '\n\n';
    delIns.value += allegroNote;
    if (document.querySelector("#hasbo").checked === true) {
        delIns.value += `\n\nWHEN AVAILABLE, SEND BACKORDERED ITEMS (${boJoin}) DIRECT TO CUSTOMER AS NORMAL.`;
    };
};

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

// Add button that puts Allegro notes on the order
const createAllegroButton = () => {
    const btn = document.createElement("button");
    btn.innerHTML = "Add Allegro Notifier to Order";
    btn.style.left = "10px";
    btn.style.position = "relative";
    btn.onclick = () => {
        pasteBOCheck("allegro");
        return false;
    };
    return btn;
    // Choose element to attach button to
    // document.querySelector(".uir_form_tab_container").after(btn);
};

// Add button that pastes INET info from clipboard; it will only appear in Edit mode
const createPasteButton = () => {
    const btn = document.createElement("button");
    btn.innerHTML = "Paste INET Info to Order";
    btn.onclick = () => {
        pasteBOCheck("inet");
        return false;
    };
    return btn;
    // Choose element to attach button to
    // document.querySelector(".uir_form_tab_container").before(btn);
};

// Add buttons to edit page
const addEditButtons = () => {
    const allegroButton = createAllegroButton();
    const inetPasteButton = createPasteButton();
    document.querySelector(".uir_form_tab_container").before(inetPasteButton, allegroButton);
};

// Check for custom flag conditions
const checkFlags = () => {
    const boItems = catchBackorders();
    if (boItems.length !== 0) {
        flags.boPresent = true;
        flags.boItems = boItems;
        return boItems;
    }
}

//Wait until document is sufficiently loaded, then inject button
const disconnect = VM.observe(document.body, () => {
    // Find the target node
    const node = document.querySelector(".uir_form_tab_container");

    if (node) {
        if (isEd) {
            addEditButtons();
            if (!isEST) {
                addBackorderCheckbox();
            }
        } else { addCopyButton() };

        // disconnect observer
        return true;
    }
});

//Wait until document is sufficiently loaded, check for custom flags
const itemcheck = VM.observe(document.body, () => {
    // Find the target node
    const node = document.querySelector("#item_row_1 > td:nth-child(1)");

    if (node) {
        if (isEd && !isEST) {
            checkFlags();
            if (flags.boPresent === true) document.querySelector("#hasbo").checked = true;
        };

        // disconnect observer
        return true;
    }
});
