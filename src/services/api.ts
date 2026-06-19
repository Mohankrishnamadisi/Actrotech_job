import { supabase } from './supabase';
import type { JobSeeker, Recruiter, Job, JobApplication, Subscription } from '@types/index';
import { getFreshnessDate } from '@utils/index';

// User operations
export const userService = {
  async createProfile(userId: string, profileData: Partial<JobSeeker | Recruiter>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ id: userId, ...profileData }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async updateProfile(userId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select();
    if (error) throw error;
    return data[0];
  },

  async uploadResume(userId: string, file: File) {
    const fileName = `${userId}-${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(fileName, file);
    if (error) throw error;

    const { data: publicData } = supabase.storage.from('resumes').getPublicUrl(data.path);
    return publicData.publicUrl;
  },

  async uploadProfileImage(userId: string, file: File) {
    const fileName = `${userId}-avatar-${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
    if (error) throw error;

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(data.path);
    return publicData.publicUrl;
  },

  async uploadCompanyLogo(userId: string, file: File) {
    const fileName = `${userId}-logo-${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file);
    if (error) throw error;

    const { data: publicData } = supabase.storage.from('company-logos').getPublicUrl(data.path);
    return publicData.publicUrl;
  },
};

// Recruiter operations
export const recruiterService = {
  async createRecruiterProfile(userId: string, profileData: Partial<Recruiter>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ id: userId, role: 'recruiter', ...profileData }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async getRecruiterProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('role', 'recruiter')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
};

// Job operations
export const jobService = {
  async getJobs(filters?: Record<string, unknown>, page = 1, limit = 20) {
    let query = supabase.from('jobs').select('*', { count: 'exact' }).eq('status', 'published');

    if (filters?.title) {
      query = query.ilike('title', `%${filters.title}%`);
    }
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters?.jobType) {
      query = query.eq('job_type', filters.jobType);
    }
    if (filters?.category) {
      query = query.contains('skills', [filters.category]);
    }
    if (filters?.experience) {
      query = query.ilike('experience', `%${filters.experience}%`);
    }
    if (filters?.education) {
      query = query.ilike('education', `%${filters.education}%`);
    }
    if (filters?.freshness) {
      const fromDate = getFreshnessDate(filters.freshness as string);
      if (fromDate) {
        query = query.gte('created_at', fromDate);
      }
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return { data: data || [], total: count || 0 };
  },

  async getJobById(id: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getFeaturedJobs(limit = 6) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('featured', true)
      .eq('status', 'published')
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getLatestJobs(limit = 10) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async createJob(userId: string, jobData: Partial<Job>) {
    const { data, error } = await supabase
      .from('jobs')
      .insert([{ ...jobData, posted_by: userId, status: 'published' }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async updateJob(jobId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select();
    if (error) throw error;
    return data[0];
  },

  async deleteJob(jobId: string) {
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (error) throw error;
  },

  async getRecruiterJobs(recruiterId: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('posted_by', recruiterId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};

// Job Application operations
export const applicationService = {
  async applyForJob(jobId: string, userId: string, resumeUrl: string, coverLetter?: string) {
    const { data, error } = await supabase
      .from('job_applications')
      .insert([
        {
          job_id: jobId,
          user_id: userId,
          resume_url: resumeUrl,
          cover_letter: coverLetter,
          status: 'applied',
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  async getUserApplications(userId: string) {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*, jobs(*)')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getJobApplications(jobId: string) {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*, profiles(*)')
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async updateApplicationStatus(applicationId: string, status: string) {
    const { data, error } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', applicationId)
      .select();
    if (error) throw error;
    return data[0];
  },
};

// Subscription operations
export const subscriptionService = {
  async createSubscription(userId: string, plan: string, expiryDate: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([
        {
          user_id: userId,
          plan,
          status: 'active',
          end_date: expiryDate,
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  async getUserSubscription(userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async updateSubscription(subscriptionId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select();
    if (error) throw error;
    return data[0];
  },
};

// Payment operations
export const paymentService = {
  async createPayment(userId: string, subscriptionId: string, amount: number) {
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          user_id: userId,
          subscription_id: subscriptionId,
          amount,
          currency: 'INR',
          status: 'pending',
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  async updatePaymentStatus(paymentId: string, status: string, transactionId?: string) {
    const { data, error } = await supabase
      .from('payments')
      .update({ status, transaction_id: transactionId })
      .eq('id', paymentId)
      .select();
    if (error) throw error;
    return data[0];
  },

  async getUserPayments(userId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};
