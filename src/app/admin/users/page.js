import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-stone-400">
              Admin / Kullanıcılar
            </p>
            <h1 className="text-3xl font-semibold">Kullanıcı Yönetimi</h1>
          </div>

          <a
            href="/admin"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
          >
            ← Dashboard
          </a>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <div className="grid grid-cols-4 gap-4 border-b border-stone-200 bg-stone-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <div>Kullanıcı</div>
            <div>E-posta</div>
            <div>Rol</div>
            <div>Kayıt Tarihi</div>
          </div>

          <div className="divide-y divide-stone-100">
            {users.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-4 gap-4 px-6 py-4 text-sm"
              >
                <div className="font-medium">{u.name || "-"}</div>
                <div className="text-stone-600">{u.email}</div>
                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      u.role === "admin"
                        ? "bg-stone-900 text-stone-50"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
                <div className="text-stone-500">
                  {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}