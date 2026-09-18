import React from 'react';
import { AkiraQuLogo, AkiraQuLogoProps } from './AkiraQuLogo';

export type ImasBtcLogoProps = AkiraQuLogoProps;

export const ImasBtcLogo: React.FC<ImasBtcLogoProps> = (props) => {
  return <AkiraQuLogo {...props} />;
};

export default ImasBtcLogo;
