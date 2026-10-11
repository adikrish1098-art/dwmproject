import React, { useState, useEffect, useCallback } from 'react';
import { EtlTab } from './EtlTab';
import { api } from '../services/api';
import { EtlStatusData } from '../types';

export const EtlTabWrapper: React.FC = () => {
  const [statusData, setStatusData] = useState<EtlStatusData | null>(null);

  const fetchStatus = useCallback(() => {
    api.getEtlStatus().then(setStatusData).catch(console.error);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return <EtlTab statusData={statusData} onRefresh={fetchStatus} />;
};
