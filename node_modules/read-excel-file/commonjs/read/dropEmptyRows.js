"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = dropEmptyRows;

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (it) return (it = it.call(o)).next.bind(it); if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function dropEmptyRows(data) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      rowMap = _ref.rowMap,
      _ref$accessor = _ref.accessor,
      accessor = _ref$accessor === void 0 ? function (_) {
    return _;
  } : _ref$accessor,
      onlyTrimAtTheEnd = _ref.onlyTrimAtTheEnd;

  // Drop empty rows.
  var i = data.length - 1;

  while (i >= 0) {
    // Check if the row is empty.
    var empty = true;

    for (var _iterator = _createForOfIteratorHelperLoose(data[i]), _step; !(_step = _iterator()).done;) {
      var cell = _step.value;

      if (accessor(cell) !== null) {
        empty = false;
        break;
      }
    } // Remove the empty row.


    if (empty) {
      data.splice(i, 1);

      if (rowMap) {
        rowMap.splice(i, 1);
      }
    } else if (onlyTrimAtTheEnd) {
      break;
    }

    i--;
  }

  return data;
}
//# sourceMappingURL=dropEmptyRows.js.map