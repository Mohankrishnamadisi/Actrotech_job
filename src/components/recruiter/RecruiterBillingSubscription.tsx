import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AccountBalanceWallet as BillingIcon,
  AutoGraph as ReportsIcon,
  Autorenew as RenewIcon,
  Download as DownloadIcon,
  LocalOffer as CouponIcon,
  ReceiptLong as InvoiceIcon,
  Payments as PaymentIcon,
  Upgrade as UpgradeIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { themeColors } from '@styles/recruiterTheme';
import {
  billingSubscriptionService,
  type BillingCycle,
  type CreditWalletType,
  type PaymentMethod,
  type PlanId,
} from '@services/billingSubscription';
import { teamManagementService } from '@services/teamManagement';

interface RecruiterBillingSubscriptionProps {
  ownerId: string;
  currentUserId: string;
}

type BillingTab =
  | 'overview'
  | 'plans'
  | 'subscription'
  | 'credits'
  | 'purchase'
  | 'payments'
  | 'invoices'
  | 'usage'
  | 'alerts'
  | 'coupons'
  | 'trial'
  | 'enterprise'
  | 'organization'
  | 'allocation'
  | 'promotion'
  | 'featured'
  | 'refunds'
  | 'taxes'
  | 'notifications'
  | 'reports';

const MotionBox = motion(Box);

const taxTypeOptions = ['GST', 'VAT', 'Sales Tax'] as const;

const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'credit_debit_card', label: 'Credit/Debit Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'stripe', label: 'Stripe (future ready)' },
  { value: 'manual_invoice', label: 'Manual Invoice (Enterprise)' },
];

const formatDate = (value?: string): string => {
  if (!value) return '-';
  try {
    return format(new Date(value), 'dd MMM yyyy');
  } catch {
    return '-';
  }
};

