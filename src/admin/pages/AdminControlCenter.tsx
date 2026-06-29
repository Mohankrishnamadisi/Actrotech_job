import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AppstoreOutlined,
  BarChartOutlined,
  BugOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import { ROUTES } from '../../constants';

const { Title, Text } = Typography;

type AnyRecord = Record<string, any>;

const formatMoney = (amount: number) => `Rs ${Number(amount || 0).toLocaleString()}`;

const AdminControlCenter: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [stats, setStats] = useState<AnyRecord>({});
  const [users, setUsers] = useState<AnyRecord[]>([]);
  const [recruiters, setRecruiters] = useState<AnyRecord[]>([]);
  const [candidates, setCandidates] = useState<AnyRecord[]>([]);
  const [jobs, setJobs] = useState<AnyRecord[]>([]);
  const [applications, setApplications] = useState<AnyRecord[]>([]);
  const [subscribers, setSubscribers] = useState<AnyRecord[]>([]);
  const [payments, setPayments] = useState<AnyRecord[]>([]);
  const [supportTickets, setSupportTickets] = useState<AnyRecord[]>([]);
  const [integrity, setIntegrity] = useState<AnyRecord | null>(null);
  const [systemHealth, setSystemHealth] = useState<AnyRecord | null>(null);
  const [settings, setSettings] = useState<AnyRecord>({});

  const [userSelection, setUserSelection] = useState<React.Key[]>([]);
  const [jobSelection, setJobSelection] = useState<React.Key[]>([]);
  const [applicationSelection, setApplicationSelection] = useState<React.Key[]>([]);

  const [bulkJsonRows, setBulkJsonRows] = useState('');
  const [bulkCsvRows, setBulkCsvRows] = useState<AnyRecord[]>([]);

  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [subscriberSelection, setSubscriberSelection] = useState<React.Key[]>([]);
  const [renewalPlan, setRenewalPlan] = useState('premium');
  const [applicationStatus, setApplicationStatus] = useState('under_review');
  const [exportDataset, setExportDataset] = useState('users');
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [selectedTicket, setSelectedTicket] = useState<AnyRecord | null>(null);
  const [ticketComment, setTicketComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const routeToTabKey: Record<string, string> = {
    [ROUTES.ADMIN_DASHBOARD]: 'overview',
    [ROUTES.ADMIN_USERS]: 'users',
    [ROUTES.ADMIN_RECRUITERS]: 'recruiters',
    [ROUTES.ADMIN_CANDIDATES]: 'candidates',
    [ROUTES.ADMIN_JOBS]: 'jobs',
    [ROUTES.ADMIN_APPLICATIONS]: 'applications',
    [ROUTES.ADMIN_CUSTOMER_CARE]: 'customer-care',
    [ROUTES.ADMIN_SUBSCRIPTIONS]: 'subscribers',
    [ROUTES.ADMIN_PAYMENTS]: 'payments',
    [ROUTES.ADMIN_ANALYTICS]: 'overview',
    [ROUTES.ADMIN_BULK_IMPORT]: 'bulk',
    [ROUTES.ADMIN_DATA_INTEGRITY]: 'integrity',
    [ROUTES.ADMIN_SYSTEM_HEALTH]: 'health',
    [ROUTES.ADMIN_SETTINGS]: 'settings',
  };

  const tabKeyToRoute: Record<string, string> = {
    overview: ROUTES.ADMIN_DASHBOARD,
    users: ROUTES.ADMIN_USERS,
    recruiters: ROUTES.ADMIN_RECRUITERS,
    candidates: ROUTES.ADMIN_CANDIDATES,
    jobs: ROUTES.ADMIN_JOBS,
    applications: ROUTES.ADMIN_APPLICATIONS,
    'customer-care': ROUTES.ADMIN_CUSTOMER_CARE,
    subscribers: ROUTES.ADMIN_SUBSCRIPTIONS,
    payments: ROUTES.ADMIN_PAYMENTS,
    bulk: ROUTES.ADMIN_BULK_IMPORT,
    integrity: ROUTES.ADMIN_DATA_INTEGRITY,
    health: ROUTES.ADMIN_SYSTEM_HEALTH,
    settings: ROUTES.ADMIN_SETTINGS,
  };

  const activeTabKey = routeToTabKey[location.pathname] || 'overview';

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        dashboardStats,
        usersData,
        recruitersData,
        candidatesData,
        jobsData,
        applicationsData,
        subscribersData,
        paymentsData,
        supportTicketsData,
        healthData,
        settingsData,
      ] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getUsers(500),
        adminService.getRecruiters(500),
        adminService.getCandidates(500),
        adminService.getJobs(800),
        adminService.getApplications(800),
        adminService.getSubscribers(600),
        adminService.getPayments(600),
        adminService.getSupportTickets(400),
        adminService.getSystemHealth(),
        adminService.getAdminSettings(),
      ]);

      setStats(dashboardStats || {});
      setUsers(usersData || []);
      setRecruiters(recruitersData || []);
      setCandidates(candidatesData || []);
      setJobs(jobsData || []);
      setApplications(applicationsData || []);
      setSubscribers(subscribersData || []);
      setPayments(paymentsData || []);
      setSupportTickets(supportTicketsData || []);
      setSystemHealth(healthData || null);
      setSettings(settingsData || {});
    } catch (error: any) {
      message.error(error?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredSubscribers = useMemo(() => {
    if (!subscriberSearch.trim()) return subscribers;
    const q = subscriberSearch.toLowerCase();
    return subscribers.filter((s) => {
      const name = String(s?.profiles?.name || s?.name || '').toLowerCase();
      const email = String(s?.profiles?.email || s?.email || '').toLowerCase();
      const plan = String(s?.plan || '').toLowerCase();
      return name.includes(q) || email.includes(q) || plan.includes(q);
    });
  }, [subscribers, subscriberSearch]);

  const topRevenue = useMemo(
    () => payments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [payments],
  );

  const openTicketCount = useMemo(
    () => supportTickets.filter((ticket) => String(ticket.status || 'open').toLowerCase() !== 'closed').length,
    [supportTickets],
  );

  const visibleTickets = useMemo(() => {
    if (ticketStatusFilter === 'all') return supportTickets;
    return supportTickets.filter((ticket) => String(ticket.status || 'open').toLowerCase() === ticketStatusFilter);
  }, [supportTickets, ticketStatusFilter]);

  const runIntegrity = async () => {
    setActionLoading(true);
    try {
      const results = await adminService.runIntegrityChecks();
      setIntegrity(results || {});
      message.success('Integrity checks completed');
    } catch (error: any) {
      message.error(error?.message || 'Integrity check failed');
    } finally {
      setActionLoading(false);
    }
  };

  const refreshHealth = async () => {
    setActionLoading(true);
    try {
      const data = await adminService.getSystemHealth();
      setSystemHealth(data || null);
      message.success('System health refreshed');
    } catch (error: any) {
      message.error(error?.message || 'Health refresh failed');
    } finally {
      setActionLoading(false);
    }
  };

  const bulkUpdateUsers = async (updates: AnyRecord) => {
    if (userSelection.length === 0) {
      message.warning('Select at least one user');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.bulkUpdateUsers(userSelection.map(String), updates);
      message.success('Users updated successfully');
      setUserSelection([]);
      await loadAll();
    } catch (error: any) {
      message.error(error?.message || 'User bulk action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const bulkUpdateJobs = async (updates: AnyRecord) => {
    if (jobSelection.length === 0) {
      message.warning('Select at least one job');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.bulkUpdateJobs(jobSelection.map(String), updates);
      message.success('Jobs updated successfully');
      setJobSelection([]);
      await loadAll();
    } catch (error: any) {
      message.error(error?.message || 'Job bulk action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const bulkUpdateApplications = async () => {
    if (applicationSelection.length === 0) {
      message.warning('Select at least one application');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.bulkUpdateApplications(applicationSelection.map(String), { status: applicationStatus });
      message.success('Applications updated successfully');
      setApplicationSelection([]);
      await loadAll();
    } catch (error: any) {
      message.error(error?.message || 'Application bulk action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const parseJsonBulk = async () => {
    let rows: AnyRecord[] = [];
    try {
      const parsed = JSON.parse(bulkJsonRows || '[]');
      rows = Array.isArray(parsed) ? parsed : [];
    } catch {
      message.error('Invalid JSON payload. Use an array of job objects.');
      return;
    }

    if (rows.length === 0) {
      message.warning('No rows to import');
      return;
    }

    setActionLoading(true);
    try {
      const result = await adminService.bulkImportJobs(rows);
      message.success(`Imported ${result?.imported || 0} jobs`);
      setBulkJsonRows('');
      await loadAll();
    } catch (error: any) {
      message.error(error?.message || 'Bulk import failed');
    } finally {
      setActionLoading(false);
    }
  };

  const parseCsvFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = Array.isArray(results?.data) ? (results.data as AnyRecord[]) : [];
        setBulkCsvRows(rows);
        if ((results?.errors || []).length > 0) {
          message.warning('CSV parsed with warnings. Review before import.');
        } else {
          message.success(`CSV parsed: ${rows.length} rows`);
        }
      },
    });
    return false;
  };

  const importCsvRows = async () => {
    if (bulkCsvRows.length === 0) {
      message.warning('No CSV rows available for import');
      return;
    }
    setActionLoading(true);
    try {
      const result = await adminService.bulkImportJobs(bulkCsvRows);
      message.success(`Imported ${result?.imported || 0} jobs from CSV`);
      setBulkCsvRows([]);
      await loadAll();
    } catch (error: any) {
      message.error(error?.message || 'CSV import failed');
    } finally {
      setActionLoading(false);
    }
  };

  const submitTicketComment = async (status?: string) => {
    if (!selectedTicket) return;
    setCommentLoading(true);
    try {
      const updates: Record<string, any> = {};
      if (ticketComment.trim()) {
        updates.admin_note = ticketComment.trim();
      }
      if (status) {
        updates.status = status;
      }
      if (Object.keys(updates).length === 0) {
        message.warning('Add a comment or change status first');
        setCommentLoading(false);
        return;
      }
      const updated = await adminService.updateSupportTicket(String(selectedTicket.id), updates);
      message.success('Ticket updated');
      setTicketComment('');
      setSelectedTicket({ ...selectedTicket, ...updates });
      setSupportTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? { ...t, ...updates } : t)));
    } catch (error: any) {
      message.error(error?.message || 'Failed to update ticket');
    } finally {
      setCommentLoading(false);
    }
  };

  const saveSettings = async () => {
    setActionLoading(true);
    try {
      await adminService.saveAdminSettings(settings);
      message.success('Settings saved');
    } catch (error: any) {
      message.error(error?.message || 'Failed to save settings');
    } finally {
      setActionLoading(false);
    }
  };

  const updateSubscribers = async (updates: AnyRecord, successMessage: string) => {
    if (subscriberSelection.length === 0) {
      message.warning('Select at least one subscriber');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.bulkUpdateSubscribers(subscriberSelection.map(String), updates);
      message.success(successMessage);
      setSubscriberSelection([]);
      await loadAll();
    } catch (error: any) {
      message.error(error?.message || 'Subscriber action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getExportRows = () => {
    const normalize = (row: AnyRecord) =>
      Object.entries(row || {}).reduce((acc, [key, value]) => {
        if (Array.isArray(value)) {
          acc[key] = value.join(', ');
        } else if (value && typeof value === 'object') {
          acc[key] = JSON.stringify(value);
        } else {
          acc[key] = value ?? '';
        }
        return acc;
      }, {} as AnyRecord);

    const dataMap: Record<string, AnyRecord[]> = {
      users,
      recruiters,
      candidates,
      jobs,
      applications,
      subscribers,
      payments,
    };

    const rows = dataMap[exportDataset] || [];
    return rows.map(normalize);
  };

  const exportData = () => {
    const rows = getExportRows();
    if (!rows.length) {
      message.warning('No data available to export');
      return;
    }

    const fileBase = `admin-${exportDataset}-${new Date().toISOString().slice(0, 10)}`;

    if (exportFormat === 'csv') {
      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileBase}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('CSV export completed');
      return;
    }

    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Data');
    XLSX.writeFile(workbook, `${fileBase}.xlsx`);
    message.success('XLSX export completed');
  };

  const userColumns: ColumnsType<AnyRecord> = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v) => v || '-' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (v) => v || '-' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (v) => <Tag color="blue">{String(v || 'unknown')}</Tag> },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
  ];

  const recruiterColumns: ColumnsType<AnyRecord> = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v) => v || '-' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (v) => v || '-' },
    { title: 'Company', dataIndex: 'company_name', key: 'company_name', render: (v) => v || '-' },
    { title: 'Industry', dataIndex: 'industry', key: 'industry', render: (v) => v || '-' },
  ];

  const candidateColumns: ColumnsType<AnyRecord> = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v) => v || '-' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (v) => v || '-' },
    {
      title: 'Skills',
      dataIndex: 'skills',
      key: 'skills',
      render: (v) => {
        const skills = Array.isArray(v) ? v.slice(0, 4) : [];
        if (skills.length === 0) return <Text type="secondary">-</Text>;
        return (
          <Space wrap>
            {skills.map((s: string) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </Space>
        );
      },
    },
    { title: 'Location', dataIndex: 'location', key: 'location', render: (v) => v || '-' },
  ];

  const jobColumns: ColumnsType<AnyRecord> = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (v) => v || '-' },
    { title: 'Company', dataIndex: 'company_name', key: 'company_name', render: (v) => v || '-' },
    { title: 'Location', dataIndex: 'location', key: 'location', render: (v) => v || '-' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const status = String(v || 'draft');
        const color = status === 'published' ? 'green' : status === 'closed' ? 'red' : 'gold';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  const applicationColumns: ColumnsType<AnyRecord> = [
    { title: 'Job', dataIndex: ['jobs', 'title'], key: 'job', render: (v) => v || '-' },
    {
      title: 'Candidate',
      key: 'candidate',
      render: (_, row) => row?.profiles?.email || row?.profiles?.name || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const status = String(v || 'applied');
        const color =
          status === 'accepted' ? 'blue' :
          status === 'shortlisted' ? 'green' :
          status === 'under_review' ? 'gold' :
          status === 'rejected' ? 'red' : 'default';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    { title: 'Applied At', dataIndex: 'applied_at', key: 'applied_at', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
  ];

  const subscriberColumns: ColumnsType<AnyRecord> = [
    {
      title: 'Subscriber',
      key: 'subscriber',
      render: (_, row) => row?.profiles?.name || row?.name || '-',
    },
    {
      title: 'Email',
      key: 'email',
      render: (_, row) => row?.profiles?.email || row?.email || '-',
    },
    { title: 'Plan', dataIndex: 'plan', key: 'plan', render: (v) => <Tag color="purple">{String(v || 'unknown').toUpperCase()}</Tag> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v) => formatMoney(Number(v || 0)) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag color={String(v || '').toLowerCase() === 'paid' ? 'green' : 'gold'}>{String(v || 'pending').toUpperCase()}</Tag> },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
    {
      title: 'Action',
      key: 'action',
      render: (_, row) => (
        <Space size={6}>
          <Button
            size="small"
            type="primary"
            onClick={async () => {
              setActionLoading(true);
              try {
                await adminService.updateSubscriber(String(row.id), { plan: renewalPlan, status: 'paid' });
                message.success('Subscriber renewed');
                await loadAll();
              } catch (error: any) {
                message.error(error?.message || 'Failed to renew subscriber');
              } finally {
                setActionLoading(false);
              }
            }}
          >
            Renew
          </Button>
          <Button
            size="small"
            danger
            onClick={async () => {
              setActionLoading(true);
              try {
                await adminService.updateSubscriber(String(row.id), { status: 'cancelled' });
                message.success('Subscriber cancelled');
                await loadAll();
              } catch (error: any) {
                message.error(error?.message || 'Failed to cancel subscriber');
              } finally {
                setActionLoading(false);
              }
            }}
          >
            Cancel
          </Button>
        </Space>
      ),
    },
  ];

  const paymentColumns: ColumnsType<AnyRecord> = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'User', dataIndex: 'user_id', key: 'user_id', render: (v) => v || '-' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v) => formatMoney(Number(v || 0)) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag color={String(v || '').toLowerCase() === 'paid' ? 'green' : 'gold'}>{String(v || 'pending').toUpperCase()}</Tag> },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
  ];

  const supportTicketColumns: ColumnsType<AnyRecord> = [
    { title: 'Subject', dataIndex: 'subject', key: 'subject', render: (v, row) => <Button type="link" style={{ padding: 0, fontWeight: 600 }} onClick={() => { setSelectedTicket(row); setTicketComment(''); }}>{v || '-'}</Button> },
    { title: 'User', key: 'user', render: (_, row) => row?.name || row?.email || row?.user_id || '-' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (v) => <Tag>{String(v || 'guest').toUpperCase()}</Tag> },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (v) => v || '-' },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (v) => {
        const p = String(v || 'medium').toLowerCase();
        const color = p === 'urgent' ? 'red' : p === 'high' ? 'volcano' : p === 'low' ? 'blue' : 'gold';
        return <Tag color={color}>{p.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const status = String(v || 'open').toLowerCase();
        return <Tag color={status === 'closed' ? 'green' : 'orange'}>{status.toUpperCase()}</Tag>;
      },
    },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
    {
      title: 'Action',
      key: 'action',
      render: (_, row) => (
        <Button size="small" type="primary" ghost onClick={() => { setSelectedTicket(row); setTicketComment(''); }}>Open</Button>
      ),
    },
  ];

  if (loading) {
    return (
      <Card style={{ borderRadius: 14 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%', alignItems: 'center', padding: 36 }}>
          <Spin size="large" />
          <Text type="secondary">Loading admin control center...</Text>
        </Space>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        style={{
          borderRadius: 16,
          background:
            'radial-gradient(circle at 14% 20%, rgba(255,244,212,0.8) 0%, rgba(255,244,212,0) 36%), linear-gradient(135deg, #fffdf7 0%, #f7f9ff 45%, #edf4ff 100%)',
        }}
      >
        <Space direction="vertical" size={4}>
          <Title level={3} style={{ margin: 0 }}>Admin Control Center</Title>
          <Text type="secondary">
            Unified operations for recruiters, candidates, subscribers, jobs, applications, and system administration.
          </Text>
        </Space>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={12} md={6} lg={4}><Card><Statistic title="Total Users" value={stats.totalUsers || 0} /></Card></Col>
        <Col xs={12} md={6} lg={4}><Card><Statistic title="Candidates" value={stats.totalCandidates || 0} /></Card></Col>
        <Col xs={12} md={6} lg={4}><Card><Statistic title="Recruiters" value={stats.totalRecruiters || 0} /></Card></Col>
        <Col xs={12} md={6} lg={4}><Card><Statistic title="Active Jobs" value={stats.activeJobs || 0} /></Card></Col>
        <Col xs={12} md={6} lg={4}><Card><Statistic title="Total Subscribers" value={subscribers.length} /></Card></Col>
        <Col xs={12} md={6} lg={4}><Card><Statistic title="Revenue" value={topRevenue} formatter={(value) => formatMoney(Number(value || 0))} /></Card></Col>
      </Row>

      <Modal
        open={Boolean(selectedTicket)}
        onCancel={() => { setSelectedTicket(null); setTicketComment(''); }}
        title={
          <Space>
            <CustomerServiceOutlined />
            <Text strong>Ticket Detail</Text>
            {selectedTicket ? (
              <Tag color={String(selectedTicket.status || 'open').toLowerCase() === 'closed' ? 'green' : 'orange'}>
                {String(selectedTicket.status || 'open').toUpperCase()}
              </Tag>
            ) : null}
          </Space>
        }
        width={680}
        footer={[
          <Button key="close" onClick={() => { setSelectedTicket(null); setTicketComment(''); }}>Close</Button>,
          selectedTicket && String(selectedTicket.status || 'open').toLowerCase() !== 'closed' ? (
            <Button key="resolve" type="primary" loading={commentLoading} onClick={() => submitTicketComment('closed')}>
              Save &amp; Resolve
            </Button>
          ) : (
            <Button key="reopen" loading={commentLoading} onClick={() => submitTicketComment('open')}>
              Reopen
            </Button>
          ),
          <Button key="saveComment" type="default" loading={commentLoading} onClick={() => submitTicketComment()}>
            Save Comment
          </Button>,
        ]}
      >
        {selectedTicket ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Subject">{selectedTicket.subject || '-'}</Descriptions.Item>
              <Descriptions.Item label="User">{selectedTicket.name || selectedTicket.email || selectedTicket.user_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="Role"><Tag>{String(selectedTicket.role || 'guest').toUpperCase()}</Tag></Descriptions.Item>
              <Descriptions.Item label="Category">{selectedTicket.category || '-'}</Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={selectedTicket.priority === 'urgent' ? 'red' : selectedTicket.priority === 'high' ? 'volcano' : selectedTicket.priority === 'low' ? 'blue' : 'gold'}>
                  {String(selectedTicket.priority || 'medium').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">{selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : '-'}</Descriptions.Item>
              <Descriptions.Item label="Message">
                <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.message || '-'}</Text>
              </Descriptions.Item>
            </Descriptions>

            {selectedTicket.admin_note ? (
              <Alert
                type="success"
                message="Previous Admin Response"
                description={selectedTicket.admin_note}
                showIcon
              />
            ) : null}

            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>Add / Update Admin Comment</Text>
              <Input.TextArea
                rows={4}
                placeholder="Type your response to the user..."
                value={ticketComment}
                onChange={(e) => setTicketComment(e.target.value)}
              />
            </div>
          </Space>
        ) : null}
      </Modal>

      <Tabs
        type="card"
        activeKey={activeTabKey}
        onChange={(key) => {
          const nextRoute = tabKeyToRoute[key] || ROUTES.ADMIN_DASHBOARD;
          if (location.pathname !== nextRoute) {
            navigate(nextRoute);
          }
        }}
        items={[
          {
            key: 'overview',
            label: (
              <Space>
                <AppstoreOutlined />
                Overview
              </Space>
            ),
            children: (
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Admin Scope">Recruiters, candidates, subscribers, users, jobs, applications</Descriptions.Item>
                <Descriptions.Item label="Bulk Operations">User role updates, job status updates, application status updates, bulk job import</Descriptions.Item>
                <Descriptions.Item label="System Controls">Data integrity checks, health monitoring, settings management, payments visibility</Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: 'users',
            label: (
              <Space>
                <UserOutlined />
                Users
              </Space>
            ),
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Space wrap>
                  <Button onClick={() => bulkUpdateUsers({ role: 'recruiter' })} loading={actionLoading}>Bulk Make Recruiter</Button>
                  <Button danger onClick={() => bulkUpdateUsers({ status: 'disabled' })} loading={actionLoading}>Bulk Disable</Button>
                  <Button type="primary" onClick={() => bulkUpdateUsers({ status: 'active' })} loading={actionLoading}>Bulk Activate</Button>
                </Space>
                <Table
                  rowKey="id"
                  dataSource={users}
                  columns={userColumns}
                  rowSelection={{
                    selectedRowKeys: userSelection,
                    onChange: setUserSelection,
                  }}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 900 }}
                />
              </Space>
            ),
          },
          {
            key: 'recruiters',
            label: (
              <Space>
                <TeamOutlined />
                Recruiters
              </Space>
            ),
            children: <Table rowKey="id" dataSource={recruiters} columns={recruiterColumns} pagination={{ pageSize: 10 }} scroll={{ x: 900 }} />,
          },
          {
            key: 'candidates',
            label: (
              <Space>
                <TeamOutlined />
                Candidates
              </Space>
            ),
            children: <Table rowKey="id" dataSource={candidates} columns={candidateColumns} pagination={{ pageSize: 10 }} scroll={{ x: 900 }} />,
          },
          {
            key: 'jobs',
            label: (
              <Space>
                <ToolOutlined />
                Jobs
              </Space>
            ),
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Space wrap>
                  <Button type="primary" onClick={() => bulkUpdateJobs({ status: 'published' })} loading={actionLoading}>Bulk Publish</Button>
                  <Button onClick={() => bulkUpdateJobs({ status: 'closed' })} loading={actionLoading}>Bulk Close</Button>
                  <Button onClick={() => bulkUpdateJobs({ featured: true })} loading={actionLoading}>Bulk Feature</Button>
                </Space>
                <Table
                  rowKey="id"
                  dataSource={jobs}
                  columns={jobColumns}
                  rowSelection={{
                    selectedRowKeys: jobSelection,
                    onChange: setJobSelection,
                  }}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 900 }}
                />
              </Space>
            ),
          },
          {
            key: 'applications',
            label: (
              <Space>
                <FileSearchOutlined />
                Applications
              </Space>
            ),
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Space wrap>
                  <Select
                    value={applicationStatus}
                    style={{ minWidth: 200 }}
                    onChange={setApplicationStatus}
                    options={[
                      { label: 'Under Review', value: 'under_review' },
                      { label: 'Shortlisted', value: 'shortlisted' },
                      { label: 'Accepted', value: 'accepted' },
                      { label: 'Rejected', value: 'rejected' },
                    ]}
                  />
                  <Button type="primary" onClick={bulkUpdateApplications} loading={actionLoading}>Bulk Update Status</Button>
                </Space>
                <Table
                  rowKey="id"
                  dataSource={applications}
                  columns={applicationColumns}
                  rowSelection={{
                    selectedRowKeys: applicationSelection,
                    onChange: setApplicationSelection,
                  }}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 900 }}
                />
              </Space>
            ),
          },
          {
            key: 'customer-care',
            label: (
              <Space>
                <CustomerServiceOutlined />
                Customer Care
              </Space>
            ),
            children: (
              <Card title={(
                <Space>
                  <CustomerServiceOutlined />
                  Customer Care Tickets
                </Space>
              )}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Space wrap>
                    <Tag color="orange">Open: {openTicketCount}</Tag>
                    <Tag color="green">Closed: {supportTickets.length - openTicketCount}</Tag>
                    <Select
                      value={ticketStatusFilter}
                      style={{ minWidth: 180 }}
                      onChange={(v) => setTicketStatusFilter(v as 'all' | 'open' | 'closed')}
                      options={[
                        { label: 'Open Tickets', value: 'open' },
                        { label: 'Closed Tickets', value: 'closed' },
                        { label: 'All Tickets', value: 'all' },
                      ]}
                    />
                  </Space>
                  <Table
                    rowKey="id"
                    dataSource={visibleTickets}
                    columns={supportTicketColumns}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 1100 }}
                  />
                </Space>
              </Card>
            ),
          },
          {
            key: 'subscribers',
            label: (
              <Space>
                <DatabaseOutlined />
                Subscribers
              </Space>
            ),
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Space wrap>
                  <Select
                    value={renewalPlan}
                    style={{ minWidth: 190 }}
                    onChange={setRenewalPlan}
                    options={[
                      { label: 'Basic', value: 'basic' },
                      { label: 'Premium', value: 'premium' },
                      { label: 'Pro', value: 'pro' },
                      { label: 'Enterprise', value: 'enterprise' },
                    ]}
                  />
                  <Button
                    type="primary"
                    loading={actionLoading}
                    onClick={() => updateSubscribers({ plan: renewalPlan, status: 'paid' }, 'Subscribers renewed successfully')}
                  >
                    Renew Selected
                  </Button>
                  <Button
                    danger
                    loading={actionLoading}
                    onClick={() => updateSubscribers({ status: 'cancelled' }, 'Subscribers cancelled successfully')}
                  >
                    Cancel Selected
                  </Button>
                </Space>
                <Input.Search
                  placeholder="Search subscriber by name, email, or plan"
                  value={subscriberSearch}
                  onChange={(e) => setSubscriberSearch(e.target.value)}
                  allowClear
                />
                <Table
                  rowKey="id"
                  dataSource={filteredSubscribers}
                  columns={subscriberColumns}
                  rowSelection={{ selectedRowKeys: subscriberSelection, onChange: setSubscriberSelection }}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1150 }}
                />
              </Space>
            ),
          },
          {
            key: 'payments',
            label: (
              <Space>
                <DownloadOutlined />
                Payments
              </Space>
            ),
            children: <Table rowKey="id" dataSource={payments} columns={paymentColumns} pagination={{ pageSize: 10 }} scroll={{ x: 1100 }} />,
          },
          {
            key: 'bulk',
            label: (
              <Space>
                <ToolOutlined />
                Bulk Activities
              </Space>
            ),
            children: (
              <Row gutter={[12, 12]}>
                <Col xs={24} lg={12}>
                  <Card title="Bulk JSON Job Import" size="small">
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <Input.TextArea
                        rows={10}
                        value={bulkJsonRows}
                        onChange={(e) => setBulkJsonRows(e.target.value)}
                        placeholder='[{"title":"Frontend Developer","company_name":"Acme","location":"Hyderabad"}]'
                      />
                      <Button type="primary" onClick={parseJsonBulk} loading={actionLoading}>Import JSON Jobs</Button>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="CSV Import" size="small">
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) parseCsvFile(file);
                        }}
                      />
                      <Text type="secondary">Parsed rows: {bulkCsvRows.length}</Text>
                      <Button type="primary" onClick={importCsvRows} disabled={bulkCsvRows.length === 0} loading={actionLoading}>Import CSV Jobs</Button>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} lg={24}>
                  <Card title="Bulk Export" size="small">
                    <Space wrap>
                      <Select
                        value={exportDataset}
                        style={{ minWidth: 190 }}
                        onChange={setExportDataset}
                        options={[
                          { label: 'Users', value: 'users' },
                          { label: 'Recruiters', value: 'recruiters' },
                          { label: 'Candidates', value: 'candidates' },
                          { label: 'Jobs', value: 'jobs' },
                          { label: 'Applications', value: 'applications' },
                          { label: 'Subscribers', value: 'subscribers' },
                          { label: 'Payments', value: 'payments' },
                        ]}
                      />
                      <Select
                        value={exportFormat}
                        style={{ width: 140 }}
                        onChange={(v) => setExportFormat(v as 'csv' | 'xlsx')}
                        options={[
                          { label: 'CSV', value: 'csv' },
                          { label: 'XLSX', value: 'xlsx' },
                        ]}
                      />
                      <Button type="primary" onClick={exportData}>
                        Export Data
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'integrity',
            label: (
              <Space>
                <BugOutlined />
                Data Integrity
              </Space>
            ),
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Button type="primary" onClick={runIntegrity} loading={actionLoading}>Run Integrity Checks</Button>
                {integrity ? (
                  <pre style={{ margin: 0, background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 10, maxHeight: 360, overflow: 'auto' }}>
                    {JSON.stringify(integrity, null, 2)}
                  </pre>
                ) : (
                  <Alert type="info" message="Run checks to view integrity report" showIcon />
                )}
              </Space>
            ),
          },
          {
            key: 'health',
            label: (
              <Space>
                <BarChartOutlined />
                System Health
              </Space>
            ),
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Button onClick={refreshHealth} loading={actionLoading}>Refresh Health</Button>
                {systemHealth ? (
                  <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label="Users">{systemHealth.userCount ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Jobs">{systemHealth.jobCount ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Applications">{systemHealth.applicationCount ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Integrity Summary">
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(systemHealth.integrity || {}, null, 2)}</pre>
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Alert type="info" message="No health data available" showIcon />
                )}
              </Space>
            ),
          },
          {
            key: 'settings',
            label: (
              <Space>
                <SettingOutlined />
                Settings
              </Space>
            ),
            children: (
              <Card size="small">
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <Input
                    addonBefore="Site Title"
                    value={settings?.siteTitle || ''}
                    onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                  />
                  <Input
                    addonBefore="Support Email"
                    value={settings?.supportEmail || ''}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  />
                  <Select
                    value={Boolean(settings?.maintenanceMode)}
                    onChange={(v) => setSettings({ ...settings, maintenanceMode: Boolean(v) })}
                    options={[
                      { label: 'Maintenance Off', value: false },
                      { label: 'Maintenance On', value: true },
                    ]}
                    style={{ width: 220 }}
                  />
                  <Button type="primary" onClick={saveSettings} loading={actionLoading}>Save Settings</Button>
                </Space>
              </Card>
            ),
          },
        ]}
      />

      <Space>
        <Button onClick={loadAll}>Refresh All Data</Button>
        <Button
          onClick={() => {
            Modal.info({
              title: 'Admin Coverage',
              width: 700,
              content: (
                <Space direction="vertical" size={8}>
                  <Text>Users: managed with bulk role and status updates</Text>
                  <Text>Recruiters and candidates: searchable tabular management</Text>
                  <Text>Subscribers and payments: billing visibility and filters</Text>
                  <Text>Jobs and applications: bulk moderation workflows</Text>
                  <Text>Bulk activities: JSON and CSV based import pipeline</Text>
                  <Text>System: integrity checks, health snapshot, and settings controls</Text>
                </Space>
              ),
            });
          }}
        >
          Show Implemented Scope
        </Button>
      </Space>
    </Space>
  );
};

export default AdminControlCenter;
