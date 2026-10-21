export interface JurisdictionItem {
  id: string;
  name: string;
  type: 'pan_india' | 'state' | 'ut';
  code: string;
}

export const PAN_INDIA_OPTION: JurisdictionItem = {
  id: 'all-india',
  name: 'All India (Pan-India)',
  type: 'pan_india',
  code: 'IN',
};

export const INDIAN_STATES: JurisdictionItem[] = [
  { id: 'andhra-pradesh', name: 'Andhra Pradesh', type: 'state', code: 'AP' },
  { id: 'arunachal-pradesh', name: 'Arunachal Pradesh', type: 'state', code: 'AR' },
  { id: 'assam', name: 'Assam', type: 'state', code: 'AS' },
  { id: 'bihar', name: 'Bihar', type: 'state', code: 'BR' },
  { id: 'chhattisgarh', name: 'Chhattisgarh', type: 'state', code: 'CG' },
  { id: 'goa', name: 'Goa', type: 'state', code: 'GA' },
  { id: 'gujarat', name: 'Gujarat', type: 'state', code: 'GJ' },
  { id: 'haryana', name: 'Haryana', type: 'state', code: 'HR' },
  { id: 'himachal-pradesh', name: 'Himachal Pradesh', type: 'state', code: 'HP' },
  { id: 'jharkhand', name: 'Jharkhand', type: 'state', code: 'JH' },
  { id: 'karnataka', name: 'Karnataka', type: 'state', code: 'KA' },
  { id: 'kerala', name: 'Kerala', type: 'state', code: 'KL' },
  { id: 'madhya-pradesh', name: 'Madhya Pradesh', type: 'state', code: 'MP' },
  { id: 'maharashtra', name: 'Maharashtra', type: 'state', code: 'MH' },
  { id: 'manipur', name: 'Manipur', type: 'state', code: 'MN' },
  { id: 'meghalaya', name: 'Meghalaya', type: 'state', code: 'ML' },
  { id: 'mizoram', name: 'Mizoram', type: 'state', code: 'MZ' },
  { id: 'nagaland', name: 'Nagaland', type: 'state', code: 'NL' },
  { id: 'odisha', name: 'Odisha', type: 'state', code: 'OD' },
  { id: 'punjab', name: 'Punjab', type: 'state', code: 'PB' },
  { id: 'rajasthan', name: 'Rajasthan', type: 'state', code: 'RJ' },
  { id: 'sikkim', name: 'Sikkim', type: 'state', code: 'SK' },
  { id: 'tamil-nadu', name: 'Tamil Nadu', type: 'state', code: 'TN' },
  { id: 'telangana', name: 'Telangana', type: 'state', code: 'TG' },
  { id: 'tripura', name: 'Tripura', type: 'state', code: 'TR' },
  { id: 'uttar-pradesh', name: 'Uttar Pradesh', type: 'state', code: 'UP' },
  { id: 'uttarakhand', name: 'Uttarakhand', type: 'state', code: 'UK' },
  { id: 'west-bengal', name: 'West Bengal', type: 'state', code: 'WB' },
];

export const UNION_TERRITORIES: JurisdictionItem[] = [
  { id: 'andaman-nicobar', name: 'Andaman and Nicobar Islands', type: 'ut', code: 'AN' },
  { id: 'chandigarh', name: 'Chandigarh', type: 'ut', code: 'CH' },
  { id: 'dadra-nagar-haveli-daman-diu', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'ut', code: 'DN' },
  { id: 'delhi', name: 'Delhi (NCT)', type: 'ut', code: 'DL' },
  { id: 'jammu-kashmir', name: 'Jammu and Kashmir', type: 'ut', code: 'JK' },
  { id: 'ladakh', name: 'Ladakh', type: 'ut', code: 'LA' },
  { id: 'lakshadweep', name: 'Lakshadweep', type: 'ut', code: 'LD' },
  { id: 'puducherry', name: 'Puducherry', type: 'ut', code: 'PY' },
];

export const ALL_JURISDICTIONS: JurisdictionItem[] = [
  PAN_INDIA_OPTION,
  ...INDIAN_STATES,
  ...UNION_TERRITORIES,
];
