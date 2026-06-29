import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { subscriptionService, paymentService } from '@services/api';
import { ROUTES } from '@constants/index';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CheckCircle as CheckCircleIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Autorenew as AutorenewIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

interface Plan {
  id: string;
  name: string;
  priceLabel: string;
  price: number | null;
  description: string;
  features: string[];
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'FREE',
    priceLabel: '₹0/month',
    price: 0,
    description: '100 resume unlock credits',
    features: ['Resume Unlock Credits', 'AI Recommended Candidates', 'ATS Pipeline', 'Talent Pool', 'Candidate Tags'],
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    priceLabel: '₹999/month',
    price: 999,
    description: 'Unlimited resume unlocks and priority placement',
    features: ['Unlimited Resume Unlocks', 'AI Recommended Candidates', 'ATS Pipeline', 'Talent Pool', 'Candidate Tags'],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    priceLabel: 'Contact Sales',
    price: null,
    description: 'Unlimited unlocks, priority support, team recruiters (future)',
    features: ['Unlimited Resume Unlocks', 'Priority Support', 'Team Recruiters (future)', 'ATS Pipeline', 'Talent Pool'],
  },
];

const isUnlimitedPlan = (plan?: string | null) => {
  return plan === 'premium' || plan === 'enterprise';
};

