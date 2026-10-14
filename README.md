# GitHub Actions: від зміни коду до оновлення сайту

Навчальний приклад для тезисної доповіді на 15 хвилин. Сайт показує відео з камери та просту детекцію облич. GitHub Actions автоматично запускає тести, збирає сайт і публікує зміни на GitHub Pages.

**[Відкрити сайт](https://maryangemini.github.io/devops-demo/)** · **[Запуски Actions](https://github.com/maryangemini/devops-demo/actions)** · **[Що показувати на кожному слайді](docs/DEMO.md)**

## Головна демонстрація

1. Показати опубліковану **Version 3.0**.
2. Через редактор GitHub змінити в `src/main.js` лише `const VERSION = '3.0';` на `const VERSION = '3.1';` і зробити commit у `main`.
3. Відкрити новий запуск Actions: **Run tests → Build website → Deploy to GitHub Pages**.
4. Після успішного deploy оновити ту саму адресу сайту й показати **Version 3.1**.

Термінал і VS Code для цього показу не потрібні. Якщо вже репетирував, використай наступне значення VERSION: головне, щоб було видно зміну.

## Файли, які показуємо на доповіді

| Файл | Що пояснити |
| --- | --- |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | `on`, два jobs, команди CI, `needs: build`, публікація |
| [`package.json`](package.json) | `npm test` викликає `node --test`; build викликає Vite |
| [`src/camera.js`](src/camera.js) | Перша функція `stopCamera` зупиняє потік і очищує відео |
| [`test/camera.test.js`](test/camera.test.js) | Перший тест перевіряє поведінку Stop |
| [`src/main.js`](src/main.js) | Один рядок VERSION для живого показу деплою |

## Що автоматизовано

- **Push у main:** встановлення залежностей → 12 unit tests → build → публікація.
- **Pull request у main:** ті самі тести та build, без публікації.
- **Помилка тесту:** наступний крок build і залежний deploy пропускаються; попередня опублікована версія працює далі.
- **`needs: build`:** deploy залежить від успіху job build.
- **Artifact:** передає готову папку `dist/` із job build у deployment.

Готовий приклад невдалої перевірки — [чернетковий PR №1](https://github.com/maryangemini/devops-demo/pull/1) із гілки `demo/failing-test`. [Відкрити червоний запуск](https://github.com/maryangemini/devops-demo/actions/runs/38593617284). Він призначений для показу логів; не зливай його в main. Інструкція: [docs/DEMO.md](docs/DEMO.md).

## Де наш сервер

GitHub Pages — хостинг статичного сайту. Після deploy він віддає нові HTML, JavaScript, CSS, WASM і модель за тією самою HTTPS-адресою. Runner є тимчасовим середовищем для команд CI, а не сервером сайту. Камера та детекція працюють у браузері; застосунок не завантажує відео на сервер.

## Локальний запуск — за потреби

Потрібні Node.js 24.x і Git. Команди виконуються всередині папки `devops-demo`:

```sh
git clone https://github.com/maryangemini/devops-demo.git
cd devops-demo
npm ci
npm test
npm run dev
```

Відкрий адресу з термінала. `npm run build` створює `dist/`; `npm run preview` показує цю збірку локально. Перед dev/build скрипт готує файли MediaPipe, тому для першого запуску потрібен інтернет. У PowerShell за потреби використовуй `npm.cmd` замість `npm`.

## Перед виступом

Перевір доступ до GitHub, інтернет, камеру та дозвіл браузера на тому ПК, з якого показуватимеш. Відкрий презентацію, сайт, редактор VERSION, workflow і заготовлений невдалий запуск. Зроби запис успішного оновлення як запасний варіант при повільній мережі.

[Короткий розбір workflow](docs/WORKFLOW.md) · [GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions) · [Публікація через Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
