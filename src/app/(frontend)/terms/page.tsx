import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="container-page flex flex-col gap-3.5 pt-2">
      <div className="mx-auto w-full max-w-[860px] rounded-tile bg-tile p-6 md:p-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="heading-display text-[clamp(28px,4vw,40px)]">Умови використання</h1>
            <p className="text-sm text-muted-foreground">Останнє оновлення: 15.06.2025</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8 text-[16px] prose-strong:text-foreground">
            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">1. Загальні положення</h2>
              <p className="text-soft leading-relaxed">
                Ласкаво просимо на сайт <strong>ВуЧи</strong>! Використовуючи наш сайт, ви
                погоджуєтеся з цими умовами використання. Якщо ви не згодні з будь-якими з цих умов,
                будь ласка, не використовуйте наш сайт.
              </p>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">2. Про сервіс</h2>
              <p className="text-soft leading-relaxed mb-3">
                ВуЧи — це безкоштовна платформа для читання книг та новел онлайн. Наш сайт:
              </p>
              <ul className="list-disc pl-5 text-soft space-y-1.5">
                <li>Надає безкоштовний доступ до читання літературних творів</li>
                <li>Дозволяє відстежувати прогрес читання</li>
                <li>Надає можливість залишати коментарі та відгуки</li>
                <li>Не має комерційної мети та не отримує прибуток</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">
                3. Авторські права та контент
              </h2>
              <div className="mb-4 rounded-xl bg-chip px-4 py-3">
                <p className="my-0! font-semibold text-foreground">
                  ⚠️ Важливо: Усі матеріали на сайті представлені виключно для ознайомлення.
                </p>
              </div>
              <ul className="list-disc pl-5 text-soft space-y-1.5">
                <li>Усі права на оригінальні твори належать їх відповідним правовласникам</li>
                <li>Переклади на сайті є фанатськими та створені ентузіастами</li>
                <li>Сайт не має комерційної вигоди від розміщеного контенту</li>
                <li>
                  Якщо ви є правовласником і хочете, щоб контент був видалений — зв&apos;яжіться з
                  нами за адресою{' '}
                  <a href="mailto:veiag.work@gmail.com" className="text-primary hover:underline">
                    veiag.work@gmail.com
                  </a>
                  , і ми оперативно його приберемо
                </li>
              </ul>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">
                4. Реєстрація та облікові записи
              </h2>
              <p className="text-soft leading-relaxed mb-3">
                Для використання деяких функцій сайту вам потрібно створити обліковий запис:
              </p>
              <ul className="list-disc pl-5 text-soft space-y-1.5">
                <li>Ви повинні надати точну та актуальну інформацію при реєстрації</li>
                <li>Ви несете відповідальність за безпеку свого облікового запису</li>
                <li>Один користувач може мати лише один обліковий запис</li>
                <li>Ми залишаємо за собою право видалити облікові записи, що порушують ці умови</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">5. Правила поведінки</h2>
              <p className="text-soft leading-relaxed mb-3">
                Використовуючи наш сайт, ви зобов&apos;язуєтеся:
              </p>
              <ul className="list-disc pl-5 text-soft space-y-1.5">
                <li>Не публікувати образливий, незаконний або неприйнятний контент</li>
                <li>Поважати інших користувачів у коментарях та відгуках</li>
                <li>Не намагатися зламати або пошкодити роботу сайту</li>
                <li>Не використовувати сайт для комерційних цілей без дозволу</li>
                <li>Дотримуватися українського законодавства</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">
                6. Обмеження відповідальності
              </h2>
              <p className="text-soft leading-relaxed">
                Сайт ВуЧи надається &quot;як є&quot; без будь-яких гарантій. Ми не несемо
                відповідальності за:
              </p>
              <ul className="list-disc pl-5 text-soft space-y-1.5 mt-3">
                <li>Точність або повноту контенту на сайті</li>
                <li>Тимчасову недоступність сайту</li>
                <li>Втрату даних користувачів</li>
                <li>Будь-які збитки, що можуть виникнути від використання сайту</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">7. Зміни умов</h2>
              <p className="text-soft leading-relaxed">
                Ми залишаємо за собою право змінювати ці умови використання в будь-який час. Зміни
                набувають чинності з моменту їх публікації на сайті. Продовжуючи використовувати
                сайт після внесення змін, ви погоджуєтеся з новими умовами.
              </p>
            </section>

            <section>
              <h2 className="heading-display mt-0 mb-4 text-[20px] text-foreground md:text-[22px]">
                8. Контактна інформація
              </h2>
              <p className="text-soft leading-relaxed">
                Якщо у вас є питання щодо цих умов використання, зв&apos;яжіться з нами:
              </p>
              <ul className="list-none pl-0 text-soft space-y-2 mt-3">
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
