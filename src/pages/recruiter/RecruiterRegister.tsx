import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { recruiterService, userService } from '@services/api';
import { ROUTES, USER_ROLES, INDUSTRY_TYPES } from '@constants/index';
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateURL,
  validateGST,
  validateFileSize,
} from '@utils/index';
import toast from 'react-hot-toast';

// ── Icons (inline SVG, no extra deps) ─────────────────────────────────────────
const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const UploadIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

// ── Reusable field components ──────────────────────────────────────────────────
interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  prefix?: string;
  required?: boolean;
  rows?: number;
  showToggle?: boolean;
  onToggle?: () => void;
  showPassword?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label, name, value, onChange, error, type = 'text', placeholder, prefix,
  required, rows, showToggle, onToggle, showPassword,
}) => {
  const base =
    'w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50';
  const errorClass = error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 hover:border-gray-300';

  if (rows) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <textarea
          name={name}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          placeholder={placeholder}
          rows={rows}
          className={`${base} ${errorClass} resize-none`}
        />
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    );
  }

  const inputType = showToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 select-none">
            {prefix}
          </span>
        )}
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          placeholder={placeholder}
          className={`${base} ${errorClass} ${prefix ? 'pl-12' : ''} ${showToggle ? 'pr-10' : ''}`}
        />
        {showToggle && (
          <button type="button" onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
};

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const SelectField: React.FC<{
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[]; error?: string; required?: boolean;
}> = ({ label, name, value, onChange, options, error, required }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (opt: string) => {
    // Synthesise a change event so handleChange works unchanged
    const nativeInput = document.createElement('select');
    nativeInput.name = name;
    Object.defineProperty(nativeInput, 'value', { get: () => opt });
    onChange({ target: nativeInput } as unknown as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1 relative" ref={ref}>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-all duration-200 cursor-pointer ${
          open ? 'ring-2 ring-blue-500 border-blue-500' : error ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'
        } ${value ? 'text-gray-800' : 'text-gray-400'}`}
      >
        <span>{value || 'Select industry...'}</span>
        <ChevronIcon open={open} />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden"
            style={{ top: 'calc(100% + 4px)', left: 0 }}
          >
            <div className="max-h-56 overflow-y-auto py-1.5 px-1.5 flex flex-col gap-0.5">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => select(opt)}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-xl transition-colors duration-150 ${
                    value === opt
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
};

// ── Section header ─────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; color: string }> = ({
  icon, title, subtitle, color,
}) => (
  <div className={`flex items-center gap-3 p-4 rounded-2xl mb-6 ${color}`}>
    <div className="p-2 bg-white rounded-xl shadow-sm">{icon}</div>
    <div>
      <h3 className="font-bold text-gray-800 text-base">{title}</h3>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  </div>
);

// ── Modal ──────────────────────────────────────────────────────────────────────
const Modal: React.FC<{
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; actions: React.ReactNode;
}> = ({ open, onClose, title, children, actions }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <XIcon />
            </button>
          </div>
          <div className="text-sm text-gray-600 mb-6">{children}</div>
          <div className="flex justify-end gap-3">{actions}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ── Main component ─────────────────────────────────────────────────────────────
export const RecruiterRegister: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setLoading } = useAuthStore();
  const [loading, setLoadingState] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [existingDialogOpen, setExistingDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    gstNumber: '',
    cinNumber: '',
    companyEmail: '',
    companyPhone: '',
    companyWebsite: '',
    companyAddress: '',
    companyDescription: '',
    industryType: '',
    hrContactPerson: '',
    hrEmail: '',
    hrPhone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!validateGST(formData.gstNumber)) newErrors.gstNumber = 'Valid 15-character GST number required';
    if (!validateEmail(formData.companyEmail)) newErrors.companyEmail = 'Valid company email required';
    if (!validatePhone(formData.companyPhone)) newErrors.companyPhone = 'Valid 10-digit phone required';
    if (!validateURL(formData.companyWebsite)) newErrors.companyWebsite = 'Valid website URL required';
    if (!formData.companyAddress.trim()) newErrors.companyAddress = 'Company address is required';
    if (!formData.companyDescription.trim()) newErrors.companyDescription = 'Company description is required';
    if (!formData.industryType) newErrors.industryType = 'Industry type is required';
    if (!formData.hrContactPerson.trim()) newErrors.hrContactPerson = 'HR contact person is required';
    if (!validateEmail(formData.hrEmail)) newErrors.hrEmail = 'Valid HR email required';
    if (!validatePhone(formData.hrPhone)) newErrors.hrPhone = 'Valid HR phone required';
    if (!validatePassword(formData.password)) newErrors.password = 'Min 8 chars with uppercase, lowercase & number';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoadingState(true);
    setLoading(true);

    try {
      const response = await authService.signUp(formData.hrEmail, formData.password, {
        name: formData.hrContactPerson,
        role: USER_ROLES.RECRUITER,
      });

      if (response.user) {
        let logoUrl = '';
        if (companyLogo) {
          logoUrl = await userService.uploadCompanyLogo(response.user.id, companyLogo);
        }

        await recruiterService.createRecruiterProfile(response.user.id, {
          company_name: formData.companyName,
          company_website: formData.companyWebsite,
          company_logo_url: logoUrl,
          industry: formData.industryType,
          description: formData.companyDescription,
          location: formData.companyAddress,
          company_email: formData.companyEmail,
          company_phone: formData.companyPhone,
          gst_number: formData.gstNumber,
          cin_number: formData.cinNumber || undefined,
          hr_name: formData.hrContactPerson,
          hr_email: formData.hrEmail,
          hr_phone: formData.hrPhone,
        } as Record<string, unknown>);

        setUser({
          id: response.user.id,
          email: formData.hrEmail,
          name: formData.hrContactPerson,
          role: USER_ROLES.RECRUITER,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        setVerifyDialogOpen(true);
        navigate(ROUTES.RECRUITER_DASHBOARD);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Recruiter registration error:', error);
      if (/already/i.test(msg)) {
        setExistingDialogOpen(true);
      } else {
        toast.error(msg || 'Registration failed');
      }
    } finally {
      setLoadingState(false);
      setLoading(false);
    }
  };

  return (
    <Layout footer={false}>
      {/* Background */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-10 px-4">
        {/* Decorative blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-32 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-blue-200">
              <BuildingIcon />
              <span>Recruiter Portal</span>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
              Register Your Company
            </h1>
            <p className="text-gray-500 text-base max-w-md mx-auto">
              Join thousands of recruiters hiring top talent. Set up your account in minutes.
            </p>
          </motion.div>

          {/* Steps indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-3 mb-8">
            {['Company Info', 'HR Contact', 'Account Setup'].map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {idx + 1}
                  </div>
                  <span className="text-xs font-semibold text-gray-600 hidden sm:block">{step}</span>
                </div>
                {idx < 2 && <div className="w-10 h-px bg-gray-300 hidden sm:block" />}
              </React.Fragment>
            ))}
          </motion.div>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 overflow-hidden"
          >
            <form onSubmit={handleSubmit} noValidate>
              {/* ── SECTION 1: Company Info ── */}
              <div className="p-8 border-b border-gray-100">
                <SectionHeader
                  icon={<span className="text-blue-600"><BuildingIcon /></span>}
                  title="Company Information"
                  subtitle="Tell us about your organization"
                  color="bg-blue-50"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Company Name" name="companyName" value={formData.companyName}
                    onChange={handleChange} error={errors.companyName} required
                    placeholder="Acme Technologies Pvt Ltd" />

                  <SelectField label="Industry Type" name="industryType" value={formData.industryType}
                    onChange={handleChange as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                    options={INDUSTRY_TYPES} error={errors.industryType} required />

                  <Field label="GST Number" name="gstNumber" value={formData.gstNumber}
                    onChange={handleChange} error={errors.gstNumber} required
                    placeholder="22AAAAA0000A1Z5" />

                  <Field label="CIN Number (Optional)" name="cinNumber" value={formData.cinNumber}
                    onChange={handleChange} placeholder="U74999MH2020PTC340000" />

                  <Field label="Company Email" name="companyEmail" type="email" value={formData.companyEmail}
                    onChange={handleChange} error={errors.companyEmail} required
                    placeholder="contact@company.com" />

                  <Field label="Company Phone" name="companyPhone" value={formData.companyPhone}
                    onChange={handleChange} error={errors.companyPhone} required
                    prefix="+91" placeholder="9876543210" />

                  <div className="sm:col-span-2">
                    <Field label="Company Website" name="companyWebsite" value={formData.companyWebsite}
                      onChange={handleChange} error={errors.companyWebsite} required
                      placeholder="https://yourcompany.com" />
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Registered Address" name="companyAddress" value={formData.companyAddress}
                      onChange={handleChange} error={errors.companyAddress} required
                      rows={2} placeholder="Plot 12, Tech Park, Hyderabad, TS 500032" />
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Company Description" name="companyDescription" value={formData.companyDescription}
                      onChange={handleChange} error={errors.companyDescription} required
                      rows={3} placeholder="Brief overview of your company, culture, and what you offer..." />
                  </div>

                  {/* Logo upload */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                      Company Logo <span className="text-gray-400 normal-case font-normal">(optional, max 5MB)</span>
                    </label>
                    <label
                      htmlFor="company-logo"
                      className="group flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-8 cursor-pointer transition-all duration-200 bg-gray-50/60 hover:bg-blue-50/40"
                    >
                      {logoPreview ? (
                        <div className="flex items-center gap-4">
                          <img src={logoPreview} alt="logo preview" className="w-16 h-16 rounded-xl object-contain border border-gray-200 bg-white p-1 shadow-sm" />
                          <div className="text-left">
                            <div className="flex items-center gap-1.5 text-green-600 font-semibold text-sm">
                              <CheckIcon /> {companyLogo?.name}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Click to change logo</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-200 transition-colors">
                            <UploadIcon />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-700">Drop your logo here</p>
                            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, SVG · up to 5 MB</p>
                          </div>
                        </>
                      )}
                      <input
                        type="file" id="company-logo" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!validateFileSize(file, 5)) { toast.error('Logo must be under 5MB'); return; }
                          setCompanyLogo(file);
                          setLogoPreview(URL.createObjectURL(file));
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: HR Contact ── */}
              <div className="p-8 border-b border-gray-100">
                <SectionHeader
                  icon={<span className="text-purple-600"><UserIcon /></span>}
                  title="HR Contact Details"
                  subtitle="Primary point of contact for hiring"
                  color="bg-purple-50"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="HR Contact Person" name="hrContactPerson" value={formData.hrContactPerson}
                    onChange={handleChange} error={errors.hrContactPerson} required
                    placeholder="Ravi Kumar" />

                  <Field label="HR Email" name="hrEmail" type="email" value={formData.hrEmail}
                    onChange={handleChange} error={errors.hrEmail} required
                    placeholder="hr@company.com" />

                  <Field label="HR Phone" name="hrPhone" value={formData.hrPhone}
                    onChange={handleChange} error={errors.hrPhone} required
                    prefix="+91" placeholder="9876543210" />
                </div>
              </div>

              {/* ── SECTION 3: Account Setup ── */}
              <div className="p-8">
                <SectionHeader
                  icon={<span className="text-emerald-600"><LockIcon /></span>}
                  title="Account Setup"
                  subtitle="Create your recruiter login credentials"
                  color="bg-emerald-50"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Password" name="password" value={formData.password}
                    onChange={handleChange} error={errors.password} required
                    showToggle showPassword={showPassword} onToggle={() => setShowPassword((p) => !p)}
                    placeholder="Min 8 chars, uppercase & number" />

                  <Field label="Confirm Password" name="confirmPassword" value={formData.confirmPassword}
                    onChange={handleChange} error={errors.confirmPassword} required
                    showToggle showPassword={showConfirm} onToggle={() => setShowConfirm((p) => !p)}
                    placeholder="Re-enter password" />
                </div>

                {/* Password requirements hint */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Password must include:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                    {['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number'].map((req) => (
                      <div key={req} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                        {req}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terms */}
                <p className="text-xs text-gray-400 mt-4 text-center">
                  By registering, you agree to our{' '}
                  <Link to={ROUTES.TERMS_CONDITIONS} className="text-blue-600 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to={ROUTES.PRIVACY_POLICY} className="text-blue-600 hover:underline">Privacy Policy</Link>.
                </p>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <BuildingIcon />
                      Register as Recruiter
                    </>
                  )}
                </motion.button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Already have an account?{' '}
                  <Link to={ROUTES.LOGIN} className="text-blue-600 font-semibold hover:underline">Sign in</Link>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* ── Verify email modal ── */}
      <Modal
        open={verifyDialogOpen}
        onClose={() => setVerifyDialogOpen(false)}
        title="Verify Your Email"
        actions={
          <>
            <button onClick={() => window.open('https://mail.google.com', '_blank')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
              Open Gmail
            </button>
            <button onClick={() => setVerifyDialogOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Close
            </button>
          </>
        }
      >
        A confirmation email has been sent to <span className="font-semibold text-gray-800">{formData.hrEmail}</span>.
        Please verify your email before logging in.
      </Modal>

      {/* ── Account exists modal ── */}
      <Modal
        open={existingDialogOpen}
        onClose={() => setExistingDialogOpen(false)}
        title="Account Already Exists"
        actions={
          <>
            <button onClick={() => navigate(ROUTES.LOGIN)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
              Sign In
            </button>
            <button onClick={() => setExistingDialogOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Close
            </button>
          </>
        }
      >
        An account with this email already exists. If you have already verified your email, please sign in to continue.
      </Modal>
    </Layout>
  );
};
