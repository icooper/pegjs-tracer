/*
 * index.ts
 * 
 * Backtrace formatter for PEG.js parser debugging. Originally written by Mitsutaka Okazaki.
 * 
 * Ian Cooper
 * 06 Sept 2018
 * 
 */

// imports
import { TextQuoter, TextQuoterOptions } from './text-quoter';
import { TextUtil, TextUtilStyle } from './text-util';
import { TextGraph, TextGraphOptions } from './graph';

// interfaces
export interface TracerOptions {
    hiddenPaths?: any[];
    useColor?: boolean;
    maxSourceLines?: number;
    parent?: Tracer;
    showSource?: boolean;
    showTrace?: boolean;
    showFullPath?: boolean;
    maxPathLength?: number;
}

export interface TracerStringMap {
    'rule.enter': string;
    'rule.match': string;
    'rule.fail': string;
    'error': string;
}

export interface TracerNode {
    type: string;
    path: string;
    parent?: TracerNode;
    children?: TracerNode[];
    matches?: TracerNode[];
    fails?: TracerNode[];
    rule: string;
    location: TracerLocation;
    lastChildType?: string;
    number?: number;
    style?: TextUtilStyle;
}

export interface TracerLocation {
    start: {
        offset: number;
        line: number;
        column: number;
    };
    end: {
        offset: number;
        line: number;
        column: number;
    };
}

export interface TracerEvent {
    type: string;
    rule: string;
    location: TracerLocation;
}

// classes
export class Tracer {

    // default options
    private static defaultOptions: TracerOptions = {
        hiddenPaths: [],
        useColor: true,
        maxSourceLines: 6,
        parent: null,
        showSource: true,
        showTrace: false,
        showFullPath: false,
        maxPathLength: 64
    };

    // styles
    private static VLINE_STYLES: TextUtilStyle[] = [
        { color: 'yellow' },
        { color: 'magenta' },
        { color: 'blue' },
        { color: 'white' },
        { color: 'green' }    
    ]

    // properties
    options: TracerOptions;
    parent: Tracer;
    quoter: TextQuoter;
    hiddenPatterns: RegExp[];
    headStringMap: TracerStringMap;
    typeStringMap: TracerStringMap;
    root: TracerNode;
    currentNode: TracerNode;
    maxFailPos: number;
    maxFails: any[]
    currentLevel: number;
    numNodes: number;

    // constructor
    constructor(source: string, opt: TracerOptions) {

        this.options = {};
        for (let key in Tracer.defaultOptions) {
            this.options[key] = (opt && opt[key] !== undefined)
                ? opt[key]
                : Tracer.defaultOptions[key];
        }

        this.parent = this.options.parent;
        this.quoter = new TextQuoter(source, { useColor: this.options.useColor });
        this.hiddenPatterns = [];

        for (let i = 0; i < this.options.hiddenPaths.length; i++) {
            let pattern = this.options.hiddenPaths[i];
            if (pattern instanceof RegExp) {
                this.hiddenPatterns[i] = pattern;
            } else {
                this.hiddenPatterns[i] = new RegExp('(^|/)' + pattern + '(/|$)');
            }
        }

        this.headStringMap = {
            'rule.enter': this.setTextStyle('+ ', { color: 'cyan' }),
            'rule.match': this.setTextStyle('o ', { color: 'green' }),
            'rule.fail': this.setTextStyle('x ', { color: 'red' }),
            'error': this.setTextStyle('! ', { color: 'red' })
        };

        this.typeStringMap = {
            'rule.enter': this.setTextStyle('ENTER', { color: 'cyan' }),
            'rule.match': this.setTextStyle('MATCH', { color: 'green' }),
            'rule.fail': this.setTextStyle('FAIL ', { color: 'red' }),
            'error': this.setTextStyle('ERROR', { color: 'red' })
        };

        this.init();

    }

    init(): void {
        this.root = {
            type: 'root',
            path: '',
            parent: null,
            matches: [],
            fails: [],
            rule: '',
            location: {
                start: { offset: 0, line: 0, column: 0 },
                end: { offset: 0, line: 0, column: 0 }
            }
        };

        this.currentNode = this.root;
        this.maxFailPos = 0;
        this.maxFails = [];
        this.currentLevel = 0;
        this.numNodes = 0;
    }

