// ==UserScript==
// @name        The ol' CSV-aroo
// @namespace   NetSuite WG
// @match       https://1206578.app.netsuite.com/app/accounting/transactions/salesord.nl*
// @match       https://1206578.app.netsuite.com/app/accounting/transactions/estimate.nl*
// @downloadURL https://github.com/Numuruzero/NS-CopyPasta/blob/main/NSUserscript.js
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @version     1
// ==/UserScript==



// Get a value from the page
let tableItem = document.querySelector("#item_splits > tbody > tr:nth-child(2) > td:nth-child(1)");

// Get the size of the order table
// Content rows start at 2, accounting for header row
// As of 4/19/24, total columns = 65
// As of 4/22, building tester for columns as well
let testRows;
let testColumns;
testRows = document.querySelector("#item_splits > tbody > tr:nth-child(2) > td:nth-child(1)");
testColumns = document.querySelector("#item_splits > tbody > tr:nth-child(2) > td:nth-child(1)");
let y = 2;
let lastRow = 0;
let lastColumn = 0;
while (testRows) {
    lastRow = y - 1;
    testRows = document.querySelector(`#item_splits > tbody > tr:nth-child(${y}) > td:nth-child(1)`);
    y++;
}
let x = 1;
while (testColumns) {
    lastColumn = x - 1;
    testColumns = document.querySelector(`#item_splits > tbody > tr:nth-child(2) > td:nth-child(${x})`);
    x++;
}

// Build an array out of the table
const itemTable = [];
let currentRow = [];
let row = 2;
let column = 1;
let aRow;
while (row <= lastRow) {
  currentRow = [];
  while (column <= lastColumn) {
    aRow = document.querySelector(`#item_splits > tbody > tr:nth-child(${row}) > td:nth-child(${column})`).innerText;
    aRow = `"${aRow.replace(/[\n\r]/gm,' ').replace(/"/gm,'""')}"`
    currentRow.push(aRow);
    column++;
    };
  column = 1;
  itemTable.push(currentRow);
  row++
};

// Create and download CSV with some array
// Potentially could use same method but join with tab character instead of comma in order to paste directly into sheet
function downloadTable() {
    let csvContent = "data:text/csv;charset=utf-8,";

    itemTable.forEach(function(rowArray) {
        let thisRow = rowArray.join(",");
        csvContent += thisRow + "\r\n";
    });

    var encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
}

function copyTable() {
    let copyContent = '';

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
