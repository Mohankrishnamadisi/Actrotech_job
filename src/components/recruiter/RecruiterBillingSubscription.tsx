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
  Autorenew as RenewIcon,
  Download as DownloadIcon,
  ReceiptLong as InvoiceIcon,
  Payments as PaymentIcon,
  Upgrade as UpgradeIcon,
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
  | 'usage';

const MotionBox = motion(Box);

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

  const plans = billingSubscriptionService.getPlanCatalog();
  const canManageBilling = billingSubscriptionService.canManageBilling(ownerId, currentUserId);

  const subscription = billingSubscriptionService.getSubscription(ownerId);
  const currentPlan = billingSubscriptionService.getPlan(subscription.planId);
  const wallets = billingSubscriptionService.getWallets(ownerId, currentUserId);
  const ownerWallets = billingSubscriptionService.getWallets(ownerId, ownerId);
  const walletLabelMap = billingSubscriptionService.getWalletLabelMap();

  const packagesForType = billingSubscriptionService.getCreditPackages(purchaseWalletType);
  const invoices = billingSubscriptionService.getInvoices(ownerId);
  const payments = billingSubscriptionService.getPayments(ownerId);

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
        <Chip color={canManageBilling ? 'success' : 'warning'} label={canManageBilling ? 'Billing Admin' : 'View Access'} />
      </Box>

      {!canManageBilling && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have view-only access. Only the Company Owner or Billing Admin can purchase credits, manage subscriptions, or download invoices.
        </Alert>
      )}

      <Paper sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}`, mb: 2 }}>
        <Tabs value={tab} onChange={(_, value: BillingTab) => setTab(value)} variant={isTablet ? 'scrollable' : 'scrollable'} scrollButtons="auto" allowScrollButtonsMobile sx={{ minHeight: 54, px: 0.5, '& .MuiTabs-scroller': { overflowX: 'auto !important' }, '& .MuiTabs-scrollButtons': { width: 34, borderRadius: 1, mx: 0.5 }, '& .MuiTab-root': { textTransform: 'none', whiteSpace: 'nowrap', minHeight: 54, minWidth: 'max-content', px: 1.8, fontWeight: 700, fontSize: '0.82rem' } }}>
          <Tab value="overview" label="Overview" />
          <Tab value="plans" label="Plans" />
          <Tab value="subscription" label="Subscription" />
          <Tab value="credits" label="Credits" />
          <Tab value="purchase" label="Purchase Credits" />
          <Tab value="payments" label="Payment Methods" />
          <Tab value="invoices" label="Invoices" />
          <Tab value="usage" label="Usage Analytics" />
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
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Monthly Usage Graph</Typography>
                <Stack spacing={0.6}>
                  <Chip label="Credit consumption tracked" color="success" />
                  <Chip label="Resume unlock usage tracked" color="success" />
                  <Chip label="AI usage monitored" color="success" />
                  <Chip label="Job posting usage tracked" color="success" />
                  <Chip label="Automation runs tracked" color="success" />
                  <Chip label="Interview credits tracked" color="success" />
                  <Chip label="API usage tracked" color="success" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

    </MotionBox>
  );
};

