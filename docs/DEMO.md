# Сценарій демонстрації

## Перед доповіддю

- Переконайся, що опублікований сайт показує **Version 1.0**.
- Перевір камеру на тому самому ПК і в тому самому браузері, що використовуватимеш на показі.
- Відкрий редактор із `src/main.js`, GitHub Actions і сайт у трьох вкладках/вікнах.
- Зроби реальний короткий запис успішного deployment на випадок повільної мережі під час виступу.
- Завершуй демонстраційні зміни з версією 1.0 перед виступом, якщо хочеш показати перехід саме 1.0 → 2.0.

## 1. Початкова версія, 30 секунд

На сайті покажи Version 1.0. Натисни «Увімкнути камеру», підтвердь дозвіл і покажи «Зупинити».

Фраза для пояснення: «GitHub Pages віддає frontend. Камеру відкриває браузер на моєму комп’ютері».

## 2. Зміна коду, 30 секунд

У `src/main.js` зміни:

```javascript
const VERSION = '1.0';
```

на:

```javascript
const VERSION = '2.0';
```

Потім у PowerShell:

```powershell
git add src/main.js
git commit -m "Show deployment version 2.0"
git push
```

## 3. Workflow, 1–2 хвилини

Відкрий новий run у Actions. Покажи, що він стосується щойно створеного commit.

1. Checkout source: код потрапив на runner.
2. Set up Node.js: підготовлено Node 24.
3. Install locked dependencies: `npm ci`.
4. Test camera lifecycle: **7 тестів**.
5. Build website: створено `dist/`.
6. Upload website artifact: артефакт містить готові файли.
7. Deploy to GitHub Pages: окремий job із `needs: build`.

Питання аудиторії: «Чи почнеться deploy, якщо тест поверне помилку?»

## 4. Результат, 30 секунд

Онови той самий сайт. Покажи **Version 2.0**. Увімкни камеру повторно.

Фраза: «Я змінив код і виконав push. Решту процесу виконав workflow».

## Додатковий показ: тест не пройшов

Підготуйся до цього заздалегідь. Додатковий показ займає ще 2–3 хвилини.

Створи **новий тимчасовий** файл `test/failing-demo.test.js`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';

test('Intentional failure for the presentation', () => {
  assert.fail('Demo: stop deployment when a test fails');
});
```

Запусти `npm test`: команда має завершитися невдало. Потім:

```powershell
git add test/failing-demo.test.js
git commit -m "Demo: show failed test blocking deployment"
git push
```

В Actions покажи помилку тесту та пропущений deploy. Сайт продовжує показувати попередню версію.

Для завершення демонстрації видали **лише створений тимчасовий файл**:

```powershell
Remove-Item test/failing-demo.test.js
git add test/failing-demo.test.js
git commit -m "Remove intentional demo failure"
git push
```

Переконайся, що наступний run успішний. Не залишай навмисну помилку в main.

## Типові питання викладача

| Питання | Відповідь |
| --- | --- |
| Де виконується YAML? | На runner, який GitHub надає для job. |
| Runner є нашим вебсервером? | Він виконує команди job. Сайт віддає GitHub Pages. |
| Навіщо artifact? | Jobs мають окремі файлові середовища. Він передає готовий dist/. |
| Чому npm ci? | Встановлює за lockfile та завершується помилкою при неузгоджених manifests. |
| Чому PR не змінює сайт? | Умови if обмежують deployment гілкою main і виключають pull_request. |
| Успішний build гарантує роботу камери? | Потрібна також перевірка пристрою, HTTPS і дозволів у браузері. |
| Чому немає SSH-ключа? | Pages використовує GITHUB_TOKEN/OIDC через офіційні actions. |
