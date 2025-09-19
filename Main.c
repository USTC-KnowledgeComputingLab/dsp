#include <stdio.h>

#include "Absyn.h"
#include "Parser.h"

void _h2f_identity(Identity id) {
    printf("%s", id);
}

void _h2f_term(Term term) {
    // is_AddressOf, is_Indirection
    switch (term->kind) {
    case is_LogicalOr:
        printf("(op:LogicalOr ");
        _h2f_term(term->u.logicalOr_.term_1);
        printf(" ");
        _h2f_term(term->u.logicalOr_.term_2);
        printf(")");
        break;
    case is_LogicalAnd:
        printf("(op:LogicalAnd ");
        _h2f_term(term->u.logicalAnd_.term_1);
        printf(" ");
        _h2f_term(term->u.logicalAnd_.term_2);
        printf(")");
        break;
    case is_BitwiseInclusiveOr:
        printf("(op:BitwiseInclusiveOr ");
        _h2f_term(term->u.bitwiseInclusiveOr_.term_1);
        printf(" ");
        _h2f_term(term->u.bitwiseInclusiveOr_.term_2);
        printf(")");
        break;
    case is_BitwiseExclusiveOr:
        printf("(op:BitwiseExclusiveOr ");
        _h2f_term(term->u.bitwiseExclusiveOr_.term_1);
        printf(" ");
        _h2f_term(term->u.bitwiseExclusiveOr_.term_2);
        printf(")");
        break;
    case is_BitwiseAnd:
        printf("(op:BitwiseAnd ");
        _h2f_term(term->u.bitwiseAnd_.term_1);
        printf(" ");
        _h2f_term(term->u.bitwiseAnd_.term_2);
        printf(")");
        break;
    case is_Equality:
        printf("(op:Equality ");
        _h2f_term(term->u.equality_.term_1);
        printf(" ");
        _h2f_term(term->u.equality_.term_2);
        printf(")");
        break;
    case is_Inequality:
        printf("(op:Inequality ");
        _h2f_term(term->u.inequality_.term_1);
        printf(" ");
        _h2f_term(term->u.inequality_.term_2);
        printf(")");
        break;
    case is_LessThan:
        printf("(op:LessThan ");
        _h2f_term(term->u.lessThan_.term_1);
        printf(" ");
        _h2f_term(term->u.lessThan_.term_2);
        printf(")");
        break;
    case is_GreaterThan:
        printf("(op:GreaterThan ");
        _h2f_term(term->u.greaterThan_.term_1);
        printf(" ");
        _h2f_term(term->u.greaterThan_.term_2);
        printf(")");
        break;
    case is_LessThanOrEqualTo:
        printf("(op:LessThanOrEqualTo ");
        _h2f_term(term->u.lessThanOrEqualTo_.term_1);
        printf(" ");
        _h2f_term(term->u.lessThanOrEqualTo_.term_2);
        printf(")");
        break;
    case is_GreaterThanOrEqualTo:
        printf("(op:GreaterThanOrEqualTo ");
        _h2f_term(term->u.greaterThanOrEqualTo_.term_1);
        printf(" ");
        _h2f_term(term->u.greaterThanOrEqualTo_.term_2);
        printf(")");
        break;
    case is_LeftShift:
        printf("(op:LeftShift ");
        _h2f_term(term->u.leftShift_.term_1);
        printf(" ");
        _h2f_term(term->u.leftShift_.term_2);
        printf(")");
        break;
    case is_RightShift:
        printf("(op:RightShift ");
        _h2f_term(term->u.rightShift_.term_1);
        printf(" ");
        _h2f_term(term->u.rightShift_.term_2);
        printf(")");
        break;
    case is_Addition:
        printf("(op:Addition ");
        _h2f_term(term->u.addition_.term_1);
        printf(" ");
        _h2f_term(term->u.addition_.term_2);
        printf(")");
        break;
    case is_Subtraction:
        printf("(op:Subtraction ");
        _h2f_term(term->u.subtraction_.term_1);
        printf(" ");
        _h2f_term(term->u.subtraction_.term_2);
        printf(")");
        break;
    case is_Multiplication:
        printf("(op:Multiplication ");
        _h2f_term(term->u.multiplication_.term_1);
        printf(" ");
        _h2f_term(term->u.multiplication_.term_2);
        printf(")");
        break;
    case is_Division:
        printf("(op:Division ");
        _h2f_term(term->u.division_.term_1);
        printf(" ");
        _h2f_term(term->u.division_.term_2);
        printf(")");
        break;
    case is_Modulus:
        printf("(op:Modulus ");
        _h2f_term(term->u.modulus_.term_1);
        printf(" ");
        _h2f_term(term->u.modulus_.term_2);
        printf(")");
        break;
    case is_Complement:
        printf("(op:Complement ");
        _h2f_term(term->u.complement_.term_);
        printf(")");
        break;
    case is_LogicalNot:
        printf("(op:LogicalNot ");
        _h2f_term(term->u.logicalNot_.term_);
        printf(")");
        break;
    case is_UnaryNegation:
        printf("(op:UnaryNegation ");
        _h2f_term(term->u.unaryNegation_.term_);
        printf(")");
        break;
    case is_UnaryPlus:
        printf("(op:UnaryPlus ");
        _h2f_term(term->u.unaryPlus_.term_);
        printf(")");
        break;
    case is_AddressOf:
        printf("(op:AddressOf ");
        _h2f_term(term->u.addressOf_.term_);
        printf(")");
        break;
    case is_Indirection:
        printf("(op:Indirection ");
        _h2f_term(term->u.indirection_.term_);
        printf(")");
        break;
    case is_Item:
        printf("id:");
        _h2f_identity(term->u.item_.identity_);
        break;
    case is_TypedItem:
        printf("(type ");
        _h2f_identity(term->u.typedItem_.identity_1);
        printf(" ");
        _h2f_identity(term->u.typedItem_.identity_2);
        printf(")");
        break;
    case is_Variable:
        printf("`id:");
        _h2f_identity(term->u.variable_.identity_);
        break;
    case is_TypedVariable:
        printf("(type ");
        _h2f_identity(term->u.typedVariable_.identity_1);
        printf(" `id:");
        _h2f_identity(term->u.typedVariable_.identity_2);
        printf(")");
        break;
    case is_Function:
        printf("(func ");
        _h2f_term(term->u.function_.term_);
        for (ListTerm it = term->u.function_.listterm_; it; it = it->listterm_) {
            printf(" ");
            _h2f_term(it->term_);
        }
        printf(")");
        break;
    case is_Bracket:
        _h2f_term(term->u.bracket_.term_);
        break;
    default:
        printf("unknown");
    }
}

void _h2f_rule(Rule rule) {
    switch (rule->kind) {
    case is_ProperRule:
        for (ListTerm it = rule->u.properRule_.listterm_; it; it = it->listterm_) {
            _h2f_term(it->term_);
            printf("\n");
        }
        printf("----\n");
        _h2f_term(rule->u.properRule_.term_);
        break;
    case is_Fact:
        _h2f_term(rule->u.fact_.term_);
        break;
    }
    printf("\n");
}

void h2f() {
    Rule parse_tree = pRule(stdin);
    if (parse_tree) {
        _h2f_rule(parse_tree);
    }
}

int main() {
    h2f();
}
