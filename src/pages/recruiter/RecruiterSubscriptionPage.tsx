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
} from '@mui/material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { subscriptionService, paymentService } from '@services/api';
import { ROUTES } from '@constants/index';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const plans = [
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
  const [loading, setLoading] = useState(false);

  const [currentSubscription, setCurrentSubscription] = useState<any | null>(null);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) return;
      try {
        const subscription = await subscriptionService.getUserSubscription(user.id);
        setCurrentSubscription(subscription);
      } catch (err) {
        console.error('Failed to load subscription:', err);
      }
    };
    loadSubscription();
  }, [user]);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[1];

  const handleBuy = async () => {
    if (!user) {
      toast.error('Please log in to manage subscriptions.');
      navigate(ROUTES.LOGIN);
      return;
    }

    if (currentSubscription?.plan === selectedPlanId) {
      toast.success('You are already on this plan.');
      return;
    }

    if (selectedPlanId === 'enterprise') {
      toast.info('Please contact sales for Enterprise plans.');
      return;
    }

    if (selectedPlanId === 'free') {
      try {
        setLoading(true);
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        await subscriptionService.createSubscription(user.id, 'free', expiryDate.toISOString(), 0);
        toast.success('Free plan activated.');
        navigate(ROUTES.RECRUITER_DASHBOARD);
      } catch (error) {
        console.error(error);
        toast.error('Failed to activate free plan.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!selectedPlan.price) {
      toast.info('Please contact sales for Enterprise plans.');
      return;
    }

    try {
      setLoading(true);
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      const subscription = await subscriptionService.createSubscription(
        user.id,
        selectedPlanId,
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
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            Subscription Plans
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 720, mx: 'auto' }}>
            Choose the right subscription for your hiring team and unlock seamless candidate access.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {plans.map((plan) => {
            const isActive = currentSubscription?.plan === plan.id;
            return (
              <Grid item xs={12} md={4} key={plan.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: plan.recommended ? '0 28px 70px rgba(37, 99, 235, 0.16)' : '0 16px 36px rgba(15, 23, 42, 0.08)',
                    border: plan.recommended ? '1px solid rgba(37, 99, 235, 0.24)' : '1px solid rgba(226, 232, 240, 1)',
                    background: plan.recommended ? 'linear-gradient(180deg, rgba(59,130,246,0.08), #FFFFFF)' : '#FFFFFF',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {plan.name}
                      </Typography>
                      {plan.recommended && (
                        <Chip label="Most Popular" color="primary" size="small" />
                      )}
                    </Box>

                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                      {plan.priceLabel}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                      {plan.description}
                    </Typography>

                    <Divider sx={{ mb: 3 }} />

                    <Box sx={{ mb: 4 }}>
                      {plan.features.map((feature) => (
                        <Typography key={feature} variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          • {feature}
                        </Typography>
                      ))}
                    </Box>

                    <Button
                      fullWidth
                      size="large"
                      variant={isActive ? 'contained' : 'outlined'}
                      color={isActive ? 'primary' : 'inherit'}
                      onClick={() => setSelectedPlanId(plan.id)}
                      sx={{ mb: 2, textTransform: 'none' }}
                    >
                      {isActive ? 'Current Plan' : plan.priceLabel === 'Contact Sales' ? 'Contact Sales' : `Upgrade to ${plan.name}`}
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      disabled={isActive || loading || plan.priceLabel === 'Contact Sales'}
                      onClick={handleBuy}
                      sx={{ textTransform: 'none' }}
                    >
                      {loading ? <CircularProgress size={20} color="inherit" /> : isActive ? 'Current Plan' : 'Choose Plan'}
                    </Button>
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
