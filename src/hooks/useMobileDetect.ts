import { useMediaQuery } from '@mui/material';

export const useMobileDetect = () => {
  const isMobile = useMediaQuery('(max-width: 767.95px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023.95px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
};
