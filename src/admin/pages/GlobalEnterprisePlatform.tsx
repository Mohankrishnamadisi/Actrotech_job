import React from 'react';
import { Card, Space, Typography } from 'antd';
import { RecruiterGlobalEnterpriseCenter } from '@components/recruiter/RecruiterGlobalEnterpriseCenter';

const { Title, Text } = Typography;

type GlobalEnterpriseMode = 'global-settings' | 'localization' | 'compliance' | 'regional-management';

interface GlobalEnterprisePlatformProps {
  mode?: GlobalEnterpriseMode;
}

const GlobalEnterprisePlatform: React.FC<GlobalEnterprisePlatformProps> = ({ mode = 'global-settings' }) => {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card style={{ borderRadius: 14, background: 'linear-gradient(130deg, #f8fbff 0%, #eef4ff 55%, #ebf8ff 100%)' }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>Global Enterprise Governance</Title>
          <Text type="secondary">Super Admin control center for worldwide settings, localization, compliance and regional management.</Text>
        </Space>
      </Card>

      <RecruiterGlobalEnterpriseCenter mode={mode} />
    </Space>
  );
};

export default GlobalEnterprisePlatform;
