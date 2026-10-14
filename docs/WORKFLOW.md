# Workflow: тільки головні поняття

Файл [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) — YAML-опис автоматичного процесу. У ньому два jobs: `build` та `deploy`.

| Частина | Що означає у нашому проєкті |
| --- | --- |
| `on` | Запуск на push у main, PR до main або вручну |
| `jobs` | Окремі завдання workflow |
| `runs-on: ubuntu-latest` | GitHub надає runner із Ubuntu для виконання job |
| `steps` | Послідовність кроків усередині job |
| `uses` | Виклик готового action: checkout, setup-node або deploy-pages |
| `run` | Запуск команди на runner: npm ci, npm test, npm run build |
| `needs: build` | Deploy чекає успішного завершення build job |
| `if` | Тут дозволяє публікацію лише з main і виключає PR |

## CI — job build

1. `actions/checkout` отримує код цього запуску.
2. `actions/setup-node` готує Node.js 24.
3. `npm ci` встановлює залежності за `package-lock.json`.
4. `npm test` викликає `node --test` із `package.json`: 12 написаних для проєкту unit tests.
5. `npm run build` викликає Vite, який створює готові файли в `dist/`. Перед ним npm автоматично запускає `prebuild` для файлів детектора.
6. Для main налаштовується Pages та завантажується artifact із `dist/`.

Тести написані нами; Node.js лише надає механізм їх виконання. Вони використовують mock stream. Реальну камеру перевіряємо окремо у браузері.

## CD — job deploy

`needs: build` пов'язує два jobs. `actions/deploy-pages` бере підготовлений artifact і публікує сайт на GitHub Pages. Дозволи `pages: write`, `id-token: write` і `environment: github-pages` потрібні цьому механізму публікації.

## Що буде при помилці

Якщо `npm test` повертає ненульовий код завершення, його step та job build завершуються помилкою. Звичайні наступні steps пропускаються. Через `needs: build` job deploy теж пропускається. Попередні опубліковані файли залишаються доступними.

Успішні тести та build не гарантують відсутності всіх помилок. Вони перевіряють ті властивості, які ми заклали в тести, і здатність зібрати проєкт.

PR проходить CI, але не публікує сайт через `if`. CI сам по собі не забороняє натиснути Merge: для цього налаштовують required status checks. Основна гілка цього демо не має такого захисту.

## На доповіді достатньо цього

Покажи `on`, кроки CI, `needs` та action публікації. Кеш npm, права й concurrency можна не розбирати, якщо про них не запитають. Вони залишені як службові налаштування робочого workflow. `cancel-in-progress: false` не перериває активний запуск; це не гарантія, що кожен pending запуск буде виконаний.

[GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions) · [Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
