import { supabase } from './supabase';
import type { JobSeeker, Recruiter, Job } from '../types';
import { getFreshnessDate } from '@utils/index';

const normalizeJob = (job: Record<string, any>): Job => ({
  ...job,
  company_name: job.company_name || job.companyName || '',
  jobType: job.jobType || job.job_type || job.work_type || undefined,
  workMode: job.workMode || job.work_mode || undefined,
  salaryMin: job.salaryMin ?? job.salary_min,
  salaryMax: job.salaryMax ?? job.salary_max,
  positionsAvailable: job.positionsAvailable ?? job.positions_available ?? job.number_of_positions,
  positions_available: job.positions_available ?? job.positionsAvailable ?? job.number_of_positions,
  screeningQuestions: job.screeningQuestions || job.screening_questions || [],
  screening_questions: job.screening_questions || job.screeningQuestions || [],
  applicationLink: job.applicationLink || job.application_link || job.applicationUrl || job.application_url || undefined,
  application_link: job.application_link || job.applicationLink || job.applicationUrl || job.application_url || undefined,
  applicationUrl: job.applicationUrl || job.application_link || job.applicationLink || job.application_url || undefined,
  application_url: job.application_url || job.application_link || job.applicationLink || job.applicationUrl || undefined,
  createdAt: job.createdAt ?? job.created_at,
  updatedAt: job.updatedAt ?? job.updated_at,
} as Job);

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

  async ensureRecruiterProfile(userId: string, profileData: Partial<Recruiter> & Record<string, unknown> = {}) {
    const { data: existing, error: existingError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') throw existingError;
    if (existing) {
      if (existing.role !== 'recruiter') {
        const { data, error } = await supabase
          .from('profiles')
          .update({ role: 'recruiter', updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      return existing;
    }

    let authUser: any = null;
    if (!profileData.name || !profileData.email) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!userError && userData?.user?.id === userId) {
        authUser = userData.user;
      }
    }

    const payload: Record<string, unknown> = {
      id: userId,
      role: 'recruiter',
      name:
        profileData.hr_name ||
        profileData.name ||
        profileData.company_name ||
        authUser?.user_metadata?.name ||
        'Recruiter',
      email:
        profileData.company_email ||
        profileData.email ||
        authUser?.email ||
        null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('profiles').insert([payload]).select().single();
    if (error) throw error;
    return data;
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
  async createRecruiterProfile(userId: string, profileData: Partial<Recruiter> & Record<string, any>) {
    // Map incoming keys to recruiters table schema
    const payload: Record<string, unknown> = {
      id: userId,
      company_name: profileData.company_name || profileData.companyName || null,
      company_website: profileData.company_website || profileData.companyWebsite || null,
      company_logo_url: profileData.company_logo_url || profileData.company_logo || profileData.companyLogo || null,
      industry: profileData.industry || profileData.industryType || null,
      employee_count: profileData.employee_count || profileData.employeeCount || null,
      description: profileData.description || profileData.company_description || profileData.companyDescription || null,
      // keep legacy `location` if provided
      location: profileData.location || null,
      company_email: profileData.company_email || profileData.companyEmail || null,
      company_phone: profileData.company_phone || profileData.companyPhone || null,
      // company_address: prefer explicit company_address or companyAddress, fall back to location
      company_address:
        profileData.company_address || profileData.companyAddress || profileData.location || null,
      // GST/CIN and HR contact fields
      gst_number: profileData.gst_number || profileData.gstNumber || null,
      cin_number: profileData.cin_number || profileData.cinNumber || null,
      hr_name: profileData.hr_name || profileData.hrContactPerson || profileData.hrContact || null,
      hr_email: profileData.hr_email || profileData.hrEmail || null,
      hr_phone: profileData.hr_phone || profileData.hrPhone || null,
      company_name_original: profileData.company_name || profileData.companyName || null,
    };

    // Log payload for debugging to verify what is being sent to Supabase
    // eslint-disable-next-line no-console
    console.info('createRecruiterProfile payload:', JSON.parse(JSON.stringify(payload)));

    const { data, error } = await supabase
      .from('recruiters')
      .insert([{ ...payload }])
      .select();
    if (error) throw error;

    await userService.ensureRecruiterProfile(userId, {
      name: payload.hr_name as string,
      email: payload.company_email as string,
    } as Partial<Recruiter> & Record<string, unknown>);

    return data[0];
  },

  async getRecruiterProfile(userId: string) {
    const { data, error } = await supabase
      .from('recruiters')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
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
      hrContactPerson: 'hr_name',
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

    const keyword = filters?.keyword ? String(filters.keyword) : null;
    if (keyword) {
      const escapedKeyword = keyword.replace(/%/g, '\\%').replace(/_/g, '\\_');
      const keywordPattern = `%${escapedKeyword}%`;
      query = query.or(
        `title.ilike.${keywordPattern},company_name.ilike.${keywordPattern},skills.cs.{${keyword}}`
      );
    }
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (Array.isArray(filters?.jobType) && filters.jobType.length > 0) {
      query = query.in('job_type', filters.jobType as string[]);
    } else if (filters?.jobType) {
      query = query.eq('job_type', filters.jobType as string);
    }
    if (Array.isArray(filters?.workMode) && filters.workMode.length > 0) {
      query = query.in('work_mode', filters.workMode as string[]);
    } else if (filters?.workMode) {
      query = query.eq('work_mode', filters.workMode as string);
    }
    if (Array.isArray(filters?.category) && filters.category.length > 0) {
      const categoryTerms = (filters.category as string[])
        .map((value) => String(value).trim())
        .filter(Boolean);

      if (categoryTerms.length > 0) {
        const exactCategoryClauses = categoryTerms.map((term) => `category.eq.${JSON.stringify(term)}`);
        const titleClauses = categoryTerms.map((term) => `title.ilike.%${term.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`);
        const descriptionClauses = categoryTerms.map((term) => `description.ilike.%${term.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`);
        const companyClauses = categoryTerms.map((term) => `company_name.ilike.%${term.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`);
        const skillClauses = categoryTerms.map((term) => `skills.cs.{${term}}`);

        const allClauses = [
          ...exactCategoryClauses,
          ...titleClauses,
          ...descriptionClauses,
          ...companyClauses,
          ...skillClauses,
        ];

        query = query.or(allClauses.join(','));
      }
    } else if (filters?.category) {
      const term = String(filters.category).trim();
      const escaped = term.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(
        `category.eq.${JSON.stringify(term)},title.ilike.%${escaped}%,description.ilike.%${escaped}%,company_name.ilike.%${escaped}%,skills.cs.{${term}}`
      );
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
    return { data: (data || []).map(normalizeJob), total: count || 0 };
  },

  async getJobById(id: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return normalizeJob(data);
  },

  async getFeaturedJobs(limit = 6) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('featured', true)
      .eq('status', 'published')
      .limit(limit);
    if (error) throw error;
    return (data || []).map(normalizeJob);
  },

  async getLatestJobs(limit = 10) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(normalizeJob);
  },

  async createJob(userId: string, jobData: Partial<Job>) {
    if (!userId) throw new Error('Missing userId for createJob');

    const payload: Record<string, unknown> = {
      ...jobData,
      posted_by: userId,
      status: 'published',
    };

    if (jobData.jobType && !payload.job_type) {
      payload.job_type = jobData.jobType;
    }
    if (jobData.workMode && !payload.work_mode) {
      payload.work_mode = jobData.workMode;
    }
    // ensure company_name is used; do not send a legacy `company` field
    if (jobData.company_name && !payload.company_name) {
      payload.company_name = jobData.company_name;
    }

    // normalize arrays and numeric fields
    if (!Array.isArray(payload.skills)) payload.skills = jobData.skills || [];
    if (!Array.isArray(payload.screening_questions)) payload.screening_questions = jobData.screening_questions || jobData.screeningQuestions || [];
    if (jobData.applicationLink && !payload.application_link) {
      payload.application_link = jobData.applicationLink;
    }
    if (jobData.application_link && !payload.application_link) {
      payload.application_link = jobData.application_link;
    }
    if (jobData.applicationUrl && !payload.application_link) {
      payload.application_link = jobData.applicationUrl;
    }
    if (jobData.application_url && !payload.application_link) {
      payload.application_link = jobData.application_url;
    }
    if (payload.positions_available && typeof payload.positions_available === 'string') {
      payload.positions_available = parseInt(payload.positions_available as string, 10) || 1;
    }
    if (payload.salary_min && typeof payload.salary_min === 'string') {
      payload.salary_min = parseInt(payload.salary_min as string, 10);
    }
    if (payload.salary_max && typeof payload.salary_max === 'string') {
      payload.salary_max = parseInt(payload.salary_max as string, 10);
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert([payload])
      .select();
    if (error) throw error;

    const createdJob = data?.[0] ? normalizeJob(data[0]) : null;

    try {
      if (createdJob?.id) {
        const { data: activeSubs, error: subsError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('status', 'active');

        if (subsError) {
          throw subsError;
        }

        const notifications = (activeSubs || [])
          .filter((sub) => sub?.user_id)
          .map((sub) => ({
            user_id: sub.user_id,
            type: 'new_job',
            title: 'New premium job posted',
            message: `${createdJob.title} at ${createdJob.company_name} is now live. Apply now to secure your next role.`,
            data: { jobId: createdJob.id },
            read: false,
          }));

        if (notifications.length > 0) {
          const { error: notifError } = await supabase.from('notifications').insert(notifications);
          if (notifError) {
            throw notifError;
          }
        }
      }
    } catch (notificationError) {
      console.error('Failed to notify subscribers of new job:', notificationError);
    }

    return createdJob;
  },

  async updateJob(jobId: string, updates: Record<string, unknown>) {
    const payload: Record<string, unknown> = { ...updates };

    if ((updates as any).jobType && !payload.job_type) {
      payload.job_type = (updates as any).jobType;
    }
    if ((updates as any).workMode && !payload.work_mode) {
      payload.work_mode = (updates as any).workMode;
    }
    if ((updates as any).applicationLink && !payload.application_link) {
      payload.application_link = (updates as any).applicationLink;
    }
    if ((updates as any).application_link && !payload.application_link) {
      payload.application_link = (updates as any).application_link;
    }
    if ((updates as any).applicationUrl && !payload.application_link) {
      payload.application_link = (updates as any).applicationUrl;
    }
    if ((updates as any).application_url && !payload.application_link) {
      payload.application_link = (updates as any).application_url;
    }
    // ensure company_name is used; do not set a legacy `company` field
    if ((updates as any).company_name && !payload.company_name) {
      payload.company_name = (updates as any).company_name;
    }

    const { data, error } = await supabase
      .from('jobs')
      .update(payload)
      .eq('id', jobId)
      .select();
    if (error) throw error;
    return normalizeJob(data?.[0]);
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
    return (data || []).map(normalizeJob);
  },

  async getJobsBySkills(skills: string[], page = 1, limit = 10) {
    const filteredSkills = skills.filter(Boolean).map((skill) => String(skill).trim());
    if (filteredSkills.length === 0) {
      return { data: [], total: 0 };
    }

    const skillQueries = filteredSkills
      .map((skill) => {
        const escaped = skill.replace(/%/g, '\\%').replace(/_/g, '\\_');
        return `skills.cs.{${escaped}}`;
      })
      .join(',');

    const { data, error, count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .or(skillQueries)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return { data: (data || []).map(normalizeJob), total: count || 0 };
  },
};

// Job Application operations
export const applicationService = {
  async applyForJob(
    jobId: string,
    userId: string,
    resumeUrl: string,
    coverLetter?: string,
    screeningAnswers?: Array<{ question: string; answer: string }>,
    currentCtc?: string,
    expectedCtc?: string,
    noticePeriod?: string
  ) {
    const { data, error } = await supabase
      .from('job_applications')
      .insert([
        {
          job_id: jobId,
          user_id: userId,
          resume_url: resumeUrl,
          cover_letter: coverLetter,
          screening_answers: screeningAnswers,
          current_ctc: currentCtc,
          expected_ctc: expectedCtc,
          notice_period: noticePeriod,
          status: 'applied',
        },
      ])
      .select();
    if (error) throw error;

    try {
      const application = data?.[0];
      if (application) {
        await notificationService.createNotification(
          userId,
          'application_status',
          'Application Submitted',
          `Your application for the selected role has been received. We'll let you know when HR updates the status.`,
          { jobId }
        );

        const { data: jobDetails, error: jobDetailsError } = await supabase
          .from('jobs')
          .select('posted_by, title, company_name')
          .eq('id', jobId)
          .maybeSingle();

        if (jobDetailsError) {
          console.error('Failed to load job details for recruiter notification', jobDetailsError);
        }

        if (jobDetails?.posted_by) {
          await notificationService.createNotification(
            jobDetails.posted_by,
            'new_application',
            'New applicant submitted',
            `A candidate has applied for ${jobDetails.title || 'your job posting'} at ${jobDetails.company_name || 'your company'}.`,
            { jobId, applicationId: application.id }
          );
        }
      }
    } catch (notificationError) {
      console.error('Failed to send application notification:', notificationError);
    }

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

  async getApplicationDetails(applicationId: string, jobId?: string) {
    let query = supabase
      .from('job_applications')
      .select('*, profiles(*), jobs(*)')
      .eq('id', applicationId);

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error('Failed to load application details', { applicationId, jobId }, error);
      throw error;
    }
    if (!data) {
      throw new Error('Application not found or access denied');
    }
    return data;
  },

  async hasUserApplied(jobId: string, userId: string) {
    if (!jobId || !userId) return false;
    const { data, error } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  async updateApplicationStatus(applicationId: string, status: string, jobId?: string) {
    const updatePayload = {
      status,
      updated_at: new Date().toISOString(),
    };

    let query = supabase
      .from('job_applications')
      .update(updatePayload)
      .eq('id', applicationId);

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data, error } = await query
      .select('id, status, user_id, job_id, profiles(*), jobs(*)')
      .maybeSingle();

    if (error) {
      console.error('Failed to update application status', { applicationId, status, jobId }, error);
      throw error;
    }

    if (!data) {
      console.error('Application status update returned no row', { applicationId, status, jobId });
      throw new Error('Application update failed or access denied');
    }

    const application = data;
    if (application) {
      try {
        await notificationService.createNotification(
          application.user_id || application.userId,
          'application_status',
          'Application Update',
          `HR has marked your application for ${application.jobs?.title || 'the role'} as ${status.replace('_', ' ')}. Check the dashboard for details.`,
          { applicationId, status }
        );
      } catch (notificationError) {
        console.error('Failed to send HR action notification:', notificationError);
      }
    }

    return application;
  },
};

// Subscription operations
export const subscriptionService = {
  async createSubscription(userId: string, plan: string, expiryDate: string) {
    const startDate = new Date().toISOString();
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([
        {
          user_id: userId,
          plan,
          status: 'active',
          start_date: startDate,
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
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
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
  async createPayment(userId: string, subscriptionId: string, amount: number, method: 'razorpay' | 'phonepe' | 'credit_card' | 'upi') {
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          user_id: userId,
          subscription_id: subscriptionId,
          amount,
          currency: 'INR',
          status: 'completed',
          method,
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
      const skills = Array.isArray(filters.skills) ? filters.skills : [filters.skills];
      const cleanSkills = skills.map((skill) => String(skill).trim()).filter(Boolean);
      if (cleanSkills.length > 0) {
        query = query.contains('skills', cleanSkills);
      }
    }
    if (filters?.experience !== undefined && filters?.experience !== null) {
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
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    userRole: 'recruiter' | 'candidate' = 'candidate'
  ) {
    try {
      let conversation = await this.getConversation(senderId, receiverId);

      if (!conversation) {
        if (userRole !== 'recruiter') {
          throw new Error('Only recruiters can initiate conversations');
        }

        const recruiterId = senderId;
        const candidateId = receiverId;
        console.log('No conversation found. Creating new conversation', {
          recruiterId,
          candidateId,
        });

        const { data, error } = await supabase
          .from('conversations')
          .insert([
            {
              recruiter_id: recruiterId,
              candidate_id: candidateId,
              initiated_by_recruiter: true,
            },
          ])
          .select('id')
          .single();

        if (error) {
          const sqlError = error as any;
          if (sqlError?.code === '23505' || sqlError?.details?.includes('duplicate key value')) {
            console.warn('Conversation already exists after insert race, refetching existing conversation');
            conversation = await this.getConversation(senderId, receiverId);
          } else {
            throw error;
          }
        } else {
          conversation = data;
          console.log('Conversation created', conversation.id);
        }
      } else {
        console.log('Conversation found', conversation.id);
      }

      if (!conversation?.id) {
        throw new Error('Unable to resolve conversation id');
      }

      console.log('Inserting message with conversation_id', conversation.id);
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversation.id,
            sender_id: senderId,
            receiver_id: receiverId,
            content,
            is_read: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Chat sendMessage error:', error);
      throw error;
    }
  },

  async getConversation(userId: string, otherUserId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, recruiter_id, candidate_id')
      .or(
        `and(recruiter_id.eq.${userId},candidate_id.eq.${otherUserId}),and(recruiter_id.eq.${otherUserId},candidate_id.eq.${userId})`
      )
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getUserConversations(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, content, created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Group by conversation
    const conversations: Record<string, unknown> = {};
    data?.forEach((msg) => {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!conversations[otherId]) {
        conversations[otherId] = msg;
      }
    });
    return Object.values(conversations);
  },

  async markMessagesAsRead(userId: string, senderId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', senderId);
    if (error) throw error;
  },
};