    setTextStyle(str: string, style: TextUtilStyle): string {
        return this.quoter.setTextStyle(str, style);
    }

    private static convertToZeroBasedLocation(location: TracerLocation): TracerLocation {
        return {
            start: {
                offset: location.start.offset,
                line: location.start.line - 1,
                column: location.start.column - 1
            },
            end: {
                offset: location.end.offset,
                line: location.end.line - 1,
                column: location.end.column - 1
            },
        };
    }

    getSourceLines(quoteString: string, location: TracerLocation, maxLines: number): string[] {
        location = Tracer.convertToZeroBasedLocation(location);
        return this.quoter.getQuotedLines(quoteString,
            location.start.line, location.start.column,
            location.end.line, location.end.column,
            maxLines);
    }

    isHidden(node: TracerNode): boolean {
        let path = node.path + node.rule;
        for (let i = 0; i < this.hiddenPatterns.length; i++) {
            let pattern = this.hiddenPatterns[i];
            if (pattern.test(path)) {
                return true;
            }
        }
        return false;
    }

    trace(evt: TracerEvent): void {
        if (this.parent !== null) this.parent.trace(evt);

        switch (evt.type) {
        case 'rule.enter':
            this.onEnter(evt);
            break;
        case 'rule.match':
            this.onMatch(evt);
            break;
        default:
            this.onFail(evt);
            break;
        }
    }

    printNode(level: number, node: TracerNode): void {

        if (this.isHidden(node)) return;

        let lines = this.buildNodeText(node, this.options.showSource, ' ');
        let tailIndent = TextUtil.makeIndent(level + 1);
        let headIndent = TextUtil.makeIndent(level) + this.typeStringMap[node.type] + ' ';

        lines = lines.map((e: string, i: number) => {
            if (i === 0) {
                return headIndent + e;
            } else {
                return tailIndent + e;
            }
        });

        console.log(lines.join('\n'));
    }

    onEnter(evt: TracerEvent): void {

        let node: TracerNode = {
            path: this.currentNode.path + this.currentNode.rule + '/',
            parent: this.currentNode,
            matches: [],
            fails: [],
            type: evt.type,
            rule: evt.rule,
            location: evt.location,
            lastChildType: null,
            number: ++this.numNodes,
        };

        this.currentNode = node;

        if (this.options.showTrace) {
            this.printNode(this.currentLevel, this.currentNode);
        }

        this.currentLevel++;
    }

    private static isParentRule(parent: TracerNode, child: TracerNode): boolean {
        return parent.path + parent.rule + '/' == child.path;
    }

    private static isSameRule(n1: TracerNode, n2: TracerNode): boolean {
        return (n1.path == n2.path) && (n1.rule == n2.rule);
    }

