export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'job_seeker' | 'recruiter' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface JobSeeker extends User {
  phone?: string;
  bio?: string;
  location?: string;
  skills: string[];
  resumeUrl?: string;
  subscriptionPlan?: 'basic' | 'premium' | 'pro';
  subscriptionExpiry?: string;
}

export interface Recruiter extends User {
  companyName: string;
  companyWebsite?: string;
  companyLogo?: string;
  industry?: string;
  employeeCount?: string;
  subscriptionPlan?: 'basic' | 'premium' | 'pro';
  subscriptionExpiry?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  jobType: 'Onsite' | 'Remote' | 'Hybrid';
  salaryMin?: number;
  salaryMax?: number;
  experience: string;
  description: string;
  skills: string[];
  applicationLink?: string;
  postedBy: string;
  createdAt: string;
  updatedAt: string;
  applicationsCount?: number;
  featured?: boolean;
  status?: 'published' | 'draft' | 'closed';
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  resumeUrl: string;
  coverLetter?: string;
  status: 'applied' | 'under_review' | 'shortlisted' | 'rejected' | 'accepted';
  appliedAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'basic' | 'premium' | 'pro';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  method: 'razorpay' | 'credit_card' | 'upi';
  transactionId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'job_match' | 'application_status' | 'new_job' | 'subscription';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  session?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
