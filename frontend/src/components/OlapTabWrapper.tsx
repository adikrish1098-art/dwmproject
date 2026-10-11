import React, { useState, useEffect } from 'react';
import { OlapTab } from './OlapTab';
import { api } from '../services/api';
import { OlapSchemaData } from '../types';

export const OlapTabWrapper: React.FC = () => {
  const [schemaData, setSchemaData] = useState<OlapSchemaData | null>(null);

  useEffect(() => {
    api.getOlapSchema().then(setSchemaData).catch(console.error);
  }, []);

  return <OlapTab schemaData={schemaData} />;
};
