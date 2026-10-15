# veHELLitle

A standalone, independently written sequence-guessing game inspired by the general Wordle/Mastermind genre. No code from Verityle is included.

## Try it

Open `index.html` in a modern browser. For GitHub Pages, upload the files to the root of a repository, then go to Settings > Pages > Deploy from a branch > main > /(root).

## Add characters

Edit `stuff.js` and add entries:

```js
{ NAME: 'Character Name', IMAGE: 'images/character.png' },
```

Put the matching images in `images/`. The four provided characters all use the blank white placeholder. Each side panel automatically displays half the choices. Only the first 4 / 8 / 16 / 24 entries are used for Classic / Hard / Insane / Nightmare respectively; add more characters to activate harder modes fully.

## Controls

Click character portraits to build a sequence, Backspace to undo, and Submit/Enter to check. Reset Current starts the **same** answer again, New Round makes a different answer, and changing the mode changes the sequence length and attempts. There are no saved scores or daily puzzles in v0.1.

Voice uses the browser Web Speech API. It is softened with reduced pitch, speed, and volume, but real whispered speech depends on the available system voices. Chrome/Edge usually support speech synthesis. Clicks are required to initiate sound, and the voice can be turned off.

## Credits and scope

This is an unofficial original fan-game project. Provide or create your own character assets before publication, and avoid implying endorsement by another site's owners.
