# Аудит багів (жовтень 2026)

Відсортовано від найгірших до дрібних. Кожен пункт перевірено по коду на конкретному сценарії. Зовсім дрібниці (стиль, типи) не включено.

Рівні: 🔴 Критичний · 🟠 Високий · 🟡 Середній · ⚪ Низький

---

## 🔴 Критичні

### 1. Можна писати коментарі, відгуки, закладки й прогрес від імені будь-якого користувача
- **Де:** `src/collections/ChapterComment.ts:90`, `src/collections/Reviews.ts:93`, `src/collections/Bookmarks.ts:61`, `src/collections/ReadProgress.ts:77`
- **Суть:** у `beforeChange` перевірка перевернута:
  ```ts
  if (data.user && !checkRole(['admin'], user)) return data
  ```
  Коли не-адмін **сам передає** `user`, значення зберігається як є. Підміна на `req.user.id` відбувається, лише коли `user` не передано. Клієнт (`comment-input.tsx:43`, `review-input.tsx:60`) і так шле `user` у тілі.
- **Сценарій:** ID усіх користувачів публічні (`Users.read: anyone`). Звичайний користувач робить `POST /api/chapterComments {user: "<id адміна>", ...}` і отримує коментар від імені адміна з бейджем «Адміністратор». Сповіщення про відповідь розсилаються з ніком адміна. Через `POST /api/reviews` з різними чужими `user` можна обійти унікальність (user, book) і накрутити `averageRating` будь-якої книги. PATCH власного запису з `user: <жертва>` «дарує» його іншій людині. Зворотний бік: адмін, який редагує чужий запис, перезаписує автора на себе.
- **Виправлення:** на create для не-адміна завжди ставити `user = req.user.id`. На update зберігати `originalDoc.user`. На поле `user` додати field access `create/update: admins`.

---

## 🟠 Високі

### 2. Збережений XSS у пошуку (Algolia)
- **Де:** `src/components/search-dialog.tsx:116-117, 366-367, 417-418` (`dangerouslySetInnerHTML`), `stripHTML` на рядках 60-66
- **Суть:** якщо в назві немає збігу, рендериться сирий `hit.title`. Algolia не екранує HTML у `_highlightResult`. `stripHTML` робить `innerHTML = html` на div, тож `<img onerror>` спрацьовує і там.
- **Сценарій:** writer називає книгу `Дракон <img src=x onerror=...>`. Кожен, хто шукає «Дракон», виконує цей JS, адмін теж. Від імені адміна можна, наприклад, змінити ролі.
- **Виправлення:** задати свої `highlightPreTag`/`highlightPostTag` (маркери), екранувати весь рядок і лише потім замінити маркери на `<mark>`. Опис рендерити як текст. `stripHTML` переписати через `DOMParser` або regex.

### 3. Акаунт можна захопити ще до реєстрації (Google-вхід прив'язується за email)
- **Де:** `src/lib/auth/strategy.ts:68-82, 118, 160`, `src/collections/Users.ts` (`create: anyone`, без `verify`)
- **Сценарій:** атакувальник реєструє `victim@gmail.com` з паролем; пошта не підтверджується. Пізніше жертва входить через Google: стратегія знаходить користувача за email і прив'язує Google до вже існуючого акаунта. Жертва працює в акаунті, від якого атакувальник знає пароль. Той самий результат дає зміна власного email на адресу жертви через `PATCH /api/users/:id`.
- **Виправлення:** не прив'язувати автоматично акаунт із паролем, у якого немає Google-стратегії; або при першій прив'язці скидати пароль і сесії. Увімкнути `auth.verify`. Зміну email робити лише з підтвердженням.

### 4. Будь-хто залогінений може розблокувати будь-який акаунт: `maxLoginAttempts` не працює
- **Де:** `src/collections/Users.ts:64-70`, в `access` немає `unlock`
- **Суть:** дефолтний `unlock` у Payload пускає будь-якого користувача колекції.
- **Сценарій:** атакувальник підбирає пароль адміна по 5 спроб і після кожного блокування робить зі свого акаунта `POST /api/users/unlock {email: "admin@..."}`.
- **Виправлення:** `access.unlock: admins`.

