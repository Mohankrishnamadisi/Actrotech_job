import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Event as EventIcon,
  Mail as MailIcon,
  QueryStats as QueryStatsIcon,
  SmartToy as SmartToyIcon,
  SettingsSuggest as SettingsSuggestIcon,
  People as PeopleIcon,
  AutoAwesome as AutoAwesomeIcon,
  Search as SearchIcon,
  AccountTree as AccountTreeIcon,
  BusinessCenter as BusinessCenterIcon,
  BrandingWatermark as BrandingWatermarkIcon,
  FolderSpecial as PoolIcon,
  LocalOffer as TagIcon,
  Group as GroupIcon,
  IntegrationInstructions as IntegrationInstructionsIcon,
  Receipt as ReceiptIcon,
  TravelExplore as MarketIntelligenceIcon,
  Security as SecurityCenterIcon,
  Apartment as OrganizationIcon,
  PhonelinkSetup as MobilePwaIcon,
  AssignmentTurnedIn as AssessmentsIcon,
  Diversity3 as TalentCommunityIcon,
  Handshake as EmployeeReferralsIcon,
  DeveloperMode as DeveloperPortalIcon,
  Api as ApiManagementIcon,
  Storefront as MarketplaceIcon,
  Webhook as WebhooksIcon,
  Insights as ExecutiveIntelligenceIcon,
  Assessment as BusinessIntelligenceIcon,
  Storage as DataWarehouseIcon,
  Psychology as AiInsightsIcon,
  ShowChart as ForecastingIcon,
  Public as GlobalSettingsIcon,
  Translate as LocalizationMenuIcon,
  Gavel as ComplianceMenuIcon,
  Language as RegionalManagementIcon,
  ManageAccounts as ManageAccountsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { themeColors } from '@styles/recruiterTheme';

interface RecruiterSidebarProps {
  onTabChange?: (tabId: string) => void;
  currentTab?: string;
  companyName?: string;
  companyLogo?: string;
  credits?: number;
  planName?: string;
}

const MotionBox = motion(Box);

