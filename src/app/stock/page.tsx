import StockClient from "./StockClient";
import { getProducts } from "../actions";

export default async function StockPage() {
  const products = await getProducts();
  return <StockClient initialProducts={products as any} />;
}
