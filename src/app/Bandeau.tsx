/** Bandeau de titre des pages publiques (même style que l'accueil). */
export default function Bandeau({ titre, sous, mot }: { titre: string; sous?: string; mot?: string }) {
  return (<section className="hero relative left-1/2 -mt-6 mb-6 w-screen -translate-x-1/2 px-4 py-10 sm:py-14">
    <div className="mx-auto max-w-6xl">
      <h1 className="font-titre text-3xl font-bold leading-tight sm:text-5xl">{titre}{mot && <> <span className="text-jaune">{mot}</span></>}</h1>
      {sous && <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">{sous}</p>}
    </div></section>);
}
