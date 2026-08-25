// /ideas route page (docs/plans/app-idea.md §11.2). New-idea wizard + draft list.
import { useNavigate } from 'react-router-dom';
import { PageHead } from '@/components/ui';
import IdeaWizard from '@/components/IdeaWizard';
import IdeaDraftList from '@/components/IdeaDraftList';
import type { Idea } from '@/lib/api';

export default function AppIdeas() {
  const navigate = useNavigate();
  const onSaved = (idea: Idea) => {
    // After saving, offer to jump to the draft; show a confirmation on the list.
    // We navigate to the draft detail so the user can continue editing / publish.
    navigate(`/ideas/${idea.id}`);
  };

  return (
    <>
      <PageHead
        title="Application Ideas"
        sub="Turn a raw idea into a draft application design, then publish it as a governed project."
        actions={<span className="badge badge-blue">✨ AI copilot</span>}
      />
      <div className="stack">
        <IdeaWizard onSaved={onSaved} />
        <IdeaDraftList onNew={() => navigate('/ideas')} />
      </div>
    </>
  );
}
