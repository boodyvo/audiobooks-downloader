const { ipcRenderer } = require('electron');
const { book } = require('./config');

window.ipcRenderer = ipcRenderer;
window.book = book;