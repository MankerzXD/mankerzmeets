import { Suspense, use } from "react";
import TurnoClient from "./turno-client";
import { Loader2 } from "lucide-react";

function TurnoLookupWrapper({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = use(paramsPromise);
  return <TurnoClient slug={slug} />;
}

export default function TurnoLookupPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-white mb-3" />
          <span className="text-xs font-mono">Cargando...</span>
        </div>
      }
    >
      <TurnoLookupWrapper paramsPromise={props.params} />
    </Suspense>
  );
}
