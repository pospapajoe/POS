import POSClient from "./POSClient";
import { getProducts, getSession } from "../actions";
import { getStoreSetting } from "../settings/actions";

export default async function POSPage() {
  const session = await getSession();
  const products = await getProducts();
  const storeSetting = await getStoreSetting();
  return <POSClient initialProducts={products as any} session={session} storeSetting={storeSetting} />;
}
