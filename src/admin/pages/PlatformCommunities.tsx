import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  TeamOutlined,
  SafetyOutlined,
  BarChartOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { networkCommunityService, type CommunityCategory } from '@services/networkCommunity';

const { Title, Text } = Typography;

type AdminTab = 'overview' | 'communities' | 'moderation' | 'analytics' | 'reports';

const downloadText = (name: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const PlatformCommunities: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [name, setName] = useState('Cloud Engineers Guild');
  const [description, setDescription] = useState('Community for cloud architecture and platform engineering.');
  const [category, setCategory] = useState<CommunityCategory>('Technology');
  const [tags, setTags] = useState('cloud, aws, kubernetes');

  const communities = useMemo(() => networkCommunityService.listCommunities(), [tab]);
  const posts = useMemo(() => networkCommunityService.listPosts(), [tab]);
  const discussions = useMemo(() => networkCommunityService.listDiscussions(), [tab]);
  const analytics = useMemo(() => networkCommunityService.getAnalytics(), [tab]);
  const moderation = useMemo(() => networkCommunityService.getModerationArchitecture(), []);
  const reports = useMemo(() => networkCommunityService.generateReports(), [tab]);
  const permissions = useMemo(() => networkCommunityService.getPermissions(), []);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card style={{ borderRadius: 14, background: 'linear-gradient(135deg, #f8fbff 0%, #eef5ff 55%, #e9faff 100%)' }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>Platform Communities</Title>
          <Text type="secondary">Platform-wide governance for communities, networking, referrals, mentorship and moderation.</Text>
        </Space>
      </Card>

      <Tabs
        type="card"
        activeKey={tab}
        onChange={(k) => setTab(k as AdminTab)}
        items={[
          {
            key: 'overview',
            label: <Space><AppstoreOutlined />Overview</Space>,
            children: (
              <Row gutter={[12, 12]}>
                <Col xs={24} md={6}><Card><Statistic title="Communities" value={communities.length} /></Card></Col>
                <Col xs={24} md={6}><Card><Statistic title="Posts" value={posts.length} /></Card></Col>
                <Col xs={24} md={6}><Card><Statistic title="Discussions" value={discussions.length} /></Card></Col>
                <Col xs={24} md={6}><Card><Statistic title="Engagement" value={analytics.userEngagement} /></Card></Col>
                <Col span={24}><Alert type="info" showIcon message="Candidate, Recruiter, Mentor, Community Manager, Platform Moderator and Super Admin permission model is enforced at module level." /></Col>
              </Row>
            ),
          },
          {
            key: 'communities',
            label: <Space><TeamOutlined />Communities</Space>,
            children: (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Card>
                  <Space wrap>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Community Name" style={{ width: 240 }} />
                    <Select
                      value={category}
                      onChange={(v) => setCategory(v as CommunityCategory)}
                      style={{ width: 180 }}
                      options={[
                        { label: 'Technology', value: 'Technology' },
                        { label: 'Company', value: 'Company' },
                        { label: 'Role', value: 'Role' },
                        { label: 'Location', value: 'Location' },
                        { label: 'College', value: 'College' },
                        { label: 'Career Interests', value: 'Career Interests' },
                      ]}
                    />
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={{ width: 340 }} />
                    <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags comma separated" style={{ width: 220 }} />
                    <Button
                      type="primary"
                      onClick={() => {
                        networkCommunityService.createCommunity({
                          name,
                          category,
                          description,
                          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
                          moderators: ['platform_moderator_1'],
                        });
                        message.success('Community created');
                      }}
                    >
                      Create Community
                    </Button>
                  </Space>
                </Card>
                <Table
                  rowKey="id"
                  dataSource={communities}
                  pagination={{ pageSize: 8 }}
                  columns={[
                    { title: 'Name', dataIndex: 'name', key: 'name' },
                    { title: 'Category', dataIndex: 'category', key: 'category', render: (v) => <Tag color="blue">{v}</Tag> },
                    { title: 'Members', dataIndex: 'members', key: 'members' },
                    { title: 'Tags', dataIndex: 'tags', key: 'tags', render: (v: string[]) => v.map((tag) => <Tag key={tag}>{tag}</Tag>) },
                  ]}
                />
              </Space>
            ),
          },
          {
            key: 'moderation',
            label: <Space><SafetyOutlined />Moderation</Space>,
            children: (
              <Row gutter={[12, 12]}>
                {Object.entries(moderation).map(([key, value]) => (
                  <Col key={key} xs={24} md={12}>
                    <Card>
                      <Typography.Text strong style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</Typography.Text>
                      <div><Typography.Text type="secondary">{value}</Typography.Text></div>
                    </Card>
                  </Col>
                ))}
                <Col span={24}><Alert type="warning" showIcon message="Moderation workflows include report abuse, spam detection, content review and moderator escalation." /></Col>
              </Row>
            ),
          },
          {
            key: 'analytics',
            label: <Space><BarChartOutlined />Analytics</Space>,
            children: (
              <Row gutter={[12, 12]}>
                <Col xs={24} md={8}><Card><Statistic title="Community Growth" value={analytics.communityGrowth} /></Card></Col>
                <Col xs={24} md={8}><Card><Statistic title="Referral Success Rate" value={analytics.referralSuccessRate} suffix="%" /></Card></Col>
                <Col xs={24} md={8}><Card><Statistic title="Mentorship Sessions" value={analytics.mentorshipSessions} /></Card></Col>
                <Col xs={24} md={8}><Card><Statistic title="Event Attendance" value={analytics.eventAttendance} /></Card></Col>
                <Col xs={24} md={8}><Card><Statistic title="User Engagement" value={analytics.userEngagement} /></Card></Col>
                <Col xs={24} md={8}><Card><Statistic title="Top Mentors" value={analytics.topMentors.length} /></Card></Col>
                <Col span={24}><Alert type="info" showIcon message={`Top Communities: ${analytics.topCommunities.join(', ')}`} /></Col>
              </Row>
            ),
          },
          {
            key: 'reports',
            label: <Space><DownloadOutlined />Reports</Space>,
            children: (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Alert type="success" showIcon message="Community Report, Referral Report, Mentorship Report and Engagement Report are available in PDF/Excel/CSV." />
                <Space wrap>
                  <Button icon={<DownloadOutlined />} onClick={() => downloadText('community-report.md', reports.communityReport)}>Community</Button>
                  <Button onClick={() => downloadText('referral-report.md', reports.referralReport)}>Referral</Button>
                  <Button onClick={() => downloadText('mentorship-report.md', reports.mentorshipReport)}>Mentorship</Button>
                  <Button onClick={() => downloadText('engagement-report.md', reports.engagementReport)}>Engagement</Button>
                </Space>
                <Space wrap>
                  <Button onClick={() => downloadText('community-report.pdf.txt', networkCommunityService.downloadReport(reports.communityReport, 'pdf'))}>PDF</Button>
                  <Button onClick={() => downloadText('community-report.excel.txt', networkCommunityService.downloadReport(reports.communityReport, 'excel'))}>Excel</Button>
                  <Button onClick={() => downloadText('community-report.csv', networkCommunityService.downloadReport(reports.communityReport, 'csv'))}>CSV</Button>
                </Space>
                <Alert type="info" showIcon message={`Permissions: Candidate(${permissions.candidate}) | Recruiter(${permissions.recruiter}) | Mentor(${permissions.mentor}) | Community Manager(${permissions.communityManager}) | Platform Moderator(${permissions.platformModerator}) | Super Admin(${permissions.superAdmin})`} />
              </Space>
            ),
          },
        ]}
      />
    </Space>
  );
};

export default PlatformCommunities;