### 5. «Застосувати» в глобальній заміні виконує параметри, яких ніхто не бачив
- **Де:** `src/components/chapter-replace.tsx:44-55, 177`
- **Сценарій:** редактор шукає `foo`, натискає «Переглянути» і бачить 3 збіги. Потім змінює поле на `.` або вмикає regex. «Застосувати» лишається активною, діалог підтвердження показує старі «3 збіги». `run(false)` бере **поточні** поля і незворотно переписує всі розділи книги.
- **Виправлення:** при будь-якій зміні полів чи перемикачів робити `setPreview(null)`; або запам'ятовувати параметри превʼю і застосовувати саме їх.

---

## 🟡 Середні

### 6. Підробка `createdAt` обходить віковий бар'єр і погодинний ліміт завантажень
- **Де:** `src/collections/hooks/enforceUserUploadLimits.ts:97, 150-158`
- **Суть:** `createdAt` не захищений field access, а Mongo-адаптер ставить його лише тоді, коли поле порожнє.
- **Сценарій:** `POST /api/users {..., createdAt: "2000-01-01"}` дає новому акаунту «вік» понад 30 днів. Завантаження з `createdAt` у минулому не рахуються в ліміті «за годину», тож файли можна заливати без кінця.
- **Виправлення:** на create для не-адмінів примусово ставити `createdAt = now`: `users`, `user-uploads`, `media`, `readProgress`.

### 7. Власник сповіщення може переадресувати його іншому користувачу з фішинговим посиланням
- **Де:** `src/collections/Notifications.ts:15, 24`
- **Сценарій:** `PATCH /api/notifications/<своє> {user: "<жертва>", title: "Підтвердіть акаунт", link: "https://evil..."}`. У жертви з'являється «системне» сповіщення.
- **Виправлення:** не-адмінам дозволяти змінювати лише `read`.

### 8. Чернетки постів і сторінок бачить будь-який залогінений
- **Де:** `src/collections/Post.ts:36`, `src/collections/Pages.ts:32`, бо `readVersions` не заданий
- **Сценарій:** свіжий акаунт робить `GET /api/posts/versions` і отримує всі неопубліковані чернетки.
- **Виправлення:** `access.readVersions: admins`.

### 9. Writer може вручну виставити рейтинг і лічильники своєї книги
- **Де:** `src/collections/Book.ts:303-326` (`chapterCount`, `averageRating`, `totalReviews` мають лише `admin.readOnly`)
- **Сценарій:** `PATCH /api/books/<своя> {averageRating: 5, totalReviews: 9999}`.
- **Виправлення:** field access `create/update: () => false`. Хуки пишуть через Local API, тож це їх не зачепить.

### 10. Slug книги не унікальний: можна перехопити URL чужої книги
- **Де:** `src/collections/Book.ts:302` (`slugField()` без `unique`), `src/queries/index.ts:11-20` (`limit: 1`)
- **Сценарій:** writer ставить своїй книзі slug популярного перекладу, і `/novel/<slug>` (а також FB2) може віддати його книгу або змішати розділи.
- **Виправлення:** `unique: true`. Не-адмінам не давати редагувати slug вручну.

### 11. Немає унікальності (user, book) у `readProgress`: дублікати і накрутка «Набувають популярності»
- **Де:** `src/collections/ReadProgress.ts:28`, `src/hooks/useReadProgress.ts:73-97`, агрегація в `src/app/(frontend)/page.tsx:31-32` (`$sum: 1`)
- **Сценарій:** дві вкладки або швидка навігація створюють два документи; `limit=1` без сортування бере довільний із них. Один акаунт може N разів зробити POST і підняти книгу на перше місце.
- **Виправлення:** унікальний індекс `['user', 'book']` і upsert; в агрегації рахувати унікальних `user`.

