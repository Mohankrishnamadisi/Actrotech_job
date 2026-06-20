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
    // Map incoming keys to recruiters table schema
    const payload: Record<string, unknown> = {
      id: userId,
      company_name: profileData.company_name || profileData.companyName || null,
      company_website: profileData.company_website || profileData.company_website || profileData.company_website || null,
      company_logo_url: profileData.company_logo_url || profileData.company_logo || profileData.companyLogoUrl || null,
      industry: profileData.industry || profileData.industryType || null,
      employee_count: profileData.employee_count || profileData.employeeCount || null,
      description: profileData.description || profileData.company_description || profileData.companyDescription || null,
      location: profileData.location || null,
      company_email: profileData.company_email || profileData.companyEmail || null,
      company_phone: profileData.company_phone || profileData.companyPhone || null,
      company_address: profileData.company_address || profileData.companyAddress || null,
      company_name_original: profileData.company_name || profileData.companyName || null,
    };

    const { data, error } = await supabase
      .from('recruiters')
      .insert([{ ...payload }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async getRecruiterProfile(userId: string) {
    const { data, error } = await supabase
      .from('recruiters')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async updateRecruiterProfile(userId: string, updates: Record<string, unknown>) {
    const payload: Record<string, unknown> = {};
    const keyMap: Record<string, string> = {
      companyName: 'company_name',
      companyEmail: 'company_email',
      companyPhone: 'company_phone',
      companyWebsite: 'company_website',
      companyAddress: 'company_address',
      companyLogoUrl: 'company_logo_url',
      companyDescription: 'description',
      industryType: 'industry',
      employeeCount: 'employee_count',
      hrContactPerson: 'hr_contact_person',
      hrEmail: 'hr_email',
      hrPhone: 'hr_phone',
      gstNumber: 'gst_number',
      cinNumber: 'cin_number',
      location: 'location',
    };

    Object.entries(updates).forEach(([key, value]) => {
      const dbKey = keyMap[key] || key;
      payload[dbKey] = value;
    });

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('recruiters')
      .update(payload)
      .eq('id', userId)
      .select();
    if (error) throw error;
    return data[0];
  },

  async getRecruiterStats(recruiterId: string) {
    const { data: jobs, error: jobError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('posted_by', recruiterId);
    if (jobError) throw jobError;

    const { data: applications, error: appError } = await supabase
      .from('job_applications')
      .select('id, status')
      .in(
        'job_id',
        jobs?.map((j) => j.id) || []
      );
    if (appError) throw appError;

    const stats = {
      active_jobs: jobs?.filter((j) => j.status === 'published').length || 0,
      total_jobs: jobs?.length || 0,
      total_applicants: applications?.length || 0,
      shortlisted: applications?.filter((a) => a.status === 'shortlisted').length || 0,
      rejected: applications?.filter((a) => a.status === 'rejected').length || 0,
    };
    return stats;
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

// Notifications operations
export const notificationService = {
  async createNotification(userId: string, type: string, title: string, message: string, data?: Record<string, unknown>) {
    const { data: notif, error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, type, title, message, data, read: false }])
      .select();
    if (error) throw error;
    return notif[0];
  },

  async getUserNotifications(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getUnreadNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select();
    if (error) throw error;
    return data[0];
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
  },
};

// Saved jobs/candidates operations
export const savedService = {
  async saveJob(userId: string, jobId: string) {
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert([{ user_id: userId, job_id: jobId }])
      .select();
    if (error && error.code !== '23505') throw error; // 23505 is unique constraint
    return data ? data[0] : null;
  },

  async unsaveJob(userId: string, jobId: string) {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('user_id', userId)
      .eq('job_id', jobId);
    if (error) throw error;
  },

  async getUserSavedJobs(userId: string) {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*, jobs(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async isJobSaved(userId: string, jobId: string) {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },
};

// Job statistics operations
export const statsService = {
  async getJobStats(jobId: string) {
    const { data: applications, error: appError } = await supabase
      .from('job_applications')
      .select('id, status')
      .eq('job_id', jobId);
    if (appError) throw appError;

    const { data: saves, error: saveError } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('job_id', jobId);
    if (saveError) throw saveError;

    const stats = {
      total_applications: applications?.length || 0,
      applied: applications?.filter((a) => a.status === 'applied').length || 0,
      under_review: applications?.filter((a) => a.status === 'under_review').length || 0,
      shortlisted: applications?.filter((a) => a.status === 'shortlisted').length || 0,
      rejected: applications?.filter((a) => a.status === 'rejected').length || 0,
      accepted: applications?.filter((a) => a.status === 'accepted').length || 0,
      saved: saves?.length || 0,
    };
    return stats;
  },

  async getRecruiterStats(recruiterId: string) {
    const { data: jobs, error: jobError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('posted_by', recruiterId);
    if (jobError) throw jobError;

    const { data: applications, error: appError } = await supabase
      .from('job_applications')
      .select('id, status')
      .in(
        'job_id',
        jobs?.map((j) => j.id) || []
      );
    if (appError) throw appError;

    const stats = {
      active_jobs: jobs?.filter((j) => j.status === 'published').length || 0,
      total_jobs: jobs?.length || 0,
      total_applicants: applications?.length || 0,
      shortlisted: applications?.filter((a) => a.status === 'shortlisted').length || 0,
      rejected: applications?.filter((a) => a.status === 'rejected').length || 0,
    };
    return stats;
  },
};

// Candidate search operations
export const candidateService = {
  async searchCandidates(filters: Record<string, unknown>, page = 1, limit = 20) {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'job_seeker');

    if (filters?.title) {
      query = query.ilike('headline', `%${filters.title}%`);
    }
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters?.skills) {
      query = query.contains('skills', Array.isArray(filters.skills) ? filters.skills : [filters.skills]);
    }
    if (filters?.experience) {
      query = query.gte('experience_years', filters.experience);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return { data: data || [], total: count || 0 };
  },

  async getCandidateProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },
};

// Chat operations
export const chatService = {
  async sendMessage(senderId: string, recipientId: string, message: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ sender_id: senderId, recipient_id: recipientId, message, read: false }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async getConversation(userId: string, otherUserId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getUserConversations(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id, recipient_id, message, created_at')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Group by conversation
    const conversations: Record<string, unknown> = {};
    data?.forEach((msg) => {
      const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      if (!conversations[otherId]) {
        conversations[otherId] = msg;
      }
    });
    return Object.values(conversations);
  },

  async markMessagesAsRead(userId: string, senderId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('sender_id', senderId);
    if (error) throw error;
  },
};
