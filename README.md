# DevOps Camera Demo

Навчальний вебзастосунок для доповіді про GitHub Actions. Користувач натискає кнопку, дозволяє доступ до камери й бачить відео. Зміна коду в `main` запускає тести, production build і публікацію у GitHub Pages.

## Локальний запуск у Windows / PowerShell

Потрібні Node.js **24.x** і Git. Команди виконуються у папці проєкту.

```powershell
node --version
git --version
npm ci
npm test
npm run dev
```

Відкрий адресу, яку надрукує Vite (зазвичай `http://localhost:5173/`). Якщо PowerShell блокує `npm.ps1`, використовуй `npm.cmd ci`, `npm.cmd test` і `npm.cmd run dev`.

Для перевірки production build зупини dev server через Ctrl+C:

```powershell
npm run build
npm run preview
```

`preview` лише локально віддає файли `dist/`. Для камери на опублікованому сайті потрібні HTTPS, під’єднаний пристрій і дозвіл браузера. Відео не передається на сервер і не записується. Детекцію облич до цієї версії не додано.

## Робота з цим репозиторієм

Репозиторій: [maryangemini/devops-demo](https://github.com/maryangemini/devops-demo).

Для роботи на своєму ПК клонуй його у **нову папку**, щоб отримати історію комітів і налаштований origin:

```powershell
git clone https://github.com/maryangemini/devops-demo.git
cd devops-demo
npm ci
npm test
npm run dev
```

Якщо вже маєш цю папку після clone, відкрий її й виконай `git pull`. Не ініціалізуй повторно Git у старій розпакованій копії: простіше почати з clone.

## Увімкнення GitHub Pages

1. Відкрий [Settings → Pages](https://github.com/maryangemini/devops-demo/settings/pages).
2. У `Build and deployment` → `Source` вибери **GitHub Actions**.
3. У [Actions](https://github.com/maryangemini/devops-demo/actions) відкрий workflow `Camera Demo CI/CD`. Якщо перший запуск завершився помилкою на Configure GitHub Pages, після налаштування Source натисни **Re-run all jobs**.
4. Дочекайся успішних jobs `Test and build` і `Deploy to GitHub Pages`.
5. Адреса сайту після успішної публікації: `https://maryangemini.github.io/devops-demo/`.

Для наступних змін виконай звичайні `git add`, `git commit` і `git push`. Авторизація на ПК відбувається через Git Credential Manager. Якщо Git просить автора комітів, налаштуй свої `user.name` і `user.email`.

## Що вже налаштовано

- `push` у `main`: тести, build, upload artifact, deployment.
- Pull request у `main`: тести та build без публікації сайту.
- `workflow_dispatch`: ручний запуск workflow з вкладки Actions.
- `needs: build`: deploy чекає успішних тестів і build.
- `package-lock.json` та `npm ci`: встановлення за lockfile.
- `pages: write` та `id-token: write`: лише у deploy job.
- `base: './'`: відносні шляхи assets працюють із різними назвами репозиторію.

## Тести

`npm test` використовує вбудований Node.js test runner. Перевіряються звільнення всіх tracks, повторний Stop, запуск, відмова в дозволі з повторною спробою, скасування запиту, повторний Start, помилка playback та від’єднання камери.

Це unit tests із mock stream. Вони не підтверджують доступ до реального пристрою. Окремо перевір кнопку, дозволи, відео та Stop у своєму браузері.

## Підготовка показу

[Сценарій на 3–4 хвилини](docs/DEMO.md) пояснює оновлення Version 1.0 → 2.0 і безпечний показ тесту, що падає. [Розбір YAML](docs/WORKFLOW.md) пояснює workflow та відмінності від скорочених фрагментів презентації.

## Основні файли

| Файл | Призначення |
| --- | --- |
| `src/main.js` | Інтерфейс, VERSION, повідомлення користувачу |
| `src/camera.js` | Життєвий цикл відеопотоку |
| `src/style.css` | Оформлення |
| `test/camera.test.js` | Unit tests |
| `.github/workflows/deploy.yml` | CI/CD |
| `vite.config.js` | Шляхи production assets |

## Документація

- [GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions)
- [Custom workflows for Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Vite deployment](https://vite.dev/guide/static-deploy)
- [Vite relative base](https://vite.dev/guide/build#relative-base)
- [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

Версії actions записано через major tags для читабельності навчального прикладу. У production їх можна закріпити на перевірених повних commit SHA.
