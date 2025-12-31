import { getCart } from "@/lib/cart";
import NavBar from "./NavBar";

export default async function NavBarServer() {
  const cart = await getCart();
  const count = cart.items.reduce((s, i) => s + i.qty, 0);
  return <NavBar cartCount={count} />;
}
