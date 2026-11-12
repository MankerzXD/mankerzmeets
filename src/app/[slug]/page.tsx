import { Suspense, use } from "react";
import ProfileClient from "./profile-client";
import { Loader2 } from "lucide-react";

function ProfileWrapper({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = use(paramsPromise);
  return <ProfileClient slug={slug} />;
}

export default function PublicProfilePage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
          <span className="text-sm font-mono">Cargando perfil...</span>
        </div>
      }
    >
      <ProfileWrapper paramsPromise={props.params} />
    </Suspense>
  );
}
