import { Card } from "@one-app/ui";
import { adminApi } from "@/lib/api";

export default async function UsersAdminPage() {
  const users = await adminApi.listUsers();
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-white/60">Администраторы</p>
        <h1 className="text-2xl font-semibold">Пользователи</h1>
      </div>
      <Card>
        <div className="grid grid-cols-3 text-sm text-white/60 mb-2">
          <span>Email</span>
          <span>Роль</span>
          <span>ID</span>
        </div>
        <div className="divide-y divide-white/10">
          {users.map((u: any) => (
            <div key={u.id} className="grid grid-cols-3 py-2 items-center">
              <span className="text-white">{u.email}</span>
              <span className="text-white/70">{u.role}</span>
              <span className="text-white/60 text-sm">{u.id}</span>
            </div>
          ))}
          {!users.length && <p className="py-4 text-sm text-white/60">Пользователей пока нет.</p>}
        </div>
      </Card>
    </div>
  );
}
