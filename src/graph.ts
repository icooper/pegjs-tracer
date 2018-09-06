/*
 * graph.ts
 * 
 * ASCII-art style parser backtrace formatting class. Originally written by Mitsutaka Okazaki.
 * 
 * Ian Cooper
 * 06 Sept 2018
 * 
 */

// import the TextUtil class for text styling
import { TextUtil, TextUtilStyle } from './text-util';

// interfaces
export interface TextGraphOptions {
    useColor?: boolean;
};

// classes
export class TextGraph {

    // default options
    private static defaultOptions: TextGraphOptions = {
        useColor: true
    };

    // options
    options: TextGraphOptions = { };

    // helper function to apply default settings
    private static applyDefault(opt: object, def: TextGraphOptions): TextGraphOptions {
        let ret = {};
        for (let key in def) {
            ret[key] = (opt && opt[key] !== undefined)
                ? opt[key]
                : def[key];
        }
        return ret;
    }

    // constructor
    constructor(opt: TextGraphOptions) {
        this.options = TextGraph.applyDefault(opt, TextGraph.defaultOptions);
    }

    // set text style
    setTextStyle(str: string, style: TextUtilStyle, start?: number, end?: number): string {
        if (this.options.useColor) {
            return TextUtil.setTextStyle(str, style, start, end);
        } else {
            return str;
        }
    }

    // set draw state
    drawState(nodes: any[], column: number, contents: string[] = [], isLastState: boolean): string[] {
        let buf: string[] = [];
        if (contents.length > 0) {
            buf.push(this.drawStateLine(nodes, column, isLastState) + contents.shift());
            while (contents.length > 0) {
                buf.push(this.drawStateLine(nodes, undefined, isLastState) + contents.shift());
            }
        } else {
            buf.push(this.drawStateLine(nodes, column, isLastState));
        }
        return buf;
    }

    // draw state line
    drawStateLine(nodes: any[], column: number, isLastState: boolean): string {
        let line = '';
        let quote = isLastState ? '  ' : '| ';

        for (let i = 0; i < nodes.length; i++) {
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
            } else {
                line += this.setTextStyle(quote, nodes[i].style);
            }
        }

        return line;
    }

    // draw merge edge
    drawMergeEdge(fromIndex: number, toIndex: number, nodes: any[]): string[] {
        let lines = ['', ''];

        for (let i = 0; i < nodes.length; i++) {
            if (i <= toIndex) {
                lines[0] += this.setTextStyle('| ', nodes[i].style);
            } else if (i < fromIndex - 1) {
                lines[0] += this.setTextStyle('|', nodes[i].style) + this.setTextStyle('_', nodes[fromIndex].style);
            } else if (i === fromIndex - 1) {
                lines[0] += this.setTextStyle('|', nodes[i].style) + this.setTextStyle('/', nodes[fromIndex].style);
            } else if ((i > fromIndex) || ((i === fromIndex) && (toIndex + 1 === fromIndex))) {
                lines[0] += this.setTextStyle('| ', nodes[i].style);
            } else {
                lines[0] += '  ';
            }
        }

        for (let i = 0; i < nodes.length; i++) {
            if (i < toIndex) {
                lines[1] += this.setTextStyle('| ', nodes[i].style);
            } else if (i === toIndex) {
                lines[1] += this.setTextStyle('|', nodes[i].style) + this.setTextStyle('/', nodes[fromIndex].style);
            } else if (i < fromIndex) { 
                lines[1] += this.setTextStyle('| ', nodes[i].style);
            } else if (i < nodes.length - 1) {
                lines[1] += this.setTextStyle(' /', nodes[i + 1].style);
            } else {
                lines[1] += '  ';
            }
        }

        return lines;
    }

    // draw merge edges
    drawMergeEdges(fromIndexes: number[], toIndex: number, nodes: any[]): string[] {
        let lines = [];

        nodes = nodes.slice(0);
        fromIndexes = fromIndexes.slice(0);
        fromIndexes.sort((a, b) => (a - b));

        while (fromIndexes.length > 0) {
            let fromIndex = fromIndexes.shift();
            lines = lines.concat(this.drawMergeEdge(fromIndex, toIndex, nodes));
            nodes.splice(fromIndex, 1);

            for (let i = 0; i < fromIndexes.length; i++) {
                if (fromIndex < fromIndexes[i]) {
                    fromIndexes[i]--;
                }
            }
        }

        return lines;
    }
}
