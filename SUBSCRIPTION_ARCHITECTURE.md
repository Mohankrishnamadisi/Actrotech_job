# Actrotech Candidate Subscription Architecture - Comprehensive Inventory

## Executive Summary

The Actrotech platform implements a **three-tier subscription model** for job seekers (candidates) with clear entitlement management, job access gating, and delayed notification delivery for free users. The architecture uses Supabase Edge Functions for real-time job matching and notification scheduling.

---

## 1. PRICING & PLANS

### Candidate Subscription Plans
**Location**: [src/constants/index.ts](src/constants/index.ts#L30-L62)

| Plan | Price (INR) | Duration | Period | Recommended |
|------|-------------|----------|--------|-------------|
| Basic | 149 | 1 Month | month | ❌ |
| Premium | 269 | 2 Months | months | ✅ (marked `recommended: true`) |
| Pro | 399 | 3 Months | months | ❌ |

### Payment Calculation
**Location**: [src/constants/index.ts](src/constants/index.ts#L81-L82)

```typescript
// Gateway Fee & GST (applied on top of base plan price)
SUBSCRIPTION_GATEWAY_FEE_PERCENT = 2%
SUBSCRIPTION_GST_PERCENT = 18%

// Total Amount Calculation (used in Pricing.tsx, PaymentModal.tsx, PaymentSection.tsx)
gatewayFee = plan.price × 2% (rounded)
gstAmount = (plan.price + gatewayFee) × 18% (rounded)
totalAmount = plan.price + gatewayFee + gstAmount
```

**Example (Premium Plan)**:
- Base: ₹269
- Gateway Fee: ₹5 (2% of 269)
- GST: ₹49.32 → ₹49 (18% of 274)
- **Total: ₹323**

### Discount Calculation
**Location**: [src/components/payments/PaymentSection.tsx](src/components/payments/PaymentSection.tsx#L123)
```typescript
// Multi-month plans show discount vs monthly rate
if (durationMonths > 1) {
  discount = round(((baseMonthlyRate - 100) / baseMonthlyRate) * 100)
}
```

---

## 2. SUBSCRIPTION TYPES & CONSTANTS

### User Interface Type Definition
**Location**: [src/types/index.ts](src/types/index.ts#L115) and [src/types/index.ts](src/types/index.ts#L150)

```typescript
// JobSeeker interface
subscriptionPlan?: 'basic' | 'premium' | 'pro'
subscriptionExpiry?: string

// Recruiter interface (also has subscriptionPlan field)
subscriptionPlan?: 'basic' | 'premium' | 'pro'
subscriptionExpiry?: string
```

### Plan Features by Tier
**Location**: [src/pages/Pricing.tsx](src/pages/Pricing.tsx#L107-L138)

#### Basic Plan
- ✅ Access to Onsite jobs
- ✅ View job details
- ✅ Save jobs (limited to 5)
- ✅ Email notifications

#### Premium Plan (Recommended)
- ✅ All Basic features
- ✅ **Access to Remote & Hybrid jobs** (gated)
- ✅ Unlimited job saves
- ✅ Apply without resume upload
- ✅ Weekly job digest
- ✅ Priority job recommendations
- ✅ Remote Hub access
- ✅ Premium Command Deck
- ✅ Profile visibility boost
- ✅ Direct recruiter messaging
- ✅ AI Matched Jobs (Dashboard)

#### Pro Plan
- ✅ All Premium features
- ✅ Early access to new jobs
- ✅ Personalized job matching
- ✅ Bulk apply feature
- ✅ **Mock interview sessions** (Pro-only)
- ✅ **1-on-1 career coaching** (Pro-only)
- ✅ **Resume review & optimization** (Pro-only)
- ✅ **Portfolio building assistance** (Pro-only)

---

## 3. SUBSCRIPTION SERVICE LAYER

### Database Schema
**Location**: Referenced in [src/services/api.ts](src/services/api.ts#L911-L946)

```typescript
// subscriptions table structure
{
  id: string (UUID)
  user_id: string (FK to auth.users)
  plan: string ('basic' | 'premium' | 'pro' | 'free' | 'enterprise')
  status: string ('active' | 'expired' | 'cancelled' | etc.)
  start_date: ISO timestamp
  end_date: ISO timestamp (expiry)
  payment_id: string (FK to payments table)
  amount: number (base price in INR)
  created_at: ISO timestamp
  updated_at: ISO timestamp
}

// payments table structure
{
  id: string (UUID)
  user_id: string (FK to auth.users)
  subscription_id: string (FK to subscriptions)
  amount: number (total with GST)
  currency: string ('INR')
  status: string ('completed' | 'failed' | 'pending')
  method: string ('razorpay' | 'phonepe' | 'credit_card' | 'upi')
  transaction_id?: string (gateway reference)
  created_at: ISO timestamp
  updated_at: ISO timestamp
}
```

### Subscription Service API
**Location**: [src/services/api.ts](src/services/api.ts#L901-L1010)

```typescript
subscriptionService = {
  // Create or upgrade subscription
  createSubscription(
    userId: string,
    plan: string,
    expiryDate: string | null,
    amount?: number,
    paymentId?: string
  ): Promise<SubscriptionRecord>
  // Logic: Expires previous active subscriptions before creating new one

  // Get active subscription for user
  getUserSubscription(userId: string): Promise<Subscription | null>
  // Returns: active subscription with 'active' status, or null

  // Get active subscriptions for multiple users (batch)
  getActiveSubscriptionsForUserIds(userIds: string[]): Promise<Record<userId, planName>>
  // Returns: Map of userId -> plan string

  // Update subscription
  updateSubscription(
    subscriptionId: string,
    updates: Record<string, unknown>
  ): Promise<SubscriptionRecord>
}

paymentService = {
  // Record payment transaction
  createPayment(
    userId: string,
    subscriptionId: string,
    amount: number,
    method: 'razorpay' | 'phonepe' | 'credit_card' | 'upi'
  ): Promise<PaymentRecord>

  // Update payment status after gateway confirmation
  updatePaymentStatus(
    paymentId: string,
    status: string,
    transactionId?: string
  ): Promise<PaymentRecord>

  // Retrieve user's payment history
  getUserPayments(userId: string): Promise<PaymentRecord[]>
}
```

### Premium Detection Logic
**Location**: Multiple files use this pattern

```typescript
// Standardized premium check (used across codebase)
const isPremiumPlan = (plan: string): boolean => {
  return ['premium', 'pro', 'enterprise'].includes(plan.toLowerCase())
}
```

**Used in**:
- [src/services/aiCareerHub.ts](src/services/aiCareerHub.ts#L248)
- [src/services/api.ts](src/services/api.ts#L1221)
- [src/services/jobMatchService.ts](src/services/jobMatchService.ts) (implied usage)
- [supabase/functions/process-job-matches/index.ts](supabase/functions/process-job-matches/index.ts#L168)

---

## 4. CANDIDATE PREMIUM ENTITLEMENT HELPERS

### isPremiumCandidate Function
**Location 1**: [src/services/jobMatchService.ts](src/services/jobMatchService.ts#L140-L163)

```typescript
export async function isPremiumCandidate(candidateId: string): Promise<boolean> {
  try {
    // Query subscriptions using candidateId as user_id
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', candidateId)
      .eq('status', 'active')
      .maybeSingle()

    if (!subscription) return false

    const plan = String(subscription.plan || '').toLowerCase()
    return ['premium', 'pro', 'enterprise'].includes(plan)
  } catch (error) {
    return false
  }
}
```

**Location 2**: [supabase/functions/process-job-matches/index.ts](supabase/functions/process-job-matches/index.ts#L155-L168)
- Duplicated in Edge Function for serverless job matching

### Premium Permission Checks
**Location**: [src/services/aiCareerHub.ts](src/services/aiCareerHub.ts#L400-L417)

```typescript
async getPermissions(userId: string): Promise<{
  plan: string
  isPremium: boolean
  remainingDailyRequests: number | null
}> {
  const plan = await subscriptionPlan(userId)
  const premium = isPremiumPlan(plan)
  const store = readStore()
  const usage = ensureUsage(store, userId)
  
  return {
    plan,
    isPremium: premium,
    // Premium: unlimited, Free: tracked daily limit (20 requests)
    remainingDailyRequests: premium ? null : Math.max(0, FREE_DAILY_LIMIT - usage.requests)
  }
}
```

### AI Daily Request Limits
**Location**: [src/services/aiCareerHub.ts](src/services/aiCareerHub.ts#L197)

```typescript
const FREE_DAILY_LIMIT = 20  // Free users get 20 AI requests per day
```

**Usage in AiCareerHub**: [src/pages/dashboard/AiCareerHub.tsx](src/pages/dashboard/AiCareerHub.tsx#L297)
```typescript
const requestsLabel = permissions?.isPremium 
  ? 'Unlimited AI Access' 
  : `${permissions?.remainingDailyRequests ?? 0} requests left today`
```

**Error on limit exceeded**: [src/services/aiCareerHub.ts](src/services/aiCareerHub.ts#L489)
```typescript
if (!permissions.isPremium && Number(permissions.remainingDailyRequests || 0) <= 0) {
  throw new Error('Free plan AI request limit reached for today. Upgrade to premium for unlimited requests.')
}
```

---

## 5. JOB ACCESS & GATING

### Remote Job Locking - JobDetails Page
**Location**: [src/pages/JobDetails.tsx](src/pages/JobDetails.tsx#L180-L343)

```typescript
// Line 180-182: Determine if remote job access is locked
const requiresSubscription = workModeLabel === 'Remote'
const isPremiumCandidate = subscription && ['premium', 'pro'].includes(String(subscription?.plan || '').toLowerCase())
const showRemotePremium = workModeLabel === 'Remote' && !subscription

// Visual Effects When Locked
{showRemotePremium ? 'Upgrade to view company' : job.company_name}
sx={{
  ...(showRemotePremium ? { filter: 'blur(4px)', userSelect: 'none' } : {})
}}
```

### Remote Job Access Flow
**Lines 268-343 in JobDetails.tsx**:

1. **Not Logged In** → Prompt login
   ```typescript
   title: 'Login to apply and unlock job opportunities.'
   text: 'Login to apply and unlock job opportunities.'
   ```

2. **Logged In, Not Premium** → Show upgrade prompt
   ```typescript
   title: 'Premium access required'
   text: 'Remote Jobs are available only for Premium Members.'
   button: () => navigate(ROUTES.PRICING)
   ```

3. **Premium** → Allow application

### Premium Feature Indicators
**Lines 726-814 in JobDetails.tsx**:

```typescript
// Show premium badge only for premium/pro subscribers
{subscription && ['premium', 'pro'].includes(String(subscription.plan || '').toLowerCase()) && (
  <>
    <WorkspacePremiumIcon sx={{ color: 'primary.main' }} />
    <Typography>Premium Feature</Typography>
    <Button onClick={() => navigate(ROUTES.PRICING)}>Upgrade to Premium</Button>
  </>
)}
```

### Remote Job Visibility in Lists
**Location**: [src/components/jobs/JobCard.tsx](src/components/jobs/JobCard.tsx#L26-L38) and [src/components/jobs/HorizontalJobListItem.tsx](src/components/jobs/HorizontalJobListItem.tsx#L26-L38)

```typescript
interface JobCardProps {
  job: Job
  onSave?: () => void
  isSaved?: boolean
  isPremiumUser?: boolean  // ← new prop
}

export const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onSave, 
  isSaved = false, 
  isPremiumUser = false  // ← defaults to false
}) => {
  const showRemotePremium = workMode === 'Remote' && !isPremiumUser
  // If true: show blur, lock, "Upgrade" CTA
}
```

**Usage in Jobs page** [src/pages/Jobs.tsx](src/pages/Jobs.tsx#L834):
```typescript
<JobCard 
  job={job}
  isPremiumUser={!!subscription}  // ← Pass subscription status
/>
```

### Priority Apply Feature
**Location**: [src/pages/dashboard/tools/PriorityApply.tsx](src/pages/dashboard/tools/PriorityApply.tsx#L33-L112)
- Premium-only fast-track application feature
- Found in navbar: [src/components/layout/Navbar.tsx](src/components/layout/Navbar.tsx#L199)

**Subscription Check** [src/services/api.ts](src/services/api.ts#L725-L733):
```typescript
const sub = await subscriptionService.getUserSubscription(userId)
const lowerPlan = (sub?.plan || '').toLowerCase()
const isPremiumCandidate = ['premium', 'pro'].includes(lowerPlan)
```

---

## 6. JOB MATCH NOTIFICATIONS ARCHITECTURE

### Notification Delivery Overview
**Location**: [src/services/jobMatchNotificationDelivery.ts](src/services/jobMatchNotificationDelivery.ts#L1-L300)

**Key Principle**: 
- **Premium candidates**: Receive notifications IMMEDIATELY (scheduled_for = NULL)
- **Free candidates**: Receive notifications with +4 HOUR DELAY (scheduled_for = NOW + 4 hours)

### Job Match to Notification Flow

```
1. Job Posted
   ↓
2. Edge Function: process-job-matches triggered
   ├─ Query all job_seeker profiles
   ├─ For each candidate:
   │  ├─ Check skill match
   │  ├─ Check designation match
   │  ├─ Check if candidate is premium (via subscriptions table)
   │  ├─ Calculate scheduledFor timestamp
   │  └─ Create job_match_notifications record
   ├─ Insert all matches (upsert, idempotent)
   └─ Trigger deliver-scheduled-notifications Edge Function
   ↓
3. Notification Delivery Handlers
   ├─ deliverPremiumNotifications() → NOW
   └─ deliverScheduledNotifications() → After 4 hours (scheduler)
   ↓
4. Create notifications table record
```

### Job Match Notification Record
**Database Table**: `job_match_notifications`

```typescript
{
  id: UUID
  job_id: string (FK to jobs)
  candidate_id: string (FK to profiles)
  match_type: 'skill' | 'designation' | 'both'
  matched_skills: string[] (first 5 matched)
  matched_titles: string[] (first 3 matched)
  match_score: number (60=designation, 75=skill, 90=both)
  notification_tier: 'premium' | 'normal'  // ← Tier based on subscription
  scheduled_for: ISO timestamp | NULL
    // NULL = immediate (premium)
    // ISO datetime = 4h delay (free)
  is_delivered: boolean
  notification_id: UUID | NULL (FK to notifications table after delivery)
  created_at: ISO timestamp
}
```

### Process Job Matches Function
**Location**: [supabase/functions/process-job-matches/index.ts](supabase/functions/process-job-matches/index.ts#L1-400)

```typescript
async function isPremiumCandidate(candidateId: string): Promise<boolean> {
  // Query subscriptions table using candidateId as user_id
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', candidateId)
    .eq('status', 'active')
    .maybeSingle()
  
  if (!subscription) return false
  
  const plan = String(subscription.plan || '').toLowerCase()
  return ['premium', 'pro', 'enterprise'].includes(plan)
}

// For each matched candidate:
const isPremium = await isPremiumCandidate(candidate.id)

let matchType: 'skill' | 'designation' | 'both' = 'skill'
if (skillMatch.matched && designationMatch.matched) {
  matchType = 'both'
} else if (designationMatch.matched) {
  matchType = 'designation'
}

const matchScore = matchType === 'both' 
  ? 90 
  : matchType === 'skill' 
  ? 75 
  : 60

// CRITICAL: Schedule based on premium status
const scheduledFor = isPremium
  ? null  // ← NULL = deliver now
  : new Date(new Date(job.created_at).getTime() + 4 * 60 * 60 * 1000).toISOString()
    // ← 4 hours delay for free users

matchesFound.push({
  candidateId: candidate.id,
  matchType,
  matchedSkills: skillMatch.matchedSkills,
  matchedTitles: designationMatch.matchedTitles,
  matchScore,
  isPremium,
  scheduledFor
})
```

**Lines 255-276**: Full match creation logic

**Lines 293-295**: Database insert with tier assignment
```typescript
notification_tier: match.isPremium ? 'premium' : 'normal'
scheduled_for: match.scheduledFor
```

### Deliver Premium Notifications
**Location**: [src/services/jobMatchNotificationDelivery.ts](src/services/jobMatchNotificationDelivery.ts#L200-L270)

```typescript
export async function deliverPremiumNotifications(): Promise<number> {
  // Query undelivered premium notifications (scheduled_for IS NULL)
  const { data: matches } = await supabase
    .from('job_match_notifications')
    .select(...)
    .eq('notification_tier', 'premium')
    .eq('is_delivered', false)
    .is('scheduled_for', null)  // ← NULL = ready to deliver

  let delivered = 0
  for (const match of matches || []) {
    try {
      await deliverJobMatchNotification({...})
      delivered++
    } catch (error) {
      // Continue with next
    }
  }
  
  return delivered
}
```

### Deliver Scheduled Notifications
**Location**: [src/services/jobMatchNotificationDelivery.ts](src/services/jobMatchNotificationDelivery.ts#L272-L320)

```typescript
export async function deliverScheduledNotifications(): Promise<number> {
  const now = new Date().toISOString()
  
  // Query notifications where scheduled_for <= NOW
  const { data: matches } = await supabase
    .from('job_match_notifications')
    .select(...)
    .eq('notification_tier', 'normal')
    .eq('is_delivered', false)
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', now)  // ← Due for delivery

  let delivered = 0
  for (const match of matches || []) {
    try {
      await deliverJobMatchNotification({...})
      delivered++
    } catch (error) {
      // Continue with next
    }
  }
  
  return delivered
}
```

### Notification Content Customization
**Location**: [src/services/jobMatchNotificationDelivery.ts](src/services/jobMatchNotificationDelivery.ts#L24-L75)

**Premium Notification**:
```typescript
if (payload.isPremium) {
  title: '🔥 New Job Match — Apply Fast'
  cta: 'Apply Fast'  // ← Emphasizes urgency
}
```

**Free Notification**:
```typescript
else {
  title: '🎯 Job Match For You'
  cta: 'View Job'
}
```

---

## 7. AI CAREER HUB - PREMIUM ACCESS

### Service Location
**Location**: [src/services/aiCareerHub.ts](src/services/aiCareerHub.ts)

### AI Features Premium Gating
**Location**: [src/pages/dashboard/AiCareerHub.tsx](src/pages/dashboard/AiCareerHub.tsx#L297)

```typescript
const requestsLabel = permissions?.isPremium 
  ? 'Unlimited AI Access' 
  : `${permissions?.remainingDailyRequests ?? 0} requests left today`

// Premium indicator in UI (line 894)
<Alert severity={permissions.isPremium ? 'success' : 'warning'}>
  {permissions.isPremium 
    ? 'You have unlimited AI access with your premium subscription'
    : `Free access: ${permissions.remainingDailyRequests} AI requests remaining...`
  }
</Alert>
```

### Free Plan AI Limits
**Location**: [src/services/aiCareerHub.ts](src/services/aiCareerHub.ts#L197)

```typescript
const FREE_DAILY_LIMIT = 20

// Error handling (line 489)
if (!permissions.isPremium && Number(permissions.remainingDailyRequests || 0) <= 0) {
  throw new Error('Free plan AI request limit reached for today. Upgrade to premium for unlimited requests.')
}
```

### AI Features Available
**Location**: [src/pages/dashboard/AiCareerHub.tsx](src/pages/dashboard/AiCareerHub.tsx) - Multiple tabs

- **Resume Builder**: Available to premium+
- **Mock Interviews**: Pro-only (line 682-725)
- **Career Brief**: Premium-only
- **Cover Letter Generator**: Premium-only
- **Interview Prep**: Premium-only
- **Daily AI Career Brief**: [src/components/dashboard/AiDailyCareerBrief.tsx](src/components/dashboard/AiDailyCareerBrief.tsx)

---

## 8. PREMIUM DASHBOARD

### Access Control
**Location**: [src/pages/dashboard/PremiumDashboard.tsx](src/pages/dashboard/PremiumDashboard.tsx#L168-L1975)

**Entry Point**: `/dashboard/premium` (in App.tsx routing)

### Dashboard Sections (Premium Features)
**Location** [src/pages/dashboard/PremiumDashboard.tsx](src/pages/dashboard/PremiumDashboard.tsx#L149-L165):

```typescript
type PremiumSectionKey = 
  | 'premiumTools'
  | 'intelligence'
  | 'remoteHub'

sectionTabs = [
  { key: 'intelligence', label: 'Premium Intelligence Center', icon: InsightsIcon },
  { key: 'remoteHub', label: 'Remote Job Hub', icon: PublicIcon },
  { key: 'premiumTools', label: 'Exclusive Premium Tools', icon: AutoAwesomeIcon },
]
```

### Premium Intelligence Center
**Lines 1069-1180**:
- Demand Score (0-100)
- Recent Applications (7 days)
- Interview Pipeline Count
- Profile Strengths
- Weekly Goals
- AI Visibility Suggestions (premium-only, vs Basic for free)

**Premium-only insight** (line 390):
```typescript
{context.isPremium 
  ? 'AI Visibility Suggestions' 
  : 'Basic Suggestions'
}
```

### Remote Job Hub Section
**Lines 1234-1290**:
- Browse remote roles (filtered by skills)
- Remote Applications tracker
- Priority Remote Matches
- Available only to Premium+ users

### Exclusive Premium Tools
**Lines 1314-1650**:
- Mock Interviews
- Resume Review
- Career Coaching
- Portfolio Building

**Gating Logic** (line 692):
```typescript
{
  isPremium: true,  // Only premium users see this data
}
```

### Premium Dashboard Default Section
**Line 195**: `useState<PremiumSectionKey>('premiumTools')` - defaults to Premium Tools tab

---

## 9. REGULAR DASHBOARD - PREMIUM VS FREE SECTIONS

### Location
**Location**: [src/pages/dashboard/Dashboard.tsx](src/pages/dashboard/Dashboard.tsx#L1-1200)

### Subscription Hook
**Line 134**:
```typescript
const { subscription } = useSubscription(user?.id || null)
```

### Subscription Chip Display
**Line 601**:
```typescript
<Chip 
  label={subscription?.plan ? `Premium • ${subscription.plan}` : 'Basic'} 
  sx={{ bgcolor: 'rgba(255,255,255,0.12)', ... }}
/>
```

### Dashboard Sections
**Lines 166-178**: Navigation with badges

```typescript
{ 
  label: 'Notifications', 
  icon: NotificationsIcon, 
  to: ROUTES.DASHBOARD_NOTIFICATIONS, 
  badge: notificationsCount  // ← Shows unread count
},
{ 
  label: 'Chat', 
  icon: ChatIcon, 
  to: ROUTES.MESSAGING, 
  badge: unreadMessagesCount  // ← For authenticated users only
}
```

### Premium Features in Main Dashboard
- **Remote Hub** (line 181): Premium-only link
- **Mock Interview** (line 193): Pro-only
- **Resume Review** (line 194): Pro-only
- **Profile Strength Progress**: Higher values for premium
- **"Go Premium" CTA** (lines 1023-1026): Unlock section for non-premium users

---

## 10. REMOTE JOBS HUB

### Location
**Location**: [src/pages/dashboard/RemoteJobs.tsx](src/pages/dashboard/RemoteJobs.tsx)

### Access Requirement
- Linked from Premium Dashboard Remote Hub section
- Linked from Premium Command Deck (line 830)
- **Premium-only feature** (see [src/pages/Pricing.tsx](src/pages/Pricing.tsx#L123))

### Functionality
**Lines 28-90**:

```typescript
export const RemoteJobs: React.FC = () => {
  // Fetch all remote jobs (work_mode = 'Remote')
  const allJobs = await jobService.getJobs({ work_mode: 'Remote' }, 1, 50)
  
  // Filter by user skills
  const remoteJobsWithSkills = getJobList(allJobs).filter((job: any) =>
    (job.skills || []).some((jobSkill: string) =>
      skills.some((userSkill) =>
        String(userSkill).toLowerCase() === String(jobSkill).toLowerCase()
      )
    )
  )
  
  // Calculate match percentage
  const matchPercentage = Math.round((matches / jobSkills.length) * 100)
}
```

### Job Cards Display
**Lines 130-200**:
- Company name
- Job title
- Match percentage
- Required skills (with checkmarks for matched skills)
- "View Job Details" button
- Hover effects with green theme (rgba(76,175,80,...))

---

## 11. RECRUITER ACTIVITY CENTER

### Location
**Location**: [src/components/dashboard/RecruiterActivityCenter.tsx](src/components/dashboard/RecruiterActivityCenter.tsx#L140-L420)

### Premium vs Free Insights
**Line 170-407**:

```typescript
// Premium-only: More detailed insights
{context.isPremium ? (
  // Full insights: trend analysis, visibility breakdown, etc.
) : (
  // Limited: basic overview only
)}

// Premium-only: Full timeline (10 events)
// Free: Limited timeline (6 events)
{insights.timeline.slice(0, context.isPremium ? 10 : 6).map(...)}

// Premium-only: AI Visibility Suggestions
{context.isPremium 
  ? 'AI Visibility Suggestions' 
  : 'Basic Suggestions'
}
```

### Premium-Only Insights
**Lines 197-246**:

```typescript
const locked = item.premiumOnly && !context.isPremium

// Recruiter activity filters by subscription tier
// premiumOnly = true items locked for non-premium users
```

### Context Definition
**Location**: [src/services/recruiterActivity.ts](src/services/recruiterActivity.ts#L20-L45)

```typescript
export interface RecruiterActivityContext {
  userId: string
  isPremium: boolean  // ← Key flag
  profileCompletion: number
  resumeDownloads: number
  profileViews: number
  recruiterMessages: number
  savedJobs: number
  skillsCount: number
  assessmentsCompleted: number
  hasResume: boolean
  recentApplications: RecruiterActivityApplication[]
}
```

---

## 12. PAYMENT FLOW

### Pricing Page Entry
**Location**: [src/pages/Pricing.tsx](src/pages/Pricing.tsx#L1-400)

**Flow**:
1. User selects plan from 3 options (Basic/Premium/Pro)
2. System calculates: Base + Gateway Fee (2%) + GST (18%)
3. User selects payment method: Razorpay (default), PhonePe, Credit Card, UPI
4. User clicks "Subscribe" button

### Payment Modal
**Location**: [src/components/payments/PaymentModal.tsx](src/components/payments/PaymentModal.tsx#L1-800)

**Steps in Modal**:
1. **Select Method** (Stepper Step 0)
   - Choose payment gateway
   - Show payment method options

2. **Review & Confirm** (Stepper Step 1)
   - Display plan details
   - Show price breakdown
   - Show total amount

3. **Payment Complete** (Stepper Step 2)
   - Success message
   - Redirect to dashboard

### Payment Section Component
**Location**: [src/components/payments/PaymentSection.tsx](src/components/payments/PaymentSection.tsx#L1-500+)

**Payment Methods Displayed**:
- **Razorpay**: Fast & Secure Payment (default)
- **PhonePe**: UPI Payment
- **Credit Card**: Debit or Credit with EMI
- **UPI**: Direct Bank Transfer

### Complete Payment Flow
**Location**: [src/pages/Pricing.tsx](src/pages/Pricing.tsx#L74-97)

```typescript
const handleSubscribe = async () => {
  if (!user) {
    navigate(ROUTES.LOGIN)
    return
  }

  try {
    // 1. Calculate expiry date
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + selectedPlan.durationMonths)
    
    // 2. Create subscription record
    const subscription = await subscriptionService.createSubscription(
      user.id,
      selectedPlan.id,
      expiryDate.toISOString()
    )
    
    // 3. Create payment record
    const payment = await paymentService.createPayment(
      user.id,
      subscription.id,
      totalAmount,  // includes GST
      paymentMethod
    )
    
    // 4. Show success & redirect
    toast.success('Subscription successful!')
    navigate(ROUTES.DASHBOARD)
  } catch (error) {
    toast.error('Failed to complete subscription')
  }
}
```

### Database Changes on Payment
**Location**: [src/services/api.ts](src/services/api.ts#L902-L970)

```typescript
async createSubscription(...) {
  // 1. Check for active subscriptions
  const activeSubscriptions = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
  
  // 2. Expire previous active subscriptions
  if (activeSubscriptions.length > 0) {
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active')
  }
  
  // 3. Create new subscription
  const { data } = await supabase
    .from('subscriptions')
    .insert([{
      user_id: userId,
      plan,
      status: 'active',
      start_date: startDate,
      end_date: expiryDate,
      payment_id: paymentId,
      amount
    }])
  
  // 4. Update recruiter_credits if premium plan
  if (['premium', 'pro', 'enterprise'].includes(lowerPlan)) {
    // Set available_credits = -1 (unlimited)
    await supabase
      .from('recruiter_credits')
      .update({ available_credits: -1 })
      .eq('recruiter_id', userId)
  }
}
```

---

## 13. LEGACY PLAN HANDLING & MIGRATION

### Recruiter Subscription Page (Different System)
**Location**: [src/pages/recruiter/RecruiterSubscriptionPage.tsx](src/pages/recruiter/RecruiterSubscriptionPage.tsx#L1-250)

**Plans for Recruiters** (different from candidates):
```typescript
const RECRUITER_PLANS = [
  { id: 'free', priceLabel: '₹0/month', price: 0 },
  { id: 'starter', priceLabel: '₹999/month', price: 999 },
  { id: 'professional', priceLabel: 'Contact Sales', price: null },
]
```

**Activation of Free Plan** (line 172):
```typescript
if (!selectedPlan.price) {
  // Free plan activation
  await subscriptionService.createSubscription(
    user.id,
    'free',
    expiryDate.toISOString(),
    0  // zero amount
  )
}
```

### Billing Subscription Service (Recruiter)
**Location**: [src/services/billingSubscription.ts](src/services/billingSubscription.ts#L10-L350)

**Separate system for recruiters** with PlanId types:
```typescript
export type PlanId = 'free' | 'starter' | 'professional' | 'business' | 'enterprise'

// Recruiter plan catalog with different pricing
const planCatalog: SubscriptionPlan[] = [
  { id: 'free', name: 'Free', priceMonthly: 0, ... },
  { id: 'starter', name: 'Starter', priceMonthly: 1499, ... },
  { id: 'professional', name: 'Professional', priceMonthly: 3999, ... },
  { id: 'business', name: 'Business', priceMonthly: 9999, ... },
  { id: 'enterprise', name: 'Enterprise', priceMonthly: 0, ... },
]
```

**Note**: This is a SEPARATE subscription system from candidate subscriptions

---

## 14. NOTIFICATION BADGE & UNREAD COUNT

### Hook: useNotificationBadge
**Location**: [src/hooks/useJobMatchNotifications.ts](src/hooks/useJobMatchNotifications.ts#L161-L225)

```typescript
export function useNotificationBadge(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0)
  
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0)
      return
    }
    
    const fetchUnreadCount = async () => {
      // Query unread notifications
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('read', false)
      
      setUnreadCount(data?.length || 0)
    }
    
    fetchUnreadCount()
    // Subscribe to real-time updates
    const subscription = supabase
      .on('postgres_changes', {...}, () => {
        fetchUnreadCount()
      })
      .subscribe()
  }, [userId])
  
  return { unreadCount }
}
```

### Badge Display Locations
**Location**: [src/components/layout/Navbar.tsx](src/components/layout/Navbar.tsx#L675)
```typescript
<Badge badgeContent={unreadMessagesCount}>
  <NotificationsIcon />
</Badge>
```

**In Dashboard**: [src/pages/dashboard/Dashboard.tsx](src/pages/dashboard/Dashboard.tsx#L649)
```typescript
<IconButton 
  onClick={() => navigate(ROUTES.DASHBOARD_NOTIFICATIONS)}
>
  <NotificationsIcon sx={{ fontSize: 18 }} />
</IconButton>
```

### Notifications Only for Authenticated Users
**Location**: [src/services/api.ts](src/services/api.ts#L779)

```typescript
// Valid notification types
const validTypes = ['job_match', 'application_status', 'new_job', 'subscription']

// Notifications operations
export const notificationService = {
  async createNotification(userId: string, type: string, title: string, message: string) {
    // Only authenticated users receive notifications
    return supabase
      .from('notifications')
      .insert([{ user_id: userId, type, title, message, read: false }])
  }
}
```

---

## 15. TYPE DEFINITIONS SUMMARY

### Subscription-Related Types
**Location**: [src/types/index.ts](src/types/index.ts)

```typescript
// User subscription info
interface JobSeeker extends User {
  subscriptionPlan?: 'basic' | 'premium' | 'pro'
  subscriptionExpiry?: string
}

interface Recruiter extends User {
  subscriptionPlan?: 'basic' | 'premium' | 'pro'
  subscriptionExpiry?: string
}

// Notification types
interface NotificationDeliveryPayload {
  jobMatchNotificationId: string
  candidateId: string
  jobId: string
  jobTitle: string
  companyName: string
  matchType: 'skill' | 'designation' | 'both'
  matchedSkills: string[]
  matchedTitles: string[]
  isPremium: boolean  // ← Key for delivery timing
  matchScore: number
}

// Job Match Result
interface JobMatchResult {
  candidateId: string
  matchType: 'skill' | 'designation' | 'both'
  matchedSkills: string[]
  matchedTitles: string[]
  matchScore: number
  isPremium: boolean
  scheduledFor?: Date
}

// Recruiter Activity
interface RecruiterActivityContext {
  isPremium: boolean
  profileCompletion: number
  resumeDownloads: number
  profileViews: number
  recruiterMessages: number
  // ... more fields
}
```

---

## 16. SUPABASE EDGE FUNCTIONS

### process-job-matches
**Location**: [supabase/functions/process-job-matches/index.ts](supabase/functions/process-job-matches/index.ts)

**Trigger**: When a job is posted
**Purpose**: Match job against all candidate profiles
**Inputs**: 
```typescript
{
  jobId: string  // Job ID to match
}
```

**Process**:
1. Fetch job details
2. Get all job_seeker profiles with skills
3. For each candidate:
   - Check skill match
   - Check designation match
   - Check if premium (isPremiumCandidate function)
   - Calculate scheduledFor timestamp
4. Insert job_match_notifications records
5. Call deliver-scheduled-notifications for immediate premium delivery

**Outputs**:
```typescript
{
  success: boolean
  jobId: string
  matchesFound: number
  premiumMatches: number
  normalMatches: number
}
```

### deliver-scheduled-notifications
**Location**: [supabase/functions/deliver-scheduled-notifications/index.ts](supabase/functions/deliver-scheduled-notifications/index.ts)

**Trigger**: 
- Immediately after process-job-matches (for premium)
- Scheduled function (for free users after 4 hours)

**Purpose**: Convert job_match_notifications to actual notifications

**Process**:
1. Call deliverPremiumNotifications() (scheduled_for IS NULL)
2. Call deliverScheduledNotifications() (scheduled_for <= NOW)
3. For each match:
   - Get candidate's user_id
   - Build notification content (custom title/CTA for premium)
   - Insert into notifications table
   - Update job_match_notification.is_delivered = true

---

## 17. COMPLETE ENTITLEMENT CHECK PATTERNS

### Pattern 1: Get Subscription in Hook
**Location**: [src/hooks/index.ts](src/hooks/index.ts#L3-L50)

```typescript
export function useSubscription(userId: string | null) {
  const [subscription, setSubscription] = useState(null)
  
  useEffect(() => {
    if (!userId) return
    
    subscriptionService.getUserSubscription(userId)
      .then(data => setSubscription(data))
      .catch(() => setSubscription(null))
  }, [userId])
  
  return { subscription }
}
```

### Pattern 2: Check Premium Status
```typescript
const isPremium = subscription && ['premium', 'pro'].includes(
  String(subscription.plan || '').toLowerCase()
)
```

### Pattern 3: Gate Feature Access
```typescript
if (requiresPremium && !isPremium) {
  return <UpgradePrompt />
}
```

### Pattern 4: Show Premium Badge
```typescript
{isPremium && <PremiumBadge plan={subscription.plan} />}
```

---

## 18. FEATURE MATRIX

| Feature | Basic | Premium | Pro |
|---------|-------|---------|-----|
| **Job Access** | | | |
| Onsite Jobs | ✅ | ✅ | ✅ |
| Remote & Hybrid | ❌ | ✅ | ✅ |
| Early Access | ❌ | ❌ | ✅ |
| **Applications** | | | |
| Save Jobs | 5 | Unlimited | Unlimited |
| Quick Apply | ❌ | ✅ | ✅ |
| Bulk Apply | ❌ | ❌ | ✅ |
| **Recommendations** | | | |
| Job Matching | ❌ | ✅ | ✅ |
| Personalized | ❌ | ❌ | ✅ |
| **Dashboard** | | | |
| Remote Hub | ❌ | ✅ | ✅ |
| Premium Command Deck | ❌ | ✅ | ✅ |
| Profile Boost | ❌ | ✅ | ✅ |
| **Communications** | | | |
| Email Notifications | ✅ | ✅ | ✅ |
| Weekly Digest | ❌ | ✅ | ✅ |
| Direct Messaging | ❌ | ✅ | ✅ |
| **Career Tools** | | | |
| Mock Interviews | ❌ | ❌ | ✅ |
| Career Coaching | ❌ | ❌ | ✅ |
| Resume Review | ❌ | ❌ | ✅ |
| Portfolio Building | ❌ | ❌ | ✅ |
| **AI Features** | | | |
| AI Requests/Day | 20 | Unlimited | Unlimited |

---

## 19. KEY FILES REFERENCE

### Core Subscription Files
1. [src/constants/index.ts](src/constants/index.ts#L30-L82) - Plan definitions & constants
2. [src/types/index.ts](src/types/index.ts#L115-L150) - Type definitions
3. [src/services/api.ts](src/services/api.ts#L901-L1050) - Subscription & Payment services
4. [src/pages/Pricing.tsx](src/pages/Pricing.tsx) - Pricing page with feature matrix
5. [src/components/payments/PaymentModal.tsx](src/components/payments/PaymentModal.tsx) - Payment modal
6. [src/components/payments/PaymentSection.tsx](src/components/payments/PaymentSection.tsx) - Payment methods

### Job Access & Gating
7. [src/pages/JobDetails.tsx](src/pages/JobDetails.tsx#L180-L343) - Remote job access gating
8. [src/components/jobs/JobCard.tsx](src/components/jobs/JobCard.tsx#L26-L38) - Premium flag in jobs list
9. [src/pages/dashboard/RemoteJobs.tsx](src/pages/dashboard/RemoteJobs.tsx) - Remote Hub page

### Notifications
10. [src/services/jobMatchNotificationDelivery.ts](src/services/jobMatchNotificationDelivery.ts) - Notification delivery logic
11. [src/services/jobMatchService.ts](src/services/jobMatchService.ts) - Job matching service
12. [supabase/functions/process-job-matches/index.ts](supabase/functions/process-job-matches/index.ts) - Job match Edge Function
13. [supabase/functions/deliver-scheduled-notifications/index.ts](supabase/functions/deliver-scheduled-notifications/index.ts) - Delivery Edge Function

### Dashboard & Premium Features
14. [src/pages/dashboard/PremiumDashboard.tsx](src/pages/dashboard/PremiumDashboard.tsx) - Premium dashboard
15. [src/pages/dashboard/Dashboard.tsx](src/pages/dashboard/Dashboard.tsx) - Main dashboard with premium sections
16. [src/components/dashboard/RecruiterActivityCenter.tsx](src/components/dashboard/RecruiterActivityCenter.tsx) - Activity insights (premium gates)
17. [src/services/aiCareerHub.ts](src/services/aiCareerHub.ts#L240-L420) - AI Career Hub with premium checks

### Hooks & Utilities
18. [src/hooks/index.ts](src/hooks/index.ts#L3-L50) - useSubscription hook
19. [src/hooks/useJobMatchNotifications.ts](src/hooks/useJobMatchNotifications.ts#L161-L225) - Notification badge hook
20. [src/utils/resumeUnlocks.ts](src/utils/resumeUnlocks.ts) - Resume unlock utility

---

## 20. DATABASE SCHEMA SUMMARY

### Key Tables (Candidate Subscription)

**subscriptions**
```
id: UUID PRIMARY KEY
user_id: UUID FK → auth.users
plan: VARCHAR ('basic' | 'premium' | 'pro' | 'free' | 'enterprise')
status: VARCHAR ('active' | 'expired' | 'cancelled')
start_date: TIMESTAMP
end_date: TIMESTAMP
payment_id: UUID FK → payments
amount: INTEGER (INR, base price without GST)
created_at: TIMESTAMP
updated_at: TIMESTAMP
UNIQUE(user_id, status) for single active subscription per user
```

**payments**
```
id: UUID PRIMARY KEY
user_id: UUID FK → auth.users
subscription_id: UUID FK → subscriptions
amount: INTEGER (total with GST)
currency: VARCHAR ('INR')
status: VARCHAR ('completed' | 'failed' | 'pending')
method: VARCHAR ('razorpay' | 'phonepe' | 'credit_card' | 'upi')
transaction_id: VARCHAR (optional, gateway reference)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

**job_match_notifications**
```
id: UUID PRIMARY KEY
job_id: UUID FK → jobs
candidate_id: UUID FK → profiles
match_type: VARCHAR ('skill' | 'designation' | 'both')
matched_skills: TEXT[] (JSON array)
matched_titles: TEXT[] (JSON array)
match_score: INTEGER (60-90)
notification_tier: VARCHAR ('premium' | 'normal')
scheduled_for: TIMESTAMP | NULL (NULL = immediate, value = 4h delay)
is_delivered: BOOLEAN DEFAULT false
notification_id: UUID FK → notifications (after delivery)
created_at: TIMESTAMP
UNIQUE(job_id, candidate_id)
```

**notifications**
```
id: UUID PRIMARY KEY
user_id: UUID FK → auth.users
type: VARCHAR ('job_match' | 'application_status' | 'new_job' | 'subscription')
title: VARCHAR
message: TEXT
data: JSONB (metadata)
notification_metadata: JSONB (for job_match: includes isPremium, matchScore, etc.)
read: BOOLEAN DEFAULT false
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

**profiles** (candidate profiles)
```
id: UUID PRIMARY KEY
user_id: UUID FK → auth.users
role: VARCHAR ('job_seeker' | 'recruiter' | 'admin')
skills: TEXT[] (JSON array)
current_designation: VARCHAR
preferred_job_titles: TEXT[]
preferred_work_mode: VARCHAR ('Remote' | 'Hybrid' | 'Onsite')
dashboard_preferences: JSONB
premium_dashboard_config: JSONB
... other profile fields
```

---

## SUMMARY & KEY INSIGHTS

### Premium Detection
- **Single authoritative check**: `['premium', 'pro', 'enterprise'].includes(plan.toLowerCase())`
- **Implemented everywhere**: Services, components, Edge Functions
- **Database source**: subscriptions table (user_id, plan, status='active')

### Notification Strategy
- **Immediate (Premium)**: scheduled_for = NULL, delivered right away
- **Delayed (Free)**: scheduled_for = NOW + 4 hours
- **Idempotent**: Edge Function uses UPSERT with ignoreDuplicates

### Job Access Gating
- **Remote jobs** are premium-only
- **Visual cue**: Blur effect + "Upgrade" CTA
- **Applied at**: JobDetails page, job cards in lists

### Payment Flow
- User selects plan → Calculates fees (2% gateway + 18% GST) → Selects payment method → Creates subscription record → Creates payment record → Redirects to dashboard

### AI Limits
- **Free**: 20 requests/day, tracked in-memory
- **Premium**: Unlimited (remainingDailyRequests = null)
- **Error handling**: Throws error when limit exceeded

### Premium Entitlements
- Remote job access
- Unlimited job saves
- Direct recruiter messaging
- Weekly job digest
- Premium dashboard (Intelligence Center, Remote Hub)
- AI Career Hub (unlimited requests)
- Recruiter activity insights (full timeline, AI suggestions)
- Mock interviews & resume review (Pro-only)

