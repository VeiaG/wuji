import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Умови використання</h1>
            <p className="text-muted-foreground">Останнє оновлення: 15.06.2025</p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Загальні положення</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ласкаво просимо на сайт <strong>ВуЧи</strong>! Використовуючи наш сайт, ви
                погоджуєтеся з цими умовами використання. Якщо ви не згодні з будь-якими з цих умов,
                будь ласка, не використовуйте наш сайт.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Про сервіс</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                ВуЧи — це безкоштовна платформа для читання книг та новел онлайн. Наш сайт:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Надає безкоштовний доступ до читання літературних творів</li>
                <li>Дозволяє відстежувати прогрес читання</li>
                <li>Надає можливість залишати коментарі та відгуки</li>
                <li>Не має комерційної мети та не отримує прибуток</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                3. Авторські права та контент
              </h2>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 mb-4">
                <p className="text-amber-800 dark:text-amber-200 font-medium">
                  ⚠️ Важливо: Усі матеріали на сайті представлені виключно для ознайомлення.
                </p>
              </div>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
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
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                4. Реєстрація та облікові записи
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Для використання деяких функцій сайту вам потрібно створити обліковий запис:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Ви повинні надати точну та актуальну інформацію при реєстрації</li>
                <li>Ви несете відповідальність за безпеку свого облікового запису</li>
                <li>Один користувач може мати лише один обліковий запис</li>
                <li>Ми залишаємо за собою право видалити облікові записи, що порушують ці умови</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Правила поведінки</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Використовуючи наш сайт, ви зобов&apos;язуєтеся:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Не публікувати образливий, незаконний або неприйнятний контент</li>
                <li>Поважати інших користувачів у коментарях та відгуках</li>
                <li>Не намагатися зламати або пошкодити роботу сайту</li>
                <li>Не використовувати сайт для комерційних цілей без дозволу</li>
                <li>Дотримуватися українського законодавства</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                6. Обмеження відповідальності
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Сайт ВуЧи надається &quot;як є&quot; без будь-яких гарантій. Ми не несемо
                відповідальності за:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-3">
                <li>Точність або повноту контенту на сайті</li>
                <li>Тимчасову недоступність сайту</li>
                <li>Втрату даних користувачів</li>
                <li>Будь-які збитки, що можуть виникнути від використання сайту</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Зміни умов</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ми залишаємо за собою право змінювати ці умови використання в будь-який час. Зміни
                набувають чинності з моменту їх публікації на сайті. Продовжуючи використовувати
                сайт після внесення змін, ви погоджуєтеся з новими умовами.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                8. Контактна інформація
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Якщо у вас є питання щодо цих умов використання, зв&apos;яжіться з нами:
              </p>
              <ul className="list-none text-muted-foreground space-y-2 mt-3">
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