export const RecruiterSubscriptionPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState('premium');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [autoPaySaving, setAutoPaySaving] = useState(false);

  const [currentSubscription, setCurrentSubscription] = useState<any | null>(null);

  const autoPayStorageKey = user?.id ? `recruiter_autopay_${user.id}` : 'recruiter_autopay_guest';

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) return;
      try {
        const subscription = await subscriptionService.getUserSubscription(user.id);
        setCurrentSubscription(subscription);

        if (subscription && typeof subscription.auto_pay === 'boolean') {
          setAutoPayEnabled(subscription.auto_pay);
        } else {
          const saved = window.localStorage.getItem(autoPayStorageKey);
          setAutoPayEnabled(saved ? saved === 'true' : false);
        }
      } catch (err) {
        console.error('Failed to load subscription:', err);

        const saved = window.localStorage.getItem(autoPayStorageKey);
        setAutoPayEnabled(saved ? saved === 'true' : false);
      }
    };
    loadSubscription();
  }, [user, autoPayStorageKey]);

  const handleAutoPayToggle = async (enabled: boolean) => {
    if (!user) {
      toast.error('Please login to enable AutoPay.');
      navigate(ROUTES.LOGIN);
      return;
    }

    setAutoPaySaving(true);
    try {
      if (currentSubscription?.id) {
        try {
          await subscriptionService.updateSubscription(currentSubscription.id, {
            auto_pay: enabled,
            updated_at: new Date().toISOString(),
          });

          setCurrentSubscription((prev: any) => (
            prev ? { ...prev, auto_pay: enabled } : prev
          ));
        } catch (err) {
          console.warn('AutoPay backend update skipped, using local persistence:', err);
        }
      }

      window.localStorage.setItem(autoPayStorageKey, String(enabled));
      setAutoPayEnabled(enabled);
      toast.success(enabled ? 'AutoPay enabled successfully.' : 'AutoPay disabled successfully.');
    } catch (err) {
      console.error('Failed to update AutoPay:', err);
      toast.error('Unable to update AutoPay right now.');
    } finally {
      setAutoPaySaving(false);
    }
  };

  const handleBuy = async (planId: string) => {
    if (!user) {
      toast.error('Please log in to manage subscriptions.');
      navigate(ROUTES.LOGIN);
      return;
    }

    const selectedPlan = plans.find((plan) => plan.id === planId);
    if (!selectedPlan) {
      toast.error('Invalid plan selection.');
      return;
    }

    if (currentSubscription?.plan === selectedPlan.id) {
      toast.success('You are already on this plan.');
      return;
    }

    if (selectedPlan.id === 'enterprise') {
      toast.info('Please contact sales for Enterprise plans.');
      return;
    }

    if (selectedPlan.id === 'free') {
      try {
        setLoadingPlanId(selectedPlan.id);
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        await subscriptionService.createSubscription(user.id, 'free', expiryDate.toISOString(), 0);
        toast.success('Free plan activated.');
        navigate(ROUTES.RECRUITER_DASHBOARD);
      } catch (error) {
        console.error(error);
        toast.error('Failed to activate free plan.');
      } finally {
        setLoadingPlanId(null);
      }
      return;
    }

    if (!selectedPlan.price) {
      toast.info('Please contact sales for Enterprise plans.');
      return;
    }

    try {
      setLoadingPlanId(selectedPlan.id);
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      const subscription = await subscriptionService.createSubscription(
        user.id,
        selectedPlan.id,
        expiryDate.toISOString(),
        selectedPlan.price,
        `razorpay_placeholder_${Date.now()}`
      );

      await paymentService.createPayment(user.id, subscription.id, selectedPlan.price, 'razorpay');

      toast.success('Subscription created successfully.');
      navigate(ROUTES.RECRUITER_DASHBOARD);
    } catch (err) {
      console.error('Subscription error:', err);
      toast.error('Failed to complete subscription.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const currentPlanName = String(currentSubscription?.plan || 'free').toUpperCase();
  const currentPlanHasUnlimited = isUnlimitedPlan(currentSubscription?.plan);

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Paper
          sx={{
            mb: 3,
            p: { xs: 2.2, md: 3.2 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            background:
              'radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.22), transparent 40%), radial-gradient(circle at 85% 18%, rgba(14, 165, 233, 0.20), transparent 42%), linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.94))',
            color: '#F8FAFC',
            boxShadow: '0 30px 70px rgba(15, 23, 42, 0.22)',
          }}
        >
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WorkspacePremiumIcon sx={{ color: '#6EE7B7' }} />
                <Typography variant="overline" sx={{ color: 'rgba(209, 250, 229, 0.95)', letterSpacing: 1.1 }}>
                  Recruiter Billing Console
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.7rem', md: '2.3rem' }, mb: 1 }}>
                Subscription & AutoPay
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(226, 232, 240, 0.93)', maxWidth: 740 }}>
                Manage recruiter plans, renewals, and billing controls in one place with a clean and secure workflow.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(148, 163, 184, 0.35)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(209, 250, 229, 0.92)' }}>Current Plan</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.4 }}>{currentPlanName}</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.9)' }}>
                  {currentPlanHasUnlimited ? 'Unlimited unlock benefits active' : 'Standard resume unlock benefits active'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        <Paper
          sx={{
            mb: 3,
            p: { xs: 1.8, md: 2.4 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, #FFFFFF, #F8FFFC)',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutorenewIcon color="success" />
                AutoPay & Billing Protection
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Enable AutoPay to renew your subscription automatically before expiry and avoid hiring interruptions.
              </Typography>
              <Alert severity={autoPayEnabled ? 'success' : 'info'} sx={{ mt: 1 }}>
                {autoPayEnabled
                  ? 'AutoPay is ON. Your plan will renew automatically at billing time.'
                  : 'AutoPay is OFF. You will need to renew the plan manually.'}
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoPayEnabled}
                      onChange={(event) => handleAutoPayToggle(event.target.checked)}
                      color="success"
                      disabled={autoPaySaving}
                    />
                  }
                  label={autoPaySaving ? 'Saving...' : autoPayEnabled ? 'AutoPay Enabled' : 'Enable AutoPay'}
                  sx={{ mr: 0 }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: { xs: 'left', md: 'right' }, mt: 0.8 }}>
                <SecurityIcon sx={{ fontSize: 14, mr: 0.6, verticalAlign: 'text-bottom' }} />
                Billing preference is securely saved.
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Choose Recruiter Plan
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 760, mx: 'auto' }}>
            Pick a plan that matches your hiring volume. Switch anytime with seamless billing.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {plans.map((plan) => {
            const isActive = currentSubscription?.plan === plan.id;
            const isSelected = selectedPlanId === plan.id;
            const isBusy = loadingPlanId === plan.id;

            return (
              <Grid item xs={12} md={4} key={plan.id}>
                <Card
                  sx={{
                    borderRadius: 3.2,
                    boxShadow: plan.recommended ? '0 28px 62px rgba(16, 185, 129, 0.20)' : '0 16px 36px rgba(15, 23, 42, 0.08)',
                    border: isSelected
                      ? '2px solid rgba(16, 185, 129, 0.45)'
                      : plan.recommended
                      ? '1px solid rgba(16, 185, 129, 0.35)'
                      : '1px solid rgba(226, 232, 240, 1)',
                    background: plan.recommended ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.08), #FFFFFF)' : '#FFFFFF',
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {plan.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.8 }}>
                        {plan.recommended ? <Chip label="Most Popular" color="success" size="small" /> : null}
                        {isActive ? <Chip label="Active" color="primary" size="small" /> : null}
                      </Box>
                    </Box>

                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                      {plan.priceLabel}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                      {plan.description}
                    </Typography>

                    <Divider sx={{ mb: 3 }} />

                    <Box sx={{ mb: 3.2, flex: 1 }}>
                      {plan.features.map((feature) => (
                        <Typography key={feature} variant="body2" sx={{ mb: 1.05, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18, mr: 0.8 }} /> {feature}
                        </Typography>
                      ))}
                    </Box>

                    <Stack spacing={1.2}>
                      <Button
                        fullWidth
                        size="large"
                        variant={isSelected ? 'contained' : 'outlined'}
                        color={isSelected ? 'success' : 'inherit'}
                        onClick={() => setSelectedPlanId(plan.id)}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        {isSelected ? 'Selected Plan' : 'Select Plan'}
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={isActive || isBusy || plan.priceLabel === 'Contact Sales'}
                        onClick={() => handleBuy(plan.id)}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        {isBusy ? <CircularProgress size={20} color="inherit" /> : isActive ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : `Buy ${plan.name}`}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Layout>
  );
};
