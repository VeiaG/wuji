# client-config

Два ендпоінти для зовнішніх (не-React) клієнтів — мобільної апки, скриптів, інтеграцій.
Обидва змонтовані на REST-роуті Payload (`{routes.api}`, за замовчуванням `/api`).

```ts
// payload.config.ts
plugins: [
  clientConfigPlugin(),
  // або:
  clientConfigPlugin({
    path: '/client-config',
    formStatePath: '/form-state',
    access: (req) => Boolean(req.user), // за замовчуванням — canAccessAdmin
  }),
]
```

За замовчуванням доступ мають ті самі користувачі, що й до адмінки (`canAccessAdmin`,
тобто `access.admin` колекції `users`: `admin`, `editor`, `writer`). Аноніму — `401`,
залогіненому без прав — `403`.

---

## `GET /api/client-config`

Санітизований клієнтський конфіг — той самий об'єкт, який адмінка серіалізує у браузер
(`createClientConfig`). Серверні властивості (`db`, `secret`, `email`, `hooks`, `endpoints`, …)
відрізаються всередині Payload.

```jsonc
{
  "config": { "collections": [...], "globals": [...], "admin": { ... } },
  "visibleEntities": { "collections": ["books", "..."], "globals": ["banner"] }
}
```

`visibleEntities` рахується окремо, бо `admin.hidden` — server-only і в клієнтський конфіг
не потрапляє. Використовуй його для побудови навігації, як це робить адмінка.

---

## `POST /api/form-state`

Серверний form state: умови показу полів, валідація, дефолти, `filterOptions`, локи документа.
Всередині — той самий `buildFormState`, що й в адмінці, але через HTTP+JSON і з `mockRSCs: true`,
щоб у відповіді не було React-нод.

**Навіщо.** Без нього клієнт мусив би реімплементувати те, що рахується в `iterateFields`:

| Що                                                      | Без ендпоінта                           |
| ------------------------------------------------------- | --------------------------------------- |
| `admin.condition` → `passesCondition`                   | умовні поля не з'являються/не ховаються |
| `field.validate` → `valid` + `errorMessage`             | помилки тільки після сабміту            |
| функціональний `defaultValue` (з `user`/`locale`/`req`) | порожні дефолти на create               |
| `filterOptions` для relationship / select / blocks      | у пікерах видно те, що не можна вибрати |
| локи документа, stale-data check                        | немає                                   |

Це **не** заміна серверної валідації: на сейві Payload у будь-якому разі проганяє `condition`
і `validate` у `beforeChange` і кидає `ValidationError`. Ендпоінт потрібен для інтерактивності
до сабміту.

### Запит

```jsonc
POST /api/form-state?locale=uk
Authorization: JWT <token>
Content-Type: application/json

{
  "collectionSlug": "books",   // або "globalSlug": "banner"
  "id": "665f...",             // немає на create
  "operation": "update",       // за замовчуванням: id ? 'update' : 'create'
  "formState": { },            // поточний стейт клієнта; немає на першому запиті
  "data": { },                 // альтернатива formState: сирі дані документа
  "skipValidation": true       // false після першої спроби сабміту
}
```

Решта опціональних полів: `schemaPath`, `docPreferences`, `documentFormState`,
`initialBlockData`, `initialBlockFormState`, `readOnly`, `returnLockStatus`,
`updateLastEdited`, `checkForStaleData`, `originalUpdatedAt` — див. `FormStateRequest`
у [`formState.ts`](./formState.ts).

- `data` vs `formState`: на першому запиті (відкриття документа) передавай `data` або нічого
  (create). Далі — `formState`, сервер сам відновить із нього дані.
- `schemaPath` за замовчуванням дорівнює slug. Інше значення потрібне лише для підформ
  (окремий екран редагування одного блоку): `books.layout.hero`.
- Локаль — звичайний `?locale=` на запиті, як у решті REST API.

### Відповідь

```jsonc
{
  "state": {
    "title": { "value": "Hi", "initialValue": "Hi", "valid": true, "passesCondition": true },
    "group.subtitle": { "value": "...", "valid": true },
    "layout": {
      "value": 2,
      "rows": [{ "id": "uuid-1", "blockType": "hero" }],
      "disableFormData": true,
    },
    "layout.0.heading": {
      "value": "...",
      "valid": false,
      "errorMessage": "This field is required.",
    },
  },
  "lockedState": { "isLocked": false }, // лише з returnLockStatus: true
  "staleDataState": { "isStale": false }, // лише з checkForStaleData: true
}
```

Стейт — **пласка мапа `path → FieldState`**, не вкладений об'єкт. Шлях — крапкова нотація
з індексами рядків: `layout.0.heading`. Для array/blocks `value` — це _кількість рядків_,
самі рядки лежать у `rows[]`, а поле має `disableFormData: true`.

З відповіді прибрані `customComponents`, `fieldSchema`, `validate`, `lastRenderedPath` —
зовнішньому клієнту вони не потрібні.

### Цикл на клієнті

1. **Відкриття документа** — один запит з `data` (або без нічого на create). Відповідь стає
   початковим стейтом: дефолти, `passesCondition`, `filterOptions`.
2. **Зміна поля** — локально: `state[path].value = v`, `state[path].isModified = true`.
3. **Debounce ~250 мс** → запит. Поки запит у польоті, нові не шлються; зберігається лише
   останній запланований, попередній абортиться через `AbortController`.
4. **Мердж відповіді** (правила нижче).
5. **Сабміт** — звичайний REST: `POST /api/books` або `PATCH /api/books/:id`.

### Правила мерджу

Як у `mergeServerFormState` в адмінці:

- **локальний стейт — джерело істини для значень**: `value`/`initialValue` з сервера
  ігноруються, окрім полів з `addedByServer: true` (і після сабміту/автосейву, де значення
  сервера перемагають — `beforeChange`-хуки могли щось порахувати);
- шляхи, яких немає локально і які не `addedByServer`, пропускаються — сервер міг відповісти
  про поле, яке юзер уже видалив;
- з сервера завжди беруться: `valid`, `errorMessage`, `errorPaths`, `passesCondition`,
  `filterOptions`, `selectFilterOptions`, `blocksFilterOptions`;
- `valid`/`passesCondition` = `undefined` трактується як `true`;
- **`rows` мерджаться по `id`, не по індексу** — юзер міг переставити чи видалити рядок,
  поки запит летів. Нові серверні рядки (`addedByServer`) дописуються в кінець.

### Помилки сабміту

`ValidationError` з REST має `data.errors[].path`, який збігається один-в-один з ключем
у form state — розкладай помилки по полях за цим ключем.

### Коли ендпоінт не потрібен

Якщо в колекції немає полів з `admin.condition`, функціональним `filterOptions`,
функціональним `defaultValue` і хуків, що переписують дані — серверний form state не дасть
нічого, крім трафіку. Практичний компроміс: один запит на відкриття документа,
а debounce-цикл вмикати лише там, де в схемі реально є динаміка.

---

## Примітка про залежності

`buildFormState` живе в `@payloadcms/ui`, який тягне React-компоненти зі стилями. Тому імпорт
зроблений **динамічним, усередині хендлера**: `payload.config.ts` вантажиться ще й CLI
(`payload generate:types`, `payload migrate`) через tsx, який `.css`/`.scss` не розуміє.
У Next-рантаймі модуль резолвиться нормально — адмінка й так його бандлить.
