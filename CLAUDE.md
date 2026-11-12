# my-apps

Static site (one self-contained HTML file per app), deployed by Vercel from `main`.

## Adding an app

Every new app gets a row in `index.html`, placed in one of the two sections:

- **ゲーム** — anything you play (single-player, 2-player 対戦/協力). Tag it `1人`, `2人対戦` or `2人協力`.
- **クリエイティビティ** — tools for making or using something (wallpaper maker, read-aloud pad, scoreboard, etc.).

Rows are `<li>` cards inside a `<ul class="grid">`. In ゲーム, put the card in the sub-group matching its tag and give the `<li>` a `data-tag="1人"` / `"2人対戦"` / `"2人協力"` (this drives the filter chips and counts). クリエイティビティ cards have no `data-tag`. Copy an existing card's markup (`.ic` icon, `.name`, `.desc`); search, counts and filters pick it up automatically.

Each app page links back to `/` with `← アプリ一覧` in its header.
