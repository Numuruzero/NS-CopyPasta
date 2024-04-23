// ==UserScript==
// @name        The ol' CSV-aroo
// @namespace   NetSuite WG
// @match       https://1206578.app.netsuite.com/app/accounting/transactions/salesord.nl*
// @match       https://1206578.app.netsuite.com/app/accounting/transactions/estimate.nl*
// @downloadURL https://github.com/Numuruzero/NS-CopyPasta/blob/main/NSUserscript.js
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @version     1.1
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


// Build an array out of the table
// Newline/return replacement is commented out because surrounding elements with quotes eliminates the need to remove these
const buildItemTable = () => {
  const itemTable = [];
  let currentRow = [];
  let row = 2;
  let column = 1;
  let aRow;
  while (row <= getRowCount()) {
    currentRow = [];
    while (column <= getColumnCount()) {
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
// Potentially could use same method but join with tab character instead of comma in order to paste directly into sheet
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

function copyTable() {
    let copyContent = '';
    let itemTable = buildItemTable();
    itemTable.forEach(function(rowArray) {
        let thisRow = rowArray.join("	");
        copyContent += thisRow + "\r\n";
    });

    navigator.clipboard.writeText(copyContent);
}

// Add button that copies some text to clipboard to the page
const addCopyButton = () => {
    const btn = document.createElement("button");
    btn.innerHTML = "Copy Item Table to Clipboard";
    btn.onclick = () => {
      copyTable();
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

  if (node) {
    addCopyButton();

    // disconnect observer
    return true;
  }
});
