import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Політика конфіденційності</h1>
            <p className="text-muted-foreground">Останнє оновлення: 15.06.2025</p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                1. Загальна інформація
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Ця політика конфіденційності описує, як сайт <strong>ВуЧи</strong> збирає,
                використовує та захищає вашу особисту інформацію. Ми серйозно ставимося до захисту
                вашої приватності та зобов&apos;язуємося забезпечити безпеку ваших даних.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                2. Які дані ми збираємо
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">2.1 Дані при реєстрації</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>
                  <strong>Email адреса</strong> — для створення облікового запису та зв&apos;язку з
                  вами
                </li>
                <li>
                  <strong>Нікнейм</strong> — для відображення вашого імені на сайті
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">2.2 Дані активності</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>
                  <strong>Прогрес читання</strong> — для збереження вашого місця в книгах
                </li>
                <li>
                  <strong>Коментарі до глав</strong> — ваші коментарі та обговорення
                </li>
                <li>
                  <strong>Відгуки про книги</strong> — ваші оцінки та рецензії
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">2.3 Технічні дані</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  <strong>Cookies</strong> — для підтримки авторизації та покращення роботи сайту
                </li>
                <li>
                  <strong>Дані аналітики</strong> — статистика відвідувань для покращення сайту
                  (планується)
                </li>
                <li>
                  <strong>Дані Google входу</strong> — при використанні входу через Google
                  (планується)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                3. Як ми використовуємо ваші дані
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Ми використовуємо зібрані дані виключно для:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Надання доступу до функцій сайту</li>
                <li>Збереження вашого прогресу читання</li>
                <li>Відображення ваших коментарів та відгуків</li>
                <li>Зв&apos;язку з вами при необхідності</li>
                <li>Покращення роботи сайту та користувацького досвіду</li>
                <li>Забезпечення безпеки та запобігання зловживанням</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                4. Зберігання та захист даних
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">4.1 Де зберігаються дані</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>Дані зберігаються на нашому сервері</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">4.2 Заходи безпеки</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Шифрування паролів та чутливих даних</li>
                <li>Захищені з&apos;єднання (HTTPS)</li>
                <li>Обмежений доступ до серверів</li>
                <li>Регулярні оновлення безпеки</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                5. Cookies та відстеження
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Ми використовуємо cookies для:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>
                  <strong>Авторизації</strong> — для підтримки вашої сесії входу
                </li>
                <li>
                  <strong>Налаштувань</strong> — для збереження ваших уподобань
                </li>
                <li>
                  <strong>Аналітики</strong> — для розуміння того, як використовується сайт
                  (планується)
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Ви можете відключити cookies у налаштуваннях вашого браузера, але це може вплинути
                на роботу сайту.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                6. Передача даних третім сторонам
              </h2>
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2 mb-4">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  ✅ Ми НЕ продаємо, не передаємо і не розголошуємо ваші особисті дані третім
                  сторонам.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Винятки можливі лише у випадках, передбачених законодавством України, або за вашою
                явною згодою.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Ваші права</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Ви маєте право:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  <strong>Доступ</strong> — запитати, які дані ми про вас зберігаємо
                </li>
                <li>
                  <strong>Виправлення</strong> — виправити неточні дані
                </li>
                <li>
                  <strong>Видалення</strong> — запросити видалення вашого облікового запису та даних
                </li>
                <li>
                  <strong>Обмеження</strong> — обмежити обробку ваших даних
                </li>
                <li>
                  <strong>Переносимість</strong> — отримати копію ваших даних
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Дані неповнолітніх</h2>
              <p className="text-muted-foreground leading-relaxed">
                Наш сайт не має вікових обмежень, але ми рекомендуємо батькам контролювати
                онлайн-активність своїх дітей. Якщо ви є батьком і хочете видалити дані вашої
                дитини, зв&apos;яжіться з нами.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                9. Зміни політики конфіденційності
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Ми можемо оновлювати цю політику конфіденційності час від часу. Про суттєві зміни ми
                повідомимо вас через email або повідомлення на сайті. Дата останнього оновлення
                завжди вказана на початку документа.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                10. Контактна інформація
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Якщо у вас є питання щодо цієї політики конфіденційності або ви хочете скористатися
                своїми правами, зв&apos;яжіться з нами:
              </p>
              <ul className="list-none text-muted-foreground space-y-2">
                <li>
                  📧 Email:{' '}
                  <a href="mailto:veiag.work@gmail.com" className="text-primary hover:underline">
                    veiag.work@gmail.com
                  </a>
                </li>
                <li>
                  🌐 Сайт:{' '}
                  <a
                    href="https://veiag.dev"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    veiag.dev
                  </a>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Ми зобов&apos;язуємося відповісти на ваш запит протягом 30 днів.
              </p>
            </section>
          </div>

          <div className="text-center pt-8 border-t border-border">
            <Link href="/" className="text-primary hover:underline">
              ← Повернутися на головну
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
