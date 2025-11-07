import { Layout } from '@/components/Layout';
import HeroSection from '@/components/HeroSection';
import GamesSection from '@/components/GamesSection';
import TeamSection from '@/components/TeamSection';
import ContactSection from '@/components/ContactSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <GamesSection />
      <TeamSection />
      <ContactSection />
    </Layout>
  );
};

export default Index;