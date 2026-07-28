import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Public as GlobalIcon,
  Translate as LocalizationIcon,
  Gavel as ComplianceIcon,
  Language as RegionalIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { globalEnterprisePlatformService } from '@services/globalEnterprisePlatform';

type GlobalTab =
  | 'global-dashboard'
  | 'localization'
  | 'compliance'
  | 'regional-management'
  | 'multi-currency'
  | 'timezones'
  | 'hiring-localization'
  | 'global-job-distribution'
  | 'global-search'
  | 'international-billing'
  | 'payment-gateways'
  | 'global-analytics'
  | 'ai-localization'
  | 'global-notifications'
  | 'global-security'
  | 'disaster-recovery'
  | 'performance-optimization'
  | 'enterprise-support'
  | 'global-reports'
  | 'permissions';

interface RecruiterGlobalEnterpriseCenterProps {
  mode?: 'global-settings' | 'localization' | 'compliance' | 'regional-management';
}

const initialTabFromMode = (mode: RecruiterGlobalEnterpriseCenterProps['mode']): GlobalTab => {
  if (mode === 'localization') return 'localization';
  if (mode === 'compliance') return 'compliance';
  if (mode === 'regional-management') return 'regional-management';
  return 'global-dashboard';
};

const statCard = (label: string, value: string | number) => (
  <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>{value}</Typography>
    </CardContent>
  </Card>
);

