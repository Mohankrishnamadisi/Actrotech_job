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
  Chip,
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
import { PaymentSection } from '@components/payments/PaymentSection';
import { PaymentModal } from '@components/payments/PaymentModal';

export const Pricing: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState(SUBSCRIPTION_PLANS[0]?.id || 'basic');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'phonepe' | 'credit_card' | 'upi'>('razorpay');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    toast.success('Subscription successful! Your premium access is now active.');
    setTimeout(() => {
      navigate(ROUTES.DASHBOARD);
    }, 1500);
  };

  const features = [
    // Job Access Features
    { category: 'Job Access', name: 'Access to Onsite jobs', basic: true, premium: true, pro: true },
    { category: 'Job Access', name: 'Access to Remote & Hybrid jobs', basic: false, premium: true, pro: true },
    { category: 'Job Access', name: 'Early access to new jobs', basic: false, premium: false, pro: true },
    
    // Application Features
    { category: 'Applications', name: 'Save jobs', basic: '5 jobs', premium: 'Unlimited', pro: 'Unlimited' },
    { category: 'Applications', name: 'Apply without resume upload', basic: false, premium: true, pro: true },
    { category: 'Applications', name: 'Bulk apply feature', basic: false, premium: false, pro: true },
    
    // Recommendations & Matching
    { category: 'Recommendations', name: 'Job recommendations', basic: false, premium: true, pro: true },
    { category: 'Recommendations', name: 'Priority job recommendations', basic: false, premium: true, pro: true },
    { category: 'Recommendations', name: 'AI Matched Jobs (Dashboard)', basic: false, premium: true, pro: true },
    { category: 'Recommendations', name: 'Personalized job matching', basic: false, premium: false, pro: true },
    
    // Dashboard & Tools
    { category: 'Premium Dashboard', name: 'Remote Hub access', basic: false, premium: true, pro: true },
    { category: 'Premium Dashboard', name: 'Premium Command Deck', basic: false, premium: true, pro: true },
    { category: 'Premium Dashboard', name: 'Profile visibility boost', basic: false, premium: true, pro: true },
    
    // Communication
    { category: 'Communication', name: 'Email notifications', basic: true, premium: true, pro: true },
    { category: 'Communication', name: 'Weekly job digest', basic: false, premium: true, pro: true },
    { category: 'Communication', name: 'Direct recruiter messaging', basic: false, premium: true, pro: true },
    
    // Career Tools (Pro Only)
    { category: 'Career Tools', name: 'Mock interview sessions', basic: false, premium: false, pro: true },
    { category: 'Career Tools', name: '1-on-1 career coaching', basic: false, premium: false, pro: true },
    { category: 'Career Tools', name: 'Resume review & optimization', basic: false, premium: false, pro: true },
    { category: 'Career Tools', name: 'Portfolio building assistance', basic: false, premium: false, pro: true },
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

        {/* Plan Selection */}
        <Box sx={{ mb: 8, width: '80%', mx: 'auto', px: { xs: 2, sm: 3, md: 0 } }}>
          <Grid container spacing={3}>
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: plan.recommended ? '2px solid' : '1px solid',
                    borderColor: plan.recommended ? 'primary.main' : 'divider',
                    transform: plan.recommended ? 'scale(1.02)' : 'scale(1)',
                    borderRadius: 4,
                    background: plan.recommended ? 'linear-gradient(180deg, rgba(37,99,235,0.08), #FFFFFF)' : '#FFFFFF',
                    boxShadow: plan.recommended ? '0 24px 60px rgba(37,99,235,0.14)' : '0 12px 32px rgba(15,23,42,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: plan.recommended ? '0 32px 80px rgba(37,99,235,0.2)' : '0 20px 40px rgba(15,23,42,0.12)',
                    },
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
        </Box>

        {/* Payment Section */}
        <Box sx={{ mb: 8, background: '#FFFFFF', borderRadius: 4, p: 4, boxShadow: '0 12px 32px rgba(15,23,42,0.08)' }}>
          <PaymentSection
            plan={selectedPlan}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={(error) => console.error('Payment error:', error)}
          />
        </Box>

        {/* Detailed Comparison Section */}
        <Box sx={{ mb: 8 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              📊 Detailed Feature Comparison
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 800 }}>
              Compare what you get in each plan. Choose the plan that fits your career goals and job hunting needs.
            </Typography>
          </Box>

          <TableContainer sx={{ borderRadius: 2, border: '1px solid #E5E7EB' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#FFFFFF', minWidth: 250 }}>
                    Feature
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#FFFFFF', minWidth: 120 }}>
                    Basic Plan
                    <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)' }}>
                      ₹{SUBSCRIPTION_PLANS[0].price} / {SUBSCRIPTION_PLANS[0].durationLabel}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#FFFFFF', minWidth: 120, background: 'rgba(255,255,255,0.1)' }}>
                    Premium Plan
                    <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)' }}>
                      ₹{SUBSCRIPTION_PLANS[1].price} / {SUBSCRIPTION_PLANS[1].durationLabel}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#FFFFFF', minWidth: 120 }}>
                    Pro Plan
                    <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)' }}>
                      ₹{SUBSCRIPTION_PLANS[2].price} / {SUBSCRIPTION_PLANS[2].durationLabel}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const categories = [...new Set(features.map(f => f.category))];
                  let rowIndex = 0;
                  return categories.map((category) => {
                    const categoryFeatures = features.filter(f => f.category === category);
                    return [
                      // Category header row
                      <TableRow key={`category-${category}`} sx={{ backgroundColor: '#F8F9FA' }}>
                        <TableCell colSpan={4} sx={{ fontWeight: 700, color: '#1F2937', fontSize: '0.95rem', py: 1.5 }}>
                          {category}
                        </TableCell>
                      </TableRow>,
                      // Feature rows
                      ...categoryFeatures.map((feature) => (
                        <TableRow
                          key={feature.name}
                          sx={{
                            '&:hover': { backgroundColor: '#FAFBFC' },
                            borderBottom: '1px solid #E5E7EB',
                          }}
                        >
                          <TableCell sx={{ color: '#1F2937', fontWeight: 500 }}>
                            {feature.name}
                          </TableCell>
                          <TableCell align="center">
                            {feature.basic === true ? (
                              <CheckCircleIcon sx={{ color: '#10B981', fontSize: 24 }} />
                            ) : feature.basic === false ? (
                              <Typography sx={{ color: '#9CA3AF', fontWeight: 600 }}>—</Typography>
                            ) : (
                              <Chip
                                label={feature.basic}
                                size="small"
                                sx={{
                                  background: '#DBEAFE',
                                  color: '#1E40AF',
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              backgroundColor: 'rgba(102, 126, 234, 0.04)',
                            }}
                          >
                            {feature.premium === true ? (
                              <CheckCircleIcon sx={{ color: '#10B981', fontSize: 24 }} />
                            ) : feature.premium === false ? (
                              <Typography sx={{ color: '#9CA3AF', fontWeight: 600 }}>—</Typography>
                            ) : (
                              <Chip
                                label={feature.premium}
                                size="small"
                                sx={{
                                  background: '#DCFCE7',
                                  color: '#15803D',
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {feature.pro === true ? (
                              <CheckCircleIcon sx={{ color: '#10B981', fontSize: 24 }} />
                            ) : feature.pro === false ? (
                              <Typography sx={{ color: '#9CA3AF', fontWeight: 600 }}>—</Typography>
                            ) : (
                              <Chip
                                label={feature.pro}
                                size="small"
                                sx={{
                                  background: '#FEE2E2',
                                  color: '#991B1B',
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      )),
                    ];
                  });
                })()}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pricing Summary */}
          <Box sx={{ mt: 4, p: 3, background: 'linear-gradient(135deg, #F0F4FF 0%, #F5F3FF 100%)', borderRadius: 2, border: '1px solid #DBEAFE' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    Basic Plan
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#667eea', fontWeight: 800, mb: 0.5 }}>
                    ₹149
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
                    1 Month Access
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#10B981', fontWeight: 600, mt: 1 }}>
                    ✓ Best for Starting Out
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#FFFFFF',
                    borderRadius: 2,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#FFFFFF',
                      color: '#667eea',
                      px: 2,
                      py: 0.5,
                      borderRadius: '16px',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  >
                    MOST POPULAR
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, mt: 1 }}>
                    Premium Plan
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                    ₹269
                  </Typography>
                  <Typography variant="caption">
                    2 Months Access
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mt: 1 }}>
                    ✓ Best Overall Value
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    Pro Plan
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#667eea', fontWeight: 800, mb: 0.5 }}>
                    ₹399
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
                    3 Months Access
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#10B981', fontWeight: 600, mt: 1 }}>
                    ✓ Full Career Support
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Chip
                    label="✨ Premium Features"
                    sx={{
                      background: '#DCFCE7',
                      color: '#15803D',
                      fontWeight: 700,
                      height: 'auto',
                      p: 1,
                      mb: 1,
                    }}
                  />
                  <Typography variant="caption" sx={{ display: 'block', color: '#6B7280', mt: 1 }}>
                    What You Get:
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#1F2937', fontWeight: 600, mt: 0.5 }}>
                    • Premium Dashboard
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#1F2937', fontWeight: 600 }}>
                    • Career Tools
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#1F2937', fontWeight: 600 }}>
                    • 1-on-1 Coaching
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
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

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        plan={selectedPlan}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </Layout>
  );
};
