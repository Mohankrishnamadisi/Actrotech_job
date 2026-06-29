import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { themeColors } from '@styles/recruiterTheme';
import { RecruiterSidebar } from './RecruiterSidebar';
import { RecruiterTopbar } from './RecruiterTopbar';
import SupportWidget from '@components/common/SupportWidget';

interface RecruiterLayoutProps {
  children: React.ReactNode;
  onTabChange?: (tabId: string) => void;
  currentTab?: string;
  companyName?: string;
  companyLogo?: string;
  notificationCount?: number;
  unreadMessagesCount?: number;
  credits?: number;
  planName?: string;
  onNotificationsClick?: () => void;
  onMessagesClick?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export const RecruiterLayout: React.FC<RecruiterLayoutProps> = ({
  children,
  onTabChange,
  currentTab = 'overview',
  companyName = 'Your Company',
  companyLogo,
  notificationCount = 0,
  unreadMessagesCount = 0,
  credits = 0,
  planName = 'Free',
  onNotificationsClick,
  onMessagesClick,
  onProfileClick,
  onSettingsClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [supportOpen, setSupportOpen] = React.useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        backgroundColor: themeColors.backgroundAlt,
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      {!isMobile && (
        <Box
          sx={{
            width: 280,
            height: '100vh',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <RecruiterSidebar
            onTabChange={onTabChange}
            currentTab={currentTab}
            companyName={companyName}
            companyLogo={companyLogo}
          />
        </Box>
      )}

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Top Navigation */}
        <RecruiterTopbar
          notificationCount={notificationCount}
          unreadMessagesCount={unreadMessagesCount}
          credits={credits}
          planName={planName}
          onNotificationsClick={onNotificationsClick}
          onMessagesClick={onMessagesClick}
          onProfileClick={onProfileClick}
          onSettingsClick={onSettingsClick || onProfileClick}
          onCustomerCareClick={() => setSupportOpen(true)}
        />

        {/* Sidebar Toggle for Mobile */}
        {isMobile && (
          <Box sx={{ px: 2, py: 1 }}>
            <RecruiterSidebar
              onTabChange={onTabChange}
              currentTab={currentTab}
              companyName={companyName}
              companyLogo={companyLogo}
            />
          </Box>
        )}

        {/* Page Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
          }}
        >
          {children}
        </Box>
      </Box>

      <SupportWidget
        audience="recruiter"
        showFab={false}
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </Box>
  );
};
