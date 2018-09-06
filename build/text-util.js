"use strict";
/*
 * text-util.ts
 *
 * Static utility class for text formatting. Originally written by Mitsutaka Okazaki.
 *
 * Ian Cooper
 * 06 Sept 2018
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
// classes
var TextUtil = /** @class */ (function () {
    function TextUtil() {
    }
    // truncates the a string from the beginning
    TextUtil.truncate = function (str, maxlen) {
        if (0 < maxlen && maxlen < str.length) {
            var trlen = str.length - maxlen + 3;
            return '...' + str.slice(trlen);
        }
        return str;
    };
    // applies the specified text style
    TextUtil.setTextStyle = function (str, style, start, end) {
        if (style) {
            var buf = [];
            if (style.color != null) {
                buf.push(TextUtil.COLOR_MAP[style.color] || '37');
            }
            if (style.background != null) {
                buf.push(TextUtil.BG_COLOR_MAP[style.background] || '40');
            }
            if (style.attribute != null) {
                buf.push('' + (TextUtil.ATTR_MAP[style.attribute] || ''));
            }
            if (0 < buf.length) {
                if (start === undefined) {
                    str = '\x1b[' + buf.join(';') + 'm' + str + '\x1b[0m';
                }
                else {
                    end = end ? end : str.length;
                    str = str.slice(0, start) + '\x1b[' + buf.join(';') + 'm' + str.slice(start, end) + '\x1b[0m' + str.slice(end);
                }
            }
        }
        return str;
    };
    // make some blank space (or uses the specified character)
    TextUtil.makeIndent = function (indent, ch) {
        if (ch === void 0) { ch = ' '; }
        return Array(indent + 1).join(ch);
    };
    // concatenate two text blocks
    TextUtil.concatTextBlock = function (a, b) {
        var result = [];
        for (var i = 0; i < Math.max(a.length, b.length); i++) {
            result.push((a[i] || '') + (b[i] || ''));
        }
        return result;
    };
    // make a line of spaces
    TextUtil.makeLine = function (indent, length, ch) {
        return TextUtil.makeIndent(indent) + TextUtil.makeIndent(length, ch);
    };
    // escape codes for console forground colors
    TextUtil.COLOR_MAP = {
        black: '30',
        red: '31',
        green: '32',
        yellow: '33',
        blue: '34',
        magenta: '35',
        cyan: '36',
        white: '37'
    };
    // escape codes for console background colors
    TextUtil.BG_COLOR_MAP = {
        black: '40',
        red: '41',
        green: '42',
        yellow: '43',
        blue: '44',
        magenta: '45',
        cyan: '46',
        white: '47'
    };
    // escape code for console text attributes
    TextUtil.ATTR_MAP = {
        bold: '1',
        thin: '2',
        underline: '4',
        blink: '5',
        reverse: '7',
        invisible: '8'
    };
    return TextUtil;
}());
exports.TextUtil = TextUtil;
//# sourceMappingURL=text-util.js.map