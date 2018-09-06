/*
 * text-util.ts
 * 
 * Static utility class for text formatting. Originally written by Mitsutaka Okazaki.
 * 
 * Ian Cooper
 * 06 Sept 2018
 * 
 */

// interfaces
export interface TextUtilStyle { color?: string, background?: string, attribute?: string }

// classes
export class TextUtil {

    // escape codes for console forground colors
    private static COLOR_MAP = {
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
    private static BG_COLOR_MAP = {
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
    private static ATTR_MAP = {
        bold: '1',
        thin: '2',
        underline: '4',
        blink: '5',
        reverse: '7',
        invisible: '8'
    };

    // truncates the a string from the beginning
    static truncate(str: string, maxlen: number): string {
        if (0 < maxlen && maxlen < str.length) {
            let trlen: number = str.length - maxlen + 3;
            return '...' + str.slice(trlen);
        }
        return str;
    }
    
    // applies the specified text style
    static setTextStyle(str: string, style: TextUtilStyle, start?: number, end?: number): string {
        if (style) {
            let buf: Array<string> = [];
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
                } else {
                    end = end ? end : str.length;
                    str = str.slice(0, start) + '\x1b[' + buf.join(';') + 'm' + str.slice(start, end) + '\x1b[0m' + str.slice(end);
                }
            }
        }
        return str;
    }
    
    // make some blank space (or uses the specified character)
    static makeIndent(indent: number, ch:string = ' '): string {
        return Array(indent + 1).join(ch);
    }
    
    // concatenate two text blocks
    static concatTextBlock(a: string, b: string): Array<string> {
        let result: Array<string> = [];
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            result.push((a[i] || '') + (b[i] || ''));
        }
        return result;
    }
    
    // make a line of spaces
    static makeLine(indent: number, length: number, ch: string): string {
        return TextUtil.makeIndent(indent) + TextUtil.makeIndent(length, ch);
    }
}