export const RecruiterSidebar: React.FC<RecruiterSidebarProps> = ({
  onTabChange,
  currentTab = 'overview',
  companyName = 'Your Company',
  companyLogo,
  credits = 0,
  planName = 'Free',
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Home', icon: HomeIcon, color: '#6366F1', external: true },
    { id: 'overview', label: 'Dashboard', icon: DashboardIcon, color: '#0066FF' },
    { id: 'jobs', label: 'Jobs', icon: WorkIcon, color: '#7C3AED' },
    { id: 'applicants', label: 'Applicants', icon: PeopleIcon, color: '#10B981' },
    { id: 'find-candidates', label: 'Find Candidates', icon: SearchIcon, color: '#14B8A6' },
    { id: 'talent-pool', label: 'Talent Pool', icon: PoolIcon, color: '#06B6D4' },
    { id: 'tags', label: 'Tags', icon: TagIcon, color: '#EC4899' },
    { id: 'ats-pipeline', label: 'ATS Pipeline', icon: AccountTreeIcon, color: '#F97316' },
    { id: 'messages', label: 'Messages', icon: MailIcon, color: '#10B981' },
    { id: 'interview-management', label: 'Interview Management', icon: EventIcon, color: '#0EA5E9' },
    { id: 'analytics', label: 'Analytics', icon: QueryStatsIcon, color: '#2563EB' },
    { id: 'ai-hiring-assistant', label: 'AI Hiring Assistant', icon: SmartToyIcon, color: '#7C2D12' },
    { id: 'team-management', label: 'Team Management', icon: GroupIcon, color: '#1D4ED8' },
    { id: 'integrations', label: 'Integrations', icon: IntegrationInstructionsIcon, color: '#0C4A6E' },
    { id: 'market-intelligence', label: 'Market Intelligence', icon: MarketIntelligenceIcon, color: '#0E7490' },
    { id: 'security-center', label: 'Security Center', icon: SecurityCenterIcon, color: '#DC2626' },
    { id: 'organization', label: 'Organization', icon: OrganizationIcon, color: '#0F766E' },
    { id: 'assessments', label: 'Assessments', icon: AssessmentsIcon, color: '#2563EB' },
    { id: 'employee-referrals', label: 'Employee Referrals', icon: EmployeeReferralsIcon, color: '#0E7490' },
    { id: 'talent-community', label: 'Talent Community', icon: TalentCommunityIcon, color: '#1D4ED8' },
    { id: 'mobile-pwa', label: 'Mobile & PWA', icon: MobilePwaIcon, color: '#0284C7' },
    { id: 'developer-portal', label: 'Developer Portal', icon: DeveloperPortalIcon, color: '#1D4ED8' },
    { id: 'api-management', label: 'API Management', icon: ApiManagementIcon, color: '#0891B2' },
    { id: 'marketplace', label: 'Marketplace', icon: MarketplaceIcon, color: '#0F766E' },
    { id: 'webhooks', label: 'Webhooks', icon: WebhooksIcon, color: '#B45309' },
    { id: 'executive-intelligence', label: 'Executive Intelligence', icon: ExecutiveIntelligenceIcon, color: '#1E3A8A' },
    { id: 'business-intelligence', label: 'Business Intelligence', icon: BusinessIntelligenceIcon, color: '#0F766E' },
    { id: 'data-warehouse', label: 'Data Warehouse', icon: DataWarehouseIcon, color: '#334155' },
    { id: 'ai-insights', label: 'AI Insights', icon: AiInsightsIcon, color: '#0C4A6E' },
    { id: 'forecasting', label: 'Forecasting', icon: ForecastingIcon, color: '#0E7490' },
    { id: 'global-settings', label: 'Global Settings', icon: GlobalSettingsIcon, color: '#1E3A8A' },
    { id: 'localization', label: 'Localization', icon: LocalizationMenuIcon, color: '#0C4A6E' },
    { id: 'compliance', label: 'Compliance', icon: ComplianceMenuIcon, color: '#166534' },
    { id: 'regional-management', label: 'Regional Management', icon: RegionalManagementIcon, color: '#0F766E' },
    { id: 'automation-center', label: 'Automation Center', icon: SettingsSuggestIcon, color: '#0F766E' },
    { id: 'billing-subscription', label: 'Billing & Subscription', icon: ReceiptIcon, color: '#8B5CF6' },
    { id: 'my-details', label: 'My Details', icon: ManageAccountsIcon, color: '#0F766E' },
  ];

  const handleMenuClick = (itemId: string) => {
    if (itemId === 'home') {
      navigate('/');
      return;
    }
    onTabChange?.(itemId);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderRight: `1px solid ${themeColors.border}`,
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, borderBottom: `1px solid ${themeColors.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          {companyLogo ? (
            <Avatar src={companyLogo} sx={{ width: 40, height: 40 }} />
          ) : (
            <Avatar
              sx={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #0066FF 0%, #7C3AED 100%)',
                fontWeight: 700,
              }}
            >
              {companyName.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Typography
            variant="h6"
            sx={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: themeColors.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {companyName}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{ color: themeColors.text.tertiary, fontSize: '0.7rem', textTransform: 'uppercase' }}
        >
          Recruiter Dashboard
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1, minHeight: 0, py: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id && !item.external;
          return (
            <motion.div
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleMenuClick(item.id)}
                  sx={{
                    mx: 1.5,
                    borderRadius: '8px',
                    backgroundColor: isActive ? item.color + '12' : 'transparent',
                    color: isActive ? item.color : themeColors.text.secondary,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: item.color + '12',
                      color: item.color,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isActive ? item.color : themeColors.text.secondary,
                    }}
                  >
                    <Icon sx={{ fontSize: '1.25rem' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={item.id === 'billing-subscription' ? `${planName}` : undefined}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.72rem',
                      color: isActive ? item.color : themeColors.text.tertiary,
                      sx: { mt: 0.1, lineHeight: 1.2 },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </motion.div>
          );
        })}
      </List>

    </MotionBox>
  );

  if (isMobile) {
    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, mb: 2 }}>
          <IconButton onClick={() => setMobileOpen(true)} edge="start">
            <MenuIcon />
          </IconButton>
        </Box>
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: `1px solid ${themeColors.border}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Menu
            </Typography>
            <IconButton onClick={() => setMobileOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          {sidebarContent}
        </Drawer>
      </>
    );
  }

  return (
    <Box sx={{ width: 280, height: '100vh', position: 'sticky', top: 0 }}>
      {sidebarContent}
    </Box>
  );
};
