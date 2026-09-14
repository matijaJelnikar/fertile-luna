# Rule fixtures

Worked examples from the Sensiplan workbook, held as **data, not engine-shaped code**, so the
Flutter rewrite at `../fertile_luna` reads the same files without transformation
(`sensiplan-rule-capture` tasks 2.4, 2.5).

Each file names the anchor in `openspec/reference/sensiplan-rules.md` it exercises, cites its source
figure, and carries the outcome **the book itself marks** — not an outcome we computed. That is the
whole point: a test written from a misreading of the book passes, so the only inputs worth having are
ones whose answers we did not derive.

## Why there are no temperature fixtures here

Slika 8, 9 and 10 illustrate the three temperature rules, and they were transcribed and then removed
again. The reason is the paragraph above.

Those figures print **no temperature axis and no values** — only a grid, a drawn helper line, the
countdown `6 5 4 3 2 1`, and triangles over the values the method counts. So a fixture built from
them cannot be a transcription; it can only be a reconstruction, with numbers chosen by us to satisfy
the structure we read. Its expected outcome then follows from our own construction rather than from
the book, and a misreading of the rule would produce a fixture that confirms the misreading. That is
precisely the circularity these files exist to avoid, so they do not belong here.

What the three figures *do* establish is recorded as prose in the reference, under **Worked
examples** — including the one detail the rule text leaves implicit, that the second exception's
window is four calendar days holding three counted values, which is visible only by counting
triangles on Slika 10.

The engine's own unit tests are the right home for cases built from that prose. They are ordinary
tests of our reading, and they should not borrow the book's authority by living in this directory.

## What is here

`vaja-16-mucus-evaluation.json` is the fixture worth having, and since the workbook's **Rešitev**
page (book p. 87) was captured it now carries an answer the book states rather than one we derived:
fertility from day 1 because this is a first observed cycle, and day 5's temperature bracketed as
disturbed. Its mucus row, the `V` on day 15 and the marks `1 2 3` on days 16–18 are printed on the
exercise sheet.

Two things it does **not** carry, on purpose:

- **No temperature evaluation.** The answer draws no helper line, no triangles and no `P/`, because
  the exercise asks only about the start of the cycle. Supplying one from our own reading would
  destroy the property that makes the file worth having.
- **Exact temperatures.** They are read off the printed axis to the nearest 0.05 °C and are marked
  `approximate` in the file. The shape is reliable — day 5 spikes to about 37.0 against a run of
  36.4–36.5 — and that shape is the point: an engine that fails to exclude day 5 builds its helper
  line on a value the book explicitly brackets.

`r-mucus-02-individually-best.json` holds the two sequences the handbook prints side by side, whose
peaks sit at different symbols. It is what stops an engine from waiting for `S⁺` before it will name
a peak.

`slika-6-mucus-sequence.json` carries a symbol sequence with **no expected peak**. `R-MUCUS-02` would
put it on day 8, but the figure marks no `V`, and filling in our own answer would cost the fixture
the one property that makes it worth having.

## Status

The mucus rules are now checked against the book rather than only read from it: classifying Vaja 16's
own observation rows through the `R-MUCUS-01` table reproduces all fourteen of that exercise's
printed symbols, including three days that only the wet-sensation short-circuit explains.

**The gap that remains:** no captured exercise states a *temperature* answer. `R-TEMP-01`…`R-TEMP-04`
and `R-COMBI-01` rest entirely on our reading of the prose, and nothing here can catch a misreading
of them. An exercise whose solution draws a helper line, triangles and a `P/` day is the thing to
capture next — see `sensiplan-rule-capture` task 2.3.
