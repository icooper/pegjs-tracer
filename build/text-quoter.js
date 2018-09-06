"use strict";
/*
 * text-quoter.ts
 *
 * Utility class for quoting from source files. Originally written by Mitsutaka Okazaki.
 *
 * Ian Cooper
 * 06 Sept 2018
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
// import the TextUtil class for text styling
var text_util_1 = require("./text-util");
// classes
var TextQuoter = /** @class */ (function () {
    // constructor
    function TextQuoter(source, opt) {
        // properties
        this.options = {};
        // apply default options
        this.options = TextQuoter.applyDefault(opt, TextQuoter.defaultOptions);
        // make sure that we were given some source
        if (source == null) {
            throw new Error('Missing source argument.');
        }
        // convert CRLF and CR newlines to LF style
        source = source
            .replace(/\t/g, ' ') // convert tabs to single spaces
            .replace(/\r\n/g, '\n') // convert CRLF to LF
            .replace(/\r/g, '\n'); // convert CR to LF
        // check for other weird vertical whitespace
        if (/[\v\f]/.test(source)) {
            throw new Error('Found an unsupported new line code. The new line code should be \'\\n\'.');
        }
        // split source into an array of lines
        this.sourceLines = source.split('\n');
    }
    // helper function to apply default settings
    TextQuoter.applyDefault = function (opt, def) {
        var ret = {};
        for (var key in def) {
            ret[key] = (opt && opt[key] !== undefined)
                ? opt[key]
                : def[key];
        }
        return ret;
    };
    // set text style
    TextQuoter.prototype.setTextStyle = function (str, style, start, end) {
        if (this.options.useColor) {
            return text_util_1.TextUtil.setTextStyle(str, style, start, end);
        }
        else {
            return str;
        }
    };
    // draw horizontal line
    TextQuoter.prototype.drawHLine = function (start, length, ch) {
        return this.setTextStyle(text_util_1.TextUtil.makeLine(start, length, ch), this.options.highlightStyle);
    };
    // get quoted lines
    TextQuoter.prototype.getQuotedLines = function (quoteString, startLine, startColumn, endLine, endColumn, maxLines) {
        maxLines = (!maxLines || maxLines < 3) ? 3 : maxLines;
        var numLines = (endLine - startLine) + 1;
        var numSkipLines = numLines - maxLines;
        var numHeadLines = Math.ceil((numLines - numSkipLines) / 2);
        var numTailLines = Math.floor((numLines - numSkipLines) / 2);
        var lines = [];
        for (var i = startLine; i <= endLine; i++) {
            lines.push(this.sourceLines[i]);
        }
        var style = this.options.highlightStyle;
        if (startLine == endLine) {
            if (startColumn < endColumn) {
                lines[0] = this.setTextStyle(lines[0], style, startColumn, endColumn);
            }
        }
        else {
            lines[0] = this.setTextStyle(lines[0], style, startColumn);
            for (var i = 1; i < lines.length - 1; i++) {
                lines[i] = this.setTextStyle(lines[i], style);
            }
            lines[lines.length - 1] = this.setTextStyle(lines[lines.length - 1], style, 0, endColumn + 1);
        }
        if (0 < numSkipLines) {
            lines = lines.slice(0, numHeadLines).concat(['...']).concat(lines.slice(lines.length - numTailLines));
        }
        if (startLine == endLine && startColumn <= endColumn) {
            lines.push(this.drawHLine(startColumn, (endColumn - startColumn) || 1, '^'));
        }
        else if (startLine < endLine) {
            lines.unshift(this.drawHLine(startColumn, (lines[0].length - startColumn), '_'));
            lines.push(this.drawHLine(0, endColumn, '^'));
        }
        lines = lines.map(function (e) { return quoteString + e; });
        return lines;
    };
    // get quoted text
    TextQuoter.prototype.getQuotedText = function (quoteString, startLine, startColumn, endLine, endColumn, maxLines) {
        return this.getQuotedLines(quoteString, startLine, startColumn, endLine, endColumn, maxLines).join('\n');
    };
    // default options
    TextQuoter.defaultOptions = {
        useColor: true,
        highlightStyle: { color: 'cyan' }
    };
    return TextQuoter;
}());
exports.TextQuoter = TextQuoter;
//# sourceMappingURL=text-quoter.js.map