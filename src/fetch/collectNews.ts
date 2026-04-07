import { fetchAnsaNews } from "./ansa";
import { fetchCnnNews } from "./cnn";

export async function collectNews() {
  const [ansa, cnn] = await Promise.all([
    fetchAnsaNews(),
    fetchCnnNews(),
  ]);

  return [...ansa, ...cnn];
}
