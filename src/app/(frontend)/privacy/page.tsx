import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <div className="mx-auto w-full max-w-[860px] rounded-tile bg-tile p-6 md:p-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="heading-display text-[clamp(28px,4vw,40px)]">Політика конфіденційності</h1>
            <p className="text-sm text-muted-foreground">Останнє оновлення: 15.06.2025</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8 text-[16px] prose-strong:text-foreground">
            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">
                1. Загальна інформація
              </h2>
              <p className="text-soft leading-relaxed">
                Ця політика конфіденційності описує, як сайт <strong>ВуЧи</strong> збирає,
                використовує та захищає вашу особисту інформацію. Ми серйозно ставимося до захисту
                вашої приватності та зобов&apos;язуємося забезпечити безпеку ваших даних.
              </p>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">
                2. Які дані ми збираємо
              </h2>

              <h3 className="mb-3 text-lg font-bold text-foreground">2.1 Дані при реєстрації</h3>
              <ul className="list-disc pl-5 text-soft space-y-1.5 mb-4">
                <li>
                  <strong>Email адреса</strong> — для створення облікового запису та зв&apos;язку з
                  вами
                </li>
                <li>
                  <strong>Нікнейм</strong> — для відображення вашого імені на сайті
                </li>
              </ul>

              <h3 className="mb-3 text-lg font-bold text-foreground">2.2 Дані активності</h3>
              <ul className="list-disc pl-5 text-soft space-y-1.5 mb-4">
                <li>
                  <strong>Прогрес читання</strong> — для збереження вашого місця в книгах
                </li>
                <li>
                  <strong>Коментарі до розділів</strong> — ваші коментарі та обговорення
                </li>
                <li>
                  <strong>Відгуки про книги</strong> — ваші оцінки та рецензії
                </li>
              </ul>

              <h3 className="mb-3 text-lg font-bold text-foreground">2.3 Технічні дані</h3>
              <ul className="list-disc pl-5 text-soft space-y-1.5">
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
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">
                3. Як ми використовуємо ваші дані
              </h2>
              <p className="text-soft leading-relaxed mb-3">
                Ми використовуємо зібрані дані виключно для:
              </p>
              <ul className="list-disc pl-5 text-soft space-y-1.5">
                <li>Надання доступу до функцій сайту</li>
                <li>Збереження вашого прогресу читання</li>
                <li>Відображення ваших коментарів та відгуків</li>
                <li>Зв&apos;язку з вами при необхідності</li>
                <li>Покращення роботи сайту та користувацького досвіду</li>
                <li>Забезпечення безпеки та запобігання зловживанням</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">
                4. Зберігання та захист даних
              </h2>

              <h3 className="mb-3 text-lg font-bold text-foreground">4.1 Де зберігаються дані</h3>
              <ul className="list-disc pl-5 text-soft space-y-1.5 mb-4">
                <li>Дані зберігаються на нашому сервері</li>
              </ul>

              <h3 className="mb-3 text-lg font-bold text-foreground">4.2 Заходи безпеки</h3>
              <ul className="list-disc pl-5 text-soft space-y-1.5">
                <li>Шифрування паролів та чутливих даних</li>
                <li>Захищені з&apos;єднання (HTTPS)</li>
                <li>Обмежений доступ до серверів</li>
                <li>Регулярні оновлення безпеки</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">
                5. Cookies та відстеження
              </h2>
              <p className="text-soft leading-relaxed mb-3">
                Ми використовуємо cookies для:
              </p>
              <ul className="list-disc pl-5 text-soft space-y-1.5 mb-4">
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
              <p className="text-soft leading-relaxed">
                Ви можете відключити cookies у налаштуваннях вашого браузера, але це може вплинути
                на роботу сайту.
              </p>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">
                6. Передача даних третім сторонам
              </h2>
              <div className="mb-4 rounded-xl bg-chip px-4 py-3">
                <p className="my-0! font-semibold text-foreground">
                  ✅ Ми НЕ продаємо, не передаємо і не розголошуємо ваші особисті дані третім
                  сторонам.
                </p>
              </div>
              <p className="text-soft leading-relaxed">
                Винятки можливі лише у випадках, передбачених законодавством України, або за вашою
                явною згодою.
              </p>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">7. Ваші права</h2>
              <p className="text-soft leading-relaxed mb-3">Ви маєте право:</p>
              <ul className="list-disc pl-5 text-soft space-y-1.5">
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
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">8. Дані неповнолітніх</h2>
              <p className="text-soft leading-relaxed">
                Наш сайт не має вікових обмежень, але ми рекомендуємо батькам контролювати
                онлайн-активність своїх дітей. Якщо ви є батьком і хочете видалити дані вашої
                дитини, зв&apos;яжіться з нами.
              </p>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">
                9. Зміни політики конфіденційності
              </h2>
              <p className="text-soft leading-relaxed">
                Ми можемо оновлювати цю політику конфіденційності час від часу. Про суттєві зміни ми
                повідомимо вас через email або повідомлення на сайті. Дата останнього оновлення
                завжди вказана на початку документа.
              </p>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">
                10. Контактна інформація
              </h2>
              <p className="text-soft leading-relaxed mb-3">
                Якщо у вас є питання щодо цієї політики конфіденційності або ви хочете скористатися
                своїми правами, зв&apos;яжіться з нами:
              </p>
              <ul className="list-none pl-0 text-soft space-y-2">
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
              <p className="text-soft leading-relaxed mt-4">
                Ми зобов&apos;язуємося відповісти на ваш запит протягом 30 днів.
              </p>
            </section>
          </div>

          <div className="border-t border-border pt-6 text-center">
            <Link href="/" className="text-primary hover:underline">
              ← Повернутися на головну
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
