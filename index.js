import {
    InputStream,
    CommonTokenStream
} from "antlr4";
import DspLexer from "./DspLexer.js";
import DspParser from "./DspParser.js";
import DspVisitor from "./DspVisitor.js";

class Visitor extends DspVisitor {
    visitRule_pool(ctx) {
        return ctx.rule_().map(r => this.visit(r)).join("\n\n");
    }

    visitRule(ctx) {
        const result = ctx.term().map(t => this.visit(t));
        if (result.length === 1) {
            return result[0];
        } else {
            const conclusion = result.pop();
            const length = Math.max(...result.map(premise => premise.length));
            result.push("-".repeat(Math.max(length, 4)));
            result.push(conclusion);
            return result.join("\n");
        }
    }

    visitSymbol(ctx) {
        return ctx.SYMBOL().getText();
    }

    visitParentheses(ctx) {
        return this.visit(ctx.term());
    }

    visitSubscript(ctx) {
        return `(subscript ${ctx.term().map(t => this.visit(t)).join(" ")})`;
    }

    visitFunction(ctx) {
        return `(function ${ctx.term().map(t => this.visit(t)).join(" ")})`;
    }

    visitUnary(ctx) {
        return `(unary ${ctx.getChild(0).getText()} ${this.visit(ctx.term())})`;
    }

    visitBinary(ctx) {
        return `(binary ${ctx.getChild(1).getText()} ${this.visit(ctx.term(0))} ${this.visit(ctx.term(1))})`;
    }
}

export function parse(input) {
    const chars = new InputStream(input);
    const lexer = new DspLexer(chars);
    const tokens = new CommonTokenStream(lexer);
    const parser = new DspParser(tokens);
    const tree = parser.rule_pool();
    const visitor = new Visitor();
    return visitor.visit(tree);
}
