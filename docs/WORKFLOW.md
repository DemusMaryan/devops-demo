# Розбір workflow

`deploy.yml` містить два jobs: `build` і `deploy`.

## Запуск

- `push.branches: [main]` реагує на push у main.
- `pull_request.branches: [main]` перевіряє PR, базова гілка якого main.
- `workflow_dispatch` дозволяє ручний запуск. Workflow має бути у default branch, щоб GitHub показав відповідну кнопку.

Якщо замінити фільтр push на develop, автоматичний запуск для main зникне. Окрема умова deploy все одно дозволяє публікацію лише з main: для свідомого перенесення deployment потрібно узгодити обидві умови та політику environment.

## Build job

Steps виконуються послідовно. `uses` викликає готовий action, `run` запускає команду.

1. `checkout` отримує код.
2. `setup-node` готує Node.js 24 та кеш завантажень npm. Кеш не замінює `npm ci`.
3. `npm ci` встановлює залежності за package-lock.json.
4. `npm test` запускає Node test runner.
5. `npm run build` збирає frontend.
6. `configure-pages` читає налаштування Pages; Source треба попередньо встановити вручну.
7. `upload-pages-artifact` пакує dist/ для deployment.

Останні два steps виконуються лише для main і не для pull request. Build має `contents: read` для коду та `pages: read` для метаданих Pages.

## Deploy job

- `needs: build` створює залежність від успішного build job.
- `if` виключає pull requests та інші гілки.
- `pages: write` дозволяє deployment у Pages.
- `id-token: write` дозволяє отримати OIDC-токен.
- `environment: github-pages` використовує відповідне середовище deployment.
- `deploy-pages` публікує артефакт, підготовлений build job.

Без `needs` jobs незалежні. Якщо Test або Build падає, звичайні наступні steps пропускаються, а deploy також пропускається. Тут немає `continue-on-error` та `if: always()`, які могли б змінити цю поведінку.

## Concurrency

Для однієї гілки workflow використовують спільну групу. `cancel-in-progress: false` не перериває вже активний run. GitHub може замінити pending run новішим, тож це не гарантує виконання кожного commit у черзі.

## Відмінності від скорочених слайдів

- Додано перевірку pull requests без deployment.
- Права розділено між jobs.
- Для цього односторінкового застосунку `base: './'` використовує відносні URL замість фіксованого `/devops-demo/`. Назву repo можна змінити без редагування base.

## Важливі межі перевірки

Unit tests використовують mock stream. Вони перевіряють логіку, але не фізичну камеру. До виступу протестуй реальні дозволи та відео на своєму ПК.

Офіційні довідки: [workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/), [Vite relative base](https://vite.dev/guide/build#relative-base).