### 12. Open redirect: після входу паролем і в `/next/exit-preview`
- **Де:** `src/components/login-form.tsx:23, 50` (`router.push(redirect)` без перевірки); `src/lib/preview.ts:5-6` (`isSafePreviewPath` пропускає `/\evil.com` і `/%09/evil.com`)
- **Сценарій:** `/login?redirect=https://wuji-login.evil/` після справжнього входу відправляє на фішинг. `/next/exit-preview?path=/%5Cevil.com` працює без авторизації.
- **Виправлення:** одна спільна функція: `new URL(path, base)`, перевірка `origin === base`, відхиляти `\` і керівні символи. Використати її і в логіні, і в превʼю (у Google-входу вже є `sanitizeRedirect`).

### 13. `generateMetadata` падає на неіснуючій книзі чи розділі: 500 замість 404
- **Де:** `src/app/(frontend)/novel/[slug]/page.tsx:62` (`book.genres` при `book === null`), `src/app/(frontend)/novel/[slug]/[page]/page.tsx:52` (`chapter.book`)
- **Сценарій:** старе посилання або `/novel/x/99999` дає сторінку помилки, і Google бачить 500.
- **Виправлення:** `if (!book) return {}` (так само для розділу) на початку `generateMetadata`.

### 14. `/redirect/novel/[id]` дає 500 для видаленого розділу
- **Де:** `src/app/(frontend)/redirect/novel/[id]/page.tsx:19-29`
- **Суть:** `findByID` кидає NotFound, тож `if (!chapter) notFound()` ніколи не спрацьовує. Для розділу-сироти падає `chapter.book.slug`. Сюди ведуть сповіщення й «Оновлені розділи».
- **Виправлення:** `disableErrors: true` + перевірка `!chapter.book`.

### 15. Номер сторінки не валідується
- **Де:** `src/app/(frontend)/novel/[slug]/[page]/page.tsx:25, 34`, `src/app/(frontend)/blog/page.tsx:106`
- **Сценарій:** `/novel/x/abc` показує «Розділ NaN», ламає ‹/› і зберігає прогрес з `NaN`. `/novel/x/-1`, найімовірніше, дає 500 через від'ємний skip.
- **Виправлення:** `if (!Number.isInteger(n) || n < 1) notFound()`.

### 16. Сторінка `/novel/[slug]/editor`: падіння на `(` і важкий запит для анонімів
- **Де:** `src/app/(frontend)/novel/[slug]/editor/page.tsx:113` (`new RegExp(search)` без екранування), `:26-55`
- **Сценарій:** `?search=(` дає SyntaxError і 500. Пошук доступний будь-кому і тягне **всі** розділи книги (`limit: 0`, depth 2). Кілька запитів до великої книги помітно навантажують сервер.
- **Виправлення:** `escapeRegExp` з `src/lib/textReplace.ts`; пошук лише при `canEdit`; `depth: 0` + `select`.

### 17. Сесія, що спливла, не помічається: прогрес мовчки не зберігається
- **Де:** `src/components/TokenRefresh.tsx:57, 70`, `src/providers/auth/index.tsx:134-141, 170-200`, `src/hooks/useReadProgress.ts:73-97`
- **Сценарій:** refresh провалився (5 спроб) або токен уже протермінований, але `user` лишається заповненим. POST/PATCH `/api/readProgress` отримує 403, `res.ok` ніде не перевіряється. `SessionExpiredDialog` перевіряє лише перший `/me`, тож діалог не з'являється.
- **Виправлення:** після остаточного провалу refresh викликати `/me` → `setUser(null)`. Діалог показувати при переході user→null без явного logout. У `saveProgress` обробляти 401/403.

### 18. Збій першого `/me` назавжди лишає `user === undefined`
- **Де:** `src/providers/auth/index.tsx:170-182`
- **Сценарій:** мережа на мить пропала. `ContinueTile` вічно показує скелетон, прогрес пишеться лише локально, refresh не працює.
- **Виправлення:** ретрай з backoff та на `online`/`visibilitychange`.

### 19. AutoResume перекидає на останній розділ при кліку на логотип і використовує чужий/старий прогрес
- **Де:** `src/components/AutoResumeHandler.tsx:451-495`
- **Сценарій (а):** сесія почалась з `/novel/x` (посилання з Telegram). Клік по логотипу на `/` редіректить у читалку. Перевірки `initial-path === '/'` (яка є в `useLastReadPage`) тут немає.
- **Сценарій (б):** поки `user === undefined`, береться localStorage. Серверний (новіший) прогрес ігнорується; після зміни акаунта в тому ж браузері веде на книгу попереднього користувача.
- **Виправлення:** чекати `user !== undefined`, перевіряти initial-path, брати новіший із двох записів.

### 20. SnowProvider перемонтовує весь застосунок після гідрації
- **Де:** `src/providers/SnowProvider.tsx:258-279`
- **Суть:** перший рендер повертає `<>{children}</>`, після ефекту `<SnowContext.Provider>`. Корінь міняє тип, тож усе піддерево перемонтовується: ефекти й запити сторінки (`saveProgress`, фетчі) виконуються двічі. На першому рендері `useSnow()` без провайдера кидає помилку (`settings/page.tsx:421`, `SnowEffect.tsx:8`).
- **Виправлення:** завжди рендерити Provider, умовним лишити тільки `<Snowfall>`.

### 21. Збільшене зображення в режимі «Сторінки» відкривається під читалкою
- **Де:** `src/components/ZoomableImage.tsx:356` (`z-[100]`) проти `page.client.tsx:136` (читалка `z-[200]`)
- **Сценарій:** десктоп, клік по картинці: вона зникає, body блокується, закрити можна лише через Esc.
- **Виправлення:** підняти z-index оверлея вище 300.

### 22. `?disableSaving=true` не діє на `last-read-page`
- **Де:** `src/components/LastReadPageProvider.tsx:549-562`
- **Сценарій:** перехід з коментаря чи сповіщення через 1 с записує цей розділ як останній прочитаний. Автопродовження потім веде не туди, а `title` книги затирається на `undefined`.
- **Виправлення:** пропускати збереження при `disableSaving`; краще писати лише через `useReadProgress`.

### 23. Каталог падає білим екраном, коли API повертає помилку
- **Де:** `src/components/catalog/BookCatalog.tsx:23, 395, 417`
- **Суть:** `fetcher` не перевіряє `res.ok`, тож `{errors}` потрапляє в `data`, і `books.docs.length` кидає TypeError (на 429/5xx або при невалідному фільтрі).
- **Виправлення:** `if (!res.ok) throw` у fetcher, плюс `books?.docs ?? []`.

### 24. Відповідь на вкладений коментар «зникає»
- **Де:** `src/components/comments.tsx:229-249, 315`
- **Сценарій:** відповідь на коментар 2-го рівня без відповідей не видна до перезавантаження, бо ревалідується лише top-level ключ. Лічильник «Показати N» застаріває.
- **Виправлення:** передавати вниз `mutateReplies` батька або робити глобальний `mutate` за ключами `/api/chapterComments`.

### 25. Після видалення відгуку не можна написати новий без перезавантаження
- **Де:** `src/components/reviews.tsx:209, 351-363`, бо `mutateUserReview` не викликається
- **Виправлення:** після видалення ревалідувати і `userReview`. Заодно: якщо `page > totalPages`, ставити `setPage(totalPages)`, бо інакше на останній сторінці показується «Станьте першим».

### 26. Сповіщення пропускаються при «Завантажити ще» у фільтрі «Непрочитані»
- **Де:** `src/app/(frontend)/notifications/page.tsx:253-260, 288-297`
- **Сценарій:** 40 непрочитаних, відкрив 3 з першої сторінки, тож офсет зсунувся. Page 2 пропускає 3 сповіщення назавжди.
- **Виправлення:** курсорна пагінація (`createdAt < останнього`).

---

## ⚪ Низькі

27. **Скарги: редактор/writer може змінити `user`/`book`/`chapter`.** Так довільному користувачу йде сповіщення з довільним текстом. Також не перевіряється, що chapter належить book. `src/collections/Complaints.ts:26, 74, 87`.
28. **Перенесення розділу чи відгуку в іншу книгу не перераховує стару.** `recountChapters.ts:40` виходить при кожному update; `updateRating.ts:28-33` так само. Порівнювати `previousDoc.book` з `doc.book`.
29. **`deleteOldUserUploads` видаляє файли, які ще використовуються.** Обмін аватара і банера місцями видаляє обидва. `src/collections/hooks/deleteOldUserUploads.ts:32-47`.
30. **Видалення книги лишає розділи-сироти.** Вони публічно доступні, а видалити їх writer уже не може. `src/collections/Book.ts:331`, тут потрібен каскад в `afterDelete`.
31. **Вкладені Local API виклики без `req`** (`recountChapters.ts`, `updateRating.ts`). Зараз це приховано, бо Mongo standalone без транзакцій. Із replicaSet лічильники зсунуться на 1.
32. **Ліміти завантажень обходяться паралельними запитами** за схемою «перевірив → створив». `enforceMediaAuthorLimit.ts:84-95`, `enforceUserUploadLimits.ts:150-186`.
33. **Позиція скарги зберігається з `end = 0` при потрійному кліку.** `endContainer` тут елемент, а не текст. `src/components/text-selection-popup.tsx:116-137`. Рахувати через `Range.toString().length`.
34. **Серверний прогрес лише росте.** Перечитування з початку не оновлює `updatedAt`, тож «Продовжити» показує не останню книгу; випадково відкритий розділ 200 стає прогресом назавжди. `src/hooks/useReadProgress.ts:79`.
35. **Стрілки гортають сторінки під діалогом скарги чи зумом і на Alt+←.** `src/components/PaginatedReader.tsx:267-278`.
36. **Hydration mismatch у налаштуваннях:** `useState(getInitialSettings)` читає localStorage на першому рендері. `src/app/(frontend)/settings/page.tsx:158`.
37. **Застарілі результати пошуку після очищення поля:** немає abort/++requestId у гілці з порожнім query. `search-dialog.tsx:208-221`.
38. **Скидання пароля: помилка валідації прибирає форму** і показує екран «Запросити нове посилання». `src/components/reset-password-page.tsx:42-58`.
39. **Подвійний сабміт реєстрації та входу:** `loading` ніколи не стає true, `formState.isLoading` використано замість `isSubmitting`. `register-form.tsx:44-93`, `login-form.tsx:29`.
40. **Фільтр посилань у коментарях** `^https:\/\/wuji\.world` пропускає `wuji.world.evil.com` і `wuji.world@evil.com`. `src/components/SanitizedMarkdown.tsx:16`. Потрібно `^https:\/\/wuji\.world(\/|$)`.
41. **`getBanner` кешує `null` на годину при помилці БД:** try/catch стоїть усередині `unstable_cache`. `src/lib/banner.ts:14-26`. У `footer.ts` це вже виправлено.
42. **OG-метадані:** `og:url` = `/${slug}` без `/novel` чи `/blog`; `metadataBase` не задано; `siteName: 'veiag.dev'` і неіснуюча картинка `website-template-OG.webp`. `src/lib/generateMeta.ts:55-59`, `src/lib/mergeOpenGraph.ts:4-15`. Опис розділу завжди порожній, бо `meta` немає в populate (`src/queries/index.ts:62-68`).
43. **robots.txt `disallow: '/novel/*/*'` закриває і `/novel/slug/og`,** тож у X картки без зображення. `src/app/robots.ts`.
44. **FB2 стає невалідним через керівні символи** (`\x00-\x08` тощо), бо `escapeXml` їх не прибирає. `src/lib/fb2-generator.ts:90-97`.
45. **`/api/generateSlug`:** нікнейм без латиниці чи кирилиці (`李明`, емодзі) дає порожній slug і 400, профіль не зберегти; `currentUserId` береться з тіла, а не з сесії. `src/app/api/generateSlug/route.ts:19-29`.
46. **ReDoS у `replaceInChapters`:** `(a+)+$` блокує event loop; часткове падіння посеред циклу лишає частину розділів зміненою. Доступно лише редакторам. `src/actions/chapterReplace.ts:20, 86`.
47. **Сторінка каталогу не зберігається в URL:** після «Назад» знову сторінка 1. `BookCatalog.tsx:90, 115-118`.
48. **docker-compose на `node:18-alpine`,** а Next 16 потребує ≥20.9. Mongo відкритий на 0.0.0.0 без auth. `docker-compose.yml:5`.
