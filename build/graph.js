"use strict";
/*
 * graph.ts
 *
 * ASCII-art style parser backtrace formatting class. Originally written by Mitsutaka Okazaki.
 *
 * Ian Cooper
 * 06 Sept 2018
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
// import the TextUtil class for text styling
var text_util_1 = require("./text-util");
;
// classes
var TextGraph = /** @class */ (function () {
    // constructor
    function TextGraph(opt) {
        // properties
        this.options = {};
        this.options = TextGraph.applyDefault(opt, TextGraph.defaultOptions);
    }
    // helper function to apply default settings
    TextGraph.applyDefault = function (opt, def) {
        var ret = {};
        for (var key in def) {
            ret[key] = (opt && opt[key] !== undefined)
                ? opt[key]
                : def[key];
        }
        return ret;
    };
    // set text style
    TextGraph.prototype.setTextStyle = function (str, style, start, end) {
        if (this.options.useColor) {
            return text_util_1.TextUtil.setTextStyle(str, style, start, end);
        }
        else {
            return str;
        }
    };
    // set draw state
    TextGraph.prototype.drawState = function (nodes, column, contents, isLastState) {
        if (column === void 0) { column = null; }
        if (contents === void 0) { contents = []; }
        if (isLastState === void 0) { isLastState = false; }
        var buf = [];
        if (contents.length > 0) {
            buf.push(this.drawStateLine(nodes, column, isLastState) + contents.shift());
            while (contents.length > 0) {
                buf.push(this.drawStateLine(nodes, undefined, isLastState) + contents.shift());
            }
        }
        else {
            buf.push(this.drawStateLine(nodes, column, isLastState));
        }
        return buf;
    };
    // draw state line
    TextGraph.prototype.drawStateLine = function (nodes, column, isLastState) {
        if (column === void 0) { column = null; }
        if (isLastState === void 0) { isLastState = false; }
        var line = '';
        var quote = isLastState ? '  ' : '| ';
        for (var i = 0; i < nodes.length; i++) {
            if (column === i) {
                switch (nodes[i].type) {
                    case 'rule.fail':
                        line += this.setTextStyle('x ', { color: 'red' });
                        break;
                    case 'rule.match':
                        line += this.setTextStyle('o ', { color: 'green' });
                        break;
                    default:
                        line += this.setTextStyle('? ', { color: 'yellow' });
                }
            }
            else {
                line += this.setTextStyle(quote, nodes[i].style);
            }
        }
        return line;
    };
    // draw merge edge
    TextGraph.prototype.drawMergeEdge = function (fromIndex, toIndex, nodes) {
        var lines = ['', ''];
        for (var i = 0; i < nodes.length; i++) {
            if (i <= toIndex) {
                lines[0] += this.setTextStyle('| ', nodes[i].style);
            }
            else if (i < fromIndex - 1) {
                lines[0] += this.setTextStyle('|', nodes[i].style) + this.setTextStyle('_', nodes[fromIndex].style);
            }
            else if (i === fromIndex - 1) {
                lines[0] += this.setTextStyle('|', nodes[i].style) + this.setTextStyle('/', nodes[fromIndex].style);
            }
            else if ((i > fromIndex) || ((i === fromIndex) && (toIndex + 1 === fromIndex))) {
                lines[0] += this.setTextStyle('| ', nodes[i].style);
            }
            else {
                lines[0] += '  ';
            }
        }
        for (var i = 0; i < nodes.length; i++) {
            if (i < toIndex) {
                lines[1] += this.setTextStyle('| ', nodes[i].style);
            }
            else if (i === toIndex) {
                lines[1] += this.setTextStyle('|', nodes[i].style) + this.setTextStyle('/', nodes[fromIndex].style);
            }
            else if (i < fromIndex) {
                lines[1] += this.setTextStyle('| ', nodes[i].style);
            }
            else if (i < nodes.length - 1) {
                lines[1] += this.setTextStyle(' /', nodes[i + 1].style);
            }
            else {
                lines[1] += '  ';
            }
        }
        return lines;
    };
    // draw merge edges
    TextGraph.prototype.drawMergeEdges = function (fromIndexes, toIndex, nodes) {
        var lines = [];
        nodes = nodes.slice(0);
        fromIndexes = fromIndexes.slice(0);
        fromIndexes.sort(function (a, b) { return (a - b); });
        while (fromIndexes.length > 0) {
            var fromIndex = fromIndexes.shift();
            lines = lines.concat(this.drawMergeEdge(fromIndex, toIndex, nodes));
            nodes.splice(fromIndex, 1);
            for (var i = 0; i < fromIndexes.length; i++) {
                if (fromIndex < fromIndexes[i]) {
                    fromIndexes[i]--;
                }
            }
        }
        return lines;
    };
    // default options
    TextGraph.defaultOptions = {
        useColor: true
    };
    return TextGraph;
}());
exports.TextGraph = TextGraph;
//# sourceMappingURL=graph.js.map