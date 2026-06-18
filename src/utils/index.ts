export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatCurrency = (amount: number, currency = '₹') => {
  return `${currency} ${amount.toLocaleString('en-IN')}`;
};

export const formatJobSalary = (min?: number, max?: number) => {
  if (!min && !max) return 'Not disclosed';
  if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
  if (min) return `₹${min.toLocaleString()}+`;
  return `Up to ₹${max?.toLocaleString()}`;
};

export const getTimeAgo = (date: string | Date) => {
  const now = new Date();
  const time = new Date(date);
  const diff = now.getTime() - time.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return formatDate(date);
};

export const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password: string) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

export const truncateText = (text: string, length: number) => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

export const generateInitials = (name: string) => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getContrastColor = (hexColor: string) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export const cn = (...classes: (string | false | undefined | null)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
