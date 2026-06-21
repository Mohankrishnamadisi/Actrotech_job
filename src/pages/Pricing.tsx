import React, { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Paper,
  Divider,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_GATEWAY_FEE_PERCENT, SUBSCRIPTION_GST_PERCENT } from '@constants/index';
import { formatCurrency } from '@utils/index';
import { useAuthStore } from '@store/index';
import { subscriptionService, paymentService } from '@services/api';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@constants/index';
import toast from 'react-hot-toast';

export const Pricing: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState(SUBSCRIPTION_PLANS[0]?.id || 'basic');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'phonepe' | 'credit_card' | 'upi'>('razorpay');
  const [loading, setLoading] = useState(false);

  const selectedPlan = useMemo(
    () => SUBSCRIPTION_PLANS.find((plan) => plan.id === selectedPlanId) ?? SUBSCRIPTION_PLANS[0],
    [selectedPlanId]
  );

  const gatewayFee = useMemo(
    () => Math.round((selectedPlan.price * SUBSCRIPTION_GATEWAY_FEE_PERCENT) / 100),
    [selectedPlan.price]
  );

  const gstAmount = useMemo(
    () => Math.round(((selectedPlan.price + gatewayFee) * SUBSCRIPTION_GST_PERCENT) / 100),
    [selectedPlan.price, gatewayFee]
  );

  const totalAmount = useMemo(
    () => selectedPlan.price + gatewayFee + gstAmount,
    [selectedPlan.price, gatewayFee, gstAmount]
  );

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please login to subscribe.');
      navigate(ROUTES.LOGIN);
      return;
    }

    setLoading(true);
    try {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + selectedPlan.durationMonths);

      const subscription = await subscriptionService.createSubscription(
        user.id,
        selectedPlan.id,
        expiryDate.toISOString()
      );

      await paymentService.createPayment(user.id, subscription.id, totalAmount, paymentMethod);

      toast.success('Subscription successful! Your premium access is now active.');
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to complete subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { name: 'Access to Onsite jobs', free: true, basic: true, premium: true, pro: true },
    { name: 'View job details', free: true, basic: true, premium: true, pro: true },
    { name: 'Save jobs', free: false, basic: '5 jobs', premium: 'Unlimited', pro: 'Unlimited' },
    { name: 'Access to Remote jobs', free: false, basic: false, premium: true, pro: true },
    { name: 'Access to Hybrid jobs', free: false, basic: false, premium: true, pro: true },
    { name: 'Email notifications', free: false, basic: true, premium: true, pro: true },
    { name: 'Apply without resume upload', free: false, basic: false, premium: true, pro: true },
    { name: 'Weekly job digest', free: false, basic: false, premium: true, pro: true },
    { name: 'Priority job recommendations', free: false, basic: false, premium: true, pro: true },
    { name: 'Early access to new jobs', free: false, basic: false, premium: false, pro: true },
    { name: 'Mock interview sessions', free: false, basic: false, premium: false, pro: true },
    { name: '1-on-1 career coaching', free: false, basic: false, premium: false, pro: true },
    { name: 'Resume review & optimization', free: false, basic: false, premium: false, pro: true },
    { name: 'Portfolio building assistance', free: false, basic: false, premium: false, pro: true },
  ];

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Header */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 8,
            p: 4,
            borderRadius: 4,
            background: 'radial-gradient(circle at top, rgba(59,130,246,0.12), transparent 34%), radial-gradient(circle at bottom right, rgba(245,158,11,0.12), transparent 32%)',
            border: '1px solid rgba(37, 99, 235, 0.12)',
          }}
        >
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Simple, Transparent Pricing
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', maxWidth: 720, mx: 'auto' }}>
            Choose the plan that's right for your next career move. Upgrade to unlock premium job matches, priority application support, and career coaching.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 8 }}>
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <Grid item xs={12} sm={6} key={plan.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      border: plan.recommended ? '2px solid' : '1px solid',
                      borderColor: plan.recommended ? 'primary.main' : 'divider',
                      transform: plan.recommended ? 'scale(1.03)' : 'scale(1)',
                      borderRadius: 4,
                      background: plan.recommended ? 'linear-gradient(180deg, rgba(37,99,235,0.08), #FFFFFF)' : '#FFFFFF',
                      boxShadow: plan.recommended ? '0 24px 60px rgba(37,99,235,0.14)' : '0 12px 32px rgba(15,23,42,0.08)',
                    }}
                  >
                    {plan.recommended && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#1D4ED8',
                          color: '#FFFFFF',
                          px: 2,
                          py: 0.5,
                          borderRadius: '16px',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Most Popular
                        </Typography>
                      </Box>
                    )}

                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: plan.recommended ? 3 : 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        {plan.name}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                        {plan.durationLabel}
                      </Typography>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', display: 'inline' }}>
                          ₹{plan.price}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                          /{plan.period}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 3, flex: 1 }}>
                        {plan.features.map((feature) => (
                          <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                            <Typography variant="body2">{feature}</Typography>
                          </Box>
                        ))}
                      </Box>

                      <Button
                        variant={selectedPlanId === plan.id ? 'contained' : 'outlined'}
                        fullWidth
                        onClick={() => setSelectedPlanId(plan.id)}
                        color="primary"
                        sx={{
                          textTransform: 'none',
                          py: 1.3,
                          fontWeight: 700,
                          ...(selectedPlanId === plan.id && {
                            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                            color: '#FFFFFF',
                          }),
                        }}
                      >
                        {selectedPlanId === plan.id ? `Selected ${plan.name}` : `Choose ${plan.name}`}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
            sx={{
              p: 3,
              position: 'sticky',
              top: 24,
              borderRadius: 4,
              border: '1px solid rgba(37, 99, 235, 0.12)',
              boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
              background: '#FFFFFF',
            }}
            elevation={3}
          >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Checkout Summary
              </Typography>

              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                Plan selected
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                {selectedPlan.name} • {selectedPlan.durationLabel}
              </Typography>

              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                Payment method
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as any)}
                >
                  <FormControlLabel value="razorpay" control={<Radio />} label="Razorpay" />
                  <FormControlLabel value="phonepe" control={<Radio />} label="PhonePe" />
                  <FormControlLabel value="upi" control={<Radio />} label="UPI" />
                  <FormControlLabel value="credit_card" control={<Radio />} label="Credit / Debit Card" />
                </RadioGroup>
              </FormControl>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Base price</Typography>
                <Typography variant="body2">{formatCurrency(selectedPlan.price)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Gateway fee ({SUBSCRIPTION_GATEWAY_FEE_PERCENT}%)</Typography>
                <Typography variant="body2">{formatCurrency(gatewayFee)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">GST ({SUBSCRIPTION_GST_PERCENT}%)</Typography>
                <Typography variant="body2">{formatCurrency(gstAmount)}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(totalAmount)}</Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSubscribe}
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 14px 30px rgba(37, 99, 235, 0.18)',
                  textTransform: 'none',
                }}
              >
                {loading ? 'Processing...' : `Subscribe for ₹${totalAmount}`}
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Comparison Table */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            Detailed Comparison
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Free
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Basic
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Premium
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Pro
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {features.map((feature) => (
                  <TableRow key={feature.name}>
                    <TableCell>{feature.name}</TableCell>
                    <TableCell align="center">
                      {feature.free === true ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : feature.free === false ? (
                        '—'
                      ) : (
                        <Typography variant="body2">{feature.free}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {feature.basic === true ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : feature.basic === false ? (
                        '—'
                      ) : (
                        <Typography variant="body2">{feature.basic}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {feature.premium === true ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : feature.premium === false ? (
                        '—'
                      ) : (
                        <Typography variant="body2">{feature.premium}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {feature.pro === true ? (
                        <CheckCircleIcon sx={{ color: 'success.main' }} />
                      ) : feature.pro === false ? (
                        '—'
                      ) : (
                        <Typography variant="body2">{feature.pro}</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* FAQ */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Have questions?
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Check our FAQ or contact our support team at support@actrojobs.com
          </Typography>
        </Box>
      </Container>
    </Layout>
  );
};
