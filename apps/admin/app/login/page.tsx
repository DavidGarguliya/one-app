import { Button, Card, Input } from "@one-app/ui";
import Link from "next/link";

export default function ВойтиPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-md w-full space-y-4">
        <div>
          <p className="text-sm text-white/60">Доступ администратора</p>
          <h1 className="text-2xl font-semibold">Вход</h1>
        </div>
        <form className="space-y-3">
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Пароль" required />
          <Button type="submit" className="w-full">
            Войти
          </Button>
        </form>
        <p className="text-xs text-white/50">
          Демо-доступ задаётся через переменные окружения. Подробнее в{" "}
          <Link href="https://localhost:3000/документации" className="underline">
            документации
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
