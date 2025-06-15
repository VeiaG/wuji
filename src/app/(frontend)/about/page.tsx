import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Heart,
  Github,
  Code,
  Users,
  MessageCircle,
  CreditCard,
  ExternalLink,
  BookOpen,
  Zap,
  Globe,
  UserPlus,
  GitPullRequest,
} from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Про ВуЧи</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Відкрита платформа для читання ранобе українською мовою
            </p>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Альфа версія
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Code className="h-3 w-3" />
                Open Source
              </Badge>
            </div>
          </div>

          {/* Mission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Чому ВуЧи?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Цей проект народився з простого бажання — читати ранобе українською мовою. Спочатку
                я робив його для себе, але якщо комусь цікаво також читати, перекладати, або навіть
                контрибютити на GitHub — я не проти!
              </p>
              <p className="text-muted-foreground leading-relaxed">
                ВуЧи — це не комерційний проект. Це спільнота ентузіастів, які хочуть зробити якісні
                переклади ранобе доступними для українських читачів.
              </p>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Поточний стан проекту
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>Альфа версія:</strong> Проект ще повністю не запущений, мало контенту, але
                  базові функції працюють!
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">✅ Що вже працює:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Читання новел</li>
                    <li>• Збереження прогресу</li>
                    <li>• Система ролей та доступу</li>
                    <li>• Редагування контенту</li>
                    <li>• Мобільна версія</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">🚧 В розробці:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Більше контенту</li>
                    <li>• Нові функції</li>
                    <li>• Покращення UI/UX</li>
                    <li>• Пошук, фільтрація , сторінки авторів і все , що наразі не зроблено</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technology Stack */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-green-500" />
                Технології
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">TypeScript</Badge>
                <Badge variant="outline">Next.js</Badge>
                <Badge variant="outline">Payload CMS</Badge>
                <Badge variant="outline">MongoDB</Badge>
                <Badge variant="outline">React</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Developer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Розробник
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">V</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">VeiaG</h3>
                  <p className="text-sm text-muted-foreground">Розробник проекту</p>
                </div>
              </div>
              <div className="flex gap-2 flex-col md:flex-row">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://veiag.dev" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    veiag.dev
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/VeiaG/wuji" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Open Source */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitPullRequest className="h-5 w-5 text-orange-500" />
                Open Source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Проект повністю відкритий! Я готовий приймати зміни до коду через GitHub. Якщо ви
                розробник і хочете покращити проект — створюйте pull request.
              </p>
              <div className="flex gap-2 flex-col md:flex-row">
                <Button asChild>
                  <a href="https://github.com/VeiaG/wuji" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-2" />
                    Переглянути код
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href="https://github.com/VeiaG/wuji/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Повідомити про баг
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Join as Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-cyan-500" />
                Приєднуйтесь як редактор
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Я не проти додавати нових редакторів, які можуть займатись перекладами своїх творів,
                використовуючи мій сайт. Сайт планую розвивати надалі, якщо вистачить охочих людей,
                які будуть займатись редагуванням та перекладом.
              </p>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Умови співпраці:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-foreground">✅ Нові новели:</h5>
                    <p className="text-sm text-muted-foreground">
                      Якщо хочете перекладати нову новелу — з радістю дам доступ!
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-foreground">🤔 Існуючі новели:</h5>
                    <p className="text-sm text-muted-foreground">
                      Для існуючих новел, де немає редакторів — розглядаю кожен випадок
                      індивідуально. Сліпо давати доступ до редагування не буду, щоб уникнути
                      вандалізму.
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <MessageCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Як зв&apos;язатися:</strong> Напишіть мені в Telegram або залиште коментар
                  у Telegram каналі.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Separator />

          {/* Support & Community */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Donations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Підтримка проекту
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ваші пожертви допомагають оплачувати хостинг, ШІ переклад та розвиток сайту.
                </p>

                <div className="space-y-3">
                  <Button className="w-full" asChild>
                    <a
                      href="https://send.monobank.ua/jar/6TKEWNo6YR"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Підтримати через Monobank
                    </a>
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">Або переказати на картку:</p>
                    <div className="bg-muted p-2 rounded font-mono text-sm">
                      <CreditCard className="h-4 w-4 inline mr-2" />
                      4441 1111 2563 8183
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  Спільнота
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Приєднуйтесь до нашого Telegram каналу для новин та обговорень.
                </p>

                <Button className="w-full" asChild>
                  <a href="https://t.me/wuji_ranobes" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Telegram канал &quot;ВуЧи&quot;
                  </a>
                </Button>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Тут ви можете слідкувати за оновленнями, залишати пропозиції та знаходити
                    однодумців.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-border space-y-4">
            <p className="text-muted-foreground">
              Дякуємо, що підтримуєте українську спільноту любителів ранобе!
            </p>
            <Link href="/" className="text-primary hover:underline">
              ← Повернутися на головну
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
