import React, { useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Form, Input, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import { globalEnterprisePlatformService, type RegionalSetting } from '@services/globalEnterprisePlatform';

const { Title, Text } = Typography;

type GlobalEnterpriseMode = 'global-settings' | 'localization' | 'compliance' | 'regional-management';

interface GlobalEnterprisePlatformProps {
  mode?: GlobalEnterpriseMode;
}

const GlobalEnterprisePlatform: React.FC<GlobalEnterprisePlatformProps> = ({ mode = 'global-settings' }) => {
  const [regionalSettings, setRegionalSettings] = useState(() => globalEnterprisePlatformService.listRegionalSettings());
  const [alerts, setAlerts] = useState(() => globalEnterprisePlatformService.listAlerts());
  const [selectedCountry, setSelectedCountry] = useState(regionalSettings[0]?.country || '');
  const [form] = Form.useForm<RegionalSetting>();
  const selectedSetting = regionalSettings.find((item) => item.country === selectedCountry);

  const downloadReport = (type: 'regional' | 'country' | 'executive' | 'compliance' | 'revenue') => {
    const report = globalEnterprisePlatformService.generateGlobalReport(type);
    const url = URL.createObjectURL(new Blob([report], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-governance-report.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resolveAlert = (id: string) => {
    globalEnterprisePlatformService.resolveAlert(id);
    setAlerts(globalEnterprisePlatformService.listAlerts());
    message.success('Alert marked as resolved');
  };

  const saveRegionalSetting = (values: RegionalSetting) => {
    const updated = globalEnterprisePlatformService.updateRegionalSetting(selectedCountry, values);
    if (!updated) {
      message.error('Regional setting could not be saved');
      return;
    }
    const nextSettings = globalEnterprisePlatformService.listRegionalSettings();
    setRegionalSettings(nextSettings);
    form.setFieldsValue(updated);
    message.success(`${updated.country} settings saved`);
  };

  const globalDashboard = globalEnterprisePlatformService.getGlobalDashboard();
  const localization = globalEnterprisePlatformService.getLocalizationArchitecture();
  const compliance = globalEnterprisePlatformService.getComplianceCenter();

  const content = mode === 'global-settings' ? (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Countries Supported" value={globalDashboard.countriesSupported} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Platform Uptime" value={globalDashboard.platformHealth.uptime} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="API Availability" value={globalDashboard.platformHealth.apiAvailability} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Latency" value={globalDashboard.platformHealth.latencyMs} suffix="ms" /></Card></Col>
      </Row>
      <Card title="Global Operations Alerts" extra={<Button onClick={() => downloadReport('executive')}>Export Executive Report</Button>}>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={alerts}
          columns={[
            { title: 'Severity', dataIndex: 'severity', render: (value: string) => <Tag color={value === 'critical' || value === 'high' ? 'red' : 'gold'}>{value.toUpperCase()}</Tag> },
            { title: 'Region', dataIndex: 'region' },
            { title: 'Alert', dataIndex: 'message' },
            { title: 'Action', render: (_, alert) => <Button size="small" disabled={alert.message.includes('[Resolved]')} onClick={() => resolveAlert(alert.id)}>Resolve</Button> },
          ]}
        />
      </Card>
    </Space>
  ) : mode === 'localization' ? (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert type="info" showIcon message="Localization architecture" description={localization.dynamicTranslation} />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}><Card title="Supported Languages"><Space wrap>{localization.supportedLanguages.map((language) => <Tag color="blue" key={language}>{language}</Tag>)}</Space></Card></Col>
        <Col xs={24} lg={12}><Card title="Regional Delivery"><Descriptions column={1} size="small"><Descriptions.Item label="Emails">{localization.localizedEmails}</Descriptions.Item><Descriptions.Item label="Notifications">{localization.localizedNotifications}</Descriptions.Item><Descriptions.Item label="Career pages">{localization.localizedCareerPages}</Descriptions.Item></Descriptions></Card></Col>
      </Row>
    </Space>
  ) : mode === 'compliance' ? (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert type="warning" showIcon message="Compliance controls require formal evidence and legal review before certification." />
      <Card title="Compliance Frameworks" extra={<Button onClick={() => downloadReport('compliance')}>Export Compliance Report</Button>}>
        <Table rowKey="name" pagination={false} dataSource={compliance} columns={[
          { title: 'Framework', dataIndex: 'name' },
          { title: 'Status', dataIndex: 'status', render: (value: string) => <Tag color={value === 'ready' ? 'green' : 'gold'}>{value.replace('_', ' ').toUpperCase()}</Tag> },
          { title: 'Controls', dataIndex: 'controls', render: (controls: string[]) => controls.join(', ') },
        ]} />
      </Card>
    </Space>
  ) : (
    <Card title="Regional Management" extra={<Button onClick={() => downloadReport('regional')}>Export Regional Report</Button>}>
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <Select
          value={selectedCountry}
          style={{ width: 280 }}
          options={regionalSettings.map((item) => ({ label: item.country, value: item.country }))}
          onChange={(country) => {
            setSelectedCountry(country);
            form.setFieldsValue(regionalSettings.find((item) => item.country === country));
          }}
        />
        {selectedSetting && (
          <Form form={form} layout="vertical" initialValues={selectedSetting} onFinish={saveRegionalSetting} key={selectedCountry}>
            <Row gutter={16}>
              <Col xs={24} md={8}><Form.Item name="language" label="Default language" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="currency" label="Currency" rules={[{ required: true }]}><Select options={globalEnterprisePlatformService.getMultiCurrencySupport().currencies.map((currency) => ({ label: currency, value: currency }))} /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="timezone" label="Timezone" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="dateFormat" label="Date format" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="phoneFormat" label="Phone format" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="postalCodeFormat" label="Postal code format" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24}><Form.Item name="addressFormat" label="Address format" rules={[{ required: true }]}><Input /></Form.Item></Col>
            </Row>
            <Button type="primary" htmlType="submit">Save Regional Settings</Button>
          </Form>
        )}
      </Space>
    </Card>
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card style={{ borderRadius: 14, background: 'linear-gradient(130deg, #f8fbff 0%, #eef4ff 55%, #ebf8ff 100%)' }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>Global Enterprise Governance</Title>
          <Text type="secondary">Super Admin control center for worldwide settings, localization, compliance and regional management.</Text>
        </Space>
      </Card>

      {content}
    </Space>
  );
};

export default GlobalEnterprisePlatform;
