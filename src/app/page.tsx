import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Approche from "@/components/Approche";
import Ecouter from "@/components/Ecouter";
import Projets from "@/components/Projets";
import LeDuo from "@/components/LeDuo";
import Contact from "@/components/Contact";
import { getProjects } from "@/data/projets";
import { getAudioTracks } from "@/data/audio";

export const revalidate = 300; // ISR : revalide toutes les 5 min

export default async function Home() {
  const [projects, audioTracks] = await Promise.all([getProjects(), getAudioTracks()]);

  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Approche />
        <Ecouter tracks={audioTracks} />
        <Projets projects={projects} />
        <LeDuo />
        <Contact />
      </main>
    </>
  );
}
