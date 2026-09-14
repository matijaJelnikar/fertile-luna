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

Both files transcribe printed symbols, so neither is a reconstruction.

`vaja-16-mucus-evaluation.json` is the fixture worth having: its outcome is **marked by the workbook
itself** — a `V` over cycle day 15 and the marks `1 2 3` over days 16–18. The mucus row was aligned
against the "Dan cikla" row at two magnifications to correct for the page skew, and both alignments
agree. As a cross-check, the peak derived independently from `R-MUCUS-02` (the last day at the best
category reached) lands on day 15 too.

Its temperature row, cervix rows and "plodni dnevi" row are filled in on the page but are **not**
transcribed: the sheet is photographed at an angle and those columns were not verified to the same
standard.

`slika-6-mucus-sequence.json` carries the symbol sequence with **no expected peak**. `R-MUCUS-02`
would put it on day 8, but the figure marks no `V`, and filling in our own answer would cost the
fixture the one property that makes it worth having.

## Status

**The gap worth closing:** Vaja 16's temperature row and the workbook's **stated answer** for that
exercise — the helper line, the triangles and the `P/` day. That answer is the only outcome in the
whole reference that we would not have derived ourselves, which is exactly what makes it able to
catch a misreading of everything else. The solutions page is not among the photographed pages. See
`sensiplan-rule-capture` task 2.3.

`R-MUCUS-01`'s classification table is likewise uncaptured, so nothing here can test mapping an
observation onto a symbol — only reasoning over symbols already assigned.
