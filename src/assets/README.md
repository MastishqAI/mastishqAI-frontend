# Assets exported from Figma (file AkBLkNFleih5zNQC1QQUCy, page "Final Design")

## icons/ (70 SVG files)
All icons from the Figma "Icons" page, exported by name (`chevron-down.svg`, `thumbs-up.svg`, ...).
24px grid, 2px round stroke, `currentColor` so they take the text colour.
The same shapes are used in the app through `src/components/icons.jsx` (`Icon.chevronDown`, ...).
Each icon was checked against Figma with a checksum of its path data; all 70 matched.

## images/
| File | Figma node | Use |
|---|---|---|
| login-learner-3d.png | 2493:2537 (3D illustration, 560x560, blend: Multiply) | Login screen art (also copied to `public/`) |
| avatar-profile.jpg | 2094:12498 | Profile photo in the design (sample face, not shipped as a default) |
| avatar-nav.png | 1980:303 | Navigation avatar in the design (sample face) |
| avatar-sample.png | 2094:11670 | Small avatar in the design (sample face) |
| avatar-1..5.png | 2094:12194, 12158, 12167, 12176, 12185 | Leaderboard avatars in the design (sample faces) |

Avatars were reduced to 256px and the login art to 840px for the web. Re-export from Figma if you need the originals.

## public/badges/ (6 PNG, 192px)
Rookie, Skilled, Expert, Mastermind, Legend, King, from Figma nodes `I2094:13378`..`I2094:13383` (shown on Progress > Levels).
