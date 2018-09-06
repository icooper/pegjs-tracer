/*
 * text-quoter.ts
 * 
 * Utility class for quoting from source files. Originally written by Mitsutaka Okazaki.
 * 
 * Ian Cooper
 * 06 Sept 2018
 * 
 */

// import the TextUtil class for text styling
import { TextUtil, TextUtilStyle } from './TextUtil';

// interfaces
export interface TextQuoterOptions {
    useColor?: boolean;
    highlightStyle?: TextUtilStyle;
}

// classes
export class TextQuoter {

    // default options
    private static defaultOptions: TextQuoterOptions = {
        useColor: true,
        highlightStyle: { color: 'cyan' }
    }

    // properties
    options: TextQuoterOptions = { };
    private sourceLines: string[];

    // helper function to apply default settings
    private static applyDefault(opt: object, def: TextQuoterOptions): TextQuoterOptions {
        let ret = {};
        for (let key in def) {
            ret[key] = (opt && opt[key] !== undefined)
                ? opt[key]
                : def[key];
        }
        return ret;
    }

    // constructor
    constructor(source: string, opt: TextQuoterOptions) {

        // apply default options
        this.options = TextQuoter.applyDefault(opt, TextQuoter.defaultOptions);

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
    setTextStyle(str: string, style: TextUtilStyle, start?: number, end?: number): string {
        if (this.options.useColor) {
            return TextUtil.setTextStyle(str, style, start, end);
        } else {
            return str;
        }
    }

    // draw horizontal line
    drawHLine(start: number, length: number, ch: string): string {
        return this.setTextStyle(TextUtil.makeLine(start, length, ch), this.options.highlightStyle);
    }

    // get quoted lines
    getQuotedLines(quoteString: string,
                   startLine: number, startColumn:number,
                   endLine: number, endColumn:number,
                   maxLines: number): string[] {

        maxLines = (!maxLines || maxLines < 3) ? 3 : maxLines;
    
        let numLines = (endLine - startLine) + 1;
        let numSkipLines = numLines - maxLines;
        let numHeadLines = Math.ceil((numLines - numSkipLines) / 2);
        let numTailLines = Math.floor((numLines - numSkipLines) / 2);
    
        let lines: string[] = [];
        for (let i = startLine; i <= endLine; i++) {
            lines.push(this.sourceLines[i]);
        }
    
        var style = this.options.highlightStyle;
        if (startLine == endLine) {
            if (startColumn < endColumn) {
                lines[0] = this.setTextStyle(lines[0], style, startColumn, endColumn);
            }
        } else {
            lines[0] = this.setTextStyle(lines[0], style, startColumn);
            for (let i = 1; i < lines.length - 1; i++) {
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
        lines = lines.map(e => quoteString + e);
        return lines;
    }

    // get quoted text
    getQuotedText(quoteString: string,
                  startLine: number, startColumn: number,
                  endLine: number, endColumn: number,
                  maxLines: number): string {
        return this.getQuotedLines(quoteString, startLine, startColumn, endLine, endColumn, maxLines).join('\n');
    }
}