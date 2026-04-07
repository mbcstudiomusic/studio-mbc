import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Approche from "@/components/Approche";
import Ecouter from "@/components/Ecouter";
import Projets from "@/components/Projets";
import LeDuo from "@/components/LeDuo";
import Contact from "@/components/Contact";
import { getProjects } from "@/data/projets";

export const revalidate = 300; // ISR : revalide toutes les 5 min

export default async function Home() {
  const projects = await getProjects();

  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <Approche />
        <Ecouter />
        <Projets projects={projects} />
        <LeDuo />
        <Contact />
      </main>
    </>
  );
}
