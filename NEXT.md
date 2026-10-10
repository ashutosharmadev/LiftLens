# Next session — ONE task

**M3 — Design the browser app's flow and sign-in**
Decide how the React app moves through sign in → capture/upload → pose overlay preview → measurements + score explanation → save → history chart, and how it signs in with Cognito (library and SRP). Design first; then build the sign-in screen against the live user pool.

Also open from M2:
- Decide whether to keep USER_PASSWORD_AUTH on the app client once the browser uses SRP (BACKLOG).
- Confirm models.ts works in a real browser and that the segmenter's person value is 0.

Done when: the flow and sign-in approach are agreed and you can sign in to the local app with your LiftLens account.

## End of every milestone
- Update README.md: status table, architecture diagram (solid = built, dashed = planned), key decisions.
- Update docs/project-story.md: new actions, results and every real error hit (problem, cause, fix, lesson).
- Commit, add one line to LOG.md, set the next single task here.