const downloadText = (name: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const RecruiterGlobalEnterpriseCenter: React.FC<RecruiterGlobalEnterpriseCenterProps> = ({ mode = 'global-settings' }) => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [tab, setTab] = useState<GlobalTab>(initialTabFromMode(mode));
  const [refreshKey, setRefreshKey] = useState(0);

  const dashboard = useMemo(() => globalEnterprisePlatformService.getGlobalDashboard(), []);
  const localization = useMemo(() => globalEnterprisePlatformService.getLocalizationArchitecture(), []);
  const currencies = useMemo(() => globalEnterprisePlatformService.getMultiCurrencySupport(), []);
  const timezones = useMemo(() => globalEnterprisePlatformService.getTimeZoneSupport(), []);
  const regionalSettings = useMemo(() => globalEnterprisePlatformService.listRegionalSettings(), [refreshKey]);
  const compliance = useMemo(() => globalEnterprisePlatformService.getComplianceCenter(), []);
  const regionalData = useMemo(() => globalEnterprisePlatformService.getRegionalDataManagement(), []);
  const hiringLocalization = useMemo(() => globalEnterprisePlatformService.getHiringLocalization(), []);
  const jobDistribution = useMemo(() => globalEnterprisePlatformService.getGlobalJobDistribution(), []);
  const globalSearch = useMemo(() => globalEnterprisePlatformService.getGlobalSearch(), []);
  const billing = useMemo(() => globalEnterprisePlatformService.getInternationalBilling(), []);
  const gateways = useMemo(() => globalEnterprisePlatformService.getRegionalPaymentGateways(), []);
  const analytics = useMemo(() => globalEnterprisePlatformService.getGlobalAnalytics(), []);
  const aiLocalization = useMemo(() => globalEnterprisePlatformService.getAiLocalization(), []);
  const notifications = useMemo(() => globalEnterprisePlatformService.getGlobalNotifications(), []);
  const security = useMemo(() => globalEnterprisePlatformService.getGlobalSecurity(), []);
  const dr = useMemo(() => globalEnterprisePlatformService.getDisasterRecovery(), []);
  const performance = useMemo(() => globalEnterprisePlatformService.getPerformanceOptimization(), []);
  const support = useMemo(() => globalEnterprisePlatformService.getEnterpriseSupport(), []);
  const permissions = useMemo(() => globalEnterprisePlatformService.getPermissions(), []);
  const alerts = useMemo(() => globalEnterprisePlatformService.listAlerts(), [refreshKey]);

  return (
    <Box>
      <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 2, background: 'linear-gradient(120deg, #0f172a 0%, #2563eb 50%, #0ea5e9 100%)', color: '#f8fafc' }}>
        <CardContent>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Global Enterprise Platform</Typography>
          <Typography variant="body2" sx={{ opacity: 0.92 }}>
            Worldwide expansion architecture for localization, compliance, regional operations, billing, security and resilient multi-region deployment.
          </Typography>
        </CardContent>
      </Card>

      <Paper sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
        <Tabs value={tab} onChange={(_, value: GlobalTab) => setTab(value)} variant={isTablet ? 'scrollable' : 'fullWidth'} scrollButtons="auto">
          <Tab value="global-dashboard" label="Global Settings" icon={<GlobalIcon />} iconPosition="start" />
          <Tab value="localization" label="Localization" icon={<LocalizationIcon />} iconPosition="start" />
          <Tab value="compliance" label="Compliance" icon={<ComplianceIcon />} iconPosition="start" />
          <Tab value="regional-management" label="Regional Management" icon={<RegionalIcon />} iconPosition="start" />
          <Tab value="global-reports" label="Global Reports" />
          <Tab value="permissions" label="Permissions" />
        </Tabs>
      </Paper>

      {tab === 'global-dashboard' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={3}>{statCard('Countries Supported', dashboard.countriesSupported)}</Grid>
          <Grid item xs={12} md={3}>{statCard('Platform Uptime', dashboard.platformHealth.uptime)}</Grid>
          <Grid item xs={12} md={3}>{statCard('Latency', `${dashboard.platformHealth.latencyMs} ms`)}</Grid>
          <Grid item xs={12} md={3}>{statCard('API Availability', dashboard.platformHealth.apiAvailability)}</Grid>
          <Grid item xs={12}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Organizations by Country</Typography>{dashboard.organizationsByCountry.map((x) => <Typography key={x.country} variant="body2">{x.country}: {x.organizations.toLocaleString()}</Typography>)}</CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Users by Region</Typography>{dashboard.usersByRegion.map((x) => <Typography key={x.region} variant="body2">{x.region}: {x.users.toLocaleString()}</Typography>)}</CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Jobs by Region</Typography>{dashboard.jobsByRegion.map((x) => <Typography key={x.region} variant="body2">{x.region}: {x.jobs.toLocaleString()}</Typography>)}</CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Revenue by Country</Typography>{dashboard.revenueByCountry.map((x) => <Typography key={x.country} variant="body2">{x.country}: {globalEnterprisePlatformService.formatCurrency(x.revenue, x.currency)}</Typography>)}</CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Regional Growth / Hiring Trend</Typography>{dashboard.regionalGrowth.map((x) => <Typography key={x.region} variant="body2">{x.region}: {x.growth}%</Typography>)}{dashboard.globalHiringTrends.map((x) => <Typography key={x.month} variant="caption" display="block">{x.month}: {x.hires.toLocaleString()} hires</Typography>)}</CardContent></Card></Grid>
        </Grid>
      )}

      {tab === 'localization' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}><Alert severity="info">Supports multi-language, RTL, dynamic translation, localized emails/notifications/career pages and future language expansion.</Alert></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Languages</Typography>{localization.supportedLanguages.map((x) => <Typography key={x} variant="body2">- {x}</Typography>)}</CardContent></Card></Grid>
          <Grid item xs={12} md={6}>{statCard('RTL Languages', localization.rtlLanguages.join(', '))}</Grid>
          <Grid item xs={12} md={4}>{statCard('Dynamic Translation', localization.dynamicTranslation)}</Grid>
          <Grid item xs={12} md={4}>{statCard('Localized Emails/Notifications', `${localization.localizedEmails} | ${localization.localizedNotifications}`)}</Grid>
          <Grid item xs={12} md={4}>{statCard('Localized Career Pages', localization.localizedCareerPages)}</Grid>
          <Grid item xs={12}>{statCard('Expansion Strategy', localization.expansionStrategy)}</Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>AI Localization</Typography><Typography variant="body2">Localized Job Descriptions: {String(aiLocalization.localizedJobDescriptions)}</Typography><Typography variant="body2">Localized Interview Questions: {String(aiLocalization.localizedInterviewQuestions)}</Typography><Typography variant="body2">Localized Emails: {String(aiLocalization.localizedEmails)}</Typography><Typography variant="body2">Localized Notifications: {String(aiLocalization.localizedNotifications)}</Typography><Typography variant="body2">Localized Resume Suggestions: {String(aiLocalization.localizedResumeSuggestions)}</Typography><Typography variant="body2">{aiLocalization.strategy}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Global Notifications</Typography><Typography variant="body2">Email: {String(notifications.email)}</Typography><Typography variant="body2">SMS: {String(notifications.sms)}</Typography><Typography variant="body2">Push: {String(notifications.push)}</Typography><Typography variant="body2">TZ-aware delivery: {String(notifications.timezoneAwareDelivery)}</Typography><Typography variant="body2">{notifications.deliveryArchitecture}</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      {tab === 'compliance' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}><Alert severity="success">Compliance center prepared for GDPR, CCPA, India DPDP, SOC 2, ISO 27001 with consent and privacy controls.</Alert></Grid>
          <Grid item xs={12}><TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0' }}><Table size="small"><TableHead><TableRow><TableCell>Framework</TableCell><TableCell>Status</TableCell><TableCell>Controls</TableCell></TableRow></TableHead><TableBody>{compliance.map((x) => <TableRow key={x.name}><TableCell>{x.name}</TableCell><TableCell>{x.status}</TableCell><TableCell>{x.controls.join(', ')}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Grid>
          <Grid item xs={12} md={6}>{statCard('Regional Storage', regionalData.regionalStorage)}</Grid>
          <Grid item xs={12} md={6}>{statCard('Backup Strategy', regionalData.backupStrategy)}</Grid>
          <Grid item xs={12} md={6}>{statCard('Disaster Recovery', regionalData.disasterRecovery)}</Grid>
          <Grid item xs={12} md={6}>{statCard('Data Retention Policies', regionalData.dataRetentionPolicies)}</Grid>
          <Grid item xs={12}><TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0' }}><Table size="small"><TableHead><TableRow><TableCell>Type</TableCell><TableCell>Severity</TableCell><TableCell>Region</TableCell><TableCell>Message</TableCell><TableCell>Action</TableCell></TableRow></TableHead><TableBody>{alerts.map((a) => <TableRow key={a.id}><TableCell>{a.type}</TableCell><TableCell>{a.severity}</TableCell><TableCell>{a.region}</TableCell><TableCell>{a.message}</TableCell><TableCell><Button size="small" onClick={() => { globalEnterprisePlatformService.resolveAlert(a.id); setRefreshKey((v) => v + 1); }}>Resolve</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer></Grid>
        </Grid>
      )}

      {tab === 'regional-management' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}><Alert severity="info">Regional settings include date/phone/address/postal/language/currency/timezone and global hiring localization models.</Alert></Grid>
          <Grid item xs={12}><TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0' }}><Table size="small"><TableHead><TableRow><TableCell>Country</TableCell><TableCell>Date</TableCell><TableCell>Phone</TableCell><TableCell>Address</TableCell><TableCell>Postal</TableCell><TableCell>Language</TableCell><TableCell>Currency</TableCell><TableCell>Timezone</TableCell></TableRow></TableHead><TableBody>{regionalSettings.map((row) => <TableRow key={row.country}><TableCell>{row.country}</TableCell><TableCell>{row.dateFormat}</TableCell><TableCell>{row.phoneFormat}</TableCell><TableCell>{row.addressFormat}</TableCell><TableCell>{row.postalCodeFormat}</TableCell><TableCell>{row.language}</TableCell><TableCell>{row.currency}</TableCell><TableCell>{row.timezone}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Time Zone Support</Typography><Typography variant="body2">{timezones.userTimeZoneDetection}</Typography><Typography variant="body2">{timezones.interviewScheduling}</Typography><Typography variant="body2">{timezones.jobDeadlines}</Typography><Typography variant="body2">{timezones.notifications}</Typography><Typography variant="body2">{timezones.calendarEvents}</Typography><Typography variant="body2">{timezones.reports}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Hiring Localization</Typography><Typography variant="body2">Employment Types: {hiringLocalization.employmentTypes.join(', ')}</Typography><Typography variant="body2">Notice Periods: {hiringLocalization.noticePeriods.join(', ')}</Typography><Typography variant="body2">Salary Structures: {hiringLocalization.salaryStructures.join(', ')}</Typography><Typography variant="body2">Work Authorization: {hiringLocalization.workAuthorization}</Typography><Typography variant="body2">Visa Sponsorship: {hiringLocalization.visaSponsorship}</Typography><Typography variant="body2">Tax Fields: {hiringLocalization.taxFields.join(', ')}</Typography><Typography variant="body2">Education Levels: {hiringLocalization.educationLevels.join(', ')}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Global Job Distribution</Typography><Typography variant="body2">Regional Career Pages: {String(jobDistribution.regionalCareerPages)}</Typography><Typography variant="body2">Partners: {jobDistribution.partnerPlatforms.join(', ')}</Typography><Typography variant="body2">APIs: {jobDistribution.apis}</Typography><Typography variant="body2">RSS: {jobDistribution.rssFeeds}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Global Search</Typography><Typography variant="body2">Countries: {String(globalSearch.countries)}</Typography><Typography variant="body2">Languages: {String(globalSearch.languages)}</Typography><Typography variant="body2">Currencies: {String(globalSearch.currencies)}</Typography><Typography variant="body2">Regions: {String(globalSearch.regions)}</Typography><Typography variant="body2">{globalSearch.architecture}</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      {tab === 'multi-currency' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}>{statCard('Supported Currencies', currencies.currencies.join(', '))}</Grid>
          <Grid item xs={12}>{statCard('Currency Formatting', currencies.formatting)}</Grid>
        </Grid>
      )}

      {tab === 'timezones' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}>{statCard('Time Zone Support', `${timezones.userTimeZoneDetection} | ${timezones.interviewScheduling}`)}</Grid>
          <Grid item xs={12}>{statCard('Notification + Calendar + Reports', `${timezones.notifications} | ${timezones.calendarEvents} | ${timezones.reports}`)}</Grid>
        </Grid>
      )}

      {tab === 'hiring-localization' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}>{statCard('Hiring Localization', `Employment, notice period, salary, work authorization, visa, tax, education`)}</Grid>
        </Grid>
      )}

      {tab === 'global-job-distribution' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}>{statCard('Distribution', `${jobDistribution.partnerPlatforms.join(', ')} | ${jobDistribution.apis}`)}</Grid>
        </Grid>
      )}

      {tab === 'global-search' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}>{statCard('Global Search', globalSearch.architecture)}</Grid>
        </Grid>
      )}

      {tab === 'international-billing' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}>{statCard('Country Taxes', billing.countryTaxes)}</Grid>
          <Grid item xs={12}>{statCard('Invoices/Tax IDs/Payment Methods', `${billing.invoices} | ${billing.taxIds.join(', ')} | ${billing.regionalPaymentMethods.join(', ')}`)}</Grid>
        </Grid>
      )}

      {tab === 'payment-gateways' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}>{statCard('Gateways', gateways.integrations.join(', '))}</Grid>
          <Grid item xs={12}>{statCard('Gateway Orchestration', gateways.orchestration)}</Grid>
        </Grid>
      )}

      {tab === 'global-analytics' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Regional Hiring</Typography>{analytics.regionalHiring.map((x) => <Typography key={x.region} variant="body2">{x.region}: {x.score}</Typography>)}</CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Salary Trends</Typography>{analytics.salaryTrends.map((x) => <Typography key={x.country} variant="body2">{x.country}: {x.trend}%</Typography>)}</CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Demand By Country</Typography>{analytics.demandByCountry.map((x) => <Typography key={x.country} variant="body2">{x.country}: {x.demand}</Typography>)}</CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Recruiter Performance</Typography>{analytics.recruiterPerformance.map((x) => <Typography key={x.region} variant="body2">{x.region}: {x.performance}</Typography>)}</CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Candidate Growth</Typography>{analytics.candidateGrowth.map((x) => <Typography key={x.region} variant="body2">{x.region}: {x.growth}%</Typography>)}</CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card sx={{ border: '1px solid #e2e8f0' }}><CardContent><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Revenue by Region</Typography>{analytics.revenueByRegion.map((x) => <Typography key={x.region} variant="body2">{x.region}: ${x.revenue.toLocaleString()}</Typography>)}</CardContent></Card></Grid>
        </Grid>
      )}

      {tab === 'ai-localization' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}><Alert severity="info">AI localization generates region-aware content and communications across hiring workflows.</Alert></Grid>
          <Grid item xs={12} md={6}>{statCard('Localized Job Descriptions', String(aiLocalization.localizedJobDescriptions))}</Grid>
          <Grid item xs={12} md={6}>{statCard('Localized Interview Questions', String(aiLocalization.localizedInterviewQuestions))}</Grid>
          <Grid item xs={12} md={6}>{statCard('Localized Emails', String(aiLocalization.localizedEmails))}</Grid>
          <Grid item xs={12} md={6}>{statCard('Localized Notifications', String(aiLocalization.localizedNotifications))}</Grid>
          <Grid item xs={12}>{statCard('Localized Resume Suggestions', String(aiLocalization.localizedResumeSuggestions))}</Grid>
          <Grid item xs={12}>{statCard('Localization Strategy', aiLocalization.strategy)}</Grid>
        </Grid>
      )}

      {tab === 'global-notifications' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}><Alert severity="info">Global notification engine supports localized email, SMS and push with timezone-aware delivery windows.</Alert></Grid>
          <Grid item xs={12} md={3}>{statCard('Email', String(notifications.email))}</Grid>
          <Grid item xs={12} md={3}>{statCard('SMS', String(notifications.sms))}</Grid>
          <Grid item xs={12} md={3}>{statCard('Push', String(notifications.push))}</Grid>
          <Grid item xs={12} md={3}>{statCard('TZ-aware Delivery', String(notifications.timezoneAwareDelivery))}</Grid>
          <Grid item xs={12}>{statCard('Delivery Architecture', notifications.deliveryArchitecture)}</Grid>
        </Grid>
      )}

      {tab === 'global-security' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}><Alert severity="warning">Global security posture includes regional access policies, country/IP restrictions, MFA and continuous monitoring.</Alert></Grid>
          <Grid item xs={12} md={6}>{statCard('Regional Access Policies', security.regionalAccessPolicies)}</Grid>
          <Grid item xs={12} md={6}>{statCard('Country Restrictions', security.countryRestrictions)}</Grid>
          <Grid item xs={12} md={6}>{statCard('IP Restrictions', security.ipRestrictions)}</Grid>
          <Grid item xs={12} md={6}>{statCard('MFA', security.mfa)}</Grid>
          <Grid item xs={12}>{statCard('Monitoring', security.securityMonitoring)}</Grid>
        </Grid>
      )}

      {tab === 'disaster-recovery' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={6}>{statCard('Automatic Backup', String(dr.automaticBackup))}</Grid>
          <Grid item xs={12} md={6}>{statCard('Multi-Region Deployment', String(dr.multiRegionDeployment))}</Grid>
          <Grid item xs={12} md={4}>{statCard('Health Checks', dr.healthChecks)}</Grid>
          <Grid item xs={12} md={4}>{statCard('Failover Strategy', dr.failoverStrategy)}</Grid>
          <Grid item xs={12} md={4}>{statCard('Business Continuity', dr.businessContinuity)}</Grid>
        </Grid>
      )}

      {tab === 'performance-optimization' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12} md={3}>{statCard('Global CDN', String(performance.globalCdn))}</Grid>
          <Grid item xs={12} md={3}>{statCard('Image Optimization', String(performance.imageOptimization))}</Grid>
          <Grid item xs={12} md={3}>{statCard('Caching/Edge', `${String(performance.caching)} / ${String(performance.edgeDelivery)}`)}</Grid>
          <Grid item xs={12} md={3}>{statCard('Lazy + Compression', `${String(performance.lazyLoading)} / ${String(performance.compression)}`)}</Grid>
          <Grid item xs={12}>{statCard('Architecture', performance.architecture)}</Grid>
        </Grid>
      )}

      {tab === 'enterprise-support' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}><Alert severity="info">24/7 enterprise support architecture with tickets, SLAs, knowledge base and status page.</Alert></Grid>
          <Grid item xs={12} md={3}>{statCard('24/7 Support', String(support.support247))}</Grid>
          <Grid item xs={12} md={3}>{statCard('Support Tickets', String(support.supportTickets))}</Grid>
          <Grid item xs={12} md={3}>{statCard('Knowledge Base', String(support.knowledgeBase))}</Grid>
          <Grid item xs={12} md={3}>{statCard('Status Page', String(support.statusPage))}</Grid>
          <Grid item xs={12}>{statCard('Priority SLAs', support.prioritySlas.join(', '))}</Grid>
        </Grid>
      )}

      {tab === 'global-reports' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}><Alert severity="info">Regional, Country, Executive, Compliance and Revenue reports can be generated for global operations.</Alert></Grid>
          <Grid item xs={12} md={2.4}><Button fullWidth variant="contained" onClick={() => downloadText('regional-report.md', globalEnterprisePlatformService.generateGlobalReport('regional'))} startIcon={<DownloadIcon />}>Regional</Button></Grid>
          <Grid item xs={12} md={2.4}><Button fullWidth variant="outlined" onClick={() => downloadText('country-report.md', globalEnterprisePlatformService.generateGlobalReport('country'))}>Country</Button></Grid>
          <Grid item xs={12} md={2.4}><Button fullWidth variant="outlined" onClick={() => downloadText('executive-report.md', globalEnterprisePlatformService.generateGlobalReport('executive'))}>Executive</Button></Grid>
          <Grid item xs={12} md={2.4}><Button fullWidth variant="outlined" onClick={() => downloadText('compliance-report.md', globalEnterprisePlatformService.generateGlobalReport('compliance'))}>Compliance</Button></Grid>
          <Grid item xs={12} md={2.4}><Button fullWidth variant="outlined" onClick={() => downloadText('revenue-report.md', globalEnterprisePlatformService.generateGlobalReport('revenue'))}>Revenue</Button></Grid>
        </Grid>
      )}

      {tab === 'permissions' && (
        <Grid container spacing={1.2}>
          <Grid item xs={12}><Alert severity="info">Role-based permissions for global enterprise operations.</Alert></Grid>
          <Grid item xs={12} md={6}>{statCard('Platform Owner', permissions.platformOwner)}</Grid>
          <Grid item xs={12} md={6}>{statCard('Global Admin', permissions.globalAdmin)}</Grid>
          <Grid item xs={12} md={6}>{statCard('Regional Admin', permissions.regionalAdmin)}</Grid>
          <Grid item xs={12} md={6}>{statCard('Organization Admin', permissions.organizationAdmin)}</Grid>
          <Grid item xs={12} md={6}>{statCard('Support', permissions.support)}</Grid>
          <Grid item xs={12} md={6}>{statCard('Compliance Officer', permissions.complianceOfficer)}</Grid>
          <Grid item xs={12}>{statCard('Finance', permissions.finance)}</Grid>
        </Grid>
      )}

      <Paper sx={{ border: '1px dashed #cbd5e1', borderRadius: 2, mt: 2, p: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Additional modules in this center: Multi-currency, Time zones, International Billing, Payment Gateways, Global Analytics, Global Security, Disaster Recovery, Performance Optimization and Enterprise Support.
        </Typography>
        <Stack direction="row" spacing={0.7} sx={{ mt: 1 }} flexWrap="wrap">
          <Button size="small" onClick={() => setTab('multi-currency')}>Multi-Currency</Button>
          <Button size="small" onClick={() => setTab('timezones')}>Time Zones</Button>
          <Button size="small" onClick={() => setTab('hiring-localization')}>Hiring Localization</Button>
          <Button size="small" onClick={() => setTab('global-job-distribution')}>Job Distribution</Button>
          <Button size="small" onClick={() => setTab('global-search')}>Global Search</Button>
          <Button size="small" onClick={() => setTab('international-billing')}>International Billing</Button>
          <Button size="small" onClick={() => setTab('payment-gateways')}>Payment Gateways</Button>
          <Button size="small" onClick={() => setTab('global-analytics')}>Global Analytics</Button>
          <Button size="small" onClick={() => setTab('ai-localization')}>AI Localization</Button>
          <Button size="small" onClick={() => setTab('global-notifications')}>Global Notifications</Button>
          <Button size="small" onClick={() => setTab('global-security')}>Global Security</Button>
          <Button size="small" onClick={() => setTab('disaster-recovery')}>Disaster Recovery</Button>
          <Button size="small" onClick={() => setTab('performance-optimization')}>Performance Optimization</Button>
          <Button size="small" onClick={() => setTab('enterprise-support')}>Enterprise Support</Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RecruiterGlobalEnterpriseCenter;
