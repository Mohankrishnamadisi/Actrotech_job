import React, { useState } from 'react';
import { useAuthStore } from '@store/index';
import { RecruiterBillingSubscription } from '@components/recruiter/RecruiterBillingSubscription';
import { RecruiterUpgradePrompt } from '@components/recruiter/RecruiterUpgradePrompt';
import { Layout } from '@components/layout/Layout';

export const RecruiterSubscriptionPage: React.FC = () => {
  const { user } = useAuthStore();
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);

  if (!user?.id) {
    return (
      <Layout>
        <div style={{ padding: 24 }}>Please sign in to view recruiter billing.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <RecruiterBillingSubscription ownerId={user.id} currentUserId={user.id} />
      <RecruiterUpgradePrompt
        open={upgradePromptOpen}
        onClose={() => setUpgradePromptOpen(false)}
        recruiterId={user.id}
        reason="general"
      />
    </Layout>
  );
};
