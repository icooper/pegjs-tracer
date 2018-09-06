/*
 * text-quoter.js
 * 
 * Utility class for quoting from source files. Originally written by Mitsutaka Okazaki.
 * 
 * Ian Cooper
 * 06 Sept 2018
 * 
 */

let TextUtil = require('./text-util');

class TextQuoter {

    // helper function to apply default settings
    static _applyDefault(opt, def) {
        let ret = {};
        for (let key in def) {
            ret[key] = (opt && opt[key] !== undefined)
                ? opt[key]
                : def[key];
        }
        return ret;   
    }

    // constructor
    constructor(source, opt) {

        // apply default options
        this.options = TextQuoter._applyDefault(opt, TextQuoter._defaultOptions);

        // make sure that we were given some source
        if (source == null) {
            throw new Error('Missing source argument.');
        }

        // convert CRLF and CR newlines to LF style
        source = source
            .replace(/\t/g,   ' ' )   // convert tabs to single spaces
            .replace(/\r\n/g, '\n')   // convert CRLF to LF
            .replace(/\r/g,   '\n');  // convert CR to LF

        // check for other weird vertical whitespace
        if (/[\v\f]/.test(source)) {
            throw new Error('Found an unsupported new line code. The new line code should be \'\\n\'.');
        }

        // split source into an array of lines
        this.sourceLines = source.split('\n');
    }

    // set text style
    setTextStyle(str, style, start, end) {
        if (this.options.useColor) {
            return TextUtil.setTextStyle(str, style, start, end);
        } else {
            return str;
        }
    }

    // draw horizontal line
    drawHLine(start, length, ch) {
        return this.setTextStyle(TextUtil.makeLine(start, length, ch), this.options.highlightStyle);
    }

    // get quoted lines
    getQuotedLines(quoteString, startLine, startColumn, endLine, endColumn, maxLines) {

        maxLines = (!maxLines || maxLines < 3) ? 3 : maxLines;
    
        var numLines = (endLine - startLine) + 1;
        var numSkipLines = numLines - maxLines;
        var numHeadLines = Math.ceil((numLines - numSkipLines) / 2);
        var numTailLines = Math.floor((numLines - numSkipLines) / 2);
    
        var i;
        var lines = [];
        for (i = startLine; i <= endLine; i++) {
            lines.push(this.sourceLines[i]);
        }
    
        var style = this.options.highlightStyle;
        if (startLine == endLine) {
            if (startColumn < endColumn) {
                lines[0] = this.setTextStyle(lines[0], style, startColumn, endColumn);
            }
        } else {
            lines[0] = this.setTextStyle(lines[0], style, startColumn);
            for (i = 1; i < lines.length - 1; i++) {
                lines[i] = this.setTextStyle(lines[i], style);
            }
            lines[lines.length - 1] = this.setTextStyle(lines[lines.length - 1], style, 0, endColumn + 1);
        }
    
        if (0 < numSkipLines) {
            lines = lines.slice(0, numHeadLines).concat(['...']).concat(lines.slice(lines.length - numTailLines));
        }
    
        if (startLine == endLine && startColumn <= endColumn) {
            lines.push(this.drawHLine(startColumn, (endColumn - startColumn) || 1, '^'));
        } else if (startLine < endLine) {
            lines.unshift(this.drawHLine(startColumn, (lines[0].length - startColumn), '_'));
            lines.push(this.drawHLine(0, endColumn, '^'));
        }
        lines = lines.map(function (e) { return quoteString + e; });
        return lines;
    }

    // get quoted text
    getQuotedText(quoteString, startLine, startColumn, endLine, endColumn, maxLines) {
        return this.getQuotedLines(quoteString, startLine, startColumn, endLine, endColumn, maxLines).join('\n');
    }
}

TextQuoter._defaultOptions = {
    useColor: true,
    highlightStyle: { color: 'cyan' },
};

// export the TextQuoter class
module.exports = TextQuoter;
