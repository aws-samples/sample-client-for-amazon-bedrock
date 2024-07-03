"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _default = {
  createDocument: function createDocument(content) {
    // if (!content) {
    // 	throw new Error('No *.xml content')
    // }
    // A weird bug: it won't parse XML unless it's trimmed.
    // https://github.com/catamphetamine/read-excel-file/issues/21
    return new DOMParser().parseFromString(content.trim(), 'text/xml');
  }
};
exports["default"] = _default;
//# sourceMappingURL=xmlBrowser.js.map