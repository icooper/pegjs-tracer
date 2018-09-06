"use strict";
/*
 * index.ts
 *
 * Backtrace formatter for PEG.js parser debugging. Originally written by Mitsutaka Okazaki.
 *
 * Ian Cooper
 * 06 Sept 2018
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
// imports
var text_quoter_1 = require("./text-quoter");
var text_util_1 = require("./text-util");
var graph_1 = require("./graph");
// classes
var Tracer = /** @class */ (function () {
    // constructor
    function Tracer(source, opt) {
        this.options = {};
        for (var key in Tracer.defaultOptions) {
            this.options[key] = (opt && opt[key] !== undefined)
                ? opt[key]
                : Tracer.defaultOptions[key];
        }
        this.parent = this.options.parent;
        this.quoter = new text_quoter_1.TextQuoter(source, { useColor: this.options.useColor });
        this.hiddenPatterns = [];
        for (var i = 0; i < this.options.hiddenPaths.length; i++) {
            var pattern = this.options.hiddenPaths[i];
            if (pattern instanceof RegExp) {
                this.hiddenPatterns[i] = pattern;
            }
            else {
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
    Tracer.prototype.init = function () {
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
    };
    Tracer.prototype.setTextStyle = function (str, style) {
        return this.quoter.setTextStyle(str, style);
    };
    Tracer.convertToZeroBasedLocation = function (location) {
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
    };
    Tracer.prototype.getSourceLines = function (quoteString, location, maxLines) {
        location = Tracer.convertToZeroBasedLocation(location);
        return this.quoter.getQuotedLines(quoteString, location.start.line, location.start.column, location.end.line, location.end.column, maxLines);
    };
    Tracer.prototype.isHidden = function (node) {
        var path = node.path + node.rule;
        for (var i = 0; i < this.hiddenPatterns.length; i++) {
            var pattern = this.hiddenPatterns[i];
            if (pattern.test(path)) {
                return true;
            }
        }
        return false;
    };
    Tracer.prototype.trace = function (evt) {
        if (this.parent !== null)
            this.parent.trace(evt);
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
    };
    Tracer.prototype.printNode = function (level, node) {
        if (this.isHidden(node))
            return;
        var lines = this.buildNodeText(node, this.options.showSource, ' ');
        var tailIndent = text_util_1.TextUtil.makeIndent(level + 1);
        var headIndent = text_util_1.TextUtil.makeIndent(level) + this.typeStringMap[node.type] + ' ';
        lines = lines.map(function (e, i) {
            if (i === 0) {
                return headIndent + e;
            }
            else {
                return tailIndent + e;
            }
        });
        console.log(lines.join('\n'));
    };
    Tracer.prototype.onEnter = function (evt) {
        var node = {
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
    };
    Tracer.isParentRule = function (parent, child) {
        return parent.path + parent.rule + '/' == child.path;
    };
    Tracer.isSameRule = function (n1, n2) {
        return (n1.path == n2.path) && (n1.rule == n2.rule);
    };
    Tracer.prototype.onFail = function (evt) {
        if (this.maxFailPos < evt.location.start.offset) {
            this.maxFailPos = evt.location.start.offset;
            this.maxFails = [this.currentNode];
        }
        else if (this.maxFailPos == evt.location.start.offset) {
            var found = false;
            for (var i = this.maxFails.length - 1; 0 <= i; i--) {
                var f = this.maxFails[i];
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
    };
    Tracer.prototype.onMatch = function (evt) {
        this.currentNode.type = evt.type;
        this.currentNode.location = evt.location;
        this.currentNode.parent.matches.push(this.currentNode);
        this.currentNode.parent.lastChildType = 'match';
        this.currentLevel--;
        if (this.options.showTrace) {
            this.printNode(this.currentLevel, this.currentNode);
        }
        this.currentNode = this.currentNode.parent;
    };
    Tracer.prototype.buildNodeText = function (node, withSource, quoteString) {
        if (quoteString === void 0) { quoteString = ''; }
        var buf = [];
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
            title.push(this.setTextStyle(text_util_1.TextUtil.truncate(node.path, this.options.maxPathLength) + node.rule, { color: 'yellow', attribute: 'bold' }));
        }
        else {
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
    };
    Tracer.prototype.getParseTree = function (type, node) {
        if (node === void 0) { node = this.root; }
        var children = [];
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
        function buildChilden(nodes) {
            var c, e, i;
            for (i = 0; i < nodes.length; i++) {
                e = nodes[i];
                if (type != 'fail' && self.isHidden(e))
                    continue;
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
    };
    Tracer.prototype.buildNodeGraph = function (list) {
        var nodes = [];
        var lines = [];
        var g = new graph_1.TextGraph({ useColor: this.options.useColor });
        var _loop_1 = function () {
            var node = list.pop();
            var parentIndexes = [];
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].parent == node) {
                    parentIndexes.push(i);
                }
            }
            var column = void 0;
            if (parentIndexes.length == 0) {
                column = nodes.length;
                node.style = Tracer.VLINE_STYLES[column % Tracer.VLINE_STYLES.length];
                nodes.push(node);
                lines = lines.concat(g.drawState(nodes, column, this_1.buildNodeText(node, this_1.options.showSource)));
            }
            else {
                column = parentIndexes.shift();
                lines = lines.concat(g.drawMergeEdges(parentIndexes, column, nodes));
                node.style = nodes[column].style;
                nodes[column] = node;
                nodes = nodes.filter(function (e, i) { return (parentIndexes.indexOf(i) < 0); });
                lines = lines.concat(g.drawState(nodes, column, this_1.buildNodeText(node, this_1.options.showSource), list.length == 0));
            }
            if (!this_1.options.showSource && 0 < list.length) {
                lines = lines.concat(g.drawState(nodes));
            }
        };
        var this_1 = this;
        while (list.length > 0) {
            _loop_1();
        }
        return lines;
    };
    Tracer.treeToList = function (tree) {
        var buf = [];
        if (tree) {
            buf.push(tree);
            for (var i = 0; i < tree.children.length; i++) {
                var subs = Tracer.treeToList(tree.children[i]);
                for (var j = 0; j < subs.length; j++) {
                    buf.push(subs[j]);
                }
            }
        }
        return buf;
    };
    Tracer.prototype.getParseTreeString = function () {
        var lines = [];
        var tree = this.getParseTree();
        var list = Tracer.treeToList(tree);
        if (list.length == 0) {
            return 'No trace found. Make sure you use `pegjs --trace` to build your parser javascript.';
        }
        list.shift();
        lines = this.buildNodeGraph(list);
        return lines.join('\n');
    };
    Tracer.prototype.getBacktraceString = function () {
        var lines = [];
        var tree = this.getParseTree('fail');
        var list = Tracer.treeToList(tree);
        if (list.length == 0) {
            return 'No backtrace found. Make sure you use `pegjs --trace` to build your parser javascript.\n' +
                'Or, the failure might occur in the start node.';
        }
        list.shift();
        lines = this.buildNodeGraph(list);
        return lines.join('\n');
    };
    // default options
    Tracer.defaultOptions = {
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
    Tracer.VLINE_STYLES = [
        { color: 'yellow' },
        { color: 'magenta' },
        { color: 'blue' },
        { color: 'white' },
        { color: 'green' }
    ];
    return Tracer;
}());
exports.Tracer = Tracer;
//# sourceMappingURL=index.js.map