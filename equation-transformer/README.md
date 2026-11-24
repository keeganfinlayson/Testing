# Equation Transformer — Balance Studio v2.1

Testing build, November 24, 2026. Open index.html; the complete app and artwork are embedded, with no external runtime dependencies.

## x boxes

The tools dock contains x boxes, positive weights, and negative balloons. Click or hold to collect; drag onto a pan. Right-click the matching pool to return held objects. Keyboard Enter/Space picks up; Arrow Down returns. The collapsed Keyboard controls provide Place left/right buttons.

Menu → Set x value accepts a whole number from 1 through 30. Random chooses a new candidate; Use value applies it. All x boxes share the same value, including newly placed boxes. The contents remain visually hidden. Changing x is explicitly recorded as a setup change, and may tip the balance; it is not an equation-solving transformation. Undo restores the previous objects and x value. Reset restores the original example and its x value. Loading another equation uses that equation's solution as its initial physical x value.

Up to eight x boxes may be placed on each pan. Different object types cannot mix in the hand. Existing integer quantity grouping and zero-pair behavior are retained. Negative or fractional x values remain outside this build.

## Verification

Automated checks passed for 100 random x values, custom integer/range validation, x-source pointer drag/drop handlers, keyboard pickup, right-click return, mixed-type blocking, eight-box capacity, Undo and Reset including x values, and division-by-zero rejection. Existing exact parser, equation, and grouping checks passed. A local Chromium run was blocked by the execution environment; hosted UI inspection is performed separately.
