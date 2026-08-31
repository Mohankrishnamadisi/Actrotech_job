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

  const menuSections = [
    { label: 'Workspace', items: [
      { id: 'home', label: 'Home', icon: HomeIcon, external: true },
      { id: 'overview', label: 'Overview', icon: DashboardIcon },
      { id: 'jobs', label: 'Jobs', icon: WorkIcon },
      { id: 'applicants', label: 'Applicants', icon: PeopleIcon },
      { id: 'ats-pipeline', label: 'ATS Pipeline', icon: AccountTreeIcon },
      { id: 'messages', label: 'Messages', icon: MailIcon },
      { id: 'interview-management', label: 'Interviews', icon: EventIcon },
    ] },
    { label: 'Candidates', items: [
      { id: 'find-candidates', label: 'Find Candidates', icon: SearchIcon },
      { id: 'talent-pool', label: 'Talent Pool', icon: PoolIcon },
      { id: 'tags', label: 'Candidate Tags', icon: TagIcon },
      { id: 'assessments', label: 'Assessments', icon: AssessmentsIcon },
      { id: 'employee-referrals', label: 'Referrals', icon: EmployeeReferralsIcon },
      { id: 'talent-community', label: 'Talent Community', icon: TalentCommunityIcon },
    ] },
    { label: 'Intelligence', items: [
      { id: 'analytics', label: 'Analytics', icon: QueryStatsIcon },
      { id: 'market-intelligence', label: 'Market Intelligence', icon: MarketIntelligenceIcon },
      { id: 'ai-hiring-assistant', label: 'AI Hiring Assistant', icon: SmartToyIcon },
      { id: 'automation-center', label: 'Automation', icon: SettingsSuggestIcon },
      { id: 'executive-intelligence', label: 'Executive Intelligence', icon: ExecutiveIntelligenceIcon },
      { id: 'business-intelligence', label: 'Business Intelligence', icon: BusinessIntelligenceIcon },
      { id: 'data-warehouse', label: 'Data Warehouse', icon: DataWarehouseIcon },
      { id: 'ai-insights', label: 'AI Insights', icon: AiInsightsIcon },
      { id: 'forecasting', label: 'Forecasting', icon: ForecastingIcon },
    ] },
    { label: 'Company', items: [
      { id: 'team-management', label: 'Team Management', icon: GroupIcon },
      { id: 'organization', label: 'Organization', icon: OrganizationIcon },
      { id: 'integrations', label: 'Integrations', icon: IntegrationInstructionsIcon },
      { id: 'developer-portal', label: 'Developer Portal', icon: DeveloperPortalIcon },
      { id: 'api-management', label: 'API Management', icon: ApiManagementIcon },
      { id: 'marketplace', label: 'Marketplace', icon: MarketplaceIcon },
      { id: 'webhooks', label: 'Webhooks', icon: WebhooksIcon },
    ] },
    { label: 'Account', items: [
      { id: 'security-center', label: 'Security Center', icon: SecurityCenterIcon },
      { id: 'mobile-pwa', label: 'Mobile & PWA', icon: MobilePwaIcon },
      { id: 'billing-subscription', label: 'Billing & Subscription', icon: ReceiptIcon },
      { id: 'my-details', label: 'My Details', icon: ManageAccountsIcon },
    ] },
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
        background: 'linear-gradient(180deg, #0B1730 0%, #102448 52%, #0A1C39 100%)',
        borderRight: '1px solid rgba(148,163,184,0.18)',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          {companyLogo ? (
            <Avatar src={companyLogo} sx={{ width: 44, height: 44, border: '2px solid rgba(94,234,212,0.65)' }} />
          ) : (
            <Avatar
              sx={{
                width: 44,
                height: 44,
                background: 'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)',
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
              color: '#F8FAFC',
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
          sx={{ color: 'rgba(191,219,254,0.72)', fontSize: '0.68rem', letterSpacing: 0.7, textTransform: 'uppercase' }}
        >
          Recruiter Dashboard
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1, minHeight: 0, py: 1.5, overflowY: 'auto', '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(148,163,184,0.34)', borderRadius: 99 } }}>
        {menuSections.map((section, sectionIndex) => (
          <Box key={section.label} sx={{ mb: 1.5 }}>
            <Typography sx={{ px: 2.5, pt: sectionIndex ? 1 : 0.35, pb: 0.7, color: 'rgba(191,219,254,0.52)', fontSize: 10, fontWeight: 800, letterSpacing: 1.1, textTransform: 'uppercase' }}>{section.label}</Typography>
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id && !item.external;
              return (
              <motion.div key={item.id} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.22, delay: Math.min(0.3, sectionIndex * 0.04 + itemIndex * 0.018) }}>
              <ListItem disablePadding sx={{ mb: 0.2 }}>
                <ListItemButton
                  onClick={() => handleMenuClick(item.id)}
                  sx={{
                    mx: 1.25, minHeight: 40, px: 1.25, borderRadius: 2,
                    background: isActive ? 'linear-gradient(90deg, rgba(45,212,191,0.22), rgba(56,189,248,0.1))' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'rgba(226,232,240,0.7)',
                    borderLeft: isActive ? '3px solid #5EEAD4' : '3px solid transparent',
                    transition: 'background 0.2s ease, color 0.2s ease, transform 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(148,163,184,0.13)', color: '#FFFFFF', transform: 'translateX(3px)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 34,
                      color: isActive ? '#5EEAD4' : 'rgba(191,219,254,0.68)',
                    }}
                  >
                    <Icon sx={{ fontSize: '1.25rem' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={item.id === 'billing-subscription' ? `${planName}` : undefined}
                    primaryTypographyProps={{
                      fontSize: '0.81rem', fontWeight: isActive ? 750 : 550,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.72rem',
                      color: isActive ? '#99F6E4' : 'rgba(191,219,254,0.5)',
                      sx: { mt: 0.1, lineHeight: 1.2 },
                    }}
                  />
                </ListItemButton>
              </ListItem>
              </motion.div>
              );
            })}
          </Box>
        ))}
      </List>

      <Box sx={{ mx: 1.5, mb: 1.5, p: 1.4, borderRadius: 2, bgcolor: 'rgba(45,212,191,0.1)', border: '1px solid rgba(94,234,212,0.16)' }}>
        <Typography sx={{ color: '#99F6E4', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>{planName} workspace</Typography>
        <Typography sx={{ color: 'rgba(226,232,240,0.68)', fontSize: 11, mt: 0.35 }}>{credits.toLocaleString()} credits available</Typography>
      </Box>

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
