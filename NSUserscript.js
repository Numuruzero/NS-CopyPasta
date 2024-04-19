// ==UserScript==
// @name        The ol' CSV-aroo
// @namespace   NetSuite WG
// @match       https://1206578.app.netsuite.com/app/accounting/transactions/salesord.nl*
// @match       https://1206578.app.netsuite.com/app/accounting/transactions/estimate.nl*
// @include     *
// @version     1
// ==/UserScript==



// Get a value from the page
let tableItem = document.querySelector("#item_splits > tbody > tr:nth-child(2) > td:nth-child(1)");

// Get the size of the order table
// Content rows start at 2, accounting for header row
// As of 4/19/24, total columns = 65
let testRows;
testRows = document.querySelector("#item_splits > tbody > tr:nth-child(2) > td:nth-child(1)");
let i = 2
let lastRow = 0
while (testRows) {
    lastRow = i - 1;
    testRows = document.querySelector(`#item_splits > tbody > tr:nth-child(${i}) > td:nth-child(1)`);
    i++;
}
const lastColumn = 65;

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
const btn = document.createElement("button");
btn.innerHTML = "Copy Item Table to Clipboard";
btn.onclick = () => {
    copyTable();
    return false;
};
// Choose element to attach button to
document.querySelector(".uir_form_tab_container").before(btn);
