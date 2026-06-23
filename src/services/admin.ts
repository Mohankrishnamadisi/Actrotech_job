import { supabase } from './supabase';

export const adminService = {
  async getDashboardStats() {
    const [{ count: usersCount }, { count: candidatesCount }, { count: recruitersCount }, { count: activeJobsCount }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'job_seeker'),
      supabase.from('recruiters').select('id', { count: 'exact' }),
      supabase.from('jobs').select('id', { count: 'exact' }).eq('status', 'published'),
    ]).then((res) => res.map((r) => r));

    return {
      totalUsers: usersCount?.count || 0,
      totalCandidates: candidatesCount?.count || 0,
      totalRecruiters: recruitersCount?.count || 0,
      activeJobs: activeJobsCount?.count || 0,
    };
  },

  async getUsers(limit = 100) {
    const { data, error } = await supabase.from('profiles').select('*').limit(limit).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateUser(userId: string, updates: Record<string, any>) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select();
    if (error) throw error;
    return data?.[0];
  },

  async getJobs(limit = 200) {
    const { data, error } = await supabase.from('jobs').select('*').limit(limit).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateJob(jobId: string, updates: Record<string, any>) {
    const { data, error } = await supabase.from('jobs').update(updates).eq('id', jobId).select();
    if (error) throw error;
    return data?.[0];
  },

  async bulkImportJobs(rows: Record<string, any>[]) {
    if (!Array.isArray(rows) || rows.length === 0) return { imported: 0 };
    // naive mapping: try to insert rows directly into jobs table
    const payload = rows.map((r) => ({
      title: r.title || r.job_title || r.name,
      company_name: r.company_name || r.company || r.companyName,
      location: r.location || r.city || r.area,
      experience: r.experience || r.experience_level,
      salary_min: r.salary_min || r.salary || null,
      salary_max: r.salary_max || null,
      skills: r.skills ? String(r.skills).split(',').map((s) => s.trim()) : [],
      job_type: r.job_type || r.jobType || null,
      employment_type: r.employment_type || null,
      description: r.description || r.job_description || null,
      requirements: r.requirements || null,
      benefits: r.benefits || null,
      industry: r.industry || null,
      status: r.status || 'published',
      posted_by: r.posted_by || null,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase.from('jobs').insert(payload).select('id');
    if (error) {
      // return error summary
      return { error: String(error) };
    }
    return { imported: data?.length || 0 };
  },

  async runIntegrityChecks() {
    const results: Record<string, any> = {};
    // users without profiles
    const { data: authUsers } = await supabase.from('users').select('id');
    const { data: profiles } = await supabase.from('profiles').select('id');
    const authIds = (authUsers || []).map((u) => u.id);
    const profileIds = (profiles || []).map((p) => p.id);
    const missingProfiles = authIds.filter((id) => !profileIds.includes(id));
    results.missingProfiles = missingProfiles.slice(0, 50);

    // jobs without recruiters
    const { data: jobs } = await supabase.from('jobs').select('id, posted_by');
    const recruiterIds = (await supabase.from('recruiters').select('id')).data?.map((r) => r.id) || [];
    const jobsWithoutRecruiters = (jobs || []).filter((j) => j.posted_by && !recruiterIds.includes(j.posted_by)).slice(0, 50);
    results.jobsWithoutRecruiters = jobsWithoutRecruiters;

    // applications with invalid candidates
    const { data: applications } = await supabase.from('job_applications').select('id, user_id');
    const invalidApplications = (applications || []).filter((a) => a.user_id && !authIds.includes(a.user_id)).slice(0, 50);
    results.invalidApplications = invalidApplications;

    return results;
  },
};

export default adminService;