    onFail(evt: TracerEvent): void {

        if (this.maxFailPos < evt.location.start.offset) {
            this.maxFailPos = evt.location.start.offset;
            this.maxFails = [this.currentNode];
        } else if (this.maxFailPos == evt.location.start.offset) {
            let found = false;
            for (let i = this.maxFails.length - 1; 0 <= i; i--) {
                let f = this.maxFails[i];
                if (Tracer.isParentRule(this.currentNode, f) ||
                    Tracer.isSameRule(this.currentNode, f)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.maxFails.push(this.currentNode);
            }
        }

        this.currentNode.type = evt.type;
        this.currentNode.location = evt.location;
        this.currentNode.parent.fails.push(this.currentNode);
        this.currentNode.parent.lastChildType = 'fail';

        this.currentLevel--;

        if (this.options.showTrace) {
            this.printNode(this.currentLevel, this.currentNode);
        }

        this.currentNode = this.currentNode.parent;
    }

    onMatch(evt: TracerEvent): void {

        this.currentNode.type = evt.type;
        this.currentNode.location = evt.location;
        this.currentNode.parent.matches.push(this.currentNode);
        this.currentNode.parent.lastChildType = 'match';

        this.currentLevel--;

        if (this.options.showTrace) {
            this.printNode(this.currentLevel, this.currentNode);
        }

        this.currentNode = this.currentNode.parent;
    }

    buildNodeText(node: TracerNode, withSource: boolean, quoteString: string = ''): string[] {
        var buf: string[] = [];
        var location = [
            node.location.start.line, ':', node.location.start.column,
            '-',
            node.location.end.line, ':', node.location.end.column,
        ].join('');

        var title = [];
        if (this.options.showTrace) {
            title.push(this.setTextStyle('#' + node.number, { attribute: 'thin' }));
        }
        title.push(this.setTextStyle(location, { attribute: 'thin' }));

        if (this.options.showFullPath) {
            title.push(this.setTextStyle(TextUtil.truncate(node.path, this.options.maxPathLength) + node.rule, { color: 'yellow', attribute: 'bold' }));
        } else {
            title.push(this.setTextStyle(node.rule, { color: 'yellow', attribute: 'bold' }));
        }

        buf.push(title.join(' '));

        if (withSource) {
            var lines = this.getSourceLines(quoteString, node.location, this.options.maxSourceLines);
            for (var i = 0; i < lines.length; i++) {
                buf.push(lines[i]);
            }
        }
        return buf;
    }

    getParseTree(type?: string, node: TracerNode = this.root): TracerNode {

        var children: TracerNode[] = [];
        var self = this;

        var ret = {
            parent: null,
            type: node.type,
            path: node.path,
            rule: node.rule,
            children: children,
            location: node.location,
            number: node.number,
        };

        function buildChilden(nodes: TracerNode[]): void {
            var c, e, i;
            for (i = 0; i < nodes.length; i++) {
                e = nodes[i];
                if (type != 'fail' && self.isHidden(e)) continue;
                c = self.getParseTree(type, e);
                if (c) {
                    c.parent = ret;
                    children.push(c);
                }
            }
        }

        buildChilden(node.matches);
        buildChilden(node.fails);

        if (children.length == 0 && type == 'fail' && this.maxFails.indexOf(node) < 0) {
            return null;
        }

        return ret;

    }

    buildNodeGraph(list: TracerNode[]): string[] {

        let nodes: TracerNode[] = [];
        let lines: string[] = [];
        let g = new TextGraph({ useColor: this.options.useColor });

        while (list.length > 0) {

            let node = list.pop();
            let parentIndexes = [];

            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].parent == node) {
                    parentIndexes.push(i);
                }
            }

            let column;

            if (parentIndexes.length == 0) {
                column = nodes.length;
                node.style = Tracer.VLINE_STYLES[column % Tracer.VLINE_STYLES.length];
                nodes.push(node);
                lines = lines.concat(g.drawState(nodes, column, this.buildNodeText(node, this.options.showSource)));
            } else {
                column = parentIndexes.shift();
                lines = lines.concat(g.drawMergeEdges(parentIndexes, column, nodes));
                node.style = nodes[column].style;
                nodes[column] = node;
                nodes = nodes.filter(function (e, i) { return (parentIndexes.indexOf(i) < 0); });
                lines = lines.concat(g.drawState(nodes, column, this.buildNodeText(node, this.options.showSource), list.length == 0));
            }

            if (!this.options.showSource && 0 < list.length) {
                lines = lines.concat(g.drawState(nodes));
            }
        }

        return lines;

    };

    private static treeToList(tree?: TracerNode): TracerNode[] {
        let buf: TracerNode[] = [];
        if (tree) {
            buf.push(tree);
            for (let i = 0; i < tree.children.length; i++) {
                let subs = Tracer.treeToList(tree.children[i]);
                for (let j = 0; j < subs.length; j++) {
                    buf.push(subs[j]);
                }
            }
        }
        return buf;
    }

    getParseTreeString(): string {
        let lines = [];
        let tree = this.getParseTree();
        let list = Tracer.treeToList(tree);
        if (list.length == 0) {
            return 'No trace found. Make sure you use `pegjs --trace` to build your parser javascript.';
        }
        list.shift();
        lines = this.buildNodeGraph(list);
        return lines.join('\n');
    }

    getBacktraceString(): string {
        let lines = [];
        let tree = this.getParseTree('fail');
        let list = Tracer.treeToList(tree);
        if (list.length == 0) {
            return 'No backtrace found. Make sure you use `pegjs --trace` to build your parser javascript.\n' +
                'Or, the failure might occur in the start node.';
        }
        list.shift();
        lines = this.buildNodeGraph(list);
        return lines.join('\n');
    };
}