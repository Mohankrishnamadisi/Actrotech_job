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
import { AppstoreOutlined, DatabaseOutlined, DownloadOutlined, ExperimentOutlined } from '@ant-design/icons';
import { assessmentPlatformService, type AssessmentCategory, type Difficulty } from '@services/assessmentPlatform';

const { Title, Text } = Typography;

type AdminTab = 'overview' | 'library' | 'question-bank' | 'ai-generator' | 'analytics';

const downloadText = (fileName: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const AssessmentLibrary: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [category, setCategory] = useState<AssessmentCategory>('Programming');
  const [style, setStyle] = useState<'MCQs' | 'Coding Problems' | 'HR Questions' | 'Scenario Questions' | 'System Design' | 'Behavioral Questions'>('MCQs');

  const library = useMemo(() => assessmentPlatformService.listLibrary(), [tab]);
  const questionBank = useMemo(() => assessmentPlatformService.listQuestionBank(), [tab]);
  const analytics = useMemo(() => assessmentPlatformService.getPlatformAnalytics(), [tab]);

  const filteredLibrary = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return library;
    return library.filter((item) =>
      String(item.title).toLowerCase().includes(q)
      || String(item.description).toLowerCase().includes(q)
      || String(item.category).toLowerCase().includes(q)
      || item.skills.some((skill) => String(skill).toLowerCase().includes(q))
    );
  }, [library, search]);

  const filteredQuestionBank = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questionBank;
    return questionBank.filter((item) =>
      String(item.title).toLowerCase().includes(q)
      || String(item.category).toLowerCase().includes(q)
      || item.tags.some((tag) => String(tag).toLowerCase().includes(q))
    );
  }, [questionBank, search]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        style={{
          borderRadius: 14,
          background: 'linear-gradient(125deg, #f8fbff 0%, #eef4ff 55%, #e8f8ff 100%)',
        }}
      >
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>Assessment Library</Title>
          <Text type="secondary">Platform-level governance for assessments, question bank, AI-generated questions and analytics.</Text>
          <Space wrap>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assessments / questions / skills" style={{ width: 360 }} />
            <Button onClick={() => setSearch('')}>Clear</Button>
          </Space>
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
                <Col xs={24} md={8}><Card><Statistic title="Assessments" value={library.length} /></Card></Col>
                <Col xs={24} md={8}><Card><Statistic title="Question Bank" value={questionBank.length} /></Card></Col>
                <Col xs={24} md={8}><Card><Statistic title="Pass Percentage" value={analytics.passPercentage} suffix="%" /></Card></Col>
                <Col span={24}><Alert type="info" message="Categories covered" description="Programming, Frontend, Backend, Full Stack, DevOps, Cloud, Database, AI / ML, QA, HR, Communication, Aptitude, Logical Reasoning, English, Soft Skills, Custom Assessments." showIcon /></Col>
              </Row>
            ),
          },
          {
            key: 'library',
            label: <Space><DatabaseOutlined />Assessment Library</Space>,
            children: (
              <Table
                rowKey="id"
                dataSource={filteredLibrary}
                pagination={{ pageSize: 8 }}
                columns={[
                  { title: 'Title', dataIndex: 'title', key: 'title' },
                  { title: 'Category', dataIndex: 'category', key: 'category' },
                  { title: 'Difficulty', dataIndex: 'difficulty', key: 'difficulty', render: (v) => <Tag color={v === 'Hard' ? 'red' : v === 'Medium' ? 'gold' : 'green'}>{v}</Tag> },
                  { title: 'Duration', dataIndex: 'durationMin', key: 'durationMin', render: (v) => `${v} min` },
                  { title: 'Passing', dataIndex: 'passingScore', key: 'passingScore', render: (v) => `${v}%` },
                  { title: 'Skills', dataIndex: 'skills', key: 'skills', render: (v: string[]) => v.map((s) => <Tag key={s}>{s}</Tag>) },
                ]}
              />
            ),
          },
          {
            key: 'question-bank',
            label: <Space><ExperimentOutlined />Question Bank</Space>,
            children: (
              <Table
                rowKey="id"
                dataSource={filteredQuestionBank}
                pagination={{ pageSize: 8 }}
                columns={[
                  { title: 'Question', dataIndex: 'title', key: 'title' },
                  { title: 'Type', dataIndex: 'questionType', key: 'questionType' },
                  { title: 'Category', dataIndex: 'category', key: 'category' },
                  { title: 'Difficulty', dataIndex: 'difficulty', key: 'difficulty', render: (v) => <Tag>{v}</Tag> },
                  { title: 'Expected Time', dataIndex: 'expectedTimeMin', key: 'expectedTimeMin', render: (v) => `${v} min` },
                ]}
              />
            ),
          },
          {
            key: 'ai-generator',
            label: <Space><ExperimentOutlined />AI Question Generator</Space>,
            children: (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Space wrap>
                  <Select
                    value={category}
                    onChange={(v) => setCategory(v as AssessmentCategory)}
                    style={{ width: 220 }}
                    options={assessmentPlatformService.getCategories().map((c) => ({ label: c, value: c }))}
                  />
                  <Select
                    value={difficulty}
                    onChange={(v) => setDifficulty(v as Difficulty)}
                    style={{ width: 130 }}
                    options={[
                      { label: 'Easy', value: 'Easy' },
                      { label: 'Medium', value: 'Medium' },
                      { label: 'Hard', value: 'Hard' },
                    ]}
                  />
                  <Select
                    value={style}
                    onChange={(v) => setStyle(v as typeof style)}
                    style={{ width: 220 }}
                    options={[
                      { label: 'MCQs', value: 'MCQs' },
                      { label: 'Coding Problems', value: 'Coding Problems' },
                      { label: 'HR Questions', value: 'HR Questions' },
                      { label: 'Scenario Questions', value: 'Scenario Questions' },
                      { label: 'System Design', value: 'System Design' },
                      { label: 'Behavioral Questions', value: 'Behavioral Questions' },
                    ]}
                  />
                  <Button
                    type="primary"
                    onClick={() => {
                      assessmentPlatformService.generateAiQuestions(category, difficulty, 10, style);
                      message.success('Generated 10 AI questions and added to question bank');
                    }}
                  >
                    Generate
                  </Button>
                </Space>
                <Alert type="info" showIcon message="Supports MCQ, coding, HR, scenario, system design and behavioral generation with Easy/Medium/Hard difficulty." />
              </Space>
            ),
          },
          {
            key: 'analytics',
            label: <Space><AppstoreOutlined />Analytics & Reports</Space>,
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Row gutter={[12, 12]}>
                  <Col xs={24} md={8}><Card><Statistic title="Completion Rate" value={analytics.assessmentCompletionRate} suffix="%" /></Card></Col>
                  <Col xs={24} md={8}><Card><Statistic title="Average Score" value={analytics.averageScores} suffix="%" /></Card></Col>
                  <Col xs={24} md={8}><Card><Statistic title="Candidate Participation" value={analytics.candidateParticipation} /></Card></Col>
                </Row>
                <Alert type="success" showIcon message={`Top Skills: ${analytics.topSkills.join(', ')}`} />
                <Alert type="warning" showIcon message={`Weak Skills: ${analytics.weakSkills.join(', ')}`} />
                <Space wrap>
                  <Button icon={<DownloadOutlined />} onClick={() => {
                    const report = assessmentPlatformService.generateReports();
                    downloadText('assessment-report.md', report.assessmentReport);
                  }}>
                    Assessment Report
                  </Button>
                  <Button onClick={() => {
                    const report = assessmentPlatformService.generateReports();
                    downloadText('assessment-report.csv', assessmentPlatformService.downloadReport(report.assessmentReport, 'csv'));
                  }}>
                    CSV
                  </Button>
                </Space>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  );
};

export default AssessmentLibrary;
