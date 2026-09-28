import POSClient from "./POSClient";
import { getProducts, getSession } from "../actions";

export default async function POSPage() {
  const session = await getSession();
  const products = await getProducts();
  return <POSClient initialProducts={products as any} session={session} />;
}
