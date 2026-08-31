import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { themeColors } from '@styles/recruiterTheme';
import { RecruiterSidebar } from './RecruiterSidebar';
import { RecruiterTopbar } from './RecruiterTopbar';
import SupportWidget from '@components/common/SupportWidget';

const MotionBox = motion(Box);

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
        background: 'radial-gradient(circle at 88% 4%, rgba(45,212,191,0.14), transparent 24%), radial-gradient(circle at 38% 100%, rgba(59,130,246,0.1), transparent 28%), #F5F7FB',
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
            credits={credits}
            planName={planName}
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
          recruiterLogo={companyLogo}
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
              credits={credits}
              planName={planName}
            />
          </Box>
        )}

        {/* Page Content */}
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: { xs: 1.5, md: 3 },
            '&::-webkit-scrollbar': { width: 9 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(100,116,139,0.32)', borderRadius: 99, border: '2px solid #F5F7FB' },
          }}
        >
          {children}
        </MotionBox>
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
