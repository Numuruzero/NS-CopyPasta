// ==UserScript==
// @name        The ol' CSV-aroo
// @namespace   NetSuite WG
// @match       https://1206578.app.netsuite.com/app/accounting/transactions/salesord.nl*
// @match       https://1206578.app.netsuite.com/app/accounting/transactions/estimate.nl*
// @downloadURL https://raw.githubusercontent.com/Numuruzero/NS-CopyPasta/main/NSUserscript.js
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @version     1.7
// ==/UserScript==



// Get the size of the order's item table programmatically
// Content rows start at 2, accounting for header row
const getRowCount = () => {
  let testRows;
  let lastRow = 0;
  let y = 2;
  testRows = document.querySelector("#item_splits > tbody > tr:nth-child(2) > td:nth-child(1)");
  while (testRows) {
    lastRow = y - 1;
    testRows = document.querySelector(`#item_splits > tbody > tr:nth-child(${y}) > td:nth-child(1)`);
    y++;
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

// Add iframe for shipquote info since it has moved outside the scope of the SO/EST
const addShipIframe = () => {
  const shipFrame = document.createElement("iframe");
  shipFrame.src = frameInfo.shipLink;
  shipFrame.title = 'Shipquote Info';
  shipFrame.id = 'ShipquoteFrame';
  shipFrame.style.width = '200px';
  shipFrame.style.resize = 'both';
  shipFrame.style.overflow = 'auto';

  // Choose element to attach frame to
  frameInfo.shipButton.after(shipFrame);
}

// Setting vars which will act as a document in place of the iframe
let frameDoc;
const setFrameVars = () => {
  const shipquoteFrame = document.getElementById('ShipquoteFrame');
  frameDoc = shipquoteFrame.contentDocument;
}

const changeShipquoteInfo = () => {
  try {
    const tempShip = frameDoc.querySelector("#custrecord_sq_quoted_rates");
    tempShip ? orderInfo.shipRates = frameDoc.querySelector("#custrecord_sq_quoted_rates").value.trim().replace(/<br>/g, '\r\n').replace(/<\/*[bu]>|/g, "") : console.log('Failed to get shipment estimates');
    const tempPallets = frameDoc.querySelector("#main_form > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(4) > table > tbody > tr:nth-child(1) > td > div > span.uir-field.inputreadonly.uir-user-styled.uir-resizable");
    tempPallets ? orderInfo.estPallets = frameDoc.querySelector("#main_form > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(4) > table > tbody > tr:nth-child(1) > td > div > span.uir-field.inputreadonly.uir-user-styled.uir-resizable").innerHTML.trim().replace(/<br>/g,'\r\n').replace(/<\/*[bu]>|/g,"") : console.log('Failed to get freight packages');
  }
  catch (error) {
    console.log(error);
  }
}

//Method for iframe
const disconnectFrame = VM.observe(document.body, () => {
  // Find the target node
  const node = document.querySelector("#custbody_shipquote_val > a");

  if (node) {
    addShipIframe();

    // disconnect observer
    return true;
  }
});



// Declaring variables for frame method if necessary
const frameInfo = {
  shipButton : document.querySelector("#custbody_shipquote_val > a") ? document.querySelector("#custbody_shipquote_val > a") : 'NA',
  shipLink : document.querySelector("#custbody_shipquote_val > a") ? document.querySelector("#custbody_shipquote_val > a").href : 'NA',
  shipRatesFrame : document.querySelector("#custrecord_sq_quoted_parcel_rates_fs_lbl_uir_label") ? document.querySelector("#custrecord_sq_quoted_parcel_rates_fs_lbl_uir_label").nextElementSibling.innerHTML.trim().replace(/<br>/g,'\r\n').replace(/<\/*[bu]>|/g,"") : 'NA',
  estPalletsFrame : document.querySelector("#custrecord_sq_quoted_freight_pkg_fs_lbl_uir_label") ? document.querySelector("#custrecord_sq_quoted_freight_pkg_fs_lbl_uir_label").nextElementSibling.innerHTML.trim().replace(/<br>/g,'\r\n').replace(/<\/*[bu]>|/g,"") : 'NA'
}



// Declaring variables for various info fields
// BUT FIRST ERROR CATCHING
const orderInfo = {
  shipAddress : document.querySelector("#shipaddress_fs_lbl_uir_label") ? document.querySelector("#shipaddress_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
  shipPhone : document.querySelector("#custbodyshipphonenumber_fs_lbl_uir_label") ? document.querySelector("#custbodyshipphonenumber_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
  email : document.querySelector("#custbody5_fs_lbl_uir_label") ? document.querySelector("#custbody5_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
  shipMethod : document.querySelector("#shipmethod_fs_lbl_uir_label") ? document.querySelector("#shipmethod_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
  estPallets : document.querySelector("#custbody_freight_packages_fs_lbl_uir_label") ? document.querySelector("#custbody_freight_packages_fs_lbl_uir_label").nextElementSibling.innerHTML.trim().replace(/<br>/g,'\r\n').replace(/<\/*[bu]>|/g,"") : frameInfo.estPalletsFrame,
  shipRates : document.querySelector("#custbody_quoted_rates_fs_lbl_uir_label") ? document.querySelector("#custbody_quoted_rates_fs_lbl_uir_label").nextElementSibling.innerHTML.trim().replace(/<br>/g,'\r\n').replace(/<\/*[bu]>|/g,"") : frameInfo.shipRatesFrame,
  estFreight : document.querySelector("#custbodyfreightquote_fs_lbl_uir_label") ? document.querySelector("#custbodyfreightquote_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
  estParcel : document.querySelector("#custbodyparcelquote_fs_lbl_uir_label") ? document.querySelector("#custbodyparcelquote_fs_lbl_uir_label").nextElementSibling.innerText : 'NA',
  recordNumber : document.querySelector("#main_form > table > tbody > tr:nth-child(1) > td > div > div.uir-page-title-secondline > div.uir-record-id") ? document.querySelector("#main_form > table > tbody > tr:nth-child(1) > td > div > div.uir-page-title-secondline > div.uir-record-id").innerText : 'NA',
  recordURL : window.location.href
};



/* Individual variables rather than an object
const shipAddress = document.querySelector("#shipaddress_fs_lbl_uir_label").nextElementSibling.innerText;
const shipPhone = document.querySelector("#custbodyshipphonenumber_fs_lbl_uir_label").nextElementSibling.innerText;
const email = document.querySelector("#custbody5_fs_lbl_uir_label").nextElementSibling.innerText;
const shipMethod = document.querySelector("#shipmethod_fs_lbl_uir_label").nextElementSibling.innerText;
const estPallets = document.querySelector("#custbody_freight_packages_fs_lbl_uir_label").nextElementSibling.innerText;
const shipRates = document.querySelector("#custbody_quoted_rates_fs_lbl_uir_label").nextElementSibling.innerText;
const estFreight = document.querySelector("#custbodyfreightquote_fs_lbl_uir_label").nextElementSibling.innerText;
const estParcel = document.querySelector("#custbodyparcelquote_fs_lbl_uir_label").nextElementSibling.innerText;
*/

/* The estimated stock cost is loaded dynamically, would need to click() on the Billing tab to generate it in the first place (todo?)
// Following variable returns null on Estimates
if (document.querySelector("#recmachcustrecord_gp_sorow0 > td:nth-child(4)")) {
  const dvEst = document.querySelector("#recmachcustrecord_gp_sorow0 > td:nth-child(4)").innerText;
} else {console.log('Cannot get estimated stock cost on Estimate record')}
*/

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
      aRow = `"${aRow./*replace(/[\n\r]/gm,' ').*/replace(/"/gm,'""')}"`
      currentRow.push(aRow);
      column++;
    };
    column = 1;
    itemTable.push(currentRow);
    row++
  };
  return itemTable;
}

// Create and download CSV with some array
function downloadTable() {
  let csvContent = "data:text/csv;charset=utf-8,";
  let itemTable = buildItemTable();
  itemTable.forEach(function(rowArray) {
    let thisRow = rowArray.join(",");
    csvContent += thisRow + "\r\n";
  });

  var encodedUri = encodeURI(csvContent);
  window.open(encodedUri);
}

// Same method but join with tab character instead of comma in order to paste directly into sheet
function copyTable() {
    let copyContent = '';
    let itemTable = buildItemTable();
    itemTable.forEach(function(rowArray) {
        let thisRow = rowArray.join("	");
        copyContent += thisRow + "\r\n";
    });

    navigator.clipboard.writeText(copyContent);
}

function copyAll() {
    let copyContent = '';
    let itemTable = buildItemTable();
    if (!document.querySelector("#custbody_freight_packages_fs_lbl_uir_label")) {
      setFrameVars();
      changeShipquoteInfo();
    }
    const infoValues = [orderInfo.shipAddress,orderInfo.shipPhone,orderInfo.email,orderInfo.shipMethod,orderInfo.estPallets,orderInfo.shipRates,orderInfo.recordNumber,orderInfo.recordURL];
    const infoArray = infoValues.map((info) => `"${info}"`);
    itemTable.push(['"Begin Order Info"']);
    itemTable.push(['"Address"','"Phone Number"','"Email"','"Shipping Method"','"Estimated Pallets"','"Shipping Estimates"','"Order Number"','"Order URL"']);
    itemTable.push(infoArray);
    itemTable.forEach(function(rowArray) {
        let thisRow = rowArray.join("	");
        copyContent += thisRow + "\r\n";
    });

    navigator.clipboard.writeText(copyContent);
}

// This function takes a specific array that contains all INET information
function pasteAll(data) {
  const inetInfo = data;
  console.log (inetInfo);
  document.querySelector("#custbody20").value+=inetInfo[0]
  document.querySelector("#custbody_pacejet_delivery_instructions").value+=inetInfo[1]
  document.querySelector("#custbody_shipaddressee").value=inetInfo[2]
  document.querySelector("#custbody_shipattention").value=inetInfo[3]
  document.querySelector("#custbody_shipaddress1").value=inetInfo[4]
  document.querySelector("#custbody_shipaddress2").value=inetInfo[5]
  document.querySelector("#custbody_shipcity").value=inetInfo[6]
  document.querySelector("#custbody_shipstate").value=inetInfo[7]
  document.querySelector("#custbody_shipzip").value=inetInfo[8]
  document.querySelector("#custbody_shipphone").value=inetInfo[9]
}

// This function actually picks up data from the clipboard and uses it with above function
async function pasteData() {
  let inetInfo;
  try {
    const clipboardContents = await navigator.clipboard.read();
    for (const item of clipboardContents) {
      for (const mimeType of item.types) {
        /* Commented code watches for image data and HTML text, respectively, but while this may be generally useful to recycle it is beyond the scope of this project
        if (mimeType === "image/png") {
          const pngImage = new Image(); // Image constructor
          pngImage.src = "image1.png";
          pngImage.alt = "PNG image from clipboard";
          const blob = await item.getType("image/png");
          pngImage.src = URL.createObjectURL(blob);
          destinationDiv.appendChild(pngImage);
        } else if (mimeType === "text/html") {
          const blob = await item.getType("text/html");
          const blobText = await blob.text();
          const clipHTML = document.createElement("pre");
          console.log(blobText);
          destinationDiv.appendChild(clipHTML);

        } else */if (mimeType === "text/plain") {
          const blob = await item.getType("text/plain");
          const blobText = await blob.text();
          const blobArray = blobText.split('&+')
          inetInfo = blobArray;
          console.log(inetInfo);
          pasteAll(inetInfo);
        } else {
          throw new Error(`${mimeType} not supported.`);
        }
      }
    }
  } catch (error) {
  }
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

// Add button that pastes INET info from clipboard; it will only appear in Edit mode
const addPasteButton = () => {
    const btn = document.createElement("button");
    btn.innerHTML = "Paste INET Info to Order";
    btn.onclick = () => {
      pasteData();
      return false;
    };
  // Choose element to attach button to
  document.querySelector(".uir_form_tab_container").before(btn);
};

/*
// Wait until field exists
VM.observe(document.body, () => {
  const node = document.querySelector(".uir_form_tab_container");
  if (node) {
    addCopyButton();
    console.log('Good job');
    return true;
  } else {console.log('Nope')}
});
*/


//Alternate method?
const disconnect = VM.observe(document.body, () => {
  // Find the target node
  const node = document.querySelector(".uir_form_tab_container");
  const edCheck = new RegExp('e=T');
  const url = window.location.href;

  if (node) {
    if (edCheck.test(url)) {
      addPasteButton();
    } else { addCopyButton() };

    // disconnect observer
    return true;
  }
});
