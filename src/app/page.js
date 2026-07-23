import { getProducts } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import Store from "@/components/Store";

// Oturum çerezine baktığı için bu sayfa istek anında render edilir.
export const dynamic = "force-dynamic";

export default async function Page() {
  const products = await getProducts();
  const user = await getSessionUser();
  return <Store products={products} initialUser={user ? { email: user.email, name: user.name } : null} />;
}
