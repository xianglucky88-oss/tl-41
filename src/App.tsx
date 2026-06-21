import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Samples from './pages/Samples';
import AnalysisWorkbench from './pages/AnalysisWorkbench';
import AnalysisHistory from './pages/AnalysisHistory';
import VariantComparison from './pages/VariantComparison';
import Reports from './pages/Reports';
import AlignmentVisualizer from './pages/AlignmentVisualizer';
import GcCodonAnalyzer from './pages/GcCodonAnalyzer';
import OrfPredictor from './pages/OrfPredictor';
import RestrictionEnzymeAnalyzer from './pages/RestrictionEnzymeAnalyzer';
import PcrPrimerDesigner from './pages/PcrPrimerDesigner';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/samples" element={<Samples />} />
        <Route path="/workbench" element={<AnalysisWorkbench />} />
        <Route path="/visualizer" element={<AlignmentVisualizer />} />
        <Route path="/gc-codon" element={<GcCodonAnalyzer />} />
        <Route path="/orf-predictor" element={<OrfPredictor />} />
        <Route path="/restriction-enzyme" element={<RestrictionEnzymeAnalyzer />} />
        <Route path="/primer-design" element={<PcrPrimerDesigner />} />
        <Route path="/history" element={<AnalysisHistory />} />
        <Route path="/variants" element={<VariantComparison />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Layout>
  );
}
