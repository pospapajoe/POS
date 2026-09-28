import ReturClient from "./ReturClient";
import { getProducts } from "../actions";

export default async function ReturPage() {
  const products = await getProducts();
  return <ReturClient initialProducts={products as any} />;
}
