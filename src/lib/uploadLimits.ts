/**
 * Спільні обмеження на завантаження файлів.
 *
 * Одне джерело правди і для клієнта (миттєва валідація у формах), і для сервера
 * (реальне обмеження в хуках колекцій). Клієнтські перевірки — це лише UX:
 * усе, що справді захищає від абʼюзу, енфорситься на сервері.
 */

/** Типи зображень, дозволені для аватарів/банерів користувачів */
export const USER_UPLOAD_ALLOWED_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

/** Значення для атрибута accept у <input type="file"> */
export const USER_UPLOAD_ACCEPT = USER_UPLOAD_ALLOWED_MIME_TYPES.join(',')

/** Типи зображень, дозволені для медіа (обкладинки книг, картинки в блозі) */
export const MEDIA_ALLOWED_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]

/** Ліміт розміру аватара/банера, МБ (дефолт; реальне значення — з глобалу) */
export const DEFAULT_USER_UPLOAD_MAX_FILE_SIZE_MB = 3

/** Скільки файлів одночасно може тримати один користувач (аватар + банер + запас) */
export const DEFAULT_USER_UPLOAD_LIMIT = 4

/** Скільки завантажень на годину дозволено одному користувачу */
export const DEFAULT_USER_UPLOAD_RATE_LIMIT = 10

/**
 * Скільки днів акаунт має прожити, перш ніж зможе завантажувати
 * аватар і банер. Пошта зараз не підтверджується, тож вік акаунта —
 * єдине, що відрізняє живого читача від щойно наштампованого одноразового.
 */
export const DEFAULT_USER_UPLOAD_MIN_ACCOUNT_AGE_DAYS = 30

/** Ліміт розміру медіафайлу, МБ (дефолт; реальне значення — з глобалу) */
export const DEFAULT_MEDIA_MAX_FILE_SIZE_MB = 10

/** Найбільша сторона зображення після ресайзу (аватари/банери) */
export const USER_UPLOAD_MAX_DIMENSION = 1920

/** Найбільша сторона зображення після ресайзу (медіа) */
export const MEDIA_MAX_DIMENSION = 2560

/**
 * Стеля на кількість пікселів вхідного зображення для sharp.
 * Захищає від «декомпресійних бомб» — маленького файлу, що розпаковується
 * в зображення на десятки гігабайт памʼяті. 50 Мп ≈ 8000×6000.
 */
export const MAX_INPUT_PIXELS = 50_000_000

/**
 * Жорстка стеля на будь-який файл у будь-якій колекції, МБ.
 * Виставляється на рівні конфігу Payload — запит, що перевищує її,
 * обривається ще до того, як файл потрапить у памʼять процесу.
 */
export const MAX_UPLOAD_FILE_SIZE_MB = 12

export const mbToBytes = (mb: number): number => Math.round(mb * 1024 * 1024)
