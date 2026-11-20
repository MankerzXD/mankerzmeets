import { Suspense, use } from "react";
import TurnoClient from "../turno-client";
import { Loader2 } from "lucide-react";

function TurnoWrapper({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = use(paramsPromise);
  return <TurnoClient slug={slug} initialTokenOrCode={token} />;
}

export default function TurnoTokenPage(props: {
  params: Promise<{ slug: string; token: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-white mb-3" />
          <span className="text-xs font-mono">Cargando turno...</span>
        </div>
      }
    >
      <TurnoWrapper paramsPromise={props.params} />
    </Suspense>
  );
}
