import { Route, Routes } from 'react-router-dom';
import { RuleSetProvider } from './context/RuleSetContext';
import { Layout } from './components/Layout';
import { JANES, RULE_SETS, STANDARD, type RuleSet } from './lib/rules';
import { load } from './lib/storage';
import { RulesPage } from './pages/RulesPage';
import { JanesPage } from './pages/JanesPage';
import { PlayPage } from './pages/PlayPage';
import { ScorePage } from './pages/ScorePage';
import { DicePage } from './pages/DicePage';
import { HistoryPage } from './pages/HistoryPage';
import { NotFoundPage } from './pages/NotFoundPage';

function Branch({ rules }: { rules: RuleSet }) {
  return (
    <RuleSetProvider rules={rules}>
      <Layout />
    </RuleSetProvider>
  );
}

/** History belongs to neither branch, so it keeps whichever you were last in. */
function NeutralBranch() {
  const last = load<RuleSet['id']>('farkle:lastRuleSet');
  return <Branch rules={RULE_SETS[last ?? 'standard'] ?? STANDARD} />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Branch rules={STANDARD} />}>
        <Route path="/" element={<RulesPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/score" element={<ScorePage />} />
        <Route path="/dice" element={<DicePage />} />
      </Route>

      <Route path="/janes" element={<Branch rules={JANES} />}>
        <Route index element={<JanesPage />} />
        <Route path="play" element={<PlayPage />} />
        <Route path="score" element={<ScorePage />} />
        <Route path="dice" element={<DicePage />} />
      </Route>

      <Route element={<NeutralBranch />}>
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