const downloadText = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const usageBar = (label: string, value: number, maxValue: number, color: string) => {
  const pct = maxValue > 0 ? Math.min(100, Math.round((value / maxValue) * 100)) : 0;
  return (
    <Box sx={{ mb: 1.2 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{value}</Typography>
      </Stack>
      <Box sx={{ height: 8, borderRadius: 999, backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', backgroundColor: color }} />
      </Box>
    </Box>
  );
};

const statCard = (title: string, value: string | number, color = '#1D4ED8') => (
  <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
    <CardContent>
      <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{title}</Typography>
      <Typography variant="h6" sx={{ mt: 0.6, fontWeight: 800, color }}>{value}</Typography>
    </CardContent>
  </Card>
);

export const RecruiterBillingSubscription: React.FC<RecruiterBillingSubscriptionProps> = ({ ownerId, currentUserId }) => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [tab, setTab] = useState<BillingTab>('overview');

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('starter');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const [couponCode, setCouponCode] = useState('');
  const [purchaseWalletType, setPurchaseWalletType] = useState<CreditWalletType>('ai');
  const [purchasePackageId, setPurchasePackageId] = useState('ai_100');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');

  const [couponForm, setCouponForm] = useState({
    code: 'WELCOME20',
    discountPercent: '20',
    flatDiscount: '',
    expiry: new Date(Date.now() + 86400000 * 45).toISOString().slice(0, 10),
    usageLimit: '100',
    minimumPurchase: '1000',
  });

  const [taxValues, setTaxValues] = useState({ gstPercent: 18, vatPercent: 0, salesTaxPercent: 0, currency: 'INR' as 'INR' | 'USD' | 'EUR' });

  const [allocationToUser, setAllocationToUser] = useState('');
  const [allocationType, setAllocationType] = useState<CreditWalletType>('ai');
  const [allocationAmount, setAllocationAmount] = useState('25');

  const [orgLimitUser, setOrgLimitUser] = useState('');
  const [orgLimitForm, setOrgLimitForm] = useState({
    monthlySpendLimit: '20000',
    aiRequestLimit: '500',
    resumeUnlockLimit: '300',
    promotionCreditLimit: '100',
    automationCreditLimit: '200',
  });

  const [promotionJobId, setPromotionJobId] = useState('job_1');
  const [promotionDays, setPromotionDays] = useState('7');

  const [refundPaymentId, setRefundPaymentId] = useState('');
  const [refundReason, setRefundReason] = useState('Duplicate purchase by mistake');

  const plans = billingSubscriptionService.getPlanCatalog();
  const access = teamManagementService.getAccessContext(ownerId, currentUserId);
  const canManageBilling = billingSubscriptionService.canManageBilling(ownerId, currentUserId);

  const subscription = billingSubscriptionService.getSubscription(ownerId);
  const currentPlan = billingSubscriptionService.getPlan(subscription.planId);
  const wallets = billingSubscriptionService.getWallets(ownerId, currentUserId);
  const ownerWallets = billingSubscriptionService.getWallets(ownerId, ownerId);
  const allOwnerWallets = billingSubscriptionService.getAllWalletsForOwner(ownerId);
  const walletLabelMap = billingSubscriptionService.getWalletLabelMap();

  const packagesForType = billingSubscriptionService.getCreditPackages(purchaseWalletType);
  const coupons = billingSubscriptionService.listCoupons(ownerId);
  const invoices = billingSubscriptionService.getInvoices(ownerId);
  const payments = billingSubscriptionService.getPayments(ownerId);
  const refunds = billingSubscriptionService.listRefunds(ownerId);
  const notifications = billingSubscriptionService.listNotifications(ownerId);
  const taxConfig = billingSubscriptionService.getTaxConfig(ownerId);
  const trial = billingSubscriptionService.getTrialStatus(ownerId);
  const enterprise = billingSubscriptionService.getEnterpriseBilling(ownerId);
  const members = teamManagementService.listMembers(ownerId).filter((m) => m.status !== 'inactive');
  const orgLimits = billingSubscriptionService.listOrganizationLimits(ownerId);
  const allocationLedger = billingSubscriptionService.getAllocationLedger(ownerId);
  const promotions = billingSubscriptionService.listPromotions(ownerId);

  const purchasePreview = useMemo(() => {
    try {
      return billingSubscriptionService.calculatePurchasePreview(ownerId, purchasePackageId, couponCode || undefined);
    } catch {
      return {
        subTotal: 0,
        discount: 0,
        taxableAmount: 0,
        taxAmount: 0,
        total: 0,
        currency: 'INR',
      };
    }
  }, [ownerId, purchasePackageId, couponCode]);

  useEffect(() => {
    billingSubscriptionService.initialize(ownerId, currentUserId);
    setTaxValues({
      gstPercent: taxConfig.gstPercent,
      vatPercent: taxConfig.vatPercent,
      salesTaxPercent: taxConfig.salesTaxPercent,
      currency: taxConfig.currency,
    });
  }, [ownerId, currentUserId]);

  const refreshUsage = async (): Promise<void> => {
    setLoading(true);
    try {
      const [ov, usg] = await Promise.all([
        billingSubscriptionService.getBillingOverview(ownerId, currentUserId),
        billingSubscriptionService.getUsageSnapshot(ownerId),
      ]);
      setOverview(ov);
      setUsage(usg);
    } catch (error) {
      console.error('billing refresh failed', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsage();
  }, [ownerId, currentUserId]);

  useEffect(() => {
    if (!allocationToUser && members.length > 0) {
      setAllocationToUser(members[0].userId || ownerId);
    }
    if (!orgLimitUser && members.length > 0) {
      setOrgLimitUser(members[0].userId || ownerId);
    }
  }, [members, allocationToUser, orgLimitUser, ownerId]);

  const ensureManage = (): boolean => {
    if (canManageBilling) return true;
    toast.error('Only Company Owner and Billing Admin can manage billing actions');
    return false;
  };

  const runPlanChange = (action: 'upgrade' | 'downgrade') => {
    if (!ensureManage()) return;
    billingSubscriptionService.updateSubscription(ownerId, action, {
      planId: selectedPlan,
      billingCycle,
      autoRenewal: true,
    });
    toast.success(`Subscription ${action} successful`);
    refreshUsage();
  };

  const runSubscriptionAction = (action: 'cancel' | 'pause' | 'resume') => {
    if (!ensureManage()) return;
    billingSubscriptionService.updateSubscription(ownerId, action);
    toast.success(`Subscription ${action} successful`);
    refreshUsage();
  };

  const buyCredits = () => {
    if (!ensureManage()) return;
    try {
      billingSubscriptionService.purchaseCredits(ownerId, ownerId, {
        packageId: purchasePackageId,
        method: paymentMethod,
        couponCode: couponCode || undefined,
      });
      toast.success('Credit purchase successful');
      refreshUsage();
    } catch (error: any) {
      toast.error(error?.message || 'Purchase failed');
    }
  };

  const createCoupon = () => {
    if (!ensureManage()) return;
    billingSubscriptionService.createCoupon(ownerId, {
      code: couponForm.code,
      discountPercent: couponForm.discountPercent ? Number(couponForm.discountPercent) : undefined,
      flatDiscount: couponForm.flatDiscount ? Number(couponForm.flatDiscount) : undefined,
      expiry: new Date(couponForm.expiry).toISOString(),
      usageLimit: Number(couponForm.usageLimit),
      minimumPurchase: Number(couponForm.minimumPurchase),
    });
    toast.success('Coupon created');
  };

  const applyTaxConfig = () => {
    if (!ensureManage()) return;
    billingSubscriptionService.updateTaxConfig(ownerId, taxValues);
    toast.success('Tax configuration updated');
  };

  const allocateCredits = () => {
    if (!ensureManage()) return;
    billingSubscriptionService.allocateCredits(ownerId, ownerId, allocationToUser, allocationType, Number(allocationAmount));
    toast.success('Credits allocated');
    refreshUsage();
  };

  const saveOrgLimit = () => {
    if (!ensureManage()) return;
    billingSubscriptionService.setOrganizationLimit(ownerId, {
      id: '',
      ownerId,
      memberUserId: orgLimitUser,
      monthlySpendLimit: Number(orgLimitForm.monthlySpendLimit),
      aiRequestLimit: Number(orgLimitForm.aiRequestLimit),
      resumeUnlockLimit: Number(orgLimitForm.resumeUnlockLimit),
      promotionCreditLimit: Number(orgLimitForm.promotionCreditLimit),
      automationCreditLimit: Number(orgLimitForm.automationCreditLimit),
    });
    toast.success('Organization monthly limits updated');
  };

  const runPromotion = (featured = false) => {
    if (!ensureManage()) return;
    try {
      billingSubscriptionService.promoteJob(ownerId, ownerId, {
        jobId: promotionJobId,
        durationDays: Number(promotionDays),
        featured,
      });
      toast.success(featured ? 'Featured listing scheduled' : 'Job promotion scheduled');
      refreshUsage();
    } catch (error: any) {
      toast.error(error?.message || 'Unable to promote job');
    }
  };

  const submitRefund = () => {
    if (!ensureManage()) return;
    if (!refundPaymentId) {
      toast.error('Select payment transaction for refund');
      return;
    }
    billingSubscriptionService.requestRefund(ownerId, refundPaymentId, refundReason);
    toast.success('Refund requested');
  };

  if (loading || !overview || !usage) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>Loading billing dashboard...</Typography>
      </Box>
    );
  }

  return (
    <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap', mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: themeColors.text.primary }}>Billing, Subscription, Credits & Invoice Management</Typography>
          <Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 0.5 }}>
            Unified billing for plans, wallets, invoices, payments, usage analytics, organization controls, and enterprise workflows.
          </Typography>
        </Box>
        <Chip color={canManageBilling ? 'success' : 'warning'} label={canManageBilling ? 'Manage Access: Owner/Billing Admin' : 'View Access: Recruiter'} />
      </Box>

      {!canManageBilling && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Recruiters can only view assigned credits and billing insights. Only Company Owner and Billing Admin can manage subscription, purchases, invoices, and payments.
        </Alert>
      )}

      <Paper sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, mb: 2 }}>
        <Tabs value={tab} onChange={(_, value: BillingTab) => setTab(value)} variant={isTablet ? 'scrollable' : 'fullWidth'} scrollButtons="auto">
          <Tab value="overview" label="Overview" />
          <Tab value="plans" label="Plans" />
          <Tab value="subscription" label="Subscription" />
          <Tab value="credits" label="Credits" />
          <Tab value="purchase" label="Purchase Credits" />
          <Tab value="payments" label="Payment Methods" />
          <Tab value="invoices" label="Invoices" />
          <Tab value="usage" label="Usage Analytics" />
          <Tab value="alerts" label="Billing Alerts" />
          <Tab value="coupons" label="Coupons" />
          <Tab value="trial" label="Free Trial" />
          <Tab value="enterprise" label="Enterprise" />
          <Tab value="organization" label="Org Billing" />
          <Tab value="allocation" label="Credit Allocation" />
          <Tab value="promotion" label="Job Promotion" />
          <Tab value="featured" label="Featured Jobs" />
          <Tab value="refunds" label="Refunds" />
          <Tab value="taxes" label="Taxes" />
          <Tab value="notifications" label="Notifications" />
          <Tab value="reports" label="Reports" />
        </Tabs>
      </Paper>

      {tab === 'overview' && (
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6} md={4}>{statCard('Current Plan', overview.currentPlan, '#1D4ED8')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('Subscription Status', overview.subscriptionStatus, '#0F766E')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('Credits Remaining', overview.creditsRemaining, '#7C3AED')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('Credits Used This Month', overview.creditsUsedThisMonth, '#D97706')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('Jobs Posted', overview.jobsPosted, '#0369A1')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('Resume Unlocks', overview.resumeUnlocks, '#C2410C')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('AI Requests Used', overview.aiRequestsUsed, '#7C2D12')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('Automation Runs', overview.automationRuns, '#0E7490')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('Next Billing Date', overview.nextBillingDate, '#2563EB')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('Monthly Spend', `INR ${overview.monthlySpend}`, '#DC2626')}</Grid>
        </Grid>
      )}

      {tab === 'plans' && (
        <Grid container spacing={1.3}>
          {plans.map((plan) => (
            <Grid item xs={12} md={6} lg={4} key={plan.id}>
              <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, height: '100%' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{plan.name}</Typography>
                    {subscription.planId === plan.id && <Chip size="small" color="success" label="Current" />}
                  </Stack>
                  <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>Monthly: INR {plan.priceMonthly} | Yearly: INR {plan.priceYearly}</Typography>
                  <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 700 }}>Limits</Typography>
                  <Typography variant="caption" display="block">Jobs: {plan.limits.jobs}</Typography>
                  <Typography variant="caption" display="block">Recruiters: {plan.limits.recruiters}</Typography>
                  <Typography variant="caption" display="block">AI Requests: {plan.limits.aiRequests}</Typography>
                  <Typography variant="caption" display="block">Resume Unlock Credits: {plan.limits.resumeUnlockCredits}</Typography>
                  <Typography variant="caption" display="block">Automation Rules: {plan.limits.automationRules}</Typography>
                  <Typography variant="caption" display="block">Storage: {plan.limits.storageGb} GB</Typography>
                  <Typography variant="caption" display="block">Integrations: {plan.limits.integrations}</Typography>
                  <Typography variant="caption" display="block">Analytics: {plan.limits.analytics}</Typography>
                  <Typography variant="caption" display="block">Support: {plan.limits.support}</Typography>

                  <Stack direction="row" spacing={0.7} sx={{ mt: 1.2, flexWrap: 'wrap' }}>
                    {plan.features.map((feature) => <Chip key={feature} size="small" label={feature} />)}
                  </Stack>

                  <Stack direction="row" spacing={0.7} sx={{ mt: 1.2 }}>
                    <Button size="small" variant="contained" startIcon={<UpgradeIcon />} onClick={() => { setSelectedPlan(plan.id); runPlanChange(plan.priceMonthly >= currentPlan.priceMonthly ? 'upgrade' : 'downgrade'); }} disabled={!canManageBilling}>Select</Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 'subscription' && (
        <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Current Subscription</Typography>
            <Grid container spacing={1.2}>
              <Grid item xs={12} md={4}>{statCard('Plan Name', currentPlan.name)}</Grid>
              <Grid item xs={12} md={4}>{statCard('Status', subscription.status)}</Grid>
              <Grid item xs={12} md={4}>{statCard('Billing Cycle', subscription.billingCycle)}</Grid>
              <Grid item xs={12} md={4}>{statCard('Start Date', formatDate(subscription.startDate))}</Grid>
              <Grid item xs={12} md={4}>{statCard('Renewal Date', formatDate(subscription.renewalDate))}</Grid>
              <Grid item xs={12} md={4}>{statCard('Auto Renewal', subscription.autoRenewal ? 'Enabled' : 'Disabled')}</Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Target Plan</InputLabel>
                  <Select value={selectedPlan} label="Target Plan" onChange={(event) => setSelectedPlan(event.target.value as PlanId)}>
                    {plans.map((plan) => <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Billing Cycle</InputLabel>
                  <Select value={billingCycle} label="Billing Cycle" onChange={(event) => setBillingCycle(event.target.value as BillingCycle)}>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                    <MenuItem value="annual_contract">Annual Contract</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                  <Typography variant="body2">Auto Renewal</Typography>
                  <Switch checked={subscription.autoRenewal} onChange={(event) => {
                    if (!ensureManage()) return;
                    billingSubscriptionService.updateSubscription(ownerId, 'resume', { autoRenewal: event.target.checked });
                    refreshUsage();
                  }} disabled={!canManageBilling} />
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button variant="contained" onClick={() => runPlanChange('upgrade')} startIcon={<UpgradeIcon />} disabled={!canManageBilling}>Upgrade</Button>
                  <Button variant="outlined" onClick={() => runPlanChange('downgrade')} disabled={!canManageBilling}>Downgrade</Button>
                  <Button variant="outlined" color="warning" onClick={() => runSubscriptionAction('pause')} disabled={!canManageBilling}>Pause</Button>
                  <Button variant="outlined" color="success" onClick={() => runSubscriptionAction('resume')} startIcon={<RenewIcon />} disabled={!canManageBilling}>Resume</Button>
                  <Button variant="outlined" color="error" onClick={() => runSubscriptionAction('cancel')} disabled={!canManageBilling}>Cancel</Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 'credits' && (
        <Grid container spacing={1.2}>
          {(canManageBilling ? ownerWallets : wallets).map((wallet) => (
            <Grid item xs={12} sm={6} md={4} key={wallet.id}>
              <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{walletLabelMap[wallet.type]}</Typography>
                  <Typography variant="body2">Available: <b>{wallet.available}</b></Typography>
                  <Typography variant="body2">Used: {wallet.used}</Typography>
                  <Typography variant="body2">Purchased: {wallet.purchased}</Typography>
                  <Typography variant="body2">Expired: {wallet.expired}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 'purchase' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Purchase Credits</Typography>
                <Stack spacing={1}>
                  <FormControl fullWidth>
                    <InputLabel>Credit Type</InputLabel>
                    <Select value={purchaseWalletType} label="Credit Type" onChange={(event) => {
                      const nextType = event.target.value as CreditWalletType;
                      setPurchaseWalletType(nextType);
                      const first = billingSubscriptionService.getCreditPackages(nextType)[0];
                      setPurchasePackageId(first?.id || '');
                    }}>
                      {(Object.keys(walletLabelMap) as CreditWalletType[]).map((type) => <MenuItem key={type} value={type}>{walletLabelMap[type]}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Package</InputLabel>
                    <Select value={purchasePackageId} label="Package" onChange={(event) => setPurchasePackageId(event.target.value)}>
                      {packagesForType.map((item) => <MenuItem key={item.id} value={item.id}>{item.name} - {item.credits} credits</MenuItem>)}
                    </Select>
                  </FormControl>

                  <TextField label="Coupon Code" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} fullWidth />

                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select value={paymentMethod} label="Payment Method" onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
                      {paymentMethodOptions.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <Card sx={{ borderRadius: 1.5, border: `1px solid ${themeColors.border}` }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total Preview</Typography>
                      <Typography variant="body2">Subtotal: {purchasePreview.currency} {purchasePreview.subTotal}</Typography>
                      <Typography variant="body2">Discount: -{purchasePreview.currency} {purchasePreview.discount}</Typography>
                      <Typography variant="body2">Tax: +{purchasePreview.currency} {purchasePreview.taxAmount}</Typography>
                      <Typography variant="h6" sx={{ mt: 0.4, fontWeight: 800 }}>Total: {purchasePreview.currency} {purchasePreview.total}</Typography>
                    </CardContent>
                  </Card>

                  <Button variant="contained" startIcon={<PaymentIcon />} onClick={buyCredits} disabled={!canManageBilling}>Proceed to Payment</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Payment Methods Supported</Typography>
                <Stack spacing={0.7}>
                  {paymentMethodOptions.map((method) => (
                    <Chip key={method.value} icon={<PaymentIcon />} label={method.label} />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 'payments' && (
        <TableContainer component={Paper} sx={{ border: `1px solid ${themeColors.border}`, borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Credits Purchased</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Invoice</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.transactionId}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>{payment.amount}</TableCell>
                  <TableCell>{payment.creditsPurchased}</TableCell>
                  <TableCell><Chip size="small" label={payment.status} color={payment.status === 'success' ? 'success' : payment.status === 'failed' ? 'error' : 'warning'} /></TableCell>
                  <TableCell>{formatDate(payment.date)}</TableCell>
                  <TableCell>{invoices.find((item) => item.id === payment.invoiceId)?.invoiceNumber || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 'invoices' && (
        <TableContainer component={Paper} sx={{ border: `1px solid ${themeColors.border}`, borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Tax</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>{invoice.tax}</TableCell>
                  <TableCell><Chip size="small" label={invoice.status} color={invoice.status === 'paid' ? 'success' : invoice.status === 'failed' ? 'error' : 'warning'} /></TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.6} justifyContent="flex-end">
                      <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => {
                        if (!ensureManage()) return;
                        const text = billingSubscriptionService.downloadInvoiceText(ownerId, invoice.id);
                        downloadText(`${invoice.invoiceNumber}.txt`, text);
                      }}>Download PDF</Button>
                      <Button size="small" variant="outlined" startIcon={<InvoiceIcon />} onClick={() => {
                        if (!ensureManage()) return;
                        billingSubscriptionService.emailInvoice(ownerId, invoice.id);
                        toast.success('Invoice emailed');
                      }}>Email Invoice</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 'usage' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Usage Analytics</Typography>
                {usageBar('Jobs Posted', usage.jobsPosted, Math.max(1, currentPlan.limits.jobs), '#1D4ED8')}
                {usageBar('Applications Received', usage.applicationsReceived, Math.max(1, usage.applicationsReceived + 10), '#0F766E')}
                {usageBar('Resume Unlocks', usage.resumeUnlocks, Math.max(1, currentPlan.limits.resumeUnlockCredits), '#C2410C')}
                {usageBar('AI Usage', usage.aiUsage, Math.max(1, currentPlan.limits.aiRequests), '#7C3AED')}
                {usageBar('Interview Usage', usage.interviewUsage, Math.max(1, usage.interviewUsage + 10), '#0E7490')}
                {usageBar('Automation Usage', usage.automationUsage, Math.max(1, currentPlan.limits.automationRules), '#D97706')}
                {usageBar('API Calls', usage.apiCalls, Math.max(1, currentPlan.limits.aiRequests * 5), '#9333EA')}
                {usageBar('Storage Used (GB)', usage.storageUsedGb, Math.max(1, currentPlan.limits.storageGb), '#0369A1')}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Feature Integration Coverage</Typography>
                <Stack spacing={0.6}>
                  <Chip label="Dashboard usage billing linked" color="success" />
                  <Chip label="Jobs usage tracked" color="success" />
                  <Chip label="Applicants tracked" color="success" />
                  <Chip label="ATS pipeline usage linked" color="success" />
                  <Chip label="Messaging credits supported" color="success" />
                  <Chip label="Interview credits supported" color="success" />
                  <Chip label="Analytics usage monitored" color="success" />
                  <Chip label="Automation runs tracked" color="success" />
                  <Chip label="AI assistant requests tracked" color="success" />
                  <Chip label="Integration API usage tracked" color="success" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 'alerts' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Billing Alerts</Typography>
                <Stack spacing={0.7}>
                  <Alert icon={<WarningIcon />} severity="warning">Credits are low.</Alert>
                  <Alert icon={<WarningIcon />} severity="warning">Subscription expires soon.</Alert>
                  <Alert severity="error">Payment failed.</Alert>
                  <Alert severity="success">Invoice generated.</Alert>
                  <Alert severity="info">Trial ending.</Alert>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Recent Notification Feed</Typography>
                <Stack spacing={0.7}>
                  {notifications.slice(0, 8).map((note) => (
                    <Alert key={note.id} severity={note.type.includes('failed') ? 'error' : note.type.includes('credits_low') ? 'warning' : 'info'}>
                      {note.message}
                    </Alert>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 'coupons' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Coupons & Promotions</Typography>
                <Stack spacing={1}>
                  <TextField label="Coupon Code" value={couponForm.code} onChange={(event) => setCouponForm((cur) => ({ ...cur, code: event.target.value.toUpperCase() }))} fullWidth />
                  <TextField label="Discount %" value={couponForm.discountPercent} onChange={(event) => setCouponForm((cur) => ({ ...cur, discountPercent: event.target.value }))} fullWidth />
                  <TextField label="Flat Discount" value={couponForm.flatDiscount} onChange={(event) => setCouponForm((cur) => ({ ...cur, flatDiscount: event.target.value }))} fullWidth />
                  <TextField label="Expiry" type="date" value={couponForm.expiry} onChange={(event) => setCouponForm((cur) => ({ ...cur, expiry: event.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
                  <TextField label="Usage Limit" value={couponForm.usageLimit} onChange={(event) => setCouponForm((cur) => ({ ...cur, usageLimit: event.target.value }))} fullWidth />
                  <TextField label="Minimum Purchase" value={couponForm.minimumPurchase} onChange={(event) => setCouponForm((cur) => ({ ...cur, minimumPurchase: event.target.value }))} fullWidth />
                  <Button variant="contained" startIcon={<CouponIcon />} onClick={createCoupon} disabled={!canManageBilling}>Create Coupon</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <TableContainer component={Paper} sx={{ border: `1px solid ${themeColors.border}`, borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Coupon Code</TableCell>
                    <TableCell>Discount %</TableCell>
                    <TableCell>Flat Discount</TableCell>
                    <TableCell>Expiry</TableCell>
                    <TableCell>Usage Limit</TableCell>
                    <TableCell>Min Purchase</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>{coupon.code}</TableCell>
                      <TableCell>{coupon.discountPercent || '-'}</TableCell>
                      <TableCell>{coupon.flatDiscount || '-'}</TableCell>
                      <TableCell>{formatDate(coupon.expiry)}</TableCell>
                      <TableCell>{coupon.usedCount}/{coupon.usageLimit}</TableCell>
                      <TableCell>{coupon.minimumPurchase}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {tab === 'trial' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={4}>{statCard('Trial Days Remaining', trial.trialDaysRemaining)}</Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Free Trial</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 700 }}>Features Available</Typography>
                <Stack direction="row" spacing={0.6} sx={{ flexWrap: 'wrap', mt: 0.6 }}>
                  {trial.featuresAvailable.map((item: string) => <Chip key={item} label={item} />)}
                </Stack>
                <Typography variant="subtitle2" sx={{ mt: 1.2, fontWeight: 700 }}>Upgrade Suggestions</Typography>
                <Stack spacing={0.6} sx={{ mt: 0.6 }}>
                  {trial.upgradeSuggestions.map((item: string) => <Alert key={item} severity="info">{item}</Alert>)}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 'enterprise' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} sm={6} md={4}>{statCard('Custom Pricing', enterprise.customPricing ? 'Enabled' : 'No')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('Annual Contracts', enterprise.annualContracts ? 'Enabled' : 'No')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('Purchase Orders', enterprise.purchaseOrders ? 'Enabled' : 'No')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('Manual Invoices', enterprise.manualInvoices ? 'Enabled' : 'No')}</Grid>
          <Grid item xs={12} sm={6} md={4}>{statCard('Dedicated Account Manager', enterprise.dedicatedAccountManager ? 'Enabled' : 'No')}</Grid>
          <Grid item xs={12}>
            <Alert severity="info">Switch to Enterprise plan to enable custom pricing, annual contracts, purchase orders, and dedicated account manager workflows.</Alert>
          </Grid>
        </Grid>
      )}

      {tab === 'organization' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Organization Billing</Typography>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 1.2 }}>
                  Company owner can view recruiter usage, allocate credits, transfer credits, set monthly limits, and approve purchases.
                </Typography>
                <TableContainer component={Paper} sx={{ border: `1px solid ${themeColors.border}` }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Total Available Credits</TableCell>
                        <TableCell>Total Used Credits</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {members.map((member) => {
                        const userKey = member.userId || ownerId;
                        const userWallets = allOwnerWallets.filter((wallet) => wallet.memberUserId === userKey);
                        const available = userWallets.reduce((sum, item) => sum + item.available, 0);
                        const used = userWallets.reduce((sum, item) => sum + item.used, 0);
                        return (
                          <TableRow key={member.id}>
                            <TableCell>{member.fullName}</TableCell>
                            <TableCell>{member.role}</TableCell>
                            <TableCell>{available}</TableCell>
                            <TableCell>{used}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 'allocation' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Credit Allocation</Typography>
                <Stack spacing={1}>
                  <FormControl fullWidth>
                    <InputLabel>Recruiter</InputLabel>
                    <Select value={allocationToUser} label="Recruiter" onChange={(event) => setAllocationToUser(event.target.value)}>
                      {members.map((member) => (
                        <MenuItem key={member.id} value={member.userId || ownerId}>{member.fullName} ({member.role})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Credit Type</InputLabel>
                    <Select value={allocationType} label="Credit Type" onChange={(event) => setAllocationType(event.target.value as CreditWalletType)}>
                      {(Object.keys(walletLabelMap) as CreditWalletType[]).map((type) => <MenuItem key={type} value={type}>{walletLabelMap[type]}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField label="Credits" value={allocationAmount} onChange={(event) => setAllocationAmount(event.target.value)} fullWidth />
                  <Button variant="contained" onClick={allocateCredits} disabled={!canManageBilling}>Assign Credits</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Transfer Ledger</Typography>
                <TableContainer component={Paper} sx={{ border: `1px solid ${themeColors.border}` }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>From</TableCell>
                        <TableCell>To</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Credits</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allocationLedger.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{formatDate(entry.at)}</TableCell>
                          <TableCell>{entry.fromUserId}</TableCell>
                          <TableCell>{entry.toUserId}</TableCell>
                          <TableCell>{walletLabelMap[entry.walletType]}</TableCell>
                          <TableCell>{entry.credits}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Set Monthly Limits</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>User</InputLabel>
                      <Select value={orgLimitUser} label="User" onChange={(event) => setOrgLimitUser(event.target.value)}>
                        {members.map((member) => <MenuItem key={member.id} value={member.userId || ownerId}>{member.fullName}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Monthly Spend" value={orgLimitForm.monthlySpendLimit} onChange={(event) => setOrgLimitForm((s) => ({ ...s, monthlySpendLimit: event.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="AI Limit" value={orgLimitForm.aiRequestLimit} onChange={(event) => setOrgLimitForm((s) => ({ ...s, aiRequestLimit: event.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Resume Limit" value={orgLimitForm.resumeUnlockLimit} onChange={(event) => setOrgLimitForm((s) => ({ ...s, resumeUnlockLimit: event.target.value }))} /></Grid>
                  <Grid item xs={12} md={2}><TextField fullWidth label="Promo Limit" value={orgLimitForm.promotionCreditLimit} onChange={(event) => setOrgLimitForm((s) => ({ ...s, promotionCreditLimit: event.target.value }))} /></Grid>
                  <Grid item xs={12} md={1}><Button fullWidth variant="contained" onClick={saveOrgLimit} disabled={!canManageBilling}>Save</Button></Grid>
                </Grid>

                <TableContainer component={Paper} sx={{ border: `1px solid ${themeColors.border}`, mt: 1.2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Monthly Spend</TableCell>
                        <TableCell>AI</TableCell>
                        <TableCell>Resume</TableCell>
                        <TableCell>Promotion</TableCell>
                        <TableCell>Automation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orgLimits.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.memberUserId}</TableCell>
                          <TableCell>{row.monthlySpendLimit}</TableCell>
                          <TableCell>{row.aiRequestLimit}</TableCell>
                          <TableCell>{row.resumeUnlockLimit}</TableCell>
                          <TableCell>{row.promotionCreditLimit}</TableCell>
                          <TableCell>{row.automationCreditLimit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 'promotion' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Job Promotion</Typography>
                <Stack spacing={1}>
                  <TextField fullWidth label="Job ID" value={promotionJobId} onChange={(event) => setPromotionJobId(event.target.value)} />
                  <TextField fullWidth label="Duration (days)" value={promotionDays} onChange={(event) => setPromotionDays(event.target.value)} />
                  <Button variant="contained" onClick={() => runPromotion(false)} disabled={!canManageBilling}>Promote Job</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <TableContainer component={Paper} sx={{ border: `1px solid ${themeColors.border}`, borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Job ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Credits</TableCell>
                    <TableCell>Impressions</TableCell>
                    <TableCell>Clicks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {promotions.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell>{promo.jobId}</TableCell>
                      <TableCell>{promo.type}</TableCell>
                      <TableCell>{promo.durationDays}</TableCell>
                      <TableCell>{promo.creditsSpent}</TableCell>
                      <TableCell>{promo.impressions}</TableCell>
                      <TableCell>{promo.clicks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {tab === 'featured' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Featured Jobs</Typography>
                <Stack spacing={1}>
                  <TextField fullWidth label="Job ID" value={promotionJobId} onChange={(event) => setPromotionJobId(event.target.value)} />
                  <TextField fullWidth label="Featured Duration (days)" value={promotionDays} onChange={(event) => setPromotionDays(event.target.value)} />
                  <Button variant="contained" onClick={() => runPromotion(true)} disabled={!canManageBilling}>Purchase Featured Listing</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Featured Performance</Typography>
                <TableContainer component={Paper} sx={{ border: `1px solid ${themeColors.border}` }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Job ID</TableCell>
                        <TableCell>Start</TableCell>
                        <TableCell>End</TableCell>
                        <TableCell>Impressions</TableCell>
                        <TableCell>Clicks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {promotions.filter((p) => p.type === 'featured').map((promo) => (
                        <TableRow key={promo.id}>
                          <TableCell>{promo.jobId}</TableCell>
                          <TableCell>{formatDate(promo.startsAt)}</TableCell>
                          <TableCell>{formatDate(promo.endsAt)}</TableCell>
                          <TableCell>{promo.impressions}</TableCell>
                          <TableCell>{promo.clicks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 'refunds' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Refund Management</Typography>
                <Stack spacing={1}>
                  <FormControl fullWidth>
                    <InputLabel>Transaction</InputLabel>
                    <Select value={refundPaymentId} label="Transaction" onChange={(event) => setRefundPaymentId(event.target.value)}>
                      {payments.map((payment) => <MenuItem key={payment.id} value={payment.id}>{payment.transactionId} - {payment.amount}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField fullWidth multiline minRows={3} label="Reason" value={refundReason} onChange={(event) => setRefundReason(event.target.value)} />
                  <Button variant="contained" onClick={submitRefund} disabled={!canManageBilling}>Request Refund</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <TableContainer component={Paper} sx={{ border: `1px solid ${themeColors.border}`, borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {refunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell>{payments.find((p) => p.id === refund.transactionId)?.transactionId || refund.transactionId}</TableCell>
                      <TableCell>{refund.amount}</TableCell>
                      <TableCell><Chip size="small" label={refund.status} color={refund.status === 'processed' || refund.status === 'approved' ? 'success' : refund.status === 'rejected' ? 'error' : 'warning'} /></TableCell>
                      <TableCell>{refund.reason}</TableCell>
                      <TableCell>{formatDate(refund.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {tab === 'taxes' && (
        <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Taxes</Typography>
            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 1.2 }}>
              Configurable taxes: {taxTypeOptions.join(', ')} and tax invoice generation.
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} md={3}><TextField fullWidth label="GST %" value={taxValues.gstPercent} onChange={(event) => setTaxValues((cur) => ({ ...cur, gstPercent: Number(event.target.value) }))} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="VAT %" value={taxValues.vatPercent} onChange={(event) => setTaxValues((cur) => ({ ...cur, vatPercent: Number(event.target.value) }))} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Sales Tax %" value={taxValues.salesTaxPercent} onChange={(event) => setTaxValues((cur) => ({ ...cur, salesTaxPercent: Number(event.target.value) }))} /></Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select value={taxValues.currency} label="Currency" onChange={(event) => setTaxValues((cur) => ({ ...cur, currency: event.target.value as 'INR' | 'USD' | 'EUR' }))}>
                    <MenuItem value="INR">INR</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={1}><Button fullWidth variant="contained" onClick={applyTaxConfig} disabled={!canManageBilling}>Save</Button></Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Notifications</Typography>
            <Stack spacing={0.6}>
              <Alert severity="success">Payment Success</Alert>
              <Alert severity="error">Payment Failed</Alert>
              <Alert severity="warning">Credits Low</Alert>
              <Alert severity="success">Subscription Renewed</Alert>
              <Alert severity="warning">Trial Expiring</Alert>
              <Alert severity="info">Invoice Generated</Alert>
            </Stack>
          </CardContent>
        </Card>
      )}

      {tab === 'reports' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Reports</Typography>
                <Stack spacing={0.8}>
                  <Button variant="outlined" startIcon={<ReportsIcon />} onClick={async () => {
                    const reports = await billingSubscriptionService.generateReports(ownerId);
                    downloadText('monthly_spend.md', reports.monthlySpend);
                  }} disabled={!canManageBilling}>Monthly Spend</Button>
                  <Button variant="outlined" startIcon={<ReportsIcon />} onClick={async () => {
                    const reports = await billingSubscriptionService.generateReports(ownerId);
                    downloadText('yearly_spend.md', reports.yearlySpend);
                  }} disabled={!canManageBilling}>Yearly Spend</Button>
                  <Button variant="outlined" startIcon={<ReportsIcon />} onClick={async () => {
                    const reports = await billingSubscriptionService.generateReports(ownerId);
                    downloadText('credit_consumption.md', reports.creditConsumption);
                  }} disabled={!canManageBilling}>Credit Consumption</Button>
                  <Button variant="outlined" startIcon={<ReportsIcon />} onClick={async () => {
                    const reports = await billingSubscriptionService.generateReports(ownerId);
                    downloadText('subscription_history.md', reports.subscriptionHistory);
                  }} disabled={!canManageBilling}>Subscription History</Button>
                  <Button variant="outlined" startIcon={<ReportsIcon />} onClick={async () => {
                    const reports = await billingSubscriptionService.generateReports(ownerId);
                    downloadText('invoice_history.md', reports.invoiceHistory);
                  }} disabled={!canManageBilling}>Invoice History</Button>
                  <Button variant="outlined" startIcon={<ReportsIcon />} onClick={async () => {
                    const reports = await billingSubscriptionService.generateReports(ownerId);
                    downloadText('payment_success_rate.md', reports.paymentSuccessRate);
                  }} disabled={!canManageBilling}>Payment Success Rate</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Permission Snapshot</Typography>
                <Chip icon={<BillingIcon />} color={canManageBilling ? 'success' : 'warning'} label={canManageBilling ? 'Full Billing Management Access' : 'Assigned Credits View Only'} />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>Current Role: {access.currentRole}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </MotionBox>
  );
};
