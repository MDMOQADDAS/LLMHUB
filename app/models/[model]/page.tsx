import { notFound } from "next/navigation";
import ModelClient from "@/components/model-client";
import { MODELS } from "@/lib/models";

interface LLMModel {
  name: string;
  description: string;
  versions: string[];
  defaultVersion: string;
 
}

async function getModelData(modelName: string): Promise<LLMModel | null> {
  const model = MODELS.find(
    (m: LLMModel) => m.name.toLowerCase() === modelName.toLowerCase()
  );
  return model || null;
}

export default async function Page({
  params,
}: {
  params: Promise<{ model: string }>
}) {
  const modelName = (await params).model;
  const modelData = await getModelData(modelName);
  
  if (!modelData) {
    notFound();
  }

  return (
    <ModelClient 
      model={modelData}
      initialVersion={modelData.defaultVersion}
    />
  );
}
// export default async function Page({
//     params,
//   }: {
//     params: Promise<{ model: string }>
//   }) {
//     const model = (await params).model
//     return <div>My Post: {model}</div>
//   }